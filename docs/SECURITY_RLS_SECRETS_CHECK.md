# FanMind Security-/RLS-/Secrets-Check

Stand: Juli 2026

Dieser Check muss vor Pilotkundendaten, produktiver Integration-Aktivierung, Billing-Aktivierung oder größeren Deployments geprüft werden. Ziel ist, dass FanMind als echter CRM-Kern sicher betrieben wird und keine Secrets, Workspace-Daten oder Kundendaten falsch sichtbar werden.

## 1. Ergebnisstatus

Vor einem produktionsrelevanten Release muss ein Status gesetzt werden:

- `[ ]` nicht geprüft
- `[ ]` geprüft, offene Blocker
- `[ ]` geprüft, keine Blocker
- `[ ]` geprüft, nur dokumentierte Restrisiken

Blocker dürfen nicht stillschweigend deployed werden.

## 2. Secrets und ENV

### Server-only Secrets

Diese Werte dürfen niemals in Client-Code, Logs, Screenshots, README-Beispielen mit echten Werten oder Bundles auftauchen:

- `OPENAI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `FACEBOOK_APP_SECRET`
- `FACEBOOK_WEBHOOK_VERIFY_TOKEN`
- `META_APP_SECRET`
- `META_WEBHOOK_APP_SECRET`
- `FANMIND_TOKEN_ENCRYPTION_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- Runner-/Deployment-Tokens
- echte Admin-E-Mail-Listen in nicht geschützten Kontexten

### Public ENV

Diese Werte dürfen öffentlich sein, müssen aber trotzdem korrekt gesetzt sein:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

### Checkliste

- [ ] `.env.example` enthält nur Platzhalter, keine echten Secrets.
- [ ] `.env.local` ist nicht committed.
- [ ] `.env.production` liegt nur auf dem Server und nicht in Git.
- [ ] Keine echten Secrets in Issues, PRs, Screenshots, Logs oder Dokumentation.
- [ ] `FANMIND_ADMIN_EMAILS` ist in Production gesetzt, wenn Adminbereich genutzt wird.
- [ ] Es gibt keine hardcodierten echten Admin-E-Mail-Fallbacks.
- [ ] Alle Service-Role-Zugriffe laufen serverseitig.
- [ ] Browser-Code nutzt nur Supabase URL und Anon Key.

## 3. Auth und Session

- [ ] `/dashboard`, `/fans`, `/fans/import`, `/fans/[id]`, `/followups`, `/billing/*` und `/admin/*` prüfen Supabase-Session.
- [ ] Server Actions und API-Routen prüfen Session, bevor sie Daten lesen oder schreiben.
- [ ] Logout entfernt Supabase-Session-Cookies.
- [ ] Temporäre Demo-User haben Ablaufzeit.
- [ ] Temporäre Demo-Workspaces enthalten keine echten Kundendaten.
- [ ] Öffentliche Demo-Fallbacks sind nur Notlösung und nicht primärer Sales-Pfad.

## 4. Workspace-Autorisierung

Jede geschützte Route muss User -> Workspace -> Ressource prüfen.

- [ ] Kontaktzugriff läuft über `requireContactInAuthorizedWorkspace` oder gleichwertige Prüfung.
- [ ] Workspacezugriff läuft über `requireAuthorizedWorkspace` oder gleichwertige Prüfung.
- [ ] Kontakt-ID aus Request reicht nie allein als Berechtigung.
- [ ] API-Routen prüfen, dass Ressource wirklich zum autorisierten Workspace gehört.
- [ ] Server Actions prüfen Kontakt/Workspace vor Mutationen.
- [ ] Admin-Routen prüfen `requirePlatformAdmin`.
- [ ] Admin-Definition kommt nur aus `FANMIND_ADMIN_EMAILS`.

## 5. RLS-Pflicht für Tabellen

RLS muss auf allen workspace- oder userbezogenen Tabellen aktiv und getestet sein.

### Auth-/Workspace-Kern

- [ ] `profiles`
- [ ] `workspaces`
- [ ] `workspace_members`

### CRM-Kern

- [ ] `contacts`
- [ ] `memories`
- [ ] `followups`
- [ ] `conversations`
- [ ] `conversation_messages`
- [ ] `conversation_summaries`
- [ ] `contact_ai_profiles`
- [ ] `workspace_voice_profiles`
- [ ] `fan_analysis_reports`
- [ ] `contact_reply_targets`

### Integrations-/Webhook-Tabellen

- [ ] `social_connections`
- [ ] `meta_webhook_events`
- [ ] weitere Integrationstabellen, falls vorhanden

### Billing-/Inquiry-Tabellen

- [ ] Billing-Felder an `workspaces` sind nur für Workspace-Owner/Admin sichtbar.
- [ ] `pilot_inquiries` oder vergleichbare Anfrage-Tabellen sind serverseitig schreibbar und nicht öffentlich lesbar.
- [ ] Stripe-Referenzen sind nicht unnötig im Client sichtbar.

## 6. RLS-Testfälle

Mindestens diese Testfälle vor Pilotkundendaten prüfen:

