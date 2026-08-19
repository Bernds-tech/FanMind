# FanMind Dependencies

Track ordering and prerequisites here. Do not mark dependent work accepted while a required prerequisite remains unresolved.

## FM-DEP-001
- From: FM-RST-001
- Requires: existing reviewed restore workflow, restore environment, runner-group policy and isolated PostgreSQL target
- Type: internal + external control
- Status: ACTIVE
- Updated: 2026-08-19
- Rule: Continue from the first unproven gate; do not recreate already-established infrastructure merely because a later gate is blocked.

## Dependency states
`ACTIVE`, `SATISFIED`, `BLOCKED`, `SUPERSEDED`.

Cross-repository dependencies must name the repository and foreign task/change ID. If a feature spans repositories, create one cross-project ID in `PROJECT_REGISTRY.md` and link the local subtasks here.
