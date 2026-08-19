# Countercheck Policy

The second-pass verification must be independent from the implementation pass.

## Independent evidence
Use at least one evidence source different from the one used to claim success. Task text or PR description alone is never sufficient.

Examples: implementation claim -> final diff + CI; workflow code -> current workflow run; restore step -> receipt-bound target verification; mobile build -> exact-build device evidence; billing/AI/security change -> current target-bound verification plus fail-closed/negative path.

## Freshness
Final evidence must match the current reviewed commit, PR/branch and target environment/build/runtime where applicable. Older workflow runs, previous deployments, older backups, previous mobile builds or stale screenshots are `STALE` and cannot close a task.

## Negative/regression check
Verify the relevant failure/fail-closed path and previously failing case, not only the happy path.

## Triangulation
High-impact restore, production, billing, AI entitlement, security, mobile signing/device and social-connector work requires at least two independent evidence classes before `ACCEPTED` or `PRODUCTION_CONFIRMED`.

## Separation
Execution receipts must record implementation evidence and countercheck evidence separately.

## Contradictions
Any disagreement between project memory, Git/PR, CI, runtime, protected environment or device evidence becomes `RECONCILIATION_REQUIRED`; do not guess or average. Resolve from current verified evidence.

## Completion gate
A clean completion claim requires current-commit evidence, independent countercheck evidence, no unresolved reconciliation finding, no stale active lock, no untracked started work/open loop/dependency and the required negative/regression check. Red governance/security/supply-chain checks remain blocking.