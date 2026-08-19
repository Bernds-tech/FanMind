# Project Memory Protocol v5

This directory is the operational memory for FanMind. It complements code, tests, Git history and canonical product documentation; it does not replace them.

## Mandatory execution policy
`EXECUTION_POLICY.md`, `COUNTERCHECK_POLICY.md` and `QUALITY_CONTROL.md` are mandatory. The owner does not need to ask an agent to check first, remember started work, perform a countercheck, or reconcile state.

## Mandatory preflight
Before substantive code, infrastructure, configuration, workflow or product-state work:
1. Read `AGENTS.md`, `EXECUTION_POLICY.md`, `CURRENT_STATE.md`, `SESSION_HANDOFF.md`, `STARTED_WORK.md`, `WORK_LOCKS.md`, `OPEN_LOOPS.md`, `TASK_LEDGER.md`, `DEPENDENCIES.md` and `DECISIONS.md`.
2. Search `FAILED_ATTEMPTS.md`, `DO_NOT_ASSUME.md`, `ASSUMPTIONS.md`, `CONTRADICTIONS.md` and `CHANGE_REQUESTS.md` for the intended area, error, assumption and prior approach.
3. Read `EVIDENCE.md`, `PROJECT_STATUS.md`, `CROSS_REPO_MASTER_STATUS.md`, `PROJECT_REGISTRY.md` and `AUTHORIZATIONS.md` when relevant.
4. Check actual branch/head, working tree, recent commits/PRs and current CI/security/supply-chain/runtime state.
5. Search existing task/change/cross-project IDs before creating new work.
6. Do not repeat completed, rejected, superseded or failed approaches without new recorded evidence.
7. Assign Risk `R1`–`R4`, record critical assumptions, define expected scope and define the evidence/quorum that will prove success before implementation.

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
3. Verify evidence freshness against the current commit/PR/build/runtime/device/target.
4. Use countercheck evidence independent from the implementation self-report.
5. Verify the relevant negative, regression, proof-of-absence or fail-closed path.
6. For R3/R4 work, require at least two evidence classes; state-changing work also requires rollback/recovery proof.
7. Ask: **What observation would prove this conclusion wrong?** Check it where feasible.
8. Reconcile `TASK_LEDGER.md`, `STARTED_WORK.md`, `WORK_LOCKS.md`, `OPEN_LOOPS.md`, `DEPENDENCIES.md`, `EVIDENCE.md`, `ASSUMPTIONS.md`, `CONTRADICTIONS.md`, execution receipts, PR/branch state and CI/runtime evidence.
9. Any unresolved mismatch becomes `RECONCILIATION_REQUIRED` and prevents a clean completion claim.
10. Write/update the execution receipt and release/refresh the work lock.

## Completion state machine
New substantive work progresses through:
`TODO -> IN_PROGRESS -> IMPLEMENTED -> VERIFIED -> COUNTERCHECKED -> ACCEPTED -> PRODUCTION_CONFIRMED` where applicable.

`BLOCKED`, `PARTIAL`, `IMPLEMENTED_NOT_VERIFIED`, `REJECTED`, `SUPERSEDED`, `DEFERRED` and `DUPLICATE` remain valid side states. Historical v1 `DONE` records remain historical only.

## Completion quorum
- R1: scope/diff + relevant evidence.
- R2: implementation evidence + relevant automated/manual verification + countercheck.
- R3: at least two independent evidence classes + negative/regression path + rollback/recovery where state changes.
- R4: R3 plus all applicable security/governance/target acceptance controls and explicit protected-boundary confirmation where the platform requires it.

## Milestone closeout
Before closing a phase, release, restore drill or other milestone, review project-wide:
- tasks and started work;
- work locks and execution receipts;
- open loops and dependencies;
- failed attempts and change requests;
- assumptions and contradictions;
- PR/CI/security/runtime/device evidence.

Carry every unresolved item forward explicitly. Never make unfinished work disappear by closing a milestone.

## Mandatory postflight
After meaningful work update, as applicable:
- `TASK_LEDGER.md` and `CURRENT_STATE.md`;
- `STARTED_WORK.md`, `WORK_LOCKS.md` and `EXECUTION_RECEIPTS.md`;
- `OPEN_LOOPS.md`, `DEPENDENCIES.md` and `EVIDENCE.md`;
- `ASSUMPTIONS.md`, `CONTRADICTIONS.md`, `DECISIONS.md` and `FAILED_ATTEMPTS.md`;
- `CHANGE_REQUESTS.md` and `SESSION_HANDOFF.md`.

## Source-of-truth precedence
Verified current repository/runtime evidence wins over conversational recollection when they conflict. Existing FanMind source-of-truth and security/operations documents remain authoritative for their domains. Record contradictions rather than silently reconciling them.

## Standing authorization
Reuse permissions documented in `AUTHORIZATIONS.md` without asking again where technically and safely permitted. This does not override platform confirmations, missing credentials, protected Production/billing/destructive/compliance boundaries or red governance/security gates.

## Core invariant
**Project memory -> actual Git/runtime state -> previous attempts -> risk/assumptions -> started-work/lock -> dependencies/evidence plan -> action -> independent countercheck -> reconciliation -> execution receipt -> memory update.**

Never store passwords, API keys, private tokens, plaintext backup material, secret values or private credentials here.
