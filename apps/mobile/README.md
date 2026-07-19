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
- geschützte App-Navigation;
- Dashboard mit Kontakt- und Follow-up-Kennzahlen;
- Kontaktliste und Suche;
- Kontaktdetail mit Profil und Kontaktwissen;
- KI-Antwortvorschläge über Bearer-authentifizierte FanMind-API;
- Kontaktwissen aus KI-Vorschlag speichern;
- Follow-up aus KI-Vorschlag speichern;
- offene Follow-ups anzeigen und abschließen;
- sichere lokale Abmeldung.

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

## Lokale Einrichtung

```bash
cd apps/mobile
cp .env.example .env.local
npm install
npm run check
npm start
```

Für einen realen Development Build:

```bash
npx eas-cli build --profile development --platform android
npx eas-cli build --profile development --platform ios
```

Vor einem EAS-Build müssen EAS-Projekt-ID, Signierung und Store-Konten bewusst eingerichtet werden. Diese Werte werden nicht erfunden oder aus der Web-Anwendung übernommen.

## App-Identität

```text
Name: FanMind
Deep-Link-Schema: fanmind://
iOS Bundle Identifier: ch.fanmind.app
Android Package: ch.fanmind.app
```

## Release-Unabhängigkeit

- Website-Deployments veröffentlichen keine Mobile-App.
- Mobile-App-Builds deployen keine Website.
- Mobile-Änderungen werden unter `apps/mobile/**` geprüft.
- Backend-Vertragsänderungen müssen Web und Mobile separat abnehmen.
- Neue Website-Komponenten werden nicht automatisch in Mobile übernommen.

## Nächste Mobile-Schritte

1. EAS-Projekt und interne Development Builds einrichten.
2. App-Icon und Splashscreen aus dem final bestätigten FanMind-Branding erzeugen.
3. Passwort-Reset/Deep-Link-Flow ergänzen.
4. Kontakt anlegen und bearbeiten.
5. Offline-Lese-Cache mit klarer Datenlöschung ergänzen.
6. Push-Grundlage für Follow-ups vorbereiten.
7. Android-internen Test und iOS-TestFlight durchführen.
