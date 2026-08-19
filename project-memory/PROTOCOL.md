# Project Memory Protocol v3

This directory is the operational memory for FanMind. It complements code, tests, Git history and canonical product documentation; it does not replace them.

## Mandatory execution policy
`EXECUTION_POLICY.md` is mandatory. Its first-pass preflight, duplicate/regression check and independent second-pass countercheck apply automatically. The owner does not need to ask an agent to "check first".

## Mandatory preflight
Before any code, infrastructure, configuration, workflow or product-state change:
1. Read `AGENTS.md`, `EXECUTION_POLICY.md`, `CURRENT_STATE.md`, `SESSION_HANDOFF.md`, `OPEN_LOOPS.md`, `TASK_LEDGER.md`, `DEPENDENCIES.md` and `DECISIONS.md`.
2. Search `FAILED_ATTEMPTS.md`, `DO_NOT_ASSUME.md` and `CHANGE_REQUESTS.md` for the intended area, command, error and approach.
3. Read `PROJECT_STATUS.md`, `CROSS_PROJECT_MASTER_STATUS.md` and `AUTHORIZATIONS.md` when present.
4. Check actual branch/head, git status, recent commits/PRs and current CI/security/supply-chain state.
5. Search for an existing task/change ID before creating a new one.
6. Do not repeat a completed, rejected, superseded or failed approach unless new evidence is recorded first.
7. Define the evidence that will prove success before implementation.

## Mandatory countercheck
Before completion, merge or a success report:
1. Re-read the goal and acceptance criteria.
2. Inspect the final diff.
3. Re-run or inspect the relevant tests/checks/evidence.
4. Verify no unrelated scope, regression or security-boundary reversal slipped in.
5. Re-check open loops and dependencies created by the change.
6. Update project memory with exact result, evidence, blocker/failure and next step.

## Mandatory postflight
After meaningful work:
1. Record the result in `TASK_LEDGER.md`.
2. Update `CURRENT_STATE.md` when the real current state changed.
3. Record architecture/product decisions in `DECISIONS.md`.
4. Record failed or unsafe approaches in `FAILED_ATTEMPTS.md` with why they must not be repeated.
5. Capture user ideas in `CHANGE_REQUESTS.md` before silently changing scope.
6. Update `OPEN_LOOPS.md`, `DEPENDENCIES.md`, `EVIDENCE.md` and `SESSION_HANDOFF.md` as applicable.

## Status vocabulary
Use accurate implementation/verification/acceptance states. Historical v1 `DONE` remains valid, but new work must not be called done without required evidence.

## Source-of-truth precedence
Repository code and passing tests describe actual runtime behavior. Existing canonical FanMind source-of-truth and security/operations documents remain authoritative for their domains. Project memory records operational history, execution state, attempts and decisions. Verified current repository/runtime evidence wins over conversational recollection when they conflict.

## Standing authorization
Reuse permissions documented in `AUTHORIZATIONS.md` without asking again where technically and safely permitted. This does not override platform confirmations, missing credentials, protected Production/billing/destructive/compliance boundaries or red governance/security gates.

## Core invariant
**Project memory -> actual Git/runtime state -> previous attempts -> dependency/evidence check -> action -> independent countercheck -> memory update.**

Never store passwords, API keys, private tokens, plaintext backup material, secret values or private credentials here.
