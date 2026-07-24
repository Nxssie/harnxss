import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerProvider("nan", {
    name: "NaN",
    baseUrl: "https://llm.nxssie.dev/v1",
    apiKey: process.env.NX_LLM_GATEWAY_KEY ?? "",
    api: "openai-completions",
    models: [
      {
        id: "nan-qwen3.6",
        name: "Qwen 3.6 35B A3B",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 262144,
        maxTokens: 16384,
      },
      {
        id: "nan-gemma4",
        name: "Gemma 4 26B A4B",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 262144,
        maxTokens: 16384,
      },
      {
        id: "nan-deepseek-v4-flash",
        name: "DeepSeek V4 Flash 284B A13B",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 262144,
        maxTokens: 16384,
      },
      {
        id: "nan-mimo-v2.5",
        name: "Xiaomi MiMo V2.5 310B A15B",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 524288,
        maxTokens: 32768,
      },
    ],
  });
}
