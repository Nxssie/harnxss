#!/usr/bin/env bun
// Claude Code statusLine hook. Two jobs:
//  1. Print a compact line for the CLI: model · effort · context usage.
//  2. Mirror the subscription rate-limit snapshot to ~/.cache/claude-usage.json,
//     since there is no external API to query 5h/7d quota for subscription
//     plans — this stdin payload is the only place Claude Code exposes it.
//     The Quickshell widget (config/quickshell/ClaudeUsage.qml in the dotfiles
//     repo) reads that cache file to show usage on the bar, so usage is
//     deliberately NOT repeated on the CLI line.

interface RateLimit {
  used_percentage?: number
  resets_at?: number
}

interface StatusPayload {
  model?: { id?: string; display_name?: string }
  cost?: { total_cost_usd?: number }
  context_window?: {
    used_percentage?: number
    context_window_size?: number
    total_input_tokens?: number
  }
  effort_level?: unknown
  effort?: unknown
  cwd?: string
  workspace?: { current_dir?: string; project_dir?: string }
  rate_limits?: {
    five_hour?: RateLimit
    seven_day?: RateLimit
  }
}

interface Settings {
  modelSettings?: Record<string, { effortLevel?: string }>
}

const home = process.env.HOME ?? "~"
const raw = await Bun.stdin.text()
let payload: StatusPayload = {}
try {
  payload = JSON.parse(raw)
} catch {
  // malformed/empty input — still emit a status line instead of crashing it
}

const modelId = payload.model?.id ?? ""
const model = payload.model?.display_name ?? modelId ?? "Claude"
const contextPct = payload.context_window?.used_percentage ?? 0
const fiveHour = payload.rate_limits?.five_hour
const sevenDay = payload.rate_limits?.seven_day
const costUsd = payload.cost?.total_cost_usd ?? 0

// Effort: prefer whatever the payload reports, otherwise fall back to the
// per-model setting in settings.json (the "[1m]" context suffix is not part
// of the modelSettings key).
// The payload may expose effort as a plain string or as an object
// (e.g. { level: "low", ... }); normalise both to a string.
function effortToString(value: unknown): string | undefined {
  if (typeof value === "string") return value
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>
    const inner = obj.level ?? obj.effort_level ?? obj.value ?? obj.name
    return typeof inner === "string" ? inner : undefined
  }
  return undefined
}

async function resolveEffort(): Promise<string> {
  const fromPayload = effortToString(payload.effort_level) ?? effortToString(payload.effort)
  if (fromPayload) return fromPayload
  try {
    const settings: Settings = await Bun.file(`${home}/.claude/settings.json`).json()
    const key = modelId.replace(/\[.*\]$/, "")
    return settings.modelSettings?.[key]?.effortLevel ?? "default"
  } catch {
    return "default"
  }
}

const effort = await resolveEffort()

const snapshot = {
  model,
  contextPct,
  fiveHourPct: fiveHour?.used_percentage ?? -1,
  fiveHourResetsAt: fiveHour?.resets_at ?? 0,
  sevenDayPct: sevenDay?.used_percentage ?? -1,
  sevenDayResetsAt: sevenDay?.resets_at ?? 0,
  costUsd,
  updatedAt: Math.floor(Date.now() / 1000),
}

await Bun.write(`${home}/.cache/claude-usage.json`, JSON.stringify(snapshot))

const dim = (s: string) => `\x1b[2m${s}\x1b[0m`
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`
const ctxColor = contextPct >= 80 ? "\x1b[31m" : contextPct >= 50 ? "\x1b[33m" : "\x1b[32m"

// Linear gauge: 10 cells, filled part in the threshold colour, rest dimmed.
const CELLS = 10
const filled = Math.min(CELLS, Math.round((contextPct / 100) * CELLS))
const gauge = `${ctxColor}${"▰".repeat(filled)}\x1b[0m${dim("▱".repeat(CELLS - filled))}`

const left = [bold(model), `effort ${effort}`, `ctx ${gauge} ${ctxColor}${Math.round(contextPct)}%\x1b[0m`].join(
  dim("  ·  "),
)

// Active directory, right-aligned. The hook is not attached to a TTY, so the
// width comes from the controlling terminal (or $COLUMNS as a fallback).
const cwd = (payload.workspace?.current_dir ?? payload.cwd ?? process.cwd()).replace(home, "~")
const visibleLength = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "").length

async function terminalColumns(): Promise<number> {
  try {
    const proc = Bun.spawn(["stty", "size"], { stdin: Bun.file("/dev/tty"), stderr: "ignore" })
    const cols = Number((await new Response(proc.stdout).text()).trim().split(/\s+/)[1])
    if (cols > 0) return cols
  } catch {
    // no controlling terminal — fall through
  }
  return Number(process.env.COLUMNS) || 120
}

// Claude Code pads its status line and truncates anything wider than the
// remaining space, so reserve those columns instead of filling to the edge.
const RIGHT_MARGIN = 4
const MIN_GAP = 2
const available = (await terminalColumns()) - RIGHT_MARGIN - visibleLength(left) - MIN_GAP

// When the path does not fit, keep its tail (the part that identifies the
// project) and elide the leading segments.
let path = cwd
if (path.length > available) {
  path = available > 1 ? `…${path.slice(path.length - available + 1)}` : ""
}

const gap = available - path.length + MIN_GAP
console.log(path ? `${left}${" ".repeat(gap)}${dim(path)}` : left)
