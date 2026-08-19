# FanMind Current State

Last initialized: 2026-08-19

## Project role

FanMind is the production CRM/fan-communication product. Canonical product and implementation truth remains in `docs/SOURCE_OF_TRUTH.md`; this file records the operational execution state needed to prevent duplicate work.

## Current focus

- Staging acceptance and CSV/user-flow closure.
- Isolated real restore drill; never against Production or shared Supabase Staging.
- Mobile signing and real-device acceptance.
- AI Plus/Ultra and Stripe test lifecycle closure.
- Meta/Security final checks.
- Phase 3/7 social connector completion and sales handoff.

## Restore-drill known state

- PostgreSQL 17 restore target is isolated and self-controlled.
- Restore work is bound to the dedicated `restore-drill` environment and organization runner group.
- Host-readiness and runner work has already been attempted extensively; do not recreate infrastructure or repeat runner setup without checking the ledger and failed-attempt log first.
- Recent main history includes PostgreSQL 17.11 pinning and restore compatibility environment fixes.
- The next restore action must start from the current workflow/runner state, not from a fresh server build.

## Do not repeat by default

- Do not create another restore server merely to restart the drill.
- Do not reintroduce old Cloudzy deployment assumptions.
- Do not point restore work at Production or shared Supabase Staging.
- Do not recreate completed TLS/PostgreSQL/runner foundations unless evidence shows they changed.

## Next-state rule

Before changing this file, verify the actual repository/main state and the relevant canonical operations documentation. Record only verified state; mark uncertain items `PARTIAL` or `BLOCKED` rather than guessing.