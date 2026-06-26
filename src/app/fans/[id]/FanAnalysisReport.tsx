"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { FanMindLanguage } from "@/lib/fanmindCopy";
import { wt } from "@/lib/workspaceCopy";
import dashboardStyles from "../../dashboard/dashboard.module.css";
import { analyzeFan, type FanAnalysisActionState } from "../actions";
import styles from "./fan-detail.module.css";

type Report = {
  report_json: Record<string, unknown> | null;
  summary: string | null;
  source_message_count: number | null;
  generated_at: string | null;
  updated_at?: string | null;
} | null;

type Props = {
  contactId: string;
  initialReport: Report;
  loadError?: string;
  locale?: FanMindLanguage;
  hasNewMessages?: boolean;
};

const initialState: FanAnalysisActionState = { ok: false, message: "" };

export function FanAnalysisReport({ contactId, initialReport, loadError, locale = "de", hasNewMessages = false }: Props) {
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
          <h3>{wt(locale, "Fan-Analyse-Report")}</h3>
          <p className={styles.reportIntro}>
            {locale === "en"
              ? "AI report from stored messages, notes, memories, and contact context. Insights stay careful communication guidance, not a diagnosis."
              : "KI-Report aus gespeicherten Nachrichten, Notizen, Memories und Kontaktkontext. Einschätzungen bleiben vorsichtige kommunikative Hinweise und keine Diagnose."}
          </p>
        </div>
      </div>
      <form action={formAction} className={styles.inlineForm}>
        <input name="contact_id" type="hidden" value={contactId} />
        <input name="locale" type="hidden" value={locale} />
        <button className={dashboardStyles.secondaryButton} disabled={pending} type="submit">
          {pending
            ? locale === "en"
              ? "Creating analysis…"
              : "Analyse wird erstellt…"
            : report
              ? locale === "en"
                ? "Update analysis"
                : "Analyse aktualisieren"
              : wt(locale, "Fan analysieren")}
        </button>
      </form>
      <div aria-live="polite">
        {pending ? (
          <p className={styles.safeNotice}>
            {locale === "en" ? "Creating analysis… The report will be shown right after saving." : "Analyse wird erstellt… Der Report wird nach dem Speichern sofort angezeigt."}
          </p>
        ) : null}
        {state.message ? (
          <p className={state.ok ? styles.safeNotice : dashboardStyles.error}>
            <strong>{state.ok ? (locale === "en" ? "Analysis saved." : "Analyse gespeichert.") : (locale === "en" ? "Analysis could not be created. Please try again." : "Analyse konnte nicht erstellt werden. Bitte erneut versuchen.")}</strong>
            <span>{state.message}</span>
          </p>
        ) : null}
      </div>
      {loadError ? (
        <p className={dashboardStyles.error}>
          <strong>{locale === "en" ? "Analysis report could not be loaded." : "Analyse-Report konnte nicht geladen werden."}</strong>
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
          {hasNewMessages ? (
            <p className={styles.safeNotice}>{locale === "en" ? "New messages since the last analysis are available." : "Neue Nachrichten seit letzter Analyse vorhanden."}</p>
          ) : null}
          <p className={styles.muted}>
            {locale === "en" ? "Source" : "Quelle"}: {report?.source_message_count ?? 0} {locale === "en" ? "messages" : "Nachrichten"} · {locale === "en" ? "Last updated" : "Zuletzt aktualisiert"}: {(report?.updated_at ?? report?.generated_at) ? formatDate((report.updated_at ?? report.generated_at) as string, locale) : locale === "en" ? "not generated yet" : "noch nicht erzeugt"}
          </p>
          <p className={styles.reportSafetyNote}>
            {locale === "en"
              ? "Please read as careful communication guidance: no medical or psychological diagnosis, no hard sensitive claims."
              : "Bitte als vorsichtige Kommunikationshilfe lesen: keine medizinische oder psychologische Diagnose, keine harten sensiblen Behauptungen."}
          </p>
        </div>
      ) : (
        <EmptyState
          title={wt(locale, "Noch kein Fan-Analyse-Report vorhanden.")}
          body={locale === "en" ? "Click “Analyze fan” to save a careful communication report from up to 50 messages, notes, memories, and contact details." : "Klicke auf „Fan analysieren“, um aus bis zu 50 Nachrichten, Notizen, Memories und Kontaktinformationen einen vorsichtigen Kommunikationsreport zu speichern."}
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

function formatDate(value: string, locale: FanMindLanguage) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className={dashboardStyles.emptyState}>
      <strong>{title}</strong>
      {body ? <p>{body}</p> : null}
    </div>
  );
}
