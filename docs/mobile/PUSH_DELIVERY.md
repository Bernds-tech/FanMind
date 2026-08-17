# Mobile Push Delivery – deaktivierter Staging-Vertrag

## Stand

Der Servercode für genau eine Follow-up-Erinnerung ist vorbereitet, aber nicht
an eine Route, einen Timer, einen Cronjob oder einen Worker angeschlossen. Er
sendet im aktuellen Produktstand nichts. `deliveryEnabled` bleibt in der
öffentlichen Registrierungsantwort deshalb `false`.

Der Baustein ist ausschließlich eine fail-closed Grundlage für eine spätere,
separat genehmigte Staging-Abnahme:

- `src/lib/mobilePushDeliveryPolicy.mjs` besitzt Gates, Autorisierung,
  Minimalpayload, feste kurze TTL und Retry-Zeitgrenzen;
- `src/lib/mobilePushDelivery.mjs` spricht ausschließlich die festen HTTPS-
  Endpunkte des Expo Push Service für Send-Tickets und Receipts an;
- `src/lib/mobilePushDeliveryTarget.ts` lädt mit `service_role` nur die zur
  Autorisierung notwendigen IDs, Status- und Fälligkeitsfelder und entschlüsselt
  den registrierten Expo-Token erst serverseitig;
- `tests/mobile-push-delivery.test.mjs` verwendet ausschließlich einen
  injizierten synthetischen Provider. Es findet kein externer Request statt.

Der CI-Test scannt zusätzlich ausführbare Quellen, Workflows und SQL. Jede
Route, jeder Worker/Timer, jede Migration oder sonstige Verdrahtung des
Delivery-Service bricht die Dormanz-Invariante, bis dafür ein eigener
genehmigter Aktivierungsschritt den Test bewusst ersetzt.

## Harte Aktivierungsgrenzen

Jeder einzelne Sendversuch muss alle Grenzen gleichzeitig erfüllen:

1. `FANMIND_RUNTIME_ENVIRONMENT=staging`;
2. `FANMIND_MOBILE_PUSH_DELIVERY_ENABLED=true`;
3. die aktionsbezogene Bestätigung
   `deliver-mobile-followup-reminder-staging`;
4. die bestehenden Non-Production-Write-Gates;
5. der konfigurierte HTTPS-API-Host stimmt mit einem unabhängig übergebenen,
   zuvor geprüften Staging-Host (aktuell `staging.fanmind.ch`) überein;
6. Supabase-URL und konfigurierte Ziel-Ref stimmen mit einer unabhängig
   übergebenen, zuvor geprüften Staging-Ref überein; auch die konfigurierte
   Production-Ref muss einer unabhängig geprüften Production-Ref entsprechen,
   und beide geprüften Refs müssen verschieden sein;
7. die konfigurierte EAS-Projekt-ID stimmt mit einer unabhängig übergebenen,
   zuvor geprüften EAS-Projekt-ID überein;
8. ein ausschließlich serverseitiger Expo Access Token ist gesetzt;
9. URL, geprüfte Ziel-Ref und `service_role` werden als ein gemeinsamer,
   server-only Zielkontext an den Loader und als exakt dasselbe strukturell
   validierte Binding an `ledger.reserve` übergeben; weder Loader noch Ledger
   dürfen dafür eine zweite globale ENV-Quelle lesen;
10. ein persistenter atomarer Delivery-Ledger ist angeschlossen und bindet den
    aktuell gespeicherten Token-Fingerprint derselben Registrierung.

Production ist im Code strukturell nicht unterstützt. Auch
`FANMIND_MOBILE_PUSH_PRODUCTION_ACTIVATION_CONFIRMED=true` wird abgelehnt. Das
Ändern einer ENV oder das Mergen dieses Codes ist keine Production-Freigabe.

## Autorisierter Einzelsendefall

