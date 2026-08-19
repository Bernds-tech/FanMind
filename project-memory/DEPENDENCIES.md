# FanMind Dependencies

Track ordering and prerequisites here. Do not mark dependent work accepted while a required prerequisite remains unresolved.

## FM-DEP-001
- From: FM-RST-001
- Requires: reviewed restore workflows, protected `restore-drill` environment, exact Organization runner-group/workflow-allowlist/JIT policy, isolated existing PostgreSQL-17.11 target, TLS verify-full, exact accepted Schema-2 Full Backup/Receipt and current host gate/toolchain.
- Type: internal + external control
- Status: ACTIVE
- Updated: 2026-08-19
- Rule: Continue from the first unproven gate; do not recreate established infrastructure merely because a later gate is blocked. Never target Production or Supabase Staging.

## FM-DEP-002
- From: FM-MOB-001
- Requires: exact Supabase redirect, EAS project/environments/token, existing or approved signing credentials, signed Android/iOS builds, Apple Developer/App Store Connect for iOS, real devices and separate Push/Store evidence.
- Type: external platform + technical acceptance
- Status: ACTIVE
- Updated: 2026-08-19
- Rule: repository CI/simulator/debug builds do not satisfy signed real-device acceptance.

## FM-DEP-003
- From: FM-AI-001
- Requires: tier-specific written model/quota/overage/context/switch/refund decisions, private quality/cost evidence, full current Staging Stripe/Webhook/Entitlement lifecycle, Legal/Tax boundary and explicit Production activation.
- Type: product + financial + technical + external
- Status: ACTIVE
- Updated: 2026-08-19
- Rule: Plus/Ultra stay fail-closed until every applicable prerequisite is current; Staging Test price existence alone is insufficient.

## FM-DEP-004
- From: FM-META-001
- Requires: Meta Events Manager normal-browser evidence, Meta test/business assets, App Review/permissions for real integrations, no-PII/privacy acceptance and final Security/Production smoke.
- Type: provider + legal + technical
- Status: ACTIVE
- Updated: 2026-08-19
- Rule: technical Pixel code and Staging migrations are not external Meta acceptance.

## FM-DEP-005
- From: FM-SOC3-001
- Requires: FM-RST-001/FM-MOB-001/FM-AI-001/FM-META-001 sufficiently closed according to #874, plus Facebook/Instagram/WhatsApp credentials/permissions/test assets and legal boundaries.
- Type: finishline ordering + provider
- Status: ACTIVE
- Updated: 2026-08-19
- Rule: Social is intentionally the last technical block; reuse existing Meta/WhatsApp foundations.

## FM-DEP-006
- From: FM-SOC7-001
- Requires: prior non-Social/Phase-3 finishline, current official platform capability, X cost/API approval where needed, Discord official bot/guild model, OnlyFans official/contractual feasibility.
- Type: finishline ordering + provider + possible financial/legal
- Status: ACTIVE
- Updated: 2026-08-19
- Rule: no scraping, self-bot, reverse engineering or unofficial bypass.

## FM-DEP-007
- From: FM-SALES-001
- Requires: FM-SOC3-001 and FM-SOC7-001 accepted as required by #874, exact-release 5-minute Production demo, synchronized sales material/roadmap/product truth.
- Type: milestone
- Status: BLOCKED
- Updated: 2026-08-19
- Rule: Phase 4 completion and existing sales docs are not equivalent to technical sales handoff.

## FM-DEP-008
- From: FM-LEGAL-001
- Requires: genuine advisor/register/provider/customer evidence.
- Type: external
- Status: BLOCKED
- Updated: 2026-08-19
- Rule: do not guess UID/register/tax/legal/AVV/provider facts; technical checks cannot self-approve legal status.

## FM-DEP-009
- From: FM-MEM-005
- Requires: exact PR #975 head and terminal green Project Memory Guard/Quality V6/Status plus FanMind CI/Supply Chain/Landing/CodeQL/Browser E2E gates.
- Type: repository governance
- Status: SATISFIED
- Updated: 2026-08-19
- Evidence: exact head `2a62dc8337673be0b33acfd4338d0f452224e779` passed all applicable checks and PR #975 merged as `b4bef882a55e8c0dd1dd33d0ad1c1664c3078d0d`.
- Rule: V6 is now the active mainline system; do not reopen this dependency unless V6 itself materially changes.

## Dependency states
`ACTIVE`, `SATISFIED`, `BLOCKED`, `SUPERSEDED`.

Cross-domain dependencies must be linked to the same FanMind task IDs and #874. Do not create a parallel finishline tracker unless #874 is explicitly superseded.