---
name: commit
description: "Create atomic git commits following the Conventional Commits spec. Use when the user asks to commit, stage changes, or write a commit message. Inspects the diff, groups changes into logical units, and writes type(scope): description messages."
---

# commit

First-party Conventional Commits workflow for Nxssie. One logical change per commit.

## Workflow
1. `git status` and `git diff` (and `git diff --cached`) to understand what changed.
2. Group changes into **atomic** units — if the working tree mixes unrelated changes, stage and
   commit them separately. Never bundle a refactor with a feature.
3. For each unit, stage precisely (`git add <paths>` or `-p`) and write the message.
4. Show the proposed message(s) before committing if there's any ambiguity.

## Message format
```
type(scope): short imperative description

- optional body bullet explaining the *why*, not the *what*
```
- **types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `build`, `perf`.
- **scope**: optional, the module/area touched (e.g. `auth`, `deploy`, `api`).
- **description**: imperative, lowercase, no trailing period, ≤72 chars.
- Breaking change: add `!` after type/scope (`feat(api)!: ...`) and a `BREAKING CHANGE:` footer.

## Rules
- Invoking this skill **is** the instruction to commit — commit directly, don't ask permission
  again. Surface the message(s) first only when the grouping is genuinely ambiguous (step 4).
- English, present imperative ("add", not "added"/"adds").
- Never commit secrets or generated artifacts. If on a default branch, branch first.
- Don't add co-author/footer trailers unless asked.

## Examples
- `feat(auth): add password reset flow`
- `fix(api): handle null session in auth middleware`
- `refactor(db): extract query logic into a repository`
