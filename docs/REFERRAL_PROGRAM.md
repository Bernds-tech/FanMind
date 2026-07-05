# FanMind Referral / Founder-100 Programm

Stand: Juli 2026

Dieses Dokument beschreibt das geplante Referral-Programm. Es ist eine Produkt-/Billing-Roadmap und darf erst als aktiv verkauft oder automatisiert werden, wenn Tracking, Billing-Verrechnung, Missbrauchsschutz sowie rechtliche/steuerliche Prüfung abgeschlossen sind.

## 1. Kernidee

Ein FanMind-Nutzer, der über einen persönlichen Referral-Link neue zahlende FanMind-Nutzer bringt, erhält pro aktivem geworbenen Nutzer einen dauerhaften Rabatt auf seine eigenen FanMind-Kosten.

Regel:

- Pro aktivem geworbenen Nutzer: `5 %` Rabatt auf die eigenen laufenden FanMind-Kosten.
- Maximal wirksam: `20` aktive geworbene Nutzer.
- Bei 20 aktiven geworbenen Nutzern: rechnerisch `100 %` Rabatt auf die eigenen laufenden FanMind-Kosten.
- Wenn ein geworbener Nutzer kündigt, nicht zahlt, gesperrt wird oder nicht mehr aktiv ist, fällt dessen `5 %` wieder weg.
- Das Programm ist auf die ersten `100` berechtigten FanMind-Nutzer begrenzt.

## 2. Beispiel

| Aktive geworbene Nutzer | Rabatt | Effekt |
| --- | ---: | --- |
| 0 | 0 % | voller Preis |
| 1 | 5 % | 95 % des laufenden Preises |
| 5 | 25 % | 75 % des laufenden Preises |
| 10 | 50 % | 50 % des laufenden Preises |
| 20 | 100 % | laufende FanMind-Kosten rechnerisch 0 € |

Wenn von 20 aktiven geworbenen Nutzern einer kündigt, bleiben 19 aktive Referrals. Der Rabatt fällt dann von 100 % auf 95 %.

## 3. Begriffe

### Referrer

Der bestehende FanMind-Nutzer, der seinen Referral-Link teilt.

### Referred User

Der neue Nutzer, der über den Referral-Link zu FanMind kommt und zahlender aktiver Kunde wird.

### Aktiver geworbener Nutzer

Ein geworbener Nutzer zählt nur, wenn alle Bedingungen erfüllt sind:

- Registrierung über gültigen Referral-Link oder eindeutig zuordenbaren Referral-Code.
- Workspace ist nicht Demo-only.
- Zahlungspflichtiger Plan ist aktiv oder bezahlt.
- Billing-Status ist nicht gekündigt, nicht gesperrt, nicht dauerhaft fehlgeschlagen.
- Keine Rückerstattung, kein Testmissbrauch, kein Self-Referral.

## 4. Begrenzung auf erste 100 Nutzer

Das Programm steht nur den ersten `100` berechtigten FanMind-Nutzern zur Verfügung.

Dafür braucht FanMind eine klare Eligibility-Regel:

- Nutzer erhält `referral_program_eligible = true` nur, wenn noch Plätze verfügbar sind.
- Es wird ein `referral_program_slot_number` zwischen 1 und 100 gespeichert.
- Nach 100 berechtigten Nutzern werden keine neuen Standard-Teilnahmen vergeben, außer Admin entscheidet explizit anders.

## 5. Was rabattiert wird

Standardregel:

- Der Rabatt gilt auf laufende monatliche FanMind-Kosten.
- Einmalige Setup-Gebühren werden standardmäßig nicht automatisch rabattiert, außer FanMind entscheidet das explizit später.
- Rabatte werden nicht bar ausgezahlt.
- Nicht genutzte Rabatte werden nicht in Guthaben umgewandelt.
- Rabatt kann nicht unter 0 € fallen.

Formel:

`discount_percent = min(active_referrals * 5, 100)`

`discounted_monthly_fee = monthly_fee * (1 - discount_percent / 100)`

## 6. Statuslogik für geworbene Nutzer

Ein Referral kann diese Status haben:

- `pending`: Registrierung erkannt, aber noch nicht zahlend aktiv.
- `active`: zählt für Rabatt.
- `inactive`: zählt nicht, z. B. gekündigt, gesperrt, abgelaufen.
- `rejected`: abgelehnt, z. B. Self-Referral, Missbrauch, Duplikat.
- `refunded`: zählt nicht.

Nur `active` zählt für Rabatt.

## 7. Missbrauchsschutz

Nicht erlaubt:

