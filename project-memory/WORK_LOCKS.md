# Work Locks

Prevents two agents/sessions from independently working the same task.

## Rules
- Acquire a lock before substantive implementation.
- One active lock per Task ID.
- A second worker must inspect the existing lock and continue/coordinate rather than restart.
- Locks older than 24h are STALE, not free: reconcile `STARTED_WORK.md`, PRs, commits and receipts before replacing.
- Release only after updating `STARTED_WORK.md` and the execution receipt.

## Template
```text
## LOCK-<TASK-ID>
- Task: <TASK-ID>
- Status: ACTIVE|STALE|RELEASED|SUPERSEDED
- Holder: agent/session identifier
- Branch/PR:
- Acquired: YYYY-MM-DD HH:MM TZ
- Updated: YYYY-MM-DD HH:MM TZ
- Scope:
- Resume from:
- Released:
```

## Active locks

None recorded yet.