import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const REPO = resolve(import.meta.dir, "../..");
const HOME = process.env.HOME!;
const GATEWAY_API_KEY = process.env.NX_LLM_GATEWAY_KEY ?? "";

interface GatewayConfig {
  baseUrl: string;
  disabledPrefixes?: string[];
  enabledOverrides?: string[];
}

interface Model {
  id: string;
  name: string;
  contextWindow: number;
  maxTokens: number;
  reasoning: boolean;
  multimodal: boolean;
}

interface ModelGroupInfo {
  model_group: string;
  max_input_tokens: number | null;
  max_output_tokens: number | null;
  supports_vision: boolean;
  supports_reasoning: boolean;
}

const DEFAULTS = {
  contextWindow: 128_000,
  maxTokens: 8_192,
};

const config: GatewayConfig = JSON.parse(
  readFileSync(resolve(REPO, "tools/llm/models.json"), "utf-8"),
);

// ── discover models live from the gateway (single source of truth) ──────────
// ai-gateway's LiteLLM proxy exposes full capability metadata (context window,
// max output tokens, vision/reasoning support) via its own /model_group/info —
// no ai-gateway-specific endpoint needed, any valid gateway API key can read
// it. Known providers get these fields from LiteLLM's built-in cost map
// automatically; custom/self-hosted models (e.g. OpenCode Go) only report
// accurate numbers once set by hand in ai-gateway's Models screen — otherwise
// they come back null and fall back to DEFAULTS below.
async function fetchModelGroups(): Promise<ModelGroupInfo[]> {
  const root = config.baseUrl.replace(/\/v1\/?$/, "");
  const res = await fetch(`${root}/model_group/info`, {
    headers: GATEWAY_API_KEY ? { Authorization: `Bearer ${GATEWAY_API_KEY}` } : {},
  });
  if (!res.ok) {
    throw new Error(
      `gateway /model_group/info returned ${res.status} ${res.statusText} — is NX_LLM_GATEWAY_KEY set?`,
    );
  }
  const body = (await res.json()) as { data: ModelGroupInfo[] };
  return body.data.sort((a, b) => a.model_group.localeCompare(b.model_group));
}

const disabledPrefixes = config.disabledPrefixes ?? [];
const enabledOverrides = config.enabledOverrides ?? [];
const allGroups = await fetchModelGroups();
const groups = allGroups.filter(
  (g) =>
    enabledOverrides.includes(g.model_group) ||
    !disabledPrefixes.some((p) => g.model_group.startsWith(p)),
);
const skipped = allGroups.length - groups.length;
if (skipped > 0) {
  console.log(`  skip     ${skipped} disabled model(s) (prefixes: ${disabledPrefixes.join(", ")})`);
}
const models: Model[] = groups.map((g) => ({
  id: g.model_group,
  name: g.model_group,
  contextWindow: g.max_input_tokens ?? DEFAULTS.contextWindow,
  maxTokens: g.max_output_tokens ?? DEFAULTS.maxTokens,
  reasoning: g.supports_reasoning,
  multimodal: g.supports_vision,
}));
console.log(`  fetched  ${models.length} models from ${config.baseUrl}/model_group/info`);

// ── opencode ──────────────────────────────────────────────────────────────────
const opencodePath = resolve(REPO, "tools/opencode/opencode.json");
const opencode = JSON.parse(readFileSync(opencodePath, "utf-8"));
opencode.provider.llm.models = Object.fromEntries(
  models.map((m) => [m.id, { name: m.name }]),
);
opencode.provider.llm.options.baseURL = config.baseUrl;
writeFileSync(opencodePath, JSON.stringify(opencode, null, 2) + "\n");
console.log("  wrote   tools/opencode/opencode.json");

// ── factory ───────────────────────────────────────────────────────────────────
const factoryPath = resolve(HOME, ".factory/settings.json");
try {
  const factory = JSON.parse(readFileSync(factoryPath, "utf-8"));
  factory.customModels = models.map((m) => ({
    model: m.id,
    provider: "openai",
    baseUrl: config.baseUrl,
    ...(GATEWAY_API_KEY && { apiKey: GATEWAY_API_KEY }),
    displayName: m.name,
    maxContextLimit: m.contextWindow,
    maxOutputTokens: m.maxTokens,
  }));
  writeFileSync(factoryPath, JSON.stringify(factory, null, 2) + "\n");
  console.log("  wrote   ~/.factory/settings.json");
} catch {
  console.log("  skip    ~/.factory/settings.json (not found)");
}
