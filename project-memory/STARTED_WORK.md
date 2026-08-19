# Started Work Register

Canonical register for FanMind work that has started but is not yet fully completed.

## Rules
- Add an entry as soon as substantive work begins.
- Every active `IN_PROGRESS`, `PARTIAL`, `BLOCKED`, `IMPLEMENTED_NOT_VERIFIED` or `RECONCILIATION_REQUIRED` task must appear here until closed or superseded.
- Assign `Risk: R1|R2|R3|R4` before implementation continues.
- Never delete history; close with status, date, result, evidence and next step.
- Cross-link Task ID, Change Request, PR/branch, dependencies, work lock and execution receipt.

## Active work

## FM-MEM-005
- Started: 2026-08-19 08:40 Europe/Vienna
- Updated: 2026-08-19
- Status: IMPLEMENTED_NOT_VERIFIED
- Risk: R3
- Scope: Consolidated Project Memory V2-V6 plus exhaustive FanMind finishline audit and machine-enforced finishline controls.
- Branch/PR: `project-memory-v4-started-work` / PR #975
- Work lock: PR #975 is the only active FanMind memory/finishline integration path.
- Dependencies: exact-head FanMind CI, Browser E2E, Landing, Supply Chain, CodeQL, Project Memory gates and `FanMind Finishline V6`.
- Assumptions: mergeable is not equivalent to accepted; evidence must match latest head; sales readiness is derived, never asserted manually.
- Completed so far: V2-V6 consolidated; #973/#974 superseded; V5 controls and deep audit added; V6 adds `FINISHLINE_STATE.json`, `FANMIND_FINISHLINE.md`, `RESTORE_STATE_MACHINE.md`, `EXTERNAL_ACCEPTANCE.md`, sales-readiness and truth-drift scripts plus V6 CI.
- Still open: exact-head full CI and merge; then close receipt/lock and mark accepted on main.
- Evidence so far: PR #975, Project Memory files and V6 scripts/workflow.
- Exact next step: inspect latest-head checks, fix only actual failures, merge only fully green.
- Owner action needed: no unless GitHub/platform requires protected approval.

## FM-RST-001
- Started: 2026-08-17
- Updated: 2026-08-19
- Status: PARTIAL
- Risk: R4
- Scope: Complete the isolated real FanMind restore drill without touching Production or Supabase Staging.
- Branch/PR: current restore workflows on main; no new parallel restore branch until current evidence is revalidated.
- Work lock: acquire before next mutating restore step.
- Dependencies: FM-DEP-001; current Org runner-group/workflow-allowlist/JIT policy; existing isolated host/target; exact Schema-2 Full Backup; protected environment.
- Assumptions: operator-session setup exists but live state may drift; revalidate before use.
- Completed so far: ACL/default-ACL/Owner/Role/DB-container/Extension recovery contract merged/deployed; real PG17 two-cluster CI passed; new Schema-2 encrypted Full Backup validated and offsite; checksum verification passed; isolated Ubuntu/PG17.11/Node24.19/TLS/target/runner foundation established in operator session.
- Still open: live policy/host/target/artifact revalidation; Resource Readiness; Target Compatibility; DB Restore; DB postcheck; Storage; Server Config; Cleanup; final evidence/acceptance.
- Evidence so far: PR #943, issue #944, issue #874, Full Backup `b74c1c60-1d61-4a39-9f0d-648ec003a12c`, Verification `006e6ab8-8f5c-43c1-ac68-6570e992a7a1`, deep audit.
- Exact next step: follow `RESTORE_STATE_MACHINE.md` from current `BACKUP_ACCEPTED` state with fresh read-only revalidation; do not reprovision the server.
- Owner action needed: only for platform/environment/mutating gate confirmations that remain required.

## FM-MOB-001
- Started: before 2026-08-19
- Updated: 2026-08-19
- Status: IMPLEMENTED_NOT_VERIFIED
- Risk: R3
- Scope: Signed Android/iOS Mobile release and real-device/store acceptance.
- Branch/PR: existing mobile implementation on main; external acceptance path only unless a defect is found.
- Work lock: acquire before signing/build/store mutation.
- Dependencies: Supabase redirect, EAS project/environments/token, signing credentials, Apple Developer/App Store Connect for iOS.
- Assumptions: repository CI/build evidence does not prove a signed device build.
- Completed so far: native app core, auth/recovery, SecureStore/Purge, contacts/knowledge/AI/followups, offline cache, push foundation, icon/splash/privacy/store metadata and CI/control workflows.
- Still open: redirect/device recovery; EAS/signing; signed Android + real device; iOS/TestFlight + real device; push/store portal evidence.
- Evidence so far: issues #584/#690, Source of Truth, mobile docs/tests.
- Exact next step: read-only EAS/Supabase resource verification before any signing/build action.
- Owner action needed: external account/signing setup where platform requires it.

