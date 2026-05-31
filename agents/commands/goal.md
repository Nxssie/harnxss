---
description: Execute a persistent task from a high-level objective — work tenaciously until done, ask when stuck, adopt quality-of-life guardrails.
argument-hint: "the final objective or task description"
---

# /goal $ARGUMENTS

Inspired by Claude Code's `/goal`. Given a final objective, drive toward completion with
persistence, clarity, and production discipline. Do not stop until the objective is met or
the user explicitly cancels.

## Behavior

1. **Parse & plan**: interpret the objective, break it into concrete steps. Ask clarifying
   questions immediately if the goal is ambiguous, the scope is unclear, or external context
   (project, environment, constraints) is missing.

2. **Autonomous execution**: work step by step without asking for permission on each action.
   Read relevant files, explore the project structure, run commands, and make changes.

3. **Persistence**: if a step fails or hits an error, diagnose and attempt a fix up to 3 times
   before asking the user. If the approach is clearly wrong, reassess and pivot rather than
   repeating the same failing strategy — report what changed and why.

4. **Quality-of-life guardrails**:
   - Before making breaking changes (destructive commands, renames, refactors that touch many
     files), **briefly summarize intent and ask for confirmation**.
   - Before pushing to a remote or deploying, **summarize what's about to happen and confirm**.
   - Never hardcode secrets; reference `{env:VAR}` or `${VAR}`.
   - Run the project's build + tests after significant changes and fix any regressions.
   - Never auto-commit or auto-push. If the objective produces meaningful change sets, suggest
     the user commit when ready — do not do it yourself.
   - If you're about to exceed context limits or get confused by scope creep, flag it and ask
     the user to narrow the goal or start a new session.

5. **Completion**: when the goal is met, state clearly what was done, summarize key decisions
   made along the way, and suggest next steps if relevant.

## When to ask (do not guess)

- The objective references something outside the current working directory or an unknown project.
- The intent is ambiguous ("make it better", "optimize") — ask for specifics.
- A destructive action is needed (`rm -rf`, `DROP TABLE`, force-push, package deletion).
- You've exhausted recovery options on an error (3 attempts or a clear dead end).

## When not to ask (just do it)

- Reading files, running build/test commands, creating non-sensitive files, editing code.
- Installing dependencies or tools (within reason — ask if it's unusual or system-wide).
- Committing changes (use `commit` skill).
- Making reasonable architectural decisions consistent with the codebase's existing patterns.
