# FanMind

FanMind ist ein KI-gestütztes CRM und Copy-&-Open-Kommunikationssystem für Fan-/Kontaktbeziehungen. Der aktive Web-Kern umfasst Login, temporären Demo-Workspace, Dashboard, Kontakte, Kontaktdetail, CSV-Import, serverseitige KI-Antwortvorschläge, Kontaktwissen, Follow-ups und Roadmap. Zusätzlich besteht unter `apps/mobile` ein eigenständiger nativer Android-/iOS-App-Kern.

## Schnellentscheidung / Reader-Stand

Dieser Reader folgt der aktuellen Source of Truth in `docs/SOURCE_OF_TRUTH.md`.

- Aktive Kernfunktionen: Login, Registrierung, geschütztes Dashboard, Kontakte, Kontaktdetail, CSV-Import, KI-Antwortvorschläge, Kontaktwissen, Follow-ups, Roadmap und temporärer Demo-Workspace.
- Mobile-App: eigenständiger React-Native-/Expo-Kern für Android und iOS mit Login, Passwort-Recovery, Dashboard, Kontaktanlage/-bearbeitung, Kontaktwissen, KI-Antwortvorschlägen, Follow-ups und sicherem lokalen Daten-Purge; signierte interne Builds und Store-Verteilung bleiben separat abzunehmen.
- Öffentliche Registrierung: ausschließlich Starter Flex und Starter 12 Monate.
- Kostenlose Demo: temporärer, geschützter Demo-Workspace; kein entgeltliches Pilot-Paket.
- Admin-only: interne Testzugänge und das Stripe-Testabo `internal_daily_test` bleiben ausdrücklich intern. Der normale Registrierungsflow zeigt sie nicht öffentlich.
- Billing-Steuermodus: `FANMIND_TAX_MODE=small_business` ist der aktuelle Default. Derzeit wird keine Umsatzsteuer ausgewiesen; Checkout, Angebot und Rechnung müssen dieselbe steuerliche Behandlung zeigen.
- Kommerzielle Wahrheit: Starter-Grundgebühr `312 €/Monat`.
- Starter Flex: `990 € einmalige Einrichtung + 312 €/Monat`; jederzeit zum Ende des laufenden, vollständig zu bezahlenden Abrechnungsmonats kündbar.
- Starter 12 Monate: `0 € Setup + 312 €/Monat`; zwölf Monate Mindestlaufzeit, danach Verlängerung um jeweils einen Monat.
- Starter-Abos können unter `/settings/package` zum serverseitig berechneten Vertragsende vorgemerkt und vor Wirksamkeit zurückgenommen werden; Account-Löschung bleibt ein separater DSGVO-Prozess.
- KI Standard: in der Starter-Grundgebühr enthalten.
- KI Plus: zusätzlich `100 €/Monat`.
- KI Ultra: zusätzlich `200 €/Monat`.
- Zentrale KI-Stufen-Policy: `src/config/aiTiers.mjs` führt Standard, Plus und Ultra; Plus/Ultra bleiben bis zur Modell-, Kontingent- und Billing-Freigabe nicht automatisch buchbar.
- Referral-Rabatte gelten nur auf die Starter-Grundgebühr von 312 €/Monat. Einrichtung und KI-Add-ons sind nicht rabattfähig.
- Growth, Agency und Enterprise bleiben Roadmap / Coming Soon / Auf Anfrage, bis sie ausdrücklich freigegeben sind.
- FanMind ist kein Bot: KI bereitet Antworten vor; der Mensch prüft, kopiert und sendet final selbst.
- FanMind garantiert keine fehlerfreien KI-Antworten.
- Externe Integrationen dürfen nicht als allgemein aktive Vollfunktion dargestellt werden, solange sie nicht technisch und rechtlich validiert sind.

## Betreiber

Vertragspartner ist **Bernd Guggenberger, Einzelunternehmen unter der Geschäftsbezeichnung FanMind**.

- Geschäftsanschrift: Turnerstraße 18, 2345 Brunn am Gebirge, Österreich
- Inhaber und vertretungsberechtigt: Bernd Guggenberger
- Zuständige Gewerbebehörde: Bezirkshauptmannschaft Mödling
- Kontakt: `kontakt@fanmind.ch`
- Telefon: `+43 676 5367236`

