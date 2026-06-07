This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## FanMind MVP Auth-Basis (Supabase)

Dieser Stand verbindet die vorhandenen optischen Login- und Registrierungsseiten mit einer minimalen Supabase-Auth-Grundlage. Gebaut sind nur Auth, Session-Synchronisierung, ein geschützter Dashboard-Platzhalter, Demo-Onboarding und die vorbereitete Workspace-/Plan-Basis. Kontakte, Memory, Follow-ups, KI, CSV-Import, Kampagnen, Analytics, Integrationen, Payment und Admin-Funktionen sind bewusst nicht Teil dieses PRs.

### Aktueller Auth-/ENV-Stand

- Supabase ist als einzige Auth-Integration vorgesehen. Die MVP-Client-Dateien sprechen Supabase Auth/PostgREST ausschließlich mit `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` an; es wird keine Service-Role im Browser genutzt.
- Firebase spielt in diesem Repository aktuell keine Rolle; es gibt keine aktive Firebase-Konfiguration und keine Firebase-Abhängigkeit.
- Es gibt keine Middleware. Geschützte Einstiege prüfen die Session direkt serverseitig.
- Echte Secrets gehören nicht ins Repository. Die `.env.example` enthält nur leere Platzhalter.

### Lokal benötigte ENV-Werte

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Optional kann für spätere serverseitige Admin-/Migrationsaufgaben ein `SUPABASE_SERVICE_ROLE_KEY` dokumentiert werden. Dieser MVP verwendet ihn nicht. Er darf niemals mit `NEXT_PUBLIC_` veröffentlicht und niemals im Browser genutzt werden.

### Supabase-Flow

- `/register?plan=pilot|starter|growth|agency` übernimmt die `plan`-Query als `planId`; ohne Query wird `starter` genutzt.
- Die Registrierung ruft `supabase.auth.signUp` mit E-Mail, Passwort und Metadaten wie Name, Organisation und `plan_id` auf.
- Falls Supabase direkt eine Session zurückgibt, wird sie für Server-Routen gespiegelt und es werden `profiles`, `workspaces` und `workspace_members` per RLS-sicherem Anon-Zugriff vorbereitet.
- Falls E-Mail-Bestätigung aktiv ist und dadurch keine Session entsteht, zeigt die UI eine Bestätigungsmeldung und fordert zum E-Mail-Bestätigen und anschließenden Login auf.
- `/login` ruft `supabase.auth.signInWithPassword` auf und leitet nach erfolgreichem Login zum minimal geschützten `/dashboard` weiter.
- Demo bleibt ohne echte Auth erreichbar, z. B. über `/onboarding?plan=pilot&demo=1` oder über den Demo-Button im Login.

### Datenbank-Schema

Das vorgeschlagene MVP-Schema liegt unter `docs/database/fanmind_mvp_schema.sql`. Es enthält nur:

- `profiles`
- `workspaces`
- `workspace_members`
- minimale RLS-Policies für eigene Profile, eigene Workspaces und eigene Memberships

Später sollte die produktive `planId` nicht mehr aus der URL kommen, sondern über Session → Workspace-Membership → Workspace (`workspaces.plan_id`) gelesen werden. Die Query bleibt dann nur noch für Landingpage-/Demo-Einstiege relevant.
