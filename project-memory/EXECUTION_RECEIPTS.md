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

## RECEIPT-FM-MEM-005-20260819-1214
- Task: FM-MEM-005
- Started: 2026-08-19 12:14 Europe/Vienna
- Finished: 2026-08-19 after exact-head green merge
- Branch/PR: `project-memory-v4-started-work` / #975
- Preflight checked: repository metadata, AGENTS, Source of Truth, Project Memory current state/task/start/open/dependency/evidence registers, central #874, open issue set, current main history, restore runbook, Restore #944 evidence, current PR state and prior chat reconciliation.
- Prior attempts found: V1 #972 merged; V2 #973 and V3 #974 superseded into #975; V4 folded into later governance; extensive Restore/Staging/Mobile/AI/Meta work already exists and must not be rebuilt.
- Dependency result: exact-head governance dependencies satisfied; product finishline dependencies remain separately mapped in DEPENDENCIES.md, EXTERNAL_ACCEPTANCE.md and V6 `FINISHLINE_STATE.json`.
- Planned evidence: exhaustive evidence-bound audit plus independent GitHub/issue/source-truth crosscheck, machine finishline state, derived sales readiness, truth-drift scan and exact-head CI.
- Changes made: added deep audit; expanded CURRENT_STATE, TASK_LEDGER, STARTED_WORK, OPEN_LOOPS, DEPENDENCIES, EVIDENCE, ASSUMPTIONS, CONTRADICTIONS, FAILED_ATTEMPTS, WORK_LOCKS and handoff/status; added V6 `FANMIND_FINISHLINE.md`, `FINISHLINE_STATE.json`, `RESTORE_STATE_MACHINE.md`, `EXTERNAL_ACCEPTANCE.md`, sales-readiness and truth-drift scripts; upgraded Protocol/Quality to V6; integrated V6 checks into the existing Project Memory Quality workflow instead of adding a new checkout workflow.
- Checks/tests: exact head `2a62dc8337673be0b33acfd4338d0f452224e779` passed Project Memory Guard, Project Memory Quality V6 (including sales-readiness and truth-drift steps), Project Memory Status, FanMind CI including PG17 authorization roundtrip/Operations/Stripe policies/Production build, Landing Language CI, Supply Chain Security, CodeQL and Browser E2E for both public no-write and synthetic regular-user core flows.
- Final diff counterchecked: yes; the initially added dedicated V6 workflow was removed to preserve the reviewed hosted checkout inventory, and V6 checks were folded into the existing quality workflow.
- Regression/security countercheck: passed; no Production/DB/Restore/Stripe/Provider mutation, no red gate bypass, no new hosted-checkout workflow retained, destructive Remote retention and paid 1-EUR/day test remain outside standing authorization.
- Evidence produced: deep audit, finishline board/state, Restore state machine, external acceptance register, task/open-loop/dependency/evidence/assumption/contradiction records, derived sales-readiness and drift-check controls, exact-head green workflow set.
- Result status: ACCEPTED
- Open follow-up: maintain V6 and continue `FM-RST-001` from `BACKUP_ACCEPTED -> HOST_REVALIDATED`; unrelated finishline gates remain tracked separately.
- Work lock released: yes
- Merge evidence: PR #975 squash-merged to `main` as `b4bef882a55e8c0dd1dd33d0ad1c1664c3078d0d`.

## RECEIPT-FM-MEM-008-20260820
- Task: FM-MEM-008
- Started: 2026-08-19
- Finished: 2026-08-20 after exact-head green countercheck and merge
- Branch/PR: `project-memory-v8-crosschat-impact` / #980
- Preflight checked: current main, Project Memory V6/V7, current active registers, open loops/dependencies, exact PR head, all PR-triggered checks and prior cancelled Browser E2E evidence.
- Prior attempts found: prior head `ba48a7cab55ca45a98b62713bbc07989073589fc` was mostly green but Browser E2E was cancelled, so it was explicitly rejected as insufficient R3 countercheck evidence; initial V8 branch also omitted mandatory V5 active-work bookkeeping.
- Dependency result: V5 bookkeeping repaired; generated `PROJECT_STATUS.md` refreshed; all V8 prerequisites retained without mutating product/runtime/provider state.
- Planned evidence: exact-head governance/CI/security checks plus independent Browser E2E on the same revision.
- Changes made: reconciled TASK_LEDGER, STARTED_WORK, WORK_LOCKS, OPEN_LOOPS, EVIDENCE and generated Project Status while preserving V8 implementation.
- Checks/tests: exact head `704fec4b6264dd5a0dd83cc8e0029352672485d0` passed Project Memory Guard, Project Memory Quality, Project Memory Status, FanMind CI, Landing Language CI, Supply Chain Security, CodeQL and Browser E2E run #915.
- Final diff counterchecked: yes.
- Regression/security countercheck: passed; V8 remained governance-only and did not weaken V6/V7 finishline or protected provider/Production boundaries.
- Evidence produced: exact-head workflow set and merge `22eb6aed5da4fde47860bbe12b118d3780c8a4a0`.
- Result status: ACCEPTED via IMPLEMENTED -> VERIFIED -> COUNTERCHECKED -> ACCEPTED.
- Open follow-up: maintain V8 and downgrade to revalidation if handoff/evidence drifts.
- Work lock released: yes.

