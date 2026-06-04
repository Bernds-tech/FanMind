# FanMind Source of Truth Stand 0.2

## Quelle

Datei: FanMind_Source_of_Truth_Stand_0_2.pdf

## Status

FanMind ist aktuell auf Demo / MVP 0.2.

Das Repository ist bereits weiter als der urspruengliche PDF-Plan, aber fachlich nicht mehr voll deckungsgleich. Deshalb gilt dieses Dokument ab sofort als aktuelle Projektquelle.

## Marken- und Rollenentscheidung

- Marke / Arbeitsname: FanMind
- Hauptdomain: FanMind.ch
- Technischer Owner: Bernd
- Verkaufs-Owner: Gerhard
- Gerhard startet aktiv erst nach sichtbarer Demo

## Grundentscheidung

Nicht neu anfangen.

Nicht das alte PDF blind weiterverfolgen.

Das alte PDF bleibt als historische Scope-Grundlage und Scope-Bremse erhalten.

Dieses Source-of-Truth-Dokument Stand 0.2 ist die aktuelle Projektquelle.

## Zwei fachliche Linien

Aktuell gibt es zwei verwandte, aber nicht identische Linien:

1. Agentur-Chat-Copilot / FanMemory Copilot
2. Breitere Direct-to-Fan-Plattform

Fuer die naechsten Tage gilt:

Die Landingpage darf breiter bleiben, aber die Verkaufsdemo muss den Agentur-Use-Case zeigen.

## Prioritaet fuer die naechsten 7 Tage

### Prioritaet 1: Positionierung in der UI klarziehen

FanMind darf kurzfristig nicht als reiner Fanclub-Baukasten wirken.

Stattdessen:

- Agentur-Assistent
- Fan-Gedaechtnis
- Antwortvorschlaege
- Follow-ups
- Human-in-the-loop

Definition of Done:

Landingpage und Demo beschreiben in 20 Sekunden den Nutzen fuer Agenturen.

### Prioritaet 2: Demo-Flow bauen

Ziel-Flow:

Dashboard -> betreutes Profil -> Fan/Kontakt -> Memory -> Antwortvorschlag -> Follow-up

Definition of Done:

Gerhard kann diesen Ablauf in 5 Minuten zeigen.

### Prioritaet 3: Mockdaten erstellen

Mockdaten fuer:

- 1 Agentur
- 3 betreute Profile
- 8 bis 12 Fans/Kontakte
- 5 Follow-ups

Definition of Done:

Demo wirkt echt, aber nicht technisch ueberladen.

### Prioritaet 4: Pricing-Konsistenz

Alle Pricing-Seiten muessen konsistent auf diese Pakete ausgerichtet sein:

- FanMind Pilot
- FanMind Starter
- FanMind Growth
- FanMind Agency

Definition of Done:

Pakete entsprechen der Verkaufslogik.

### Prioritaet 5: Demo-Abnahme fuer Gerhard

Vor Sales-Start muss klar sein:

- was funktioniert
- was bewusst noch nicht funktioniert
- wie Gerhard die Demo in 3 bis 5 Minuten zeigt

## Was noch fehlt

### Echte Datenbank

Noch keine produktive PostgreSQL/Supabase/Prisma-Struktur bestaetigt.

MVP-Entscheidung:

Fuer Demo noch nicht zwingend; danach erstes Schema bauen.

### KI-Antwortgenerator

Noch keine echte OpenAI/API-Service-Logik bestaetigt.

MVP-Entscheidung:

Fuer Verkaufsdemo wichtig. Notfalls zuerst Mock, dann echte API.

### Fan-/Kontakt-Detailseite

Noch nicht als echter Workflow bestaetigt.

MVP-Entscheidung:

Muss in naechster Version sichtbar werden.

### Follow-up Queue

Konzept vorhanden, echte Seite/Funktion noch nicht bestaetigt.

MVP-Entscheidung:

Muss fuer Gerhards Demo sichtbar werden.

### Demo-Zugang

Login/Register vorhanden, echte Auth noch nicht notwendig.

MVP-Entscheidung:

Demo-Button oder einfacher Schutz reicht.

### Deployment

Hosting/DNS noch offen.

MVP-Entscheidung:

Demo-URL muss vor Gerhard-Calls stabil sein.

### Rechtstexte

Platzhalter reichen fuer Demo.

MVP-Entscheidung:

Nicht vertiefen, solange kein Verkauf/live Betrieb.

## Stop-Regeln ab jetzt

- Keine neue Plattformidee in den MVP aufnehmen
- Keine echte Zahlungslogik vor Pilotinteresse
- Keine OnlyFans-API
- Kein Scraping
- Kein automatisches Senden
- Keine Diskussion ueber weitere Sprachen, solange DE/EN nicht sauber genug sind
- RO/ES duerfen im Code bleiben, aber nicht die Demo verzerren
- Jede neue Idee kommt in docs/backlog.md oder Issues, nicht direkt in die Demo

## Konkrete naechste Aufgaben

### Aufgabe 1: Demo-Flow Agentur-Assistent

Eine zusammenhaengende Demo-Seite erstellen:

Agentur -> betreute Profile -> Fan/Kontakt -> Memory -> Antwortvorschlag -> Follow-up

### Aufgabe 2: Fan-/Kontakt-Mockdaten

Mockdaten zentral in src/data anlegen:

- Fans
- Memories
- Follow-ups
- Nachrichten

### Aufgabe 3: KI-Antwortvorschlag vorbereiten

Zuerst Mock-Reply-Service.

Spaeter OpenAI API anbinden.

Ausgabe:

- 2 bis 3 Vorschlaege
- Memory-Empfehlung
- Follow-up-Empfehlung

### Aufgabe 4: Pricing-Konsistenz

Alle Pricing-Seiten auf Pilot / Starter / Growth / Agency pruefen.

Alte Fanclub-Logik entfernen.

### Aufgabe 5: Demo-Abnahme fuer Gerhard

Kurze Seite oder README:

- Demo-Link
- Demo-Ablauf
- was geht
- was geht bewusst nicht

## Finales Urteil

Weiterbauen, aber nicht aufblasen.

Das neue PDF ist die aktuelle Projektquelle.

Das alte PDF bleibt als historische Scope-Grundlage erhalten.
