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
#   sh install.sh        # symlink resources into each tool's global config (idempotent)
#
# Note: ~/.claude/settings.json is COPIED (not symlinked) — Claude Code rewrites it at runtime
# (model, effort, flags) and would otherwise clobber the versioned hub file.
set -eu

HARNXSS="$(cd "$(dirname "$0")" && pwd)"
for arg in "$@"; do
  echo "unknown arg: $arg" >&2; exit 2
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
present_mise=false
present_pi=false
present_droid=false
present_nvim=false
if have claude   || [ -d "$HOME/.claude" ];          then present_claude=true; fi
if have opencode || [ -d "$HOME/.config/opencode" ]; then present_opencode=true; fi
if have codex    || [ -d "$HOME/.codex" ];           then present_codex=true; fi
if have gemini   || [ -d "$HOME/.gemini" ];          then present_gemini=true; fi
if have mise     || [ -d "$HOME/.config/mise" ];     then present_mise=true; fi
if have pi       || [ -d "$HOME/.pi/agent" ];        then present_pi=true; fi
if have droid    || [ -d "$HOME/.factory" ];         then present_droid=true; fi
if have nvim     || [ -d "$HOME/.config/nvim" ];     then present_nvim=true; fi

AGENTS="$HARNXSS/agents/AGENTS.md"

echo "AI-hub install from: $HARNXSS"
echo

# ── NaN model codegen (source of truth → opencode + pi + factory) ────────────
echo "nan models:"
if have bun; then
  bun run "$HARNXSS/tools/nan/gen.ts"
else
  echo "  skip    bun not found — opencode.json, nan.ts, and factory settings NOT regenerated"
fi
echo

# ── Canonical AGENTS.md → each tool's instruction file ───────────────────────
echo "instructions (AGENTS.md):"
if $present_codex;    then backup_then_link "$AGENTS" "$HOME/.codex/AGENTS.md"; fi
if $present_opencode; then backup_then_link "$AGENTS" "$HOME/.config/opencode/AGENTS.md"; fi
if $present_claude;   then backup_then_link "$AGENTS" "$HOME/.claude/CLAUDE.md"; fi
if $present_gemini;   then backup_then_link "$AGENTS" "$HOME/.gemini/GEMINI.md"; fi
if $present_pi;       then backup_then_link "$AGENTS" "$HOME/.pi/agent/AGENTS.md"; fi

# ── Tool configs (secrets externalized) ──────────────────────────────────────
echo "tool configs:"
if $present_claude; then
  cs="$HOME/.claude/settings.json"
  if [ -L "$cs" ] || [ ! -e "$cs" ]; then
    if [ -L "$cs" ]; then rm -f "$cs"; fi   # migrate old symlink → real copy
    mkdir -p "$(dirname "$cs")"
    cp "$HARNXSS/tools/claude/settings.json" "$cs"
    echo "  copy    $cs (seeded; Claude manages this local copy from here)"
  else
    echo "  keep    $cs (real file, Claude-managed)"
  fi
fi
if $present_opencode; then backup_then_link "$HARNXSS/tools/opencode/opencode.json" "$HOME/.config/opencode/opencode.json"; fi
if $present_codex;    then backup_then_link "$HARNXSS/tools/codex/config.toml"       "$HOME/.codex/config.toml"; fi
if $present_gemini;   then backup_then_link "$HARNXSS/tools/gemini/settings.json"    "$HOME/.gemini/settings.json"; fi
if $present_mise;     then backup_then_link "$HARNXSS/tools/mise/config.toml"         "$HOME/.config/mise/config.toml"; fi
if $present_nvim;     then backup_then_link "$HARNXSS/tools/nvim"                     "$HOME/.config/nvim"; fi
if $present_pi; then
  backup_then_link "$HARNXSS/tools/pi/settings.json"          "$HOME/.pi/agent/settings.json"
  backup_then_link "$HARNXSS/tools/pi/APPEND_SYSTEM.md"       "$HOME/.pi/agent/APPEND_SYSTEM.md"
  for ext in "$HARNXSS"/tools/pi/extensions/*.ts; do
    [ -f "$ext" ] || continue
    backup_then_link "$ext" "$HOME/.pi/agent/extensions/$(basename "$ext")"
  done
fi

# ── Skills (first-party) → each tool's skills dir ────────────────────────────
echo "skills:"
for skilldir in "$HARNXSS"/agents/skills/*; do
  [ -d "$skilldir" ] || continue
  name=$(basename "$skilldir")
  if $present_claude;   then backup_then_link "$skilldir" "$HOME/.claude/skills/$name"; fi
  if $present_opencode; then backup_then_link "$skilldir" "$HOME/.config/opencode/skill/$name"; fi
  if $present_codex;    then backup_then_link "$skilldir" "$HOME/.codex/skills/$name"; fi
  if $present_pi;       then backup_then_link "$skilldir" "$HOME/.pi/agent/skills/$name"; fi
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

# ── harnxss TUI command (hn) ─────────────────────────────────────────────────
echo "hn command:"
if have bun; then
  hn_fn="$HOME/.config/fish/functions/hn.fish"
  cat > "$hn_fn" << EOF
function hn --description 'harnxss TUI'
    bun run "$HARNXSS/tools/tui/src/index.tsx" \$argv
end
EOF
  echo "  created $hn_fn"
else
  echo "  skip    bun not found"
fi
echo

echo "Done. Restart your AI tools (and 'exec fish') to pick up changes."
