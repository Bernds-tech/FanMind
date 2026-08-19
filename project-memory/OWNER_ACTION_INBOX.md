# FanMind Owner Action Inbox

This is the single compact queue for actions that genuinely require the owner, an external provider, protected UI access, payment authorization, legal/tax evidence or another capability unavailable to the assistant.

## FM-RST-OWNER-001 — Restore runner-group policy + host readiness
- Status: DEFERRED_BY_OWNER
- Where: GitHub Organization `FanMind` -> Settings -> Actions -> Runner groups -> `fanmind-restore-drill`
- Why: current organization runner-group policy must be independently verified before Restore can advance.
- Risk: R4
- Duration class: short
- Resume trigger: owner explicitly resumes Restore admin step or current Project Memory records accepted external evidence from another chat/session.
- Do not ask before: explicit owner resume.

## FM-GOV-OWNER-001 — Protect `main`
- Status: DEFERRED_BY_OWNER
- Where: GitHub repository/organization Rulesets or Branch Protection UI
- Why: `main` should require PRs/checks and block force-push/delete/direct routine pushes.
- Risk: R3
- Duration class: short
- Resume trigger: owner chooses to complete GitHub governance setup.
- Do not ask before: explicit owner resume.

## Rules
- `DEFERRED_BY_OWNER` means keep visible but do not repeatedly interrupt the owner.
- When an action is completed in another chat/session, reconcile GitHub/Project Memory evidence first, then mark it done here.
- Never infer provider, payment, signing, destructive, legal or protected Production acceptance from code or chat text alone.
