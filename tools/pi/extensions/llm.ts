import type {
  ExtensionAPI,
  ProviderModelConfig,
} from "@earendil-works/pi-coding-agent";

const BASE_URL = "https://llm.nxssie.dev/v1";

// Unsubscribed as of 2026-08-16 — remove this entry once the subscription
// actually lapses (it was kept active past that date only via the override
// this comment used to guard; there's no more dynamic filtering to gate it).
const NAN_SUBSCRIPTION_ENTRY = "nan-deepseek-v4-flash-0731";

// Full model list, curated by hand instead of fetched from the gateway at
// call time: pi-acp spawns a fresh `pi --mode rpc` per ACP session and asks
// for available models immediately — a live `fetch(${BASE_URL}/models)` here
// loses that race almost every time (confirmed: ~4-6s to resolve on this
// gateway/host), and pi-acp treats an empty list as "not authenticated" and
// fails the session before the fetch ever gets a chance to finish. Returning
// this list synchronously removes the race entirely, at the cost of no
// longer auto-discovering models newly added to the gateway — add them here
// by hand instead.
const MODELS: Record<string, Partial<ProviderModelConfig>> = {
  [NAN_SUBSCRIPTION_ENTRY]: {
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
  return Object.entries(MODELS).map(([id, meta]): ProviderModelConfig => ({
    id,
    name: id,
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128_000,
    maxTokens: 8_192,
    ...meta,
  }));
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
