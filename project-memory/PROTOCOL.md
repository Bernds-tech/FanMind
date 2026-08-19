# Project Memory Protocol v2

This directory is the operational memory for FanMind. It complements code, tests, Git history and canonical product documentation; it does not replace them.

## Mandatory preflight
Before any code, infrastructure, configuration, workflow or product-state change:
1. Read `CURRENT_STATE.md` and `SESSION_HANDOFF.md`.
2. Read `OPEN_LOOPS.md`, `TASK_LEDGER.md`, `DEPENDENCIES.md` and `DECISIONS.md`.
3. Search `FAILED_ATTEMPTS.md` and `DO_NOT_ASSUME.md` for the intended area, command, error, external dependency and approach.
4. Read `CHANGE_REQUESTS.md` for newly accepted/deferred scope and `PROJECT_REGISTRY.md` for repository ownership/cross-project IDs.
5. Check git status, current branch, recent commits/PRs and any drift-prone external state needed by the task.
6. Search for existing task/change/cross-project IDs before creating a new one.
7. Do not repeat completed, rejected, superseded or failed approaches unless new evidence justifies it and is recorded first.

## New idea intake
Every owner idea first enters `CHANGE_REQUESTS.md`. Before implementation classify it as `NEW`, `EXISTS_PARTIALLY`, `DUPLICATE`, `DEFERRED` or `REJECTED`. If it spans repositories, assign `XPROJ-YYYY-NNN`, then create local subtasks/dependencies in each affected repository. Never rewrite old completed scope to make a later idea look original.

## Status and acceptance model
Work status: `TODO`, `IN_PROGRESS`, `BLOCKED`, `PARTIAL`, `IMPLEMENTED`, `IMPLEMENTED_NOT_VERIFIED`, `VERIFIED`, `ACCEPTED`, `PRODUCTION_CONFIRMED`, `REJECTED`, `SUPERSEDED`, `DEFERRED`, `DUPLICATE`.

`DONE` remains valid for historical v1 records only. New work must distinguish implementation from verification/acceptance. Evidence belongs in `EVIDENCE.md`; acceptance requires evidence appropriate to the target (tests, workflow, staging, device, operator or production confirmation as applicable).

## Open-loop rule
Every meaningful unfinished follow-up must be represented in `OPEN_LOOPS.md`. A task that is `PARTIAL`, `BLOCKED` or `IMPLEMENTED_NOT_VERIFIED` must have an open-loop reference or an explicit no-follow-up rationale. Never delete closed loops; close/supersede them historically.

## Dependency rule
Before implementing a task, inspect `DEPENDENCIES.md`. Do not mark a dependent task accepted while a required dependency is unresolved. Cross-repository dependencies must name the repository and foreign task/change ID.

## Decision revalidation
Decisions may be permanent or reviewable. New decision entries should include `Class: PERMANENT|REVIEWABLE` and, for reviewable decisions, `Review trigger:` (date, phase, release, dependency or event). A triggered decision review becomes an open loop until resolved.

## Mandatory postflight
After meaningful work:
1. Update `TASK_LEDGER.md` with result and `Updated:` date.
2. Update `CURRENT_STATE.md` when real state changed.
3. Update `OPEN_LOOPS.md` for unfinished or newly closed follow-ups.
4. Update `DEPENDENCIES.md` if ordering/blockers changed.
5. Add evidence/acceptance changes to `EVIDENCE.md`.
6. Record decisions in `DECISIONS.md` and failed/unsafe paths in `FAILED_ATTEMPTS.md`.
7. Capture new ideas in `CHANGE_REQUESTS.md` before silently changing scope.
8. Update `SESSION_HANDOFF.md` at any substantial pause or non-obvious stopping point.
9. Revalidate items in `DO_NOT_ASSUME.md` when the work relied on drift-prone facts.

## Stale-work control
The repository runs an automated Project Memory stale scan. Active tasks/loops must carry an `Updated: YYYY-MM-DD` field. `IN_PROGRESS`, `BLOCKED`, `PARTIAL` and `IMPLEMENTED_NOT_VERIFIED` items older than 14 days are considered stale and must be reviewed, closed, superseded or refreshed with a substantive status update. Reviewable decisions whose trigger has arrived must also become explicit work.

## Source-of-truth precedence
Repository code and passing tests describe actual runtime behavior. Existing canonical FanMind source-of-truth and security/operations documents remain authoritative for their domains. Project memory records operational history, execution state, attempts, dependencies, evidence and decisions and must link rather than duplicate sensitive details.

Never store passwords, API keys, private tokens, plaintext backup material, secret values or private credentials here.
