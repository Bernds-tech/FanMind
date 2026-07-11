# Phase 5 Implementation Plan

## Bereits umgesetzt

- Operations Foundation aus PR #535: Health-Endpunkt, Operations Center, Admin-Bell und Metadatentabellen.
- Backup-/Worker-Teilblock: sicheres Jobmodell, atomare Job-Übernahme, separater Worker, server_config/database/storage/full-Backups, age-Verschlüsselung, rclone-Offsite-Adapter, systemd-Dokumentation und Admin-UI zum Einreihen.

## Weiterhin offen

- Externe Alarmierung und E-Mail.
- Sentry oder anderes Fehlertracking.
- Atomarer Deployment-/Rollback-Prozess.
- Saubere Trennung Production/Test.
- Restore-Test und formaler Phase-5-Abschluss.

Phase 3 und Meta-Integrationen werden in diesem Block nicht verändert.
