import type {
  ExtensionAPI,
  ProviderModelConfig,
} from "@earendil-works/pi-coding-agent";

const BASE_URL = "https://llm.nxssie.dev/v1";

// The catalog fetch only ever runs when pi explicitly grants network access
// (see networkAllowed below), but it still must never hang indefinitely.
const REFRESH_TIMEOUT_MS = 5_000;

const DEFAULTS = {
  reasoning: false,
  input: ["text"],
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  contextWindow: 128_000,
  maxTokens: 8_192,
} satisfies Partial<ProviderModelConfig>;

// Per-model metadata. Doubles as the offline seed catalog, so every id the
// gateway is expected to route needs an entry here; anything it lists without
// one falls back to DEFAULTS.
const METADATA: Record<string, Partial<ProviderModelConfig>> = {
  "opencode-go-glm-5.2": {
    name: "GLM 5.2",
    reasoning: true,
    contextWindow: 1_000_000,
    maxTokens: 131_072,
  },
  "opencode-go-kimi-k3": {
    name: "Kimi K3",
    reasoning: true,
    contextWindow: 1000000,
    maxTokens: 131_072,
  },
  "opencode-go-qwen3.8-max": {
    name: "Qwen 3.8 Max",
  },
  "opencode-go-deepseek-v4-flash": {
    name: "DeepSeek V4 Flash",
    reasoning: true,
    contextWindow: 1_048_576,
    maxTokens: 384000,
    reasoningEffortMap: {
      "minimal": "high",
      "low": "high",
      "medium": "high",
      "high": "high",
      "xhigh": "max"
    }
  },
};

function toModel(id: string): ProviderModelConfig {
  return { id, name: id, ...DEFAULTS, ...METADATA[id] };
}

// The gateway routes inference fine even when /models is unreachable, so the
// picker must never end up empty on a transient catalog failure: an empty
// provider surfaces as "No models available", which reads like a login problem
// and hides the actual cause (missing key, gateway down, no network yet).
const SEED_MODELS: ProviderModelConfig[] = Object.keys(METADATA).map(toModel);

// Structural subset of pi-ai's RefreshModelsContext (not re-exported by
// pi-coding-agent).
interface RefreshContext {
  /** Effective credential resolved by pi (auth.json entry, else the env var). */
  credential?: Readonly<{ type: string; key?: string }>;
  /** Provider-scoped catalog snapshot persisted in models-store.json. */
  stored?: Readonly<{ models?: readonly ProviderModelConfig[] }>;
  /** Generation-checked persistence; `persist: null` drops the snapshot. */
  publish(publication: {
    persist?: { models: readonly ProviderModelConfig[]; checkedAt?: number } | null;
  }): Promise<boolean>;
  /** False during offline/cache-only initialization. */
  allowNetwork: boolean;
  signal: AbortSignal;
}

// pi only passes allowNetwork: true from `pi update`; every other session
// start (including the pi-acp `pi --mode rpc` spawn that loses the race
// against a live fetch, see the seed-catalog comment above) refreshes in
// cache-only mode. Only fetch live when pi explicitly grants it — never on
// ordinary startup — so the static SEED_MODELS/cached catalog is what
// pi-acp always gets immediately.
function networkAllowed(context: RefreshContext): boolean {
  return context.allowNetwork;
}

async function refreshModels(context: RefreshContext): Promise<ProviderModelConfig[]> {
  const cached = context.stored?.models;
  const fallback = (): ProviderModelConfig[] =>
    cached?.length ? cached.map((model) => ({ ...model })) : SEED_MODELS;

  if (!networkAllowed(context)) return fallback();

  try {
    // Prefer pi's resolved credential (auth.json, chmod 600) so catalog refresh
    // works in non-interactive shells, where the env var is not exported.
    const apiKey = context.credential?.key ?? process.env.NX_LLM_GATEWAY_KEY ?? "";
    const res = await fetch(`${BASE_URL}/models`, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      signal: AbortSignal.any([context.signal, AbortSignal.timeout(REFRESH_TIMEOUT_MS)]),
    });
    if (!res.ok) {
      throw new Error(`gateway /models returned ${res.status} ${res.statusText}`);
    }
    const body = (await res.json()) as { data: { id: string }[] };
    const models = body.data.map(({ id }) => id).map(toModel);
    if (models.length === 0) return fallback();

    await context.publish({ persist: { models, checkedAt: Date.now() } });
    return models;
  } catch {
    // 401 (key missing from the environment), DNS, gateway downtime, timeout:
    // keep the last known catalog so the session still starts and fails loudly
    // on the actual request instead of silently offering nothing.
    return fallback();
  }
}

export default function (pi: ExtensionAPI) {
  pi.registerProvider("llm", {
    name: "LLM Gateway",
    baseUrl: BASE_URL,
    // Interpolated lazily by pi and only used when auth.json has no "llm"
    // credential. Naming the variable (instead of inlining an empty string)
    // lets `pi auth check` report the provider as unconfigured when it is unset,
    // rather than silently sending an empty bearer token.
    apiKey: "$NX_LLM_GATEWAY_KEY",
    api: "openai-completions",
    models: SEED_MODELS,
    refreshModels,
  });

  // The gateway is the only inference path — drop pi's built-in OpenCode Zen
  // connector so its models don't show up alongside the gateway's in the picker.
  pi.unregisterProvider("opencode-go");
}
