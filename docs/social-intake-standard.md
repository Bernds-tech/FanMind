# Social-Intake-Standard

## Referenz

Facebook Messenger ist der Referenzstandard für den Social Intake. Der aktuelle Stand bleibt: inbound Text-DMs, inbound Bild-DMs und outbound Page-Antworten aus dem Messenger-Verlauf-Sync werden importiert. Es gibt keine automatische Sendefunktion und keine automatische Antwort.

## Standardfelder für Nachrichten

Alle Kanäle sollen `conversation_messages` mit denselben Kernfeldern verwenden:

- `direction`: `inbound` oder `outbound`
- `content`
- `message_kind`: `text`, `image`, `video`, `audio`, `file`, `mixed`, `unknown`
- `attachments`
- `source_platform`, `source_type`, `source_url`, `reply_target_url`
- `external_thread_id`, `external_message_id`, `external_post_id`, `external_video_id` sofern kanalabhängig vorhanden, `external_comment_id`
- `original_author_label`, `original_text_excerpt`
- `seen_at`

Facebook-spezifische IDs bleiben erhalten; neue Kanäle mappen auf dieselben generischen Felder, statt eigene UI-Sondermodelle aufzubauen.

## Inbound, outbound und unread

- Dashboard „Neue Nachrichten“ zeigt nur ungesehene inbound Nachrichten.
- Fans-Liste/blauer Punkt basiert nur auf ungesehenen inbound Nachrichten.
- Fan-Detail zeigt inbound und outbound im gemeinsamen Verlauf.
- Outbound aus Syncs erzeugt keinen neuen Dashboard-Eintrag und keinen blauen Punkt.
- Antworten bleiben Copy-&-Open/manuell im Originalkanal.

## Medien und Attachments

Die gemeinsame Attachment-Logik normalisiert Metadaten und sichere HTTP(S)-URLs. Unterstützte Typen sind `image`, `video`, `audio`, `file`, `mixed`, `unknown`. Die UI zeigt kompakte Bild-Thumbnails und Fallbacks für Video/Audio/File, ohne bei fehlender URL abzustürzen. Keine Bildanalyse, keine Downloads und keine Storage-Architektur in diesem Standard-PR.

## Sync-Zählung

Kanal-Syncs liefern ein einheitliches Ergebnis:

- `checkedConversations`
- `checkedMessages`
- `importedInbound`
- `importedOutbound`
- `importedMedia`
- `skippedDuplicates`
- `errors`
- `syncLimit`
- `lastSyncAt`

Facebook Messenger nutzt 50 Nachrichten je Conversation als Standardlimit. Vorbereitete Kanäle zeigen keine Fake-Zahlen; wenn kein echter Sync existiert, steht im Status „vorbereitet“, „nicht verfügbar“ oder „API-/Freigabe erforderlich“.

## Kanalstatus

Die zentrale Konfiguration in `src/lib/channelSources.ts` beschreibt pro Kanal Fähigkeiten und Status. Mindeststand:

- `facebook_messages`: live, inbound/outbound/media/history-sync, 50er Sync-Limit, kein automatisches Senden.
- `facebook_comments`: geparkt/vorbereitet, kein Live-Test in diesem PR.
- `instagram_messages` und `instagram_comments`: vorbereitet, API-/Freigabe erforderlich.
- `whatsapp_messages`: vorbereitet, Cloud-API-Konfiguration später.
- `tiktok_comments`: vorbereitet, offizielle Freigabe erforderlich, kein Scraping.
- `tiktok_messages`: nicht-live, Export/Data-Portability-Importpfad.
- `email`, `webform`, `manual`: vorbereitet/manuell ohne Fake-Live-Sync.

## Regression-Checkpoint Facebook

Vor Änderungen an Intake oder UI prüfen:

1. inbound Text-DM wird gespeichert.
2. inbound Bild-DM wird mit Attachment sichtbar.
3. outbound Page-Antwort wird über Messenger-Verlauf-Sync importiert.
4. Sync liest bis zu 50 Nachrichten je Conversation.
5. Deduplikation über externe IDs bleibt aktiv.
6. Dashboard/Fans-Unread zählen nur inbound ungesehen.
7. Fan-Detail zeigt Richtung, Kanal, Ursprung und Medien korrekt.
