# FanMind 7- bis 10-Tage-Umsetzungsplan

## Ziel

FanMind soll innerhalb von 7 bis 10 Tagen als vorzeigbare MVP-Demo stehen.

Diese Demo soll reichen, damit Gerhard erste Pilotkunden ansprechen kann.

## Leitprinzip

Zuerst bauen, dann verkaufen.

Gerhard soll erst mit einer sichtbaren Demo aktiv nach aussen gehen.

## Fixe Grundlagen

- Unternehmen / Marke: FanMind
- Webseitenname / Hauptdomain: FanMind.ch
- Positionierung: serioese europaeische Direct-to-Fan-Plattform
- Keine OnlyFans-Kopie
- Keine Erotikpositionierung
- Startsprachen: Deutsch, Englisch, Rumaenisch, Spanisch
- GitHub Repository: Bernds-tech/FanMind

## Tag 1: Fundament und Landingpage

Status: weitgehend erledigt.

Aufgaben:

- Repository anlegen
- Next.js Basis erstellen
- Landingpage erstellen
- zentrale Navigation erstellen
- Demo-Version sichtbar machen
- Domain- und Markenlogik dokumentieren

Ergebnis:

- / funktioniert
- /de, /en, /ro, /es funktionieren
- FanMind MVP Demo 0.2 sichtbar

## Tag 2: Mehrsprachigkeit und Grundseiten

Status: weitgehend erledigt.

Aufgaben:

- Locale-Struktur erstellen
- Sprachumschalter einbauen
- zentrale i18n-Dateien anlegen
- Demo-, Login-, Register-, Pricing-, Dashboard-, Admin-Seiten in Sprachpfade bringen

Ergebnis:

- /de
- /en
- /ro
- /es
- /de/demo, /en/demo, /ro/demo, /es/demo
- /de/pricing, /en/pricing, /ro/pricing, /es/pricing

## Tag 3: Pakete und Preislogik

Status: begonnen.

Aufgaben:

- Anbieter-Pakete definieren
- Fan-Mitgliedschaften definieren
- Pricing-Seite mit echter Paketlogik verbinden
- Paketlogik in mehreren Sprachen vorbereiten

Pakete:

- Starter
- Pro
- Business / Verein

Fan-Mitgliedschaften:

- Kostenloser Fan
- Club-Mitglied
- Premium-Fan

Naechster Schritt:

- Pricing-Seite optisch und inhaltlich fuer Pilotkunden verbessern

## Tag 4: Creator-Profil professionalisieren

Aufgaben:

- Creator-Profil strukturieren
- Fanclub-Karte verbessern
- freie, Mitglieder- und Premium-Inhalte klar anzeigen
- Mitglied werden / Registrierung logisch verlinken
- Beispielprofil Mia Active Club verbessern

Ergebnisziel:

Eine Person soll sofort verstehen, wie ein Fanclub auf FanMind spaeter aussieht.

## Tag 5: Dashboard professionalisieren

Aufgaben:

- Dashboard-Kacheln verbessern
- Einnahmen, Fans, Mitglieder, Nachrichten und Inhalte klar anzeigen
- naechste Schritte fuer Anbieter zeigen
- Demo-Zahlen sauber beschriften

Ergebnisziel:

Ein Anbieter soll erkennen, welche Steuerzentrale FanMind ihm bietet.

## Tag 6: Registrierungs- und Onboarding-Flow

Aufgaben:

- Register-Seite verbessern
- Rollenwahl Anbieter / Fan anzeigen
- Creator-Onboarding als gefuehrten Prozess darstellen
- Schritte klarer machen:
  - Profil anlegen
  - Fanclub beschreiben
  - Mitgliedschaft definieren
  - erste Inhalte vorbereiten
  - Link teilen

Ergebnisziel:

Der Ablauf vom neuen Anbieter bis zum fertigen Fanclub soll sichtbar werden.

## Tag 7: Pilotkunden- und Verkaufsmodus

Aufgaben:

- Pilotkunden-CTA verbessern
- einfache Pilotkunden-Landingpage oder Demo-Hub erstellen
- Fragen fuer Pilotkundenfeedback dokumentieren
- Gerhard-Verkaufstext vorbereiten
- WhatsApp-/E-Mail-Kurztext vorbereiten

Ergebnisziel:

Gerhard kann erste Interessenten strukturiert ansprechen.

## Tag 8: Qualitaet und Tests

Aufgaben:

- npm run build ausfuehren
- Seiten manuell pruefen
- kaputte Links suchen
- Navigation pruefen
- Sprachseiten pruefen
- Dokumentation aktualisieren

Pflichtseiten:

- /
- /de
- /en
- /ro
- /es
- /pricing
- /demo
- /creator/demo
- /dashboard
- /register
- /login
- /admin

## Tag 9: Deployment-Vorbereitung

Aufgaben:

- Zielhosting entscheiden
- FanMind.ch DNS-Plan vorbereiten
- app.fanmind.ch Struktur pruefen
- Build- und Startbefehle dokumentieren
- Environment-Dateien vorbereiten

Noch keine echte Zahlungslogik notwendig.

## Tag 10: Demo-Abnahme und Pilotstart

Aufgaben:

- finalen Demo-Stand pruefen
- Liste erster Pilotkunden erstellen
- Ansprache vorbereiten
- Feedbackformular oder Feedbackfragen erstellen
- Entscheidung treffen: weiter Demo oder echte Registrierung bauen

## Arbeitsregel

Kleine und mittlere Aenderungen:

- direkt im Repository umsetzen

Grosse UI- oder Refactor-Aenderungen:

- Codex-Task / Pull Request verwenden

Nach jedem groesseren Merge:

- git pull
- rm -rf .next falls Fehler auftreten
- npm run dev
- npm run build zur Kontrolle
