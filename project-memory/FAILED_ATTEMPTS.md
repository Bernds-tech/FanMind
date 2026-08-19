# FanMind Failed Attempts / Do-Not-Repeat Log

Record failed, unsafe, superseded or misleading approaches here. Do not store secrets.

## FM-FAIL-001
- Date: 2026-08-19
- Status: DONE
- Area: Project execution discipline
- Attempt: Rely on chat/model memory alone to remember small implementation attempts.
- Result: Repeated work and duplicate troubleshooting paths can occur across long-running sessions.
- Cause: Conversational context is not a durable project ledger.
- Decision: Repository project memory is mandatory.
- Do not repeat: Do not begin a technical path solely from remembered conversation state; run the preflight first.

## FM-FAIL-002
- Date: 2026-08-19
- Status: DONE
- Area: Restore drill
- Attempt: Treat the restore effort as if infrastructure must be rebuilt from scratch whenever the current run is blocked.
- Result: Duplicate setup work and loss of the actual blocker.
- Cause: Missing fine-grained operational history.
- Decision: Continue from the first unproven gate after checking current workflows, runner state and ledger.
- Do not repeat: No new restore server/runner-group/TLS baseline unless verified drift or an explicit architectural decision requires it.
