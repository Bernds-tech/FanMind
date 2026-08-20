# Work Locks

Prevents two agents/sessions from independently working the same task.

## Rules
- Acquire a lock before substantive implementation.
- One active lock per Task ID.
- A second worker must inspect the existing lock and continue/coordinate rather than restart.
- Locks older than 24h are STALE, not free: reconcile `STARTED_WORK.md`, PRs, commits and receipts before replacing.
- Release only after updating `STARTED_WORK.md` and the execution receipt.

## Active locks

## LOCK-FM-MEM-008
- Task: FM-MEM-008
- Status: ACTIVE
- Holder: scheduled Project Memory reconciliation 2026-08-20
- Branch/PR: `project-memory-v8-crosschat-impact` / #980
- Acquired: 2026-08-20 08:22 Europe/Vienna
- Updated: 2026-08-20
- Scope: V5 bookkeeping and exact-head evidence reconciliation for the existing V8 governance PR only; no product/runtime/provider mutation.
- Resume from: fresh exact-head CI after bookkeeping changes; require Browser E2E and all existing gates before acceptance.
- Released: pending successful exact-head countercheck/merge or explicit supersession.

## Released locks

## LOCK-FM-MEM-005
- Task: FM-MEM-005
- Status: RELEASED
- Holder: ChatGPT FanMind audit/V6 session 2026-08-19
- Branch/PR: `project-memory-v4-started-work` / #975
- Acquired: 2026-08-19 12:14 Europe/Vienna
- Updated: 2026-08-19
- Scope: exhaustive FanMind-only reconciliation, Project Memory V2-V6 integration and exact-head countercheck
- Resume from: no resume required; task accepted on main
- Released: after exact head `2a62dc8337673be0b33acfd4338d0f452224e779` passed all applicable gates and PR #975 merged as `b4bef882a55e8c0dd1dd33d0ad1c1664c3078d0d`

All product workstreams remain tracked in `STARTED_WORK.md`; new locks must be acquired before substantive continuation of their respective task IDs.