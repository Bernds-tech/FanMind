# FanMind Evidence and Acceptance

Implementation status and acceptance status are deliberately separate.

## Status model
- `IMPLEMENTED`: code/configuration exists.
- `IMPLEMENTED_NOT_VERIFIED`: implementation exists but required verification is missing or incomplete.
- `VERIFIED`: defined technical checks passed with evidence.
- `COUNTERCHECKED`: independent countercheck passed for the current commit/target.
- `ACCEPTED`: required real-world/staging/device/operator acceptance is complete.
- `PRODUCTION_CONFIRMED`: production state has been independently confirmed where applicable.

`DONE` is retained only for historical v1 entries. New work should use the status model above.

## FM-EV-001
- Related: FM-MEM-001
- Date: 2026-08-19
- Target: repository governance
- Type: merged repository controls
- Reference: Project Memory Protocol v1 files and guard workflow on `main`; PR #972
- Result: repository-level project memory established
- Limitations: v1 did not yet separate open loops, dependencies, acceptance levels or stale scanning
- Acceptance: VERIFIED

## FM-EV-002
- Related: FM-STG-001
- Date: through 2026-08-19
- Target: isolated FanMind Staging
- Type: Staging infrastructure + functional acceptance
- Reference: central finishline #874 Gate 1 and run/commit evidence recorded there
- Result: separate Supabase/Web Staging, DNS/TLS, required test resources, isolated synthetic users/workspaces, Workspace/Daily contract and rollback-protected Referral/Billing Staging lifecycle are recorded complete
- Limitations: does not prove Mobile signing, Plus/Ultra Production readiness, Meta external E2E or Social connectors
- Acceptance: ACCEPTED

## FM-EV-003
- Related: FM-RST-001
- Date: 2026-08-15 to 2026-08-19
- Target: backup/recovery contract
- Type: code + CI + Production backup evidence
- Reference: PR #943 merge `14a1e2d0e100f2ec8cfa14486c96f128fb431878`; issue #944 comments
- Result: ACL/default-ACL/Owner/Role/DB-container/Extension contract implemented, deployed and proven in real two-cluster PG17 CI
- Limitations: not a real artifact restore into the operator target
- Acceptance: VERIFIED

## FM-EV-004
- Related: FM-RST-001
- Date: 2026-08-15+
- Target: Production backup pipeline, read-only verification
- Type: encrypted Full Backup + checksum verification
- Reference: Full Backup `b74c1c60-1d61-4a39-9f0d-648ec003a12c`; Verification `006e6ab8-8f5c-43c1-ac68-6570e992a7a1`
- Result: succeeded/validation passed/offsite uploaded; Schema 2 authorization contract; checksum verification succeeded without restore
- Limitations: no decryption/real restore acceptance
- Acceptance: VERIFIED

## FM-EV-005
- Related: FM-RST-001
- Date: 2026-08-17 to 2026-08-19
- Target: isolated Restore operator environment
- Type: operator-session infrastructure evidence
- Reference: restore-session record summarized in `FANMIND_DEEP_AUDIT_2026-08-19.md`
- Result: isolated VM, Ubuntu 24.04, PostgreSQL 17.11, Node 24.19.0, target DB `fanmind_restore`, bootstrap login, local PostgreSQL, TLS verify-full, non-sudo restore user, environment/age/runner-group setup were established in the working session
- Limitations: live state may drift and the current connector cannot independently attest the complete GitHub runner-group Admin policy; mandatory revalidation before R4 write
- Acceptance: VERIFIED_NOT_ACCEPTED

## FM-EV-006
- Related: FM-MOB-001
- Date: through 2026-08-19
- Target: repository/mobile CI
- Type: implementation + CI/build controls
- Reference: issues #584/#690; mobile source/docs/tests
- Result: native app core and technical build/control foundation implemented
- Limitations: no signed real-device Android/iOS/Store acceptance
- Acceptance: VERIFIED

