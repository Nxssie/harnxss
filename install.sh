#!/usr/bin/env sh
# install.sh — Nxssie AI-hub installer
#
# Symlinks the canonical resources in this repo into each AI tool's GLOBAL config
# location. The repo is the single source of truth; tools read through the symlinks.
#
# Idempotent: safe to re-run. Backs up any pre-existing real file to <file>.bak.<epoch>.
# Only touches tools that are present (binary on PATH or config dir exists).
#
# Usage:
#   sh install.sh                          # symlink everything (default)
#   sh install.sh --copy-claude-settings   # copy ~/.claude/settings.json instead of symlink
#                                           # (workaround for Claude issue #3575)
set -eu

HARNXSS="$(cd "$(dirname "$0")" && pwd)"
COPY_CLAUDE_SETTINGS=false
for arg in "$@"; do
  case "$arg" in
    --copy-claude-settings) COPY_CLAUDE_SETTINGS=true ;;
    *) echo "unknown arg: $arg" >&2; exit 2 ;;
  esac
done

have() { command -v "$1" >/dev/null 2>&1; }

# backup_then_link SRC DST [copy]
backup_then_link() {
  src="$1"; dst="$2"; mode="${3:-link}"
  if [ "$mode" = "link" ] && [ -L "$dst" ] && \
     [ "$(readlink -f "$dst" 2>/dev/null)" = "$(readlink -f "$src" 2>/dev/null)" ]; then
    echo "  ok      $dst"
    return 0
  fi
  mkdir -p "$(dirname "$dst")"
  if [ -e "$dst" ] && [ ! -L "$dst" ]; then
    bak="$dst.bak.$(date +%s)"
    mv "$dst" "$bak"
    echo "  backup  $dst -> $bak"
  fi
  if [ "$mode" = "copy" ]; then
    rm -f "$dst"
    cp "$src" "$dst"
    echo "  copy    $dst"
  else
    ln -sfn "$src" "$dst"
    echo "  link    $dst"
  fi
}

# ── Tool presence (binary on PATH or config dir exists) ──────────────────────
present_claude=false
present_opencode=false
present_codex=false
present_gemini=false
if have claude   || [ -d "$HOME/.claude" ];          then present_claude=true; fi
if have opencode || [ -d "$HOME/.config/opencode" ]; then present_opencode=true; fi
if have codex    || [ -d "$HOME/.codex" ];           then present_codex=true; fi
if have gemini   || [ -d "$HOME/.gemini" ];          then present_gemini=true; fi

AGENTS="$HARNXSS/agents/AGENTS.md"

echo "AI-hub install from: $HARNXSS"
echo

# ── Canonical AGENTS.md → each tool's instruction file ───────────────────────
echo "instructions (AGENTS.md):"
if $present_codex;    then backup_then_link "$AGENTS" "$HOME/.codex/AGENTS.md"; fi
if $present_opencode; then backup_then_link "$AGENTS" "$HOME/.config/opencode/AGENTS.md"; fi
if $present_claude;   then backup_then_link "$AGENTS" "$HOME/.claude/CLAUDE.md"; fi
if $present_gemini;   then backup_then_link "$AGENTS" "$HOME/.gemini/GEMINI.md"; fi

# ── Tool configs (secrets externalized) ──────────────────────────────────────
echo "tool configs:"
if $present_claude; then
  if $COPY_CLAUDE_SETTINGS; then
    backup_then_link "$HARNXSS/tools/claude/settings.json" "$HOME/.claude/settings.json" copy
  else
    backup_then_link "$HARNXSS/tools/claude/settings.json" "$HOME/.claude/settings.json"
  fi
fi
if $present_opencode; then backup_then_link "$HARNXSS/tools/opencode/opencode.json" "$HOME/.config/opencode/opencode.json"; fi
if $present_codex;    then backup_then_link "$HARNXSS/tools/codex/config.toml"       "$HOME/.codex/config.toml"; fi
if $present_gemini;   then backup_then_link "$HARNXSS/tools/gemini/settings.json"    "$HOME/.gemini/settings.json"; fi

# ── Skills (first-party) → each tool's skills dir ────────────────────────────
echo "skills:"
for skilldir in "$HARNXSS"/agents/skills/*; do
  [ -d "$skilldir" ] || continue
  name=$(basename "$skilldir")
  if $present_claude;   then backup_then_link "$skilldir" "$HOME/.claude/skills/$name"; fi
  if $present_opencode; then backup_then_link "$skilldir" "$HOME/.config/opencode/skill/$name"; fi
  if $present_codex;    then backup_then_link "$skilldir" "$HOME/.codex/skills/$name"; fi
done

# ── Commands → Claude (and OpenCode) command dirs ────────────────────────────
echo "commands:"
for cmd in "$HARNXSS"/agents/commands/*.md; do
  [ -f "$cmd" ] || continue
  name=$(basename "$cmd")
  if $present_claude;   then backup_then_link "$cmd" "$HOME/.claude/commands/$name"; fi
  if $present_opencode; then backup_then_link "$cmd" "$HOME/.config/opencode/command/$name"; fi
done

# ── Secrets bootstrap (never overwrites an existing real file) ───────────────
echo "secrets:"
secrets="$HOME/.config/fish/conf.d/secrets.fish"
if [ -f "$secrets" ]; then
  echo "  ok      $secrets (exists)"
else
  mkdir -p "$(dirname "$secrets")"
  cp "$HARNXSS/shell/secrets.fish.example" "$secrets"
  echo "  created $secrets from template — FILL IN YOUR KEYS, then 'exec fish'"
fi

echo
echo "Done. Restart your AI tools (and 'exec fish') to pick up changes."
