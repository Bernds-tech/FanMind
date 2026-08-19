# Work Locks

Prevents two agents/sessions from independently working the same task.

## Rules
- Acquire a lock before substantive implementation.
- One active lock per Task ID.
- A second worker must inspect the existing lock and continue/coordinate rather than restart.
- Locks older than 24h are STALE, not free: reconcile `STARTED_WORK.md`, PRs, commits and receipts before replacing.
- Release only after updating `STARTED_WORK.md` and the execution receipt.

## Active locks

## LOCK-FM-MEM-005
- Task: FM-MEM-005
- Status: ACTIVE
- Holder: ChatGPT FanMind audit session 2026-08-19
- Branch/PR: `project-memory-v4-started-work` / #975
- Acquired: 2026-08-19 12:14 Europe/Vienna
- Updated: 2026-08-19 12:14 Europe/Vienna
- Scope: exhaustive FanMind-only reconciliation, Project Memory V5 integration and exact-head countercheck
- Resume from: `FANMIND_DEEP_AUDIT_2026-08-19.md`, then exact current PR #975 workflow state
- Released:

All product workstreams remain tracked in `STARTED_WORK.md`; this governance lock does not authorize simultaneous external Restore/Mobile/Provider mutations.
