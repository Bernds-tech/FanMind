# Deferred Owner Actions

Updated: 2026-08-22 22:10 Europe/Vienna

## FM-RST-OWNER-001 — GitHub runner-group policy evidence
- Related task: `FM-RST-001`.
- Status: COMPLETED.
- Result: protected read-only run `32582640853` revalidated the exact selected repository/workflow policy and host/toolchain boundary, then advanced through `RESOURCE_READY` and `TARGET_COMPATIBLE` without writes.
- Evidence: all three jobs succeeded on exact `b75f68ecc7999a9b492051aecc2421b9b597dd18`; Host-2 runner ID `42` cleaned credentials/configuration, exited 0 and was removed.
- Revalidation rule: mutable runner policy/host evidence must be checked again immediately before any later R4 write.

## FM-RST-OWNER-002 — Exact isolated database-Restore authorization
- Related task: `FM-RST-001`.
- Status: CONSUMED_FAIL_CLOSED.
- Decision: The exact one-run authorization was consumed by `restore-drill-database.yml` run `32594374666` on reviewed `main` `8bc8855a6de928cf38ef2e8fb9e9e0860fc477db`.
- Result: Gate and Host-1 passed. Host-2 job `97082992861` stopped at `database_authorization_preflight_failed` before the first target write because the empty target exposed only 2 of the 5 receipt-bound extensions. Independent read-only reconciliation proved the target remains empty, TLS is `verify-full`, quarantine is retained and runner/JIT/credential/plaintext residue is absent.
- Resume rule: this authorization cannot be retried, rerun or reused. Any later database Restore requires a new exact authorization after the extension contract is independently satisfied.
- Safety: no database Restore was applied; Production and Supabase Staging were not written.

## FM-RST-OWNER-003 — Exact isolated extension-baseline provisioning
- Related task: `FM-RST-001`.
- Status: DEFERRED_BY_OWNER.
- Decision: The first unproven R4 transition is now the isolated target extension baseline, not another database-Restore dispatch.
- Deferred actions:
  1. Bind the existing `fanmind-restore-01` / PostgreSQL 17.11 / `fanmind_restore` target and retained reset receipt to the accepted Full Backup, Verification, Source commit and expected 97-record extension fingerprint `6704956613ca8e58a527336d67b622a043e48a568858873ca5a6fa6b8bd08012`.
  2. Revalidate the current cluster preload/runtime boundary and trusted control/library files read-only before mutation.
  3. In one separately authorized, rollback-capable protected transaction, provision only `pg_stat_statements` 1.11 in `extensions` owned by `postgres`, `supabase_vault` 0.3.1 in `vault` owned by `supabase_admin`, and `uuid-ossp` 1.1 in `extensions` owned by `postgres`; preserve `pgcrypto` 1.3 and `plpgsql` 1.0, and apply the already-proven exact member-owner correction for 36 `pgcrypto` plus 10 `uuid-ossp` members.
  4. Run the unchanged full receipt-bound role/container/extension authorization read-only and require the exact 97-record fingerprint before considering any later database Restore.
- Resume rule: do not provision, create a JIT, dispatch a workflow or request `restore-drill` approval until the owner explicitly authorizes this exact protected extension-only step.
- Safety: no target reset, backup decryption, `pg_restore`, database Restore, Production write, Supabase-Staging write or unrelated R4 mutation is included.

## FM-GOV-OWNER-001 — Protect `main` with GitHub Ruleset / Branch Protection
- Related area: FanMind governance / Project Memory V7 hardening.
- Status: DEFERRED_BY_OWNER.
- Current remote fact: `main` is not protected as of 2026-08-19; branch API reports `protected=false` and no required status checks.
- Why deferred: the connected GitHub app can read the branch protection state but exposes no write action for Branch Protection or Rulesets.
- Required remote settings are defined in `BRANCH_PROTECTION_CONTRACT.json`.
- Deferred actions:
  1. Enable protection/ruleset for `main`.
  2. Require pull requests for changes to `main`.
  3. Require the listed FanMind/Project-Memory status checks.
  4. Block force pushes and branch deletion.
  5. Require conversation resolution.
  6. Do not allow routine direct pushes to `main`.
- Resume rule: perform this once together when convenient. Until then, agents must still follow the repository branch+PR policy even though GitHub does not technically enforce it.
- Safety: do not weaken or remove existing checks in order to make the ruleset easier to satisfy.

## General rule
When a FanMind finishline action requires owner-only UI access, external provider approval, payment authorization, legal/tax evidence or another capability unavailable to the assistant, record it here and continue with unrelated safe work. Do not repeatedly interrupt the owner with the same deferred request.
