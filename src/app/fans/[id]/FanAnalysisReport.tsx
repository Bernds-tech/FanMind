"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dashboardStyles from "../../dashboard/dashboard.module.css";
import { analyzeFan, type FanAnalysisActionState } from "../actions";
import styles from "./fan-detail.module.css";

type Report = {
  report_json: Record<string, unknown> | null;
  summary: string | null;
  source_message_count: number | null;
  generated_at: string | null;
} | null;

type Props = {
  contactId: string;
  initialReport: Report;
  loadError?: string;
};

const initialState: FanAnalysisActionState = { ok: false, message: "" };

export function FanAnalysisReport({ contactId, initialReport, loadError }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(analyzeFan, initialState);
  const report = state.report ?? initialReport;
  const reportSections = buildStoredFanAnalysisReportSections(report);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [router, state.ok, state.generatedAt]);

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h3>Fan-Analyse-Report</h3>
          <p className={styles.reportIntro}>
            KI-Report aus gespeicherten Nachrichten. Einschätzungen bleiben vorsichtige kommunikative Hinweise und keine Diagnose.
          </p>
        </div>
      </div>
      <form action={formAction} className={styles.inlineForm}>
        <input name="contact_id" type="hidden" value={contactId} />
        <button className={dashboardStyles.secondaryButton} disabled={pending} type="submit">
          {pending ? "Analyse wird erstellt …" : report ? "Analyse aktualisieren" : "Fan analysieren"}
        </button>
      </form>
      <div aria-live="polite">
        {pending ? <p className={styles.safeNotice}>Analyse wird erstellt … Der Report wird nach dem Speichern sofort angezeigt.</p> : null}
        {state.message ? (
          <p className={state.ok ? styles.safeNotice : dashboardStyles.error}>
            <strong>{state.ok ? "Analyse gespeichert." : "Analyse konnte nicht erstellt werden."}</strong>
            <span>{state.message}</span>
          </p>
        ) : null}
      </div>
      {loadError ? (
        <p className={dashboardStyles.error}>
          <strong>Analyse-Report konnte nicht geladen werden.</strong>
          <span>{loadError}</span>
        </p>
      ) : null}
      {reportSections.length ? (
        <div className={styles.reportSectionList}>
          {reportSections.map((section) => (
            <section className={styles.reportSection} key={section.title}>
              <div className={styles.reportSectionHeader}>
                <strong>{section.title}</strong>
              </div>
              <p>{section.content}</p>
            </section>
          ))}
          <p className={styles.muted}>
            Quelle: {report?.source_message_count ?? 0} Nachrichten · {report?.generated_at ? formatDate(report.generated_at) : "noch nicht erzeugt"}
          </p>
          <p className={styles.reportSafetyNote}>
            Bitte als vorsichtige Kommunikationshilfe lesen: keine medizinische oder psychologische Diagnose, keine harten sensiblen Behauptungen.
          </p>
        </div>
      ) : (
        <EmptyState
          title="Noch kein Fan-Analyse-Report vorhanden."
          body="Klicke auf „Fan analysieren“, um aus bis zu 50 Nachrichten und internen Notizen einen vorsichtigen Kommunikationsreport zu speichern."
        />
      )}
    </article>
  );
}

function buildStoredFanAnalysisReportSections(report: Report) {
  if (!report?.report_json) return [];
  const values = report.report_json;
  const entries: Array<[string, string]> = [
    ["Kurzprofil", stringValue(values.kurzprofil) || report.summary || ""],
    ["Kommunikationsstil", stringValue(values.kommunikationsstil)],
    ["Stimmung / emotionale Tendenz", stringValue(values.stimmung)],
    ["Interessen & Trigger", stringValue(values.interessen_trigger)],
    ["Kauf-/Reaktionswahrscheinlichkeit", stringValue(values.kauf_reaktion)],
    ["Empfohlener Antwortstil", stringValue(values.antwortstil)],
    ["Vorsicht / No-Gos", stringValue(values.no_gos)],
    ["Optionale spirituelle oder energetische Hinweise", stringValue(values.spirituell)],
  ];
  return entries.filter(([, content]) => content.trim()).map(([title, content]) => ({ title, content }));
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : Array.isArray(value) ? value.join(", ") : "";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className={dashboardStyles.emptyState}>
      <strong>{title}</strong>
      {body ? <p>{body}</p> : null}
    </div>
  );
}
