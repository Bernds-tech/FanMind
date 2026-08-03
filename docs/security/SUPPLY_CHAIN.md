# FanMind Supply-Chain-Sicherheit

## Ziel

FanMind behandelt GitHub Actions, npm-Abhängigkeiten, statische Sicherheitsanalyse und Software-Stücklisten als Teil der Production-Lieferkette. Änderungen werden ausschließlich über nachvollziehbare Pull Requests vorgenommen. Es gibt kein Auto-Merge für Dependency- oder Action-Updates.

## Unveränderliche GitHub Actions

Alle externen `uses:`-Referenzen in `.github/workflows` müssen auf einen vollständigen 40-stelligen Commit-SHA zeigen. Mutable Tags wie `@v4`, Branches wie `@main` oder verkürzte SHAs werden durch `scripts/verify-actions-pinned.mjs` fail-closed abgelehnt.

Aktuell geprüfte Pins:

| Action | Commit-SHA | lesbarer Versionshinweis |
| --- | --- | --- |
| `actions/checkout` auf GitHub-gehosteten Runnern | `3d3c42e5aac5ba805825da76410c181273ba90b1` | `v7.0.1` |
| `actions/checkout` auf `fanmind-restore` | `11d5960a326750d5838078e36cf38b85af677262` | `v4` |
| `actions/setup-node` | `820762786026740c76f36085b0efc47a31fe5020` | `v7.0.0` |
| `actions/setup-java` | `b6effb05e454b25005698d916606bdc6ffcbf961` | `v5.7.0` |
| `actions/upload-artifact` | `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` | `v7.0.1` |
| `github/codeql-action` | `f205ea1c3313d32999d8d6a48b4f6530d4437b38` | `v4.37.4` |

`actions/checkout` bleibt absichtlich gemischt gepinnt. Alle Checkout-Schritte
auf GitHub-gehosteten Runnern verwenden v7.0.1. Der getrennte
`restore-drill-resource-readiness.yml`-Workflow läuft auf dem selbst gehosteten
`fanmind-restore`-Runner und bleibt auf v4, bis dessen erforderliche
Runner-/Node-24-Kompatibilität separat und read-only nachgewiesen ist. Ein
dauerhafter Policy-Test erzwingt diese Grenze fail-closed.

Jeder Workflow benötigt außerdem einen ausdrücklichen top-level `permissions:`-Block. `permissions: write-all` ist verboten. Schreibrechte werden nur für den konkreten Zweck vergeben, beispielsweise `security-events: write` für CodeQL oder `issues: write` für den Uptime-Alarm.

### Action aktualisieren

1. Dependabot-PR oder manuellen kleinen PR verwenden.
2. Release-/Changelog und Repository-Eigentümer prüfen.
3. Das Ziel-Tag read-only auf den vollständigen Commit-SHA auflösen.
4. SHA im Workflow ersetzen und den lesbaren Versionskommentar beibehalten.
5. Bei Actions, die in einem Workflow als zusammengehöriges Paar verwendet werden, alle Varianten gemeinsam aktualisieren; für CodeQL bedeutet das mindestens `init` und `analyze` auf denselben Release-Commit.
6. `npm run verify:actions-pinned` ausführen.
7. FanMind CI, betroffene Fach-CI und Supply-Chain-CI vollständig grün abwarten.
8. Keine Action direkt auf `main` aktualisieren und keine unbekannte Drittanbieter-Action ungeprüft aufnehmen.

## Dependency-Audit

`npm run security:audit` prüft:

- Web-/Server-Production-Abhängigkeiten über `npm audit --omit=dev --json`;
- sämtliche Mobile-Abhängigkeiten über `npm audit --json`;
- ausschließlich strukturierte Zähler und Paketnamen, keine Roh-Advisory-Ausgabe;
- exakte Next.js-/ESLint-Config-Patchstände;
- einen vollständig sauberen Root-Production-Baum ohne Review-Ausnahme.

### Aktueller geprüfter Zustand vom 25. Juli 2026

Am 25. Juli wurde Next.js `16.2.12` mit passendem `eslint-config-next`
verfügbar. Gleichzeitig standen korrigierte Versionen für die beiden
Production-Transitivabhängigkeiten `postcss` und `sharp` bereit. FanMind
verwendet jetzt:

- Next.js und `eslint-config-next` exakt `16.2.12`;
- `postcss` `8.5.23`;
- `sharp` `0.35.3`.

Die beiden Production-Korrekturen werden ausschließlich unter
`next@16.2.12` als npm-Overrides erzwungen, weil Next.js selbst weiterhin
ältere Abhängigkeitsbereiche deklariert. Ein dauerhafter Test verarbeitet mit
der aufgelösten Sharp-Version ein echtes Bild, zusätzlich zum vollständigen
Next.js-Production-Build.

Im reinen Entwickler-Werkzeugbaum wurden außerdem die innerhalb ihrer
Parent-Ranges verfügbaren Korrekturen `brace-expansion` `5.0.8` und `js-yaml`
`4.3.0` eingezogen. Der weiterhin von npm gemeldete
`brace-expansion`-1.x-Werkzeugbefund ist nicht Bestandteil des
Root-Production-Baums und wird nicht als behoben dargestellt.

Der reproduzierte Root-Production-Audit meldet danach:

