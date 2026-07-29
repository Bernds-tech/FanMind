# Mobile Push Registration – kontrollierte Vorbereitung

## Ziel und Grenze

FanMind bereitet Push-Erinnerungen ausschließlich als ausdrückliches Opt-in
für angemeldete, nicht temporäre Nutzer vor. Dieser Stand registriert höchstens
ein Android- oder iOS-Gerät pro Konto. Er sendet keine Push-Nachricht und
aktiviert keinen Timer, Worker oder Expo-Delivery-Aufruf.

## Sicherheitsvertrag

- Mobile verwendet nur den eigenen Supabase-Bearer-Token.
- Die API akzeptiert ausschließlich `X-FanMind-Client: mobile`.
- Demo-Nutzer und Nutzer ohne bestätigten Workspace werden abgelehnt.
- Expo-Push-Token werden vor jeder Persistenz mit einem dedizierten
  32-Byte-Key per AES-256-GCM verschlüsselt.
- Ein keyed HMAC verhindert doppelte Token, ohne Tokenwerte auszugeben.
- Es gibt höchstens eine aktive Registrierung pro Auth-Nutzer.
- Registrierungen laufen nach 30 Tagen ab und werden bei der nächsten
  Statusabfrage oder Registrierung desselben Tokens bereinigt.
- Logout versucht die Registrierung vor dem lokalen Session-Purge zu löschen;
  der lokale Logout bleibt auch bei einem Netzfehler möglich.
- Account- oder Workspace-Löschung entfernt die Zeile per Foreign-Key-Cascade.
- API-Antworten enthalten weder Token, Hash, Ciphertext, User-ID noch
  Workspace-ID.

## Noch nicht automatisch angewendet

Der Web-Deploy führt keine Supabase-Migration aus. Vor einem echten
Registrierungstest sind getrennt erforderlich:

1. Zielprojekt und Umgebung eindeutig als Nicht-Production oder ausdrücklich
   freigegebenes Ziel bestätigen.
2. Migration
   `supabase/migrations/20260729120000_mobile_push_registrations.sql`
   kontrolliert anwenden.
3. einen eigenen zufälligen 32-Byte-Key als
   `FANMIND_PUSH_TOKEN_ENCRYPTION_KEY` ausschließlich serverseitig setzen.
4. EAS-Projekt-ID und öffentliche Mobile-Umgebung über den bestehenden
   Read-only-Ressourcencheck bestätigen.
5. signierten Development-/Preview-Build verwenden.
6. Opt-in, Ablehnung, Registrierung, erneute Registrierung, Opt-out, Logout,
   Konto-/Workspace-Trennung und 30-Tage-Ablauf mit Testkonten prüfen.

Keine Secret- oder Tokenwerte in Logs, Screenshots, Issues oder Chat kopieren.
Expo verlangt für Remote-Push unter aktuellem Android einen eigenen
Development-/Preview-Build; Expo Go ist dafür nicht der Freigabenachweis.

## Separate spätere Zustellungsphase

Erst nach erfolgreicher Staging- und Datenschutzabnahme darf ein kleiner,
gesonderter Delivery-Baustein entworfen werden. Er muss:

- nur fällige, offene Follow-ups des gebundenen Workspace berücksichtigen;
- generische Titel/Texte ohne Kontaktname, Nachricht, Notiz oder CRM-Inhalt
  verwenden;
- nur Payloads mit `type=followup_reminder` und `followupId` senden;
- abgelaufene, abgemeldete oder fremde Registrierungen fail-closed verwerfen;
- Expo-/FCM-/APNs-Fehler redigieren und ungültige Token sicher entfernen;
- Duplikate und wiederholte Zustellung verhindern;
- ohne automatische Nachricht an Kontakte auskommen.
