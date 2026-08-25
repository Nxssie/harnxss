# harnxss — Nxssie AI-Hub

Centralized, self-owned configuration for my AI coding tools. This repo is the **single source of
truth**: one canonical `AGENTS.md`, my skills, my commands, and each tool's config live here, and an
installer symlinks them into the **global** config location of every tool. Clone on a new machine,
run the installer, and Claude Code / OpenCode / Pi are all configured identically.

> Philosophy: one versioned repo holds the real files; the symlinks point *out* into
> `~/.claude`, `~/.config/opencode`, `~/.pi/agent`. Fully self-owned — no third-party
> skill manager. **Agnostic by design**: encodes my languages and methodologies, never the content
> or explicit stack of any specific project.

## Layout

```
agents/AGENTS.md      ★ canonical practices (the lingua franca; lean, tool-agnostic)
agents/skills/        first-party skills (SKILL.md)
agents/commands/      first-party slash-commands
agents/modules/       per-stack convention references (opt-in)
profile/              languages & methodologies — skills.yaml (machine) + PROFILE.md (human)
tools/<tool>/         each tool's config, with secrets externalized
shell/secrets.fish.example   template for real env-var secrets
install.sh            idempotent symlink installer
```

## Install

```sh
sh install.sh
```

On a machine without a local clone (e.g. a work laptop), bootstrap and install in one line — this
clones to a throwaway temp dir, **copies** the resources in (no symlinks, no lasting repo), and
deletes the temp clone when it's done:

```sh
curl -fsSL https://raw.githubusercontent.com/Nxssie/harnxss/main/install.sh | sh
```

To bootstrap a *persistent* clone instead (symlinked, like a manual `git clone` + `./install.sh`),
set `HARNXSS_DIR`:

```sh
HARNXSS_DIR=~/code/harnxss sh -c "$(curl -fsSL https://raw.githubusercontent.com/Nxssie/harnxss/main/install.sh)"
```

Then set your secrets and reload the shell:

```sh
cp shell/secrets.fish.example ~/.config/fish/conf.d/secrets.fish
# edit the file, put in the real NX_LLM_GATEWAY_KEY
exec fish
```

The installer only touches tools that are present, backs up any existing real file to
`<file>.bak.<epoch>`, and is safe to re-run.

## Symlink map

| Source (this repo)              | Target                              |
|---------------------------------|-------------------------------------|
| `agents/AGENTS.md`              | `~/.config/opencode/AGENTS.md`       |
| `agents/AGENTS.md`              | `~/.claude/CLAUDE.md` (Claude has no AGENTS.md) |
| `agents/AGENTS.md`              | `~/.pi/agent/AGENTS.md` (if present) |
| `tools/claude/settings.json`    | `~/.claude/settings.json`            |
| `tools/opencode/opencode.json`  | `~/.config/opencode/opencode.json`   |
| `tools/mise/config.toml`        | `~/.config/mise/config.toml` (if present) |
| `tools/pi/settings.json`        | `~/.pi/agent/settings.json` (copied, if present) |
| `tools/pi/APPEND_SYSTEM.md`     | `~/.pi/agent/APPEND_SYSTEM.md` (if present) |
| `tools/pi/extensions/*.ts`      | `~/.pi/agent/extensions/` (if present) |
| `agents/skills/<name>`          | `~/.claude/skills/`, `~/.config/opencode/skill/`, `~/.pi/agent/skills/` |
| `agents/commands/<name>.md`     | `~/.claude/commands/`, `~/.config/opencode/command/` |

Only individual files/subdirs are linked — never the whole `~/.claude/` dir (it also holds runtime
state and credentials).

## Why `AGENTS.md` is the single file
- **OpenCode** reads `AGENTS.md` natively (global + per-project).
- **Claude Code** reads `CLAUDE.md` only, so its global file is a symlink → `AGENTS.md`.
- **Pi** reads `~/.pi/agent/AGENTS.md`, a symlink → `AGENTS.md`; `tools/pi/extensions/*.ts` are linked
  into `~/.pi/agent/extensions/`.