## FM-EV-007
- Related: FM-META-001
- Date: through 2026-08-19
- Target: Production Meta Pixel technical path
- Type: code/Production behavior
- Reference: issue #714 and Source of Truth
- Result: consent-gated parameterless PageView-only path with protected-route/PII/Advanced-Matching/CAPI boundaries
- Limitations: Meta Events Manager normal-browser reception and legal final acceptance remain external
- Acceptance: PRODUCTION_CONFIRMED

## FM-EV-008
- Related: FM-AI-001
- Date: through 2026-08-19
- Target: AI policy/Staging foundation
- Type: code/config/Staging
- Reference: `src/config/aiTiers.mjs`, issue #560, #874, Source of Truth
- Result: Standard active; Plus/Ultra fail-closed technical foundation, test-catalog/storage/lifecycle/eval/monitoring controls exist
- Limitations: final models/quotas/quality/cost/lifecycle/legal/Production activation incomplete
- Acceptance: VERIFIED_NOT_ACCEPTED

## FM-EV-009
- Related: FM-SOC3-001 / FM-SOC7-001
- Date: 2026-08-19 audit
- Target: Social finishline
- Type: source/issue/code reconciliation
- Reference: #874, Source of Truth, Meta/WhatsApp foundations
- Result: Facebook/Instagram foundation advanced; WhatsApp dormant foundation exists; Phase 7 feasibility notes exist
- Limitations: required real Phase-3/Phase-7 E2E acceptance absent
- Acceptance: IMPLEMENTED_NOT_VERIFIED

## FM-EV-010
- Related: FM-SALES-001
- Date: 2026-08-19
- Target: sales handoff truth
- Type: canonical roadmap/sales alignment
- Reference: Source of Truth, #874, commit `74c3a6aa357215c52d3a4d9b01ba8513bba1b57f`
- Result: canonical decision is sales handoff only after required Phase-3/Phase-7 technical acceptance; sales materials exist
- Limitations: handoff itself not yet performed
- Acceptance: VERIFIED

## FM-EV-011
- Related: all finishline tasks
- Date: 2026-08-19
- Target: repository + issues + project memory
- Type: exhaustive reconciliation
- Reference: `project-memory/FANMIND_DEEP_AUDIT_2026-08-19.md`
- Result: current built/open/stale/blocked/do-not-repeat state reconciled across product, Production, Staging, Restore, Mobile, AI/Billing, Meta, Social, Security, Legal and Sales
- Limitations: external/live mutable resources must still be revalidated at execution time
- Acceptance: COUNTERCHECKED

## FM-EV-012
- Related: FM-MEM-005
- Date: 2026-08-19
- Target: FanMind repository governance / finishline controls
- Type: exact-head CI + merged V6 governance
- Reference: PR #975 exact head `2a62dc8337673be0b33acfd4338d0f452224e779`; merge commit `b4bef882a55e8c0dd1dd33d0ad1c1664c3078d0d`
- Result: Project Memory Guard, Project Memory Status, Project Memory Quality V6 including Sales Readiness and Canonical Truth Drift, FanMind CI including PG17/Operations/Stripe policies/Production build, Landing Language CI, Supply Chain Security, CodeQL and both Browser E2E jobs all passed before merge
- Limitations: acceptance covers the V6 memory/finishline governance system only; it does not close Restore, Mobile, AI/Billing, Meta/Security, Social or Sales Handoff gates
- Acceptance: ACCEPTED

## FM-EV-013
- Related: FM-MEM-008
- Date: 2026-08-20
- Target: PR #980 Project Memory V8
- Type: implementation evidence + independent CI countercheck
- Reference: prior exact head `ba48a7cab55ca45a98b62713bbc07989073589fc`; GitHub workflow runs for that head
- Result: V8 files/checker existed and Project Memory Guard/Quality/Status, FanMind CI, Supply Chain Security, Landing Language CI and CodeQL were green. Browser E2E did not execute its public/synthetic flows because both jobs were cancelled during Chromium installation.
- Limitations: this exact head is superseded by V5 bookkeeping commits; the cancelled Browser E2E means the prior head never reached the required R3 acceptance quorum. Fresh exact-head evidence is required after reconciliation.
- Acceptance: IMPLEMENTED_NOT_VERIFIED

Never store secrets, private credentials, plaintext sensitive payloads, or unsafe diagnostic material here.