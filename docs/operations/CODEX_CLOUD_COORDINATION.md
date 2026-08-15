# FanMind Codex Cloud Coordination

Status: proposed operational coordination layer for Codex Cloud. This file does not replace `AGENTS.md`, `docs/SOURCE_OF_TRUTH.md`, README, database truth, mobile truth, legal truth or the existing controlled operation runbooks.

## Authoritative hierarchy

1. `main` is the only integration branch and source for new task branches.
2. `AGENTS.md` defines repository-wide agent guardrails.
3. `docs/SOURCE_OF_TRUTH.md` defines canonical product and implementation truth.
4. Area-specific canonical files named in `AGENTS.md` remain authoritative for database/RLS, Mobile, AI, Billing, Meta, Security, Legal and Operations.
5. This file is only the cross-task coordination index for Roadmap 1-7 work.

If sources conflict, stop and report the conflict. Do not invent a second truth source.

## Current delivery target

Complete FanMind through Roadmap Phase 7 only. Roadmap Phase 8+ must not be implemented or counted as progress.

The first user-facing milestone is a reliable regular Gerhard flow: registration/login -> authorized workspace -> dashboard -> contacts/fans -> conversation/inbound message -> AI reply suggestions -> copy/open -> memory -> follow-up -> inbox/follow-up list.

Roadmap 1-7 also includes the in-scope technical preparation for Meta/Facebook/Instagram/WhatsApp, Mobile, AI Plus/Ultra and Phase-7 channels, but external approvals and Production activation remain separate gates.

## Work item states

Use exactly: `BACKLOG`, `READY`, `IN_PROGRESS`, `BLOCKED_EXTERNAL`, `BLOCKED_OWNER`, `PR_OPEN`, `DONE_CODE`, `DONE_STAGING`, `DONE_PRODUCTION`.

A task must never be marked fully done merely because code exists. Record which of these four gate classes are actually complete: Code, Staging/Infrastructure, External Approval, Production Activation.

## Mandatory agent start procedure

Before changing files, every task agent must:

- confirm its base is current `main`;
- read `AGENTS.md` and the relevant Source-of-Truth/runbook files;
- search existing branches, PRs, docs and tests for the same work to avoid duplication;
- identify high-conflict files before parallel work;
- state file ownership for the task;
- state required checks and forbidden activations.

## Mandatory agent finish procedure

Every task must end with:

- task branch, commit(s) and PR against `main`;
- concise list of changed files;
- checks run and exact result;
- Code/Staging/External/Production gate status;
- blockers and owner decisions;
- next safe task(s);
- documentation/Source-of-Truth updates only where the actual implementation changed truth.

No agent may claim completion if its commit exists only in an isolated Cloud checkout. The task is not handoff-ready until the branch exists on GitHub and a PR exists, or the missing GitHub write capability is explicitly recorded as the blocker.

## Parallel work rules

Safe parallel tasks require disjoint file ownership. Treat these as coordination hot spots: `src/lib/supabase/server.ts`, `docs/SOURCE_OF_TRUTH.md`, `README.md`, `package.json`, `.github/workflows/ci-fanmind.yml`, `.github/workflows/deploy-fanmind.yml`, `scripts/operations/*`, Meta migration/rollout manifests, Stripe webhook, Meta webhook.

Do not run simultaneous tasks that modify the same hot spot unless one task is explicitly designated integration owner.

## Current Roadmap 1-7 queue

### READY

- Regular-user Staging/browser core flow with a synthetic normal workspace.
- AI Plus/Ultra: remaining provider/fallback, usage enforcement, Stripe lifecycle and runtime wiring, while preserving fail-closed activation gates.
- Meta Staging chain: conversation continuation -> catch-up queue -> webhook/cursor/workspace processing E2E.
- Stripe Staging billing lifecycle.
- Mobile signed internal build and real-device evidence, plus push Staging gates where already defined.
- Restore drill and remaining Roadmap-1-7 operational evidence.
- Phase-7 provider readiness for TikTok, X/Twitter and Discord; OnlyFans remains evaluation-only.

### BLOCKED_EXTERNAL / BLOCKED_OWNER

- Meta App Review, Advanced Access, Business Verification and provider credentials.
- WhatsApp Cloud API and Phase-7 provider accounts/credentials.
- Expo/EAS, Apple and Google signing/portal actions.
- Private AI quality evaluation and final model/provider decisions where owner approval is required.
- Legal, tax, AVV, provider-contract and transfer approvals.

### PROHIBITED FOR THIS PHASE

- Roadmap Phase 8+.
- Premature Production activation of Meta, Mobile Push, AI Plus/Ultra or Phase-7 channels.
- Automatic sending outside an explicitly validated pilot.
- Marking external/legal/provider gates complete through documentation alone.

## Work log rule

Git history and PRs remain the immutable work log. Each PR description must include: goal, scope, changed files, checks, gate status, blockers and next safe work. Do not create duplicate historical status files for every task; update an existing canonical runbook/status file only when its truth changes.
