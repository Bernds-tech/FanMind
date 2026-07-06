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
- Inputlängen sind begrenzt.
- Antwortvorschläge nutzen strukturierte Ausgabe.
- Rate Limit ist vorhanden.
- Keine automatische Sendefunktion.

Nächster Schritt:

- Usage-Events loggen.
- Token grob schätzen oder Provider-Usage übernehmen, sofern verfügbar.
- Kosten je Modell über serverseitige Konfiguration berechnen.
- Adminbereich mit Verbrauchsanzeige ergänzen.

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
- `FANMIND_AI_INPUT_EUR_PER_1M_TOKENS`
- `FANMIND_AI_OUTPUT_EUR_PER_1M_TOKENS`
- `FANMIND_AI_MONTHLY_WORKSPACE_BUDGET_CENTS`
- `FANMIND_AI_GLOBAL_MONTHLY_BUDGET_CENTS`

Regel:

- UI zeigt Kosten aus berechneten Usage-Daten.
- Code berechnet mit serverseitigen Preisen.
- Doku sagt nicht `fixer Preis pro Request`, sondern erklärt die Formel.

## 5. Vorgeschlagene Tabelle `ai_usage_events`

Für den Ausbau sollte eine Tabelle oder gleichwertige Storage-Struktur mit diesen Feldern entstehen:

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

Erwartung:

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

MVP-Priorität:

1. `/api/ai/reply-suggestions`
2. Fan-Analyse in `src/app/fans/actions.ts`
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

## 9. Adminbereich: gewünschte Anzeigen

Globale Admin-Übersicht:

- KI-Kosten geschätzt heute
- KI-Kosten geschätzt diese Woche
- KI-Kosten geschätzt dieser Monat
- Anfragen heute / Monat
- Top Workspaces nach Kosten
- Top Features nach Kosten
- Fehlerquote
- Durchschnittliche Kosten pro Request
- Modellverteilung

Workspace-Detail im Adminbereich:

- Workspace-Name
- Plan / Commercial Option
- Anzahl Fans/Kontakte
- KI-Anfragen im Zeitraum
- geschätzte Kosten im Zeitraum
- Kosten pro Fan
- Kosten pro 100 Fans
- Kosten pro 1.000 Fans
- letzte KI-Anfragen
- Warnstatus: ok / auffällig / Budget überschritten

Kundenansicht optional:

- KI-Nutzung im aktuellen Monat
- ungefährer Verbrauch
- Hinweis, falls Limit erreicht wird

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

## 13. Minimaler Codex-Task für Umsetzung

Wenn dieses Feature gebaut wird, soll Codex klein starten:

1. Tabelle/Migration `ai_usage_events` erstellen.
2. Server-Helper `recordAiUsageEvent(...)` bauen.
3. `/api/ai/reply-suggestions` instrumentieren.
4. Fan-Analyse instrumentieren.
5. Admin-Seite `KI-Verbrauch` bauen.
6. Nur geschätzte Werte anzeigen, klar als geschätzt markiert.
7. Keine Preise im Client hardcoden.
8. Security-/RLS-/Secrets-Check aktualisieren.

## 14. Akzeptanzkriterien

- [ ] KI-Calls werden serverseitig als Usage-Events gespeichert.
- [ ] Workspace-Zuordnung ist vorhanden.
- [ ] Admin sieht Verbrauch je Workspace.
- [ ] Admin sieht Kosten pro Fan und pro 100/1.000 Fans.
- [ ] UI markiert Werte als geschätzt.
- [ ] Keine Secrets oder Prompt-Texte landen im Usage-Log.
- [ ] RLS verhindert fremde Workspace-Daten.
- [ ] `README.md`, `AGENTS.md` und `docs/SOURCE_OF_TRUTH.md` bleiben synchron.
