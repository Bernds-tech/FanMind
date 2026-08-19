# Project Memory Protocol v6

This directory is the operational memory for FanMind. It complements code, tests, Git history and canonical product documentation; it does not replace them.

## Mandatory execution policy
`EXECUTION_POLICY.md`, `COUNTERCHECK_POLICY.md`, `QUALITY_CONTROL.md`, `FANMIND_FINISHLINE.md`, `FINISHLINE_STATE.json`, `NEXT_BEST_ACTIONS.json`, `NEXT_BEST_ACTION.md`, `DEFERRED_OWNER_ACTIONS.md`, `RESTORE_STATE_MACHINE.md` and `EXTERNAL_ACCEPTANCE.md` are mandatory operational readers. The owner does not need to ask an agent to check first, remember started work, perform a countercheck, reconcile state, inspect the current finishline or choose the next safe executable task.

## Mandatory preflight
Before substantive code, infrastructure, configuration, workflow or product-state work:
1. Read `AGENTS.md`, `docs/SOURCE_OF_TRUTH.md`, `EXECUTION_POLICY.md`, `CURRENT_STATE.md`, `FANMIND_DEEP_AUDIT_2026-08-19.md`, `FANMIND_FINISHLINE.md`, `FINISHLINE_STATE.json`, `NEXT_BEST_ACTION.md`, `DEFERRED_OWNER_ACTIONS.md`, `SESSION_HANDOFF.md`, `STARTED_WORK.md`, `WORK_LOCKS.md`, `OPEN_LOOPS.md`, `TASK_LEDGER.md`, `DEPENDENCIES.md` and `DECISIONS.md`.
2. If the requested/current task is owner-deferred, do not ask again by default. Run `scripts/fanmind_next_best_action.py` and continue with the selected `parallel_safe` task unless the owner explicitly resumes the deferred action.
3. For Restore work also read `RESTORE_STATE_MACHINE.md` and the canonical Restore runbook before acting.
4. For provider, Mobile, billing, legal or other external work read `EXTERNAL_ACCEPTANCE.md` and do not infer acceptance from repository evidence alone.
5. Search `FAILED_ATTEMPTS.md`, `DO_NOT_ASSUME.md`, `ASSUMPTIONS.md`, `CONTRADICTIONS.md` and `CHANGE_REQUESTS.md` for the intended area, error, assumption and prior approach.
6. Read `EVIDENCE.md`, `PROJECT_STATUS.md`, `PROJECT_REGISTRY.md` and `AUTHORIZATIONS.md` when relevant.
7. Check actual branch/head, recent commits/PRs, current CI/security/supply-chain/runtime/provider state and central finishline #874.
8. Search existing task/change IDs before creating new work.
9. Do not repeat completed, rejected, superseded or failed approaches without new recorded evidence.
10. Assign Risk `R1`–`R4`, record critical assumptions, define expected scope and define the evidence/quorum that will prove success before implementation.

## V6 finishline contract

- `FINISHLINE_STATE.json` is the machine-readable current finishline state.
- `FANMIND_FINISHLINE.md` is the human-readable board and must agree with that state.
- `NEXT_BEST_ACTIONS.json` is the machine-readable prioritized execution catalog.
- `DEFERRED_OWNER_ACTIONS.md` records owner-only/external steps deliberately postponed for later.
- `scripts/fanmind_next_best_action.py` derives the next safe action. An earlier deferred/owner-required action stays open; only later `parallel_safe=true` actions may execute around it.
- `NEXT_BEST_ACTION.md` is generated from finishline, action catalog and owner-deferred state and must remain current.
- `scripts/fanmind_sales_readiness.py` derives `SALES_READY`; never manually claim sales readiness contrary to the machine state.
- `scripts/fanmind_truth_drift_check.py` checks canonical roadmap/source-truth invariants and requires known drift to be explicitly recorded in `CONTRADICTIONS.md`.
- `.github/workflows/project-memory-quality.yml` runs V6 quality, sales-readiness, canonical-truth-drift and next-best-action controls on pull requests, manual dispatch and the daily schedule without adding a second hosted-checkout workflow.
- Phase 8 must stay `not started` during the current finishline.
- A known contradiction may remain explicitly `RECONCILIATION_REQUIRED`; an unknown contradiction may not be silently tolerated.

## Next-best-action rule

1. Preserve finishline priority; never mark a deferred owner step complete just because work proceeds elsewhere.
2. If the earliest unresolved action is `DEFERRED_BY_OWNER` or otherwise owner/platform-only, later work is eligible only when explicitly `parallel_safe=true` and all listed prerequisite gates are accepted.
3. Never select Social or Sales around an unresolved earlier owner-only/non-Social gate unless their explicit prerequisites are accepted.
4. Never auto-select payment, destructive retention, protected Production mutation, legal acceptance, credentials/signing or provider activation merely because it is next in sequence.
5. When the owner explicitly resumes a deferred action, remove/update its deferred status; the selector must then naturally restore its original finishline priority.
6. If nothing safe is executable, surface the earliest unresolved owner action instead of inventing work.

## Started-work and lock rule
As soon as substantive work begins:
- create or refresh its `STARTED_WORK.md` entry;
- acquire/update its Task-ID lock in `WORK_LOCKS.md`;
- record completed-so-far, still-open, exact-next-step and owner-action-needed fields;
- keep unfinished work visible until explicitly closed or superseded.