- Self-Referral mit eigener E-Mail oder eigenem Unternehmen.
- Mehrfachaccounts zur Rabattmaximierung.
- Fake-Registrierungen.
- Rückerstattung/Chargeback und trotzdem Rabatt behalten.
- Referral-Spam im Namen von FanMind.
- Irreführende Versprechen über aktive Integrationen, automatische Sendung oder Preise.

Admin muss Referrals sperren oder ablehnen können.

## 8. Transparenz im Produkt

Späteres Dashboard-Modul für berechtigte Nutzer:

- persönlicher Referral-Link;
- Anzahl geworbener Nutzer;
- Anzahl aktiver geworbener Nutzer;
- aktueller Rabatt in Prozent;
- rechnerischer monatlicher Vorteil;
- Hinweis: Rabatt hängt von aktiven, zahlenden geworbenen Nutzern ab;
- Hinweis: Wenn ein geworbener Nutzer kündigt, sinkt der Rabatt wieder;
- Limit: maximal 20 aktive Referrals für 100 % Rabatt.

## 9. Adminbereich

Admin braucht eine Übersicht:

- alle berechtigten Nutzer;
- Slot 1 bis 100;
- Referral-Code / Link;
- aktive Referrals;
- pending/inactive/rejected Referrals;
- aktueller Rabatt;
- manueller Override;
- Missbrauchsnotizen;
- Billing-Verrechnung;
- Export für Prüfung.

## 10. Datenmodell-Vorschlag

### `referral_program_members`

- `id`
- `workspace_id`
- `user_id`
- `referral_code`
- `slot_number`
- `eligible`
- `status`
- `created_at`
- `updated_at`
- `admin_note`

### `referrals`

- `id`
- `referrer_workspace_id`
- `referrer_user_id`
- `referred_workspace_id`
- `referred_user_id`
- `referral_code`
- `status`
- `first_seen_at`
- `activated_at`
- `deactivated_at`
- `deactivation_reason`
- `billing_status_snapshot`
- `created_at`
- `updated_at`

### `referral_discount_snapshots`

- `id`
- `workspace_id`
- `active_referral_count`
- `discount_percent`
- `monthly_fee_cents_before_discount`
- `monthly_discount_cents`
- `monthly_fee_cents_after_discount`
- `calculated_at`

## 11. Billing-Regel

Billing darf nicht nur beim Signup berechnen. Es muss regelmäßig neu berechnen:

- vor Rechnungslauf;
- nach Kündigung eines geworbenen Nutzers;
- nach fehlgeschlagener Zahlung;
- nach Rückerstattung;
- nach Admin-Override;
- nach Reaktivierung eines geworbenen Nutzers.

Wenn ein geworbener Nutzer wegfällt, steigt der zu zahlende Betrag beim Referrer entsprechend wieder.

## 12. Recht/Steuer/AGB

Vor Aktivierung prüfen und in AGB/Zahlungsbedingungen ergänzen:

- Teilnahmebedingungen;
- Rabatt statt Auszahlung;
- keine Auszahlung von Guthaben;
- Begrenzung auf erste 100 Teilnehmer;
- maximal 20 aktive Referrals;
- Wegfall des Rabatts bei Kündigung/Inaktivität geworbener Nutzer;
- Missbrauchsausschluss;
- Admin-Entscheid bei Streitfällen;
- Datenschutz bei Referral-Tracking;
- steuerliche Behandlung von Rabatten/Gutschriften.

## 13. Status in FanMind

Aktueller Status:

- Produktidee / Roadmap.
- Noch nicht aktiv als automatische Billing-Funktion.
- Darf erwähnt werden als geplantes Founder-/Referral-Programm für erste Nutzer, aber nur mit klarer Einschränkung.
- Nicht in Gerhards Standarddemo zeigen, solange Tracking/Billing/Legal nicht fertig ist.

## 14. Akzeptanzkriterien für Umsetzung

- [ ] Nur erste 100 berechtigte Nutzer können teilnehmen.
- [ ] Jeder Teilnehmer hat eindeutigen Referral-Code/Link.
- [ ] Referral wird beim Signup/Checkout gespeichert.
- [ ] Nur aktive zahlende geworbene Nutzer zählen.
- [ ] Rabatt = aktive Referrals * 5 %, maximal 100 %.
- [ ] Kündigung/Deaktivierung eines geworbenen Nutzers reduziert Rabatt automatisch.
- [ ] Admin kann Referrals prüfen, sperren und überschreiben.
- [ ] Billing berücksichtigt Rabatt erst nach validiertem Status.
- [ ] Dashboard zeigt Rabatt transparent.
- [ ] AGB/Zahlungsbedingungen sind aktualisiert.
- [ ] Security/RLS verhindert fremde Referral-Daten.
