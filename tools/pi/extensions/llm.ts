import type {
  ExtensionAPI,
  ProviderModelConfig,
} from "@earendil-works/pi-coding-agent";

const BASE_URL = "https://llm.nxssie.dev/v1";

// Unsubscribed but kept for a possible future resubscription — the gateway still
// lists these ids with dead routes, so keep them out of the picker until then.
const DISABLED_PREFIXES = ["nan-"];

// Exceptions to DISABLED_PREFIXES — kept active while the nan subscription
// runs (through 2026-08-16).
const ENABLED_OVERRIDES = ["nan-deepseek-v4-flash-0731"];

// Optional per-model metadata; anything the gateway lists without an entry
// here falls back to conservative defaults below.
const METADATA: Record<string, Partial<ProviderModelConfig>> = {
  "nan-deepseek-v4-flash-0731": {
    name: "DeepSeek V4 Flash 284B A13B",
    contextWindow: 262144,
    maxTokens: 16384,
  },
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

async function refreshModels(): Promise<ProviderModelConfig[]> {
  const apiKey = process.env.NX_LLM_GATEWAY_KEY ?? "";
  const res = await fetch(`${BASE_URL}/models`, {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
  });
  if (!res.ok) {
    throw new Error(`gateway /models returned ${res.status} ${res.statusText}`);
  }
  const body = (await res.json()) as { data: { id: string }[] };
  return body.data
    .filter(
      ({ id }) => ENABLED_OVERRIDES.includes(id) || !DISABLED_PREFIXES.some((p) => id.startsWith(p)),
    )
    .map(({ id }): ProviderModelConfig => {
      const meta = METADATA[id] ?? {};
      return {
        id,
        name: id,
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128_000,
        maxTokens: 8_192,
        ...meta,
      };
    });
}

export default function (pi: ExtensionAPI) {
  pi.registerProvider("llm", {
    name: "LLM Gateway",
    baseUrl: BASE_URL,
    apiKey: process.env.NX_LLM_GATEWAY_KEY ?? "",
    api: "openai-completions",
    refreshModels,
  });

  // The gateway is the only inference path — drop pi's built-in OpenCode Zen
  // connector so its models don't show up alongside the gateway's in the picker.
  pi.unregisterProvider("opencode-go");
}
