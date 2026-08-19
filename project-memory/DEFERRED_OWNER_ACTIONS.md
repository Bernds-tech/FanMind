# Deferred Owner Actions

Updated: 2026-08-19 14:44 Europe/Vienna

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

## General rule
When a FanMind finishline action requires owner-only UI access, external provider approval, payment authorization, legal/tax evidence or another capability unavailable to the assistant, record it here and continue with unrelated safe work. Do not repeatedly interrupt the owner with the same deferred request.