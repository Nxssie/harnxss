import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { AgentMessage, ThinkingLevel } from "@earendil-works/pi-agent-core";
import type { Api, AssistantMessage, Model, TextContent } from "@earendil-works/pi-ai";
import { CONFIG_DIR_NAME, getAgentDir, isToolCallEventType } from "@earendil-works/pi-coding-agent";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const MARK_DONE_TOOL = "pe_mark_done";

// Big model plans (read-only exploration), small model executes (full tool access).
// Model pair is user-configured via /pe-models — never hardcoded, since gateway
// catalogs and model ids change over time (see tools/llm/models.json).

interface ModelRef {
  provider: string;
  id: string;
}

interface PlannerExecutorConfig {
  planner?: ModelRef;
  executor?: ModelRef;
}

interface TodoItem {
  step: number;
  text: string;
  completed: boolean;
}

type Phase = "idle" | "planning" | "reviewing" | "executing";

interface OriginalState {
  model: Model<Api> | undefined;
  thinkingLevel: ThinkingLevel;
  tools: string[];
}

interface PersistedState {
  phase: Phase;
  todos: TodoItem[];
  originalModel?: ModelRef;
  originalThinkingLevel?: ThinkingLevel;
  originalTools?: string[];
}

const GLOBAL_CONFIG_PATH = join(getAgentDir(), "planner-executor.json");

function readJson<T>(path: string): T | undefined {
  if (!existsSync(path)) return undefined;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    return undefined;
  }
}

function loadConfig(cwd: string): PlannerExecutorConfig {
  const projectPath = join(cwd, CONFIG_DIR_NAME, "planner-executor.json");
  return {
    ...readJson<PlannerExecutorConfig>(GLOBAL_CONFIG_PATH),
    ...readJson<PlannerExecutorConfig>(projectPath),
  };
}

