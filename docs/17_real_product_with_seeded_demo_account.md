# FanMind: Echtes Produkt mit Demo-Account

## Grundsatz

Es wird keine separate Demo-Version gebaut.

FanMind wird als echtes Produkt aufgebaut. Die Demo für Gerhard nutzt echte Testdaten innerhalb derselben Produktlogik.

## Was Demo bedeutet

Demo bedeutet nicht:

- eigene Demo-App
- Fake-Produkt
- getrennte Demo-Version
- Klickdummy ohne echte Logik

Demo bedeutet:

- echter Login mit Demo-Account
- echte Datenstruktur
- echte Demo-Agentur
- echte Demo-Nutzer
- echte betreute Profile
- echte Fans/Kontakte als Testdaten
- echte Memories als Testdaten
- echte Follow-ups als Testdaten
- echter Workflow, nur mit Testdaten

## Ziel für Gerhard

Gerhard kann sich mit einem Demo-Account einloggen und Influencern, Creator-Agenturen oder potenziellen Kunden zeigen:

- wie FanMind wirklich funktioniert
- wie eine Agentur betreute Profile verwaltet
- wie Fan-Gedächtnis aussieht
- wie Antwortvorschläge vorbereitet werden
- wie Follow-ups gesetzt und verwaltet werden
- dass nichts automatisch gesendet wird
- dass der Mensch final prüft und sendet

## Konsequenz für die Umsetzung

Wir bauen keine zweite Demo-Schicht.

Stattdessen bauen wir:

1. echte Produktseiten
2. echte Datenmodelle oder zunaechst zentrale Seed-Daten
3. echte Demo-Accounts
4. echte Testdaten für Verkauf und Vorfuehrung
5. später echte Persistenz in Datenbank

## Kurzfristige MVP-Entscheidung

Solange noch keine produktive Datenbank angebunden ist, duerfen Seed-Daten im Code liegen.

Diese Seed-Daten müssen aber so strukturiert sein, dass sie später direkt in eine echte Datenbank überfuehrt werden können.

## Demo-Account

Geplanter Demo-Zugang:

- E-Mail: demo@fanmind.ch
- Rolle: Agentur-Admin
- Agentur: FanMind Demo Agency
- Zugriff auf: 3 betreute Profile, mehrere Fans/Kontakte, Memories, Nachrichten und Follow-ups

## Demo-Daten für den ersten Workflow

Mindestens:

- 1 Demo-Agentur
- 1 Demo-Nutzer für Gerhard
- 3 betreute Profile
- 8 bis 12 Fans/Kontakte
- 5 Follow-ups
- mehrere Memories
- mehrere Beispiel-Nachrichten
- 2 bis 3 Antwortvorschläge je Demo-Fall

## Wichtige Regel

Alles, was Gerhard in der Demo zeigt, soll später als echte Funktion im Produkt vorhanden sein.

Wenn etwas nur simuliert ist, muss es intern klar als Simulation markiert sein.

## Nächster technischer Schritt

Zentrale Seed-Daten anlegen:

- src/data/demoAgency.ts

Diese Datei soll enthalten:

- users
- agencies
- creators / managedProfiles
- fans
- messages
- memories
- followups
- aiReplySuggestions

Spaeter wird diese Datei durch echte Datenbank-Seed-Scripts ersetzt.
