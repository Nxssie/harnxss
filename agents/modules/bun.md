# Module: Bun / TypeScript

Conventions for Bun + TypeScript projects (my default for new web work).

- **Runtime**: prefer Bun APIs (`Bun.serve`, `bun:sqlite`, `Bun.file`) over Node equivalents when
  the project is Bun-native. Use `bun install`, `bun run`, `bun test`, `bun build`.
- **TypeScript**: `strict: true`. No `any` without a written reason. Prefer `type` for unions,
  `interface` for object contracts. Use `satisfies` for config objects.
- **Lockfile**: commit `bun.lock`. Don't mix `package-lock.json` unless a tool requires it.
- **HTTP**: Hono for APIs. Validate input at the boundary (zod or `@hono/zod-validator`).
- **Scripts**: keep `package.json` scripts thin; one concern each (`dev`, `build`, `test`, `typecheck`).
- **Errors**: never swallow; surface typed results. No unhandled promise rejections.
- **Env**: read secrets via `Bun.env` / `process.env`; never hardcode. Provide `.env.example`.