- [ ] User A sieht nur eigenen Workspace.
- [ ] User A sieht keine Kontakte von User B.
- [ ] User A kann keine Memories/Follow-ups/Conversations anderer Workspaces lesen.
- [ ] User A kann keine Kontakt-ID aus anderem Workspace mutieren.
- [ ] User ohne Session wird auf Login geleitet oder bekommt 401.
- [ ] Nicht-Admin wird aus Adminbereich auf Dashboard geleitet.
- [ ] Temporärer Demo-User kann keine echten externen Verbindungen benutzen.
- [ ] Demo-Workspace-Ablauf löscht oder blockiert alte temporäre Daten.

## 7. API- und Server-Action-Check

- [ ] `/api/ai/reply-suggestions` prüft Kontakt im Workspace.
- [ ] `/api/demo/start` nutzt Service Role nur serverseitig.
- [ ] `/api/inquiries` validiert, rate-limitiert und speichert serverseitig.
- [ ] `/api/billing/checkout` prüft Session, Workspace und Plan/Commercial Option.
- [ ] `/api/stripe/webhook` prüft Stripe-Signatur.
- [ ] `/api/webhooks/meta` prüft Meta-Signatur, sofern Secret gesetzt ist.
- [ ] `/api/integrations/telegram/send-message` ist nicht Teil der Standarddemo und muss feature-geflaggt, admin-/pilot-only oder deaktiviert sein, sofern nicht explizit freigegeben.
- [ ] Server Actions unter `src/app/fans/actions.ts` prüfen Workspace/Kontakt vor Mutation.

## 8. KI-Sicherheit

- [ ] `OPENAI_API_KEY` ist nur serverseitig.
- [ ] Kein OpenAI-Key im Browser-Bundle.
- [ ] Inputlängen sind begrenzt.
- [ ] Rate Limit ist aktiv.
- [ ] Prompt verbietet automatische Sendung und falsche Integrationsbehauptungen.
- [ ] Ausgabe ist strukturiert.
- [ ] Fehlertexte geben keine internen Details/Secrets aus.
- [ ] Model-ID ist idealerweise serverseitig konfigurierbar, nicht breit hardcodiert.
- [ ] Usage/Kosten werden vor Skalierung geloggt oder mindestens geschätzt.

## 9. Integration- und Sendelogik

- [ ] Meta/Facebook/Instagram wird nicht als allgemein live verkauft, solange nicht validiert.
- [ ] Telegram-Senden ist nicht in Gerhards Standarddemo sichtbar, solange es kein explizit freigegebener Pilot ist.
- [ ] WhatsApp/TikTok/X/Discord bleiben Roadmap/Coming Soon.
- [ ] Keine externe Plattform-Passwörter oder Login-Daten speichern.
- [ ] Keine Scraper bauen.
- [ ] Keine automatische Sendefunktion bauen oder bewerben.
- [ ] Buttons müssen ehrlich heißen: `Kopieren`, `Originalkanal öffnen`, `Entwurf speichern`, nicht `automatisch senden`.

## 10. Billing-/Stripe-Check

- [ ] Stripe Checkout nur für Pilot/Starter, solange Growth/Agency Coming Soon sind.
- [ ] `STRIPE_SECRET_KEY` und `STRIPE_WEBHOOK_SECRET` sind server-only.
- [ ] Price IDs sind serverseitig gesetzt.
- [ ] Checkout blockiert Demo-User.
- [ ] Checkout prüft Workspace und Commercial Option.
- [ ] Webhook prüft Signatur.
- [ ] Billing-Status darf nicht durch unautorisierte User verändert werden.
- [ ] Admin-Overrides sind admin-only.
- [ ] UI verkauft Billing nicht als vollständige Payment-Plattform, sondern als Setup-/Zahlungsstart.

## 11. Deployment-Check

- [ ] `npm run build` läuft erfolgreich.
- [ ] `npm run lint` läuft oder bekannte Warnungen sind dokumentiert.
- [ ] Migrationen sind angewendet oder Migrationsbedarf ist im PR beschrieben.
- [ ] Production-ENV enthält alle benötigten server-only Werte.
- [ ] Deployment-Workflow bleibt Exoscale/PM2/nginx-konform.
- [ ] Healthcheck auf `/login` erfolgreich.
- [ ] Rollback-Plan ist bekannt: vorheriger Commit / PM2 restart / nginx prüfen.

## 12. Dokumentations-Check

Bei Änderungen an Security, RLS, Secrets, Billing, Integrationen oder KI müssen diese Dateien geprüft werden:

- [ ] `docs/SOURCE_OF_TRUTH.md`
- [ ] `README.md`
- [ ] `AGENTS.md`
- [ ] `docs/database/fanmind_current_schema.md`
- [ ] `.env.example`
- [ ] relevante Legal-/Pricing-Seiten
- [ ] PR-Beschreibung enthält Security/RLS/Secrets-Auswirkung

## 13. Abnahmeformel

Ein Release ist für Pilotkunden sicherer, wenn alle Aussagen wahr sind:

1. Kein Secret ist im GitHub-Repository.
2. Kein Nutzer kann Workspace-Daten eines anderen Nutzers lesen oder ändern.
3. Kein Demo-User kann echte externe Aktionen auslösen.
4. Keine nicht validierte Integration wird als live verkauft.
5. Keine KI-Antwort wird automatisch gesendet.
6. Kostenrisiken sind über Rate Limits und perspektivisch Usage-Logging begrenzt.
7. README, AGENTS und Source of Truth erzählen denselben Stand.
