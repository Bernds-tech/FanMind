# FanMind Shared Rate Limiting

## Zweck

KI-Antwortvorschläge und öffentliche Anfragen dürfen vor einem PM2-Cluster- oder Mehrinstanzbetrieb nicht mehr auf prozesslokale JavaScript-Maps angewiesen sein. Die gemeinsame Rate-Limit-Grundlage verwendet deshalb einen atomaren PostgreSQL-Fixed-Window-Zähler in Supabase.

Der öffentliche Demo-Start bleibt unverändert auf seiner bereits vorhandenen, eigenen Supabase-RPC-Policy. Er wird nicht doppelt neu gebaut.

## Datenschutz- und Sicherheitsmodell

In `public.shared_rate_limit_buckets` werden ausschließlich gespeichert:

- ein technischer Scope wie `ai_reply_user_ip` oder `inquiry_ip`;
- ein 64-stelliger HMAC-SHA256-Hash;
- Fensterbeginn und Fensterlänge;
- Zähler, Reset- und Ablaufzeit.

Nicht gespeichert werden:

- rohe IP-Adressen;
- E-Mail-Adressen;
- Kontaktinhalte;
- Supabase-User-IDs im Klartext;
- API-Schlüssel oder sonstige Secrets.

Der Hash wird serverseitig mit `FANMIND_SHARED_RATE_LIMIT_SECRET` und einer Scope-Bindung erzeugt:

```text
fanmind-shared-rate-limit:v1:<scope>:<subject>
```

Der Secret-Wert muss mindestens 32 Zeichen lang sein und darf niemals im Browser, in Git, in Issues oder in Logs erscheinen.

## Atomare Datenbank-Policy

Migration:

```text
supabase/migrations/20260723102000_shared_rate_limits.sql
```

`public.consume_shared_rate_limit(...)`:

- richtet das Fenster serverseitig an der Unix-Epoche aus;
- validiert Scope, 64-stelligen Hash, Fenster und Maximum;
- inkrementiert den aktuellen Bucket mit einem einzigen `INSERT ... ON CONFLICT DO UPDATE`;
- serialisiert konkurrierende Inkremente über den eindeutigen Primärschlüssel;
- gibt `allowed`, `remaining`, `reset_at` und `current_count` zurück;
- entfernt pro Aufruf höchstens 100 abgelaufene Buckets;
- ist ausschließlich für `service_role` ausführbar.

`public.cleanup_shared_rate_limit_buckets(...)` entfernt bei Bedarf einen begrenzten größeren Satz abgelaufener Buckets. Auch diese Funktion ist ausschließlich für `service_role` freigegeben.

RLS ist auf der Tabelle aktiv. `PUBLIC`, `anon` und `authenticated` besitzen weder Tabellenrechte noch Ausführungsrechte auf den beiden Funktionen.

## Zweiphasiger Production-Rollout

### Phase A: Datenbank-Grundlage

1. Foundation-PR mit Migration, Policy-Helper, Tests und diesem Runbook mergen.
2. Exakten Production-Release und gesunden App-Status bestätigen.
3. Ein frisches verschlüsseltes Datenbank-Backup einreihen.
4. Das neue `.age`-/`.age.sha256`-Paar checksum-only verifizieren.
5. Migration mit `psql -v ON_ERROR_STOP=1` über die bestehende Backup-DB-Verbindung anwenden.
6. Rechte redigiert prüfen.
7. Den RPC mit einem zufälligen synthetischen HMAC-Hash parallel aufrufen:
   - exakt `max_requests` Aufrufe müssen erlaubt sein;
   - alle weiteren Aufrufe müssen abgelehnt werden;
   - der höchste Zähler muss der Anzahl aller Aufrufe entsprechen;
   - es darf keine verlorenen Inkremente geben.
8. Den synthetischen Probe-Bucket entfernen.
9. Einen dedizierten `FANMIND_SHARED_RATE_LIMIT_SECRET` in `.env.production` setzen, ohne ihn auszugeben.
10. Anwendung noch nicht auf Shared Limiting umstellen.

### Phase B: Endpunkte aktivieren

