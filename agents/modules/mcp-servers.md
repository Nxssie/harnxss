# Module: Registering self-hosted MCP servers globally

Conventions for wiring a self-hosted remote MCP server (HTTP/SSE transport, behind my own
auth — a personal access token, not a shared secret) into a tool's **global/user-scope** config
so every project session gets it, not just one repo.

- **Scope**: register at user/global scope, not per-project, unless the server is genuinely
  project-specific (e.g. only makes sense inside one repo's context).
- **Secrets**: never write the raw token into a config file. Reference an env var already set in
  shell config (see `secrets.fish` convention in `AGENTS.md`) using whatever expansion syntax the
  tool supports for that field (header/env value) — check the tool's own docs for the exact
  syntax (e.g. `${VAR}`, `{env:VAR}`) rather than assuming one tool's syntax works in another.
- **Verify after adding**: use the tool's own MCP listing/status command to confirm the server
  connects (not just that the config parsed) before considering the setup done.
- **Claude Code specifically**: `claude mcp add --transport http <name> <url> --header
  "Authorization: Bearer \${VAR_NAME}" -s user`. Verify with `claude mcp list`. Stored in
  `~/.claude.json` under `mcpServers.<name>.headers`, with the `${VAR}` placeholder — Claude Code
  expands it from the environment at connect time, so the file itself never holds the secret.
- **Other tools (OpenCode, Codex, Gemini CLI, …)**: same principle, different config file/syntax —
  don't assume Claude Code's `${VAR}` convention transfers as-is; read that tool's MCP config docs
  for its actual env-var expansion support before wiring it up.
