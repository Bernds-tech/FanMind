"use client";

import { useState } from "react";

type Props = {
  status: string;
  packageName: string;
  effectiveAt: string | null;
  canManage: boolean;
  archiveMode: boolean;
};

export function SubscriptionManager({ status, packageName, effectiveAt, canManage, archiveMode }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const pending = Boolean(effectiveAt && !archiveMode);

  async function run(action: "cancel" | "resume") {
    if (action === "cancel") {
      const text = effectiveAt
        ? `Die Kündigung wird zum ${new Date(effectiveAt).toLocaleDateString("de-DE")} wirksam. Fortfahren?`
        : "Die Kündigung wird zum frühestmöglichen Vertragsende vorgemerkt. Fortfahren?";
      if (!window.confirm(text)) return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/settings/subscription/${action}`, { method: "POST" });
      const json = (await response.json().catch(() => ({}))) as { error?: string; effectiveAt?: string };
      if (!response.ok) throw new Error(json.error ?? "Aktion fehlgeschlagen");
      setMessage(action === "cancel" ? `Kündigung vorgemerkt${json.effectiveAt ? ` bis ${new Date(json.effectiveAt).toLocaleDateString("de-DE")}` : ""}.` : "Kündigung wurde zurückgenommen.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Aktion fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section style={{ maxWidth: 840, margin: "40px auto", padding: 24, border: "1px solid #28405f", borderRadius: 20, background: "#071426", color: "#f8fafc" }}>
      <p style={{ color: "#67e8f9", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>Abo verwalten</p>
      <h1 style={{ marginTop: 6 }}>FanMind-Paket</h1>
      <dl style={{ display: "grid", gridTemplateColumns: "minmax(160px, 1fr) 2fr", gap: 12, marginTop: 24 }}>
        <dt>Paket</dt><dd>{packageName}</dd>
        <dt>Status</dt><dd>{archiveMode ? "Beendet · Archivmodus" : pending ? "Kündigung vorgemerkt" : status}</dd>
        <dt>Wirksames Vertragsende</dt><dd>{effectiveAt ? new Date(effectiveAt).toLocaleDateString("de-DE") : "Noch nicht vorgemerkt"}</dd>
      </dl>

      {archiveMode ? (
        <div style={{ marginTop: 24, padding: 16, borderRadius: 14, background: "#111c2f" }}>
          <strong>Archivmodus aktiv.</strong>
          <p>Login und bestehende Daten bleiben verfügbar. Neue Nachrichten, Kanalsynchronisierung, KI-Antworten und Analysen sind deaktiviert.</p>
        </div>
      ) : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
        {!canManage ? <p>Nur der Workspace-Owner kann das Abo verwalten.</p> : pending ? (
          <button type="button" disabled={busy} onClick={() => run("resume")} style={{ padding: "12px 18px", borderRadius: 999, border: "1px solid #67e8f9", background: "transparent", color: "#e6fbff", fontWeight: 700 }}>
            Kündigung zurücknehmen
          </button>
        ) : archiveMode ? null : (
          <button type="button" disabled={busy} onClick={() => run("cancel")} style={{ padding: "12px 18px", borderRadius: 999, border: "1px solid #fda4af", background: "#3f1725", color: "#fff1f2", fontWeight: 700 }}>
            Zum Vertragsende kündigen
          </button>
        )}
        <a href="/settings/package" style={{ padding: "12px 18px", color: "#67e8f9" }}>Zurück zum Paket</a>
      </div>
      {message ? <p role="status" style={{ marginTop: 18 }}>{message}</p> : null}
    </section>
  );
}