Der Zusatz `e.U.` wird erst nach bestätigter Firmenbucheintragung samt Firmenbuchnummer und Firmenbuchgericht verwendet.

## Gefrorener Gerhard-Demo-Pfad

Der Verkaufsdemo-Pfad ist fest und soll nicht durch Nebenfunktionen überlagert werden:

1. Landingpage öffnen.
2. Login oder kostenlose Demo starten.
3. Dashboard zeigen.
4. Kontakte öffnen.
5. CSV-Import kurz zeigen oder direkt einen Demo-Kontakt öffnen.
6. Kontaktdetail öffnen.
7. letzte eingehende Nachricht als Kontext verwenden.
8. KI-Antwortvorschläge erzeugen.
9. Antwort kopieren.
10. Vorschlag fürs Kontaktwissen speichern.
11. Follow-up-Vorschlag speichern.
12. Follow-up-Liste und/oder Roadmap zeigen.

Alles, was nicht zu diesem Pfad gehört, muss versteckt, als Roadmap/Beta markiert oder aus der Standarddemo herausgehalten werden.

## Technik

- Framework: Next.js `16.2.11`
- UI: React `19.2.4`
- Mobile: React Native / Expo unter `apps/mobile` mit eigener Navigation, CI und Releasegrenze
- Sprache: TypeScript
- Auth und Daten: Supabase Auth / Supabase PostgREST
- KI: serverseitige OpenAI Responses API
- Deployment: Exoscale + PM2 + nginx über `.github/workflows/deploy-fanmind.yml`
- Produktionsdomain: `https://fanmind.ch`

Installieren und lokal starten:

```bash
npm ci
npm run dev
```

Release-Prüfung:

```bash
npm run verify:truth
npm run lint
npm run test:operations
npm run build
```

## Optionale Marketing-Messung

FanMind besitzt eine zentral im Next.js-Root-Layout eingebundene, consent-gesteuerte Meta-Pixel-Struktur für eine eng begrenzte Allowlist öffentlicher Seiten. Sie ist keine Produkt-Analytics-Suite, läuft nicht auf geschützten CRM-/Admin-/Billing-Seiten und bleibt ohne gültige öffentliche Pixel-ID vollständig deaktiviert.

- Konfiguration: `NEXT_PUBLIC_META_PIXEL_ID`;
- Production-Dataset: `FanMind Dataset`, Pixel-ID `2069553844439892`;
- aktives Event: ausschließlich `PageView`, dedupliziert je freigegebenem öffentlichen App-Router-Pfad und unsensitivem Queryzustand;
- vorbereitet, aber nicht mit Produktaktionen verbunden: `ViewContent`, `Lead`, `CompleteRegistration`, `Contact`, `Schedule`, `StartTrial`, `Purchase`;
- kein Laden vor ausdrücklicher Marketing-Einwilligung;
- keine E-Mail, Namen, CRM-, Kontakt-, Nachrichten-, KI- oder Zahlungsdaten; geschützte same-origin Referrer werden blockiert;
- kein Advanced Matching, keine Conversions API und kein serverseitiges Meta-Tracking.

Die Codeintegration allein aktiviert den Pixel nicht auf Production. Nach gesetzter ENV ist ein neuer Build erforderlich; Consent, Widerruf, genau ein initiales PageView und deduplizierte Client-Navigationen werden gemäß `docs/analytics/META_PIXEL.md` kontrolliert abgenommen.

## Mobile-App

Die Mobile-App ist ein eigener Produktstream und keine eingebettete Website. Web und Mobile teilen ausschließlich freigegebene, RLS-geschützte Backend-Verträge und die serverseitige KI-API.

Bereits vorhanden:

- native E-Mail-/Passwort-Anmeldung und sichere Gerätesitzung;
- PKCE-basierte Passwort-Recovery über `fanmind://reset-password` mit strikter Callback-Validierung;
- Dashboard, Kontaktliste, Suche und Kontaktdetail;
- Kontakte in Mobile anlegen und bearbeiten, jeweils mit Workspace-Filter und RLS;
- Kontaktwissen und serverseitige KI-Antwortvorschläge;
- Antwort kopieren, Kontaktwissen und Follow-up speichern;
- offene Follow-ups anzeigen und als `completed` abschließen; Altdaten mit `done` bleiben kompatibel;
- sicherer lokaler Logout mit Purge aller registrierten FanMind-SecureStore-Schlüssel und des Workspace-Zustands;
- separate Mobile-CI, Expo Doctor, TypeScript-Check und Android-JavaScript-Bundle.

