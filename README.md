# FanMind

FanMind ist ein KI-gestütztes CRM und Copy-&-Open-Kommunikationssystem für Fan-/Kontaktbeziehungen. Der aktive Kern ist kein Folien-Dummy mehr: Login, Demo-Workspace, Dashboard, Fans/Kontakte, Kontaktdetail, CSV-Import, serverseitige KI-Antwortvorschläge, Memory, Follow-ups und Roadmap sind der aktuelle Produktfokus.

## Schnellentscheidung / Reader-Stand

Dieser Reader folgt der aktuellen Source of Truth in `docs/SOURCE_OF_TRUTH.md`.

- Aktive MVP-Funktionen: Login, Registrierung, geschütztes Dashboard, Fans/Kontakte, Kontaktdetail, CSV-Import, KI-Antwortvorschläge, Memory, Follow-ups, Roadmap, temporärer Demo-Workspace.
- Kommerzielle Wahrheit: `Pilot / Setup = 990 € einmalig`, `Starter = 312 €/Monat`.
- Starter-Optionen: `Starter Flex = 990 € Setup + 312 €/Monat` oder `Starter 12 Monate = 0 € Setup + 312 €/Monat bei 12 Monaten Laufzeit`.
- Growth, Agency und Enterprise bleiben Roadmap / Coming Soon / Auf Anfrage, bis sie explizit freigegeben sind.
- FanMind ist ein Copy-&-Open-Assistent, kein Bot: KI bereitet Antworten vor; der Mensch prüft, kopiert, öffnet bei Bedarf den Originalkanal und sendet selbst.
- Externe Integrationen wie Meta/Facebook/Instagram, Telegram, WhatsApp, TikTok, X/Twitter und Discord dürfen nicht als allgemein aktive Vollfunktion dargestellt werden, solange sie nicht technisch und rechtlich validiert sind.
- Jede in FanMind integrierte Sendefunktion, auch wenn sie manuell ausgelöst wird, muss gesondert freigegeben, versteckt oder als Pilot-Feature gekennzeichnet werden.

## Gefrorener Gerhard-Demo-Pfad

Der Verkaufsdemo-Pfad ist fest und soll nicht durch Nebenfunktionen überlagert werden:

1. Landingpage öffnen.
2. Login oder Demo starten.
3. Dashboard zeigen.
4. Fans/Kontakte öffnen.
5. CSV-Import kurz zeigen oder direkt Sandra/demo-Kontakt öffnen.
6. Kontaktdetail öffnen.
7. vorhandene bzw. letzte eingehende Nachricht als Kontext verwenden.
8. KI-Antwortvorschläge erzeugen.
9. Antwort kopieren.
10. Memory-Vorschlag speichern.
11. Follow-up-Vorschlag speichern.
12. Follow-up-Liste und/oder Roadmap zeigen.

Alles, was nicht zu diesem Pfad gehört, muss versteckt, als Roadmap/Beta markiert oder aus Gerhards Standarddemo herausgehalten werden.

## Technik

- Framework: Next.js `16.2.7`
- UI: React `19.2.4`
- Sprache: TypeScript
- Auth und Daten: Supabase Auth / Supabase PostgREST
- KI: serverseitige OpenAI Responses API über `OPENAI_API_KEY`
- Deployment: Exoscale + PM2 + nginx über `.github/workflows/deploy-fanmind.yml`
- Produktionsdomain: `https://fanmind.ch`

Installieren und lokal starten:

```bash
npm ci
npm run dev
```

Build prüfen:

```bash
npm run build
npm run lint
```

## Wichtige Routen

| Route | Zweck | Status |
| --- | --- | --- |
| `/` | öffentliche Landingpage, Re-Export von `/landing-v2` | aktiv |
| `/landing-v2` | aktuelle Landingpage | aktiv |
| `/login` | Login und Demo-Einstieg | aktiv |
| `/register` | Pilot/Starter-Registrierung | aktiv |
| `/dashboard` | geschützter Arbeits-Eingang | aktiv |
| `/fans` | Fan-/Kontaktliste | aktiv |
| `/fans/import` | CSV-Import | aktiv |
| `/fans/[id]` | Kontaktdetail, Timeline, KI, Memory, Follow-ups | aktiv |
| `/followups` | Follow-up-Übersicht | aktiv, wenn DB-Tabellen vorhanden |
| `/billing/start` | Zahlungs-/Setup-Start | aktiv als Billing-Grundlage |
| `/admin/...` | Admin-/Billing-Grundlagen | admin-only |
| `/api/ai/reply-suggestions` | serverseitiger KI-Endpunkt | aktiv |
| `/api/demo/start` | temporärer Demo-Workspace | aktiv |
| `/api/webhooks/meta` | Meta/Facebook/Instagram-Webhooks | vorbereitet/Beta, nicht allgemein live verkaufen |
| `/api/integrations/telegram/send-message` | Telegram-Senden | nur als expliziter Pilot zulässig, nicht Standarddemo |

## ENV und Secrets

Siehe `.env.example` für Platzhalter. Echte Werte gehören nur in lokale oder Server-ENV-Dateien und niemals ins Repository.

