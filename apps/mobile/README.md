# FanMind Mobile

Eigenständige FanMind-App für Android und iOS auf Basis von React Native und Expo.

## Architekturgrenze

Diese App ist **keine umverpackte Website**:

- kein WebView als Haupt-App;
- kein Import aus `src/app`, `src/components` oder Website-CSS;
- eigene Expo-Router-Navigation;
- eigene mobile UI-Komponenten und Design-Tokens;
- eigene Paketverwaltung, eigene Releases und eigene Mobile-CI;
- eigene Android-/iOS-App-IDs und Releaseprofile.

Gemeinsam mit der Web-Anwendung bleiben ausschließlich:

- das Supabase-Projekt und dessen RLS-Regeln;
- freigegebene Tabellen und Geschäftslogik;
- die serverseitige FanMind-KI-API;
- die Produktwahrheit: Mensch prüft und sendet final selbst.

## Aktueller App-Kern

- native E-Mail-/Passwort-Anmeldung;
- verschlüsselte, in Chunks gespeicherte Supabase-Sitzung über `expo-secure-store`;
- PKCE-basierte Passwort-Recovery über `fanmind://reset-password`;
- geschützte App-Navigation;
- Dashboard mit Kontakt- und Follow-up-Kennzahlen;
- Kontaktliste und Suche;
- Kontakt in Mobile anlegen und bearbeiten;
- Kontaktdetail mit Profil und Kontaktwissen;
- KI-Antwortvorschläge über Bearer-authentifizierte FanMind-API;
- Kontaktwissen aus KI-Vorschlag speichern;
- Follow-up aus KI-Vorschlag speichern;
- offene Follow-ups anzeigen und abschließen;
- sichere lokale Abmeldung mit Purge registrierter FanMind-SecureStore-Schlüssel und Workspace-Zustand.

## Sicherheitsgrenzen

Die App darf nur öffentliche Client-Konfiguration enthalten:

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_FANMIND_API_URL
```

Verboten in App, EAS-Update und Repository:

- `SUPABASE_SERVICE_ROLE_KEY`;
- `OPENAI_API_KEY`;
- Stripe Secret Keys;
- Webhook-Secrets;
- Production-Backup-Schlüssel;
- externe Social-Login-Daten.

Die Datenzugriffe laufen direkt über Supabase und müssen durch RLS auf den angemeldeten Nutzer beziehungsweise dessen Workspace begrenzt sein. KI-Aufrufe gehen ausschließlich an den FanMind-Server; der OpenAI-Key bleibt serverseitig.

Recovery-Codes, Zugriffstokens, Refresh-Tokens und vollständige Callback-URLs dürfen weder protokolliert noch in Tickets oder Screenshots übernommen werden.

## Lokale Einrichtung

```bash
cd apps/mobile
cp .env.example .env.local
npm install
npm run check
npm start
```

Für einen internen Build nach der externen EAS-Einrichtung:

```bash
npx eas-cli@latest build --profile preview --platform android
npx eas-cli@latest build --profile preview --platform ios
```

Vor einem EAS-Build müssen EAS-Projekt-ID, Signierung und Store-Konten bewusst eingerichtet werden. Diese Werte werden nicht erfunden oder aus der Web-Anwendung übernommen.

## App-Identität

```text
Name: FanMind
Deep-Link-Schema: fanmind://
Recovery-Route: fanmind://reset-password
iOS Bundle Identifier: ch.fanmind.app
Android Package: ch.fanmind.app
```

Der Recovery-Redirect muss zusätzlich einmalig in der Supabase-Auth-Allowlist des richtigen Projekts freigegeben werden. Details und Negativtests stehen in `docs/mobile/BETA_RELEASE.md`.

## Release-Unabhängigkeit

- Website-Deployments veröffentlichen keine Mobile-App.
- Mobile-App-Builds deployen keine Website.
- Mobile-Änderungen werden unter `apps/mobile/**` geprüft.
- Backend-Vertragsänderungen müssen Web und Mobile separat abnehmen.
- Neue Website-Komponenten werden nicht automatisch in Mobile übernommen.

## Nächste Mobile-Schritte

1. Supabase-Redirect `fanmind://reset-password` extern freigeben und Recovery auf einem realen Gerät testen.
2. EAS-Projekt, Signing Credentials und interne Preview-Builds einrichten.
3. App-Icon und Splashscreen aus dem final bestätigten FanMind-Branding erzeugen.
4. Offline-Lese-Cache mit klarer Datenlöschung ergänzen.
5. Push-Grundlage für Follow-ups vorbereiten.
6. Account-/Datenlöschprozess für Store-Anforderungen ergänzen.
7. Android Internal Testing und iOS TestFlight durchführen.

Die Produkt- und Release-Checkliste für diese Schritte steht in `docs/mobile/BETA_RELEASE.md`.
