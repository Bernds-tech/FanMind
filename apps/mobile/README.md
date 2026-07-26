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
- serverseitig angewendeter Workspace-Unternehmens-Prompt und Standard-Antwortprofil; die Mobile-App überträgt keinen freien Prompttext;
- Kontaktwissen aus KI-Vorschlag speichern;
- Follow-up aus KI-Vorschlag speichern;
- offene Follow-ups anzeigen und abschließen;
- verschlüsselte, maximal 24 Stunden alte Offline-Kontaktübersicht mit höchstens 50 Einträgen im Nur-Lesen-Modus;
- native Push-Konfigurationsgrundlage mit streng validierter Navigation zu Follow-ups, noch ohne Berechtigungsabfrage, Token-Registrierung oder Versand;
- nativer Splashscreen mit der bestätigten FanMind-Wortmarke für das dunkle App-Theme;
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

Die Offline-Übersicht wird ausschließlich nach einem erfolgreichen, ungefilterten Online-Abruf erneuert. Sie enthält nur User-/Workspace-Bindung, Workspace-Name sowie Kontakt-ID, Name, Handle, Plattform, Status und Änderungszeit. Kontaktwissen, Zusammenfassungen, Nachrichten, KI-Inhalte, interne Notizen, Follow-ups und Zugangsdaten sind ausgeschlossen. Ein Fallback ist nur bei einem echten Transportausfall erlaubt; Auth-, RLS- und Serverfehler dürfen nie mit Cache-Daten verdeckt werden.

## Lokale Einrichtung

```bash
cd apps/mobile
cp .env.example .env.local
npm ci
npm run check
npm run start:go
```

Für den aktuellen Expo-SDK-57-Stand muss auf Android die [offizielle Expo-Go-Version 57.0.2](https://github.com/expo/expo-go-releases/releases/tag/Expo-Go-57.0.2) installiert sein. Rechner und Telefon müssen im selben WLAN sein; anschließend wird der QR-Code aus dem Terminal mit Expo Go gescannt. Falls das lokale Netzwerk die Verbindung blockiert, kann nach Installation von `@expo/ngrok` mit `npx expo start --go --tunnel` gestartet werden. Ohne separates Staging darf dafür ausschließlich ein Testkonto verwendet werden.

Expo Go bleibt nur der begrenzte Vorabtest. Der normale Startbefehl zielt auf
den eigenen Development-Client:

```bash
npm run start
# identisch:
npm run start:dev-client
```

Der Development-Client enthält die echten nativen FanMind-Module und ist damit
die Grundlage für Push-, Deep-Link- und Store-nahe Tests. Nach Änderungen an
`app.json` oder nativen Abhängigkeiten wird die generierte Android- und
iOS-Konfiguration isoliert geprüft:

```bash
npm run native:prebuild:check
```

Mit lokal eingerichtetem Android Studio beziehungsweise Xcode kann anschließend
ohne Expo-Konto kompiliert werden:

```bash
npm run android
npm run ios
```

Der iOS-Befehl benötigt macOS und Xcode. Die generierten Verzeichnisse
`android/` und `ios/` werden bei diesem Continuous-Native-Generation-Ansatz
nicht committed.

Die getrennte Native-CI führt denselben CNG-Vertrag anschließend bis zur echten
Kompilierung weiter: ein Android-Debug-APK ohne Release-Credentials und eine
codesign-freie iOS-Simulator-App. Beide Artefakte sind ausdrücklich nur
Build-Nachweise, keine signierten Beta- oder Store-Pakete.

## EAS-Profile

Die Profile binden ihre öffentlichen Werte ausdrücklich an getrennte
EAS-Umgebungen:

| Profil | Umgebung | Zweck |
|---|---|---|
| `development` | `development` | signierbarer interner Development-Client |
| `native-validation` | `development` | Android-Debug-/iOS-Simulator-Prüfung ohne Release-/Store-Credentials |
| `preview` | `preview` | signierter interner Beta-Build |
| `production` | `production` | späterer Store-Build |

`withoutCredentials=true` bedeutet ausschließlich, dass das Validierungsprofil
keine verwalteten Release-/Store-Credentials anfordert. Das Android-Debug-APK
wird dennoch mit einem lokalen Debug-Key signiert; es ist kein Release-Artefakt.
Ein EAS-Cloud-Build braucht außerdem weiterhin ein Expo-Konto und eine echte,
per `eas init` erzeugte Projekt-ID. Das Repository enthält bewusst keine
EAS-Projekt-ID, Apple-Team-ID, Store-ID oder Schlüsseldatei.

Nach der externen EAS-Einrichtung:

```bash
npx eas-cli@latest build --profile native-validation --platform android
npx eas-cli@latest build --profile native-validation --platform ios
npx eas-cli@latest build --profile preview --platform android
npx eas-cli@latest build --profile preview --platform ios
```

Vor einem signierten EAS-Build müssen EAS-Projekt-ID, Signierung und Store-Konten bewusst eingerichtet werden. Diese Werte werden nicht erfunden oder aus der Web-Anwendung übernommen.

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
2. EAS-Projekt, öffentliche Development-/Preview-/Production-Umgebungen, Signing Credentials und interne Preview-Builds einrichten.
3. Hochauflösendes rundes App-Icon aus dem final bestätigten FanMind-Branding bereitstellen; die Wortmarke ist bereits als nativer Splashscreen eingebunden.
4. Push-Berechtigung, Token-Registrierung und serverseitige Zustellung in einem signierten Development-/Preview-Build umsetzen und testen.
5. Android Internal Testing und iOS TestFlight durchführen.
6. Die vorbereiteten Store-Texte, Datenschutzangaben und Screenshot-Matrix nach realen Gerätetests final abnehmen.

Die Produkt- und Release-Checkliste für diese Schritte steht in `docs/mobile/BETA_RELEASE.md`; die vorbereiteten Store-Metadaten stehen in `docs/mobile/STORE_LISTING.md`.
