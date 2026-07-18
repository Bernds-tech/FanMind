# FanMind Backup Verification Job

## Zweck

Der Job `verify_backup` prüft das neueste geeignete, lokal gespeicherte FanMind-Backup erneut und unabhängig vom Erstellungsprozess. Die Prüfung ist **read-only** und führt weder Restore noch Entschlüsselung aus.

## Sicherheitsmodell

- Nur Platform-Admins können den Job über `/admin/operations` einreihen.
- Die Web-App übermittelt ausschließlich den festen Jobtyp `verify_backup`.
- Browser und Job-Metadaten dürfen keinen Artefakt-, Prüfsummen- oder Shell-Pfad vorgeben.
- Der Worker wählt selbst das neueste geeignete Objekt aus `backup_runs`.
- `storage_reference` und `checksum_reference` müssen nach `realpath` innerhalb von `FANMIND_BACKUP_ROOT` liegen.
- Die Prüfsummendatei muss exakt `<artifact>.sha256` sein.
- Die bestehende SHA-256- und Größenangabe aus `backup_runs` muss mit dem Artefakt übereinstimmen.
- Der private age-Schlüssel bleibt außerhalb von Production. Deshalb ist die UI-Prüfung bewusst `checksum_only`.

## Ergebnis

Bei Erfolg:

- wird der ursprüngliche Lauf auf `validation_status=passed` gesetzt;
- entsteht ein neuer `backup_runs`-Datensatz mit `backup_type=verification`;
- enthält das Manifest nur Quell-Lauf-ID, Backup-Typ, Modus und Dateinamen;
- wird der Admin-Job als `succeeded` abgeschlossen;
- werden Admin-Benachrichtigung und Audit-Eintrag ohne Pfade oder Secrets angelegt.

Bei Fehlern wird der Job mit einem datenarmen Fehlercode beendet. Ein Restore oder eine Änderung des Backup-Artefakts findet nicht statt.

## Migration

Vor Nutzung auf Production manuell und nach den früheren Phase-5-Migrationen anwenden:

```text
supabase/migrations/20260718173000_enable_safe_backup_verification.sql
```

Die Migration:

- erlaubt `verify_backup` wieder in `admin_operation_jobs`;
- erlaubt `verification` in `backup_runs`;
- nimmt `verify_backup` in die atomare Claim-Funktion auf;
- hält `EXECUTE` für `PUBLIC`, `anon` und `authenticated` gesperrt;
- gewährt `EXECUTE` ausschließlich `service_role`.

## Production-Abnahme

1. Migration prüfen und anwenden.
2. Deployment abschließen, damit Worker und Verifier gemeinsam unter `/usr/local/lib/fanmind-ops/` liegen.
3. Vorhandenes lokales Backup-Paar unter `FANMIND_BACKUP_ROOT` bestätigen.
4. In `/admin/operations` **Letztes Backup prüfen** wählen.
5. Jobstatus, Verification-Lauf, Admin-Meldung und Audit-Eintrag kontrollieren.
6. Bestätigen, dass keine Datei verändert wurde und keine Entschlüsselung stattfand.
