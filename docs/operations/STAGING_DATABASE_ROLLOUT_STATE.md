# Staging-Datenbank: read-only Rollout-Zustand

## Zweck und harte Grenze

Der manuelle Workflow `FanMind Staging Database Rollout State` entscheidet
vor einem kontrollierten Datenbankschritt ausschließlich read-only, welcher
nächste Zustand für die bereits vorhandenen Kontrollpfade sicher ist:

- KI-Stufen-Entitlements;
- Mobile-Push-Registrierungen;
- Meta Content Intelligence plus inkrementelle Conversation-Historie;
- Triggerfunktions-Härtung, sobald ihr kontrollierter Pfad auf `main`
  vorhanden ist.

Der Zustandscheck führt keine Migration und kein `supabase db push` aus,
repariert keinen Migrationsledger und verändert weder Schema noch Daten. Seine
Ausgabe enthält keine Projekt-, Workspace-, Nutzer-, Stripe-, Host- oder
sonstigen Ressourcen-IDs.

## Warum Ledger und Objekte getrennt geprüft werden

Supabase CLI vergleicht bei einem generischen `db push` die Zeitstempel unter
`supabase/migrations/` mit
`supabase_migrations.schema_migrations`. Die kontrollierten FanMind-Runner
führen ihre festgeschriebenen SQL-Dateien dagegen direkt mit `psql` aus. Ein
vollständig gültiges Objekt kann deshalb existieren, obwohl sein Zeitstempel
im Ledger fehlt.

Der Zustandscheck verbindet deshalb zwei unabhängige Nachweise:

1. die exakten vier Migrationszeitstempel im Supabase-Ledger;
2. die bereits bestehenden vollständigen Metadaten-Postflights der drei
   Migrationspfade.

Der kontrollierte Meta-Idempotency-Schritt liegt unter
`supabase/controlled/` und ist kein Supabase-Ledger-Eintrag. Er wird niemals
als Version aus `schema_migrations` gelesen. Sein Vorhandensein fließt
ausschließlich über den wiederverwendeten vollständigen Meta-Objekt-Postflight
in `installed` ein. Sind beide ledger-geführten Meta-Foundation-Schritte
gültig, aber der kontrollierte Idempotency-Schritt fehlt, lautet die sichere
Aktion `apply` für den separaten Meta-Spezialrunner.

Dateiname, Inhalt und SHA-256 werden zusätzlich offline durch die vorhandenen
Runner festgeschrieben. Ein Tabellenname allein gilt niemals als gültiger
Migrationsnachweis.

## Ausschließlich mögliche Aktionen

| Aktion | Bedeutung |
| --- | --- |
| `verify` | Ledger und vollständiger Objekt-Postflight stimmen überein. Nicht erneut anwenden; mit der dokumentierten Acceptance fortfahren. |
| `skip` | Vollständiger Objekt-Postflight ist grün, aber der Ledger-Eintrag fehlt, oder der optionale Kontrollpfad ist auf diesem Commit noch nicht vorhanden. Keine Migration erneut anwenden und niemals durch einen generischen Push „angleichen“. |
| `apply` | Ledger-Eintrag und verwaltetes Objekt fehlen gemeinsam. Nur der separate, bereits dokumentierte Spezialrunner darf nach eigener Freigabe angewendet werden. |
| `block` | Ledger, Objektzustand, Teilmigration oder Postflight widersprechen sich. Keine Datenbankaktion starten. |

Für Meta müssen Foundation und History im Ledger beide vorhanden oder beide
abwesend sein. Ein einzelner Eintrag, ein partielles Schema oder ein roter
Postflight ergibt immer `block`.

## Gemeldeter 45er-Staging-Stand

Am 6. August 2026 wurde extern ein read-only Stand von 45 Migrationen und 33
öffentlichen Tabellen gemeldet. Diese beiden Anzahlen sind mit einem Zustand
bis einschließlich KI-Stufen- und Mobile-Push-Migration vereinbar. Sie
beweisen jedoch weder die exakten Ledger-Zeitstempel noch die vollständigen
RLS-, Rechte-, Constraint-, Index-, Funktions- und Triggerverträge.

