# Backup Runbook

## Backup-Typen

- Server-Konfiguration: `.env.production`, PM2-Dump, nginx, relevante systemd-Units und öffentliche Backup-Konfiguration.
- Datenbank: PostgreSQL Custom Format mit `pg_dump` 17, `--no-owner`, `--no-privileges`; Validierung mit `pg_restore --list`.
- Storage: rekursive Sicherung des Buckets `fanmind-assets` mit Manifest je Objekt.
- Vollbackup: kombiniert erfolgreiche Teilbackups plus zentrales Manifest.

## Verschlüsselung

Automatische Backups verwenden age Public-Key-Verschlüsselung. Auf Production liegt nur der öffentliche Empfänger in `FANMIND_BACKUP_PUBLIC_KEY_FILE`, z. B. `/etc/fanmind-backup/recipient.txt`. Der private Schlüssel bleibt offline und darf nie auf Production oder ins Repository.

## Manuelle Ausführung

1. Migration `20260711143000_phase_5_backup_worker.sql` manuell in Supabase prüfen und anwenden.
2. Worker installieren und starten.
3. Als Platform-Admin unter `/admin/operations` einen Backup-Job einreihen.
4. Logs mit `journalctl` prüfen.
5. `backup_runs` und In-App-Benachrichtigung prüfen.

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

`verify_backup` remains a later hardening item and is not an active job type in this PR. No Production migration or worker installation is performed by Codex.
