import { existsSync } from 'fs'
import { homedir } from 'os'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const HOME = homedir()
export const REPO_ROOT = join(__dirname, '../../../..')
export const SECRETS_FILE = join(HOME, '.config/fish/conf.d/secrets.fish')
export const MODELS_FILE = join(REPO_ROOT, 'tools/nan/models.json')
export const GEN_SCRIPT = join(REPO_ROOT, 'tools/nan/gen.ts')
export const INSTALL_SCRIPT = join(REPO_ROOT, 'install.sh')

export function getNanApiKey(): string {
  return process.env['NAN_API_KEY'] ?? ''
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

export async function updateNanApiKey(newKey: string): Promise<void> {
  const content = await readSecretsFile()
  const line = `set -gx NAN_API_KEY "${newKey}"`
  const updated = /set -gx NAN_API_KEY/.test(content)
    ? content.replace(/set -gx NAN_API_KEY "[^"]*"/, line)
    : content.trimEnd() + '\n' + line + '\n'
  await Bun.write(SECRETS_FILE, updated)
  process.env['NAN_API_KEY'] = newKey
}

export interface NaNModel {
  id: string
  name: string
  contextWindow: number
  maxTokens: number
  reasoning?: boolean
  multimodal?: boolean
}

export interface NaNConfig {
  baseUrl: string
  models: NaNModel[]
}

export async function readModels(): Promise<NaNConfig> {
  const text = await Bun.file(MODELS_FILE).text()
  return JSON.parse(text) as NaNConfig
}

export async function writeModels(config: NaNConfig): Promise<void> {
  await Bun.write(MODELS_FILE, JSON.stringify(config, null, 2) + '\n')
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
