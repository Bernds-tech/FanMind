# FanMind Mobile Architecture

## Decision

FanMind Mobile is a native React Native / Expo product, not a mobile rendering of the public website.

```text
Repository
├── src/                  Next.js Web application and server API
├── apps/mobile/          Independent Android/iOS application
└── supabase/             Shared, RLS-protected data model
```

## Independence contract

Mobile owns its own:

- package and lockfile;
- Expo SDK and React Native version;
- navigation and route structure;
- design tokens and UI primitives;
- Android package and iOS bundle identifier;
- EAS build profiles;
- CI pipeline and Android bundle artifact;
- native session persistence;
- release cadence and store distribution.

Web owns its own:

- Next.js routes;
- public landingpage;
- CSS modules;
- desktop and responsive workspace shell;
- nginx/PM2 production deployment;
- web cookie session.

Neither surface may import UI code from the other. Backend contracts are shared deliberately and tested separately.

## Authentication

1. Mobile signs in directly against Supabase Auth using the public anon key.
2. The session is stored with a chunked `expo-secure-store` adapter.
3. Contact, memory and follow-up access uses the user JWT and Supabase RLS.
4. The AI endpoint receives the same user JWT in a strict `Authorization: Bearer` header.
5. The server validates the JWT with Supabase, resolves the authorized workspace and confirms contact ownership.
6. Existing Web requests continue to use the secure FanMind cookies when no Bearer header is present.

A malformed Authorization header fails with 401 and never falls back to a Web cookie.

## Secret boundary

Allowed in the compiled app:

- Supabase project URL;
- public Supabase anon/publishable key;
- FanMind API base URL.

Never allowed in the compiled app:

- Supabase service-role key;
- OpenAI key;
- Stripe secret or webhook secret;
- Meta or Telegram tokens;
- backup identities;
- Production database credentials.

## Data access

Mobile uses direct Supabase queries only for tables already protected by RLS:

- `workspaces` / `workspace_members`;
- `contacts`;
- `memories`;
- `followups`.

All queries include the current `workspace_id` even though RLS remains the final authorization layer.

Server-only functions remain server-only:

- AI provider calls;
- admin operations;
- billing and referral reconciliation;
- backup and monitoring;
- webhook ingestion;
- external channel credentials.

## Initial native route map

```text
/
├── (auth)/login
└── (app)
    ├── index                 Dashboard
    ├── contacts/index        Contact search/list
    ├── contacts/[id]         Contact knowledge and AI workflow
    ├── followups             Open tasks
    └── settings              Session and architecture boundary
```

## Product constraints

- FanMind is an assistant, not an autonomous bot.
- Reply options are prepared, never sent automatically.
- Saving contact knowledge or a follow-up requires a user action.
- Coming-Soon integrations are not shown as active.
- Mobile does not execute billing, referral or social-channel write automation.

## Release boundary

A Web merge can modify shared API contracts but cannot publish a mobile binary. A Mobile merge can modify native code but cannot deploy the website. Contract changes require:

1. normal FanMind CI;
2. separate Mobile CI;
3. mobile TypeScript check;
4. Expo Doctor;
5. Android JavaScript bundle export;
6. explicit internal-device test before EAS distribution.

## Next implementation phases

### Phase B

- create/edit contacts;
- password reset and deep-link callback;
- offline read cache with explicit logout purge;
- push registration and follow-up reminders;
- EAS project, credentials and internal builds;
- final app icon and splash assets.

### Phase C

- approved channel integrations;
- richer native message timeline;
- biometric session unlock;
- store release automation after legal and account setup.
