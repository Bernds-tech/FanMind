# FanMind / CreatorChat Copilot MVP Checkliste aus PDF-Aufgabenplan

## Quelle

Bernd_Aufgabenplan_CreatorChat_Copilot_MVP_FanMind.pdf

## Fachlicher Fokus

Produkt für MVP:

- CreatorChat Copilot / FanMemory Copilot
- Marke: FanMind
- Website: FanMind.ch

## Leitsatz

Bernd baut nur das, was Gerhard nach 7 bis 10 Tagen in einem Verkaufsgespraech zeigen kann.

Keine Zusatzplattformen.
Keine Bot-Automation.
Kein Megaprojekt.

## MVP-Scope

### Muss-Funktionen Demo v1

- [x] Oeffentliche Landingpage
- [x] Sprachumschalter technisch vorbereitet
- [x] Produktpositionierung ohne OnlyFans-Bot-Formulierung begonnen
- [x] Demo-Login / Register-Seiten als Mockup vorhanden
- [x] Dashboard-Grundseite vorhanden
- [x] Creator-/Profil-Demo vorhanden
- [ ] Demo-Agentur sichtbar machen
- [ ] Demo-Creator sichtbar machen
- [ ] Demo-Fans sichtbar machen
- [ ] Creator-Profil mit Sprache, Tonalität, Persona-Regeln und Grenzen
- [ ] Fan-Profil mit Status, Notizen, Interessen, Kauf-/Interaktionshinweisen, Memory und Follow-up
- [ ] Chat-Eingabe für manuell eingefuegte Fan-Nachricht
- [ ] KI-Antwortgenerator mit 2 bis 3 Antwortvorschlägen
- [ ] Memory speichern
- [ ] Follow-up setzen
- [ ] Follow-up-Liste Heute / Diese Woche / Überfällig
- [ ] Saubere Demo-Daten für Gerhards Verkaufsgespraech

### Bewusste Nicht-Ziele v1

- [x] Keine direkte OnlyFans-API-Anbindung
- [x] Kein automatisches Senden von Nachrichten
- [x] Kein Scraping
- [x] Keine Browser-Automation
- [x] Keine Speicherung externer Plattform-Logins
- [x] Keine Telegram-, Discord-, Instagram- oder Fansly-Integration in v1
- [x] Kein komplexes Billing
- [x] Keine mobile App
- [x] Keine komplette CRM- oder ERP-Plattform

## Produktpositionierung

Deutsch:

Der KI-Copilot für Creator-Agenturen: Fan-Memory, Antwortvorschläge und Follow-ups an einem Ort.

Englisch:

The AI copilot for creator agencies: fan memory, reply suggestions and follow-ups in one place.

Positionierung:

Kein Bot. Kein automatisches Senden. Ein Menschliche Prüfung Copilot für Agenturen.

## 10-Tage-Plan nach PDF

### Tag 1: Projektbasis

Status: weitgehend erledigt

- [x] Repo angelegt und verbunden
- [x] Stack fixiert: Next.js / TypeScript
- [x] Layout erstellt
- [x] Routing erstellt
- [x] i18n-Struktur vorbereitet
- [ ] .env.example ergänzen

### Tag 2: Landingpage

Status: weitgehend erledigt

- [x] Hero vorhanden
- [x] CTA vorhanden
- [x] Mehrsprachige Landingpage vorhanden
- [ ] Problem Section nach PDF nachschaerfen
- [ ] Solution Section nach PDF nachschaerfen
- [ ] How-it-works Section nach PDF nachschaerfen
- [ ] Footer mit Kontakt, Impressum-Platzhalter, Datenschutz-Platzhalter

### Tag 3: Datenbank

Status: noch offen

- [ ] Schema für agencies
- [ ] Schema für users
- [ ] Schema für creators
- [ ] Schema für fans
- [ ] Schema für messages
- [ ] Schema für memories
- [ ] Schema für followups
- [ ] Schema für ai_generations
- [ ] Seed-Daten

### Tag 4: Dashboard + Creator

Status: in Arbeit

- [x] Dashboard-Grundseite vorhanden
- [x] Creator-/Profil-Demo vorhanden
- [x] Agentur-Demo-Daten vorbereitet
- [ ] Dashboard-Kacheln gemaess PDF verbessern
- [ ] Creator-Liste bauen
- [ ] Creator-Detail bauen
- [ ] Persona-Felder anzeigen
- [ ] Tonalität anzeigen
- [ ] Regeln und Grenzen anzeigen

### Tag 5: Fan-Profil

Status: offen

- [ ] Fan-Liste
- [ ] Fan-Detail
- [ ] Status
- [ ] Tags
- [ ] Summary
- [ ] Notizen
- [ ] Fan-Kontext sichtbar

### Tag 6: Memory

Status: offen

- [ ] Memory-Liste
- [ ] Memory anlegen
- [ ] Importance anzeigen
- [ ] Memory-Typen anzeigen
- [ ] Anzeige im Fan-Profil

### Tag 7: KI-Antworten

Status: offen

- [ ] Prompt-Service
- [ ] API-Anbindung oder Demo-Simulation
- [ ] 2 bis 3 Antwortvorschläge
- [ ] Speicherung in ai_generations vorbereiten
- [ ] Antwortvorschläge klar als Vorschläge markieren

### Tag 8: Follow-ups

Status: offen

- [ ] Follow-up setzen
- [ ] Warteschlange Heute
- [ ] Warteschlange Überfällig
- [ ] Warteschlange Diese Woche
- [ ] Status anzeigen

### Tag 9: Polishing

Status: offen

- [ ] Design verbessern
- [ ] Demo-Daten prüfen
- [ ] Fehler beseitigen
- [ ] Leere States
- [ ] Ladezustand

### Tag 10: Demo-Readiness

Status: offen

- [ ] Deployment / Demo-URL
- [ ] Testlauf
- [ ] README aktualisieren
- [ ] 3-Minuten-Demo-Ablauf für Gerhard
- [ ] 5-Minuten-Demo-Ablauf für Gerhard
- [ ] Liste fertiger Funktionen
- [ ] Liste bewusster Nicht-Funktionen

## Nächster Arbeitsschritt

Tag 4 fortsetzen:

Dashboard + Creator gemaess PDF:

- Dashboard-Kacheln verbessern
- Creator-Liste bauen
- Creator-Detail mit Sprache, Tonalität, Persona-Regeln und Grenzen bauen
