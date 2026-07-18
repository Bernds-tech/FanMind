# FanMind serverseitiges Fehlertracking

## Ziel

FanMind erfasst unerwartete serverseitige Next.js-Fehler datensparsam, gruppiert wiederkehrende Fehler und erzeugt Admin-Meldungen bei neuen Gruppen oder einem Fehleranstieg.

Die Integration verwendet `src/instrumentation.ts` und den Next.js-Hook `onRequestError` ausschließlich im Node.js-Runtime-Pfad.

## Standardzustand

Nach dem Merge bleibt die Erfassung deaktiviert:

```text
FANMIND_SERVER_ERROR_TRACKING_ENABLED=false
FANMIND_SERVER_ERROR_EMAIL_ENABLED=false
```

Die Supabase-Migration wird nicht automatisch angewendet.

## Gespeicherte Felder

Gespeichert werden ausschließlich:

- SHA-256-Fingerprint;
- optionaler sicher formatierter Next.js-Digest;
- Route-Schablone wie `/fans/[id]` ohne Query oder Fragment;
- Route-Typ und Router-Art;
- HTTP-Methode;
- Umgebung;
- Release-Commit;
- erster und letzter Zeitpunkt;
- Gesamtzahl und Anzahl im 10-Minuten-Fenster.

Nicht gespeichert werden:

- Fehlermeldung;
- Stack;
- Header oder Cookies;
- Query-Parameter;
- Request- oder Response-Body;
- Kontakt-, Nachrichten-, Prompt-, KI- oder Zahlungsinhalte;
- IP-Adresse oder Browserkennung.

## Migration

Vor Aktivierung manuell anwenden:

```text
supabase/migrations/20260718203000_privacy_server_error_tracking.sql
```

Die Migration legt an:

- `server_error_events` für minimale Ereignismetadaten;
- `server_error_groups` für Aggregation und Cooldown;
- `record_server_error_event(...)` als service-role-only RPC;
- `cleanup_server_error_events(...)` für die Ereignisaufbewahrung.

RLS ist aktiv. `PUBLIC`, `anon` und `authenticated` erhalten keine Tabellen- oder RPC-Rechte.

## Alarmierung

Standardwerte:

```text
FANMIND_SERVER_ERROR_ALERT_THRESHOLD=5
FANMIND_SERVER_ERROR_ALERT_COOLDOWN_MINUTES=30
```

Verhalten:

- die erste neue Fehlergruppe erzeugt eine Warnung im Admin Operations Center;
- ab dem Schwellenwert innerhalb von zehn Minuten wird dieselbe Gruppe kritisch;
- die Eskalation auf kritisch umgeht den normalen Cooldown einmalig;
- unveränderte Fehler erzeugen erst nach Ablauf des Cooldowns erneut eine Meldung;
- Admin-Meldungen enthalten nur eine verkürzte Fingerprint-Referenz, keine Route oder technische Fehlermeldung.

Kritische E-Mails bleiben separat opt-in:

```text
FANMIND_SERVER_ERROR_EMAIL_ENABLED=false
```

Erforderlich für E-Mail:

```text
RESEND_API_KEY=<server-only>
FANMIND_NOTIFICATION_FROM=FanMind <noreply@fanmind.ch>
FANMIND_ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

Die E-Mail enthält nur Referenz, Anzahl, Release-Kurzcommit und Link zum Operations Center.

## Kontrollierte Aktivierung

1. Migration in Supabase Production anwenden.
2. Tabellen, RLS und Funktionsrechte prüfen.
3. Deployment vollständig abschließen.
4. In `.env.production` zunächst nur setzen:

```text
FANMIND_SERVER_ERROR_TRACKING_ENABLED=true
FANMIND_SERVER_ERROR_EMAIL_ENABLED=false
```

5. PM2 kontrolliert neu starten.
6. Einen absichtlich ausgelösten Fehler ausschließlich in einer sicheren internen Testroute oder Testumgebung prüfen.
7. Kontrollieren, dass weder Fehlermeldung noch Stack, Header, Query oder Inhalt in Supabase gespeichert wurden.
8. Admin-Meldung und Gruppierung prüfen.
9. Erst danach E-Mail separat aktivieren und einen kontrollierten Schwellenwerttest durchführen.

## Aufbewahrung

Die Ereignistabelle kann über die service-role-only RPC bereinigt werden:

```sql
select public.cleanup_server_error_events(30);
```

Der Wert wird auf 7 bis 365 Tage begrenzt. Fehlergruppen bleiben als aggregierte technische Historie bestehen, bis eine spätere, gesonderte Retention-Entscheidung umgesetzt wird.

## Fehleroberflächen

`src/app/error.tsx` und `src/app/global-error.tsx` zeigen Nutzern nur neutrale Hinweise und Wiederholungsaktionen. Sie rendern keine Fehlermeldung, keinen Stack und keinen Digest.
