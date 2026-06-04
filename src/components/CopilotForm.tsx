"use client";

import { useState } from "react";

type ReplyOption = {
  label: string;
  text: string;
};

type CopilotReply = {
  reply_options: ReplyOption[];
  suggested_memory: string;
  suggested_followup: {
    needed: boolean;
    due_in_days: number;
    reason: string;
  };
};

type CopilotFormProps = {
  fanId: string;
  initialMessage: string;
};

export default function CopilotForm({ fanId, initialMessage }: CopilotFormProps) {
  const [message, setMessage] = useState(initialMessage);
  const [result, setResult] = useState<CopilotReply | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setCopiedLabel(null);

    try {
      const response = await fetch("/api/copilot/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fanId, message })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Antwortvorschlaege konnten nicht erzeugt werden.");
      }

      setResult(data);
    } catch (requestError) {
      setResult(null);
      setError(requestError instanceof Error ? requestError.message : "Unbekannter Fehler beim Copilot-Aufruf.");
    } finally {
      setIsLoading(false);
    }
  }

  async function copyReply(option: ReplyOption) {
    if (!navigator.clipboard) {
      setError("Kopieren ist in diesem Browser nicht verfuegbar.");
      return;
    }

    await navigator.clipboard.writeText(option.text);
    setCopiedLabel(option.label);
  }

  return (
    <section className="section copilot-workspace">
      <div>
        <h2>Neue Nachricht auswerten</h2>
        <p className="lead">
          Neue Nachricht des Fans/Kontakts einfuegen, Copilot starten und Vorschlaege manuell pruefen. FanMind sendet nichts automatisch.
        </p>
      </div>

      <form className="card copilot-form" onSubmit={handleSubmit}>
        <label htmlFor="fan-message">Neue Nachricht des Fans/Kontakts einfuegen</label>
        <textarea
          id="fan-message"
          value={message}
          rows={6}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Fan-Nachricht hier einfuegen..."
          required
        />
        <button className="button primary" type="submit" disabled={isLoading || message.trim().length === 0}>
          {isLoading ? "Copilot laeuft..." : "Antwortvorschlaege erzeugen"}
        </button>
        <p className="form-note">
          FanMind erstellt Vorschlaege. Die finale Nachricht wird immer vom Menschen geprueft und manuell gesendet.
        </p>
      </form>

      {isLoading ? (
        <article className="card status-card">
          <div className="badge">Ladezustand</div>
          <p>Fan-Kontext wird serverseitig geladen und die KI erzeugt Vorschlaege...</p>
        </article>
      ) : null}

      {error ? (
        <article className="card error-card" role="alert">
          <div className="badge">Fehler</div>
          <h3>Copilot konnte nicht gestartet werden</h3>
          <p>{error}</p>
        </article>
      ) : null}

      {result ? (
        <div className="copilot-results">
          <section className="section nested-section">
            <h2>2 bis 3 Antwortvorschlaege</h2>
            <p className="lead">Diese KI-Vorschlaege sind vorbereitet. Sie werden nicht automatisch gesendet.</p>
            <div className="grid">
              {result.reply_options.map((option) => (
                <article className="card" key={option.label}>
                  <div className="badge">{option.label}</div>
                  <p>{option.text}</p>
                  <button className="button" type="button" onClick={() => copyReply(option)}>
                    {copiedLabel === option.label ? "Kopiert" : "Antwort kopieren"}
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="section nested-section">
            <h2>Memory- und Follow-up-Empfehlung</h2>
            <div className="grid two-column-grid">
              <article className="card">
                <div className="badge">Memory-Vorschlag</div>
                <p>{result.suggested_memory}</p>
              </article>
              <article className="card">
                <div className="badge">Follow-up-Vorschlag</div>
                <p>
                  {result.suggested_followup.needed
                    ? `In ${result.suggested_followup.due_in_days} Tagen nachfassen: ${result.suggested_followup.reason}`
                    : `Kein Follow-up noetig: ${result.suggested_followup.reason}`}
                </p>
              </article>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
