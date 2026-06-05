# Supabase Environment Setup

## Ziel

FanMind soll lokal und spaeter im Deployment aus Supabase lesen koennen.

Die Tabellen und Seed-Daten sind bereits in Supabase angelegt.

## Benötigte Variablen

In `.env.local` werden ergaenzt:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=SERVICE_ROLE_KEY_HERE
DATABASE_URL=POSTGRES_CONNECTION_STRING_HERE
```

## Wo findet man die Werte?

### NEXT_PUBLIC_SUPABASE_URL

Supabase Dashboard -> oben `Connect` -> Project URL

### SUPABASE_SERVICE_ROLE_KEY

Supabase Dashboard -> Project Settings -> API -> service_role key

Wichtig:

- service_role key niemals im Browser verwenden
- niemals in GitHub committen
- nur serverseitig nutzen

### DATABASE_URL

Supabase Dashboard -> oben `Connect` -> Direct connection string oder URI

## Lokaler Ablauf

1. `.env.local` öffnen oder neu schreiben.
2. OpenAI-Variablen behalten.
3. Supabase-Variablen ergaenzen.
4. Next.js Server neu starten.

Beispiel:

```env
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=postgresql://...
```

## Test

Nach dem Neustart:

- `/fans` öffnen

Erwartung:

- Badge zeigt `Quelle: Supabase-Datenbank`

Falls nicht:

- Badge zeigt `Quelle: Seed-Daten Fallback`
- dann fehlen Supabase-Variablen oder die Verbindung ist fehlerhaft

## Sicherheitsregel

`.env.local` darf niemals in GitHub committed werden.
