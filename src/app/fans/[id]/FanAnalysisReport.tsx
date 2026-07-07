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
  storedMessageCount?: number;
};

const initialState: FanAnalysisActionState = { ok: false, message: "" };

export function FanAnalysisReport({
  contactId,
  initialReport,
  loadError,
  locale = "de",
  hasNewMessages = false,
  storedMessageCount = 0,
}: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(analyzeFan, initialState);
  const report = state.report ?? initialReport;
  const effectiveMessageCount =
    report?.source_message_count ?? storedMessageCount;
  const reportSections = buildStoredFanAnalysisReportSections(report, locale);
  const isLowData = effectiveMessageCount < 3;

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
              ? "AI report from stored messages, notes, AI info, and contact context. Insights stay careful communication guidance, not a diagnosis."
              : "KI-Report aus gespeicherten Nachrichten, Notizen, AI-Infos und Kontaktkontext. Einschätzungen bleiben vorsichtige kommunikative Hinweise und keine Diagnose."}
          </p>
        </div>
      </div>
      <form action={formAction} className={styles.inlineForm}>
        <input name="contact_id" type="hidden" value={contactId} />
        <input name="locale" type="hidden" value={locale} />
        <button
          className={dashboardStyles.secondaryButton}
          disabled={pending}
          type="submit"
        >
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
            {locale === "en"
              ? "Creating analysis… The report will be shown right after saving."
              : "Analyse wird erstellt… Der Report wird nach dem Speichern sofort angezeigt."}
          </p>
        ) : null}
        {state.message ? (
          <p className={state.ok ? styles.safeNotice : dashboardStyles.error}>
            <strong>
              {state.ok
                ? locale === "en"
                  ? "Analysis saved."
                  : "Analyse gespeichert."
                : locale === "en"
                  ? "Analysis could not be created. Please try again."
                  : "Analyse konnte nicht erstellt werden. Bitte erneut versuchen."}
            </strong>
            <span>{state.message}</span>
          </p>
        ) : null}
      </div>
      {loadError ? (
        <p className={dashboardStyles.error}>
          <strong>
            {locale === "en"
              ? "Analysis report could not be loaded."
              : "Analyse-Report konnte nicht geladen werden."}
          </strong>
          <span>{loadError}</span>
        </p>
      ) : null}
      <div className={styles.reportSectionList}>
        {isLowData ? (
          <div className={styles.safeNotice}>
            <strong>
              {locale === "en"
                ? "Not enough saved messages yet for a complete analysis."
                : "Noch zu wenig gespeicherte Nachrichten für eine vollständige Analyse."}
            </strong>
            <span>
              {locale === "en"
                ? "Use the message history or manual messages to improve the analysis."
                : "Nutze den Nachrichtenverlauf oder manuelle Nachrichten, um die Analyse zu verbessern."}
            </span>
          </div>
        ) : null}
        {reportSections.length ? (
          <>
            {reportSections.map((section) => (
              <section className={styles.reportSection} key={section.title}>
                <div className={styles.reportSectionHeader}>
                  <strong>{section.title}</strong>
                </div>
                <p>{section.content}</p>
              </section>
            ))}
            {hasNewMessages ? (
              <p className={styles.safeNotice}>
                {locale === "en"
                  ? "New messages since the last analysis are available."
                  : "Neue Nachrichten seit letzter Analyse vorhanden."}
              </p>
            ) : null}
            <p className={styles.muted}>
              {locale === "en" ? "Source" : "Quelle"}: {effectiveMessageCount}{" "}
              {locale === "en" ? "messages" : "Nachrichten"} ·{" "}
              {locale === "en" ? "Last updated" : "Zuletzt aktualisiert"}:{" "}
              {(report?.updated_at ?? report?.generated_at)
                ? formatDate(
                    (report.updated_at ?? report.generated_at) as string,
                    locale,
                  )
                : locale === "en"
                  ? "not generated yet"
                  : "noch nicht erzeugt"}
            </p>
            <p className={styles.reportSafetyNote}>
              {locale === "en"
                ? "Please read as careful communication guidance: no medical or psychological diagnosis, no hard sensitive claims."
                : "Bitte als vorsichtige Kommunikationshilfe lesen: keine medizinische oder psychologische Diagnose, keine harten sensiblen Behauptungen."}
            </p>
          </>
        ) : (
          <EmptyState
            title={wt(locale, "Noch kein Fan-Analyse-Report vorhanden.")}
            body={
              locale === "en"
                ? "Click “Analyze fan” to save a careful communication report from up to 50 messages, notes, AI info, and contact details."
                : "Klicke auf „Fan analysieren“, um aus bis zu 50 Nachrichten, Notizen, AI-Infos und Kontaktinformationen einen vorsichtigen Kommunikationsreport zu speichern."
            }
          />
        )}
      </div>
    </article>
  );
}

