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
- **Pi has no native MCP client** — it only calls tools registered locally via its extension API
  (`pi.registerTool`). Bridge a remote MCP server by writing a small extension (own subdirectory
  under `tools/pi/extensions/`, own `package.json` with a `"pi": {"extensions": [...]}` field, own
  `@modelcontextprotocol/sdk` dependency) that connects on `session_start`, calls `tools/list`,
  converts each tool's JSON Schema to a TypeBox schema, and `registerTool`s a wrapper that forwards
  to `tools/call` — see `tools/pi/extensions/ai-gateway-mcp/index.ts` for the reference
  implementation. `install.sh` symlinks these subdirectory extensions the same way it does
  single-file ones; `pi`'s own loader recurses one level into `extensions/*/package.json`.
