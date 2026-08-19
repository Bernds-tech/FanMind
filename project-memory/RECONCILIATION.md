# Project Reconciliation

Mandatory consistency check between project memory and actual repository/runtime state.

## Invariants
1. Every active task (`IN_PROGRESS`, `PARTIAL`, `BLOCKED`, `IMPLEMENTED_NOT_VERIFIED`) has a matching `STARTED_WORK.md` record.
2. Every substantive active task has one current `WORK_LOCKS.md` lock or explicit no-lock rationale.
3. Every meaningful implementation session produces an `EXECUTION_RECEIPTS.md` receipt.
4. Merged/closed PR state must be reconciled back into the task; unfinished restore/mobile/AI/billing/social/security work may not disappear.
5. `ACCEPTED`/`PRODUCTION_CONFIRMED` requires matching evidence.
6. Open loops/dependencies remain visible until explicitly closed.
7. Any Git/PR/CI/runtime-memory mismatch creates an open reconciliation finding and blocks a clean completion claim.

Compare `TASK_LEDGER.md`, `STARTED_WORK.md`, `WORK_LOCKS.md`, `OPEN_LOOPS.md`, `DEPENDENCIES.md`, `EVIDENCE.md`, `EXECUTION_RECEIPTS.md`, open PRs/branches, CI and current runtime evidence at each substantial session boundary and during the daily review.

## Finding template
```text
## RECON-YYYY-NNN
- Detected:
- Task:
- Mismatch:
- Actual state:
- Memory state:
- Required correction:
- Status: OPEN|RESOLVED|SUPERSEDED
- Resolved:
```