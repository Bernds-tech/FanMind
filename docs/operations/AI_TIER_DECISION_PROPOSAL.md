# Entscheidungsvorlage für KI Standard, Plus und Ultra

Stand: 30. Juli 2026

## Zweck und Status

Diese Vorlage bündelt die noch offenen fachlichen Entscheidungen, damit die
KI-Stufen später einmal vollständig und widerspruchsfrei freigegeben werden
können. Sie ist **keine Freigabe**. Solange die Entscheidungstabelle nicht
vollständig beschlossen, geprüft und datiert ist, bleiben KI Plus und KI Ultra
`Coming Soon`, technisch blockiert und nicht automatisch buchbar.

Der aktuelle Codezustand bleibt unverändert:

- KI Standard ist im Starter-Paket enthalten;
- KI Plus kostet nach Freigabe zusätzlich 100 € pro Monat;
- KI Ultra kostet nach Freigabe zusätzlich 200 € pro Monat;
- es gibt keine automatische Sendung;
- KI-Add-ons erhalten keinen Referral-Rabatt;
- technische Kurzzeit-, Kontext- und Ausgabegrenzen bleiben
  Missbrauchs-/Kostenschutz und sind keine Vertragskontingente;
- Stripe-Entitlements, Migrationen oder produktive Tier-Routen werden durch
  dieses Dokument weder aktiviert noch angewendet.

## Beschlusspflichtige Matrix

`UNENTSCHIEDEN` darf erst durch einen schriftlich bestätigten Wert ersetzt
werden. Provider-Modellnamen, Stripe-IDs und Secrets gehören nicht in diese
attachierbare Entscheidungsvorlage; sie werden später ausschließlich in der
serverseitigen Konfiguration hinterlegt.

| Entscheidung | KI Standard | KI Plus | KI Ultra |
| --- | --- | --- | --- |
| Öffentlicher Status | Aktiv | UNENTSCHIEDEN | UNENTSCHIEDEN |
| Monatlicher Add-on-Preis | im Basispaket enthalten | 100 € | 200 € |
| Freigegebene Modellklasse | UNENTSCHIEDEN | UNENTSCHIEDEN | UNENTSCHIEDEN |
| Vertragskontingent Anfragen/Monat | UNENTSCHIEDEN | UNENTSCHIEDEN | UNENTSCHIEDEN |
| Vertragskontingent Tokens/Monat | UNENTSCHIEDEN | UNENTSCHIEDEN | UNENTSCHIEDEN |
| Gesprächskontext in Nachrichten | UNENTSCHIEDEN | UNENTSCHIEDEN | UNENTSCHIEDEN |
| Verhalten bei 80 % | UNENTSCHIEDEN | UNENTSCHIEDEN | UNENTSCHIEDEN |
| Verhalten bei 100 % | UNENTSCHIEDEN | UNENTSCHIEDEN | UNENTSCHIEDEN |
| Nachberechnung/Overage | UNENTSCHIEDEN | UNENTSCHIEDEN | UNENTSCHIEDEN |
| Automatisch buchbar | nein | UNENTSCHIEDEN | UNENTSCHIEDEN |
| Automatische Sendung | nein | nein | nein |
| Referral-Rabatt | nein | nein | nein |

## Paketwechsel und Abrechnung

Vor technischer Aktivierung müssen zusätzlich diese Regeln eindeutig
beschlossen sein:

| Thema | Beschluss |
| --- | --- |
| Wirksamkeit Upgrade | UNENTSCHIEDEN |
| Wirksamkeit Downgrade | UNENTSCHIEDEN |
| Anteilige Berechnung beim Wechsel | UNENTSCHIEDEN |
| Kündigung des Add-ons | UNENTSCHIEDEN |
| Verhalten bei `past_due`/`paused` | UNENTSCHIEDEN |
| Verhalten nach Starter-Vertragsende | fail-closed; produktive KI bleibt deaktiviert |
| Rückerstattung/Gutschrift | UNENTSCHIEDEN |
| Steuerliche Darstellung | UNENTSCHIEDEN |

## Empfohlene Entscheidungsreihenfolge

1. Zielgruppe und Nutzen je Stufe festlegen.
2. Modellklassen und serverseitige Provider-Zuordnung freigeben.
3. Reale Kostenmessung aus `ai_usage_events` auswerten.
4. Monatskontingente und Kontextgrenzen mit Kostenpuffer beschließen.
5. Verhalten bei 80 % und 100 % sowie Overage festlegen.
6. Upgrade-, Downgrade-, Kündigungs- und Prorationsregeln beschließen.
7. Rechtliche, steuerliche und öffentliche Texte prüfen.
8. Getrennte Stripe-Test-Prices für Plus und Ultra bereitstellen.
9. Staging-Migration und rollback-only Akzeptanz vollständig grün nachweisen.
10. Erst danach zentrale Policy, Billing und öffentliche Anzeige in einem
    separat geprüften Aktivierungs-PR umstellen.

## Technische Freigabekriterien

Eine spätere Aktivierung darf nur erfolgen, wenn alle Punkte nachweislich
erfüllt sind:

- die Matrix und alle Abrechnungsregeln enthalten keinen
  `UNENTSCHIEDEN`-Wert mehr;
- `src/config/aiTiers.mjs`, `docs/SOURCE_OF_TRUTH.md`, README, Sales-Texte und
  öffentliche Paketdarstellung stimmen exakt überein;
- serverseitige Stripe-Prices sind getrennt, im richtigen Modus und für exakt
  100 €/200 € monatlich geprüft;
- Workspace-Felder und Entitlements bleiben server-owned und RLS-/Rollen-Tests
  sind positiv und negativ grün;
- Staging-Migration, Lifecycle-Reihenfolge, Idempotenz und Rollback sind grün;
- Kosten-, Missbrauchs-, Datenschutz- und manuelle Versandgrenzen bleiben
  wirksam;
- `npm run ai:tiers:readiness` meldet die beabsichtigte Matrix ohne Secrets
  oder konkrete externe IDs auszugeben;
- eine ausdrückliche Production-Freigabe liegt vor.

## Schriftliche Freigabe

Die folgenden Felder werden erst nach vollständiger Entscheidung ausgefüllt:

```text
Fachlich freigegeben von: UNENTSCHIEDEN
Technisch freigegeben von: UNENTSCHIEDEN
Recht/Steuer geprüft von: UNENTSCHIEDEN
Freigabedatum (UTC): UNENTSCHIEDEN
Ziel-Release-Commit: UNENTSCHIEDEN
```

Ohne diese vollständige Freigabe bleibt der bestehende fail-closed Zustand
maßgeblich.
