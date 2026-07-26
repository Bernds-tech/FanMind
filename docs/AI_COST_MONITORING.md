# FanMind KI-Kostenmonitoring

Stand: Juli 2026

Ziel: FanMind soll KI-Kosten beobachten, berechnen und im Adminbereich bzw. perspektivisch pro Workspace sichtbar machen, bevor mehr Kunden, größere Kontaktmengen oder intensivere KI-Features aktiviert werden.

## 1. Warum das wichtig ist

KI-Kosten wachsen nicht nur mit der Anzahl Fans. Sie hängen ab von Anzahl KI-Anfragen, Länge des Gesprächskontexts, Anzahl Memories und Reports im Prompt, Modell, Output-Länge, Nutzungsverhalten je Team, Fan-Anzahl pro Workspace und Features wie Reply Suggestions, Fan Analysis, Summaries oder spätere Kampagnenentwürfe.

Deshalb reicht eine einfache Kostenannahme pro Nutzer nicht aus. FanMind braucht workspace- und feature-basiertes Usage-Monitoring.

## 2. MVP-Status

Aktueller MVP-Schutz:

- KI läuft serverseitig.
- `OPENAI_API_KEY` ist server-only.
- Inputlängen, geladene Nachrichten-/Memory-Zeilen und serialisierte
  Gesamtkontexte sind begrenzt.
- Kommunikationsanalysen laden höchstens 50 aktuelle Nachrichten und 20
  aktuelle Memories; dynamische Analyse- und Antwortkontexte bleiben jeweils
  unter 40.000 serialisierten Zeichen.
- Ein übergebener Analyse-Report für Antwortvorschläge ist auf 12.000 Zeichen
  begrenzt.
- Antwortvorschläge nutzen strukturierte Ausgabe.
- Provider-Ausgaben sind auf 2.048 Tokens je Aufruf begrenzt.
- Antwortvorschläge verwenden das gemeinsame Limit von 20 Aufrufen je
  User/IP in 10 Minuten.
- Kommunikationsanalysen verwenden ein separates gemeinsames Limit von 10
  Aufrufen je Workspace/User in 10 Minuten.
- Ausfall der gemeinsamen Limit-Infrastruktur stoppt den Provider-Aufruf.
- Usage-Events, geschätzte Tokens/Kosten, Admin- und Workspace-Anzeige sind
  implementiert.
- Keine automatische Sendefunktion.

Nächster Schritt:

- den vorbereiteten atomaren Workspace-RPC und die exakten Spaltenrechte nach
  Production-Preflight zweiphasig anwenden und positiv/negativ abnehmen;
- verbindliche Standard-/Plus-/Ultra-Modelle und Monatskontingente schriftlich
  freigeben;
- Workspace-Entitlement und Stripe-Add-on-Lifecycle erst im getrennten Staging
  implementieren und testen;
- Provider-Usage übernehmen, sofern zuverlässig verfügbar.

Die technischen Limits in diesem Abschnitt sind ausschließlich Missbrauchs-,
Verfügbarkeits- und Kostenschutz. Sie sind weder vertragliche Monatskontingente
noch eine automatische Nachberechnung. KI Plus und KI Ultra bleiben
unverändert nicht automatisch buchbar.

Der bestehende Vertragsende-Check an den produktiven KI-Pfaden ist
Lifecycle-Verhalten und keine autoritative Billing-Freigabe. RPC,
deploy-before-migrate App-Kompatibilität mit exaktem Missing-RPC- und
Missing-Spalten-Fallback sowie die exakte Zehn-Spalten-Allowlist sind
vorbereitet. Erst die vollständig
abgenommene Production-Anwendung der additiven Spalten-/RPC-Migration und des
separat kontrollierten Contract-Schritts gemäß
`docs/operations/WORKSPACE_SERVER_OWNED_FIELDS.md` belegt die
server-eigene Feldgrenze. Bis dahin dürfen `billing_status`, Stripe-IDs,
Subscription-Felder und `test_access_flags` nicht als autoritativer
Entitlement-Nachweis verwendet werden.

## 3. Grundformel

Keine Provider-Preise hart im UI verdrahten. Preise ändern sich. Modellpreise müssen serverseitig konfigurierbar sein.

Formel:

`estimated_cost = input_tokens / 1_000_000 * input_price_per_1m_tokens + output_tokens / 1_000_000 * output_price_per_1m_tokens`