- `0` kritische Befunde;
- `0` hohe Befunde;
- `0` moderate Befunde;
- `0` niedrige Befunde;
- keine Root-Paket-Ausnahme.

Der vorherige, bis 7. August befristete Production-Reviewvertrag ist entfernt.
Das Gate akzeptiert im Root-Production-Baum jetzt ausschließlich einen
vollständig sauberen Audit und exakt Next.js sowie `eslint-config-next`
`16.2.12`. Jeder neue Production-Paketname oder Befund lässt die Prüfung
fail-closed fehlschlagen.

Der Mobile-Baum meldet am 2. August 2026 weiterhin 38 moderate, vollständig
transitive Befunde aus dem festgeschriebenen Expo-SDK-57-Werkzeug- und
Runtime-Baum, aber keine niedrigen, hohen oder kritischen Befunde. Dieser Stand
ist kein unbegrenzter Freipass mehr: Das Gate enthält eine exakte Allowlist der
38 aktuell betroffenen Paketnamen, ein Maximum von 38 moderaten Befunden,
`0` niedrige/hohe/kritische Befunde und einen Ablaufzeitpunkt am
2. September 2026. Ein neuer Paketname, ein zusätzlicher Befund oder ein
abgelaufener Review lässt die Supply-Chain-Prüfung fail-closed scheitern. Ein
vollständig sauberer Mobile-Audit benötigt keine Ausnahme und bleibt auch nach
dem Review-Ablauf zulässig.

## CodeQL / SAST

`.github/workflows/codeql.yml` analysiert JavaScript und TypeScript mit der unveränderlich gepinnten CodeQL-v4-Action `4.37.4` und `security-extended`:

- bei Pull Requests gegen `main`;
- bei Pushes auf `main`;
- wöchentlich;
- manuell über `workflow_dispatch`.

`init` und `analyze` werden immer gemeinsam auf exakt denselben CodeQL-Release-Commit aktualisiert. Der Workflow besitzt nur `contents: read`, `actions: read`, `packages: read` und `security-events: write`. Die CodeQL-Fähigkeit einschließlich Extraktion, Analyse und SARIF-Upload wird bei jedem Action-Update erneut im Pull Request ausgeführt.

Ein CodeQL-Alarm wird nicht durch Abschalten der Query, pauschales Ignorieren oder Entfernen des Workflows gelöst. Echte Befunde werden in kleinen Folge-PRs behoben oder mit konkreter, zeitlich begrenzter Begründung dokumentiert.

## CycloneDX-SBOM

`npm run security:sbom` erzeugt und validiert zwei CycloneDX-JSON-Stücklisten:

- `fanmind-web.cdx.json`;
- `fanmind-mobile.cdx.json`.

Die Dateien werden ausschließlich als kurzlebige GitHub-Actions-Artefakte mit sieben Tagen Aufbewahrung bereitgestellt. Sie werden nicht in Git eingecheckt und enthalten keine `.env`-Werte oder Secrets. Die Generator-Policy prüft Format, Spec-Version und strukturierte Komponentenliste vor dem Upload.

## Dependabot

`.github/dependabot.yml` erstellt wöchentliche Pull Requests für:

- npm im Root-Projekt;
- npm in `apps/mobile`;
- GitHub Actions.

Patch-Updates werden sinnvoll gruppiert, aber niemals automatisch gemergt. Jeder PR durchläuft weiterhin Product Truth, Lint, Operations-Tests, Build, Mobile-Gates, Action-Pin-Policy, Dependency-Audit und gegebenenfalls CodeQL.

## Reproduzierbarkeit

- Root und Mobile besitzen getrennte `package-lock.json`-Dateien.
- CI verwendet `npm ci` statt freier Auflösung.
- Next.js und `eslint-config-next` sind für den geprüften Patchstand exakt gepinnt.
- Lockfile-Änderungen ohne zugehörige Manifeständerung beziehungsweise nachvollziehbaren Audit-Fix werden nicht gemergt.

## Keine Secrets in Artefakten

Supply-Chain-Workflows lesen keine Production-ENV-Dateien. Audit-Berichte enthalten nur:

- Schweregrad-Zähler;
- geprüfte Paketnamen;
- Policy-Ergebnis und Ablaufdatum;
- SBOM-Komponentenmetadaten aus den Lockfiles.

Nicht zulässig sind Tokens, Registry-Credentials, `.env`-Inhalte, Supabase-/Stripe-/OpenAI-Schlüssel, private URLs oder Kundeninhalte.

## Störungs- und Rollback-Regeln

Bei einem fehlerhaften Dependency-/Action-Update:

1. PR nicht mergen beziehungsweise den Release auf den letzten gesunden Commit zurückrollen.
2. Production-Health und Kernrouten prüfen.
3. Keine Audit-Regel, Action-Pin-Prüfung oder CodeQL-Analyse zur Umgehung des Fehlers abschalten.
4. Ursache in einem kleinen Folge-PR beheben.
5. Lockfile, SBOM und Audit-Bericht erneut erzeugen.

Bei einem Registry- oder GitHub-Ausfall darf ein geplanter Supply-Chain-Run fehlschlagen. Der Fehler wird nicht durch ungeprüfte Cache-/`--force`-/`--legacy-peer-deps`-Umgehungen verdeckt.
