# FanMind Datenbank-Setup Plan

## Ziel

FanMind soll nicht nur als Demo laufen, sondern als echtes Produkt mit echter Datenstruktur.

Die Demo nutzt aktuell Seed-Daten im Code. Diese Daten sollen schrittweise in eine echte Datenbank überfuehrt werden.

## Wichtig

Es wird keine separate Demo-Datenbanklogik gebaut.

Demo-Account, Demo-Agentur und Demo-Follower sind echte Testdaten im echten Datenmodell.

## Empfohlene Datenbank für den aktuellen MVP

Primaere Empfehlung:

- PostgreSQL / Supabase

Warum:

- Relationen zwischen Agentur, Nutzer, betreuten Profilen, Fans, Nachrichten, Memories, Follow-ups und KI-Ausgaben sind klar abbildbar.
- Spaeter einfach für Suche, Filter, Priorität und Auswertungen.
- Gute Basis für echte Produktlogik.

Alternative:

- Firebase / Firestore

Nur sinnvoll, wenn bereits ein bestehendes Firebase-Projekt genutzt werden soll und schnelle Echtzeit-Synchronisierung wichtiger ist als relationale Auswertung.

## Tabellen für MVP

### agencies

Agenturkonto / Mandant.

Felder:

- id
- name
- language_default
- plan
- created_at

### users

Nutzer / Login.

Felder:

- id
- agency_id
- email
- name
- role
- created_at

### creators

Betreutes Profil.

Felder:

- id
- agency_id
- display_name
- platform
- language
- tone
- persona_notes
- boundaries
- created_at

### fans

Fan / Kontakt.

Felder:

- id
- agency_id
- creator_id
- handle
- display_name
- status
- language
- summary
- tags
- value_level
- created_at

### messages

Manuell eingefuegte Nachrichten.

Felder:

- id
- agency_id
- creator_id
- fan_id
- direction
- content
- source
- created_by
- created_at

### memories

Wichtige Erinnerungen pro Fan.

Felder:

- id
- agency_id
- creator_id
- fan_id
- memory_type
- content
- importance
- created_by
- created_at

### followups

Nachfass-Aufgaben.

Felder:

- id
- agency_id
- creator_id
- fan_id
- due_date
- due_label
- reason
- priority
- status
- created_by
- created_at

### ai_generations

KI-Ausgaben und Kostenkontrolle.

Felder:

- id
- agency_id
- creator_id
- fan_id
- prompt_type
- input_snapshot
- output_text
- model
- token_estimate
- created_at

### audit_logs

Nachvollziehbarkeit.

Felder:

- id
- agency_id
- user_id
- action
- entity_type
- entity_id
- created_at

## Demo-Seed-Daten

Die aktuellen Seed-Daten aus `src/data/demoAgency.ts` sollen in echte Seed-Scripts überfuehrt werden:

- 1 Demo-Agentur
- 1 Demo-Nutzer
- 3 betreute Profile
- 8 bis 12 Fans/Kontakte
- Nachrichten
- Memories
- Follow-ups
- Antwortvorschläge

## Environment Variables

Spaeter benötigt:

- DATABASE_URL
- OPENAI_API_KEY
- OPENAI_MODEL
- APP_URL
- AUTH_SECRET

## Nächste Schritte

1. SQL-Schema im Repository anlegen.
2. .env.example um DATABASE_URL erweitern.
3. Entscheidung treffen: Supabase/PostgreSQL oder Firebase/Firestore.
4. Datenbankprojekt anlegen.
5. Tabellen erstellen.
6. Seed-Daten einspielen.
7. App schrittweise von Code-Seed-Daten auf Datenbankabfragen umstellen.

## Entscheidungspunkt

Vor Umsetzung der echten Datenbank muss entschieden werden:

- Supabase/PostgreSQL nutzen
- bestehendes Firebase/Firestore nutzen

Empfehlung für FanMind MVP: Supabase/PostgreSQL.
