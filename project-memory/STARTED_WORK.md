# Started Work Register

Canonical register for FanMind work that has started but is not yet fully completed.

## Rules
- Add an entry as soon as substantive work begins.
- Every active `IN_PROGRESS`, `PARTIAL`, `BLOCKED`, `IMPLEMENTED_NOT_VERIFIED` or `RECONCILIATION_REQUIRED` task must appear here until closed or superseded.
- Assign `Risk: R1|R2|R3|R4` before implementation continues.
- Never delete history; close with status, date, result, evidence and next step.
- Cross-link Task ID, Change Request, PR/branch, dependencies, work lock and execution receipt.

## Active work

## FM-RST-001
- Started: 2026-08-17
- Updated: 2026-08-22
- Status: RECONCILIATION_REQUIRED
- Risk: R4
- Scope: Complete the isolated real FanMind Restore drill without touching Production or Supabase Staging; current repository work is limited to the checkout CA-truststore defect proven by protected read-only run `32568632008`.
- Branch/PR: `restore-checkout-ca-truststore-20260822` / #991.
- Work lock: `LOCK-FM-RST-001-CHECKOUT-CA-TRUSTSTORE-20260822` ACTIVE.
- Dependencies: FM-DEP-001; current Org runner-group/workflow-allowlist/JIT policy; existing isolated host/target; exact Schema-2 Full Backup; protected environment.
- Assumptions: the established empty isolated target and connection-disabled rollback quarantine remain unchanged; all mutable host, target, backup and TLS evidence must be revalidated before any later run or write.
- Completed so far: PR #987 merged the bounded schema-ACL recovery; the disposable target was independently reset to the empty baseline while retaining the prior populated target as quarantine; PR #990 removed `GIT_SSL_NO_VERIFY`; Resource Readiness run `32568632008` passed dispatch and Host-1 re-attestation, then Host-2 runner ID `40` failed only in checkout and cleaned its one-job credentials/configuration.
- Latest reconciled blocker: every self-hosted Restore job exported path-valued CA environment variables as present-but-empty. Git/cURL could not read an empty CA file path, so all three checkout fetch attempts failed before Resource Readiness or Target Compatibility executed. Independent local reproduction matched the live error and succeeded with Ubuntu's fixed system truststore.
- Still open: exact-head CI/security/governance countercheck and merge of the bounded CA-truststore repair; only afterwards may a fresh protected read-only Resource Readiness run be separately prepared and approved. Database Restore, Storage, Server Config, Cleanup and final acceptance remain open.
- Evidence so far: PRs #943/#987/#990, issue #944, issue #874, accepted Full Backup/Verification records, prior isolated Restore and target-reset checkpoints, run `32568632008`, jobs `97020817035`/`97020825268`/`97020836458`, runner cleanup output and `RESTORE_CHECKOUT_CA_TRUSTSTORE_RECONCILIATION_2026-08-22.md`.
- Exact next step: finish the repository-only truststore repair, require exact-head CI and independent diff countercheck, then merge. Do not retry run `32568632008`, reuse runner ID `40`, create a JIT or dispatch any Restore workflow as part of this repair.
- Owner action needed: none for repository code/tests/PR work. Any future protected run approval, JIT preparation, target mutation or Restore write remains a separate exact R4-controlled step.

