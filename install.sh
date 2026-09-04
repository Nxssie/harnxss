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
#   sh install.sh                                       # from an existing local clone: symlinks
#   curl -fsSL https://raw.githubusercontent.com/Nxssie/harnxss/main/install.sh | sh
#                                                         # bootstraps into a throwaway temp dir,
#                                                         # COPIES resources in (no lasting repo,
#                                                         # nothing left behind). Good for a
#                                                         # work/borrowed machine.
#   HARNXSS_DIR=~/code/harnxss sh -c "$(curl -fsSL ...)"
#                                                         # bootstraps a persistent clone at that
#                                                         # path instead and symlinks into it, same
#                                                         # as a manual git clone + ./install.sh
#
# Note: ~/.claude/settings.json and ~/.pi/agent/settings.json are COPIED (not symlinked) — both
# tools rewrite their settings at runtime (model, effort/thinking level, changelog marker) and
# would otherwise clobber the versioned hub file.
set -eu

for arg in "$@"; do
  echo "unknown arg: $arg" >&2; exit 2
done

have() { command -v "$1" >/dev/null 2>&1; }

# ── Locate or bootstrap the repo ──────────────────────────────────────────
# Local run (./install.sh from a real clone): use that clone in place and
# SYMLINK — the repo stays the single source of truth, tools read through it.
# Remote run (curl ... | sh) with no $HARNXSS_DIR: clone to a throwaway temp
# dir and COPY resources instead — no persistent repo or symlink survives on
# disk once the script exits, which is the point on a work/borrowed machine.
# Remote run WITH $HARNXSS_DIR set: clone there persistently and symlink, same
# as a manual clone.
GITHUB_SSH="git@github.com:Nxssie/harnxss.git"
GITHUB_HTTPS="https://github.com/Nxssie/harnxss.git"

script_dir=""
if [ -f "$0" ]; then
  script_dir="$(cd "$(dirname "$0")" && pwd)"
fi

LINK_MODE="link"
EPHEMERAL=false

clone_harnxss() {
  dest="$1"
  echo "bootstrapping into: $dest"
  mkdir -p "$(dirname "$dest")"
  for url in "$GITHUB_SSH" "$GITHUB_HTTPS"; do
    echo "  trying $url"
    if git clone --quiet --depth 1 "$url" "$dest" 2>/dev/null; then
      return 0
    fi
    rm -rf "$dest"
  done
  echo "error: could not clone harnxss from GitHub" >&2
  exit 1
}

if [ -n "$script_dir" ] && [ -d "$script_dir/.git" ]; then
  HARNXSS="$script_dir"
elif [ -n "${HARNXSS_DIR:-}" ]; then
  HARNXSS="$HARNXSS_DIR"
  if [ -d "$HARNXSS/.git" ]; then
    echo "updating existing clone: $HARNXSS"
    git -C "$HARNXSS" pull --ff-only
  else
    clone_harnxss "$HARNXSS"
  fi
  echo
else
  EPHEMERAL=true
  LINK_MODE="copy"
  HARNXSS="$(mktemp -d "${TMPDIR:-/tmp}/harnxss.XXXXXX")"
  trap 'rm -rf "$HARNXSS"' EXIT
  clone_harnxss "$HARNXSS"
  echo "ephemeral install: copying resources in, no repo or symlinks will be left behind"
  echo
fi

# seed_local_copy SRC DST LABEL — copy once, never touch again. For settings
# files a tool rewrites at runtime (model, effort, flags); symlinking would let
# that runtime churn leak back into the versioned repo file.
seed_local_copy() {
  src="$1"; dst="$2"; label="$3"
  if [ -L "$dst" ] || [ ! -e "$dst" ]; then
    if [ -L "$dst" ]; then rm -f "$dst"; fi   # migrate old symlink → real copy
    mkdir -p "$(dirname "$dst")"
    cp "$src" "$dst"
    echo "  copy    $dst (seeded; $label manages this local copy from here)"
  else
    echo "  keep    $dst (real file, $label-managed)"
  fi
}

# backup_then_link SRC DST [link|copy] — mode defaults to $LINK_MODE (set once
# during bootstrap: "link" for a persistent local clone, "copy" for an
# ephemeral one, since its source will be gone by the time the tool reads it).
backup_then_link() {
  src="$1"; dst="$2"; mode="${3:-$LINK_MODE}"
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
    rm -rf "$dst"
    cp -R "$src" "$dst"
    echo "  copy    $dst"
  else
    ln -sfn "$src" "$dst"
    echo "  link    $dst"
  fi
}

