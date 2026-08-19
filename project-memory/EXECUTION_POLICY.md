# Execution Policy

Mandatory default for all substantive agent/Codex/automation work.

## First-pass preflight
Before acting, read `AGENTS.md` and the relevant `project-memory/` sources: current state, task ledger, change requests, decisions, failed attempts, open loops, dependencies, evidence, do-not-assume, session handoff, project/cross-project status, authorizations, `STARTED_WORK.md`, `WORK_LOCKS.md`, `EXECUTION_RECEIPTS.md` and `RECONCILIATION.md`. Then verify the actual branch/head, open PRs/checks and current implementation/runtime evidence.

Do not wait for the owner to say "check first". This preflight is automatic.

## Started-work rule
As soon as substantive work starts, record it in `STARTED_WORK.md` and acquire/update the Task-ID lock in `WORK_LOCKS.md`. Unfinished restore/mobile/AI/billing/social/security work remains visible with completed-so-far, still-open and exact-next-step fields until explicitly closed or superseded.

## Duplicate/regression check
Confirm the work is not already implemented, the same approach was not already rejected/failed without new evidence, the scope belongs here, dependencies are satisfied, and success evidence is defined before editing.

## Independent second-pass countercheck
Before completion/merge/reporting success: re-read the goal, inspect the final diff, verify tests/evidence, check unrelated changes/regressions, re-check dependencies/open loops, reconcile Task Ledger/Started Work/Work Locks/PR/CI/runtime/Evidence, write an execution receipt, release or refresh the lock, and update project memory. Never equate implemented with accepted without evidence.

Any mismatch creates a reconciliation finding and prevents a clean completion claim.

## Stop conditions
Do not bypass red governance/security/supply-chain checks, missing dependencies/secrets, contradictory verified evidence, production/billing/destructive/compliance boundaries, or previously failed approaches without new justification.

## Standing permissions
Reuse permissions documented in `AUTHORIZATIONS.md` without asking again where technically and safely allowed. Platform confirmations and protected/destructive boundaries still apply.

## Invariant
**Project memory -> actual Git/runtime state -> previous attempts -> started-work/lock -> dependency/evidence check -> action -> independent countercheck -> reconciliation -> execution receipt -> memory update.**
