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
- Kontaktanlage und Kontaktbearbeitung;
- Workspace-Filter plus Supabase RLS bei jeder Kontaktmutation;
- minimale Duplikatprüfung für Handle plus Quelle;
- lokaler Logout-Purge für registrierte FanMind-SecureStore-Schlüssel;
- getrennte Mobile-CI mit TypeScript, Expo Doctor, Android-Export und Architekturgrenze;
- `development`, `preview` und `production` in `apps/mobile/eas.json`.

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
7. Tokens, Codes und vollständige Callback-URLs werden nicht protokolliert.
8. Erst nach einer bestätigten Recovery-Sitzung kann `updateUser({ password })` ausgeführt werden.

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

1. lokale Supabase-Sitzung beenden;
2. alle von FanMind registrierten SecureStore-Schlüssel und deren Chunks entfernen;
3. Recovery-Zustand zurücksetzen;
4. Session im React-Kontext auf `null` setzen;
5. Workspace-Zustand sofort leeren.

Die aktuelle App besitzt noch keinen Offline-Kontaktcache. Wenn ein solcher Cache später ergänzt wird, muss er denselben zentralen Purge-Vertrag verwenden und durch einen eigenen Regressionstest abgedeckt werden.

## EAS-Konfiguration

Vorhandene Profile in `apps/mobile/eas.json`:

- `development`: interne Distribution; Android APK;
- `preview`: interne Distribution; Android APK;
- `production`: Store-Build mit automatischer Buildnummer;
- EAS CLI mindestens `19.1.0`;
- Build nur aus einem Commit (`requireCommit=true`).

### Einmalige externe Einrichtung

Noch nicht durch Code erledigt:

1. Expo-Organisation beziehungsweise Expo-Konto festlegen.
2. In `apps/mobile` `eas init` ausführen und die echte EAS-Projekt-ID in die Expo-Konfiguration schreiben lassen.
3. Android-Keystore kontrolliert durch EAS erzeugen oder einen bestätigten bestehenden Keystore hinterlegen.
4. Für iOS ein bezahltes Apple-Developer-Konto bereitstellen.
5. Für interne iOS-Ad-hoc-Builds Testgeräte registrieren.
6. App in App Store Connect und Google Play Console anlegen.
7. App Store Connect App-ID und Google-Service-Account erst danach in die Submit-Konfiguration aufnehmen.
8. Zugriff auf interne Build-URLs im Expo-Projekt auf authentifizierte Teammitglieder begrenzen.

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

## Noch offen nach diesem Block

- finale App-Icons und Splashscreen aus bestätigtem Branding;
- echter Recovery-E-Mail-/Gerätetest nach Supabase-Redirect-Freigabe;
- EAS-Projekt-ID und Signing Credentials;
- Android Internal Testing und iOS TestFlight;
- Offline-Lese-Cache mit Purge-Vertrag;
- Push-Grundlage für Follow-ups;
- Account-/Datenlöschprozess in der App;
- reale Android-/iOS-Gerätetestprotokolle;
- Store-Datenschutzangaben, Screenshots und Metadaten.

Diese Punkte bleiben sichtbar offen und dürfen nicht allein aufgrund der vorhandenen Konfigurationsdateien als abgeschlossen markiert werden.