# ── Tool presence (binary on PATH or config dir exists) ──────────────────────
present_claude=false
present_opencode=false
present_mise=false
present_pi=false
present_droid=false
if have claude   || [ -d "$HOME/.claude" ];          then present_claude=true; fi
if have opencode || [ -d "$HOME/.config/opencode" ]; then present_opencode=true; fi
if have mise     || [ -d "$HOME/.config/mise" ];     then present_mise=true; fi
if have pi       || [ -d "$HOME/.pi/agent" ];        then present_pi=true; fi
if have droid    || [ -d "$HOME/.factory" ];         then present_droid=true; fi

AGENTS="$HARNXSS/agents/AGENTS.md"

echo "AI-hub install from: $HARNXSS"
echo

# ── gateway model codegen (source of truth → opencode + pi + factory) ───────
echo "gateway models:"
if have bun; then
  bun run "$HARNXSS/tools/llm/gen.ts"
else
  echo "  skip    bun not found — opencode.json and factory settings NOT regenerated"
fi
echo

# ── Canonical AGENTS.md → each tool's instruction file ───────────────────────
echo "instructions (AGENTS.md):"
if $present_opencode; then backup_then_link "$AGENTS" "$HOME/.config/opencode/AGENTS.md"; fi
if $present_claude;   then backup_then_link "$AGENTS" "$HOME/.claude/CLAUDE.md"; fi
if $present_pi;       then backup_then_link "$AGENTS" "$HOME/.pi/agent/AGENTS.md"; fi

# ── Tool configs (secrets externalized) ──────────────────────────────────────
echo "tool configs:"
if $present_claude; then
  seed_local_copy "$HARNXSS/tools/claude/settings.json" "$HOME/.claude/settings.json" "Claude"
  # statusLine hook referenced by settings.json (model · effort · context gauge).
  backup_then_link "$HARNXSS/tools/claude/statusline.ts" "$HOME/.claude/statusline.ts"
fi
if $present_opencode; then backup_then_link "$HARNXSS/tools/opencode/opencode.json" "$HOME/.config/opencode/opencode.json"; fi
if $present_mise;     then backup_then_link "$HARNXSS/tools/mise/config.toml"         "$HOME/.config/mise/config.toml"; fi
if $present_pi; then
  seed_local_copy "$HARNXSS/tools/pi/settings.json" "$HOME/.pi/agent/settings.json" "pi"
  backup_then_link "$HARNXSS/tools/pi/APPEND_SYSTEM.md"       "$HOME/.pi/agent/APPEND_SYSTEM.md"
  for ext in "$HARNXSS"/tools/pi/extensions/*.ts; do
    [ -f "$ext" ] || continue
    backup_then_link "$ext" "$HOME/.pi/agent/extensions/$(basename "$ext")"
  done
  # Multi-file extensions (own package.json + node_modules, e.g. MCP bridges)
  # live in a subdirectory and get symlinked whole — pi's loader recurses one
  # level into extensions/*/package.json.
  for extdir in "$HARNXSS"/tools/pi/extensions/*/; do
    [ -f "$extdir/package.json" ] || continue
    backup_then_link "${extdir%/}" "$HOME/.pi/agent/extensions/$(basename "$extdir")"
  done
fi

# ── Skills (first-party) → each tool's skills dir ────────────────────────────
echo "skills:"
for skilldir in "$HARNXSS"/agents/skills/*; do
  [ -d "$skilldir" ] || continue
  name=$(basename "$skilldir")
  if $present_claude;   then backup_then_link "$skilldir" "$HOME/.claude/skills/$name"; fi
  if $present_opencode; then backup_then_link "$skilldir" "$HOME/.config/opencode/skill/$name"; fi
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

# ── Persistent SSH agent (systemd socket-activated) ───────────────────────────
echo "ssh agent:"
if have systemctl && systemctl --user list-unit-files ssh-agent.socket >/dev/null 2>&1; then
  systemctl --user enable --now ssh-agent.socket >/dev/null 2>&1
  echo "  ok      ssh-agent.socket enabled (persistent agent at \$XDG_RUNTIME_DIR/ssh-agent.socket)"
else
  echo "  skip    systemd ssh-agent.socket not available"
fi
for f in "$HARNXSS"/shell/conf.d/*.fish; do
  [ -f "$f" ] || continue
  backup_then_link "$f" "$HOME/.config/fish/conf.d/$(basename "$f")"
done
for f in "$HARNXSS"/shell/functions/*.fish; do
  [ -f "$f" ] || continue
  backup_then_link "$f" "$HOME/.config/fish/functions/$(basename "$f")"
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
# Needs a persistent $HARNXSS to run from — skipped for an ephemeral install
# since that path is deleted the moment this script exits.
echo "hn command:"
if $EPHEMERAL; then
  echo "  skip    ephemeral install has no persistent path for hn to run from"
elif have bun; then
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

if $EPHEMERAL; then
  echo "Done (ephemeral). Resources were copied in, nothing left on disk. Restart your AI tools (and 'exec fish') to pick up changes."
else
  echo "Done. Restart your AI tools (and 'exec fish') to pick up changes."
fi
