# KI-Stufen-Readiness

Stand: 26. Juli 2026

## Ziel

Die Prüfung verbindet die kanonische KI-Stufen-Policy mit den externen
Freigabevoraussetzungen, ohne Stripe-IDs, Modelle, Limits, Kundendaten oder
Secrets auszugeben.

```bash
npm run ai:tiers:readiness
```

Im aktuellen Produktstand muss die Ausgabe fachlich so enden:

```text
AI_TIER_STANDARD=READY blockers=none
AI_TIER_PLUS=BLOCKED blockers=...
AI_TIER_ULTRA=BLOCKED blockers=...
AI_TIER_READINESS=PASS
```

`PASS` bedeutet, dass sichtbarer Produktstatus und technische Readiness
übereinstimmen. Es aktiviert kein Add-on, verändert keinen Workspace und
führt keinen Stripe-Aufruf aus.

## Standard

KI Standard ist als enthaltene Leistung bereit, wenn:

- der Preisaufschlag null bleibt;
- der öffentliche Status `Aktiv` ist;
- Billing `included` meldet;
- keine automatische Buchung erforderlich ist;
- automatische Sendung und Referral-Rabatt für das Add-on ausgeschlossen
  bleiben.

Die operativen Aufruf-, Kontext- und Ausgabegrenzen bleiben Kosten- und
Missbrauchsschutz. Sie sind keine vertraglichen Monatskontingente.

## Plus und Ultra

Ein kostenpflichtiges Add-on ist nur bereit, wenn gleichzeitig:

- öffentlicher Status `Aktiv` ist;
- Billing-Status `enabled` ist;
- automatische Buchung in der zentralen Policy ausdrücklich freigegeben ist;
- Modellklasse, Monatsanfragen, Monatstokens und Kontextgrenze positive,
  festgelegte Werte besitzen;
- der zugehörige serverseitige Stripe-Price konfiguriert ist;
- der Workspace-Contract nach der positiven und negativen Abnahme aus
  `WORKSPACE_SERVER_OWNED_FIELDS.md` bestätigt wurde;
- automatische Sendung und Referral-Rabatt deaktiviert bleiben.

Verwendete serverseitige Laufzeitwerte:

- `STRIPE_PRICE_AI_PLUS`
- `STRIPE_PRICE_AI_ULTRA`
- `FANMIND_AI_TIER_WORKSPACE_CONTRACT_CONFIRMED=true`

Die Contract-Bestätigung darf erst nach dem dokumentierten Production-
Preflight, beiden kontrollierten Datenbankschritten und den positiven sowie
negativen Berechtigungstests gesetzt werden. Eine gesetzte Variable allein
aktiviert weder Entitlements noch Checkout.

## Blocker-Codes

Die Prüfung gibt ausschließlich feste Codes aus:

- `public_status`
- `billing_status`
- `booking_flag`
- `model_class`
- `monthly_request_limit`
- `monthly_token_limit`
- `context_message_limit`
- `stripe_price`
- `workspace_contract`
- `automatic_sending`
- `referral_discount`
- `base_price`

Konkrete Konfigurationswerte werden nie ausgegeben.
