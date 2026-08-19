# Assumption Verification Register

Critical assumptions used to plan or execute FanMind work must be recorded before they are relied upon.

Statuses: `NEEDS_VERIFICATION`, `VERIFIED`, `INVALIDATED`, `SUPERSEDED`.

Each active assumption includes: Assumption ID, Date/Updated, related task/change ID, risk level, assumption, why it matters, verification source/evidence, status, recheck trigger, and action if false.

Pay special attention to Production/Staging/restore target, runner state, deployment commit, migration/application state, Stripe/provider resources, external approvals, mobile build/signing state and protected-environment configuration.

Template:
```text
## ASM-YYYY-NNN
- Date:
- Updated:
- Related task:
- Risk: R1|R2|R3|R4
- Assumption:
- Why it matters:
- Verification source/evidence:
- Status: NEEDS_VERIFICATION
- Recheck trigger:
- Action if false:
```

Do not delete invalid assumptions; preserve them as `INVALIDATED` or `SUPERSEDED`.
