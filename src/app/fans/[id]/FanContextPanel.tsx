"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { FanMindLanguage } from "@/lib/fanmindCopy";
import { wt } from "@/lib/workspaceCopy";
import type {
  ContactRow,
  FanAnalysisReportRow,
  FollowupRow,
  MemoryRow,
} from "@/lib/supabase/server";
import dashboardStyles from "../../dashboard/dashboard.module.css";
import {
  saveContactInternalNotes,
  saveManualFollowup,
  saveManualMemory,
} from "../actions";
import { FanAnalysisReport } from "./FanAnalysisReport";
import styles from "./fan-detail.module.css";

type ContextTab = "notes" | "ai" | "followups" | "analysis";

type Props = {
  contact: ContactRow;
  memories: MemoryRow[];
  memoriesError?: string;
  followups: FollowupRow[];
  report: FanAnalysisReportRow | null;
  reportError?: string;
  hasNewMessages: boolean;
  locale: FanMindLanguage;
};

const tabs: Array<{ id: ContextTab; de: string; en: string }> = [
  { id: "notes", de: "Notizen", en: "Notes" },
  { id: "ai", de: "AI-Infos", en: "AI info" },
  { id: "followups", de: "Follow-ups", en: "Follow-ups" },
  { id: "analysis", de: "Analyse", en: "Analysis" },
];

