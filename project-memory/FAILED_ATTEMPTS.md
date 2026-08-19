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

## FM-FAIL-003
- Date: 2026-08-19
- Status: DONE
- Area: Supply-chain test maintenance
- Attempt: Use hard-coded total counts of hosted checkout workflows/usages as the primary policy assertion.
- Result: Adding legitimate Project Memory workflows made the operations test fail although all hosted checkouts still used the reviewed immutable SHA.
- Cause: topology count was coupled to a valid evolving workflow set.
- Decision: Count expectations were reconciled for the intentional V5 workflow additions without downgrading SHA policy; future changes must inspect semantic policy rather than treating a changed count alone as a vulnerability.
- Do not repeat: Never downgrade hosted workflows to restore-runner checkout v4 merely to satisfy an old count.

## FM-FAIL-004
- Date: 2026-08-19
- Status: DONE
- Area: GitHub contents API editing
- Attempt: Use an excerpt returned by a partial `fetch_file` response as if `update_file` performed a patch.
- Result: `update_file` replaces the complete file; an excerpt-only update would truncate the file.
- Cause: connector write semantics were not respected for that one step.
- Decision: The full supply-chain test file was restored immediately from `main` and only the intended expectations were changed.
- Do not repeat: For `update_file`, always supply a verified complete file body; if full content cannot be safely obtained, use a proper local patch/branch workflow instead of guessing.

## FM-FAIL-005
- Date: 2026-08-19
- Status: DONE
- Area: Status planning
- Attempt: Treat old issue checkboxes/percentages such as Restore `0/4` or historical P1 Staging prerequisites as the complete current state.
- Result: Would undercount completed preparation and cause duplicate Staging/Restore work while still potentially overstating real Acceptance if interpreted carelessly.
- Cause: old trackers intentionally preserve historical checklist state while later commits/runs advanced prerequisites.
- Decision: Separate implementation/preparation from real acceptance and reconcile against #874, current commits/runs and Deep Audit before work.
- Do not repeat: No execution solely from an old percentage or unchecked issue box.

## FM-FAIL-006
- Date: 2026-08-19
- Status: DONE
- Area: Sales readiness
- Attempt: Interpret Phase 4 completion/prepared sales documents as completed technical sales handoff.
- Result: Conflicts with later binding decision that required Phase-3 and Phase-7 real channel acceptance comes first.
- Cause: roadmap truth changed after earlier sales-readiness language.
- Decision: Phase 4 = production/billing base only; FM-SALES-001 remains blocked until current finishline closes.
- Do not repeat: Do not call FanMind technically handed over/sales-ready merely because Phase 4 or sales docs are complete.

## FM-FAIL-007
- Date: 2026-08-19
- Status: DONE
- Area: Restore authorization truth
- Attempt: Continue relying on pre-transfer text saying the repository is user-owned and needs a future organization transfer.
- Result: Contradicts current GitHub metadata and could waste work on an already-completed ownership transition.
- Cause: canonical restore readers were not yet updated after organization change/setup.
- Decision: Ownership claim is invalidated; exact runner-group Admin policy still requires independent live revalidation before Restore dispatch.
- Do not repeat: Do not redo org transfer and do not infer runner authorization from labels or org ownership alone.