Der Trigger akzeptiert exakt fünf Felder: Workspace-ID, User-ID, Follow-up-ID,
ein explizites Fälligkeitsdatum als Cutoff und die Staging-Bestätigung. Namen,
Nachrichten, Notizen, Gründe, Handles oder frei formulierter Text werden
abgelehnt.

Vor einer Provideranfrage muss der Server exakt je eine passende Zeile
bestätigen:

- Owner- oder Member-Mitgliedschaft des Users im Workspace;
- aktiver, verarbeitungsberechtigter und nicht öffentlicher Demo-Workspace;
- offenes Follow-up desselben Workspace, dessen `due_date` spätestens am
  expliziten Cutoff liegt; ein Cutoff nach dem aktuellen Server-UTC-Datum wird
  fail-closed abgelehnt;
- Kontakt-ID und Workspace-ID des Follow-ups stimmen mit dem minimal geladenen
  Kontakt überein;
- aktive, nicht abgelaufene Registrierung desselben Users und Workspace;
- der entschlüsselte Token stimmt mit dem gespeicherten HMAC-Fingerprint der
  Registrierung überein; nicht kanonische oder abweichende Werte werden vor
  jeder Reservation abgelehnt;
- kanonischer, ohne Kalendernormalisierung roundtrip-fähiger ISO-Zeitpunkt der
  Registrierung, der höchstens 31 Tage in der Zukunft liegt;
- Registrierung und unabhängig geprüfte EAS-Projekt-ID stimmen exakt überein.

Die Erinnerungs-Payload ist fest und enthält nur:

```json
{
  "title": "FanMind",
  "body": "Ein Follow-up ist fällig.",
  "ttl": 3600,
  "data": {
    "type": "followup_reminder",
    "followupId": "<uuid>"
  }
}
```

Android ergänzt ausschließlich den festen Channel
`followup-reminders`. Kein CRM-Inhalt und keine Kontakt-/Workspace-ID gelangen
in sichtbaren Text, Providerdiagnosen, Rückgabewerte oder Logs. Der Baustein
schreibt selbst keine Logs und gibt ausschließlich feste Statuscodes zurück.
Die feste TTL von 3.600 Sekunden verhindert den sonst möglichen
Provider-Default von mehreren Wochen und damit eine lange verspätete,
inzwischen überholte Erinnerung.

## Idempotenz, Retry und Receipt

Vor dem ersten Providerbyte muss der verpflichtende Ledger in **derselben
Datenbanktransaktion** die Membership, Workspace-Verarbeitungsberechtigung,
Kontakt-/Follow-up-Zuordnung, offenen Status, Fälligkeit sowie aktive
User-/Workspace-/Projekt-Registrierung einschließlich ihres aktuellen
Token-Fingerprints erneut lesen und erst danach den deterministischen Schlüssel
aus Workspace, User, Follow-up, Registrierung, EAS-Projekt und Fälligkeitsdatum
reservieren. `ledger.reserve` erhält dazu exakt dasselbe bereits validierte
Supabase-URL-/Ref-/`service_role`-Binding wie der Loader. Die Reservation muss
den festen Revalidierungsvertrag, denselben Target-Hash, dieselbe Staging-
Projekt-Ref, denselben aktuellen Token-Fingerprint und einen kanonischen,
höchstens 60 Sekunden vom angeforderten Zeitpunkt abweichenden
Revalidierungszeitpunkt zurückgeben. Eine bloße Bestätigung der zuvor getrennt
gelesenen Werte oder ein Echo dieser Felder ist nicht ausreichend. Ein
bestehender oder laufender Schlüssel verhindert einen zweiten Provideraufruf.

- maximal drei explizit erneut ausgelöste Versuche;
- exponentiell begrenzte Retry-Zeitpunkte nur nach eindeutigem HTTP `429` oder
  `5xx` beziehungsweise `MessageRateExceeded`;