Deshalb gilt erst die Ausgabe dieses Workflows als Handlungsgrundlage. Wenn
die exakten Ledger-Einträge und beide Objekt-Postflights passen, werden KI und
Mobile als `verify` ausgegeben. Wenn Meta gleichzeitig vollständig fehlt,
wird Meta als `apply` ausgegeben. Jede Abweichung blockiert statt aus der
Zahl `45` eine Anwendung abzuleiten.

## Geschützter Workflow

Workflow:

```text
FanMind Staging Database Rollout State
```

Bestätigung:

```text
verify-staging-database-rollout-state
```

Erforderlich sind:

- `github.ref == refs/heads/main`;
- ein 40-stelliger `reviewed_commit`, der exakt `github.sha` entspricht;
- das geschützte GitHub-Environment `staging`;
- von Production verschiedene Supabase-Projektreferenzen;
- der IPv4-kompatible Session-Pooler auf Port `5432`;
- der aus der Staging-Projektreferenz abgeleitete Benutzer
  `postgres.<staging-project-ref>`;
- `PGSSLMODE=verify-full` mit absolutem CA-Pfad;
- eine private, eigentümergeführte `PGPASSFILE` mit Modus `0600`;
- `FANMIND_ENABLE_NON_PRODUCTION_WRITES=false` und ein leerer Write-Acknowledge;
- keine Connection-URL, kein `PGHOSTADDR`, kein libpq-Service und keine
  alternative Client-Zertifikatsumleitung.

Regionale Supavisor-Session-Pooler können von Staging und Production geteilt
werden. Die tatsächliche Projektbindung entsteht deshalb aus Supabase-URL,
expliziter Projektreferenz und projektqualifiziertem Datenbankbenutzer. Der
Production-DB-Host muss als Vergleichswert vorhanden sein, ist aber kein
ausreichender Projektidentifikator.

## Sichere Reihenfolge nach der Ausgabe

1. Bei irgendeinem `block` stoppen und Drift separat untersuchen.
2. Für `verify` keinen Apply starten; den vorhandenen read-only Verify und
   danach gegebenenfalls die rollback-only Acceptance verwenden.
3. Für `skip` weder Spezialrunner noch generischen Push starten. Eine
   Ledger-Reparatur ist eine eigene schreibende Änderung und liegt außerhalb
   dieses Workflows.
4. Für `apply` zuerst den zugehörigen Resource-Readiness-Workflow abnehmen und
   danach ausschließlich den getrennten checksum- und commitgebundenen
   Migrationsworkflow freigeben.
5. Datenbank-Schreibworkflows nie parallel ausführen.
6. Meta Foundation und History immer gemeinsam und atomar anwenden.
7. Trigger-Hardening vorzugsweise nach Meta ausführen; dann ist die alte
   optionale 50-Nachrichten-Retention-Funktion bereits entfernt.

Erlaubte Ergebniszeilen:

```text
STAGING_DATABASE_ROLLOUT_AI_TIER=verify|skip|apply|block
STAGING_DATABASE_ROLLOUT_MOBILE_PUSH=verify|skip|apply|block
STAGING_DATABASE_ROLLOUT_META_CONTENT=verify|skip|apply|block
STAGING_DATABASE_ROLLOUT_TRIGGER_HARDENING=verify|skip|apply|block
STAGING_DATABASE_ROLLOUT_GENERIC_MIGRATION=disabled
STAGING_DATABASE_ROLLOUT_STATE=PASS|BLOCKED
SECRETS_WURDEN_NICHT_AUSGEGEBEN=true
```

`PASS` bedeutet nur, dass ein widerspruchsfreier nächster Schritt abgeleitet
wurde. Es bedeutet nicht, dass eine Migration, Staging-Acceptance,
Production-Freigabe oder Produktaktivierung abgeschlossen ist.
