# Website Chat Security Foundation

Status: Session- und Nachrichteningestion vorbereitet, nicht produktiv aktiviert.

Dieser Block schafft die sichere Grundlage für Website-Chat und Website-KI,
ohne ein öffentliches Widget, KI-Antworten oder automatisches Senden zu
aktivieren.

## Schutzgrenzen

- Jede Installation ist einem Workspace zugeordnet und standardmäßig
  deaktiviert.
- Eine öffentliche Installations-ID ist nur ein Routingmerkmal und kein
  Geheimnis.
- Zugelassen sind ausschließlich einzeln verifizierte, exakt passende
  HTTPS-Origins. Wildcards, Pfade, Queryparameter und ähnlich aussehende
  Subdomains werden nicht akzeptiert.
- Besucher müssen der dokumentierten Verarbeitungsversion ausdrücklich
  zustimmen, bevor eine Sitzung entsteht.
- Der Browser erhält ein zufälliges 256-Bit-Sitzungstoken. Gespeichert wird
  ausschließlich ein zweckgebundener HMAC-SHA256-Wert; weder das rohe Token
  noch eine rohe IP-Adresse werden persistiert.
- Sitzungen laufen spätestens nach 24 Stunden ab und können widerrufen werden.
- Tabellenzugriff ist für `public`, `anon` und `authenticated` entzogen. Nur
  serverseitige Service-Role-Zugriffe sind zulässig.
- Der öffentliche Session-Endpunkt begrenzt Bodygröße und Anfragerate über den
  bestehenden atomaren Shared Rate Limiter. Bei Ausfall bleibt er geschlossen.
- CORS wird nur für die zuvor serverseitig verifizierte Origin ausgegeben.
- Der getrennte Nachrichtenendpunkt akzeptiert nur ein gültiges Bearer-
  Sitzungstoken derselben Installation und Origin. Ein clientseitiger UUID-
  Schlüssel macht Wiederholungen idempotent.
- Die transaktionale, als `SECURITY INVOKER` laufende Datenbankfunktion ist nur
  für `service_role` ausführbar. Sie erzeugt pro Besuchersitzung einen
  workspace-gebundenen Kontakt und eine Conversation und schreibt ausschließlich
  eingehende Nachrichten in die bestehende Admin-Inbox.
- Der idempotente Receipt speichert keinen Nachrichtentext. Rohes Sitzungstoken
  und rohe IP-Adresse werden weiterhin nicht persistiert.
- Es gibt keinen OpenAI-Aufruf, keine Antwort an den Besucher, keinen Outbound-
  Transport und kein automatisches Senden.

## Aktivierungsreihenfolge

1. Migration ausschließlich im isolierten Supabase-Staging anwenden.
2. RLS, Grants, Fremdschlüssel, Indizes und Security Advisors prüfen.
3. mindestens eine synthetische Installation und eine verifizierte Test-Origin
   serverseitig anlegen;
4. `FANMIND_WEBSITE_CHAT_SESSION_SECRET` als getrenntes Staging-Secret setzen;
5. erlaubte und verbotene Origins sowie Consent, Rate Limit und Ablauf im
   Browser testen;
6. Ingestion-Migration im isolierten Staging anwenden und mit synthetischer
   Sitzung auf Kontakt-, Conversation-, Nachrichten- und Inbox-Zuordnung sowie
   Idempotenz prüfen;
7. erst danach das sichtbare Widget in einem getrennten PR ergänzen.

Production bleibt bis zur Staging-, Rechts- und Datenschutzabnahme deaktiviert.
