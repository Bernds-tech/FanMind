# FanMind Demo-Abnahme für Gerhard

## Ziel

Gerhard soll FanMind in einem Gespräch in 3 bis 5 Minuten vorzeigen können.

Die Demo zeigt nicht ein separates Fake-System, sondern das echte Produkt mit Demo-Account und Testdaten.

## Demo-Kernsatz

FanMind ist ein KI-Copilot für Creator-Agenturen und Chatter-Teams.

FanMind hilft, Fan-Kontext zu behalten, bessere Antwortvorschläge zu erzeugen und Follow-ups nicht zu vergessen.

Kein Bot. Kein automatisches Senden. Der Mensch bleibt Entscheider.

## Demo-URL lokal im Codespace

Aktuell im Codespace:

- http://localhost:3000
- Codespace Preview URL mit Port 3000

Wichtige Routen:

- /
- /dashboard
- /creator/demo
- /fans
- /fans/fan_lukas_01
- /copilot
- /followups
- /pricing

## Demo-Account

Geplanter Demo-Account:

- E-Mail: demo@fanmind.ch
- Rolle: Agentur-Admin
- Agentur: FanMind Demo Agency

Hinweis:

Der Login ist aktuell noch nicht produktiv abgesichert. Für den Demo-Stand reicht der sichtbare Demo-Flow.

## 3-Minuten-Demo-Ablauf

### 1. Landingpage zeigen

Route:

- /

Satz für Gerhard:

"FanMind ist ein KI-Copilot für Creator-Agenturen. Es geht nicht um automatisches Senden, sondern darum, Fan-Kontext, Antwortvorschläge und Follow-ups sauber zu verwalten."

### 2. Dashboard zeigen

Route:

- /dashboard

Zeigen:

- Demo-Agentur
- betreute Profile
- Fans/Kontakte
- offene Follow-ups
- warme Kontakte
- Memories

Satz für Gerhard:

"Hier sieht die Agentur sofort, welche Profile betreut werden, welche Kontakte warm sind und welche Follow-ups offen sind."

### 3. Fan-/Kontaktliste zeigen

Route:

- /fans

Zeigen:

- mehrere Fans/Kontakte
- Status
- Tags
- Memory-Anzahl
- offene Follow-ups

Satz für Gerhard:

"Jeder Fan/Kontakt hat Kontext. Das Team muss nicht jedes Gespräch neu verstehen."

### 4. Fan-Detail zeigen

Route:

- /fans/fan_lukas_01

Zeigen:

- Summary
- Status
- Tags
- Nachrichten
- Memories
- Antwortvorschläge
- Follow-ups

Satz für Gerhard:

"Hier sieht man, was FanMind über den Kontakt weiß und warum der nächste Schritt sinnvoll ist."

### 5. Copilot zeigen

Route:

- /copilot

Zeigen:

- neue Nachricht eingeben
- Antwortvorschläge erzeugen
- Memory-Vorschlag
- Follow-up-Vorschlag

Satz für Gerhard:

"FanMind erstellt Vorschläge. Die finale Nachricht wird immer vom Menschen geprüft und manuell gesendet."

### 6. Nachfass-Warteschlange zeigen

Route:

- /followups

Zeigen:

- Heute
- Überfällig
- Diese Woche
- Priorität
- Kontaktlink

Satz für Gerhard:

"So verliert das Team keine warmen Kontakte und keine Umsatzchancen."

## 5-Minuten-Demo-Ablauf

1. Landingpage öffnen
2. Kurz Positionierung erklären
3. Dashboard öffnen
4. Betreute Profile zeigen
5. Kontaktliste öffnen
6. Lukas als Beispielkontakt öffnen
7. Nachrichten und Memories erklären
8. Copilot öffnen
9. Fan-Nachricht einfügen
10. Antwortvorschläge erzeugen
11. Memory- und Follow-up-Vorschlag erklären
12. Nachfass-Warteschlange öffnen
13. Abschlussfrage stellen:

"Waere so ein Workflow für eure Agentur hilfreich, wenn mehrere Personen viele Fan-Gespräche betreuen?"

## Was aktuell funktioniert

- Landingpage
- Sprachstruktur
- Pricing-Seite
- Dashboard mit Seed-Daten
- Demo-Agentur
- betreute Profile
- Fan-/Kontaktliste
- dynamische Fan-Detailseiten
- Fan-Memory sichtbar
- Follow-ups sichtbar
- Nachfass-Warteschlange
- Copilot-Seite
- API-Endpunkt für KI-Antwortvorschläge
- .env.local wird lokal erkannt
- Build läuft erfolgreich

## Was bewusst noch nicht fertig ist

- echte produktive Datenbank
- echte Authentifizierung
- echte Nutzer-/Rollenverwaltung
- echtes Speichern neuer Memories
- echtes Speichern neuer Follow-ups
- echte Persistenz für neue Chat-Eingaben
- Deployment auf FanMind.ch
- produktive Datenschutz-/Impressumsseiten
- Billing / Zahlungslogik
- externe Plattformintegrationen

## Was bewusst nicht gebaut wird

- kein automatisches Senden
- keine OnlyFans-API
- kein Scraping
- keine Browser-Automation
- keine Speicherung externer Logins
- keine Telegram-/Discord-/Instagram-Anbindung im MVP
- kein komplettes CRM
- keine mobile App im MVP

## Demo-Abnahme-Checkliste

Vor einem Gerhard-Termin prüfen:

- [ ] npm run build läuft erfolgreich
- [ ] npm run dev läuft auf richtigem Port
- [ ] / laedt
- [ ] /dashboard laedt
- [ ] /fans laedt
- [ ] /fans/fan_lukas_01 laedt
- [ ] /copilot laedt
- [ ] /followups laedt
- [ ] OPENAI_API_KEY ist in .env.local gesetzt
- [ ] Copilot erzeugt Antwortvorschläge
- [ ] Keine API-Keys im Repository
- [ ] Gerhard kennt den 3-Minuten-Ablauf
- [ ] Gerhard kennt die Grenzen: kein Bot, kein automatisches Senden

## Nächste Produkt-Aufgaben nach Demo-Abnahme

1. echte Datenbankstruktur planen
2. Authentifizierung einbauen
3. echte Memory-Speicherung
4. echte Follow-up-Speicherung
5. Chat-Copilot persistieren
6. Deployment vorbereiten
7. FanMind.ch anbinden
