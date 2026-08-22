# FanMind Owner Action Inbox

This is the single compact queue for actions that genuinely require the owner, an external provider, protected UI access, payment authorization, legal/tax evidence or another capability unavailable to the assistant.

## FM-RST-OWNER-001 — Restore runner-group policy + host readiness
- Status: COMPLETED
- Where: GitHub Organization `FanMind` -> Settings -> Actions -> Runner groups -> `fanmind-restore-drill`
- Result: selected repository/workflow policy, Host-1 and Host-2 were revalidated for protected read-only run `32582640853`; all three jobs succeeded and both one-job runners cleaned up.
- Risk: R4
- Duration class: short
- Evidence: run `32582640853`, jobs `97054217701`/`97054234003`/`97054248185`, runner IDs `41`/`42`, issue #944 and controller cleanup output.
- Revalidation: this mutable evidence expires and must be repeated immediately before the later protected R4 write.

## FM-RST-OWNER-002 — Exact isolated database-Restore authorization
- Status: CONSUMED_FAIL_CLOSED
- Where: workflow run `32594374666` on exact commit `8bc8855a6de928cf38ef2e8fb9e9e0860fc477db`.
- Result: the single authorized dispatch and two fresh JITs were consumed. Host-2 stopped at receipt-bound database authorization preflight before the first target write; independent read-only reconciliation proved the database remains empty and runner/private cleanup is safe.
- Risk: R4
- Evidence: jobs `97082934347`, `97082943319`, `97082992861`; issue #944 comments `5382274967` and `5382336892`.
- Do not repeat: no rerun/retry, JIT reuse or inference that the prior authorization remains available.

## FM-RST-OWNER-003 — Exact isolated extension-baseline provisioning
- Status: DEFERRED_BY_OWNER
- Where: only `fanmind-restore-01` / PostgreSQL 17.11 / database `fanmind_restore`, followed by receipt-bound read-only authorization verification.
- Why: reset v10 left the intended empty 2-extension baseline, but the selected Full Backup requires five exact extensions before the first Restore write. The three missing trusted packages are already installed on the host.
- Exact permitted scope when resumed: add only `pg_stat_statements` 1.11, `supabase_vault` 0.3.1 and `uuid-ossp` 1.1 with their receipt-bound schemas/owners, apply only the already proven internal member-owner correction, verify the exact 97-record extension fingerprint, and automatically restore the proven 2-extension baseline on postcheck failure.
- Forbidden: database Restore/rerun, target reset, quarantine deletion, Production/Supabase-Staging target or write, any other role/database/config mutation.
- Risk: R4
- Duration class: protected bounded transaction
- Resume trigger: owner grants a fresh exact authorization naming this target, selected backup/receipt/source binding, expected extension fingerprint and rollback boundary.
- Do not ask before: explicit owner resume. A later database-Restore authorization is separate and may be considered only after this provisioning passes.
## FM-GOV-OWNER-001 — Protect `main`
- Status: DEFERRED_BY_OWNER
- Where: GitHub repository/organization Rulesets or Branch Protection UI
- Why: `main` should require PRs/checks and block force-push/delete/direct routine pushes.
- Risk: R3
- Duration class: short
- Resume trigger: owner chooses to complete GitHub governance setup.
- Do not ask before: explicit owner resume.

## Rules
- `DEFERRED_BY_OWNER` means keep visible but do not repeatedly interrupt the owner.
- When an action is completed in another chat/session, reconcile GitHub/Project Memory evidence first, then mark it done here.
- Never infer provider, payment, signing, destructive, legal or protected Production acceptance from code or chat text alone.
