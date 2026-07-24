<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# FanMind production, product truth and Codex guardrails

## Current production environment

- Production domain: `https://fanmind.ch`
- Production server: Exoscale instance `fanmind-prod-01`
- Production SSH user: `ubuntu`
- Production path: `/var/www/fanmind`
- Process manager: PM2 process named `fanmind`
- Reverse proxy: nginx
- Environment file on server: `/var/www/fanmind/.env.production`
- GitHub deployment workflow: `.github/workflows/deploy-fanmind.yml`
- Deployment runner: self-hosted GitHub Actions runner on Exoscale with labels `fanmind-prod`, `exoscale`, `linux`, `x64`

The old Cloudzy path `/srv/www/fanmind` and `systemctl restart fanmind` are no longer the production deployment path. Do not reintroduce Cloudzy-specific deployment commands.

## Production deploy command sequence

The deployment workflow deploys `main` on the Exoscale server with:

```bash
cd /var/www/fanmind
git fetch --prune origin main
git reset --hard origin/main
npm ci --no-audit --no-fund
npm run build
pm2 restart fanmind --update-env
pm2 save
sudo nginx -t
```

Do not commit secrets. Keep `.env.production`, `.env.local`, API keys, Supabase keys, OpenAI keys, Stripe keys, runner tokens, and snapshot URLs out of GitHub.

## Source of Truth

- Canonical product and implementation truth lives in `docs/SOURCE_OF_TRUTH.md`.
- README is the reader-friendly project overview and must match `docs/SOURCE_OF_TRUTH.md`.
- Database/RLS truth lives in `docs/database/fanmind_current_schema.md` plus the Supabase migrations under `supabase/migrations/`.
- Mobile product, architecture and beta handoff truth lives in `apps/mobile/README.md`, `docs/mobile/ARCHITECTURE.md` and `docs/mobile/BETA_RELEASE.md`; Web and Mobile share backend contracts deliberately but never UI code.
- Security/RLS/Secrets checks live in `docs/SECURITY_RLS_SECRETS_CHECK.md`.
- AI usage/cost monitoring requirements live in `docs/AI_COST_MONITORING.md`.
- Canonical AI tier policy lives in `src/config/aiTiers.mjs`; do not duplicate prices, referral eligibility, auto-send rules or automatic-booking readiness across UI files.
- Referral Growth Window requirements live in `docs/REFERRAL_PROGRAM.md`.
- When updating pricing, scope, demo flow, integrations, referral logic, billing or AI model behavior, update all relevant reader files in the same PR.

## Current product truth

- FanMind is not a slide demo or throwaway mockup. Build and describe it as a real AI-supported CRM and communication system that is becoming production-ready.
- The word `Demo` means free test access or a prepared example workspace only. The product itself must look and feel like a serious CRM system.
- Current commercial truth: the paid Pilot/Setup package is retired. Public paid offers are `Starter Flex = 990 € one-time setup + 312 €/month` and `Starter 12 Monate = 0 € setup + 312 €/month with a 12-month minimum term, then monthly renewal`. KI Standard is included; KI Plus is +100 €/month; KI Ultra is +200 €/month. Do not reintroduce the old Pilot or 299 €/month pricing.
- Growth, Agency and Enterprise remain Roadmap / Coming Soon / Auf Anfrage unless explicitly scoped and validated.
- Referral Growth Window truth: planned until FanMind reaches 2.000 active paying customers/workspaces. During the open window, each active referred paying customer/workspace gives the referrer 5 % discount on ongoing FanMind costs; maximum 20 active referrals count per referrer; after the 2.000 cap closes the window, existing active discounts remain but no new additional discount percentages are earned unless the window is explicitly reopened.
- The frozen sales/demo flow is: landing page -> login/demo -> dashboard -> fans/contacts -> CSV import or Sandra/demo contact -> contact detail -> existing/latest inbound message -> AI reply suggestions -> copy answer -> save memory -> save follow-up -> follow-up list / roadmap.
- Active CRM core: login, registration, protected dashboard, contacts/fans, contact detail, CSV import, server-side AI reply suggestions, contact knowledge, follow-ups, roadmap, admin/billing groundwork, Stripe test checkout, legal pages, and temporary demo workspace.
- Active Mobile Phase B repository scope: independent Expo/React-Native app with native login, PKCE password recovery, secure session persistence and local purge, dashboard, contact list/search/create/edit/detail, contact knowledge, server-side AI reply suggestions and follow-ups. Supabase redirect approval, signed internal builds, real-device verification and store distribution remain separate external release steps.
- Position FanMind as a Copy-&-Open assistant, not as a bot. AI prepares replies; the human reviews, copies, opens the original channel if needed, and sends manually.
- Any in-app sending flow, including Telegram, must be disabled, hidden, feature-flagged, or explicitly documented as a separate validated pilot before it appears in a normal Gerhard/Sales demo.

## Active product scope

Build FanMind as a real CRM core, not as a slide/demo shell. The active product scope includes:

