# FanMind Session Handoff

Update this file at the end of a substantial work session or whenever work is paused at a non-obvious state. It is the fastest safe restart point, but it never overrides code, tests or canonical source-of-truth documents.

## Current handoff
- Updated: 2026-08-22 15:52 Europe/Vienna
- Active focus: `FM-RST-001` R4 checkout CA-truststore reconciliation after protected read-only run `32568632008` failed before Resource Readiness/Target Compatibility. Current work is repository-only on `restore-checkout-ca-truststore-20260822`; no retry, JIT creation or runtime/database mutation is authorized by this repair.
- Start here: run the complete Project Memory/Restore preflight, read `RESTORE_CHECKOUT_CA_TRUSTSTORE_RECONCILIATION_2026-08-22.md`, inspect issue #944, current branch/PR/exact-head CI and run `32568632008`/job `97020836458`. Current GitHub/runtime evidence overrides older memory prose.
- Accepted governance: `FM-MEM-005` V6 accepted; `FM-MEM-008` V8 accepted after final PR #980 head `704fec4b6264dd5a0dd83cc8e0029352672485d0` passed Guard/Quality/Status, FanMind CI, Landing, Supply Chain, CodeQL and Browser E2E run #915, then merged as `22eb6aed5da4fde47860bbe12b118d3780c8a4a0`.
- Active IDs: `FM-RST-001`, `FM-MOB-001`, `FM-AI-001`, `FM-META-001`, `FM-SOC3-001`, `FM-SOC7-001`, `FM-SALES-001`, `FM-LEGAL-001`, `FM-SEC-001`.
- Accepted foundation: `FM-STG-001`; Production operations baseline: `FM-OPS-001` verified; `sales_ready=false`; Phase 8 not started.
- Highest-risk current work: `FM-RST-001` Risk R4; accepted progression remains `BACKUP_ACCEPTED`, with later target/readiness evidence held in `RECONCILIATION_REQUIRED`. The current checkout repair requires no owner action; any future protected run/JIT/write remains separate.
- Security deviation: both Supabase targets are currently `ACTIVE_HEALTHY`, but Production advisors still show three trigger-helper mutable-search-path warnings, browser execution of retired `trim_conversation_messages_to_latest_50()` as `SECURITY DEFINER`, and leaked-password protection disabled. Staging flags authenticated `ensure_current_user_workspace(...)` SECURITY DEFINER plus leaked-password protection disabled. Issue #982 and `FM-SEC-001` hold this unfinished work.
- Production hardening do-not-repeat: the checksum-pinned transactional trigger-hardening SQL/runbook already exists. Merge/deploy does not auto-apply it. Do not rebuild it, revoke intentional Staging RPC access blindly, invent browser RLS policies for service-only tables, or mutate Production/Auth before read-only target evidence and existing protected authorization gates.
- Critical Restore contradiction: repo is Organization-owned `FanMind/FanMind`, while old Restore prose still says user-owned/future-org. Do not repeat transfer work; runner-group Admin policy still needs live revalidation before R4 write.
- Restore do-not-repeat: no second server; do not rebuild Ubuntu/PG17.11/Node24.19/TLS/target/runner foundation absent verified drift; do not retry run `32568632008`, reuse runner ID `40`, export empty CA paths, reset the empty target or delete its rollback quarantine; never target Production or Supabase Staging.
- Restore evidence already obtained: PRs #943/#987/#990; real PG17 roundtrip; accepted Schema-2 Full Backup and checksum Verification; independently checked empty target; run `32568632008` Host-1 success plus bounded Host-2 checkout failure and clean one-job JIT teardown. Resource/Target steps did not run; real DB/Storage/Config/Cleanup acceptance remains open.
- Sales truth: Phase 4 is not sales handoff. Phase 3 = Facebook/Instagram/WhatsApp; Phase 7 = TikTok/X/Discord/conditional OnlyFans; Phase 8 not started. Handoff only after required gates are accepted and exact-release final demo passes.
- Exact current step: pin all Restore CA consumers to the root-owned Ubuntu truststore, require pre-checkout ownership/mode/type assertions, add regression tests, update the watched drift baseline, then open and exact-head-countercheck a PR. No workflow dispatch under this step.
- Parallel safe next product action remains Mobile read-only EAS/Supabase resource reconciliation; no signing/submission/provider mutation without its required external step.
- User input still required: only where external/platform/financial/legal/protected mutation policy requires it; routine repository analysis/fixes/PR/green merge are standing-authorized.

## Mandatory handoff fields for future sessions
- Updated date/time
- Active task/change IDs
- Exact last verified result
- Exact first unproven step
- Open loops/blockers
- Failed approaches/do-not-repeat references
- Relevant PR/commit/workflow/evidence references
- User input still required, if any