## Secrets
Real credentials never live in this repo. Configs reference env vars:
- `opencode.json` → `"apiKey": "{env:NX_LLM_GATEWAY_KEY}"`
- `pi/extensions/llm.ts` → `process.env.NX_LLM_GATEWAY_KEY`

The real value lives only in `~/.config/fish/conf.d/secrets.fish` (gitignored, auto-sourced by fish).
If `{env:}` ever fails for a custom OpenCode provider, switch that field to `"{file:~/.secrets/gateway-key}"`.

## Single inference gateway
Every CLI talks only to a self-hosted LiteLLM proxy (`llm.nxssie.dev`) — never to a provider
directly. One virtual key (`NX_LLM_GATEWAY_KEY`), one place to add/remove models or rotate
credentials. The provider catalog itself (which upstreams are wired into LiteLLM) lives in
`~/Projects/personal/ai-gateway`, not here.

Model *discovery* is zero-config: `tools/llm/gen.ts` calls `GET {baseUrl}/model_group/info` on the
gateway at generation time — LiteLLM's own endpoint, readable with just the gateway API key, that
returns each model's context window (`max_input_tokens`), max output tokens (`max_output_tokens`),
and vision/reasoning support alongside its id. That gets propagated into `opencode.json` and
`~/.factory/settings.json` (both need a static list). `tools/llm/models.json` carries no per-model
metadata anymore — only `baseUrl` and optional `disabledPrefixes`/`enabledOverrides` filters. Known
providers (OpenAI, Anthropic, OpenRouter…) get accurate limits automatically from LiteLLM's built-in
cost map; custom/self-hosted models (e.g. OpenCode Go) only report real numbers once set by hand in
ai-gateway's Models screen (Capabilities section) — otherwise `gen.ts` falls back to generic
defaults (128k context / 8k output). **Pi** goes one step further and needs no generation step at
all: `pi/extensions/llm.ts` is hand-written, static code that implements `refreshModels()` and
re-fetches the same `/model_group/info` from the gateway at runtime.

Adding a model means: register it in ai-gateway (filling in Capabilities there if it's a custom
provider LiteLLM doesn't already know), then re-run `bun run tools/llm/gen.ts` (or `sh install.sh`)
to refresh OpenCode/Factory — it just appears in Pi on its own next refresh. No repo edits needed
here anymore; ai-gateway is the single source of truth for model metadata.

## Adding a skill / command
1. Create `agents/skills/<name>/SKILL.md` (YAML frontmatter: `name`, `description` + markdown body)
   or `agents/commands/<name>.md`.
2. Re-run `sh install.sh`. It symlinks the new resource into every present tool.

## Known caveats
- **Claude and Pi `settings.json` are copied, not symlinked** — both tools rewrite their settings at
  runtime (model, effort/thinking level, changelog marker), which would clobber the versioned hub
  file. The installer seeds each from the hub on first run; the tool owns the local copy after that.
  Deliberate config changes go into `tools/<tool>/settings.json` and land after deleting the local
  copy (or `.bak.<epoch>` it) and re-running `sh install.sh`.
- **Claude #25367** — a symlinked skill may log a cosmetic "Unknown skill" warning but still runs.
- **OpenCode #18848** — symlinked skills aren't discovered inside a git-worktree sandbox session.
- Env vars must be exported in the shell that **launches** the tool. fish loads `conf.d/*.fish`
  automatically; a GUI launcher that doesn't source fish would leave them empty.
- **Ephemeral (`curl | sh`) installs don't get the `hn` TUI command** — it needs a persistent path
  to run `bun` against, which an ephemeral install deliberately doesn't leave behind.

## Credits

Inference is served through a self-hosted LiteLLM gateway — see `~/Projects/personal/ai-gateway`
for the upstream providers wired into it.
