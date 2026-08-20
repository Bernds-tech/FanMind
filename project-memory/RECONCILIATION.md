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

## RECON-2026-010
- Detected: 2026-08-20 during the new-chat FanMind blind test after the mandatory project-entry preflight was enabled.
- Task: `FM-SEC-001` / Next-Best-Action orchestration.
- Mismatch: `CURRENT_STATE.md` and issue #982 identify `FM-SEC-001` as the exact first safe unproven step, while `NEXT_BEST_ACTIONS.json` omitted that task and the generator therefore selected `NBA-MOBILE-READONLY`.
- Actual state: the live Supabase security reconciliation is open and its next allowed action is read-only Production trigger-hardening verification plus Staging/Auth classification; no protected mutation is authorized by this finding.
- Memory state: the human restart truth had advanced to security-first, but the machine NBA catalog/handoff had not.
- Required correction: add a parallel-safe read-only `FM-SEC-001` NBA before Mobile, regenerate the selected NBA and automatic handoff, and fail Project Memory Quality when `CURRENT_STATE.md` first-safe task is absent from or disagrees with the generated NBA.
- Status: RESOLVED
- Resolved: PR #986 branch scope implements the catalog/handoff/validator alignment. Acceptance remains contingent on exact-head green checks and merge; no Production/Staging/Auth/provider mutation is part of this reconciliation.
