# FanMind Evidence and Acceptance

Implementation status and acceptance status are deliberately separate.

## Status model
- `IMPLEMENTED`: code/configuration exists.
- `IMPLEMENTED_NOT_VERIFIED`: implementation exists but required verification is missing or incomplete.
- `VERIFIED`: defined technical checks passed with evidence.
- `ACCEPTED`: the required real-world/staging/device/operator acceptance is complete.
- `PRODUCTION_CONFIRMED`: production state has been independently confirmed where production proof is applicable.

`DONE` is retained only for historical v1 entries. New work should use the status model above.

## Evidence entry schema
Each evidence record should contain:
- unique evidence ID;
- related task/change ID;
- date;
- environment/target;
- evidence type (test, workflow, commit/PR, screenshot/device check, operator acceptance, production confirmation, etc.);
- immutable reference where possible;
- result;
- limitations;
- acceptance state.

Never store secrets, private credentials, plaintext sensitive payloads, or unsafe diagnostic material.

## FM-EV-001
- Related: FM-MEM-001
- Date: 2026-08-19
- Target: repository governance
- Type: merged repository controls
- Reference: Project Memory Protocol v1 files and guard workflow on `main`
- Result: repository-level project memory established
- Limitations: v1 did not yet separate open loops, dependencies, acceptance levels or stale scanning
- Acceptance: VERIFIED