- Login and registration
- Protected dashboard
- Contacts/fans list
- Contact detail page
- CSV import
- Server-side AI reply suggestions
- Contact knowledge
- Follow-ups
- Honest roadmap with clear active/in-progress/coming-soon status
- Temporary demo workspace for safe sales testing
- Admin/billing groundwork only where explicitly shown as setup/payment status, not as a broad payment platform

## Mobile product boundary

- Mobile source lives under `apps/mobile` with its own package, navigation, UI primitives, CI and release cadence.
- Never turn the Mobile app into a WebView wrapper or import Next.js routes, Website CSS or Website UI components.
- Mobile may contain only public Supabase configuration and the FanMind API base URL; service-role, OpenAI, Stripe, webhook and backup secrets remain server-only.
- Mobile password recovery accepts only `fanmind://reset-password`, must validate PKCE/token callbacks fail-closed and must never log recovery codes, tokens or complete callback URLs.
- Mobile contact create/update must include the current `workspace_id`, rely on RLS as final authorization and never use a service-role key.
- Local logout must purge every registered FanMind SecureStore key and clear session, recovery and workspace state; future offline caches must join the same purge contract.
- The canonical completed follow-up status is `completed`; `done` remains read-compatible only for historical rows.
- Mobile does not perform billing, referral reconciliation, admin operations, webhook ingestion, external channel credential handling or automatic sending.
- A Web merge cannot publish a mobile binary. EAS builds, signing, Android internal testing and iOS TestFlight require explicit separate verification.

## Hard stop rules

Do not build or present as active unless explicitly requested, tested and legally/technically validated:

- No real Instagram, TikTok, WhatsApp, Facebook, X/Twitter or Discord integration as generally active functionality
- No scraping
- No automatic sending
- No hidden in-app sending behind generic `copy/open` language
- No storage of external platform login credentials
- No campaign sending automation
- No full analytics suite unless explicitly scoped
- No enterprise role/permission complexity unless explicitly scoped
- No referral discount automation until `docs/REFERRAL_PROGRAM.md` acceptance criteria, billing logic and legal/payment terms are satisfied
- No fake live integrations, fake customers, fake testimonials or fake production numbers

Social integrations, analytics, campaign logic, referral automation and automation must remain clearly marked as Roadmap, Coming Soon, Beta / in preparation, or later pilot-feedback work unless the user explicitly changes scope. Meta channels may be prepared, but must not be presented as generally live until technically and legally tested.
- The consent-gated Meta Pixel is an explicitly scoped marketing-measurement exception, not a product analytics suite: only `PageView` is active on the reviewed public-route allowlist, protected/dynamic CRM, admin and billing URLs plus unsafe query or fragment values and protected same-origin referrers are fail-closed excluded, the script must not load before consent, and no PII, CRM data, advanced matching, Conversions API or server-side Meta tracking may be added without a separate reviewed scope.

## Security, RLS and secrets rules

- Use `OPENAI_API_KEY` only server-side.
- Never expose API keys in browser code, logs, screenshots, commits, client bundles, public env vars or documentation examples.
- Supabase anon key may be public; Supabase service-role key must stay server-only.
- `FANMIND_ADMIN_EMAILS` is the only admin source. No hardcoded real admin email fallback.
- RLS must be enabled and verified for workspace-scoped tables before any pilot customer data is used.
- Every protected API route must authorize the current user against the workspace and resource it reads or mutates.
- Referral data must be workspace-scoped; users must not see other users' referral economics except through admin-only views.
- Keep human-in-the-loop messaging: FanMind can draft and suggest, but must not automatically send messages.
- Run `docs/SECURITY_RLS_SECRETS_CHECK.md` before production-affecting changes, pilot customer onboarding, integration activation, referral activation or billing activation.

## AI safety, cost and implementation rules

- Prefer a configurable server-side AI model such as `FANMIND_AI_MODEL` with a safe fallback. Avoid hardcoding model IDs in multiple places.
- Keep structured outputs for reply suggestions, memory suggestions and follow-up suggestions.
- Limit input length, context size and request rate. The current MVP must protect OpenAI spend.
- AI usage/cost observability should be added via a workspace/admin usage table before scaling: calls, estimated input tokens, estimated output tokens, model, feature, workspace, contact, status and estimated cost.
- Do not hardcode provider prices in UI copy. Keep model prices in server config and update them when provider pricing changes.

## Development expectations for Codex

Before changing code:

1. Inspect the existing implementation and routes.
2. Read `docs/SOURCE_OF_TRUTH.md`, `README.md`, and any relevant docs under `docs/`.
3. Preserve the current production deployment workflow.
4. Keep changes small, testable and aligned with the CRM/MVP scope.
5. Run the relevant checks locally when possible, especially `npm run build`.
6. Avoid broad rewrites unless the user explicitly asks for them.

After changing code:

1. Summarize what changed.
2. Mention affected files.
3. Call out any migration, environment, security, RLS, AI-cost or production-deploy impact.
4. Update reader/source-of-truth documentation if product truth, pricing, referral logic, demo path, integrations, billing or AI behavior changed.
