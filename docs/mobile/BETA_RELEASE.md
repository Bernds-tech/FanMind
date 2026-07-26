# FanMind Mobile Beta – Recovery, EAS und externe Freigaben

## Ziel

Dieses Runbook trennt den im Repository fertigstellbaren Mobile-Code von den einmaligen externen Konten und Einstellungen. Das Vorhandensein von `app.json`, `eas.json`, App-IDs oder Buildprofilen bedeutet nicht, dass bereits ein signierter Store-Build existiert.

## Im Repository umgesetzt

- eigenständige Expo-/React-Native-App, keine WebView-Hülle;
- Deep-Link-Schema `fanmind://`;
- iOS Bundle Identifier und Android Package `ch.fanmind.app`;
- E-Mail-/Passwort-Login;
- SecureStore-Sitzung mit Chunking;
- PKCE-basierte Passwort-Recovery mit kompatiblem Token-Fallback;
- Recovery-Route `fanmind://reset-password`;
- neues Passwort nur nach bestätigter Recovery-Sitzung;
- keine dauerhafte Speicherung vollständiger Recovery-URLs im React-Zustand oder in Refs;
- Kontaktanlage und Kontaktbearbeitung;
- Workspace-Filter plus Supabase RLS bei jeder Kontaktmutation;
- minimale Duplikatprüfung für Handle plus Quelle;
- verschlüsselte, User-/Workspace-gebundene Offline-Kontaktübersicht mit 24-Stunden-Ablauf, maximal 50 Kontakten und Nur-Lesen-Oberfläche;
- lokaler Logout-Purge für registrierte FanMind-SecureStore-Schlüssel;
- Expo-konforme SecureStore-Schlüssel ohne Doppelpunkte sowie serialisierte Speicherzugriffe;
- einmalige, fail-closed Migration beziehungsweise Bereinigung der früheren v1-SecureStore-Schlüssel beim App-Upgrade;
- begrenzte, serialisierte SecureStore-Schreibfolge mit Cleanup bei Teilfehlern;
- vollständige Account-Löschanfrage in Mobile sowie öffentlicher Webressourcenpfad;
- authentifizierter Status/Widerruf und service-role-only Request-Queue;
- manueller Dry-Run-first Account-Löschprocessor ohne Timer;
- eigener SDK-57-Development-Client über `expo-dev-client`;
- getrennte Mobile-CI mit TypeScript, Expo Doctor, Android-/iOS-JavaScript-Export, isoliertem nativen Android-/iOS-Prebuild, echtem Android-Debug-APK, codesign-freier iOS-Simulator-App und Architekturgrenze;
- native Push-Konfigurationsgrundlage mit minimal validierter Follow-up-Navigation, Auth-Handoff und Einmalverarbeitung; keine Berechtigungsabfrage, Token-Registrierung oder Zustellung;
- konfliktfreie native Splashscreen-Konfiguration mit der bestätigten FanMind-Wortmarke für das dunkle App-Theme;
- explizite EAS-Umgebungen für `development`, `preview` und `production`;
- Android-Debug-/iOS-Simulator-Validierung ohne Release-/Store-Credentials, die ausdrücklich kein signierter Beta-Build ist.

## Passwort-Recovery

### App-Vertrag

1. Nutzer öffnet `Passwort vergessen?`.
2. Die App ruft `resetPasswordForEmail` mit dem Redirect `fanmind://reset-password` auf.
3. Die sichtbare Bestätigung bleibt unabhängig davon gleich, ob ein Konto existiert.
4. Der Link muss auf demselben Gerät geöffnet werden, auf dem die Recovery angefordert wurde.
5. Die App akzeptiert ausschließlich:
   - einen PKCE-`code`; oder
   - ein vollständiges Paar aus `access_token` und `refresh_token` für kompatible bestehende Links.
6. Gemischte, unvollständige, überlange oder fremde Links werden abgelehnt.
7. Tokens, Codes und vollständige Callback-URLs werden weder protokolliert noch zur Duplikaterkennung im Speicher behalten; dafür werden ausschließlich nicht sensible Boolean-Flags verwendet.
8. Ein PKCE-Code muss zusätzlich durch das Supabase-Ereignis `PASSWORD_RECOVERY` bestätigt werden.
9. Erst nach einer bestätigten Recovery-Sitzung kann `updateUser({ password })` ausgeführt werden.

### Einmalig in Supabase einzurichten

In den Auth-Redirect-Einstellungen des **richtigen FanMind-Projekts** muss exakt folgender Redirect freigegeben werden:

