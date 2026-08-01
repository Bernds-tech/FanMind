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

## Migration und kontrollierter Production-Weg

Vor Aktivierung manuell anwenden:

```text
supabase/migrations/20260718203000_privacy_server_error_tracking.sql
```

Die Migration ist transaktional, SHA-256-gebunden und legt an:

- `server_error_events` für minimale Ereignismetadaten;
- `server_error_groups` für Aggregation und Cooldown;
- `record_server_error_event(...)` als service-role-only RPC;
- `cleanup_server_error_events(...)` für die Ereignisaufbewahrung.

RLS ist aktiv. `PUBLIC`, `anon` und `authenticated` erhalten keine Tabellen- oder RPC-Rechte.

Der normale Web-Deploy installiert nur den root-eigenen Runner, die gepinnte
SQL-Datei, Ergebnisverifier und gehärtete systemd-Units. Er wendet die
Migration niemals an und ändert die Schalter nicht. Der ausschließlich
manuelle Workflow `.github/workflows/server-error-production-control.yml`
bindet jeden Schritt an `main`, das geschützte `production`-Environment, den
Production-Runner und den exakt live ausgelieferten Commit.

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

1. Workflow mit `action=verify` und der Bestätigung
   `server-error-tracking-production-verify` ausführen.
2. Nur bei `schema_not_ready` mit `action=apply` und der Bestätigung
   `server-error-tracking-production-apply` transaktional anwenden.
3. `verify` unabhängig wiederholen; Tabellen, exakte Spalten, RLS,
   Browser-Sperren, Indizes, `security definer`/`search_path` und
   service-role-only Funktionsrechte müssen grün sein.
4. Mit `action=accept` und
   `accept-server-error-tracking-production` zwei reservierte synthetische
   Ereignisse prüfen. Der Lauf muss Warnung, Kritisch, genau eine generische
   Admin-Meldung und das vollständige Cleanup belegen; echte Routen,
   Fehlermeldungen und Kundendaten sind ausgeschlossen.
5. Erst mit `action=activate` und
   `activate-server-error-tracking-production` rollback-gesichert setzen:

```text
FANMIND_SERVER_ERROR_TRACKING_ENABLED=true
FANMIND_SERVER_ERROR_EMAIL_ENABLED=false
```

6. PM2 wird kontrolliert rollierend neu geladen; Release, `/api/health` und
   der vollständige Production-Audit müssen danach unverändert grün sein.
7. Die E-Mail-freie Storage-Abnahme wird nach Aktivierung wiederholt. Es gibt
   bewusst keinen öffentlichen oder dauerhaft erreichbaren Fehler-Endpunkt.
8. E-Mail bleibt eine spätere, getrennte Freigabe und ist nicht Bestandteil
   dieses Aktivierungswegs.

## Aufbewahrung

Die Ereignistabelle kann über die service-role-only RPC bereinigt werden:

```sql
select public.cleanup_server_error_events(30);
```

Der Wert wird auf 7 bis 365 Tage begrenzt. Fehlergruppen bleiben als aggregierte technische Historie bestehen, bis eine spätere, gesonderte Retention-Entscheidung umgesetzt wird.

## Fehleroberflächen

`src/app/error.tsx` und `src/app/global-error.tsx` zeigen Nutzern nur neutrale Hinweise und Wiederholungsaktionen. Sie rendern keine Fehlermeldung, keinen Stack und keinen Digest.
