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

### Password recovery

- Supabase Auth uses the PKCE flow in Mobile.
- The only accepted recovery route is `fanmind://reset-password`.
- The callback parser accepts either one PKCE code or one complete access-/refresh-token pair, never a mixture or partial pair.
- Foreign schemes, foreign routes, provider errors, excessive lengths and ambiguous credentials fail closed.
- Recovery codes, tokens and complete callback URLs are never logged.
- `updateUser({ password })` is reachable only while the AuthProvider holds a confirmed recovery state and session.
- Supabase must externally allow the exact recovery redirect before a real e-mail/device test can pass.

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

Contact create and update additionally:

- validate and normalize every field before the request;
- insert `workspace_id` explicitly;
- update by both `workspace_id` and contact `id`;
- reject missing authorized update rows;
- perform a minimal handle-plus-source duplicate check in the current workspace;
- never use a service-role credential in Mobile.

Server-only functions remain server-only:

- AI provider calls;
- admin operations;
- billing and referral reconciliation;
- backup and monitoring;
- webhook ingestion;
- external channel credentials.

## Secure local state

The SecureStore adapter maintains a bounded registry of FanMind-owned storage keys. A safe local logout:

1. ends the local Supabase session;
2. removes every registered key and all chunks;
3. clears the registry;
4. resets the React session and recovery state;
5. immediately clears the WorkspaceProvider state.

There is currently no offline contact cache. A future cache must register with the same purge contract before it is allowed into a beta build.

## Native route map

```text
/
├── (auth)
│   ├── login
│   ├── forgot-password
│   └── reset-password       Deep link: fanmind://reset-password
└── (app)
    ├── index                 Dashboard
    ├── contacts
    │   ├── index             Contact search/list and create entry point
    │   ├── new               Create contact
    │   ├── [id]              Contact knowledge and AI workflow
    │   └── [id]/edit         Edit contact
    ├── followups             Open tasks
    └── settings              Session, purge and architecture boundary
```

## Product constraints

- FanMind is an assistant, not an autonomous bot.
- Reply options are prepared, never sent automatically.
- Saving contact knowledge or a follow-up requires a user action.
- Coming-Soon integrations are not shown as active.
- Mobile does not execute billing, referral or social-channel write automation.
- A source/platform field on a contact is metadata, not an active external integration.

## Release boundary

A Web merge can modify shared API contracts but cannot publish a mobile binary. A Mobile merge can modify native code but cannot deploy the website. Contract changes require:

1. normal FanMind CI;
2. separate Mobile CI;
3. mobile TypeScript check;
4. Expo Doctor;
5. Android JavaScript bundle export;
6. explicit internal-device test before EAS distribution.

## Implementation phases

### Phase B — repository implementation

- [x] create/edit contacts;
- [x] password reset and deep-link callback;
- [x] strict local SecureStore and workspace purge;
- [x] EAS profiles and beta handoff documented;
- [ ] offline read cache with the central purge contract;
- [ ] push registration and follow-up reminders;
- [ ] final app icon and splash assets.

### Phase B — external verification

- [ ] allow `fanmind://reset-password` in the correct Supabase Auth project;
- [ ] real password-recovery e-mail/device test;
- [ ] EAS project ID and credentials;
- [ ] signed Android preview build;
- [ ] signed iOS preview/TestFlight build;
- [ ] real Android and iOS device test records.

### Phase C

- approved channel integrations;
- richer native message timeline;
- biometric session unlock;
- account-/data-deletion flow required for store readiness;
- store release automation after legal and account setup.

The detailed external handoff and test sequence is maintained in `docs/mobile/BETA_RELEASE.md`.