1. Separaten kleinen PR für KI- und Inquiry-Endpunkt erstellen.
2. Bestehende Grenzwerte beibehalten:
   - KI-Antwortvorschläge: 20 Anfragen je 10 Minuten pro Nutzer-/IP-Identität;
   - öffentliche Anfrage: 5 Anfragen je 10 Minuten pro IP-Identität.
3. Bei nicht erreichbarer Shared-Infrastruktur fail-closed reagieren:
   - KI: keine OpenAI-Anfrage ausführen, generische 503-Antwort;
   - Inquiry: keine Anfrage speichern oder E-Mail senden, generische 503-Antwort.
4. 429-Verhalten und verständliche Meldungen beibehalten.
5. Product Truth, Lint, Operations-Tests und Build vollständig grün ausführen.
6. Nach Merge Production-Release, Health, RPC und tatsächlichen Inquiry-429-Pfad verifizieren.

Erst nach Phase B ist #664 abgeschlossen. Vorher darf kein PM2-Cluster- oder Mehrinstanzbetrieb aktiviert werden.

## Migration anwenden

Auf Production nur nach einem frischen, verifizierten Datenbank-Backup und ohne Ausgabe der DB-Konfiguration:

```bash
set -a
. /etc/fanmind-backup/worker.env
set +a
export PGPASSFILE="$FANMIND_BACKUP_PGPASSFILE"

psql \
  --host="$FANMIND_BACKUP_DB_HOST" \
  --port="${FANMIND_BACKUP_DB_PORT:-5432}" \
  --username="$FANMIND_BACKUP_DB_USER" \
  --dbname="$FANMIND_BACKUP_DB_NAME" \
  -v ON_ERROR_STOP=1 \
  -f supabase/migrations/20260723102000_shared_rate_limits.sql
```

Kein `set -x`. Keine ENV-Werte oder Verbindungsparameter in CI-/Issue-Ausgaben übernehmen.

## Verifikation

Die Production-Abnahme muss mindestens nachweisen:

- Tabelle vorhanden und RLS aktiv;
- Primärschlüssel über Scope, Hash, Fensterbeginn und Fensterlänge;
- `service_role` darf beide Funktionen ausführen;
- `PUBLIC`, `anon` und `authenticated` dürfen sie nicht ausführen;
- Paralleltest verliert keine Inkremente;
- Hash-Spalte enthält ausschließlich 64-stellige Kleinbuchstaben-Hexwerte;
- keine rohe Identität wird gespeichert oder ausgegeben;
- Probezeilen werden danach entfernt;
- Anwendung bleibt vor und nach der Migration gesund.

## Rollback

### Vor Aktivierung der Endpunkte

Die neue Tabelle und Funktionen sind additiv und werden von der laufenden Anwendung nicht verwendet. Bei einem Befund:

1. Endpunkt-Aktivierung nicht mergen.
2. Migration nicht erneut ausführen.
3. Ursache in einem kleinen Folge-PR korrigieren.
4. Tabelle nicht vorschnell löschen; zuerst prüfen, ob Probe-Buckets entfernt und keine Anwendungspfade aktiv sind.

### Nach Aktivierung der Endpunkte

Bei einem Anwendungsausfall:

1. Route-PR auf den vorherigen Release zurückrollen.
2. Health und Kernrouten prüfen.
3. Datenbank-Grundlage bestehen lassen; sie ist additiv und enthält nur pseudonymisierte kurzlebige Buckets.
4. Erst nach Ursachenanalyse erneut aktivieren.

Ein vollständiges Datenbank-Rollback wäre nur nach gesonderter Prüfung zulässig. Die Tabelle darf nicht während aktiver Shared-Limit-Nutzung entfernt werden.

## Bewusste Grenzen

- kein Redis-Zwang für den aktuellen Stand;
- kein PM2-Cluster vor abgeschlossener Phase B;
- keine Änderung an Preisen, KI-Modellen, Kontingenten oder Workspace-Autorisierung;
- kein Umbau des Public-Demo-RPC;
- keine automatische Production-Migration allein durch Merge oder Deployment.
