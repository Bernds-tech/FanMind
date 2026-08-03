# Meta-Kanäle und Content Intelligence

Stand: 3. August 2026

Dieses Dokument ist die technische und rechtliche Arbeitsgrundlage für
Facebook-/Instagram-Verbindungen, Nachrichtenimport, Post-Reichweitenanalyse,
Fan-Kommunikationsanalyse und Workspace-Schreibstil. Es ist keine anwaltliche
Freigabe und aktiviert keine externe Verbindung.

## Verbindliche Produktgrenze

- Jeder FanMind-Kunde verbindet in seinem eigenen Workspace sein eigenes
  Facebook-/Instagram-Geschäftskonto über Meta OAuth beziehungsweise Meta
  Business Login.
- FanMind speichert keine Facebook-/Instagram-Passwörter. Zugriffstokens werden
  verschlüsselt und ausschließlich serverseitig verarbeitet.
- Ein externes Konto darf zu einem Zeitpunkt nur einem aktiven FanMind-
  Workspace zugeordnet sein. Ein fremdes Konto oder fremde Nachrichten dürfen
  niemals durch bloße Workspace-Auswahl sichtbar werden.
- Verbindungen dürfen nur Owner oder Admins anlegen, ändern oder trennen.
- Bei mehreren verwalteten Seiten oder Konten ist eine ausdrückliche Auswahl
  erforderlich. FanMind darf niemals automatisch die erste Seite wählen.
- FanMind erstellt Antwortvorschläge. Der Mensch prüft und sendet selbst; es
  gibt keine automatische Nachrichtenversendung.
- Es gibt kein Scraping, keinen Import fremder Followerlisten und keine
  Anreicherung aus privaten Profilen oder Drittquellen.

## Status

| Bereich | Stand |
| --- | --- |
| Facebook OAuth, verschlüsselte Seitentokens, Webhook- und Nachrichten-Grundlage | vorbereitet/Beta |
| Facebook Graph API | auf stabile `v25.0` festgelegt |
| Instagram Webhook-Parser | Grundlage vorhanden |
| Instagram Business Login/OAuth und echte Kontenauswahl | noch zu implementieren und mit Meta zu testen |
| Post-/Account-Metrikmodell und Formeln | vorbereitet, Migration noch nicht angewendet |
| Fan-/Gesprächs-/Schreibstil-Provenienz und Reviewstatus | vorbereitet, Migration noch nicht angewendet |
| Meta App Review, Advanced Access und Business Verification | extern offen |
| Rechtsgrundlage, Transparenz, AVV und Aufbewahrung | extern beziehungsweise je Kunde offen; Analysen standardmäßig aus |
| Produktive Drittpersonenfreigabe | blockiert bis Technik-, Staging- und Rechtsabnahme |

## Mandanten- und Datenhierarchie

| Ebene | Identität | Zulässige Verknüpfung |
| --- | --- | --- |
| Workspace | `workspace_id` | genau ein FanMind-Mandant |
| Meta-Verbindung | `social_connection_id` | Workspace + Plattform + externes Konto |
| Post/Reel/Video | `content_source_id` | Verbindung + externe Content-ID |
| Fan/Kontakt | `contact_id` | ausschließlich im Workspace |
| Gespräch | `conversation_id` | Kontakt + Plattform-Thread oder Postkontext |
| Nachricht/Kommentar | `conversation_message.id` | Gespräch + externe Ereignis-ID |
| Analyse | Report-ID | Workspace + Quelle + Zeitraum + Anzahl + Konfidenz + Reviewstatus |

Ein Fan-Gespräch bleibt an seinen konkreten Thread beziehungsweise Post
gebunden. Nachrichten aus zehn oder hundert Posts werden nicht zu einem
scheinbar einheitlichen Gespräch vermischt.

## Über freigegebene Meta-APIs verfügbare Daten

Die tatsächlich verfügbaren Felder hängen von Kontotyp, App-Modus,
Berechtigung, Reviewstatus, API-Version und dem jeweiligen Meta-Endpunkt ab.
FanMind behandelt fehlende Metriken als nicht verfügbar und erzeugt keine
Ersatzwerte.

| Quelle | Nutzbare Daten | Nicht verfügbar / nicht zulässig |
| --- | --- | --- |
| Facebook Page | eigene Posts/Videos, veröffentlichte Metadaten, Page-Kommentare, Messenger-Threads mit der Seite, freigegebene Page-/Post-Insights | private Profile, vollständige Followerliste, fremde Seiteninterna, Profile ohne Interaktion |
| Instagram Professional | eigene Medien/Reels, Kommentare, DMs mit dem Professional-Konto, freigegebene Account-/Media-Insights | private Consumer-Konten, vollständige Followerliste, fremde DMs, private Profilanalyse |
| FanMind-Kommunikation | gespeicherte eingehende und bestätigte manuell ausgehende Texte, Zeitstempel, Thread-/Postbezug, minimale Anhangsmetadaten | Passwort, versteckte Profildaten, Gesichtserkennung, Bilddiagnosen |

