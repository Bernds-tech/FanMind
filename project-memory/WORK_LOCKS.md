# Work Locks

Prevents two agents/sessions from independently working the same task.

## Rules
- Acquire a lock before substantive implementation.
- One active lock per Task ID.
- A second worker must inspect the existing lock and continue/coordinate rather than restart.
- Locks older than 24h are STALE, not free: reconcile `STARTED_WORK.md`, PRs, commits and receipts before replacing.
- Release only after updating `STARTED_WORK.md` and the execution receipt.

## Active locks

## LOCK-FM-RST-001-SCHEMA-ACL-RECOVERY-20260820
- Task: FM-RST-001
- Status: ACTIVE
- Holder: ChatGPT Restore schema-ACL recovery session 2026-08-20
- Branch/PR: `restore-schema-acl-recovery-20260820` / #987
- Acquired: 2026-08-20 16:10 Europe/Vienna
- Updated: 2026-08-20
- Scope: implement and verify the fail-closed recovery of the two Supabase schema ACL baselines (`graphql`, `graphql_public`) that the accepted Schema-2 authorization contract proves but the bare PostgreSQL restore did not materialize; no Production or Supabase Staging mutation.
- Resume from: operator evidence proved the real database restore completed, canonical TLS connectivity works, authorization role/container/extension preflight passes, archive ACL SQL is identical, and the remaining authorization mismatch is exactly eight missing schema grant tuples: four on `graphql` and four on `graphql_public`.
- Safety: repository code/tests/Project Memory only until reviewed PR acceptance; any later isolated-target mutation must use the protected R4 Restore path and never Production or Supabase Staging.

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

## LOCK-FM-MEM-008
- Task: FM-MEM-008
- Status: RELEASED
- Holder: scheduled Project Memory reconciliation 2026-08-20
- Branch/PR: `project-memory-v8-crosschat-impact` / #980
- Acquired: 2026-08-20 08:22 Europe/Vienna
- Released: 2026-08-20 after final exact head `704fec4b6264dd5a0dd83cc8e0029352672485d0` passed the complete gate set including Browser E2E and PR #980 merged as `22eb6aed5da4fde47860bbe12b118d3780c8a4a0`.
- Scope: V5 bookkeeping and exact-head evidence reconciliation for V8 governance only; no product/runtime/provider mutation.
- Resume from: no resume required unless V8 evidence becomes stale or contradictory; then create a new reconciliation lock rather than reviving this one.

All product workstreams remain tracked in `STARTED_WORK.md`; new locks must be acquired before substantive continuation of their respective task IDs.