function saveGlobalConfig(config: PlannerExecutorConfig): void {
  mkdirSync(dirname(GLOBAL_CONFIG_PATH), { recursive: true });
  writeFileSync(GLOBAL_CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`);
}

// Best-effort guard for the planning phase, not a sandbox — the model is trusted,
// this just keeps it from jumping ahead of the executor while it explores.
const MUTATING_BASH_WORDS = new Set([
  "rm", "mv", "cp", "mkdir", "rmdir", "touch", "chmod", "chown", "sudo",
  "kill", "pkill", "reboot", "shutdown", "dd", "truncate", "vim", "vi", "nano",
]);
const MUTATING_BASH_PATTERNS = [
  /\bnpm\s+(install|i\b|uninstall|ci)\b/i,
  /\b(yarn|pnpm|bun)\s+(add|remove|install)\b/i,
  /\bpip3?\s+install\b/i,
  /\bgit\s+(add|commit|push|reset|checkout|merge|rebase|stash|clean|apply)\b/i,
  /(?<!\d)>{1,2}(?!&)/,
];

function isReadOnlyBashCommand(command: string): boolean {
  const words = command.split(/[\s;|&]+/).filter(Boolean);
  if (words.some((w) => MUTATING_BASH_WORDS.has(w))) return false;
  return !MUTATING_BASH_PATTERNS.some((re) => re.test(command));
}

function isAssistantMessage(m: AgentMessage): m is AssistantMessage {
  return m.role === "assistant" && Array.isArray(m.content);
}

function getTextContent(message: AssistantMessage): string {
  return message.content
    .filter((block): block is TextContent => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

function extractPlanSteps(text: string): TodoItem[] {
  const match = text.match(/Plan:\s*\n([\s\S]+)/i);
  const body = match ? match[1] : text;
  const items: TodoItem[] = [];
  const lineRe = /^\s*(\d+)[.)]\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = lineRe.exec(body)) !== null) {
    items.push({ step: Number(m[1]), text: m[2].trim(), completed: false });
  }
  return items;
}

function uniq(names: string[]): string[] {
  return [...new Set(names)];
}

function modelLabel(m: Model<Api> | ModelRef): string {
  return `${m.provider}/${m.id}`;
}

export default function plannerExecutorExtension(pi: ExtensionAPI): void {
  let config: PlannerExecutorConfig = {};
  let phase: Phase = "idle";
  let todos: TodoItem[] = [];
  let original: OriginalState | undefined;

  function persist(): void {
    pi.appendEntry("planner-executor-state", {
      phase,
      todos,
      originalModel: original?.model ? { provider: original.model.provider, id: original.model.id } : undefined,
      originalThinkingLevel: original?.thinkingLevel,
      originalTools: original?.tools,
    } satisfies PersistedState);
  }

  function updateStatus(ctx: ExtensionContext): void {
    if (phase === "planning" || phase === "reviewing") {
      ctx.ui.setStatus("planner-executor", ctx.ui.theme.fg("accent", `📐 planning (${config.planner ? modelLabel(config.planner) : "?"})`));
    } else if (phase === "executing") {
      const done = todos.filter((t) => t.completed).length;
      ctx.ui.setStatus("planner-executor", ctx.ui.theme.fg("accent", `⚙ ${done}/${todos.length} (${config.executor ? modelLabel(config.executor) : "?"})`));
    } else {
      ctx.ui.setStatus("planner-executor", undefined);
    }

    if (phase === "executing" && todos.length > 0) {
      const lines = todos.map((t) =>
        t.completed
          ? ctx.ui.theme.fg("success", `☑ ${ctx.ui.theme.strikethrough(t.text)}`)
          : `${ctx.ui.theme.fg("muted", "☐ ")}${t.text}`,
      );
      ctx.ui.setWidget("planner-executor", lines);
    } else {
      ctx.ui.setWidget("planner-executor", undefined);
    }
  }

  async function resetToOriginal(ctx: ExtensionContext): Promise<void> {
    if (original) {
      if (original.model) await pi.setModel(original.model);
      pi.setThinkingLevel(original.thinkingLevel);
      pi.setActiveTools(original.tools);
    }
    phase = "idle";
    todos = [];
    original = undefined;
    updateStatus(ctx);
    persist();
  }

  function resolveModelRef(ctx: ExtensionContext, ref: ModelRef | undefined, role: string): Model<Api> | undefined {
    if (!ref) {
      ctx.ui.notify(`No ${role} model configured. Run /pe-models first.`, "error");
      return undefined;
    }
    const model = ctx.modelRegistry.find(ref.provider, ref.id);
    if (!model) {
      ctx.ui.notify(`${role} model ${modelLabel(ref)} not found. Run /pe-models to reconfigure.`, "error");
      return undefined;
    }
    return model;
  }

  async function pickModel(ctx: ExtensionContext, title: string): Promise<ModelRef | undefined> {
    const available = [...ctx.modelRegistry.getAvailable()].sort((a, b) => modelLabel(a).localeCompare(modelLabel(b)));
    if (available.length === 0) {
      ctx.ui.notify("No models available (check auth)", "error");
      return undefined;
    }
    const byLabel = new Map(available.map((m) => [modelLabel(m), m]));
    const choice = await ctx.ui.select(title, [...byLabel.keys()]);
    if (!choice) return undefined;
    const model = byLabel.get(choice);
    return model ? { provider: model.provider, id: model.id } : undefined;
  }

  async function ensureConfig(ctx: ExtensionContext): Promise<boolean> {
    if (config.planner && config.executor) return true;
    ctx.ui.notify("Planner-Executor: pick the models to use (saved for next time)", "info");
    if (!config.planner) {
      const planner = await pickModel(ctx, "Planner model (big — writes the plan):");
      if (!planner) return false;
      config.planner = planner;
    }
    if (!config.executor) {
      const executor = await pickModel(ctx, "Executor model (small — runs the plan):");
      if (!executor) return false;
      config.executor = executor;
    }
    saveGlobalConfig(config);
    return true;
  }

  pi.registerTool({
    name: MARK_DONE_TOOL,
    label: "Mark Plan Step Done",
    description:
      "Mark one or more planner-executor plan steps as completed. Call this immediately after finishing each step — do not just describe completion in text.",
    promptSnippet: "Mark plan steps complete as you finish them",
    promptGuidelines: [`Call ${MARK_DONE_TOOL} with the step number(s) right after finishing each plan step — do not just narrate completion.`],
    parameters: Type.Object({
      steps: Type.Array(Type.Integer(), { description: "1-based step numbers that are now complete" }),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      let marked = 0;
      for (const step of params.steps) {
        const todo = todos.find((t) => t.step === step && !t.completed);
        if (todo) {
          todo.completed = true;
          marked++;
        }
      }
      updateStatus(ctx);
      persist();
      const remaining = todos.filter((t) => !t.completed).length;
      return {
        content: [{
          type: "text",
          text: marked > 0 ? `Marked ${marked} step(s) done. ${remaining} remaining.` : "No matching pending steps.",
        }],
        details: { marked, remaining },
      };
    },
  });

  async function startPlanning(args: string, ctx: ExtensionContext): Promise<void> {
    if (!ctx.hasUI) {
      ctx.ui.notify("planner-executor requires interactive or RPC mode", "error");
      return;
    }
    if (phase !== "idle") {
      ctx.ui.notify(`Already running (phase: ${phase}). Use /pe-cancel to abort.`, "warning");
      return;
    }
    const goal = args.trim();
    if (!goal) {
      ctx.ui.notify("Usage: /planner-executor <task description>", "error");
      return;
    }
    if (!(await ensureConfig(ctx))) return;

    const planner = resolveModelRef(ctx, config.planner, "planner");
    if (!planner) return;

    const snapshot: OriginalState = {
      model: ctx.model,
      thinkingLevel: pi.getThinkingLevel(),
      tools: pi.getActiveTools(),
    };

    if (!(await pi.setModel(planner))) {
      ctx.ui.notify(`No API key for planner model ${modelLabel(planner)}`, "error");
      return;
    }
    original = snapshot;

    todos = [];
    phase = "planning";
    pi.setActiveTools(uniq([
      ...original.tools.filter((t) => t !== "edit" && t !== "write"),
      "read", "bash", "grep", "find", "ls",
    ]));
    updateStatus(ctx);
    persist();
    pi.sendUserMessage(goal);
  }

  pi.registerCommand("planner-executor", {
    description: "Plan with a big model, execute the plan with a small model",
    handler: startPlanning,
  });

  pi.registerCommand("pe", {
    description: "Alias for /planner-executor",
    handler: startPlanning,
  });

  pi.registerCommand("pe-models", {
    description: "Configure the planner (big) and executor (small) models",
    handler: async (_args, ctx) => {
      if (!ctx.hasUI) {
        ctx.ui.notify("Requires interactive or RPC mode", "error");
        return;
      }
      const planner = await pickModel(ctx, "Planner model (big — writes the plan):");
      if (!planner) return;
      const executor = await pickModel(ctx, "Executor model (small — runs the plan):");
      if (!executor) return;
      config = { planner, executor };
      saveGlobalConfig(config);
      ctx.ui.notify(`Planner: ${modelLabel(planner)} · Executor: ${modelLabel(executor)} (saved to ${GLOBAL_CONFIG_PATH})`, "info");
    },
  });

  pi.registerCommand("pe-status", {
    description: "Show planner-executor progress",
    handler: async (_args, ctx) => {
      if (phase === "idle") {
        ctx.ui.notify("Planner-Executor is idle", "info");
        return;
      }
      const list = todos.map((t, i) => `${i + 1}. ${t.completed ? "✓" : "○"} ${t.text}`).join("\n") || "(no plan yet)";
      ctx.ui.notify(`Phase: ${phase}\n${list}`, "info");
    },
  });

  pi.registerCommand("pe-cancel", {
    description: "Cancel the current planner-executor run and restore the original model",
    handler: async (_args, ctx) => {
      if (phase === "idle") {
        ctx.ui.notify("Planner-Executor is not running", "info");
        return;
      }
      await resetToOriginal(ctx);
      ctx.ui.notify("Planner-Executor cancelled, original model restored", "info");
    },
  });

  pi.on("tool_call", async (event) => {
    if (phase !== "planning") return;
    if (!isToolCallEventType("bash", event)) return;
    if (!isReadOnlyBashCommand(event.input.command)) {
      return {
        block: true,
        reason: `Planner-Executor: planning phase is read-only, this command looks mutating.\nCommand: ${event.input.command}`,
      };
    }
  });

  pi.on("context", async (event) => {
    return {
      messages: event.messages.filter((m) => {
        const customType = (m as AgentMessage & { customType?: string }).customType;
        if (customType === "pe-planning-context" && phase !== "planning" && phase !== "reviewing") return false;
        if (customType === "pe-execution-context" && phase !== "executing") return false;
        return true;
      }),
    };
  });

  pi.on("before_agent_start", async () => {
    if (phase === "planning" || phase === "reviewing") {
      return {
        message: {
          customType: "pe-planning-context",
          content: `[PLANNER-EXECUTOR: PLANNING PHASE — running on ${config.planner ? modelLabel(config.planner) : "?"}]
You are the PLANNER in a planner/executor workflow. A separate, smaller model will execute your plan afterwards with full file-write access — you will not implement anything yourself in this phase.

Restrictions:
- edit/write tools are disabled here
- bash is restricted to non-mutating commands

Explore the codebase thoroughly (read, grep, find, bash) before proposing changes. The executor cannot ask you follow-up questions, so make the plan self-contained: exact file paths, what to change, and how to verify each step.

End your response with a numbered plan under a "Plan:" header:

Plan:
1. First step
2. Second step
...`,
          display: false,
        },
      };
    }

    if (phase === "executing" && todos.length > 0) {
      const remaining = todos.filter((t) => !t.completed);
      const list = remaining.map((t) => `${t.step}. ${t.text}`).join("\n");
      return {
        message: {
          customType: "pe-execution-context",
          content: `[PLANNER-EXECUTOR: EXECUTION PHASE — running on ${config.executor ? modelLabel(config.executor) : "?"}]
Follow this plan exactly; do not re-plan or change its intent.

Remaining steps:
${list}

Call ${MARK_DONE_TOOL} with the step number(s) as soon as you finish them. If a step is unclear or fails, stop and report instead of improvising.`,
          display: false,
        },
      };
    }
  });

  pi.on("agent_end", async (event, ctx) => {
    if (phase === "executing") {
      if (todos.length > 0 && todos.every((t) => t.completed)) {
        pi.sendMessage(
          { customType: "pe-complete", content: "**Planner-Executor: plan complete.**", display: true },
          { triggerTurn: false },
        );
        await resetToOriginal(ctx);
      }
      return;
    }

    if (phase !== "planning" || !ctx.hasUI) return;

    const lastAssistant = [...event.messages].reverse().find(isAssistantMessage);
    if (!lastAssistant) return;
    const extracted = extractPlanSteps(getTextContent(lastAssistant));
    if (extracted.length === 0) return;

    todos = extracted;
    phase = "reviewing";
    persist();

    const list = todos.map((t, i) => `${i + 1}. ☐ ${t.text}`).join("\n");
    const planMessage = { customType: "pe-plan", content: `**Plan (${todos.length} steps):**\n\n${list}`, display: true };

    const choice = await ctx.ui.select(`Execute with ${config.executor ? modelLabel(config.executor) : "?"}?`, [
      "Execute the plan",
      "Keep planning (refine)",
      "Cancel",
    ]);

    if (choice === "Execute the plan") {
      const executor = resolveModelRef(ctx, config.executor, "executor");
      if (!executor) {
        phase = "planning";
        persist();
        return;
      }
      if (!(await pi.setModel(executor))) {
        ctx.ui.notify(`No API key for executor model ${modelLabel(executor)}`, "error");
        phase = "planning";
        persist();
        return;
      }
      phase = "executing";
      pi.setActiveTools(uniq([...(original?.tools ?? pi.getActiveTools()), "edit", "write", MARK_DONE_TOOL]));
      updateStatus(ctx);
      persist();
      pi.sendMessage(planMessage, { deliverAs: "followUp" });
      pi.sendMessage(
        { customType: "pe-execute-kickoff", content: "Execute the plan.", display: true },
        { triggerTurn: true, deliverAs: "followUp" },
      );
    } else if (choice === "Keep planning (refine)") {
      phase = "planning";
      persist();
    } else {
      await resetToOriginal(ctx);
      ctx.ui.notify("Planner-Executor cancelled, original model restored", "info");
    }
  });

  pi.on("session_start", async (_event, ctx) => {
    config = loadConfig(ctx.cwd);

    const entries = ctx.sessionManager.getEntries();
    const stateEntry = entries
      .filter((e: { type: string; customType?: string }) => e.type === "custom" && e.customType === "planner-executor-state")
      .pop() as { data?: PersistedState } | undefined;

    if (stateEntry?.data) {
      phase = stateEntry.data.phase;
      todos = stateEntry.data.todos ?? [];
      if (stateEntry.data.originalModel) {
        original = {
          model: ctx.modelRegistry.find(stateEntry.data.originalModel.provider, stateEntry.data.originalModel.id),
          thinkingLevel: stateEntry.data.originalThinkingLevel ?? pi.getThinkingLevel(),
          tools: stateEntry.data.originalTools ?? pi.getActiveTools(),
        };
      }
    }

    updateStatus(ctx);
  });
}
