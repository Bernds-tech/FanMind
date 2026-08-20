# Pending execution receipt

This temporary branch-only receipt records the in-progress R4 implementation. It must be folded into the canonical append-only execution receipt or removed before merge.

- Task: `FM-RST-001`
- Branch: `restore-schema-acl-recovery-20260820`
- Started: 2026-08-20 16:10 Europe/Vienna
- Risk: R4
- Scope: fail-closed recovery of the proven eight-tuple `graphql` / `graphql_public` schema ACL gap on the isolated bare PostgreSQL Restore target.
- Preconditions: mandatory FanMind preflight; current main `12d7ecd4cb0c8b3a1a8104745479d3cf29a1dc2f`; current Restore/operator evidence; Production read-only catalog comparison; no active conflicting FM-RST-001 lock.
- Lock: `LOCK-FM-RST-001-SCHEMA-ACL-RECOVERY-20260820`.
- Changes underway: dedicated recovery helper, bounded apply/rollback contract, unchanged final authorization fingerprint postcheck, runner wiring, policy tests and Project Memory root-cause record.
- No external mutation performed by this repository implementation.
- Acceptance pending: exact-head CI/security/governance checks, diff countercheck, PR review/merge, then fresh protected isolated Restore rerun. Do not mark `DB_POSTCHECKED` or `ACCEPTED` from this receipt.