Public / Browser-zulässig:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=
```

Server-only:

```bash
OPENAI_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FANMIND_ADMIN_EMAILS=
RESEND_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
FACEBOOK_APP_SECRET=
FACEBOOK_WEBHOOK_VERIFY_TOKEN=
FANMIND_TOKEN_ENCRYPTION_KEY=
TELEGRAM_BOT_TOKEN=
```

Regel: Alles mit Service Role, Secret, Token, Stripe, OpenAI, Facebook App Secret, Telegram Bot Token oder Admin-E-Mail ist server-only. Keine echten Werte in `.env.example`, Logs, Screenshots, Client-Code oder Dokumentation.

## Datenbank und RLS

Die alte Datei `docs/database/fanmind_mvp_schema.sql` ist nur noch ein historischer Auth-/Workspace-Basisstand. Die aktuelle Datenbankwahrheit steht in:

- `docs/database/fanmind_current_schema.md`
- `supabase/migrations/`
- `src/lib/supabase/server.ts`

Aktuell genutzte Kernbereiche:

- `profiles`
- `workspaces`
- `workspace_members`
- `contacts`
- `memories`
- `followups`
- `conversations`
- `conversation_messages`
- `conversation_summaries`
- `contact_ai_profiles`
- `workspace_voice_profiles`
- `fan_analysis_reports`
- `contact_reply_targets`
- `social_connections`
- `meta_webhook_events`
- Billing-Felder an `workspaces`
- optional Inquiry-/Pilot-Anfrage-Tabellen, falls in der jeweiligen Migration vorhanden

Vor Pilotkundendaten muss der Security-/RLS-/Secrets-Check aus `docs/SECURITY_RLS_SECRETS_CHECK.md` abgearbeitet werden.

## KI und Kostenkontrolle

Aktueller MVP-Schutz:

- KI läuft serverseitig über `/api/ai/reply-suggestions`.
- `OPENAI_API_KEY` wird nicht im Browser verwendet.
- Eingaben werden begrenzt.
- KI-Anfragen werden rate-limitiert.
- Die Ausgabe ist strukturiert: `reply_options`, `suggested_memory`, `suggested_followup`, `safety_note`.
- Keine automatische Sendefunktion.

Nächster Ausbau: Admin-/Workspace-Kostenmonitoring nach `docs/AI_COST_MONITORING.md`.

Gewünschte Kennzahlen:

- KI-Anfragen pro Workspace und Zeitraum.
- geschätzte Input-/Output-Tokens.
- geschätzte Kosten pro Workspace, Kontakt und Feature.
- Kosten pro 100 Fans / 1.000 Fans.
- Warnschwellen pro Workspace und Admin-Gesamtübersicht.
- Modell und Feature je Request.

Provider-Preise dürfen nicht hart in UI-Texten stehen. Sie sollen serverseitig konfigurierbar sein, damit Preisänderungen nicht zu falschen Berechnungen führen.

## Pricing / Commercial Truth

| Paket | Status | Preislogik |
| --- | --- | --- |
| Pilot / Setup | aktiv | 990 € einmalig, 1 Testmonat, keine automatische Verlängerung |
| Starter Flex | aktiv | 990 € Setup + 312 €/Monat, monatlich kündbar |
| Starter 12 Monate | aktiv | 0 € Setup + 312 €/Monat, 12 Monate Laufzeit |
| Growth | Coming Soon | nicht produktiv buchbar |
| Agency | Coming Soon / auf Anfrage | nicht produktiv als Vollversion freigeschaltet |
| Enterprise / Custom | später | individuelle Prüfung |

Keine alten Preise wie `299 €/Monat`, `499 €/Monat` oder `Agency ab 990 €/Monat` wieder einführen, solange `docs/SOURCE_OF_TRUTH.md` nicht bewusst geändert wurde.

## Harte Stop-Regeln

Nicht als aktiv bauen oder verkaufen, sofern nicht explizit freigegeben und validiert:

- echte Instagram-/TikTok-/WhatsApp-/Facebook-/X-/Discord-Vollintegration
- Scraping
- automatisches Senden
- versteckte In-App-Sendefunktionen unter Copy-&-Open-Sprache
- externe Plattform-Login-Daten speichern
- Kampagnenversand-Automation
- vollständige Analytics-Suite
- Enterprise-Rollen-/Rechte-Komplexität
- Fake-Kunden, Fake-Live-Integrationen, Fake-Metriken

## Deployment

Deployments auf `main` laufen über `.github/workflows/deploy-fanmind.yml` auf dem Self-Hosted Runner.

Die Workflow-Sequenz:

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

Danach prüft der Workflow `/login` auf `https://fanmind.ch`.

## Dokumentations-Synchronisierung

Wenn eines dieser Themen geändert wird, müssen `docs/SOURCE_OF_TRUTH.md`, `README.md`, `AGENTS.md` und ggf. Legal-/Pricing-/Database-Dokumente im selben PR angepasst werden:

- Preise oder Pakete
- aktive MVP-Funktionen
- Demo-Pfad
- Integrationsstatus
- Billing-/Stripe-Verhalten
- AI-Modell oder AI-Kostenlogik
- Datenbanktabellen oder RLS
- Security-/Secrets-Regeln

Diese Synchronisierung ist Pflicht, damit Bernd/Codex nicht wieder aus veralteten Readern falsche Tasks ableiten.
