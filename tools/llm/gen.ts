import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const REPO = resolve(import.meta.dir, "../..");
const HOME = process.env.HOME!;
const GATEWAY_API_KEY = process.env.NX_LLM_GATEWAY_KEY ?? "";

interface ModelOverride {
  name?: string;
  contextWindow?: number;
  maxTokens?: number;
  reasoning?: boolean;
  multimodal?: boolean;
}

interface GatewayConfig {
  baseUrl: string;
  disabledPrefixes?: string[];
  enabledOverrides?: string[];
  overrides: Record<string, ModelOverride>;
}

interface Model {
  id: string;
  name: string;
  contextWindow: number;
  maxTokens: number;
  reasoning: boolean;
  multimodal: boolean;
}

const DEFAULTS = {
  contextWindow: 128_000,
  maxTokens: 8_192,
  reasoning: false,
  multimodal: false,
};

const config: GatewayConfig = JSON.parse(
  readFileSync(resolve(REPO, "tools/llm/models.json"), "utf-8"),
);

// ── discover models live from the gateway (single source of truth) ──────────
async function fetchModelIds(): Promise<string[]> {
  const res = await fetch(`${config.baseUrl}/models`, {
    headers: GATEWAY_API_KEY ? { Authorization: `Bearer ${GATEWAY_API_KEY}` } : {},
  });
  if (!res.ok) {
    throw new Error(
      `gateway /models returned ${res.status} ${res.statusText} — is NX_LLM_GATEWAY_KEY set?`,
    );
  }
  const body = (await res.json()) as { data: { id: string }[] };
  return body.data.map((m) => m.id).sort();
}

const disabledPrefixes = config.disabledPrefixes ?? [];
const enabledOverrides = config.enabledOverrides ?? [];
const allIds = await fetchModelIds();
const ids = allIds.filter(
  (id) => enabledOverrides.includes(id) || !disabledPrefixes.some((p) => id.startsWith(p)),
);
const skipped = allIds.length - ids.length;
if (skipped > 0) {
  console.log(`  skip     ${skipped} disabled model(s) (prefixes: ${disabledPrefixes.join(", ")})`);
}
const models: Model[] = ids.map((id) => {
  const o = config.overrides[id] ?? {};
  return {
    id,
    name: o.name ?? id,
    contextWindow: o.contextWindow ?? DEFAULTS.contextWindow,
    maxTokens: o.maxTokens ?? DEFAULTS.maxTokens,
    reasoning: o.reasoning ?? DEFAULTS.reasoning,
    multimodal: o.multimodal ?? DEFAULTS.multimodal,
  };
});
console.log(`  fetched  ${models.length} models from ${config.baseUrl}/models`);

// ── opencode ──────────────────────────────────────────────────────────────────
const opencodePath = resolve(REPO, "tools/opencode/opencode.json");
const opencode = JSON.parse(readFileSync(opencodePath, "utf-8"));
opencode.provider.llm.models = Object.fromEntries(
  models.map((m) => [m.id, { name: m.name }]),
);
opencode.provider.llm.options.baseURL = config.baseUrl;
writeFileSync(opencodePath, JSON.stringify(opencode, null, 2) + "\n");
console.log("  wrote   tools/opencode/opencode.json");

// ── codex ─────────────────────────────────────────────────────────────────────
// Codex has no model-discovery hook (confirmed: no /models call, `-m` is a
// free-text flag), so we generate one profile per gateway model instead of a
// single hardcoded default — `codex -p <model-id>` switches with zero config.
const codexPath = resolve(REPO, "tools/codex/config.toml");
const profiles = models
  .map((m) => `[profiles.${m.id}]\nmodel = "${m.id}"\nmodel_provider = "llm"\n`)
  .join("\n");
const codexToml =
  `#:schema https://developers.openai.com/codex/config-schema.json\n\n` +
  `model_provider = "llm"\n` +
  `model = "${models[0]?.id ?? ""}"\n\n` +
  `[model_providers.llm]\n` +
  `name = "LLM Gateway"\n` +
  `base_url = "${config.baseUrl}"\n` +
  `env_key = "NX_LLM_GATEWAY_KEY"\n` +
  `wire_api = "chat"\n\n` +
  `${profiles}`;
writeFileSync(codexPath, codexToml);
console.log("  wrote   tools/codex/config.toml");

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
