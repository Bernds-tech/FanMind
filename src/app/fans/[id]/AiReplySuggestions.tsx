"use client";

import { useMemo, useState } from "react";
import dashboardStyles from "../../dashboard/dashboard.module.css";
import styles from "./fan-detail.module.css";
import type { ReplyTargetAction } from "@/lib/sourceContext";

export type ReplyMode = { id: string; label: string; prompt: string };

type ReplySuggestion = { tone: string; label: string; text: string };
type AiSuggestionsResult = {
  reply_options: ReplySuggestion[];
  safety_note: string;
};

type Props = {
  contact: {
    contactId: string;
    displayName: string;
    handle: string | null;
    sourcePlatform: string | null;
    language: string | null;
    status: string | null;
    tags: string[] | null;
    summary: string | null;
    storedConversationContext?: string;
    latestInboundMessage?: string;
    analysisReport?: string;
  };
  modes: ReplyMode[];
  originalChannelAction: ReplyTargetAction;
};

export function AiReplySuggestions({
  contact,
  modes,
  originalChannelAction,
}: Props) {
  const [activeModeId, setActiveModeId] = useState(modes[0]?.id ?? "friendly");
  const activeMode = useMemo(
    () => modes.find((mode) => mode.id === activeModeId) ?? modes[0],
    [activeModeId, modes],
  );
  const [suggestions, setSuggestions] = useState<AiSuggestionsResult | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedHelper, setCopiedHelper] = useState<string | null>(null);
  const [telegramDraft, setTelegramDraft] = useState("");
  const [telegramSending, setTelegramSending] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState("");
  const canSendTelegram = contact.sourcePlatform === "telegram";

  async function generateSuggestions(mode = activeMode) {
    setError("");
    setCopiedIndex(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/reply-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contact.contactId,
          displayName: contact.displayName,
          handle: contact.handle,
          sourcePlatform: contact.sourcePlatform,
          language: contact.language || "de",
          status: contact.status,
          tags: contact.tags ?? [],
          summary: contact.summary,
          pastedChatContext: contact.storedConversationContext ?? "",
          incomingMessage: contact.latestInboundMessage ?? "",
          responseMode: `${mode.label}: ${mode.prompt}`,
          analysisReport: contact.analysisReport,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | AiSuggestionsResult
        | { error?: string }
        | null;
      if (!response.ok || !data || !("reply_options" in data)) {
        setError(
          (data && "error" in data && data.error) ||
            "Antwortvorschläge konnten gerade nicht erzeugt werden.",
        );
        return;
      }
      const nextSuggestions = data.reply_options.slice(0, 3);
      setSuggestions({
        ...data,
        reply_options: nextSuggestions,
      });
      setTelegramDraft((current) => current || nextSuggestions[0]?.text || "");
    } catch {
      setError("Antwortvorschläge konnten gerade nicht erzeugt werden.");
    } finally {
      setIsLoading(false);
    }
  }

  async function copySuggestion(text: string, index: number) {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
  }

  async function copyHelper(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setCopiedHelper(label);
  }

  async function sendTelegramDraft() {
    setTelegramStatus("");
    setTelegramSending(true);
    try {
      const response = await fetch("/api/integrations/telegram/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: contact.contactId, text: telegramDraft }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setTelegramStatus(data?.error ?? "Telegram-Nachricht konnte nicht gesendet werden.");
        return;
      }
      setTelegramStatus("Telegram-Nachricht wurde manuell gesendet und dokumentiert.");
      setTelegramDraft("");
    } catch {
      setTelegramStatus("Telegram-Nachricht konnte nicht gesendet werden.");
    } finally {
      setTelegramSending(false);
    }
  }

  return (
    <article
      className={`${styles.card} ${styles.replyCard}`}
      aria-labelledby="ai-replies-title"
    >
      <div className={styles.cardHeader}>
        <div>
          <p className={dashboardStyles.eyebrow}>KI-Antwortvorschläge</p>
          <h3 id="ai-replies-title">Drei Vorschläge</h3>
          <p className={styles.muted}>
            Drei Vorschläge – kopieren und manuell im Originalkanal senden.
          </p>
        </div>
        <span className={styles.statusBadge}>
          Keine automatische Sendefunktion
        </span>
      </div>
      <div className={styles.modeBar} aria-label="Antwort-Richtung wählen">
        {modes.map((mode) => (
          <button
            className={
              mode.id === activeModeId
                ? styles.modeButtonActive
                : styles.modeButton
            }
            key={mode.id}
            onClick={() => {
              setActiveModeId(mode.id);
              void generateSuggestions(mode);
            }}
            type="button"
          >
            {mode.label}
          </button>
        ))}
      </div>
      <div className={styles.replyFooter}>
        <button
          className={dashboardStyles.primaryButton}
          disabled={isLoading || !contact.latestInboundMessage}
          onClick={() => void generateSuggestions()}
          type="button"
        >
          {isLoading ? "Vorschläge werden erzeugt…" : "KI-Vorschläge erzeugen"}
        </button>
        {!contact.latestInboundMessage ? (
          <span>Keine eingehende Nachricht als Kontext vorhanden.</span>
        ) : null}
      </div>
      {error ? (
        <p className={dashboardStyles.error} role="alert">
          <strong>{error}</strong>
        </p>
      ) : null}
      <div className={styles.suggestionGrid} aria-live="polite">
        {(suggestions?.reply_options ?? []).map((option, index) => (
          <article
            className={styles.suggestionCard}
            key={`${option.tone}-${index}`}
          >
            <div className={styles.replyCardHeader}>
              <div>
                <strong>{option.label || `Vorschlag ${index + 1}`}</strong>
                <p className={styles.muted}>
                  {option.tone || activeMode?.label}
                </p>
              </div>
            </div>
            <p>{option.text}</p>
            {canSendTelegram ? (
              <button
                className={dashboardStyles.secondaryButton}
                onClick={() => setTelegramDraft(option.text)}
                type="button"
              >
                Als Telegram-Entwurf übernehmen
              </button>
            ) : null}
            <div className={styles.replyCardActions}>
              <button
                className={dashboardStyles.secondaryButton}
                onClick={() => void copySuggestion(option.text, index)}
                type="button"
              >
                {copiedIndex === index ? "Kopiert" : "Kopieren"}
              </button>
              {originalChannelAction.href ? (
                <a
                  className={dashboardStyles.secondaryButton}
                  href={originalChannelAction.href}
                  rel="noreferrer"
                  target="_blank"
                  title={originalChannelAction.reason}
                >
                  {originalChannelAction.label}
                </a>
              ) : (
                <button
                  className={dashboardStyles.secondaryButton}
                  disabled
                  type="button"
                >
                  {originalChannelAction.disabledHint}
                </button>
              )}
            </div>
            {(originalChannelAction.quality === "attempted_thread_link" ||
              originalChannelAction.quality === "inbox_fallback") ? (
              <div className={styles.fallbackHelp}>
                <p className={styles.muted}>
                  Meta öffnet eventuell die zuletzt aktive Unterhaltung. Für direkten Zugriff bitte einmal den exakten Chat-Link speichern. Bitte im Postfach manuell auswählen:{" "}
                  {originalChannelAction.fallbackContactLabel ??
                    contact.displayName}
                  {originalChannelAction.fallbackContactId
                    ? ` · Facebook-ID: ${originalChannelAction.fallbackContactId}`
                    : ""}
                </p>
                <button
                  className={dashboardStyles.secondaryButton}
                  onClick={() =>
                    void copyHelper(
                      originalChannelAction.fallbackContactLabel ??
                        contact.displayName,
                      "name",
                    )
                  }
                  type="button"
                >
                  {copiedHelper === "name"
                    ? "Fanname kopiert"
                    : "Fanname kopieren"}
                </button>
                {originalChannelAction.fallbackContactId ? (
                  <button
                    className={dashboardStyles.secondaryButton}
                    onClick={() =>
                      void copyHelper(
                        originalChannelAction.fallbackContactId ?? "",
                        "facebook-id",
                      )
                    }
                    type="button"
                  >
                    {copiedHelper === "facebook-id"
                      ? "Facebook-ID kopiert"
                      : "Facebook-ID kopieren"}
                  </button>
                ) : null}
              </div>
            ) : null}
          </article>
        ))}
      </div>
      {canSendTelegram ? (
        <div className={styles.fallbackHelp}>
          <strong>Manueller Telegram-Antwortfluss</strong>
          <p className={styles.muted}>
            FanMind sendet nur nach deinem Klick. Keine automatischen Antworten. Prüfe den Entwurf vor dem Versand.
          </p>
          <label>
            Antwortentwurf
            <textarea
              value={telegramDraft}
              onChange={(event) => setTelegramDraft(event.target.value)}
              placeholder="Geprüften Telegram-Antwortentwurf eingeben …"
              rows={5}
            />
          </label>
          <button
            className={dashboardStyles.primaryButton}
            disabled={telegramSending || !telegramDraft.trim()}
            onClick={() => void sendTelegramDraft()}
            type="button"
          >
            {telegramSending ? "Sende manuell …" : "Manuell über Telegram senden"}
          </button>
          {telegramStatus ? <p className={styles.muted}>{telegramStatus}</p> : null}
        </div>
      ) : null}
      <p className={styles.reportSafetyNote}>
        {suggestions?.safety_note ??
          "FanMind schlägt nur Text vor. Der Mensch kopiert, prüft und sendet manuell im Originalkanal."}
      </p>
    </article>
  );
}