Die Reichweite eines einzelnen Fans ist nicht als personenbezogene
„Posting-Reichweite“ verfügbar. Reichweite und Impressionen sind aggregierte
Account-/Content-Metriken. Personenbezogene Analysen sind nur für Kontakte
möglich, die über Nachricht, Kommentar oder einen anderen zulässigen
FanMind-Kontaktpunkt tatsächlich im Workspace vorkommen.

## Benötigte Berechtigungsklassen

Die endgültigen Scopes werden vor App Review noch einmal gegen die dann aktive
Meta-Konfiguration geprüft.

| Plattform/Funktion | Vorbereitete Scopes |
| --- | --- |
| Facebook Messenger | `pages_show_list`, `pages_manage_metadata`, `pages_messaging` |
| Facebook Kommentare | `pages_show_list`, `pages_read_engagement`, `pages_manage_metadata` |
| Facebook Insights | `pages_show_list`, `pages_read_engagement`, `read_insights` |
| Instagram DMs | `instagram_business_basic`, `instagram_business_manage_messages` |
| Instagram Kommentare | `instagram_business_basic`, `instagram_business_manage_comments` |
| Instagram Insights | `instagram_business_basic`, `instagram_business_manage_insights` |

Standard Access reicht nur für App-Rollen beziehungsweise zulässige eigene
Testkonten. Für allgemeine Kundenkonten sind die passenden Advanced-Access-
Berechtigungen, App Review und gegebenenfalls Business Verification nötig.

## Reichweiten- und Postinganalysen

FanMind speichert Snapshots, damit Entwicklung über Zeit vergleichbar bleibt.
Originale Meta-Metriknamen werden auf eine kleine interne Allowlist abgebildet;
unbekannte, negative oder nicht numerische Werte werden verworfen.

Zulässige Kernmetriken:

- Reichweite, Impressionen, Views/Plays;
- Likes, Kommentare, Shares und Saves;
- Link-Klicks, Profilbesuche und Follows, soweit der Endpunkt sie liefert;
- zuordenbare DMs und neu entstandene FanMind-Kontakte;
- Paid Reach und Paid Impressions getrennt von Gesamtwerten.

Berechnungen:

- Interaktionen = Likes + Kommentare + Shares + Saves;
- organische Reichweite = Gesamt-Reichweite minus Paid Reach, nie unter null;
- Engagement-Rate = Interaktionen / Reichweite;
- Save-, Share-, DM- und Kontakt-Conversion-Rate jeweils / Reichweite;
- Vergleich eines Posts mit dem Median historisch vergleichbarer Posts;
- Konfidenz `low` unter 5 Posts oder 1.000 Gesamt-Reichweite, `medium` ab 5
  Posts und 1.000 Reichweite, `high` ab 20 Posts und 10.000 Reichweite.

Die UI muss immer Zeitraum, Stichprobengröße, Quelle und Konfidenz zeigen.
Organisch, bezahlt, Engagement, Leads und Umsatz dürfen nicht als dieselbe
Kennzahl dargestellt werden. Eine Korrelation ist keine Kausalitätsaussage.

## Zulässige Fan- und Gesprächsanalyse

Aus tatsächlich vorhandener Kommunikation dürfen vorsichtig abgeleitet werden:

- Sprache und beobachteter Kommunikationsstil;
- Stimmung nur innerhalb des konkreten Gesprächs und nicht als dauerhafte
  Persönlichkeitseigenschaft;
- ausdrücklich genannte Themen, Interessen, Fragen und Einwände;
- konkrete Absicht, offene Zusagen und nächster sinnvoller Schritt;
- bevorzugte Antwortlänge, Formalität und Reaktionsmuster;
- Antwortzeiten und Verlauf der Beziehung, soweit die Datenbasis dies trägt.

Jeder Bericht enthält Quellenzeitraum, Nachrichtenanzahl, Konfidenz und
Reviewstatus. Er muss korrigierbar, verwerfbar und löschbar sein. Bei weniger
als drei relevanten Nachrichten ist ausdrücklich auf geringe Datenlage
hinzuweisen.

Nicht abgeleitet oder gespeichert werden insbesondere ethnische Herkunft,
politische Meinung, Religion/Weltanschauung, Gewerkschaftszugehörigkeit,
Gesundheit, genetische oder biometrische Identifikation, Sexualleben,
sexuelle Orientierung oder psychologische Diagnosen. Auch Kaufwahrscheinlichkeit
und Persönlichkeit dürfen nicht als Tatsachen ausgegeben werden.

