#!/usr/bin/env python3
from pathlib import Path

# Update privacy fallback test.
test_path = Path("tests/server-error-telemetry.test.mjs")
test_text = test_path.read_text(encoding="utf-8")
old_test = '''test("fallback request paths lose query and fragment data", () => {
  assert.equal(
    telemetry.normalizeRoutePath(undefined, "/reset-password?email=private@example.com#secret"),
    "/reset-password",
  );
  assert.equal(telemetry.normalizeRoutePath("dashboard spaces", undefined), "/dashboard_spaces");
});
'''
new_test = '''test("missing route templates never persist the raw request path", () => {
  assert.equal(
    telemetry.normalizeRoutePath(undefined, "/reset-password?email=private@example.com#secret"),
    "/unknown",
  );
  assert.equal(
    telemetry.normalizeRoutePath("", "/fans/private-contact-id"),
    "/unknown",
  );
  assert.equal(telemetry.normalizeRoutePath("dashboard spaces", undefined), "/dashboard_spaces");
});
'''
if test_text.count(old_test) != 1:
    raise SystemExit("route fallback test anchor mismatch")
test_path.write_text(test_text.replace(old_test, new_test, 1), encoding="utf-8")

# Append canonical database/RLS truth.
schema_path = Path("docs/database/fanmind_current_schema.md")
schema_text = schema_path.read_text(encoding="utf-8")
marker = "## 13. Datenschutzsparsame Serverfehler-Telemetrie"
if marker not in schema_text:
    schema_text += '''

## 13. Datenschutzsparsame Serverfehler-Telemetrie

Migration: `supabase/migrations/20260718203000_privacy_server_error_tracking.sql`

### `server_error_events`

Zweck: minimale technische Einzelereignisse für unerwartete serverseitige Next.js-Fehler.

Gespeicherte Felder:

- `id`
- `created_at`
- `fingerprint` als SHA-256
- optionaler, formatgeprüfter Next.js-`digest`
- `route_path` ausschließlich als Route-Schablone oder `/unknown`
- `route_type`
- `router_kind`
- `http_method`
- `environment`
- `release_commit`

Ausdrücklich nicht vorhanden:

- Fehlermeldung oder Stack
- Request-/Response-Body
- Header, Cookies, Query-Parameter oder IP-Adresse
- Kontakt-, Nachrichten-, Prompt-, KI- oder Zahlungsinhalte

RLS/Scope:

- RLS ist aktiviert.
- `PUBLIC`, `anon` und `authenticated` haben keine Tabellenrechte.
- Inserts erfolgen ausschließlich über die service-role-only RPC `record_server_error_event(...)`.
- Einzelereignisse werden über `cleanup_server_error_events(...)` zeitlich begrenzt bereinigt; die RPC ist ebenfalls service-role-only.

### `server_error_groups`

Zweck: Aggregation identischer technischer Fehlergruppen und Alarm-Cooldown.

Gespeicherte Felder:

- `fingerprint`
- `first_seen_at`
- `last_seen_at`
- `occurrence_count`
- optionaler `digest`
- Route-Schablone, Route-Typ, Router-Art und HTTP-Methode
- Umgebung und letzter Release-Commit
- Status, Auflösungszeitpunkt und letzte Alarmstufe

RLS/Scope:

- RLS ist aktiviert.
- Keine Browserrolle erhält Tabellen- oder RPC-Zugriff.
- Platform-Admins lesen aggregierte Gruppen ausschließlich serverseitig nach `requirePlatformAdmin()` über Service Role.
- Admin-Meldungen enthalten nur generische Texte und eine verkürzte Fingerprint-Referenz; keine Route, Fehlermeldung oder Stackdaten.

### RPCs

- `record_server_error_event(...)`: validiert alle Metadaten, schreibt Ereignis und Gruppe atomar, berechnet das 10-Minuten-Fenster und erzeugt höchstens eine aktive Admin-Meldung je Fingerprint. Ausführung ausschließlich `service_role`.
- `cleanup_server_error_events(integer)`: löscht minimale Einzelereignisse nach 7 bis 365 Tagen. Ausführung ausschließlich `service_role`.

Aktivierung:

- Code bleibt ohne `FANMIND_SERVER_ERROR_TRACKING_ENABLED=true` inaktiv.
- Kritische E-Mails bleiben zusätzlich über `FANMIND_SERVER_ERROR_EMAIL_ENABLED=false` gesperrt, bis ein kontrollierter Test abgeschlossen ist.
'''
    schema_path.write_text(schema_text, encoding="utf-8")

# Extend the security checklist with the new truth.
security_path = Path("docs/SECURITY_RLS_SECRETS_CHECK.md")
security_text = security_path.read_text(encoding="utf-8")
security_marker = "## Serverfehler-Telemetrie"
if security_marker not in security_text:
    security_text += '''

## Serverfehler-Telemetrie

- [ ] Migration `20260718203000_privacy_server_error_tracking.sql` kontrolliert angewendet.
- [ ] RLS für `server_error_events` und `server_error_groups` aktiv.
- [ ] Keine Rechte für `PUBLIC`, `anon` oder `authenticated`.
- [ ] `record_server_error_event(...)` und `cleanup_server_error_events(...)` nur für `service_role` ausführbar.
- [ ] Keine Fehlermeldungen, Stacks, Header, Query-Parameter, Bodies, IP-Adressen oder Kundendaten gespeichert.
- [ ] Fehlende Route-Schablone wird als `/unknown` gespeichert und fällt nie auf den realen Request-Pfad zurück.
- [ ] `FANMIND_SERVER_ERROR_TRACKING_ENABLED` und E-Mail-Schalter erst nach kontrolliertem Test aktivieren.
'''
    security_path.write_text(security_text, encoding="utf-8")

print("Server error tests and canonical schema documentation updated.")
