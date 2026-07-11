# Backup Runbook

## Backup-Typen

- Server-Konfiguration: `.env.production`, PM2-Dump, nginx, relevante systemd-Units und öffentliche Backup-Konfiguration.
- Datenbank: PostgreSQL Custom Format mit `pg_dump` 17, `--no-owner`, `--no-privileges`; Validierung mit `pg_restore --list`.
- Storage: rekursive Sicherung des Buckets `fanmind-assets` mit Manifest je Objekt.
- Vollbackup: kombiniert erfolgreiche Teilbackups plus zentrales Manifest.

## Verschlüsselung

Automatische Backups verwenden age Public-Key-Verschlüsselung. Auf Production liegt nur der öffentliche Empfänger in `FANMIND_BACKUP_PUBLIC_KEY_FILE`, z. B. `/etc/fanmind-backup/recipient.txt`. Der private Schlüssel bleibt offline und darf nie auf Production oder ins Repository.

## Manuelle Ausführung

1. Production-Migrationen manuell in Supabase prüfen und in exakt dieser Reihenfolge anwenden:
   1. `20260711120000_phase_5_operations_foundation.sql`
   2. `20260711143000_phase_5_backup_worker.sql`
   3. `20260711161500_disable_verify_backup_until_safe_validation.sql`
   4. `20260711170000_grant_backup_worker_rpc_service_role.sql`
2. Vor der Worker-Installation bestätigen: `service_role` hat `EXECUTE` auf `public.claim_admin_backup_job(text, integer)`, `PUBLIC`, `anon` und `authenticated` nicht; `service_role` hat außerdem `USAGE` auf Schema `public` für den PostgREST-RPC-Lookup.
3. Erst danach Worker installieren und starten.
4. Als Platform-Admin unter `/admin/operations` einen Backup-Job einreihen.
5. Logs mit `journalctl` prüfen.
6. `backup_runs` und In-App-Benachrichtigung prüfen.


## Leerlaufprüfung nach Start

Wenn keine Backup-Jobs anstehen, darf `claim_admin_backup_job` über PostgREST auch `null`, `[]` oder eine leere Composite-Zeile wie `{ id: null, job_type: null }` zurückgeben. Erwartetes Worker-Verhalten im Leerlauf: kein `job_claimed` mit leerer ID, kein `job_type_not_allowed`-Loop, keine Admin-Benachrichtigung und kein Audit-Eintrag. Der nächste Claim erfolgt nach `FANMIND_BACKUP_POLL_MS` (Standard: 30 Sekunden). Heartbeats sind separat über `FANMIND_BACKUP_HEARTBEAT_MS` getaktet (Standard: 5 Minuten), damit ein ruhender Worker keine unnötig dichten `system_health_events` erzeugt.

## PrivateTmp und finale Ablage

`fanmind-backup-worker.service` verwendet weiterhin `PrivateTmp=true`. Das private temporäre Arbeitsverzeichnis und `FANMIND_BACKUP_ROOT` können deshalb unterschiedliche Dateisysteme sein; ein direkter Cross-Filesystem-`rename()` ist nicht zulässig und wird nicht als Platzierungsmechanismus verwendet.

Klartext-Dumps und unverschlüsselte Tar-Dateien dürfen nur im privaten Temp-Bereich des Workers existieren. `encryptedFinalize()` entfernt den Klartext nach erfolgreicher age-Verschlüsselung. Nach `/var/backups/fanmind` beziehungsweise den konfigurierten Backup-Root gelangen ausschließlich verschlüsselte `.age`-Dateien und ihre `.age.sha256`-Prüfsummen.

Die dauerhafte Ablage erfolgt als copy/verify/finalize-Prozess: `.age` und `.age.sha256` werden zuerst als eindeutig benannte versteckte `.part`-Dateien direkt im Backup-Root angelegt, dort gelesen, per SHA256 gegen das Worker-Ergebnis und die kopierte Prüfsummendatei validiert und erst danach innerhalb des Backup-Root atomar umbenannt. Die Reihenfolge ist bewusst: zuerst die finale `.age.sha256`, danach die finale `.age`. Das Paar gilt erst dann als verwendbar, wenn beide finalen Dateien vorhanden sind.

Bei Fehlern muss geprüft werden, dass keine versteckten `.part`-Dateien und kein irreführendes finales `.age` ohne gültige Prüfsumme zurückgeblieben sind. Bestehende finale Backup-Namen dürfen nicht überschrieben werden; eine Kollision ist ein Fehler, der manuell untersucht werden muss.

## Validierung

- Server-/Storage-Archive: `tar -tzf` vor Verschlüsselung.
- Datenbank: `pg_restore --list` vor Verschlüsselung.
- Verschlüsselte Datei: SHA256-Datei neben dem `.age`-Artefakt.
- Offsite: rclone beendet erfolgreich, bevor `offsite_status=uploaded` gesetzt wird.

## Restore

Restore ist absichtlich nicht in der Web-App implementiert. Ein Restore-Test bleibt ein offener Phase-5-Abschlussblock und muss separat auf einer Testumgebung dokumentiert werden.

## Retention

Zielwerte: 7 tägliche, 4 wöchentliche und 6 monatliche Backups. Die erste Worker-Implementierung liefert einen sicheren Dry-Run-fähigen Retention-Baustein, der ausschließlich eindeutig erkannte FanMind-Backup-Artefakte (`fanmind-*.age`, `fanmind-*.sha256`) betrachtet und mindestens einen Bestand schützt. Vor dem Aktivieren einer echten Löschung muss der Dry-Run auf Production geprüft und der Mindestbestand verifiziert werden.

```bash
sudo FANMIND_BACKUP_ROOT=/var/backups/fanmind node /usr/local/lib/fanmind-ops/backup-retention.mjs --dry-run
```

## Phase 5 blocker resolution notes

Full backups are complete only when one encrypted `fanmind-full-*.tar.gz.age` and its adjacent `.age.sha256` exist outside the temporary directory. The encrypted full tar contains encrypted server-config, database and storage part artifacts plus their checksums and a central manifest. Treat the pair as atomic for copy, retention and offsite handling.

The server configuration backup deliberately uses Option A: `/etc/fanmind-backup` is included as `sensitive_encrypted_config` because it contains the operational material required to understand and rebuild backup automation. Never log or publish its contents; verify only encrypted artifacts and checksums on Production.

`verify_backup` remains a later hardening item and is not an active job type in this PR. No Production migration or worker installation is performed by Codex. The service-role permission follow-up must be the final migration before installing the worker; otherwise PostgREST calls made with `SUPABASE_SERVICE_ROLE_KEY` can be unable to execute `claim_admin_backup_job` and queued jobs will not be claimed.
