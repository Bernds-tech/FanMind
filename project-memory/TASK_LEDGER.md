# FanMind Task Ledger

Use one heading per task/attempt. Never delete historical entries; supersede them explicitly.

## FM-MEM-001
- Date: 2026-08-19
- Status: DONE
- Goal: Introduce durable project memory and duplicate-work prevention.
- Starting state: Git/code history existed, but micro-attempts and conversational decisions were not systematically tracked in one operational ledger.
- Action: Added Project Memory Protocol v1 structure and PR guard.
- Result: Repository-level operational memory established.
- Evidence: `project-memory/` and `.github/workflows/project-memory-guard.yml`.
- Next step: Import/record new implementation attempts as work continues.
- Do not repeat: Do not create a second competing memory system; extend this one.

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
