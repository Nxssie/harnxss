---
description: Ship the current project — verify, commit, and surface the deploy path (Coolify / Dokploy / K3s).
argument-hint: "[optional: target env or note]"
---

# /ship $ARGUMENTS

Take the current project from "code done" to "deployed", following Nxssie's conventions.

## Steps
1. **Sanity**: detect the project type (look for `package.json`, `pom.xml`, `Dockerfile`,
   `compose.yaml`, `k8s/`, `.node-version`). Report what you found.
2. **Verify**: run the project's build + tests if they exist (`bun test`, `./mvnw verify`,
   `cargo test`, etc.). Do NOT proceed to deploy steps if they fail — report instead.
3. **Commit**: use the `commit` skill for any pending changes (atomic, Conventional Commits).
4. **Deploy path** — identify and state the mechanism, don't guess:
   - `Dockerfile` + Coolify/Dokploy → push to the tracked branch; the PaaS rebuilds.
   - `k8s/` or GitHub Actions → push; CI deploys to the K3s cluster.
   - Pinned runtime (`.node-version`, lockfile) → confirm it matches the target.
5. **Confirm before pushing** to a remote. Summarize what will deploy and where.

Context note: $ARGUMENTS

Never push secrets. Reverse-proxy is Caddy; persist data via volumes.
