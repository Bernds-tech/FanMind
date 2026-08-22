# Work Locks

Prevents two agents/sessions from independently working the same task.

## Rules
- Acquire a lock before substantive implementation.
- One active lock per Task ID.
- A second worker must inspect the existing lock and continue/coordinate rather than restart.
- Locks older than 24h are STALE, not free: reconcile `STARTED_WORK.md`, PRs, commits and receipts before replacing.
- Release only after updating `STARTED_WORK.md` and the execution receipt.

## Active locks

## LOCK-FM-RST-001-CHECKOUT-CA-TRUSTSTORE-20260822
- Task: FM-RST-001
- Status: ACTIVE
- Holder: ChatGPT Restore checkout CA-truststore reconciliation session 2026-08-22
- Branch/PR: `restore-checkout-ca-truststore-20260822` / #991
- Acquired: 2026-08-22 15:52 Europe/Vienna
- Updated: 2026-08-22
- Scope: pin the six path-valued CA environment controls in all self-hosted Restore jobs to Ubuntu's root-owned system truststore, validate that boundary before checkout, add regression tests and reconcile run `32568632008`; no workflow dispatch, JIT creation or runtime/database mutation.
- Resume from: run `32568632008` passed dispatch and Host-1, then protected job `97020836458` failed in checkout with an empty CA-file path before Resource Readiness or Target Compatibility. Runner ID `40` completed one-job cleanup and must not be retried/reused.
- Safety: repository code/tests/Project Memory only until exact-head reviewed PR acceptance; any later read-only run or isolated-target mutation remains separately R4-controlled and never targets Production or Supabase Staging.

## Released locks

## LOCK-FM-RST-001-SCHEMA-ACL-RECOVERY-20260820
- Task: FM-RST-001
- Status: SUPERSEDED
- Holder: ChatGPT Restore schema-ACL recovery session 2026-08-20
- Branch/PR: `restore-schema-acl-recovery-20260820` / #987
- Acquired: 2026-08-20 16:10 Europe/Vienna
- Released: 2026-08-22 after reconciliation proved PR #987 merged as `b6bc368915d50dd2903b83b87c7ca25eb0ed6e18`; later target/readiness evidence superseded the implementation resume point.
- Scope: bounded recovery of the eight proven missing schema grant tuples on `graphql` and `graphql_public`; no Production or Supabase Staging mutation.
- Resume from: no repository implementation resume required. The current Restore blocker is the separately recorded checkout CA-truststore reconciliation.

## LOCK-FM-MOB-001-EAS-PROJECT-BINDING-20260821
- Task: FM-MOB-001
- Status: RELEASED
- Holder: ChatGPT Mobile EAS project-binding hardening session 2026-08-21
- Branch/PR: `mobile-eas-project-binding-hardening-20260821` / #988
- Acquired: 2026-08-21
- Released: 2026-08-21 after exact head `6f42a5897aabb3387a74149010dee2b5fb2c92cd` passed Project Memory Guard/Quality/Status, FanMind CI, Landing Language CI, Supply Chain Security, CodeQL and Browser E2E, then squash-merged as `e20efd475e475101226f266118b9cfed7972243a`.
- Scope: harden the existing read-only Mobile release and signed-build resource checks so successful `eas project:info` lookup is bound to the exact expected EAS owner, `fanmind-mobile` slug and project ID before any later build gate; no credential creation, build, submit, update, signing or provider mutation.
- Resume from: no repository implementation resume required. The next Mobile step is the existing protected read-only EAS resource-readiness run; external EAS, Supabase Auth, signing, stores and real-device acceptance remain open.

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