```text
fanmind://reset-password
```

Diese Einstellung darf nicht geraten und nicht im Repository als erledigt markiert werden. Vor der Änderung ist die Projekt-ID mit der aktuellen Production-/späteren Staging-Dokumentation abzugleichen.

### Realer Gerätetest

1. internen signierten Build auf einem Testgerät installieren;
2. in der App eine ausschließlich für Tests vorgesehene E-Mail-Adresse eingeben;
3. Recovery-Mail auf demselben Gerät öffnen;
4. prüfen, dass FanMind direkt die Reset-Route öffnet;
5. ungültige oder bereits verwendete Links müssen eine generische Fehlermeldung zeigen;
6. neues Passwort setzen;
7. App vollständig schließen und erneut öffnen;
8. Anmeldung mit dem neuen Passwort prüfen;
9. sicher abmelden und prüfen, dass kein alter Workspace-Zustand sichtbar bleibt.

Keine echten Recovery-URLs, Codes oder Tokens in Screenshots, Tickets oder Chat-Nachrichten kopieren.

## Kontaktanlage und -bearbeitung

### Felder

- Name: Pflicht, maximal 160 Zeichen;
- Handle: optional, ohne Leerzeichen;
- Quelle/Plattform: reine Herkunftsangabe, keine externe Synchronisierung;
- Sprache: kurzer Code wie `de`, `en` oder `de-ch`;
- Status: `new`, `warm`, `buyer`, `vip` oder `inactive`;
- höchstens 20 normalisierte Tags;
- Zusammenfassung und interne Notiz mit begrenzter Länge.

### Autorisierungsgrenze

- Die App verwendet ausschließlich den öffentlichen Supabase-Key und den angemeldeten User-JWT.
- `workspace_id` wird bei Insert, Select und Update ausdrücklich gesetzt beziehungsweise gefiltert.
- RLS bleibt die verbindliche letzte Autorisierungsschicht.
- Kein Service-Role-Key befindet sich in der App.
- Ein Update ohne Datensatz im autorisierten Workspace wird als Fehler behandelt.

### Manueller Negativtest im späteren Staging

- Nutzer A darf einen Kontakt in Workspace A anlegen und bearbeiten.
- Nutzer A darf eine bekannte Kontakt-ID aus Workspace B weder laden noch verändern.
- Gleicher Handle plus gleiche Quelle wird innerhalb des eigenen Workspaces als mögliches Duplikat abgelehnt.
- Ein Kontakt aus einem anderen Workspace darf durch die Duplikatprüfung nicht als Information sichtbar werden.

Dieser Mehrnutzer-Negativtest bleibt an das separate Staging aus #643 gebunden und wird nicht gegen Production-Kundendaten ausgeführt.

## Lokaler Daten-Purge

`Sicher abmelden und lokale Daten entfernen` führt folgende Schritte aus:

1. neue Offline-Schreibvorgänge sperren und bereits gestartete Cache-Vorgänge abwarten;
2. lokale Supabase-Sitzung beenden;
3. alle von FanMind registrierten SecureStore-Schlüssel und deren Chunks einschließlich Offline-Cache entfernen;
4. Recovery-Zustand zurücksetzen;
5. Session im React-Kontext auf `null` setzen;
6. Workspace-Zustand sofort leeren.

Zusätzliche Speichergrenzen:

- eine Sitzung darf höchstens 64 SecureStore-Chunks verwenden;
- der Schlüssel wird vor dem Schreiben der Chunks registriert;
- die erwartete Chunkzahl wird vor den Chunks gespeichert, damit Teilfehler auffindbar bleiben;
- bei einem Schreibfehler werden angelegte Teilstände sofort entfernt;
- nicht vollständig löschbare Schlüssel bleiben registriert und werden beim nächsten Purge erneut versucht;
- ein Registry-Eintrag wird lieber zu lange behalten, als Sitzungsdaten unregistriert zurückzulassen.

Der Offline-Cache verwendet exakt einen registrierten SecureStore-Schlüssel und wird nur nach einem erfolgreichen, ungefilterten Online-Abruf geschrieben. Er enthält höchstens 50 Kontakte, ist maximal 24 Stunden gültig und speichert nur Workspace-Name sowie Kontakt-ID, Workspace-ID, Name, Handle, Plattform, Status und Änderungszeit. Kontaktwissen, Zusammenfassungen, Nachrichten, KI-Inhalte, interne Notizen, Follow-ups und Zugangsdaten werden nicht übernommen. Nur ein Transportstatus `0` darf den Nur-Lesen-Fallback aktivieren; Auth-, RLS- und Serverfehler löschen beziehungsweise verwerfen den Cache fail-closed.

