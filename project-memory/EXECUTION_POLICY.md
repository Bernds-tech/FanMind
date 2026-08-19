# Execution Policy

Mandatory default for all substantive agent/Codex/automation work.

## First-pass preflight
Before acting, read `AGENTS.md` and the relevant `project-memory/` sources: current state, task ledger, change requests, decisions, failed attempts, open loops, dependencies, evidence, do-not-assume, session handoff, project/cross-project status and authorizations. Then verify the actual branch/head, open PRs/checks and current implementation/runtime evidence.

Do not wait for the owner to say "check first". This preflight is automatic.

## Duplicate/regression check
Confirm the work is not already implemented, the same approach was not already rejected/failed without new evidence, the scope belongs here, dependencies are satisfied, and success evidence is defined before editing.

## Independent second-pass countercheck
Before completion/merge/reporting success: re-read the goal, inspect the final diff, verify tests/evidence, check for unrelated changes/regressions, re-check dependencies/open loops, and update project memory. Never equate implemented with accepted without evidence.

## Stop conditions
Do not bypass red governance/security/supply-chain checks, missing dependencies/secrets, contradictory verified evidence, production/billing/destructive/compliance boundaries, or previously failed approaches without new justification.

## Standing permissions
Reuse permissions documented in `AUTHORIZATIONS.md` without asking again where technically and safely allowed. Platform confirmations and protected/destructive boundaries still apply.

## Invariant
**Project memory -> actual Git/runtime state -> previous attempts -> dependency/evidence check -> action -> independent countercheck -> memory update.**
