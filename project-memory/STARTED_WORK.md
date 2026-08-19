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

Existing active FanMind tasks must be reconciled against TASK_LEDGER, OPEN_LOOPS, branches, PRs, CI/security/workflow state, assumptions and evidence before they can be considered closed.
