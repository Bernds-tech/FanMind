"use client";

import { useState } from "react";
import dashboardStyles from "../../dashboard/dashboard.module.css";
import styles from "../fans.module.css";

type ContactAiContext = {
  contactId: string;
  displayName: string;
  handle: string | null;
  sourcePlatform: string | null;
  language: string | null;
  status: string | null;
  tags: string[] | null;
  summary: string | null;
};

type ReplySuggestion = {
  tone: string;
  label: string;
  text: string;
};

type AiSuggestionsResult = {
  reply_options: ReplySuggestion[];
  suggested_memory: {
    content: string;
    importance: string;
  };
  suggested_followup: {
    recommended: boolean;
    in_days: number | null;
    reason: string;
  };
  safety_note: string;
};

type AiReplySuggestionsProps = {
  contact: ContactAiContext;
};

const genericError = "Antwortvorschläge konnten gerade nicht erzeugt werden.";

export function AiReplySuggestions({ contact }: AiReplySuggestionsProps) {
  const [pastedChatContext, setPastedChatContext] = useState("");
  const [incomingMessage, setIncomingMessage] = useState("");
  const [suggestions, setSuggestions] = useState<AiSuggestionsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedTone, setCopiedTone] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCopiedTone("");
    setSuggestions(null);

    if (!incomingMessage.trim()) {
      setError(genericError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/reply-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contactId: contact.contactId,
          displayName: contact.displayName,
          handle: contact.handle,
          sourcePlatform: contact.sourcePlatform,
          language: contact.language || "de",
          status: contact.status,
          tags: contact.tags ?? [],
          summary: contact.summary,
          pastedChatContext,
          incomingMessage,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | AiSuggestionsResult
        | { error?: string }
        | null;

      if (!response.ok || !data || !("reply_options" in data)) {
        setError(genericError);
        return;
      }

      setSuggestions(data);
    } catch {
      setError(genericError);
    } finally {
      setIsLoading(false);
    }
  }

  async function copySuggestion(option: ReplySuggestion) {
    try {
      await navigator.clipboard.writeText(option.text);
      setCopiedTone(option.tone);
    } catch {
      setCopiedTone("");
    }
  }

  return (
    <section
      className={styles.aiAssistantCard}
      aria-labelledby="fanmind-ai-title"
    >
      <div className={dashboardStyles.moduleHeader}>
        <div>
          <p className={dashboardStyles.eyebrow}>KI-Antwortvorschläge</p>
          <h2 id="fanmind-ai-title">FanMind-Assistent</h2>
        </div>
        <span>Serverseitig</span>
      </div>

      <form className={styles.aiComposer} onSubmit={handleSubmit}>
        <label htmlFor="pasted_chat_context">
          <span>Chatverlauf einfügen</span>
          <textarea
            id="pasted_chat_context"
            maxLength={12000}
            name="pasted_chat_context"
            onChange={(event) => setPastedChatContext(event.target.value)}
            placeholder="Optional: Füge hier den bisherigen manuellen Chatverlauf ein."
            value={pastedChatContext}
          />
        </label>
        <p className={styles.fieldHint}>
          Füge hier bei Bedarf den bisherigen WhatsApp- oder Chatverlauf ein.
          FanMind synchronisiert aktuell keine externen Plattformen.
        </p>

        <label htmlFor="incoming_message">
          <span>Neue Nachricht</span>
          <textarea
            id="incoming_message"
            maxLength={4000}
            name="incoming_message"
            onChange={(event) => setIncomingMessage(event.target.value)}
            placeholder="Füge hier die letzte eingegangene Nachricht ein, auf die du antworten möchtest."
            required
            value={incomingMessage}
          />
        </label>

        <div className={styles.aiActions}>
          <button
            className={dashboardStyles.primaryButton}
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "FanMind erzeugt Vorschläge…" : "KI-Vorschläge erzeugen"}
          </button>
          <span>Keine automatische Sendefunktion.</span>
        </div>
      </form>

      {error ? (
        <p className={styles.aiError} role="alert">
          {error}
        </p>
      ) : null}

      {suggestions ? (
        <div className={styles.aiResults} aria-live="polite">
          <div className={styles.replyCards}>
            {suggestions.reply_options.map((option) => (
              <article className={styles.replyCard} key={option.tone}>
                <div className={styles.replyCardHeader}>
                  <strong>{option.label}</strong>
                  <button
                    className={dashboardStyles.secondaryButton}
                    onClick={() => copySuggestion(option)}
                    type="button"
                  >
                    {copiedTone === option.tone ? "Kopiert" : "Kopieren"}
                  </button>
                </div>
                <p>{option.text}</p>
              </article>
            ))}
          </div>

          <div className={styles.suggestionMetaGrid}>
            <article>
              <span>Suggested Memory</span>
              <strong>Noch nicht gespeichert</strong>
              <p>{suggestions.suggested_memory.content || "Keine Memory-Notiz empfohlen."}</p>
              <small>Wichtigkeit: {suggestions.suggested_memory.importance}</small>
            </article>
            <article>
              <span>Suggested Follow-up</span>
              <strong>Noch nicht gespeichert</strong>
              <p>{suggestions.suggested_followup.reason}</p>
              <small>
                {suggestions.suggested_followup.recommended
                  ? `Empfohlen in ${suggestions.suggested_followup.in_days ?? "?"} Tagen`
                  : "Kein Follow-up empfohlen"}
              </small>
            </article>
          </div>

          <p className={styles.aiSafetyNote}>{suggestions.safety_note}</p>
        </div>
      ) : null}
    </section>
  );
}