## Analyse des FanMind-Nutzers

Ein Workspace-Schreibstil darf ausschließlich aus Nachrichten lernen, die ein
angemeldeter Nutzer selbst als manuelle ausgehende Nachricht bestätigt hat.
KI-Entwürfe, Notizen, eingehende Fan-Nachrichten und automatisch importierte
Texte sind keine zulässigen Stilbeispiele. Das Profil darf Sprache, Ton,
Satzlänge, Begrüßung, Abschluss, Emoji-Nutzung und wiederkehrende Formulierungen
enthalten. Es bleibt ein editierbarer Arbeitsvorschlag, keine Bewertung der
Person.

## Technische Schutzmaßnahmen

- Meta-Webhook-HMAC und Verify-Token fail-closed;
- OAuth-State an User und Workspace gebunden;
- Owner-/Admin-Prüfung vor Start, Callback und Trennung;
- verschlüsselte Tokens nur über Service Role; Browser erhalten höchstens
  nicht geheime Statusfelder;
- global eindeutige aktive Bindung von Plattform + externer Konto-ID;
- idempotente externe Ereignis-IDs und Schutz vor doppelten Webhooks;
- höchstens 50 Nachrichten pro Analyse beziehungsweise Messenger-Sync-Seite;
- keine Rohinhalte in technischen Diagnoseprotokollen;
- getrennte Datenbankmigration und Staging-Abnahme vor Production;
- Trennen löscht den gespeicherten Zugriffstoken und stoppt weitere Abrufe;
- Datenexport, Korrektur und Löschung müssen die neuen Analysen und
  Metrik-Snapshots einschließen, bevor sie aktiviert werden.
- automatisch erzeugte Content-Objekte, Metrik-Snapshots und Analyseprofile
  werden serverseitig geschrieben; Browserzugriffe sind read-only und
  zusammengesetzte Fremdschlüssel erzwingen denselben Workspace.

## Rechtliches Aktivierungsgate

In `workspace_analysis_settings` sind alle Analysearten standardmäßig
deaktiviert. Eine Aktivierung ist technisch nur zulässig, wenn alle fünf
Punkte auf `confirmed` stehen und die bestätigende Person sowie der Zeitpunkt
gespeichert sind:

1. Rechtsgrundlage für den konkreten Zweck;
2. transparente Information der betroffenen Personen, einschließlich
   Profiling/Analyse und Betroffenenrechten;
3. gültige AVV-/Anbieter- und Transferprüfung für die aktiv verwendeten
   Dienste;
4. verbindliche Nachrichten- und Analyse-Aufbewahrungsfristen.
5. funktionsfähiger Datenexport sowie Korrektur-, Widerspruchs- und
   Löschprozess für Kontakte, Kommunikation, Profile und Metrik-Snapshots.

Vor Drittpersonenbetrieb sind zusätzlich Zweckbindung, Datenminimierung,
Widerspruch/Korrektur/Löschung, Meta-Datenlösch-Callback, Account-Trennung,
Unterauftragsverarbeiter und gegebenenfalls Datenschutz-Folgenabschätzung mit
Rechtsberatung zu prüfen. FanMind darf keine pauschale DSGVO-Konformität
behaupten.

## Abnahmefolge

1. Meta-App-Produkte und Business-Verknüpfungen im Developer Dashboard prüfen.
2. Facebook- und Instagram-Berechtigungen nur für Testkonten einrichten.
3. explizite Seiten-/Instagram-Kontenauswahl fertigstellen.
4. Migration in isoliertem Staging anwenden und RLS-/Token-Negativtests fahren.
5. Nachrichten, Kommentare, Medien und Insights mit synthetischen Daten testen.
6. Trennung, Widerruf, Tokenablauf, Datenexport und Löschung testen.
7. Datenschutzinformation, AVV, Anbieter-/Transferregister und Fristen extern
   freigeben.
8. Meta App Review/Advanced Access abschließen.
9. Erst danach begrenzten Pilot je Workspace aktivieren; kein globaler
   Standardschalter.

Offizielle Prüfeinstiege:

- [Meta Graph API Versions](https://developers.facebook.com/docs/graph-api/changelog/versions/)
- [Instagram Media Insights](https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights)
- [Instagram App Review](https://developers.facebook.com/docs/instagram-platform/app-review)
- [Meta Page Webhooks](https://developers.facebook.com/docs/graph-api/webhooks/reference/page/)
- [Meta Platform Terms](https://developers.facebook.com/terms/dfc_platform_terms/)
- [DSGVO-Grundsätze](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/principles-gdpr_en)
- [DSGVO-Volltext](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng)