## FM-MOB-001
- Started: before 2026-08-19
- Updated: 2026-08-21
- Status: IMPLEMENTED_NOT_VERIFIED
- Risk: R3
- Scope: Signed Android/iOS Mobile release and real-device/store acceptance; the merged repository implementation now binds both read-only resource readiness and the separately protected signed-build path to the exact remote EAS project record.
- Branch/PR: `main`; PR #988 merged as `e20efd475e475101226f266118b9cfed7972243a`.
- Work lock: `LOCK-FM-MOB-001-EAS-PROJECT-BINDING-20260821` RELEASED.
- Dependencies: Supabase redirect, EAS project/environments/token, signing credentials, Apple Developer/App Store Connect for iOS.
- Assumptions: repository CI/build evidence does not prove a signed device build; a successful EAS lookup alone does not prove that the returned owner, slug and project ID match the protected FanMind binding.
- Completed so far: native app core, auth/recovery, SecureStore/Purge, contacts/knowledge/AI/followups, offline cache, push foundation, icon/splash/privacy/store metadata and CI/control workflows. PR #988 added a bounded verifier for the redacted `eas project:info` report, rejects owner/slug/ID drift and unsafe report files, wires it before both read-only readiness and any signed internal build queue, and exercises parser plus workflow wiring through positive and negative CI self-tests. Exact head `6f42a5897aabb3387a74149010dee2b5fb2c92cd` passed Project Memory Guard/Quality/Status, FanMind CI, Landing Language CI, Supply Chain Security, CodeQL and Browser E2E before merge `e20efd475e475101226f266118b9cfed7972243a`.
- Still open: real read-only EAS environment verification; redirect/device recovery; EAS/signing; signed Android + real device; iOS/TestFlight + real device; push/store portal evidence.
- Evidence so far: issues #584/#690, Source of Truth, mobile docs/tests, Expo EAS CLI `project:info` source contract, PR #988 exact-head workflow set, countercheck comment and merge commit.
- Exact next step: run the existing protected, main-bound Mobile release resource-readiness workflow for the intended non-Production environment and bind its external EAS result to the exact merged commit. Do not queue a build or mutate credentials in that read-only step.
- Owner action needed: only where protected EAS environment/account access, Supabase Redirect, signing, stores and real-device acceptance require external action.

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

## FM-SEC-001
- Started: 2026-08-20
- Updated: 2026-08-20
- Status: RECONCILIATION_REQUIRED
- Risk: R3
- Scope: reconcile fresh live Supabase Production/Staging security advisors with the controlled hardening design before any database/Auth mutation.
- Branch/PR: `automation/postmerge-reconcile-20260820`; issue #982.
- Work lock: read-only audit/reconciliation only; acquire a new mutating lock before any Production DB/Auth change.
- Dependencies: FM-DEP-010; exact deployed Production commit; controlled trigger-hardening checksum/runner; current Production/Staging Supabase projects; provider/Auth access for leaked-password decision.
- Assumptions: Production trigger warnings indicate pre-apply/not-accepted state; Staging authenticated workspace RPC may be intentional but its exception status must be explicitly reviewed.
- Completed so far: fresh target health and security advisors read; repository SQL/runbook compared; issue #982 opened with V5 risk/evidence/falsification contract.
- Still open: exact read-only Production verify; catalog/ACL confirmation; Staging RPC exception review; leaked-password setting decision/evidence; only then any separately authorized mutation and post-advisor countercheck.
- Evidence so far: live Supabase security advisors plus current `supabase/controlled/20260806203023_harden_trigger_function_privileges.sql`, Production hardening runbook and workspace provisioning migration.
- Exact next step: run the existing read-only Production hardening verify against the exact deployed commit; do not Apply in this reconciliation.
- Owner action needed: only for protected Production DB/Auth mutations or provider-only setting changes when the read-only evidence is ready.

## Closed work

## FM-MEM-005
- Started: 2026-08-19 08:40 Europe/Vienna
- Closed: 2026-08-19
- Status: ACCEPTED
- Risk: R3
- Scope: Project Memory V2-V6, exhaustive FanMind finishline audit and machine-enforced finishline controls.
- Branch/PR: `project-memory-v4-started-work` / PR #975
- Result: exact head `2a62dc8337673be0b33acfd4338d0f452224e779` passed Project Memory Guard/Quality V6/Status, FanMind CI, Supply Chain, Landing, CodeQL and Browser E2E; merged as `b4bef882a55e8c0dd1dd33d0ad1c1664c3078d0d`.
- Evidence: PR #975, merge commit and exact-head workflow runs.
- Follow-up: maintain V6; continue `FM-RST-001`.

## FM-MEM-008
- Started: 2026-08-19
- Closed: 2026-08-20
- Status: ACCEPTED
- Risk: R3
- Scope: Project Memory V8 cross-chat reconciliation, impact matrix, owner-action inbox, automatic handoff and V8 quality enforcement.
- Branch/PR: `project-memory-v8-crosschat-impact` / #980.
- Result: after correcting missing V5 bookkeeping and stale generated status, final exact head `704fec4b6264dd5a0dd83cc8e0029352672485d0` passed Guard, Quality, Status, FanMind CI, Supply Chain, Landing, CodeQL and Browser E2E, then squash-merged as `22eb6aed5da4fde47860bbe12b118d3780c8a4a0`.
- Evidence: exact-head GitHub workflow runs and merge commit; independent Browser E2E run #915.
- Follow-up: maintain V8; any stale/contradictory handoff must downgrade to revalidation rather than being trusted.
