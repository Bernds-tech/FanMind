# FanMind Supply-Chain-Sicherheit

## Ziel

FanMind behandelt GitHub Actions, npm-Abhängigkeiten, statische Sicherheitsanalyse und Software-Stücklisten als Teil der Production-Lieferkette. Änderungen werden ausschließlich über nachvollziehbare Pull Requests vorgenommen. Es gibt kein Auto-Merge für Dependency- oder Action-Updates.

## Unveränderliche GitHub Actions

Alle externen `uses:`-Referenzen in `.github/workflows` müssen auf einen vollständigen 40-stelligen Commit-SHA zeigen. Mutable Tags wie `@v4`, Branches wie `@main` oder verkürzte SHAs werden durch `scripts/verify-actions-pinned.mjs` fail-closed abgelehnt.

Aktuell geprüfte Pins:

| Action | Commit-SHA | lesbarer Versionshinweis |
| --- | --- | --- |
| `actions/checkout` | `11d5960a326750d5838078e36cf38b85af677262` | `v4` |
| `actions/setup-node` | `49933ea5288caeca8642d1e84afbd3f7d6820020` | `v4` |
| `actions/upload-artifact` | `ea165f8d65b6e75b540449e92b4886f43607fa02` | `v4` |
| `github/codeql-action` | `0daab03d71ff584ef619d027a3fd9146679c5d84` | `v3.35.3` |

Jeder Workflow benötigt außerdem einen ausdrücklichen top-level `permissions:`-Block. `permissions: write-all` ist verboten. Schreibrechte werden nur für den konkreten Zweck vergeben, beispielsweise `security-events: write` für CodeQL oder `issues: write` für den Uptime-Alarm.

### Action aktualisieren

1. Dependabot-PR oder manuellen kleinen PR verwenden.
2. Release-/Changelog und Repository-Eigentümer prüfen.
3. Das Ziel-Tag read-only auf den vollständigen Commit-SHA auflösen.
4. SHA im Workflow ersetzen und den lesbaren Versionskommentar beibehalten.
5. `npm run verify:actions-pinned` ausführen.
6. FanMind CI, betroffene Fach-CI und Supply-Chain-CI vollständig grün abwarten.
7. Keine Action direkt auf `main` aktualisieren und keine unbekannte Drittanbieter-Action ungeprüft aufnehmen.

## Dependency-Audit

`npm run security:audit` prüft:

- Web-/Server-Production-Abhängigkeiten über `npm audit --omit=dev --json`;
- sämtliche Mobile-Abhängigkeiten über `npm audit --json`;
- ausschließlich strukturierte Zähler und Paketnamen, keine Roh-Advisory-Ausgabe;
- exakte Next.js-/ESLint-Config-Patchstände;
- einen zeitlich begrenzten, expliziten Review-Ausnahmevertrag.

### Aktueller geprüfter Zustand vom 23. Juli 2026

Nach dem Update auf Next.js `16.2.11` und `eslint-config-next` `16.2.11` verbleiben im Root-Production-Baum:

- `0` kritische Befunde;
- `2` hohe Befunde;
- `1` moderater Befund;
- ausschließlich die geprüften Pakete `next`, `postcss` und `sharp`.

Der aktuelle Registry-Stand bietet dafür noch keinen vollständig kompatiblen automatischen Fix. Die Ausnahme läuft spätestens am **7. August 2026, 00:00 UTC** ab. Danach schlägt das Gate automatisch fehl, sofern die Befunde nicht verschwunden sind. Neue Paketnamen, zusätzliche hohe/moderate Befunde oder jeder kritische Befund schlagen sofort fehl.

Der Mobile-Baum darf moderate oder niedrige transitive Befunde enthalten, aber weder hohe noch kritische Befunde. Der aktuelle Audit-Nachweis meldete keine hohen oder kritischen Mobile-Befunde.

Diese Ausnahme ist keine pauschale Akzeptanz zukünftiger Advisories. Sie ist auf Paketnamen, Schweregrad-Budget, exakte Framework-Version und Ablaufdatum gebunden.

## CodeQL / SAST

`.github/workflows/codeql.yml` analysiert JavaScript und TypeScript mit der gepinnten CodeQL-v3-Action und `security-extended`:

- bei Pull Requests gegen `main`;
- bei Pushes auf `main`;
- wöchentlich;
- manuell über `workflow_dispatch`.

Der Workflow besitzt nur `contents: read`, `actions: read`, `packages: read` und `security-events: write`. Die CodeQL-Fähigkeit einschließlich Extraktion, Analyse und SARIF-Upload wurde vor Aktivierung erfolgreich im Repository geprüft.

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
