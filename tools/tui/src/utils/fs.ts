import { existsSync } from 'fs'
import { homedir } from 'os'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const HOME = homedir()
export const REPO_ROOT = join(__dirname, '../../../..')
export const SECRETS_FILE = join(HOME, '.config/fish/conf.d/secrets.fish')
export const MODELS_FILE = join(REPO_ROOT, 'tools/llm/models.json')
export const GEN_SCRIPT = join(REPO_ROOT, 'tools/llm/gen.ts')
export const INSTALL_SCRIPT = join(REPO_ROOT, 'install.sh')

export function getGatewayApiKey(): string {
  return process.env['NX_LLM_GATEWAY_KEY'] ?? ''
}

export function maskKey(key: string): string {
  if (!key) return '(not set)'
  return key.slice(0, 8) + '…' + key.slice(-4)
}

export async function readSecretsFile(): Promise<string> {
  try {
    return await Bun.file(SECRETS_FILE).text()
  } catch {
    return ''
  }
}

export async function updateGatewayApiKey(newKey: string): Promise<void> {
  const content = await readSecretsFile()
  const line = `set -gx NX_LLM_GATEWAY_KEY "${newKey}"`
  const updated = /set -gx NX_LLM_GATEWAY_KEY/.test(content)
    ? content.replace(/set -gx NX_LLM_GATEWAY_KEY "[^"]*"/, line)
    : content.trimEnd() + '\n' + line + '\n'
  await Bun.write(SECRETS_FILE, updated)
  process.env['NX_LLM_GATEWAY_KEY'] = newKey
}

export interface ModelOverride {
  name?: string
  contextWindow?: number
  maxTokens?: number
  reasoning?: boolean
  multimodal?: boolean
}

export interface GatewayConfig {
  baseUrl: string
  overrides: Record<string, ModelOverride>
}

export interface GatewayModel {
  id: string
  name: string
  contextWindow: number
  maxTokens: number
  reasoning: boolean
  multimodal: boolean
}

const MODEL_DEFAULTS = {
  contextWindow: 128_000,
  maxTokens: 8_192,
  reasoning: false,
  multimodal: false,
}

export async function readGatewayConfig(): Promise<GatewayConfig> {
  const text = await Bun.file(MODELS_FILE).text()
  return JSON.parse(text) as GatewayConfig
}

export async function writeGatewayConfig(config: GatewayConfig): Promise<void> {
  await Bun.write(MODELS_FILE, JSON.stringify(config, null, 2) + '\n')
}

/** Live model catalog, discovered from the gateway's `/models` and merged
 * with the local metadata overrides — mirrors `tools/llm/gen.ts`. */
export async function fetchGatewayModels(): Promise<{ baseUrl: string; models: GatewayModel[] }> {
  const config = await readGatewayConfig()
  const apiKey = getGatewayApiKey()
  const res = await fetch(`${config.baseUrl}/models`, {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
  })
  if (!res.ok) {
    throw new Error(`gateway /models returned ${res.status} ${res.statusText}`)
  }
  const body = (await res.json()) as { data: { id: string }[] }
  const models = body.data
    .map(m => m.id)
    .sort()
    .map((id): GatewayModel => {
      const o = config.overrides[id] ?? {}
      return {
        id,
        name: o.name ?? id,
        contextWindow: o.contextWindow ?? MODEL_DEFAULTS.contextWindow,
        maxTokens: o.maxTokens ?? MODEL_DEFAULTS.maxTokens,
        reasoning: o.reasoning ?? MODEL_DEFAULTS.reasoning,
        multimodal: o.multimodal ?? MODEL_DEFAULTS.multimodal,
      }
    })
  return { baseUrl: config.baseUrl, models }
}

export interface ToolStatus {
  id: string
  name: string
  installed: boolean
}

export function getToolStatuses(): ToolStatus[] {
  return [
    { id: 'claude',   name: 'Claude Code', installed: existsSync(join(HOME, '.claude')) },
    { id: 'opencode', name: 'OpenCode',    installed: existsSync(join(HOME, '.config/opencode')) },
    { id: 'pi',       name: 'Pi',          installed: existsSync(join(HOME, '.pi/agent')) },
    { id: 'gemini',   name: 'Gemini',      installed: existsSync(join(HOME, '.gemini')) },
    { id: 'codex',    name: 'Codex',       installed: existsSync(join(HOME, '.codex')) },
    { id: 'factory',  name: 'Factory',     installed: existsSync(join(HOME, '.factory')) },
    { id: 'mise',     name: 'Mise',        installed: existsSync(join(HOME, '.config/mise')) },
  ]
}
