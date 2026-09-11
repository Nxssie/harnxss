# Module: Git branching

Branching conventions for repos I own, assuming a tagged-release flow: `main` is what ships, and a
version is a batch of changes rather than a branch.

- **Two long-lived branches.** `main` holds released states only, one tag per release
  (`v<major>.<minor>.<patch>`); `dev/<major>.<minor>.0` is the integration line for the cycle in
  flight. Everything else is short-lived.
- **One `dev/` branch per *minor* cycle.** Patches are cut from a released `main`, so there is no
  `dev/0.5.1` — a cycle branch that never gains a feature is a branch that was never needed.
- **The version is decided at tag time, never by the branch name.** A topic branch describes one
  change, a version is a batch of them, so the two must not share a name. `feat/0.6.0` is wrong in
  both directions.
- **Prefixes are the Conventional Commits types**: `feat/`, `fix/`, `refactor/`, `perf/`, `test/`,
  `docs/`, `ci/`, `build/`, `chore/`. Never mix in `feature/`: a prefix that disagrees with the
  commit log makes `git branch --list` useless for filtering.
- **Slugs are kebab-case and content-named** (`fix/windows-release-naming`), never a ticket id or a
  version. Content survives a re-triage; ids and versions do not.
- **Long-lived branches are identifiable by prefix.** Only `main` and `dev/*` outlive a day — a
  branch open for a month under `feat/` has silently become an integration line and should be
  renamed to say so, because otherwise every later merge into it reads as unrelated work.
- **Short-lived branches are optional.** Working solo, commit straight to `dev/<version>` when the
  change is small or certain, and branch only when the work is exploratory enough that it might be
  thrown away. A topic branch earns its keep by making one change reviewable or revertable in a
  single step, not by ceremony.
- **Branch off the integration branch**, so merging back is trivial and the eventual PR stays in
  first-parent order.
- **Hotfixes never go through `dev/`.** They branch from the released tag as `fix/<slug>`, merge
  into `main` and are tagged there. That is the only case where `main` and `dev/*` legitimately
  diverge, and the reason `main` must stay shippable without the in-flight cycle.
- **Merge, never rebase, once a branch is pushed.** Build identifiers embed the short hash (`git
  describe --always`), so rewriting history orphans the identifier of every build already installed
  or shipped. Rebase freely before the first push, never after.
- **Merge a group of commits with `--no-ff`** so the change set stays visible under
  `git log --first-parent <integration-branch>`, then delete the topic branch once it lands.
- **A release is a PR from `dev/<version>` into `main`, tagged on the merge commit.** Tagging the
  integration branch's tip instead ships a state `main` never saw, and a later `git describe` on
  `main` loses the tag.
- **Sweep merged branches.** Dead entries in `git branch -a` are how `feat/` and `feature/` drift
  apart in the first place.