Noch extern beziehungsweise als nächste Mobile-Phase abzunehmen:

- Supabase-Redirect-Freigabe und realer E-Mail-/Gerätetest für `fanmind://reset-password`;
- EAS-Projekt, Signing Credentials und signierter interner Android-Build;
- Apple Developer / App Store Connect und iOS-TestFlight;
- Offline-Lese-Cache, Push-Grundlage und Account-/Datenlöschprozess;
- reale Android-/iOS-Gerätetests.

Verbindliche Details: `apps/mobile/README.md`, `docs/mobile/ARCHITECTURE.md` und `docs/mobile/BETA_RELEASE.md`.

## Wichtige Routen

| Route | Zweck | Status |
| --- | --- | --- |
| `/` | öffentliche Landingpage | aktiv |
| `/login` | Login und Demo-Einstieg | aktiv |
| `/register` | Starter-Registrierung | aktiv |
| `/dashboard` | geschützter Arbeitsbereich | aktiv |
| `/fans` | Kontaktliste | aktiv |
| `/fans/import` | CSV-Import | aktiv |
| `/fans/[id]` | Kontaktdetail, Verlauf, KI, Kontaktwissen und Follow-ups | aktiv |
| `/followups` | Follow-up-Übersicht | aktiv |
| `/settings/profile` | Profil und Workspace-Basisdaten | aktiv |
| `/settings/package` | Starter-Paket, KI-Add-ons und sichere Self-Service-Kündigung zum Vertragsende | aktiv |
| `/settings/invoices` | Rechnungsarchiv | aktiv |
| `/settings/referral` | Referral-Code, Status und Rabattübersicht | aktiv; Billing-Verrechnung separat freizugeben |
| `/referral-bedingungen` | öffentliche Referral-Teilnahmebedingungen | aktiv; automatische Rabattverrechnung weiterhin deaktiviert |
| `/settings/ai-usage` | monatliche KI-Nutzungsanzeige | aktiv |
| `/billing/start` | Starter-Checkout | aktiv; Legacy-Pilot-Checkout gesperrt |
| `/admin/...` | Admin- und Billing-Grundlagen | admin-only |
| `/api/ai/reply-suggestions` | serverseitiger KI-Endpunkt | aktiv |
| `/api/demo/start` | temporärer Demo-Workspace | aktiv |
| `/api/stripe/webhook` | Stripe-Lifecycle und Referral-Synchronisierung | aktiv; Referral-Rabattverrechnung per Flag deaktiviert |
| `/api/webhooks/meta` | Meta-Webhooks | vorbereitet/Beta |

## Pakete und KI-Add-ons

| Produkt | Status | Preislogik |
| --- | --- | --- |
| Öffentliche Demo | aktiv | kostenloser temporärer Demo-Zugang; kein entgeltliches Paket |
| Starter Flex | aktiv | 990 € Einrichtung + 312 €/Monat; Kündigung zum Ende des bezahlten Monats |
| Starter 12 Monate | aktiv | 0 € Setup + 312 €/Monat; 12 Monate Mindestlaufzeit, danach monatlich |
| KI Standard | aktiv | in 312 €/Monat enthalten |
| KI Plus | freigegebener Preis, technische Add-on-Aktivierung separat | +100 €/Monat |
| KI Ultra | freigegebener Preis, technische Add-on-Aktivierung separat | +200 €/Monat |
| Internes Live-Testabo | admin-/test-only | 1 €/Tag; nicht öffentlich registrierbar |
| Growth | Coming Soon | nicht produktiv buchbar |
| Agency | Coming Soon / auf Anfrage | nicht produktiv buchbar |
| Enterprise / Custom | später | individuelle Prüfung |

Keine alten Preise wie `299 €/Monat`, `499 €/Monat` oder `Agency ab 990 €/Monat` wieder einführen.

## Kündigungslogik

### Starter Flex

