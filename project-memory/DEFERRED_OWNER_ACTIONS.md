# Deferred Owner Actions

Updated: 2026-08-22 18:44 Europe/Vienna

## FM-RST-OWNER-001 — GitHub runner-group policy evidence
- Related task: `FM-RST-001`.
- Status: COMPLETED.
- Result: protected read-only run `32582640853` revalidated the exact selected repository/workflow policy and host/toolchain boundary, then advanced through `RESOURCE_READY` and `TARGET_COMPATIBLE` without writes.
- Evidence: all three jobs succeeded on exact `b75f68ecc7999a9b492051aecc2421b9b597dd18`; Host-2 runner ID `42` cleaned credentials/configuration, exited 0 and was removed.
- Revalidation rule: mutable runner policy/host evidence must be checked again immediately before any later R4 write.

## FM-RST-OWNER-002 — Exact isolated database-Restore authorization
- Related task: `FM-RST-001`.
- Status: DEFERRED_BY_OWNER.
- Decision: Successful read-only readiness does not authorize the `TARGET_COMPATIBLE -> DB_RESTORED` transition.
- Deferred actions:
  1. Name the exact reviewed `main` commit, exact accepted Full Backup/source binding and exact empty isolated target.
  2. Authorize exactly one `restore-drill-database.yml` dispatch with confirmation `run-isolated-database-restore`.
  3. Authorize exactly two fresh sequential one-job JIT runners and only the corresponding protected environment approval.
  4. Revalidate mutable runner-group, host, target, artifact and TLS evidence before starting either write-capable job.
- Resume rule: do not dispatch, prepare a database-run JIT or ask for approval unless the owner explicitly resumes this exact protected step.
- Safety: Production and Supabase Staging remain forbidden targets; no target reset, database Restore or other R4 mutation is authorized by this deferment.

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
