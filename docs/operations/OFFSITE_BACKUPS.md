# Offsite Backups

FanMind darf langfristig nicht ausschließlich lokale Backups auf `fanmind-prod-01` behalten. Der Worker unterstützt einen rclone-Offsite-Adapter.

## Konfiguration

- `FANMIND_BACKUP_OFFSITE_ENABLED=true`
- `FANMIND_BACKUP_RCLONE_REMOTE=<remote-name>`
- `FANMIND_BACKUP_RCLONE_CONFIG=/etc/fanmind-backup/rclone.conf`
- `FANMIND_BACKUP_REMOTE_PATH=fanmind/production`

Nur verschlüsselte `.age`-Dateien werden hochgeladen. Klartextarchive werden nach erfolgreicher Verschlüsselung gelöscht.

## Degraded-Modus

Wenn Offsite nicht konfiguriert ist, scheitert der lokale Backup-Lauf nicht. Der Lauf wird als `offsite_pending`/`not_configured` markiert und erzeugt eine In-App-Meldung. Wenn rclone fehlschlägt, bleibt das lokale Backup erhalten und der Status wird `degraded`/`failed`.
