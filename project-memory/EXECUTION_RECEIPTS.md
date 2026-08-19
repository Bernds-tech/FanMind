# Execution Receipts

Append-only audit trail proving the mandatory preflight and independent countercheck were performed.

## Required receipt fields
```text
## RECEIPT-<TASK-ID>-<YYYYMMDD-HHMM>
- Task:
- Started:
- Finished:
- Branch/PR:
- Preflight checked: AGENTS, CURRENT_STATE, TASK_LEDGER, CHANGE_REQUESTS, DECISIONS, FAILED_ATTEMPTS, OPEN_LOOPS, DEPENDENCIES, DO_NOT_ASSUME, STARTED_WORK, WORK_LOCKS, Git/PR/CI/runtime state
- Prior attempts found:
- Dependency result:
- Planned evidence:
- Changes made:
- Checks/tests:
- Final diff counterchecked: yes|no
- Regression/security countercheck:
- Evidence produced:
- Result status:
- Open follow-up:
- Work lock released: yes|no
```

A receipt is required for meaningful code/config/infra/governance work. Never include secrets, credentials, private backup material or protected evidence values.