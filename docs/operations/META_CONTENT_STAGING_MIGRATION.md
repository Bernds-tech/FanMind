# Meta Content Intelligence: kontrollierte Staging-Migration

## Zweck und harte Grenze

Dieser Pfad wendet ausschließlich die beiden festgeschriebenen Migrationen

- `20260803120000_meta_content_intelligence_foundation.sql`
- `20260803210000_preserve_incremental_conversation_history.sql`

auf ein getrenntes Supabase-Staging an. Ein normaler Web-Deploy ruft den
Runner nicht auf. Der Pfad verbindet kein Meta-Konto, startet keine Analyse,
reicht keinen App Review ein und verändert Production nicht.

## Sicherheitsvertrag

Der Runner arbeitet fail-closed und verlangt gleichzeitig:

- `refs/heads/main` und einen exakt übereinstimmenden, 40-stelligen
  `reviewed_commit`;
- Runtime `staging`, HTTPS-Staging-Origin und ein Supabase-Projekt, dessen
  Referenz eindeutig von Production abweicht;
- direkten libpq-Zugriff auf den bestätigten Staging-Host; Connection-URLs,
  `PGHOSTADDR`, Services und andere Zielumleitungen sind gesperrt;
- TLS mit `PGSSLMODE=verify-full` und absolutem CA-Pfad;
- ein absolutes, reguläres, eigentümergeführtes `PGPASSFILE` mit Modus `0600`;
- die getrennten Bestätigungen
  `I_UNDERSTAND_NON_PRODUCTION_ONLY` und
  `apply-meta-content-intelligence-migrations`;
- bytegenaue SHA-256-Prüfung beider unveränderter SQL-Dateien.

Der Apply läuft als eine Datenbanktransaktion. Wenn der vollständige
Read-only-Postflight bereits besteht, meldet ein Wiederholungslauf
`META_CONTENT_MIGRATION_APPLY=already_current` und wendet die nicht vollständig
idempotenten SQL-Dateien nicht erneut an. Ein teilweise vorhandenes oder
abweichendes Schema wird nicht repariert oder überschrieben, sondern mit
`existing_schema_invalid` blockiert.

## GitHub-Environment `staging`

Vor dem ersten Lauf müssen geschützt und getrennt von Production vorhanden
sein:

| Typ | Name |
| --- | --- |
| Variable | `FANMIND_STAGING_APP_URL` |
| Variable | `FANMIND_STAGING_SUPABASE_PROJECT_REF` |
| Variable | `FANMIND_PRODUCTION_SUPABASE_PROJECT_REF` |
| Variable | `FANMIND_STAGING_DB_PORT` |
| Variable | `FANMIND_STAGING_DB_NAME` |
| Secret | `FANMIND_STAGING_SUPABASE_URL` |
| Secret | `FANMIND_STAGING_DB_HOST` |
| Secret | `FANMIND_PRODUCTION_DB_HOST` |
| Secret | `FANMIND_STAGING_DB_USER` |
| Secret | `FANMIND_STAGING_DB_PASSWORD` |

Die Staging-Datenbankidentität muss die vorgesehenen DDL-Rechte besitzen. Sie
darf nicht dieselbe Identität, derselbe Host oder dasselbe Projekt wie
Production sein. Repository-Secrets und Secretwerte dürfen nicht in Logs oder
Screenshots übernommen werden.

## Ablauf

1. Den zu prüfenden Commit vollständig nach `main` mergen und seine SHA
   festhalten.
2. Lokal oder in CI nur die unveränderliche Offline-Prüfung ausführen:

   ```bash
   npm run db:meta-content:check
   ```

3. Den manuellen Workflow `FanMind Meta Content Staging Migration` auf
   `main` starten.
4. Als `reviewed_commit` exakt die SHA aus Schritt 1 eintragen.
5. Als Bestätigung exakt
   `apply-meta-content-intelligence-migrations` eintragen.
6. Nur einen Lauf akzeptieren, dessen redigierte Ausgabe gemeinsam zeigt:

   - zweimal `META_CONTENT_MIGRATION_CHECKSUM=verified`;
   - `META_CONTENT_MIGRATION_APPLY=completed` oder bei belegtem
     Wiederholungslauf `META_CONTENT_MIGRATION_APPLY=already_current`;
   - `META_CONTENT_MIGRATION_POSTFLIGHT=PASS`;
   - `META_CONTENT_ANALYSIS_ACTIVATION=disabled`;
   - `SECRETS_WURDEN_NICHT_AUSGEGEBEN=true`.

Der Postflight liest nur Metadaten. Er prüft unter anderem Tabellen, RLS,
Select-only-Browser-Policies, Tabellen- und Spaltenrechte, den Ausschluss des
verschlüsselten Page-Tokens, Service-Role-Zugriff, eindeutige Kontoindizes,
50/100/150-Kontextbedingungen und die Entfernung des alten 50-Nachrichten-
Löschtriggers.

## Danach weiterhin offen

Ein bestandener Apply ist nur der Schema-Nachweis. Vor einem Pilot bleiben
mindestens synthetische Owner-/Member-/Fremdworkspace-Negativtests,
OAuth/Webhook-Ende-zu-Ende-Test, 150er-Erstabruf und inkrementeller Sync,
Export/Löschung/Widerruf, Meta App Review sowie das rechtliche Aktivierungsgate
offen. Production-Migration und globale Aktivierung benötigen einen eigenen,
später ausdrücklich freigegebenen Ablauf.
