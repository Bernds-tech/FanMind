# Contradiction / Reconciliation Register

Any conflict between project memory and actual Git/PR/CI/security/workflow/runtime/target evidence is recorded here and forces `RECONCILIATION_REQUIRED` until resolved.

Statuses: `OPEN`, `RECONCILIATION_REQUIRED`, `RESOLVED`, `SUPERSEDED`.

## CTR-FM-001
- Date: 2026-08-19
- Updated: 2026-08-19
- Related task/change: FM-RST-001
- Risk: R4
- Source A: `docs/SOURCE_OF_TRUTH.md`, `AGENTS.md`, `docs/operations/RESTORE_DRILL.md`
- Claim A: repository is currently public/user-owned and must first be transferred to a future organization before the organization Restore runner group can exist.
- Source B: live GitHub repository metadata
- Claim B: repository is `FanMind/FanMind`, owner type Organization `FanMind`.
- Stronger/current evidence: live repository metadata wins for ownership; exact live runner-group Admin policy is separately not fully attestable through the current connector.
- Status: RECONCILIATION_REQUIRED
- Resolution/action: treat pre-transfer ownership wording as stale; do not repeat transfer. Before rewriting policy assertions or dispatching Restore, independently revalidate actual runner-group selected repository/workflow/JIT settings and then update canonical readers.
- Evidence: `FANMIND_DEEP_AUDIT_2026-08-19.md`; current GitHub repo metadata.

## CTR-FM-002
- Date: 2026-08-19
- Updated: 2026-08-19
- Related task/change: FM-RST-001 / issue #944
- Risk: R4
- Source A: original #944 body / older Gate-2 comments
- Claim A: ACL/default-ACL backup/restore contract and fresh Schema-2 recovery backup still need implementation/deployment/creation.
- Source B: later #944/#874 evidence and main history
- Claim B: PR #943 is merged/deployed, PG17 roundtrip is green, Worker v6 is healthy, new Schema-2 Full Backup and checksum verification succeeded.
- Stronger/current evidence: later immutable commit/run/backup evidence.
- Status: RESOLVED
- Resolution/action: keep #944 open only for real artifact-bound isolated Restore/Postcheck acceptance; do not reimplement ACL backup contract.
- Evidence: merge `14a1e2d...`, Full Backup `b74c1c60...`, Verification `006e6ab8...`.

## CTR-FM-003
- Date: 2026-08-19
- Updated: 2026-08-19
- Related task/change: FM-STG-001 / #642/#643/#644
- Risk: R2
- Source A: older P1/referral/staging issue bodies
- Claim A: separate Staging/Supabase/Stripe/synthetic identities and broad lifecycle prerequisites are still absent.
- Source B: central finishline #874 Gate 1 and later Staging/Referral evidence
- Claim B: isolated Staging foundations and primary Staging acceptance are now recorded complete, including rollback-protected Referral/Billing lifecycle.
- Stronger/current evidence: #874 later run/commit evidence.
- Status: RECONCILIATION_REQUIRED
- Resolution/action: map each remaining old checkbox to current test/run evidence; close/supersede only stale checklist items, retain genuine regression gaps. No reimplementation from zero.
- Evidence: #874 Gate 1; deep audit.

## CTR-FM-004
- Date: 2026-08-19
- Updated: 2026-08-19
- Related task/change: FM-SALES-001
- Risk: R2
- Source A: historical product/sales statements that treated Phase 4 as sales release/handoff
- Claim A: sales start/handoff already follows Phase 4.
- Source B: current Source of Truth and #874
- Claim B: Phase 4 is production/billing base only; technical sales handoff requires required Phase-3 and Phase-7 channel acceptance.
- Stronger/current evidence: current canonical reader and later sales-handoff alignment commit.
- Status: RESOLVED
- Resolution/action: never report FanMind as technically handed over for sales until FM-SOC3-001/FM-SOC7-001 and final demo criteria pass.
- Evidence: commit `74c3a6aa357215c52d3a4d9b01ba8513bba1b57f`; Source of Truth.

## CTR-FM-005
- Date: 2026-08-19
- Updated: 2026-08-19
- Related task/change: FM-AI-001
- Risk: R3
- Source A: older #560/#874 checkboxes saying separate Plus/Ultra Test prices are absent.
- Claim A: Test prices still need creation.
- Source B: later Source of Truth/#874 Staging evidence
- Claim B: isolated Stripe Test catalog including Plus/Ultra is now read-only/finishline verified, while complete lifecycle/product/quality activation remains open.
- Stronger/current evidence: later Staging truth.
- Status: RECONCILIATION_REQUIRED
- Resolution/action: before Gate 4 action, verify current Test catalog IDs/status read-only and focus on missing lifecycle/product evidence rather than blindly recreating prices.
- Evidence: Source of Truth Staging section; #874 Gate 1.

## CTR-FM-006
- Date: 2026-08-19
- Updated: 2026-08-19
- Related task/change: FM-MOB-001
- Risk: R3
- Source A: strong repository/mobile CI/build evidence
- Claim A: Mobile could appear nearly complete.
- Source B: canonical Mobile release truth
- Claim B: no signed Android/iOS real-device/store acceptance is complete.
- Stronger/current evidence: Source of Truth plus #584/#690 external acceptance lists.
- Status: RESOLVED
- Resolution/action: report code/CI and external signed/device/store states separately.
- Evidence: #584/#690, Source of Truth.

Never resolve a contradiction by deleting the older record. Document which source was stale or wrong and why.