## FM-AI-001
- Started: before 2026-08-19
- Updated: 2026-08-19
- Status: PARTIAL
- Risk: R3
- Scope: KI Standard/Plus/Ultra product, quality, cost, Stripe lifecycle and activation readiness.
- Branch/PR: current AI/billing foundations on main.
- Work lock: acquire before modifying tier policy, Stripe lifecycle or controlled SQL.
- Dependencies: written product decisions, private quality/cost evidence, current Staging lifecycle, Legal/Tax, explicit Production activation.
- Assumptions: Staging Test prices existing does not mean Plus/Ultra is activated or fully accepted.
- Completed so far: Standard active; Plus/Ultra prices/policy, entitlement resolver, Staging storage/foundations, Test catalog foundation, lifecycle/ledger controls, monitoring/recommendation/eval tooling.
- Still open: final models/quotas/overage/context/switch/refund decisions; private quality/cost evidence; full current Staging lifecycle; legal/tax; explicit production activation.
- Evidence so far: issue #560, issue #874, Source of Truth, `src/config/aiTiers.mjs`.
- Exact next step: reconcile current Staging lifecycle evidence against Gate 4 and list only truly missing decisions/tests.
- Owner action needed: yes for product/financial decisions and any protected external activation.

## FM-META-001
- Started: before 2026-08-19
- Updated: 2026-08-19
- Status: PARTIAL
- Risk: R3
- Scope: Meta Events Manager/external Meta acceptance and final non-Social security proof.
- Branch/PR: existing Meta foundation on main.
- Work lock: acquire before Meta app/permission/production activation changes.
- Dependencies: normal-browser Meta Events Manager access, Meta app/test assets, App Review/permissions, legal/privacy acceptance.
- Assumptions: technical pixel calls and Staging migrations are not external Events Manager/App Review acceptance.
- Completed so far: consent-gated PageView-only Pixel production code; advanced Facebook/Instagram OAuth/token/content/conversation foundation; relevant Staging migrations/controls.
- Still open: Events Manager positive/negative browser evidence; no-PII evidence; App Review/permissions and real account/webhook/conversation E2E; final relevant security/legal evidence.
- Evidence so far: #714, Source of Truth, Meta tests/migrations.
- Exact next step: external normal-browser Events Manager acceptance, keeping conversion events/advanced matching/CAPI disabled.
- Owner action needed: external Meta account/access and legal approval where required.

## FM-SOC3-001
- Started: foundation work before 2026-08-19
- Updated: 2026-08-19
- Status: PARTIAL
- Risk: R3
- Scope: Phase 3 real Facebook, Instagram and WhatsApp connectors.
- Branch/PR: existing Meta/WhatsApp foundations on main.
- Work lock: acquire per connector before external mutation.
- Dependencies: non-Social finishline sufficiently closed; provider credentials/permissions; legal boundaries.
- Assumptions: existing foundation is not a live accepted connector.
- Completed so far: Facebook/Instagram foundation advanced; dormant WhatsApp inbound foundation merged.
- Still open: final real E2E for all three, including auth, tenant isolation, idempotency, token/revocation/reconnect and no-auto-send evidence.
- Evidence so far: Source of Truth, #874 Gate 6, Meta/WhatsApp commits.
- Exact next step: run Social only after Gates 2-5 are sufficiently closed; reuse existing Meta foundation.
- Owner action needed: provider credentials/App Review where externally required.

## FM-SOC7-001
- Started: feasibility assessment before 2026-08-19
- Updated: 2026-08-19
- Status: PARTIAL
- Risk: R3
- Scope: Phase 7 TikTok, X/Twitter, Discord and conditional OnlyFans.
- Branch/PR: no accepted real connector set yet.
- Work lock: acquire per platform before implementation.
- Dependencies: Phase 3/non-Social finishline; official platform scope; X cost approval; OnlyFans official/contractual feasibility.
- Assumptions: Login/content-posting capability is not equivalent to inbox/DM/comment capability.
- Completed so far: platform feasibility notes in #874.
- Still open: official scope revalidation and real connector/E2E work.
- Evidence so far: #874 platform-feasibility comment.
- Exact next step: after prior gates, verify current official API capability before coding each connector.
- Owner action needed: yes for paid X/API spend or external platform onboarding where required.

## FM-SALES-001
- Started: sales materials prepared before 2026-08-19
- Updated: 2026-08-19
- Status: BLOCKED
- Risk: R2
- Scope: final technical sales handoff to Gerhard.
- Branch/PR: sales docs already exist; no new sales claim until finishline accepted.
- Work lock: none required until closeout.
- Dependencies: FM-SOC3-001, FM-SOC7-001 and final exact-release demo/production truth.
- Assumptions: Phase 4 completion or existing sales docs do not equal sales handoff.
- Completed so far: sales one-pager/demo script/objection material prepared and canonical truth aligned to Phase-7 finishline.
- Still open: required social acceptance, final 5-minute Production demo, final reader/material sync, formal technical handoff.
- Evidence so far: Source of Truth, #874, commit `74c3a6aa357215c52d3a4d9b01ba8513bba1b57f`.
- Exact next step: remain blocked until social finishline; do not prematurely mark sellable technical handoff.
- Owner action needed: final operator/sales acceptance at handoff.

## FM-LEGAL-001
- Started: before 2026-08-19
- Updated: 2026-08-19
- Status: BLOCKED
- Risk: R3
- Scope: final external law/tax/AVV/provider evidence.
- Branch/PR: technical legal evidence framework on main.
- Work lock: none for collecting evidence; protected review for public/legal mutations.
- Dependencies: actual advisor/register/provider documents.
- Assumptions: technical truth cannot substitute legal/tax approval.
- Completed so far: confirmed operator/business facts and technical reader/evidence framework.
- Still open: tax/register/UID, legal review, final AVV/subprocessor/region/transfer/retention evidence and acceptance.
- Evidence so far: issue #564.
- Exact next step: incorporate only confirmed external evidence when received.
- Owner action needed: yes/external advisors.