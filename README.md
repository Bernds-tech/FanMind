# FanMind

FanMind ist eine europäische Direct-to-Fan-Plattform für Creator, Sportler, Musiker, Coaches, Vereine und Persönlichkeiten.

Ziel: Creator sollen eigene digitale Fanclubs aufbauen, exklusive Inhalte teilen, Mitgliedschaften verkaufen und unabhängiger von klassischen Social-Media-Algorithmen werden.

## Markenlogik

Unternehmen / Marke: **FanMind**

Webseitenname / Hauptdomain: **FanMind.ch**

FanMind ist der Name des Unternehmens beziehungsweise der Plattformmarke. FanMind.ch ist der öffentliche Webseitenname und die Hauptdomain.

## Positionierung

FanMind ist keine reine OnlyFans-Kopie und startet bewusst nicht als Erotikplattform.

FanMind positioniert sich als seriöse, internationale Fan-Community- und Monetarisierungsplattform mit europäischem Ursprung.

## Domain-Entscheidung

Hauptdomain: **FanMind.ch**

FanMind.ch wird als primäre öffentliche Domain für die Plattform verwendet. Die Domain passt zur internationalen und hochwertigen Positionierung, bleibt aber klar europäisch.

## Startziel

Erste sichtbare Demo in 7 bis 10 Tagen mit:

- Startseite Deutsch und Englisch
- Creator- und Fan-Erklärung
- Beispielprofile
- Dashboard-Grundstruktur
- Mitgliedschaftslogik als Mockup
- Admin-Grundstruktur
- späterer Zahlungsintegration

## Repository

Owner: Bernds-tech  
Projekt: FanMind  
Marke / Unternehmen: FanMind  
Webseite / Hauptdomain: FanMind.ch

## Technischer Ansatz

- Next.js
- TypeScript
- React
- PostgreSQL später
- Authentifizierung später
- Zahlungsanbieter später
- S3/R2-kompatibler Speicher später

## Arbeitsprinzip

Zuerst Demo bauen, dann Pilotkunden ansprechen.

## KI-Copilot API

Der Demo-Workflow unter `/copilot` nutzt den serverseitigen Endpunkt `POST /api/copilot/reply`, um aus Fan-Kontext, betreutem Profil, Memories, Nachrichten und Follow-ups strukturierte Antwortvorschlaege zu erzeugen.

Der OpenAI API-Key wird nur serverseitig aus `process.env.OPENAI_API_KEY` gelesen und darf nicht im Browser verwendet werden. Lege lokal eine nicht versionierte `.env.local` an:

```bash
OPENAI_API_KEY=your_openai_api_key_here
# optional
OPENAI_MODEL=gpt-4.1-mini
```

Wenn `OPENAI_API_KEY` fehlt, die Fan-Nachricht leer/zu lang ist oder die OpenAI API einen Fehler liefert, gibt der Endpunkt eine saubere JSON-Fehlermeldung zurueck und die UI zeigt diese verstaendlich an. Der Request laeuft serverseitig gegen die OpenAI Responses API und nutzt standardmaessig `gpt-4.1-mini`; ueber `OPENAI_MODEL` kann ein anderes kompatibles Modell gesetzt werden. FanMind sendet keine Nachrichten automatisch; alle Vorschlaege muessen vom Menschen geprueft und manuell versendet werden.