## RECEIPT-FM-SEC-001-20260820-DISCOVERY
- Task: FM-SEC-001
- Started: 2026-08-20
- Finished: read-only discovery/reconciliation still active; no protected mutation performed
- Branch/PR: `automation/postmerge-reconcile-20260820`; issue #982
- Preflight checked: current FanMind main, finishline/tasks/open loops/dependencies/evidence/assumptions/contradictions, live Supabase project health/security advisors, controlled Production trigger-hardening SQL/runbook and Staging workspace-provisioning RPC migration.
- Prior attempts found: Production trigger hardening already has a dedicated checksum-pinned transactional control and runbook; it must not be rebuilt or auto-applied. Staging workspace RPC is intentionally granted to authenticated users in code and must not be blindly revoked.
- Dependency result: read-only evidence is sufficient to classify the gap, not to mutate Production/Auth.
- Planned evidence: provider advisor scan independent of repository implementation evidence; later exact catalog/ACL verify and post-action advisor scan if a protected action is approved.
- Changes made: opened issue #982 and reconciled the new R3 security gap into Project Memory registers.
- Checks/tests: live Production and Staging projects are `ACTIVE_HEALTHY`; fresh security advisor scans captured current warnings.
- Final diff counterchecked: yes for reconciliation scope; no runtime/database diff.
- Regression/security countercheck: fail-closed. No DB/Auth/provider mutation, no broad grants/revokes, and no artificial browser RLS policies were introduced.
- Evidence produced: fresh provider target/advisor evidence plus repository hardening crosscheck.
- Result status: RECONCILIATION_REQUIRED.
- Open follow-up: exact read-only Production hardening verify, Staging RPC exception review and leaked-password setting decision; separately authorize any later state-changing action.
- Work lock released: no mutating lock was acquired; acquire one before any Production DB/Auth change.

## RECEIPT-FM-SEC-001-NBA-SYNC-20260820
- Task: FM-SEC-001 / Project Memory NBA orchestration reconciliation
- Started: 2026-08-20 11:43 Europe/Vienna
- Finished: branch implementation and reconciliation completed; acceptance is contingent on final exact-head green checks and merge of PR #986.
- Branch/PR: `project-memory-security-nba-sync-20260820` / #986
- Preflight checked: FanMind Project Memory preflight, current `main` `06234adb0948959a5a21ce627da53567ab0c38d2`, `CURRENT_STATE.md`, `NEXT_BEST_ACTIONS.json`, generated `NEXT_BEST_ACTION.md`, `AUTO_HANDOFF.md`, `FINISHLINE_STATE.json`, `AUTHORIZATIONS.md`, issue #982, central finishline #874, active FM-SEC-001 registers, current PR/CI state and the existing V8 generator/quality controls.
- Prior attempts found: the security discovery had already been reconciled into current state/issue #982, but the NBA catalog remained dated 2026-08-19 and omitted `FM-SEC-001`, causing the generator to select Mobile despite the newer security-first restart truth.
- Dependency result: standing authorization covers Project Memory governance branches/PRs; the correction is read-only governance and requires no Production/Staging/Auth/provider mutation.
- Planned evidence: machine selector output, automatic handoff equality, Project Memory Guard/Quality/Status, broader FanMind CI/Landing/CodeQL/Browser E2E, and final branch diff limited to Project Memory/governance files.
- Changes made: added `NBA-SECURITY-READONLY` priority 15 mapped to `FM-SEC-001`/`meta_security`; regenerated the selected NBA and automatic handoff; added a quality invariant tying `CURRENT_STATE.md` first-safe task to the catalog and generated selection; recorded reconciliation finding `RECON-2026-010`.
- Checks/tests: initial implementation head passed Project Memory Guard, Project Memory Quality (including the new invariant), Project Memory Status and Landing Language CI before this audit receipt was appended; all PR-triggered checks rerun on the final receipt head before merge.
- Final diff counterchecked: yes; scope is Project Memory/governance only and contains no product/runtime/SQL/Auth/provider mutation.
- Regression/security countercheck: fail-closed. Restore remains deferred, Mobile remains parallel-safe after Security, Sales remains blocked, Phase 8 remains not started, and the new action explicitly prohibits Apply/Auth/provider mutations.
- Evidence produced: PR #986, `RECON-2026-010`, generated `NBA-SECURITY-READONLY` handoff and the strengthened quality invariant.
- Result status: COUNTERCHECKED on the governance design; becomes ACCEPTED only after final PR head remains green and #986 merges.
- Open follow-up: after merge, execute the selected `FM-SEC-001` read-only Production hardening verify; do not perform Apply or Auth-setting mutations under this governance repair.
- Work lock released: yes for this repository-governance sync; no Production DB/Auth mutating lock was acquired.

