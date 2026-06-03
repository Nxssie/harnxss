import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const REPO = resolve(import.meta.dir, "../..");
const HOME = process.env.HOME!;
const NAN_API_KEY = process.env.NAN_API_KEY ?? "";

interface Model {
  id: string;
  name: string;
  contextWindow: number;
  maxTokens: number;
  reasoning: boolean;
  multimodal: boolean;
}

interface NaNConfig {
  baseUrl: string;
  models: Model[];
}

const config: NaNConfig = JSON.parse(
  readFileSync(resolve(REPO, "tools/nan/models.json"), "utf-8"),
);

// ── opencode ──────────────────────────────────────────────────────────────────
const opencodePath = resolve(REPO, "tools/opencode/opencode.json");
const opencode = JSON.parse(readFileSync(opencodePath, "utf-8"));
opencode.provider.nan.models = Object.fromEntries(
  config.models.map((m) => [m.id, { name: m.name }]),
);
writeFileSync(opencodePath, JSON.stringify(opencode, null, 2) + "\n");
console.log("  wrote   tools/opencode/opencode.json");

// ── pi extension ──────────────────────────────────────────────────────────────
const piModels = config.models
  .map(
    (m) =>
      `      {\n` +
      `        id: "${m.id}",\n` +
      `        name: "${m.name}",\n` +
      `        reasoning: ${m.reasoning},\n` +
      `        input: ["text"${m.multimodal ? ', "image"' : ""}],\n` +
      `        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },\n` +
      `        contextWindow: ${m.contextWindow},\n` +
      `        maxTokens: ${m.maxTokens},\n` +
      `      }`,
  )
  .join(",\n");

const nanTs =
  `import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";\n` +
  `\n` +
  `export default function (pi: ExtensionAPI) {\n` +
  `  pi.registerProvider("nan", {\n` +
  `    name: "NaN",\n` +
  `    baseUrl: "${config.baseUrl}",\n` +
  `    apiKey: process.env.NAN_API_KEY ?? "",\n` +
  `    api: "openai-completions",\n` +
  `    models: [\n` +
  `${piModels},\n` +
  `    ],\n` +
  `  });\n` +
  `}\n`;

writeFileSync(resolve(REPO, "tools/pi/extensions/nan.ts"), nanTs);
console.log("  wrote   tools/pi/extensions/nan.ts");

// ── factory ───────────────────────────────────────────────────────────────────
const factoryPath = resolve(HOME, ".factory/settings.json");
try {
  const factory = JSON.parse(readFileSync(factoryPath, "utf-8"));
  factory.customModels = config.models.map((m) => ({
    model: m.id,
    provider: "openai",
    baseUrl: config.baseUrl,
    ...(NAN_API_KEY && { apiKey: NAN_API_KEY }),
    displayName: m.name,
    maxContextLimit: m.contextWindow,
    maxOutputTokens: m.maxTokens,
  }));
  writeFileSync(factoryPath, JSON.stringify(factory, null, 2) + "\n");
  console.log("  wrote   ~/.factory/settings.json");
} catch {
  console.log("  skip    ~/.factory/settings.json (not found)");
}
