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

Die noch offenen fachlichen Beschlüsse sind ohne Aktivierungswirkung in
`docs/operations/AI_TIER_DECISION_PROPOSAL.md` gebündelt. Solange dort
`UNENTSCHIEDEN`-Werte stehen, bleiben Plus und Ultra blockiert.

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

## Workspace-Entitlement

`resolveWorkspaceAiTierEntitlement(...)` in `src/config/aiTiers.mjs` ist der
gemeinsame fail-closed Vertrag für die später serverseitig geladenen
Workspace-Entitlements.

Ohne gespeicherten Zustand bleibt KI Standard enthalten und wirksam. Ein
kostenpflichtiges Plus-/Ultra-Entitlement wird nur wirksam, wenn alle
folgenden Nachweise gleichzeitig vorliegen:

- die Entitlement-Daten stammen aus einem serververwalteten Speicher;
- Lifecycle-Status ist `active`;
- Quelle ist Stripe;
- das Stripe-Subscription-Item wurde serverseitig verknüpft;
- `effectiveAt` ist gültig und nicht in der Zukunft;
- ein optionales `expiresAt` ist gültig und noch nicht erreicht;
- die vollständige zentrale Tier-Readiness ist positiv.

Fehlt ein Nachweis, ist die wirksame Stufe Standard. Die Funktion gibt nur
feste Rückfallcodes zurück:

- `unknown_tier`
- `server_owned`
- `lifecycle_status`
- `source`
- `stripe_item`
- `effective_at`
- `not_started`
- `expires_at`
- `expired`
- `tier_readiness`

Konkrete Stripe-IDs werden dem Resolver nur als bereits serverseitig
bestätigtes Ja/Nein übergeben und weder zurückgegeben noch geloggt.

Der persistente server-only Speicher, die additive Migration und der
redigierende Loader sind nun als deploy-before-migrate-Brücke vorbereitet.
Sie sind noch nicht auf Staging oder Production angewendet und noch nicht mit
Stripe-Webhooks oder produktiven KI-Pfaden verdrahtet. Die verbindliche
Rollout-Reihenfolge und negative Berechtigungsabnahme stehen in
`docs/operations/AI_TIER_ENTITLEMENT_STORAGE.md`.
