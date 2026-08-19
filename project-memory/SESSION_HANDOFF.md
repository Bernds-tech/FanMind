# FanMind Session Handoff

Update this file at the end of a substantial work session or whenever work is paused at a non-obvious state. It is the fastest safe restart point, but it never overrides code, tests or canonical source-of-truth documents.

## Current handoff
- Updated: 2026-08-19 12:51 Europe/Vienna
- Active focus: Project Memory V6 is accepted on `main`; continue the real isolated Restore from the first unproven R4 state.
- Start here: read `EXECUTION_POLICY.md`, `project-memory/PROTOCOL.md`, `project-memory/FANMIND_DEEP_AUDIT_2026-08-19.md`, `project-memory/FANMIND_FINISHLINE.md`, `project-memory/FINISHLINE_STATE.json`, `project-memory/EXTERNAL_ACCEPTANCE.md`, `project-memory/RESTORE_STATE_MACHINE.md`, `CURRENT_STATE.md`, `STARTED_WORK.md`, `WORK_LOCKS.md`, `OPEN_LOOPS.md`, `TASK_LEDGER.md`, `DEPENDENCIES.md`, `EVIDENCE.md`, `ASSUMPTIONS.md`, `CONTRADICTIONS.md`, `DECISIONS.md`, `FAILED_ATTEMPTS.md`, then inspect #874 and current Git/PR/CI/runtime/provider state.
- Accepted governance: `FM-MEM-005` accepted; PR #975 exact head `2a62dc8337673be0b33acfd4338d0f452224e779` passed all applicable checks and merged as `b4bef882a55e8c0dd1dd33d0ad1c1664c3078d0d`.
- Active IDs: `FM-RST-001`, `FM-MOB-001`, `FM-AI-001`, `FM-META-001`, `FM-SOC3-001`, `FM-SOC7-001`, `FM-SALES-001`, `FM-LEGAL-001`.
- Accepted foundation: `FM-STG-001`; Production operations baseline: `FM-OPS-001` verified.
- V6 machine truth: `sales_ready=false`, Phase 8 not started; Sales Readiness and Canonical Truth Drift run inside `Project Memory Quality` on PR/manual/daily schedule.
- Highest-risk current work: `FM-RST-001` Risk R4; current highest proven Restore state is `BACKUP_ACCEPTED`.
- Critical contradiction: current repo is Organization-owned `FanMind/FanMind`, while old Restore canonical prose still says user-owned/future-org. Do not repeat transfer work; do not assume runner-group Admin policy is current without live revalidation.
- Restore do-not-repeat: no second server; do not rebuild Ubuntu/PG17.11/Node24.19/TLS/target/runner foundation absent drift; never target Production or Supabase Staging.
- Restore evidence already obtained: PR #943/`14a1e2d...`, real PG17 roundtrip, accepted Schema-2 Full Backup `b74c1c60...`, checksum Verification `006e6ab8...`; real DB/Storage/Config/Cleanup acceptance remains open.
- Sales truth: Phase 4 is not sales handoff. Phase 3 = Facebook/Instagram/WhatsApp; Phase 7 = TikTok/X/Discord/conditional OnlyFans; Phase 8 not started. Handoff only after machine-required gates are accepted and exact-release final demo passes.
- Exact first unproven step: Restore `BACKUP_ACCEPTED -> HOST_REVALIDATED`, beginning with read-only host/toolchain/TLS/target revalidation and current Organization runner-group/workflow-allowlist/JIT policy evidence.
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
