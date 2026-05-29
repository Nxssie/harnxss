# harnxss — Nxssie AI-Hub

Centralized, self-owned configuration for my AI coding tools. This repo is the **single source of
truth**: one canonical `AGENTS.md`, my skills, my commands, and each tool's config live here, and an
installer symlinks them into the **global** config location of every tool. Clone on a new machine,
run the installer, and Claude Code / OpenCode / Codex / Gemini are all configured identically.

> Philosophy: one versioned repo holds the real files; the symlinks point *out* into
> `~/.claude`, `~/.config/opencode`, `~/.codex`, `~/.gemini`. Fully self-owned — no third-party
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
# or, if Claude permissions/perf act up with a symlinked settings.json (issue #3575):
sh install.sh --copy-claude-settings
```

Then set your secrets and reload the shell:

```sh
cp shell/secrets.fish.example ~/.config/fish/conf.d/secrets.fish
# edit the file, put in the real NAN_API_KEY
exec fish
```

The installer only touches tools that are present, backs up any existing real file to
`<file>.bak.<epoch>`, and is safe to re-run.

## Symlink map

| Source (this repo)              | Target                              |
|---------------------------------|-------------------------------------|
| `agents/AGENTS.md`              | `~/.codex/AGENTS.md`                 |
| `agents/AGENTS.md`              | `~/.config/opencode/AGENTS.md`       |
| `agents/AGENTS.md`              | `~/.claude/CLAUDE.md` (Claude has no AGENTS.md) |
| `agents/AGENTS.md`              | `~/.gemini/GEMINI.md` (if present)   |
| `tools/claude/settings.json`    | `~/.claude/settings.json`            |
| `tools/opencode/opencode.json`  | `~/.config/opencode/opencode.json`   |
| `tools/codex/config.toml`       | `~/.codex/config.toml`               |
| `tools/gemini/settings.json`    | `~/.gemini/settings.json` (if present) |
| `agents/skills/<name>`          | `~/.claude/skills/`, `~/.config/opencode/skill/`, `~/.codex/skills/` |
| `agents/commands/<name>.md`     | `~/.claude/commands/`, `~/.config/opencode/command/` |

Only individual files/subdirs are linked — never the whole `~/.claude/` dir (it also holds runtime
state and credentials).

## Why `AGENTS.md` is the single file
- **Codex** and **OpenCode** read `AGENTS.md` natively (global + per-project).
- **Claude Code** reads `CLAUDE.md` only, so its global file is a symlink → `AGENTS.md`.
- **Gemini** reads `GEMINI.md` by default; `tools/gemini/settings.json` sets `context.fileName` so it
  also reads `AGENTS.md`.

## Secrets
Real credentials never live in this repo. Configs reference env vars:
- `opencode.json` → `"apiKey": "{env:NAN_API_KEY}"`
- `codex/config.toml` → `env_key = "NAN_API_KEY"`

The real value lives only in `~/.config/fish/conf.d/secrets.fish` (gitignored, auto-sourced by fish).
If `{env:}` ever fails for a custom OpenCode provider, switch that field to `"{file:~/.secrets/nan-key}"`.

## Adding a skill / command
1. Create `agents/skills/<name>/SKILL.md` (YAML frontmatter: `name`, `description` + markdown body)
   or `agents/commands/<name>.md`.
2. Re-run `sh install.sh`. It symlinks the new resource into every present tool.

## Known caveats
- **Claude #3575** — a symlinked `settings.json` can drop permission rules / be slow. Use
  `--copy-claude-settings` if you hit it.
- **Claude #25367** — a symlinked skill may log a cosmetic "Unknown skill" warning but still runs.
- **OpenCode #18848** — symlinked skills aren't discovered inside a git-worktree sandbox session.
- **Codex** — the global `AGENTS.md` is capped at 32 KiB; keep it lean (≤ ~5 KB).
- Env vars must be exported in the shell that **launches** the tool. fish loads `conf.d/*.fish`
  automatically; a GUI launcher that doesn't source fish would leave them empty.