export function FanContextPanel({
  contact,
  memories,
  memoriesError,
  followups,
  report,
  reportError,
  hasNewMessages,
  locale,
}: Props) {
  const [activeTab, setActiveTab] = useState<ContextTab>(() =>
    typeof window !== "undefined" && window.location.hash === "#followups"
      ? "followups"
      : "notes",
  );

  const activeLabel =
    tabs.find((tab) => tab.id === activeTab)?.[locale === "en" ? "en" : "de"] ??
    "";

  return (
    <section
      className={styles.contextPanel}
      aria-label={locale === "en" ? "Fan context" : "Fan-Kontext"}
    >
      <nav
        className={styles.contextTabs}
        aria-label={locale === "en" ? "Context tabs" : "Kontext-Reiter"}
      >
        {tabs.map((tab) => {
          const label = locale === "en" ? tab.en : tab.de;
          return (
            <button
              aria-controls={`context-${tab.id}`}
              aria-selected={activeTab === tab.id}
              className={
                activeTab === tab.id
                  ? styles.contextTabActive
                  : styles.contextTab
              }
              id={`context-tab-${tab.id}`}
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "followups")
                  history.replaceState(null, "", "#followups");
              }}
              role="tab"
              type="button"
            >
              {label}
            </button>
          );
        })}
      </nav>
      <div
        className={styles.contextBody}
        id={activeTab === "followups" ? "followups" : undefined}
      >
        <div
          aria-labelledby={`context-tab-${activeTab}`}
          id={`context-${activeTab}`}
          role="tabpanel"
        >
          <p className={dashboardStyles.eyebrow}>{activeLabel}</p>
          {activeTab === "notes" ? (
            <FanNotesCard contact={contact} locale={locale} />
          ) : null}
          {activeTab === "ai" ? (
            <ManualMemoryCard
              contactId={contact.id}
              memories={memories}
              memoriesError={memoriesError}
              locale={locale}
            />
          ) : null}
          {activeTab === "followups" ? (
            <ManualFollowupCard
              contactId={contact.id}
              followups={followups}
              locale={locale}
            />
          ) : null}
          {activeTab === "analysis" ? (
            <div className={styles.analysisScrollArea}>
              <FanAnalysisReport
                contactId={contact.id}
                initialReport={report}
                loadError={reportError ?? memoriesError}
                locale={locale}
                hasNewMessages={hasNewMessages}
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function PanelCard({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <article className={styles.contextCard}>
      <div className={styles.cardHeader}>
        <div>
          <h3>{title}</h3>
          <p className={styles.reportIntro}>{intro}</p>
        </div>
      </div>
      {children}
    </article>
  );
}

function FanNotesCard({
  contact,
  locale,
}: {
  contact: ContactRow;
  locale: FanMindLanguage;
}) {
  return (
    <PanelCard
      title={wt(locale, "Notizen")}
      intro={
        locale === "en"
          ? "Free internal team notes for this fan."
          : "Freie interne Team-Notizen zu diesem Fan."
      }
    >
      <form action={saveContactInternalNotes} className={styles.notesForm}>
        <input name="contact_id" type="hidden" value={contact.id} />
        <input name="lang" type="hidden" value={locale} />
        <textarea
          aria-label={
            locale === "en"
              ? "Internal notes for this fan"
              : "Interne Notizen zu diesem Fan"
          }
          defaultValue={contact.internal_notes ?? ""}
          maxLength={8000}
          name="internal_notes"
          placeholder={
            locale === "en"
              ? "Your notes, context, team hints …"
              : "Eigene Notizen, Kontext, Team-Hinweise …"
          }
        />
        <div className={styles.replyFooter}>
          <button className={dashboardStyles.primaryButton} type="submit">
            {wt(locale, "Notizen speichern")}
          </button>
        </div>
      </form>
    </PanelCard>
  );
}

function ManualMemoryCard({
  contactId,
  memories,
  memoriesError,
  locale,
}: {
  contactId: string;
  memories: MemoryRow[];
  memoriesError?: string;
  locale: FanMindLanguage;
}) {
  return (
    <PanelCard
      title={locale === "en" ? "AI info" : "AI-Infos"}
      intro={
        locale === "en"
          ? "Long-term facts, preferences and important context FanMind can use for AI suggestions."
          : "Dauerhafte Fakten, Vorlieben und wichtige Hinweise, die FanMind bei KI-Vorschlägen berücksichtigt."
      }
    >
      <DisclosureButton
        label={locale === "en" ? "+ Add AI info" : "+ AI-Info hinzufügen"}
      >
        <form action={saveManualMemory} className={styles.manualActionForm}>
          <input name="contact_id" type="hidden" value={contactId} />
          <input name="lang" type="hidden" value={locale} />
          <textarea
            name="content"
            required
            placeholder={locale === "en" ? "Text" : "Text"}
          />
          <div className={styles.formRow}>
            <select
              name="importance"
              defaultValue="normal"
              aria-label={locale === "en" ? "Importance" : "Wichtigkeit"}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
            <select
              name="type"
              defaultValue="note"
              aria-label={locale === "en" ? "Type" : "Typ"}
            >
              <option value="note">Note</option>
              <option value="preference">Preference</option>
              <option value="promise">Promise</option>
            </select>
          </div>
          <button className={dashboardStyles.secondaryButton} type="submit">
            {locale === "en" ? "Save AI info" : "AI-Info speichern"}
          </button>
        </form>
      </DisclosureButton>
      {memoriesError ? (
        <p className={dashboardStyles.error}>
          <strong>
            {locale === "en"
              ? "AI info could not be loaded."
              : "AI-Infos konnten nicht geladen werden."}
          </strong>
          <span>{memoriesError}</span>
        </p>
      ) : null}
      <CompactMemoryList memories={memories} locale={locale} />
    </PanelCard>
  );
}

function ManualFollowupCard({
  contactId,
  followups,
  locale,
}: {
  contactId: string;
  followups: FollowupRow[];
  locale: FanMindLanguage;
}) {
  const nextFollowup = useMemo(
    () => getNextOpenFollowup(followups),
    [followups],
  );
  return (
    <PanelCard
      title="Follow-ups"
      intro={
        locale === "en"
          ? "Manual tasks and replies that are still open."
          : "Manuelle Aufgaben und Rückmeldungen, die noch offen sind."
      }
    >
      {nextFollowup ? (
        <p className={styles.nextAction}>
          <strong>{nextFollowup.reason}</strong>
          <br />
          {locale === "en" ? "Due" : "Fällig"}: {nextFollowup.due_date ?? "—"} ·{" "}
          {locale === "en" ? "Priority" : "Priorität"}:{" "}
          {nextFollowup.priority ?? "normal"} · Status:{" "}
          {nextFollowup.status ?? "open"}
        </p>
      ) : null}
      <DisclosureButton label="+ Follow-up">
        <form action={saveManualFollowup} className={styles.manualActionForm}>
          <input name="contact_id" type="hidden" value={contactId} />
          <input name="lang" type="hidden" value={locale} />
          <input
            name="reason"
            required
            placeholder={locale === "en" ? "Task/title" : "Aufgabe/Titel"}
          />
          <div className={styles.formRow}>
            <input name="due_date" type="date" />
            <select
              name="priority"
              defaultValue="normal"
              aria-label={locale === "en" ? "Priority" : "Priorität"}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
          </div>
          <button className={dashboardStyles.secondaryButton} type="submit">
            {locale === "en" ? "Save follow-up" : "Follow-up speichern"}
          </button>
        </form>
      </DisclosureButton>
      <CompactFollowupList followups={followups} locale={locale} />
    </PanelCard>
  );
}

function DisclosureButton({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <details className={styles.inlineDisclosure}>
      <summary>{label}</summary>
      {children}
    </details>
  );
}

function CompactMemoryList({
  memories,
  locale,
}: {
  memories: MemoryRow[];
  locale: FanMindLanguage;
}) {
  return (
    <div className={styles.compactList}>
      {memories.length ? (
        memories.map((m) => (
          <p key={m.id}>
            <strong>{m.importance ?? "normal"}</strong>
            {m.type ? ` · ${m.type}` : ""}
            <br />
            {m.content}
          </p>
        ))
      ) : (
        <p className={styles.muted}>
          {locale === "en" ? "No AI info yet." : "Noch keine AI-Infos."}
        </p>
      )}
    </div>
  );
}

function CompactFollowupList({
  followups,
  locale,
}: {
  followups: FollowupRow[];
  locale: FanMindLanguage;
}) {
  return (
    <div className={styles.compactList}>
      {followups.length ? (
        followups.map((f) => (
          <p key={f.id}>
            <strong>{f.status ?? "open"}</strong> · {f.priority ?? "normal"}
            <br />
            {f.reason}
            {f.due_date ? ` · ${f.due_date}` : ""}
          </p>
        ))
      ) : (
        <p className={styles.muted}>
          {locale === "en" ? "No follow-ups yet." : "Noch keine Follow-ups."}
        </p>
      )}
    </div>
  );
}

function getNextOpenFollowup(followups: FollowupRow[]) {
  return (
    followups
      .filter((f) => f.status !== "done")
      .sort((a, b) =>
        (a.due_date ?? "9999-12-31").localeCompare(b.due_date ?? "9999-12-31"),
      )[0] ?? null
  );
}