A stale lock is not free. Reconcile it against PRs, commits, receipts and started-work state before reuse.

## Mandatory countercheck
Before completion, merge or a success report:
1. Re-read the goal and acceptance criteria.
2. Inspect the final diff and compare actual vs expected scope.
3. Verify evidence freshness against the current commit/PR/build/runtime/device/provider/target.
4. Use countercheck evidence independent from the implementation self-report.
5. Verify the relevant negative, regression, proof-of-absence or fail-closed path.
6. For R3/R4 work, require at least two evidence classes; state-changing work also requires rollback/recovery proof.
7. Ask: **What observation would prove this conclusion wrong?** Check it where feasible.
8. Reconcile `TASK_LEDGER.md`, `STARTED_WORK.md`, `WORK_LOCKS.md`, `OPEN_LOOPS.md`, `DEPENDENCIES.md`, `EVIDENCE.md`, `ASSUMPTIONS.md`, `CONTRADICTIONS.md`, `EXTERNAL_ACCEPTANCE.md`, `FINISHLINE_STATE.json`, `NEXT_BEST_ACTION.md`, `DEFERRED_OWNER_ACTIONS.md`, execution receipts, PR/branch state and CI/runtime evidence.
9. Any unresolved mismatch becomes `RECONCILIATION_REQUIRED` and prevents a clean completion claim.
10. Write/update the execution receipt and release/refresh the work lock.

## Completion state machine
New substantive work progresses through:
`TODO -> IN_PROGRESS -> IMPLEMENTED -> VERIFIED -> COUNTERCHECKED -> ACCEPTED -> PRODUCTION_CONFIRMED` where applicable.

`BLOCKED`, `PARTIAL`, `IMPLEMENTED_NOT_VERIFIED`, `RECONCILIATION_REQUIRED`, `REJECTED`, `SUPERSEDED`, `DEFERRED` and `DUPLICATE` remain valid side states. Historical v1 `DONE` records remain historical only.

## Completion quorum
- R1: scope/diff + relevant evidence.
- R2: implementation evidence + relevant automated/manual verification + countercheck.
- R3: at least two independent evidence classes + negative/regression path + rollback/recovery where state changes.
- R4: R3 plus all applicable security/governance/target acceptance controls and explicit protected-boundary confirmation where the platform requires it.

## Restore-specific R4 progression
The real Restore follows `RESTORE_STATE_MACHINE.md`; states cannot be skipped. `BACKUP_ACCEPTED` does not equal a completed Restore. Material host/policy/artifact/target drift can invalidate later evidence and force revalidation.

## External acceptance rule
Any control in `EXTERNAL_ACCEPTANCE.md` can be marked `ACCEPTED` only from current external/operator evidence bound to the relevant account/project/build/commit/target. Code, tests and CI alone cannot self-approve it.

## Sales readiness rule
`SALES_READY=true` is allowed only when the machine-readable finishline says every `required_for_sales` gate is in an allowed accepted state and Phase 8 remains not started. Phase 4 alone never satisfies sales handoff.

## Milestone closeout
Before closing a phase, release, restore drill or other milestone, review project-wide:
- tasks and started work;
- finishline state, next-best-action state and external acceptance;
- deferred owner actions;
- work locks and execution receipts;
- open loops and dependencies;
- failed attempts and change requests;
- assumptions and contradictions;
- PR/CI/security/runtime/device/provider evidence.

Carry every unresolved item forward explicitly. Never make unfinished work disappear by closing a milestone.

## Mandatory postflight
After meaningful work update, as applicable:
- `TASK_LEDGER.md` and `CURRENT_STATE.md`;
- `FANMIND_FINISHLINE.md`, `FINISHLINE_STATE.json`, `NEXT_BEST_ACTION.md` and `DEFERRED_OWNER_ACTIONS.md`;
- `STARTED_WORK.md`, `WORK_LOCKS.md` and `EXECUTION_RECEIPTS.md`;
- `OPEN_LOOPS.md`, `DEPENDENCIES.md` and `EVIDENCE.md`;
- `EXTERNAL_ACCEPTANCE.md`, `ASSUMPTIONS.md`, `CONTRADICTIONS.md`, `DECISIONS.md` and `FAILED_ATTEMPTS.md`;
- `CHANGE_REQUESTS.md` and `SESSION_HANDOFF.md`.

## Source-of-truth precedence
Verified current repository/runtime/provider evidence wins over conversational recollection when they conflict. Existing FanMind source-of-truth and security/operations documents remain authoritative for their domains. Record contradictions rather than silently reconciling them.

## Standing authorization
Reuse permissions documented in `AUTHORIZATIONS.md` without asking again where technically and safely permitted. This does not override platform confirmations, missing credentials, protected Production/billing/destructive/compliance boundaries or red governance/security gates.

## Core invariant
**Project memory -> canonical/live truth -> finishline/external/deferred state -> next-best-action selection -> previous attempts -> risk/assumptions -> started-work/lock -> dependencies/evidence plan -> action -> independent countercheck -> reconciliation -> execution receipt -> memory update.**

Never store passwords, API keys, private tokens, plaintext backup material, secret values or private credentials here.
