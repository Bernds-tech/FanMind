# Project Memory Protocol v1

This directory is the operational memory for FanMind. It complements code, tests, Git history and canonical product documentation; it does not replace them.

## Mandatory preflight

Before any code, infrastructure, configuration, workflow or product-state change:

1. Read `project-memory/CURRENT_STATE.md`.
2. Read `project-memory/TASK_LEDGER.md`.
3. Read `project-memory/DECISIONS.md`.
4. Search `project-memory/FAILED_ATTEMPTS.md` for the intended area, command, error and approach.
5. Read `project-memory/CHANGE_REQUESTS.md` for newly accepted or deferred scope.
6. Check `git status`, the current branch and recent commits/PRs.
7. Search for an existing task/change ID before creating a new one.
8. Do not repeat a DONE, REJECTED, SUPERSEDED or failed approach unless new evidence is recorded first.

## Mandatory postflight

After meaningful work:

1. Record the result in `TASK_LEDGER.md`.
2. Update `CURRENT_STATE.md` when the real current state changed.
3. Record architecture/product decisions in `DECISIONS.md`.
4. Record failed or unsafe approaches in `FAILED_ATTEMPTS.md` with why they must not be repeated.
5. Capture user ideas in `CHANGE_REQUESTS.md` before silently changing scope.
6. Include task/change IDs in the PR description or commit message when practical.

## Status vocabulary

`TODO`, `IN_PROGRESS`, `BLOCKED`, `PARTIAL`, `DONE`, `REJECTED`, `SUPERSEDED`, `DEFERRED`, `DUPLICATE`.

## Change-request intake

A new idea is first logged as a change request. Then classify it as:

- part of an existing task;
- a new accepted task;
- deferred to a later phase;
- rejected with rationale; or
- duplicate of an existing task/change.

Do not rewrite old completed tasks to make later ideas appear as if they were part of the original scope.

## Evidence rule

For each implementation attempt, record: ID, date, goal, starting state, action, result, error/failure if any, cause, decision, commit/PR/evidence, next step and `do not repeat` guidance when applicable.

## Source-of-truth precedence

Repository code and passing tests describe actual runtime behavior. Existing canonical FanMind source-of-truth and security/operations documents remain authoritative for their domains. Project memory records operational history, execution state, attempts and decisions and must link rather than duplicate sensitive details.

Never store passwords, API keys, private tokens, plaintext backup material, secret values or private credentials here.