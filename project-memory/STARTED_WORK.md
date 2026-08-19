# Started Work Register

Canonical register for FanMind work that has started but is not yet fully completed.

## Rules
- Add an entry as soon as substantive work begins.
- Every active `IN_PROGRESS`, `PARTIAL`, `BLOCKED`, `IMPLEMENTED_NOT_VERIFIED` or `RECONCILIATION_REQUIRED` task must appear here until closed or superseded.
- Assign `Risk: R1|R2|R3|R4` before implementation continues.
- Never delete history; close with status, date, result, evidence and next step.
- Cross-link Task ID, Change Request, PR/branch, dependencies, work lock and execution receipt.

## Entry template
```text
## <TASK-ID>
- Started: YYYY-MM-DD HH:MM TZ
- Updated: YYYY-MM-DD
- Status: IN_PROGRESS|PARTIAL|BLOCKED|IMPLEMENTED_NOT_VERIFIED|RECONCILIATION_REQUIRED
- Risk: R1|R2|R3|R4
- Scope:
- Branch/PR:
- Work lock:
- Dependencies:
- Assumptions:
- Completed so far:
- Still open:
- Evidence so far:
- Exact next step:
- Owner action needed: yes|no
```

## Active work

## FM-MEM-005
- Started: 2026-08-19 08:40 Europe/Vienna
- Updated: 2026-08-19
- Status: IMPLEMENTED_NOT_VERIFIED
- Risk: R3
- Scope: Consolidate FanMind Project Memory V2-V5, standing authorizations, status/stale automation, started-work tracking, work locks, execution receipts, assumptions/contradictions and mandatory counterchecks into one main-targeted governance change.
- Branch/PR: `project-memory-v4-started-work` / PR #975
- Work lock: repository governance branch/PR #975; do not create a competing FanMind memory PR.
- Dependencies: all relevant FanMind CI/security/supply-chain/browser gates for the exact current head.
- Assumptions: mergeable PR is not sufficient evidence; exact-head CI must be current and green.
- Completed so far: V2-V5 consolidated; PRs #973/#974 superseded; checkout actions SHA-pinned; status drift fixed; supply-chain hardcoded checkout counts reconciled; chat reconciliation record added.
- Still open: rerun/reconcile all relevant checks for the current head after the chat-reconciliation commit; merge #975 only when required/expected gates are green; then close task/lock/receipt on main.
- Evidence so far: `project-memory/CHAT_RECONCILIATION_2026-08-19.md`, PR #975 history and prior green Memory Guard/Quality/Status/Supply Chain/Landing/CI/CodeQL runs.
- Exact next step: inspect workflow runs for the current PR #975 head and merge only if the exact head is fully green.
- Owner action needed: no, unless GitHub/platform requires a protected approval.

## FM-RST-001
- Started: 2026-08-17
- Updated: 2026-08-19
- Status: PARTIAL
- Risk: R4
- Scope: Complete the isolated real FanMind restore drill without touching Production or Supabase Staging.
- Branch/PR: current restore workflows on repository; verify current branch/run before action.
- Work lock: no active exclusive lock recorded; acquire one before substantive continuation.
- Dependencies: existing isolated restore VM, PostgreSQL 17 target, runner-group/environment policy, backup/source commit and exact workflow state.
- Assumptions: established host/TLS/PostgreSQL/runner setup remains valid only after revalidation; do not rebuild from zero by default.
- Completed so far: dedicated isolated host and target database established; TLS/PostgreSQL compatibility and runner/workflow setup iterated; foundation recorded in TASK_LEDGER and restore docs/workflows.
- Still open: complete the real restore drill from the first unproven gate and produce current target-bound evidence/acceptance.
- Evidence so far: `TASK_LEDGER.md` FM-RST-001 plus current restore workflows/docs and prior verified setup history.
- Exact next step: preflight current restore workflow/run state, acquire work lock, continue from first unproven gate, and record execution receipt/evidence.
- Owner action needed: only if an environment/platform approval is required.

Existing active FanMind tasks must be reconciled against TASK_LEDGER, OPEN_LOOPS, branches, PRs, CI/security/workflow state, assumptions and evidence before they can be considered closed.
