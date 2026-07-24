# FanMind Browser-E2E

## Zweck

Die Browser-Suite ergänzt die bestehenden Unit-, Policy-, Build-, Public-Smoke- und Sprachprüfungen. Sie ersetzt keine dieser Schichten.

Sie schützt die kritischen öffentlichen FanMind-Flows auf echter Browser-Ebene:

- Landingpage auf Deutsch und Englisch;
- Login und sichere Fehlermeldung;
- Passwort-Sichtbarkeit;
- Demo-Bestätigungsdialog ohne Demo-Erzeugung;
- enumeration-sicherer Passwort-Reset mit vollständig synthetischer Supabase-Antwort;
- öffentlicher Account-Löschressourcenpfad mit direktem authentifiziertem Gesamtprozess;
- Starter-Paketwahrheit und Roadmap-Abgrenzung der Vorschau-Pakete;
- Weiterleitung geschützter Routen zum Login;
- Desktop- und Mobile-Viewport ohne horizontales Überlaufen;
- consent-gesteuerten Meta Pixel: ohne Consent kein Script, gleichwertiges Ablehnen/Akzeptieren, genau eine Initialisierung und deduplizierte `PageView`-Events bei Client-Navigation.

Der Gerhard-Demo-Kern bleibt unverändert: Login, Dashboard, Kontakte, Kontaktdetail, serverseitige KI-Vorschläge, Kontaktwissen, Follow-ups und ehrliche Roadmap. Browser-E2E erweitert FanMind nicht um Social-Vollintegrationen, Scraping oder automatisches Senden.

## Automatisches no-write Gate

Workflow:

```text
.github/workflows/browser-e2e.yml
```

Konfiguration:

```text
playwright.config.mts
```

Tests:

```text
e2e/public-critical.spec.ts
```

Der Workflow:

1. installiert Root-Abhängigkeiten reproduzierbar mit `npm ci`;
2. erstellt den Production-kompatiblen Next.js-Build;
3. installiert ausschließlich Chromium;
4. startet den gebauten Server lokal auf `127.0.0.1:3100`;
5. führt dieselben Tests mit Desktop Chrome und einem Pixel-7-Viewport aus;
6. lädt bei Fehlern einen kurzlebigen Playwright-Bericht, Screenshots und Traces hoch.

### Harte no-write-Grenzen

Der automatische Lauf:

- arbeitet ausschließlich gegen den lokal gebauten CI-Server;
- startet keine öffentliche Demo;
- legt keinen Nutzer und keinen Workspace an;
- löst keine Zahlung aus;
- führt keine KI-Anfrage aus;
- speichert kein Kontaktwissen und kein Follow-up;
- nutzt ausschließlich synthetische E-Mail-Adressen;
- fängt Login-Fehler und Passwort-Recovery vollständig im Browser ab;
- enthält keine echten Production-Secrets oder Kundendaten;
- fängt das Meta-Script vollständig synthetisch ab und baut im CI-Lauf keine echte Verbindung zu Meta auf;
- prüft, dass keine Conversion-Events oder Eventparameter gesendet werden.

Die Testartefakte werden sieben Tage aufbewahrt. Videos sind deaktiviert. Traces und Screenshots entstehen nur bei Fehlern. Passwörter, Tokens, vollständige Recovery-URLs und Response-Bodies dürfen nicht in Testnamen, Logs oder Artefakten ausgegeben werden.

## Lokale Ausführung

```bash
npm ci
NEXT_PUBLIC_META_PIXEL_ID=2069553844439892 npm run build
npx playwright install chromium
NEXT_PUBLIC_META_PIXEL_ID=2069553844439892 npm run test:e2e
```

Alternativer lokaler Port:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3200 \
PLAYWRIGHT_SKIP_WEBSERVER=1 \
npm run test:e2e
```

In diesem Fall muss der gebaute FanMind-Server bereits selbst auf dem angegebenen Port laufen.

## Manuelle read-only Staging-Abnahme

Workflow:

```text
.github/workflows/browser-e2e-staging.yml
```

Konfiguration:

```text
playwright.staging.config.mts
```

Test:

```text
e2e-staging/readonly-critical.spec.ts
```

Dieser Lauf ist bewusst nur manuell und nutzt das GitHub Environment `staging`. Er wird erst ausgeführt, wenn die getrennten externen Staging-Ressourcen vorhanden sind.

### Erforderliche Staging-Werte

GitHub Environment Variable:

```text
FANMIND_STAGING_APP_URL
```

GitHub Environment Secrets:

```text
FANMIND_STAGING_E2E_EMAIL
FANMIND_STAGING_E2E_PASSWORD
```

Optionale Variable:

```text
FANMIND_STAGING_E2E_CONTACT_LABEL
```

Der Nutzer und der Kontakt müssen ausdrücklich synthetische Testdaten sein. Die E-Mail-Adresse muss im Namen `staging`, `synthetic` oder `test` enthalten.

### Fail-closed Zielgrenze

Die Staging-Konfiguration akzeptiert ausschließlich:

- HTTPS;
- einen Hostnamen mit `staging`;
- niemals `fanmind.ch` oder `www.fanmind.ch`;
- die feste Bestätigung `fanmind-staging-readonly`;
- vorhandene synthetische Zugangsdaten.

Der Staging-Test erlaubt nur:

- Auth-Session-Austausch;
- GET-, HEAD- und OPTIONS-Anfragen;
- Login;
- Dashboard lesen;
- Kontaktliste lesen;
- ein synthetisches Kontaktdetail lesen.

Jede andere POST-, PATCH-, PUT- oder DELETE-Anfrage wird browserseitig blockiert. Insbesondere sind Registrierung, Demo-Erzeugung, KI-Aufrufe, Kontaktmutation, Kontaktwissen, Follow-ups, Billing und Referral-Aktionen nicht Bestandteil dieses read-only Laufs.

Traces, Screenshots und Videos sind für den authentifizierten Staging-Lauf deaktiviert, damit keine Sitzung oder Kundendarstellung in Artefakten landet.

## Noch externe Abnahme

Der Code für den read-only Staging-Lauf kann unabhängig von den externen Ressourcen geprüft und gemergt werden. Nicht als erledigt gelten bis zur tatsächlichen Bereitstellung:

- eigener HTTPS-Staging-Host;
- separates Supabase-Staging-Projekt;
- synthetischer Staging-Nutzer;
- synthetischer Workspace und Kontakt;
- tatsächlicher manueller Staging-Workflow-Lauf.

Schreibende Referral-, Restore-, RLS- oder Lifecycle-Tests bleiben weiterhin an die vollständige Environment-Grenze aus `docs/operations/ENVIRONMENT_SEPARATION.md` gebunden.

## Fehlerbehandlung

Bei einem fehlgeschlagenen öffentlichen Browser-Gate:

1. Bericht und Trace ausschließlich auf synthetische Daten prüfen;
2. betroffenen Flow lokal reproduzieren;
3. Produktfehler in einem kleinen PR beheben;
4. keine Assertion entfernen, nur um einen echten Fehler zu verdecken;
5. Public-Smokes, Sprachprüfung oder Policy-Tests nicht als Ersatz abschalten.

Bei einem fehlgeschlagenen Staging-Lauf:

1. Ziel- und Credential-Grenze prüfen, ohne Werte auszugeben;
2. bestätigen, dass keine Mutation ausgeführt wurde;
3. externes Staging oder Testdaten korrigieren;
4. niemals auf Production ausweichen;
5. erst danach den manuellen Lauf wiederholen.
