# FanMind Current State

Last reconciled: 2026-08-19

## Mandatory restart point

Before substantive FanMind work, read in this order:

1. `AGENTS.md` and `docs/SOURCE_OF_TRUTH.md`;
2. `project-memory/PROTOCOL.md`, `FANMIND_DEEP_AUDIT_2026-08-19.md`, `FANMIND_FINISHLINE.md`, `FINISHLINE_STATE.json`, `EXTERNAL_ACCEPTANCE.md`;
3. `project-memory/STARTED_WORK.md`, `TASK_LEDGER.md`, `OPEN_LOOPS.md`, `DEPENDENCIES.md`, `ASSUMPTIONS.md`, `CONTRADICTIONS.md`, `FAILED_ATTEMPTS.md`;
4. for Restore work, `RESTORE_STATE_MACHINE.md` plus the canonical Restore runbook;
5. central finishline issue #874 and the exact current Git/PR/CI/runtime/provider state.

Older percentages, issue checkboxes and chat statements are historical until reconciled against current evidence.

## Project role

FanMind is the production CRM/fan-communication product. Canonical product truth is `docs/SOURCE_OF_TRUTH.md`. Project Memory records execution truth and discovered drift without silently overriding canonical docs.

## V6 governance status

Project Memory V6 is **ACCEPTED on `main`**.

- PR #975 exact head: `2a62dc8337673be0b33acfd4338d0f452224e779`.
- Merge commit: `b4bef882a55e8c0dd1dd33d0ad1c1664c3078d0d`.
- Project Memory Guard, Quality V6 and Status: green.
- FanMind CI including PG17 authorization roundtrip, Operations/Stripe policies and Production build: green.
- Landing, Supply Chain, CodeQL and both Browser E2E flows: green.
- `FINISHLINE_STATE.json` is the machine-readable finishline state.
- `sales_ready=false` remains correct; Sales Handoff is not yet complete.

## Audited finishline state

### Built/accepted foundations — do not rebuild

- Project Memory V6 finishline governance and counterchecks;
- production Web/CRM core;
- Production deploy, health/version, PM2/nginx, read-only audit, monitoring and backup foundation;
- isolated Staging infrastructure and primary technical Staging acceptance;
- native Mobile repository/core and CI foundation;
- KI Standard and Plus/Ultra fail-closed technical foundation;
- Meta Pixel PageView-only technical Production path;
- advanced Facebook/Instagram foundation;
- dormant WhatsApp inbound foundation;
- Restore backup/authorization contract, PG17 roundtrip, fresh Schema-2 encrypted Full Backup and isolated host foundation.

### Active incomplete finishline

1. **Restore — FM-RST-001, R4:** real isolated DB/Storage/Server-config/Cleanup/Evidence acceptance still open.
2. **Mobile — FM-MOB-001:** signed Android/iOS builds, redirect/EAS/signing, real devices, TestFlight/store/push acceptance open.
3. **AI/Billing — FM-AI-001:** Plus/Ultra product decisions, quality/cost evidence, full current Staging lifecycle and explicit activation open.
4. **Meta/Security — FM-META-001:** external Events Manager/browser evidence, remaining external Meta/App Review E2E and final finishline security evidence open.
5. **Phase 3 — FM-SOC3-001:** Facebook/Instagram/WhatsApp final real E2E not accepted.
6. **Phase 7 — FM-SOC7-001:** TikTok/X/Discord/conditional OnlyFans real connectors not accepted.
7. **Sales handoff — FM-SALES-001:** blocked until required Phase-3/Phase-7 technical acceptance and final Production demo truth.
8. **Legal/Tax/AVV — FM-LEGAL-001:** external approvals remain separate; do not guess.

## Restore-drill exact known state

### Repository/backup evidence

- PR #943 merge `14a1e2d0e100f2ec8cfa14486c96f128fb431878` hardened ACL/default-ACL/Owner/Role/DB-container/Extension recovery contract.
- Real two-cluster PostgreSQL-17 CI passed.
- New encrypted Schema-2 Full Backup `b74c1c60-1d61-4a39-9f0d-648ec003a12c` succeeded, validated and uploaded offsite.
- Checksum-only Verification `006e6ab8-8f5c-43c1-ac68-6570e992a7a1` succeeded/passed.
- Historical privilege-less backups are not valid Gate-2 recovery evidence.
- V6 Restore state machine current highest proven state: `BACKUP_ACCEPTED`.

### Operator-session foundation — revalidate before use

- no second restore server;
- isolated Restore VM exists;
- Ubuntu 24.04;
- PostgreSQL 17.11;
- Node 24.19.0;
- target database `fanmind_restore`;
- bootstrap login `fanmind_restore_bootstrap`;
- local PostgreSQL `127.0.0.1:5432`;
- TLS `verify-full` passed;
- `fanmind-restore` has no sudo;
- protected `restore-drill` environment and age-identity setup recorded;
- runner group `fanmind-restore-drill` setup recorded.

These live facts can drift. Revalidate runner group/workflow allowlist/JIT state, host gate/toolchain, target, TLS and artifact binding immediately before the next R4 step.

## Important contradiction

The actual GitHub repository is organization-owned as `FanMind/FanMind`. Older restore prose in `docs/SOURCE_OF_TRUTH.md`, `AGENTS.md` and `docs/operations/RESTORE_DRILL.md` still contains pre-transfer `user-owned`/`future-org` wording. Treat that wording as stale. Do **not** infer that the current runner-group policy is still correct solely from ownership; remote admin-policy state must be revalidated before dispatch.

## Canonical roadmap boundary

- Phase 3: Facebook, Instagram, WhatsApp.
- Phase 7: TikTok, X/Twitter, Discord, OnlyFans only if officially/contractually feasible.
- Phase 8: LinkedIn and later platforms; not started and outside current scope.
- Phase 4 = completed production/billing base, **not** sales handoff.
- Technical sales handoff occurs only after required Phase-3 and Phase-7 channel acceptance.

## Do not repeat by default

- no second restore server;
- no Restore against Production or Supabase Staging;
- no re-provisioning of restore TLS/PostgreSQL/runner foundation absent verified drift;
- no old Cloudzy/systemd production deploy assumptions;
- no rebuild of Facebook/Instagram foundation;
- no Mobile restart/WebView rewrite;
- no invented Plus/Ultra models/quotas;
- no Referral Production activation through merge alone;
- no remote offsite deletion without new explicit deletion approval;
- no real 1-EUR/day paid test without separate financial approval;
- no Phase-8 work;
- no scraping/self-bot/platform bypass;
- no bypass of red/pending security/governance gates;
- no parallel project-memory/finishline system.

## Exact next safe sequence

1. continue Restore from `BACKUP_ACCEPTED -> HOST_REVALIDATED` using fresh read-only revalidation;
2. Mobile external signing/device/store acceptance;
3. Plus/Ultra product/quality/cost/Stripe lifecycle closure;
4. Meta Events Manager + final non-Social security acceptance;
5. real Phase-3 channels;
6. real Phase-7 channels / OnlyFans feasibility;
7. final Production sales demo + sales handoff.