function buildStoredFanAnalysisReportSections(
  report: Report,
  locale: FanMindLanguage,
) {
  if (!report?.report_json) return [];
  const values = normalizeReportJson(report.report_json);
  const neutral = getNeutralAnalysisTexts(locale);
  const entries: Array<[string, string, boolean?]> = [
    [
      "Kurzprofil",
      readableValue(values.kurzprofil) || report.summary || neutral.kurzprofil,
    ],
    [
      "Kommunikationsstil",
      readableValue(values.kommunikationsstil) || neutral.kommunikationsstil,
    ],
    [
      "Stimmung / emotionale Tendenz",
      readableValue(values.stimmung) || neutral.stimmung,
    ],
    [
      "Interessen & Trigger",
      readableValue(values.interessen_trigger) || neutral.interessen_trigger,
    ],
    [
      "Kauf-/Reaktionswahrscheinlichkeit",
      readableValue(values.kauf_reaktion) || neutral.kauf_reaktion,
    ],
    [
      "Empfohlener Antwortstil",
      readableValue(values.antwortstil) || neutral.antwortstil,
    ],
    ["No-Gos / Vorsicht", readableValue(values.no_gos) || neutral.no_gos],
    ["Spirituell / energetisch", readableValue(values.spirituell), true],
  ];
  return entries
    .filter(
      ([, content, optional]) =>
        !optional || hasMeaningfulSpiritualContent(content),
    )
    .map(([title, content]) => ({ title, content }));
}

function normalizeReportJson(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const parsed = parseJsonLike(value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : value;
}

function readableValue(value: unknown): string {
  const parsed = parseJsonLike(value);
  return collectReadableParts(parsed).join(", ").trim();
}

function parseJsonLike(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed || !/^[{[]/.test(trimmed)) return value;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return value;
  }
}

function collectReadableParts(value: unknown): string[] {
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (typeof value === "number" || typeof value === "boolean")
    return [String(value)];
  if (Array.isArray(value)) return value.flatMap(collectReadableParts);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(
      collectReadableParts,
    );
  }
  return [];
}

function hasMeaningfulSpiritualContent(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  const noSignalPhrases = [
    "kein belastbarer hinweis",
    "kein hinweis",
    "keine hinweise",
    "no reliable indication",
    "no indication",
    "not enough context",
  ];
  return !noSignalPhrases.some((phrase) => normalized.includes(phrase));
}

function getNeutralAnalysisTexts(locale: FanMindLanguage) {
  if (locale === "en") {
    return {
      kurzprofil:
        "No reliable profile details stored yet; use only verified contact context.",
      kommunikationsstil:
        "Communication style is not clear yet; keep replies friendly, concise, and respectful.",
      stimmung:
        "Emotional tendency is not reliably determinable from the stored context.",
      interessen_trigger: "No stable interests or triggers are documented yet.",
      kauf_reaktion:
        "No reliable purchase or response likelihood can be derived yet.",
      antwortstil: "Reply manually with a calm, helpful, pressure-free style.",
      no_gos:
        "Avoid diagnoses, sensitive claims, pressure, image analysis, and automatic sending.",
    };
  }
  return {
    kurzprofil:
      "Noch keine belastbaren Profildetails gespeichert; nutze nur verifizierten Kontaktkontext.",
    kommunikationsstil:
      "Der Kommunikationsstil ist noch nicht klar erkennbar; antworte freundlich, knapp und respektvoll.",
    stimmung:
      "Eine emotionale Tendenz ist aus dem gespeicherten Kontext noch nicht belastbar ableitbar.",
    interessen_trigger:
      "Noch keine stabilen Interessen oder Trigger dokumentiert.",
    kauf_reaktion:
      "Eine Kauf- oder Reaktionswahrscheinlichkeit ist noch nicht verlässlich ableitbar.",
    antwortstil: "Manuell ruhig, hilfreich und ohne Druck antworten.",
    no_gos:
      "Keine Diagnosen, sensiblen Behauptungen, Druck, Bildanalyse oder automatische Sendung.",
  };
}

function formatDate(value: string, locale: FanMindLanguage) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className={dashboardStyles.emptyState}>
      <strong>{title}</strong>
      {body ? <p>{body}</p> : null}
    </div>
  );
}
