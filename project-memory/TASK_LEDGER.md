# FanMind Task Ledger

Use one heading per task/attempt. Never delete historical entries; supersede them explicitly.

## FM-MEM-001
- Date: 2026-08-19
- Status: DONE
- Goal: Introduce durable project memory and duplicate-work prevention.
- Starting state: Git/code history existed, but micro-attempts and conversational decisions were not systematically tracked in one operational ledger.
- Action: Added Project Memory Protocol v1 structure and PR guard.
- Result: Repository-level operational memory established.
- Evidence: `project-memory/` and `.github/workflows/project-memory-guard.yml`; V1 merged via PR #972.
- Next step: Extend the same system rather than creating a competing ledger.
- Do not repeat: Do not create a second competing memory system.

## FM-MEM-002
- Date: 2026-08-19
- Status: SUPERSEDED
- Goal: Add V2 open-loop/dependency/evidence/stale-scan model.
- Action: Built V2 in PR #973.
- Result: Functionality was retained but PR #973 was not merged independently; it was superseded by consolidated PR #975 to avoid stacked/divergent governance branches.
- Evidence: PR #973 history and V2 files now included in PR #975.
- Next step: Use PR #975 as the only active FanMind memory integration path.
- Do not repeat: Do not reopen #973 as a parallel source of truth.

## FM-MEM-003
- Date: 2026-08-19
- Status: SUPERSEDED
- Goal: Add V3 standing authorizations and generated project status.
- Action: Built V3 in PR #974 and fixed generator/status drift plus hosted-checkout SHA pinning.
- Result: PR #974 was superseded by consolidated PR #975 rather than merged separately.
- Evidence: PR #974 history and V3 files now included in #975.
- Next step: Maintain V3 capabilities inside consolidated V5.
- Do not repeat: Do not merge/revive #974 independently.

## FM-MEM-004
- Date: 2026-08-19
- Status: SUPERSEDED
- Goal: Add mandatory execution policy, started-work tracking and stronger counterchecks.
- Action: V4 work was developed on the governance branch and then folded into V5.
- Result: No separate final V4 integration; V4 is a historical stage inside PR #975.
- Evidence: `EXECUTION_POLICY.md`, STARTED_WORK/WORK_LOCK/receipt structures in PR #975 history.
- Next step: Use V5 rules.
- Do not repeat: Do not create another V4-only branch/PR.

## FM-MEM-005
- Date: 2026-08-19
- Status: IMPLEMENTED_NOT_VERIFIED
- Goal: Consolidate V2-V5 into one auditable FanMind Project Memory/governance system with independent counterchecks.
- Starting state: V2/V3/V4 work existed on stacked/divergent branches and FanMind had stricter CI/supply-chain controls.
- Action: Consolidated into PR #975; added authorizations, status/stale automation, STARTED_WORK, WORK_LOCKS, EXECUTION_RECEIPTS, ASSUMPTIONS, CONTRADICTIONS, QUALITY_CONTROL, Risk R1-R4, quorum, evidence freshness, negative/fail-closed paths, scope-diff guard, rollback/recovery proof, falsification and milestone closeout. Fixed SHA pinning, generated status drift and hosted checkout count expectations without weakening policy.
- Result: Consolidated governance is implemented on PR #975 but not yet accepted/merged to main because exact-head checks must be revalidated after the latest reconciliation commits.
- Evidence: PR #975 and `project-memory/CHAT_RECONCILIATION_2026-08-19.md`.
- Next step: Run/reconcile all relevant checks for the exact current head; merge only if green; then record ACCEPTED/merged evidence and release the active work record.
- Do not repeat: Do not bypass a red/pending FanMind gate and do not create another parallel memory PR.

## FM-RST-001
- Date: 2026-08-17 to 2026-08-19
- Status: PARTIAL
- Goal: Complete isolated real restore drill.
- Starting state: Dedicated restore host, PostgreSQL 17 target, runner group/workflows and protected environment already exist.
- Action: Host-readiness, TLS, PostgreSQL compatibility, runner/JIT and workflow setup were iterated.
- Result: Foundation exists; the complete real restore drill is not yet recorded as DONE here.
- Evidence: Current restore workflows/docs and recent main commits including PostgreSQL 17.11 pinning and restore compatibility fixes.
- Next step: Inspect current restore workflow/run state and continue from the first unproven gate.
- Do not repeat: Do not rebuild the restore host, runner group, TLS baseline or database target from zero unless verified drift requires it.
