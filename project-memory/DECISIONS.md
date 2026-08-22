# FanMind Decision Log

Decisions are append-only. If a decision changes, add a new entry that explicitly supersedes the old one.

## FM-DEC-001
- Date: 2026-08-19
- Status: DONE
- Decision: GitHub repository state plus `project-memory/` is the durable technical project memory; conversational memory is supplementary only.
- Reason: Prevent duplicate implementation attempts and loss of micro-history across chats/sessions.

## FM-DEC-002
- Date: 2026-08-19
- Status: DONE
- Decision: New user ideas enter through `CHANGE_REQUESTS.md` before scope is silently changed.
- Reason: Preserve execution focus while ensuring ideas are never lost.

## FM-DEC-003
- Date: 2026-08-19
- Status: DONE
- Decision: A completed task is not reopened or rewritten merely because a later feature is related; later scope receives a new change/task ID.
- Reason: Keep historical completion truth intact.

## FM-DEC-004
- Date: 2026-08-19
- Status: DONE
- Decision: Restore drills never target Production or shared Supabase Staging and should not spawn another restore server by default.
- Reason: Maintain isolation and avoid restarting already completed infrastructure work.

## FM-DEC-005
- Date: 2026-08-22
- Status: DONE
- Decision: Self-hosted Restore workflow CA-path controls are pinned to `/etc/ssl/certs/ca-certificates.crt` and `/etc/ssl/certs`, validated as canonical root-owned non-runner-writable system truststore objects before checkout; `GIT_SSL_NO_VERIFY` remains unset.
- Reason: Empty CA-path exports override truststore discovery and caused run `32568632008` to fail, while simply removing the variables would permit ambient runner values to influence the R4 checkout boundary.