Starter Flex kann jederzeit gekündigt werden. Die Kündigung wird zum Ende des laufenden, bereits bezahlten Abrechnungsmonats wirksam. Der laufende Monat wird vollständig verrechnet und nicht anteilig rückerstattet.

### Starter 12 Monate

Starter 12 Monate hat eine Mindestlaufzeit von zwölf Monaten. Danach verlängert sich der Vertrag jeweils um einen weiteren Monat, sofern er nicht gekündigt wird.

## Referral Growth Window

Das Empfehlungsprogramm ist bis zum globalen Ziel von 2.000 aktiven zahlenden Workspaces begrenzt:

- 5 % Rabatt je aktivem geworbenem zahlenden Workspace;
- maximal 20 aktive Referrals beziehungsweise 100 % Rabatt;
- Rabatt ausschließlich auf die Starter-Grundgebühr von 312 €/Monat;
- kein Rabatt auf Einrichtung oder KI Plus/Ultra;
- kein negativer Rechnungsbetrag und keine Barauszahlung;
- bei Kündigung, Nichtzahlung, Refund oder Chargeback entfällt der jeweilige Rabatt;
- Referral-Live-Billing bleibt bis zur kontrollierten Freigabe mit `FANMIND_ENABLE_REFERRAL_BILLING=false` deaktiviert.

Details: `docs/REFERRAL_PROGRAM.md` und `docs/operations/referral-stripe-sandbox-runbook.md`.

## ENV und Secrets

Siehe `.env.example` für Platzhalter. Echte Werte gehören nur in lokale oder Server-ENV-Dateien und niemals ins Repository.

Regel: Alles mit Service Role, Secret, Token, Stripe, OpenAI, Plattform-App-Secret oder Admin-E-Mail ist server-only. Keine echten Werte in `.env.example`, Logs, Screenshots, Client-Code oder Dokumentation.

## Datenbank und RLS

Die aktuelle Datenbankwahrheit steht in:

- `docs/database/fanmind_current_schema.md`
- `supabase/migrations/`
- `src/lib/supabase/server.ts`

Workspace-scoped Daten müssen per RLS und serverseitiger Autorisierung geschützt sein. Vor echten Kundendaten ist `docs/SECURITY_RLS_SECRETS_CHECK.md` abzuarbeiten.

## KI und Kostenkontrolle

- KI läuft serverseitig.
- API-Keys werden nicht im Browser verwendet.
- Eingaben werden begrenzt und rate-limitiert.
- Ausgaben sind strukturiert.
- KI-Nutzung wird je Workspace gemessen.
- Es gibt keine automatische Sendefunktion.
- Nutzer müssen KI-Ausgaben vor Verwendung prüfen.
- FanMind garantiert keine fehlerfreien, vollständigen oder aktuellen KI-Antworten.

Provider-Preise bleiben serverseitig konfigurierbar und werden nicht als statische UI-Wahrheit hartcodiert.

## Harte Stop-Regeln

Nicht als aktiv bauen oder verkaufen, sofern nicht ausdrücklich freigegeben und validiert:

- vollständige Instagram-, TikTok-, WhatsApp-, Facebook-, X- oder Discord-Integration;
- Scraping;
- ungeprüftes automatisches Senden;
- externe Plattform-Login-Daten speichern;
- Kampagnenversand-Automation;
- vollständige Analytics-Suite;
- Enterprise-Rollen-/Rechte-Komplexität;
- Fake-Kunden, Fake-Live-Integrationen oder Fake-Metriken.

## Deployment

Deployments auf `main` laufen über `.github/workflows/deploy-fanmind.yml` auf dem Self-Hosted Runner:

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

Nach dem Deployment werden öffentliche Kernrouten und der tatsächlich ausgelieferte Commit geprüft.

## Dokumentations-Synchronisierung

Wenn Preise, Pakete, Referral-Logik, aktiver Scope, Demo-Pfad, Billing, KI-Leistungsstufen, Datenbank, Security, Mobile-Verträge oder öffentliche Versprechen geändert werden, müssen `docs/SOURCE_OF_TRUTH.md`, `README.md`, `AGENTS.md`, `apps/mobile/README.md`, `docs/mobile/ARCHITECTURE.md`, `docs/mobile/BETA_RELEASE.md` und die betroffenen Legal-/Pricing-Dateien im selben PR geprüft und synchronisiert werden.
