# Deferred Owner Actions

Updated: 2026-08-19 17:06 Europe/Vienna

## FM-RST-OWNER-001 — GitHub runner-group policy evidence
- Related task: `FM-RST-001`.
- Status: DEFERRED_BY_OWNER.
- Decision: The owner explicitly requested that actions which ChatGPT cannot perform directly be postponed and completed later together.
- Deferred actions:
  1. Open GitHub Organization `FanMind` -> Settings -> Actions -> Runner groups -> `fanmind-restore-drill`.
  2. Verify selected repository is only `FanMind/FanMind` / repository ID `1259448985`.
  3. Verify workflow restriction is enabled for exactly the three reviewed Restore workflows on `refs/heads/main`.
  4. Capture/validate the private administrator policy receipt according to `docs/operations/RESTORE_DRILL.md`.
  5. Only after that evidence is accepted, run `FanMind Restore Host Toolchain Readiness` with confirmation `verify-isolated-restore-host`.
- Resume rule: Do not ask the owner to redo this setup before they explicitly return to the deferred Restore-admin step. Do not treat the deferment as a new code defect.
- Current Restore state remains: `BACKUP_ACCEPTED`.
- Next machine state after the deferred action: `HOST_REVALIDATED`, then `RUNNER_POLICY_REVALIDATED` as defined in `RESTORE_STATE_MACHINE.md`.
- Safety: no Restore write, decryption, Production mutation, Supabase-Staging restore, payment, or destructive action is authorized by this deferment.

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