Optional können Cents gespeichert werden:

`estimated_cost_cents = round(estimated_cost_eur * 100)`

Solange keine exakten Provider-Usage-Werte gespeichert werden, ist das nur eine Schätzung. Im Adminbereich muss dann `geschätzt` angezeigt werden.

## 4. Preis-Konfiguration

Empfohlene server-only Konfiguration:

- `FANMIND_AI_MODEL`
- `FANMIND_AI_PRICE_INPUT_PER_MILLION_CENTS`
- `FANMIND_AI_PRICE_OUTPUT_PER_MILLION_CENTS`
- optional modellgenau: `FANMIND_AI_PRICE_<NORMALIZED_MODEL>_INPUT_PER_MILLION_CENTS`
- optional modellgenau: `FANMIND_AI_PRICE_<NORMALIZED_MODEL>_OUTPUT_PER_MILLION_CENTS`
- `FANMIND_AI_USAGE_CURRENCY`

`<NORMALIZED_MODEL>` entspricht dem Modellnamen in Großbuchstaben, wobei Nicht-Buchstaben/-Zahlen durch `_` ersetzt werden. Beispiel: `gpt-5.2` wird zu `GPT_5_2`.

Regel:

- UI zeigt Kosten aus berechneten Usage-Daten.
- Code berechnet mit serverseitigen Preisen.
- Doku sagt nicht `fixer Preis pro Request`, sondern erklärt die Formel.

## 5. Aktive Tabelle `ai_usage_events`

Die Migration `supabase/migrations/20260706120000_ai_usage_events.sql` stellt
die Tabelle mit folgenden Feldern bereit:

- `id`
- `workspace_id`
- `user_id`
- `contact_id`
- `feature`
- `provider`
- `model`
- `input_chars`
- `output_chars`
- `estimated_input_tokens`
- `estimated_output_tokens`
- `estimated_total_tokens`
- `estimated_cost_cents`
- `currency`
- `status`
- `error_code`
- `latency_ms`
- `source_route`
- `created_at`

Mögliche Feature-Werte:

- `reply_suggestions`
- `fan_analysis`
- `conversation_summary`
- `memory_suggestion`
- `followup_suggestion`
- `campaign_draft_preview` für später

## 6. RLS für `ai_usage_events`

Aktiver Vertrag:

- Workspace-Owner sieht eigene Usage.
- Workspace-Member sehen nur eigene Workspace-Usage, falls später erlaubt.
- Admin sieht aggregierte Usage über Adminbereich.
- Inserts laufen serverseitig über gesicherte Route, Server Action oder Service Role.
- Normale User sehen keine anderen Workspaces.

## 7. Token-Schätzung

Solange keine exakten Tokenzahlen vom Provider zuverlässig übernommen werden, kann FanMind grob schätzen:

`estimated_tokens = ceil(text_length / 4)`

Das ist nur eine Näherung. Für Admin-Anzeigen muss dann stehen:

- `geschätzt`
- `basierend auf Zeichenlänge`
- `nicht abrechnungsgenau`

Sobald Provider-Usage-Werte verfügbar sind, sollen echte Werte bevorzugt gespeichert werden.

## 8. Wo Usage geloggt werden soll

Aktiv instrumentiert:

1. `/api/ai/reply-suggestions`
2. Kommunikationsanalyse in `src/app/fans/[id]/analysisActions.ts`
3. spätere Conversation-Summaries
4. spätere Kampagnen-/Segment-Entwürfe

Für jeden KI-Call speichern:

- Workspace
- User
- Kontakt
- Feature
- Modell
- Input-Länge
- Output-Länge
- geschätzte Tokens
- geschätzte Kosten
- Status `ok` / `error`
- Error-Code, falls vorhanden
- Latenz
- Route / Feature-Quelle

## 9. Aktive und offene Anzeigen

Der Adminbereich zeigt derzeit:

- KI-Kosten und Tokens geschätzt für den gewählten Zeitraum;
- Anfragen und Fehler;
- Workspaces nach geschätzten Kosten;
- Features nach geschätzten Kosten;
- durchschnittliche geschätzte Kosten pro Request;
- letzte Usage-Events ohne Prompt-/Antwortvolltexte.

Noch offen:

- Tages-/Wochen-Schnellansichten;
- Kosten relativ zur Kontaktanzahl;
- Modellverteilung;
- explizite Spike-/Budgetwarnungen.

Die Workspace-Nutzeransicht zeigt:

- KI-Nutzung im aktuellen Kalendermonat;
- geschätzte Eingabe-/Ausgabe-/Gesamttokens;
- Aufteilung nach Funktion und letzte Ereignisse;
- optionale, rein informative Soft-Hinweisgrenzen;
- Workspace-Unternehmens-Prompt und bis zu acht Antwortprofile zur Qualitätssteuerung, ohne Promptvolltexte in Usage-Events zu speichern.

Später möglich:

- Fehlerquote
- Warnstatus bei ungewöhnlichem Verbrauch;
- verbindliche Kontingentanzeige erst nach Tier-Freigabe.

## 10. Budget- und Warnlogik

Empfohlene Budgetfelder später:

- globales Monatsbudget
- Workspace-Monatsbudget
- Tageslimit pro Workspace
- Request-Limit pro User
- Max-Kontextgröße pro Feature

Warnstufen:

- 50 Prozent Budget: intern beobachten
- 80 Prozent Budget: Admin-Hinweis
- 100 Prozent Budget: weitere KI-Anfragen je nach Plan blockieren oder drosseln
- ungewöhnlicher Spike: Admin-Warnung

## 11. Zusammenhang mit Fan-Anzahl

Kosten sollen im Adminbereich relativ zur Fan-Anzahl gezeigt werden.

Formeln:

- `cost_per_fan = monthly_cost / max(contact_count, 1)`
- `cost_per_100_fans = cost_per_fan * 100`
- `cost_per_1000_fans = cost_per_fan * 1000`

Warum: Ein Workspace mit 10.000 Fans darf absolut mehr kosten als ein Workspace mit 50 Fans, aber die Kosten pro Fan zeigen, ob Nutzung oder Kontextlängen aus dem Ruder laufen.

## 12. Produktgrenzen

- Keine KI-Kosten-Schätzung als echte Rechnung verkaufen.
- Keine falsche Genauigkeit anzeigen.
- Keine Providerpreise hardcodiert im Client.
- Keine Kundendaten im Usage-Log speichern, nur Mengen/Metadaten.
- Kein Prompt-/Antwortvolltext in Usage-Events speichern, sofern nicht explizit und datenschutzrechtlich geprüft.
- Workspace-Prompts werden ausschließlich als begrenzter KI-Eingabekontext verwendet und nie in Kosten-/Usage-Logs ausgegeben.

## 13. Umsetzungsstand

Erledigt:

1. Tabelle/Migration `ai_usage_events`;
2. Server-Helper `recordAiUsageEvent(...)`;
3. Instrumentierung von Antwortvorschlägen und Kommunikationsanalyse;
4. Admin- und Workspace-Nutzungsanzeige;
5. geschätzte, klar gekennzeichnete Tokens/Kosten;
6. serverseitige Providerpreise;
7. fail-closed Kurzzeit-Rate-Limits sowie Datenbank-, Kontext- und
   Ausgabegrenzen;
8. Workspace-Unternehmens-Prompt und auswählbare, begrenzte Antwortprofile mit serverseitiger Profilauflösung.

Offen bleiben echte Provider-Tokenwerte, Kosten pro Kontakt, Budgetwarnungen
und die vertragliche Standard-/Plus-/Ultra-Entitlement-/Billing-Logik
einschließlich einer server-eigenen Autorisierungsquelle.

## 14. Akzeptanzkriterien

- [x] KI-Calls werden serverseitig als Usage-Events gespeichert.
- [x] Workspace-Zuordnung ist vorhanden.
- [x] Admin sieht Verbrauch je Workspace.
- [ ] Admin sieht Kosten pro Fan und pro 100/1.000 Fans.
- [x] UI markiert Werte als geschätzt.
- [x] Keine Secrets oder Prompt-Texte landen im Usage-Log.
- [x] RLS verhindert fremde Workspace-Daten.
- [ ] Beide Workspace-Härtungsmigrationen sind in Production angewendet und
      Billing-/Stripe-/Subscription-/Testzugangsfelder mit Owner-JWT negativ
      abgenommen.
- [x] `README.md`, `AGENTS.md` und `docs/SOURCE_OF_TRUTH.md` bleiben synchron.
