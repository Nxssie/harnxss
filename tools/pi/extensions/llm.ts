import type {
  ExtensionAPI,
  ProviderModelConfig,
} from "@earendil-works/pi-coding-agent";

const BASE_URL = "https://llm.nxssie.dev/v1";

// Optional per-model metadata; anything the gateway lists without an entry
// here falls back to conservative defaults below.
const METADATA: Record<string, Partial<ProviderModelConfig>> = {
  "nan-qwen3.6": { name: "Qwen 3.6 35B A3B", contextWindow: 262144, maxTokens: 16384 },
  "nan-gemma4": { name: "Gemma 4 26B A4B", contextWindow: 262144, maxTokens: 16384 },
  "nan-deepseek-v4-flash": {
    name: "DeepSeek V4 Flash 284B A13B",
    contextWindow: 262144,
    maxTokens: 16384,
  },
  "nan-mimo-v2.5": {
    name: "Xiaomi MiMo V2.5 310B A15B",
    contextWindow: 524288,
    maxTokens: 32768,
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
    contextWindow: 1_048_576,
    maxTokens: 131_072,
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
  return body.data.map(({ id }): ProviderModelConfig => {
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
