# Contradiction / Reconciliation Register

Any conflict between project memory and actual Git/PR/CI/security/workflow/runtime/target evidence is recorded here and forces `RECONCILIATION_REQUIRED` until resolved.

Statuses: `OPEN`, `RECONCILIATION_REQUIRED`, `RESOLVED`, `SUPERSEDED`.

Template:
```text
## CTR-YYYY-NNN
- Date:
- Updated:
- Related task/change:
- Risk: R1|R2|R3|R4
- Source A:
- Claim A:
- Source B:
- Claim B:
- Stronger/current evidence:
- Status: RECONCILIATION_REQUIRED
- Resolution/action:
- Evidence:
```

Mandatory triggers include completed task with red/open CI or operational evidence, merged/closed PR with stale active work, active work without started-work/lock/receipt, dependency state conflicting with prerequisites, evidence bound to another commit/build/target, restore/mobile/Stripe/provider state contradicted by live evidence, or project memory contradicted by current code/runtime state.

Never delete the older conflicting record. Document which source was stale or wrong and why.
