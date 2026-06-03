# AGENTS.md — Nxssie

> Canonical engineering practices for Carlos Sánchez (Nxssie).
> Single source of truth, symlinked into every AI tool's global config (Claude Code,
> OpenCode, Codex, Gemini). Keep this file **lean and tool-agnostic** — see `profile/`
> for who I am and `agents/modules/` for stack-specific conventions.

## Who you're working with
Senior fullstack engineer. Polyglot, ships to production, self-hosts almost everything.
Default to **production-ready** output: no pseudo-code, real error handling, secure defaults.
Be concise and direct. Explain the *why* (maintainability), not the obvious.

**Language:** code, identifiers, comments and commits in **English**. User-facing prose and
chat may be in **Spanish** — match the language I write to you in.

## Core stack
- **TypeScript** (strict). Runtime/tooling default: **Bun**. React 19, Astro, Next.js (App Router), Hono.
- **Java 25 (LTS)** with **Spring Boot**, Clean Architecture, JPA/Hibernate.
- **Python** (latest): type hints, async, **FastAPI**.
- **Rust** for CLIs (clap/serde).
- **Kotlin** for desktop (Compose).
- Data/AI: LLM agents, RAG, MCP.
- **Versions**: **mise** is the single version manager — all runtimes (Node, Bun, Python, Java, Go, Gradle, Maven, Rust) on latest stable or LTS.

## Non-negotiable principles
1. **Clean Code**: SOLID, DRY, KISS — applied, not cargo-culted.
2. **Clean Architecture**: separate domain from framework/IO; depend on abstractions.
3. **Modern standards**: target the latest stable or LTS of each runtime (via mise); use current language features (records, modern ES, async, etc.).
4. **Security**: validate input, secure defaults, never hardcode secrets — read from env vars.
5. **Production-ready**: handle errors gracefully, no TODOs left as landmines.
6. **Match the surrounding code**: naming, style, comment density of the file you edit.
7. **Package manager**: always use **Bun** (`bun`, `bunx`) instead of npm/npx when possible. Fall back to **pnpm** only when a tool or dependency explicitly requires it.

## Git & commits
- **Only commit or push when the user explicitly asks.** Never auto-commit or auto-push.
- **Atomic commits**: one logical change per commit.
- **Conventional Commits**: `type(scope): description` — feat, fix, docs, style, refactor, test, chore, ci, build.
  The `commit` skill is your workflow guide — use it **only** when the user instructs you to commit.
- Branch before committing on a default branch. Never commit secrets.

## Deploy & self-hosting (my defaults)
- **Containers first**: Docker / Docker Compose for everything.
- PaaS: **Coolify** and **Dokploy**; orchestration: **K3s/Kubernetes** for the heavier apps.
- Reverse proxy: **Caddy** (+ Cloudflare). Infra-as-code: **Terraform** on **Proxmox**.
- Persist data via volumes; pin runtime versions (`.node-version`, lockfiles).

## Secrets
Never write a real credential into a tracked file. Reference env vars (`{env:VAR}`, `env_key`,
`${VAR}`) and keep real values in `~/.config/fish/conf.d/secrets.fish` (gitignored).

## When unsure
Ask a sharp question rather than guessing on anything hard to reverse. Prefer reusing an existing
utility/pattern over writing new code.
