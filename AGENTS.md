<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# FanMind production and Codex guardrails

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

## Current product truth

- FanMind is no longer to be treated as a slide demo or a throwaway mockup. Build and describe it as a real AI-supported CRM and communication system that is becoming production-ready.
- The word "Demo" should mean a free test access or prepared example workspace only. The product itself should look and feel like a serious CRM system.
- Current commercial truth: Starter is `312 €/Monat`. Do not reintroduce the old `299 €/Monat` pricing.
- The core sales flow remains: landing page -> free test/demo login -> dashboard -> fans/contacts -> contact detail -> AI reply suggestions -> copy answer -> save memory -> save follow-up -> roadmap.
- Active CRM core: login, registration, dashboard, contacts/fans, contact detail, CSV import, server-side AI reply suggestions, memory, follow-ups, roadmap, admin/billing groundwork, Stripe test checkout, and draft legal pages.
- Position FanMind as a Copy-&-Open assistant, not as a bot. AI prepares replies; the human reviews, copies, opens the original channel if needed, and sends manually.

## MVP scope

Build FanMind as a real CRM core, not as a slide/demo shell. Active MVP functionality may include:

- Login and registration
- Protected dashboard
- Contacts/fans list
- Contact detail page
- Server-side AI reply suggestions
- Memory
- Follow-ups
- CSV import
- Honest roadmap with clear active/in-progress/coming-soon status

## Hard stop rules

Do not build or present as active unless explicitly requested and validated:

- No real Instagram, TikTok, WhatsApp, Facebook, X/Twitter or Discord integration as active functionality
- No scraping
- No automatic sending
- No storage of external platform login credentials
- No campaign sending automation
- No full analytics suite unless explicitly scoped
- No enterprise role/permission complexity unless explicitly scoped

Social integrations, analytics, campaign logic, and automation must remain clearly marked as Roadmap, Coming Soon, Beta / in preparation, or later pilot-feedback work unless the user explicitly changes scope. Meta channels may be prepared next, but must not be presented as live until technically and legally tested.

## AI safety and implementation rules

- Use `OPENAI_API_KEY` only server-side.
- Never expose API keys in browser code, logs, screenshots, commits, or client-side bundles.
- Keep human-in-the-loop messaging: FanMind can draft and suggest, but must not automatically send messages.
- Prefer structured outputs for reply suggestions, memory suggestions, and follow-up suggestions.
- Keep UI copy honest: no fake customer logos, no fake testimonials, no fake live integrations.

## Development expectations for Codex

Before changing code:

1. Inspect the existing implementation and routes.
2. Preserve the current production deployment workflow.
3. Keep changes small, testable, and aligned with the CRM/MVP scope.
4. Run the relevant checks locally when possible, especially `npm run build`.
5. Avoid broad rewrites unless the user explicitly asks for them.

After changing code:

1. Summarize what changed.
2. Mention affected files.
3. Call out any migration, environment, or production-deploy impact.