- ein Netzabbruch oder eine ungültige Antwort nach dem Request ist
  `indeterminate` und wird wegen möglicher Doppelzustellung nicht automatisch
  wiederholt;
- ein erfolgreiches Expo-Ticket wird mit seiner privaten Receipt-ID
  persistiert;
- jeder Receipt-Check muss zuerst eine persistente atomare Lease reservieren;
  `not_due`, `inflight` und terminale Versuche lösen keinen Provideraufruf aus;
- der persistierte Ticket-Zeitpunkt muss als kanonischer UTC-ISO-Zeitpunkt
  roundtrip-fähig sein; Zukunftswerte werden abgelehnt und nach 24 Stunden wird
  ohne Provideraufruf terminalisiert;
- Receipts werden frühestens nach 15 Minuten, maximal viermal und höchstens
  innerhalb des 24-Stunden-Fensters geprüft; weitere Read-Retries verwenden
  feste 15-Minuten-, 1-Stunden- und 6-Stunden-Abstände;
- `DeviceNotRegistered` muss in genau **einer** Datenbanktransaktion den
  reservierten Versuch terminalisieren und die konkrete Registrierung
  deaktivieren; zwei getrennte Ledger-Aufrufe sind wegen des Crash-Fensters
  unzulässig;
- Providertexte werden verworfen; nur feste, redigierte Fehlercodes dürfen in
  den Ledger.

Ein Expo-Receipt mit `status=ok` bestätigt nur die Übergabe an APNs oder FCM,
nicht die Anzeige auf dem Gerät. Grundlage sind die offiziellen
[Expo-Hinweise zu Tickets, Receipts und Retry](https://docs.expo.dev/push-notifications/sending-notifications/).

## Offener Ledger-Blocker

Das bestehende Schema besitzt keine robuste, atomare Zustellhistorie. Eine
In-Memory-Map, ein Prozess-Lock oder das Follow-up selbst wären kein
instanzübergreifender Idempotenznachweis. Deshalb gibt es bewusst keinen
Default-Ledger und keine aktive Serverroute.

Der Service ist allein nicht aktivierbar: Vor einem realen Staging-Send müssen
die unabhängig geprüften App-, Staging-Supabase-, Production-Supabase- und
EAS-Bindings serverseitig übergeben werden. Zusätzlich ist eine eigene
Entscheidung und separat genehmigte, checksum-gebundene Migration erforderlich.
Sie muss mindestens
    eine service-role-only Tabelle mit eindeutigem Idempotenzschlüssel,
Versuchsnummer, Send- und Receipt-Reservation/Lease, Receipt-Zähler,
redigiertem Zustand, privater Receipt-ID, Retry-/Receipt-Zeitpunkten und
definierter Aufbewahrung bereitstellen. Die Reserve-RPC muss mit dem vom
Service strukturell validierten gemeinsamen Zielbinding arbeiten, die oben
genannten Target-Grenzen und den aktuellen Token-Fingerprint in derselben
Transaktion erneut prüfen und den festen Revalidierungsvertrag samt Target-
Hash, Staging-Projekt-Ref, Token-Fingerprint und frischem kanonischem Zeitpunkt
liefern. Der `DeviceNotRegistered`-Pfad muss Attempt-Terminalisierung und
Registrierungsdeaktivierung ebenfalls atomar unter der jeweils reservierten
Send- oder Receipt-Lease ausführen. RLS,
Browserentzug, Konfliktverhalten, Crash-Recovery und Cleanup müssen in einer
rollback-only Staging-Acceptance bewiesen werden. Diese Arbeit wurde nicht
erfunden oder automatisch angewendet.

Erst danach folgen: expliziter serverseitiger Trigger ohne Timer, ein einziger
synthetischer Staging-Send an ein eigenes Testgerät, Receipt-Nachweis,
Token-Widerrufstest, Datenschutzabnahme und eine weiterhin getrennte
Production-Entscheidung.