## Android-Vorabtest mit Expo Go

Der noch unsignierte App-Kern kann bereits auf einem Android-Telefon geprüft werden:

1. die [offizielle Expo-Go-Version 57.0.2](https://github.com/expo/expo-go-releases/releases/tag/Expo-Go-57.0.2) für SDK 57 installieren;
2. auf dem Rechner Node.js `>=22.13.0` und Git bereitstellen;
3. Repository klonen, in `apps/mobile` wechseln und `npm ci` ausführen;
4. `.env.example` nach `.env.local` kopieren und ausschließlich die öffentlichen Supabase-URL, den öffentlichen Anon-/Publishable-Key und `https://fanmind.ch` als API-URL eintragen;
5. `npm run check` und danach `npm run start:go` ausführen;
6. Rechner und Telefon in dasselbe WLAN bringen und den QR-Code mit Expo Go scannen;
7. falls das lokale Netzwerk blockiert, `@expo/ngrok` installieren und `npx expo start --go --tunnel` verwenden.

Solange echtes Staging fehlt, darf dieser Vorabtest nur mit einem eigens dafür vorgesehenen Testkonto erfolgen. Expo Go ersetzt keinen signierten Beta-Build: finales Icon/Splashscreen, eigenständige Installation, verlässliche Deep Links, Push und Store-Verhalten müssen später mit dem signierten APK/AAB geprüft werden. Für native Funktionen ist der eigene Development-Client verbindlich; der Standardbefehl `npm run start` startet deshalb mit `--dev-client`.

## EAS-Konfiguration

Vorhandene Profile in `apps/mobile/eas.json`:

- `development`: echter Development-Client, interne Distribution, Android APK, EAS-Umgebung `development`;
- `native-validation`: erbt `development`, überspringt Signing-Credentials und erzeugt auf iOS ausschließlich einen Simulator-Build;
- `preview`: interne signierte Beta-Distribution, Android APK, EAS-Umgebung `preview`;
- `production`: Store-Build mit automatischer Buildnummer und EAS-Umgebung `production`;
- alle Profile verwenden Node.js `22.13.1`;
- EAS CLI mindestens `19.1.0`;
- Build nur aus einem Commit (`requireCommit=true`).

Die öffentliche App-Konfiguration wird in EAS je Umgebung mit exakt diesen
Namen angelegt, aber nicht mit geratenen Werten im Repository:

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_FANMIND_API_URL
```

`EXPO_PUBLIC_*`-Werte werden in die App eingebettet und dürfen daher niemals
Service-Role-, OpenAI-, Stripe- oder andere Server-Secrets enthalten.

### Native-Prüfung ohne Release-/Store-Credentials

Der lokale Prebuild-Nachweis benötigt weder EAS-Login noch Signing:

```bash
cd apps/mobile
npm run native:prebuild:check
```

Er generiert Android und iOS in einem temporären Verzeichnis, prüft Package- und
Bundle-ID, Deep-Link-Schema, SecureStore-Backup-Regeln, Verschlüsselungsangabe,
dunkles App-Theme, Splashscreen und das Fehlen serverseitiger Secret-Bezeichner
und entfernt den temporären Stand anschließend.

Die GitHub-Native-CI generiert danach frische native Projekte, kompiliert
`assembleDebug` auf Android mit dem lokalen Standard-Debug-Key und baut mit
`CODE_SIGNING_ALLOWED=NO` eine iOS-Simulator-App. Die Artefakte heißen
ausdrücklich `not-for-release`, verwenden keine Release-/Store-Credentials und
belegen weder Play-Internal-Testing noch TestFlight.

Nach `eas init` kann zusätzlich das credentialfreie EAS-Profil verwendet werden:

```bash
cd apps/mobile
npx eas-cli@latest build --platform android --profile native-validation
npx eas-cli@latest build --platform ios --profile native-validation
```

Das Android-Artefakt ist ein nicht mit Production-/Store-Credentials signierter
Debug-Validierungsbuild; das iOS-Artefakt läuft nur im Simulator. Beides ist
**kein signierter Beta-Build**, keine TestFlight-Freigabe und keine
Store-Einreichung. Auch diese Cloud-Builds brauchen ein Expo-Konto und eine
echte EAS-Projekt-ID.

### Einmalige externe Einrichtung

Noch nicht durch Code erledigt:

1. Expo-Organisation beziehungsweise Expo-Konto festlegen.
2. In `apps/mobile` `eas init` ausführen und die echte EAS-Projekt-ID in die Expo-Konfiguration schreiben lassen.
3. In EAS die drei Umgebungen `development`, `preview` und `production` mit den jeweils richtigen öffentlichen FanMind-Werten anlegen.
4. Android-Keystore kontrolliert durch EAS erzeugen oder einen bestätigten bestehenden Keystore hinterlegen.
5. Für iOS ein bezahltes Apple-Developer-Konto bereitstellen.
6. Für interne iOS-Ad-hoc-Builds Testgeräte registrieren.
7. App in App Store Connect und Google Play Console anlegen.
8. App Store Connect App-ID und Google-Service-Account erst danach in die Submit-Konfiguration aufnehmen.
9. Zugriff auf interne Build-URLs im Expo-Projekt auf authentifizierte Teammitglieder begrenzen.

Keine erfundene EAS-Projekt-ID, Apple-Team-ID, App-Store-ID oder Google-Service-Account-Datei eintragen.

### Interner Android-Build

Nach EAS-Einrichtung:

```bash
cd apps/mobile
npx eas-cli@latest build --platform android --profile preview
```

Das Preview-Profil erzeugt ein direkt installierbares APK für den internen Test. Der Build-Link ist wie ein vertrauliches internes Artefakt zu behandeln.

### Interner iOS-Build

Nach Apple-Account und Geräte-Registrierung:

```bash
cd apps/mobile
npx eas-cli@latest device:create
npx eas-cli@latest build --platform ios --profile preview
```

Bei Ad-hoc-Distribution können nur Geräte installiert werden, deren UDID in der verwendeten Provisioning-Datei enthalten ist.

### TestFlight und Play Internal Testing

Erst nach realen Gerätetests und Store-Voraussetzungen:

```bash
cd apps/mobile
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest build --platform android --profile production
```

Die anschließende Übertragung benötigt echte Store-Konten. EAS Submit lädt Binärdateien hoch, ersetzt aber keine Store-Texte, Screenshots, Datenschutzangaben oder Review-Freigaben.

## Branding und Store-Unterlagen

Die bestätigte FanMind-Wortmarke liegt unverändert unter
`apps/mobile/assets/branding/fanmind-wordmark.png` und wird über das
`expo-splash-screen`-Config-Plugin nativ eingebunden. Das über
`expo-system-ui` verbindlich dunkle App-Theme verwendet genau eine
Splashscreen-Variante, damit iOS keine widersprüchlichen Interface-Style-Werte
generiert. Die Quelle ist 754 × 252 Pixel groß und wird mit 300 Pixel
Bildbreite ausschließlich verkleinert, nicht hochskaliert.

Die Wortmarke ist ausdrücklich **kein** Store-App-Icon. Android Adaptive Icon,
Android Legacy Icon und iOS App Icon bleiben ohne eine bestätigte hochauflösende
runde beziehungsweise quadratische Quelle offen. Das vorhandene 96 × 96 Pixel
große Social-Avatar-Asset darf dafür nicht hochskaliert werden.

Vorbereitete deutsche und englische Store-Texte, URLs, Screenshot-Slots und die
noch manuell in den Store-Portalen zu bestätigenden Datenschutzangaben stehen in
`docs/mobile/STORE_LISTING.md`.

## Noch offen nach diesem Block

- finale App-Icons aus einer bestätigten hochauflösenden runden/quadratischen Quelle;
- echter Recovery-E-Mail-/Gerätetest nach Supabase-Redirect-Freigabe;
- EAS-Projekt-ID und Signing Credentials;
- reale öffentliche EAS-Werte in getrennten Development-/Preview-/Production-Umgebungen;
- Android Internal Testing und iOS TestFlight;
- Push-Berechtigung, Token-Registrierung und echte Follow-up-Zustellung im signierten Build;
- realer Account-Löschantrag/Widerruf auf signiertem Android-/iOS-Gerät;
- reale Android-/iOS-Gerätetestprotokolle;
- Store-Datenschutzangaben und Screenshots final abnehmen; Metadaten sind vorbereitet.

Diese Punkte bleiben sichtbar offen und dürfen nicht allein aufgrund der vorhandenen Konfigurationsdateien als abgeschlossen markiert werden.