A receipt is required for meaningful code/config/infra/governance work. Never include secrets, credentials, private backup material or protected evidence values here.

## RECEIPT-FM-RST-001-SCHEMA-ACL-20260820
- Task: FM-RST-001
- Started: 2026-08-20 16:10 Europe/Vienna
- Finished: repository implementation and branch-level reconciliation completed; exact-head R4 acceptance and protected isolated rerun remain pending.
- Branch/PR: `restore-schema-acl-recovery-20260820` / #987
- Preflight checked: current `main` `12d7ecd4cb0c8b3a1a8104745479d3cf29a1dc2f`, AGENTS, Source of Truth, Project Memory Protocol/Current State/Finishline/NBA/Owner Inbox/Handoff/Started Work/Locks/Open Loops/Task Ledger/Dependencies/Decisions/Failed Attempts, Restore state machine/runbook, current PR/CI and operator evidence from the isolated Restore target.
- Prior attempts found: the real isolated `pg_restore` completed; the unchanged receipt-bound authorization postcheck failed only after restore. Later read-only reconciliation localized the source/target difference to exactly eight missing `USAGE` schema grant tuples across `graphql` and `graphql_public`. Earlier manual diagnostics that hardcoded `127.0.0.1` were not valid evidence for the canonical TLS host and are not used as the root-cause basis. No rerestore or manual grant repair is accepted.
- Dependency result: existing Restore host/PG17/TLS/runner/backup foundation is reused; no second server and no Production/Supabase-Staging target. Any future target write remains inside the protected `restore-drill` database workflow with exact dispatch confirmation, both non-Production/Restore write gates, target acknowledgement, TLS `verify-full` and the existing receipt-bound target preflight.
- Planned evidence: exact eight-tuple classifier, exact schema/owner/non-extension/ACL precondition, bounded grant SQL and inverse rollback, unchanged full authorization fingerprint after apply, focused negative tests, CI ownership of the new test, full exact-head PR CI/security/governance set, then a fresh protected isolated Restore rerun through `DB_POSTCHECKED`.
- Changes made: added `restore-schema-acl-recovery.mjs`; wired it immediately after `pg_restore` and before the unchanged authorization postcheck; added automatic rollback+verification on post-apply mismatch; added focused tests including explicit protected R4 workflow-gate assertions; added the new test to required `test:operations`; recorded root cause and active R4 lock.
- Checks/tests: initial PR head passed Project Memory Guard/Quality/Status, Landing, Browser E2E and CodeQL; FanMind CI had exactly one policy failure because the new test file was not yet included in a required CI root. That ownership gap was corrected in `package.json`; the focused test now also asserts the exact protected Restore confirmation/write/TLS gates. Final exact-head checks are still required before merge.
- Final diff counterchecked: yes for current scope; final exact-head CI countercheck remains pending.
- Regression/security countercheck: fail-closed by design. Recovery is a no-op on a matching contract, rejects any invariant drift or grant delta other than eight, requires exact two schemas owned by `supabase_admin`, rejects extension membership/unexpected ACL entries, applies no broad grants, and has an exact inverse rollback. The final receipt-bound authorization contract remains unchanged as the acceptance oracle.
- Evidence produced: PR #987, focused recovery tests, protected-gate policy test, current GitHub CI history and the isolated operator/source reconciliation record.
- Result status: IMPLEMENTED.
- Open follow-up: wait for the final exact PR head to pass all required checks; then merge. Only after merge may the protected isolated database Restore be freshly rerun. Do not mark `DB_POSTCHECKED`, `COUNTERCHECKED` or `ACCEPTED` until that external R4 evidence exists.
- Work lock released: no; keep `LOCK-FM-RST-001-SCHEMA-ACL-RECOVERY-20260820` active until merge/countercheck reconciliation.
