---
description: Complete feature loop — plan, implement, verify, and self-review autonomously from a high-level objective until done.
argument-hint: "the final objective or task description"
---

# /goal $ARGUMENTS

Inspired by Claude Code's `/goal`. Full autonomous feature loop:
**understand → plan → execute → verify → review → present**. One command, no hand-holding —
the user kicks it off and judges the result. Do not stop until the acceptance criteria are
met or the user explicitly cancels.

## The loop

1. **Understand & define done**: parse the objective and derive explicit acceptance criteria
   (what must work, what must not break). If the goal is ambiguous or references unknown
   context, ask sharp questions now — never guess on intent.

2. **Plan**: break the objective into concrete ordered steps and state them briefly (what
   changes, where, why). If the plan involves breaking changes or an unconventional approach,
   get one confirmation here — this is the only planned checkpoint. Otherwise start
   immediately.

3. **Execute**: work through the steps without asking permission per action. Read files,
   explore the project, run commands, edit code. Keep changes focused on the objective; flag
   out-of-scope tangents instead of doing them. Report progress compactly (step X of Y) so
   the user can follow or steer — a mid-flight user message is a plan correction, not an
   interruption.

4. **Verify**: after significant changes, run the project's build, tests, and linter. On
   failure, diagnose and retry up to 3 times; if the approach is clearly wrong, pivot and
   report what changed and why. A dead end after retries → ask.

5. **Review**: before declaring done, re-read the full diff with fresh eyes:
   - every acceptance criterion met and demonstrably verified
   - no dead code, leftovers, or debug artifacts
   - no scope creep or unrelated edits
   - security sanity: input validated, no hardcoded secrets (`{env:VAR}` / `${VAR}`)
   Fix what you find and re-verify. Iterate until the diff is clean.

6. **Present**: state what was done, how it was verified, key decisions and tradeoffs, and
   suggest next steps if relevant. Hand over — the user accepts or steers changes in normal
   conversation.

## Guardrails (always)

- Before destructive actions (`rm -rf`, `DROP TABLE`, force-push, package deletion, wide
  renames/refactors): summarize intent and confirm first.
- Before pushing to a remote or deploying: summarize what will happen and confirm.
- Never auto-commit or auto-push — suggest committing when ready, don't do it.
- Approaching context limits or confused by scope creep: flag it, ask to narrow the goal or
  start a new session.

## When to ask (do not guess)

- The objective references something outside the current working directory or an unknown
  project.
- The intent is ambiguous ("make it better", "optimize") — ask for specifics.
- A destructive action is needed (see guardrails).
- You've exhausted recovery options on an error (3 attempts or a clear dead end).

## When not to ask (just do it)

- Reading files, running build/test commands, creating non-sensitive files, editing code.
- Installing dependencies or tools (within reason — ask if it's unusual or system-wide).
- Making reasonable architectural decisions consistent with the codebase's existing patterns.
