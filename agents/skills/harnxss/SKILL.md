---
name: harnxss
description: Author and maintain agent resources in the harnxss hub — add/edit skills, commands, modules, or global instructions (AGENTS.md). Use when the user wants to extend or modify their AI tooling.
---

# harnxss

Dogfood skill for authoring resources in `~/Projects/personal/harnxss`.
Every change must end with `sh install.sh` to propagate symlinks into all tools.

## Repo layout (agent layer)

```
agents/
  AGENTS.md          ← global instructions for all tools
  skills/<name>/
    SKILL.md         ← skill definition
  commands/<name>.md ← slash command
  modules/<name>.md  ← stack-specific conventions (referenced from AGENTS.md)
```

## Adding a skill

1. Create `agents/skills/<name>/SKILL.md` with this frontmatter:
   ```markdown
   ---
   name: <name>
   description: <one-line trigger hint — when should the AI invoke this?>
   ---
   ```
2. Write the skill body: workflow steps, rules, examples. Match the density of existing skills.
3. Run `sh install.sh`.

## Adding a command

1. Create `agents/commands/<name>.md`. Frontmatter optional; the filename is the slash command.
2. Run `sh install.sh`.

## Adding or editing a module

1. Create or edit `agents/modules/<name>.md` — stack-specific conventions (e.g. `bun.md`, `spring-boot.md`).
2. If new, add a reference line to `agents/AGENTS.md` so tools load it.
3. Run `sh install.sh`.

## Editing global instructions

- Edit `agents/AGENTS.md` directly. Keep it lean — Codex caps the global file at 32 KiB.
- Run `sh install.sh` (propagates to all tools via symlinks).

## Rules

- Skills and AGENTS.md are **tool-agnostic**: no Claude-specific syntax unless unavoidable.
- Never encode project-specific content — harnxss is intentionally agnostic (languages & methodologies only).
- Commit after every logical change using the `commit` skill.
- Never hardcode secrets; reference env vars.
