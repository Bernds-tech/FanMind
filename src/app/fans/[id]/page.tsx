import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getContactAiProfile,
  getContactConversationMessages,
  getConversationSummary,
  getContactFollowups,
  getContactMemories,
  getOpenFollowupCount,
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  getWorkspaceContact,
  getWorkspaceContacts,
  getWorkspaceConversations,
  getWorkspaceVoiceProfile,
  markContactInboundMessagesSeen,
  signOutSupabaseServerSession,
  type ContactAiProfileRow,
  type ContactRow,
  type ConversationSummaryRow,
  type ConversationMessageRow,
  type ConversationRow,
  type FollowupRow,
  type MemoryRow,
  type WorkspaceDashboardRow,
  type WorkspaceVoiceProfileRow,
} from "@/lib/supabase/server";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { getWorkspaceNavigation } from "@/lib/workspaceNavigation";
import dashboardStyles from "../../dashboard/dashboard.module.css";
import { formatPlatformLabel } from "../import/csv";
import {
  getChannelSourceActionLabel,
  getChannelSourceConfig,
  getChannelSourceLabel,
  normalizeHttpUrl,
} from "@/lib/channelSources";
import styles from "./fan-detail.module.css";
import { AiReplySuggestions } from "./AiReplySuggestions";
import {
  saveManualSentReply,
  saveReplyDraft,
  setConversationPriority,
} from "../actions";

type FanDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    notice?: string | string[];
    seen_message?: string | string[];
    channel?: string | string[];
  }>;
};

type FanDetailWorkspaceProps = {
  workspace: WorkspaceDashboardRow;
  userDisplayName: string;
  contact: ContactRow | null;
  contactCount: number;
  contactError?: string;
  memories: MemoryRow[];
  memoriesError?: string;
  followups: FollowupRow[];
  messages: ConversationMessageRow[];
  messagesError?: string;
  conversation: ConversationRow | null;
  conversationsError?: string;
  openFollowupCount: number;
  notice?: string;
  conversationSummary: ConversationSummaryRow | null;
  contactAiProfile: ContactAiProfileRow | null;
  workspaceVoiceProfile: WorkspaceVoiceProfileRow | null;
  activeChannel: ConversationChannelKey;
};

type ConversationChannelKey =
  | "all"
  | "instagram"
  | "whatsapp"
  | "facebook"
  | "tiktok"
  | "email"
  | "webform"
  | "notes";

type ConversationChannelTab = {
  key: ConversationChannelKey;
  label: string;
  icon: string;
};

const conversationChannelTabs: ConversationChannelTab[] = [
  { key: "all", label: "Alle", icon: "●" },
  { key: "instagram", label: "Instagram", icon: "IG" },
  { key: "whatsapp", label: "WhatsApp", icon: "WA" },
  { key: "facebook", label: "Facebook", icon: "FB" },
  { key: "tiktok", label: "TikTok", icon: "TT" },
  { key: "email", label: "E-Mail", icon: "@" },
  { key: "webform", label: "Webformular", icon: "WF" },
  { key: "notes", label: "Notizen", icon: "N" },
];

const channelSourceTypes: Record<
  Exclude<ConversationChannelKey, "all">,
  string[]
> = {
  instagram: ["instagram_messages", "instagram_comments"],
  whatsapp: ["whatsapp_messages"],
  facebook: ["facebook_messages", "facebook_comments"],
  tiktok: ["tiktok_messages", "tiktok_comments"],
  email: ["email", "e_mail", "manual_email"],
  webform: ["webform", "webformular", "form"],
  notes: ["note", "notes", "manual_note", "internal_note"],
};


async function logout() {
  "use server";

  await signOutSupabaseServerSession();
  redirect("/login");
}

function FanDetailWorkspace({
  workspace,
  userDisplayName,
  contact,
  contactCount,
  contactError,
  memories,
  memoriesError,
  followups,
  messages,
  messagesError,
  conversation,
  conversationsError,
  openFollowupCount,
  notice,
  conversationSummary,
  contactAiProfile,
  workspaceVoiceProfile,
  activeChannel,
}: FanDetailWorkspaceProps) {
  const { mainNavigation, settingsNavigation, savedViews } =
    getWorkspaceNavigation("fans");
  const userLabel = userDisplayName || workspace.name || "Nutzer";
  const title = contact?.display_name ?? "Fan-Detail";

  return (
    <WorkspaceShell
      workspaceName={workspace.name}
      userLabel={userLabel}
      planLabel={workspace.plan_id}
      planMeta={workspace.role}
      planStatus="Aktiv"
      mainNavigation={mainNavigation}
      settingsNavigation={settingsNavigation}
      savedViews={savedViews}
      header={{
        title,
        subtitle: "Kontaktdetail mit echten Workspace-Daten",
        searchPlaceholder: "Fans und Nachrichten suchen ...",
        primaryActionLabel: "Zur Fanliste",
        primaryActionHref: "/fans#fans-list",
      }}
      contactCount={contactCount}
      openFollowupCount={openFollowupCount}
      showStats={false}
      logoutAction={logout}
    >
      <div className={styles.detailStack}>
        <Link className={styles.backLink} href="/fans#fans-list">
          ← Zurück zur Fanliste
        </Link>

        {notice ? (
          <p className={styles.safeNotice}>
            <strong>{formatNotice(notice)}</strong>
          </p>
        ) : null}

        {contactError ? (
          <p className={dashboardStyles.error}>
            <strong>Kontakt konnte nicht geladen werden.</strong>
            <span>{contactError}</span>
          </p>
        ) : null}

        {contact ? (
          <FanDetailContent
            contact={contact}
            followups={followups}
            memories={memories}
            memoriesError={memoriesError}
            messages={messages}
            messagesError={messagesError}
            conversation={conversation}
            conversationsError={conversationsError}
            conversationSummary={conversationSummary}
            contactAiProfile={contactAiProfile}
            workspaceVoiceProfile={workspaceVoiceProfile}
            activeChannel={activeChannel}
          />
        ) : (
          <FanNotFound />
        )}
      </div>
    </WorkspaceShell>
  );
}

function FanDetailContent({
  contact,
  memories,
  memoriesError,
  followups,
  messages,
  messagesError,
  conversation,
  conversationsError,
  conversationSummary,
  contactAiProfile,
  workspaceVoiceProfile,
  activeChannel,
}: {
  contact: ContactRow;
  memories: MemoryRow[];
  memoriesError?: string;
  followups: FollowupRow[];
  messages: ConversationMessageRow[];
  messagesError?: string;
  conversation: ConversationRow | null;
  conversationsError?: string;
  conversationSummary: ConversationSummaryRow | null;
  contactAiProfile: ContactAiProfileRow | null;
  workspaceVoiceProfile: WorkspaceVoiceProfileRow | null;
  activeChannel: ConversationChannelKey;
}) {
  const primaryChannel = formatSource(contact.source_platform);
  const channelTabs = buildConversationChannelTabs(
    messages,
    contact.id,
    activeChannel,
  );
  const filteredMessages = filterMessagesByChannel(messages, activeChannel);
  const timeline = filteredMessages.length
    ? buildMessageTimeline(filteredMessages)
    : [];
  const openFollowups = followups.filter(
    (followup) => followup.status !== "done",
  );

  return (
    <>
      <section className={styles.contactHeader} aria-label="Fan-Workbench">
        <dl className={styles.headerMetrics}>
          <div className={styles.metric}>
            <dt>Owner</dt>
            <dd>
              <strong>Team Inbox</strong>
            </dd>
          </div>
          <div className={styles.metric}>
            <dt>Letzter Kontakt</dt>
            <dd>
              <strong>
                {formatDate(contact.updated_at || contact.created_at)}
              </strong>
            </dd>
          </div>
          <div className={styles.metric}>
            <dt>Kontakt seit</dt>
            <dd>
              <strong>{formatDate(contact.created_at)}</strong>
            </dd>
          </div>
          <div className={styles.metric}>
            <dt>Primärkanal</dt>
            <dd>
              <strong>{primaryChannel}</strong>
            </dd>
          </div>
          <div className={styles.metric}>
            <dt>Offene Follow-ups</dt>
            <dd>
              <strong>{openFollowups.length}</strong>
            </dd>
          </div>
        </dl>
      </section>

      <section
        className={styles.workbenchGrid}
        aria-label="Conversation Workbench"
      >
        <main
          className={styles.conversation}
          aria-label="Kanalübergreifender Verlauf"
        >
          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <p className={dashboardStyles.eyebrow}>
                  Unified Inbox Timeline
                </p>
                <h3>Kanalübergreifender Verlauf</h3>
              </div>
            </div>
            <nav
              className={styles.channelTabs}
              aria-label="Verlauf nach Kanal filtern"
            >
              {channelTabs.map((tab) => (
                <Link
                  aria-current={tab.active ? "page" : undefined}
                  className={
                    tab.active ? styles.channelTabActive : styles.channelTab
                  }
                  href={tab.href}
                  key={tab.key}
                >
                  <span aria-hidden="true" className={styles.channelIcon}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  {tab.hasUnread ? (
                    <span
                      aria-label="Ungesehene eingehende Nachrichten"
                      className={styles.unreadDot}
                    />
                  ) : null}
                </Link>
              ))}
            </nav>
            {conversationsError ? (
              <p className={dashboardStyles.error}>
                <strong>
                  Conversation-Daten konnten gerade nicht geladen werden.
                </strong>
                <span>{conversationsError}</span>
              </p>
            ) : null}
            {messagesError ? (
              <p className={dashboardStyles.error}>
                <strong>Nachrichten konnten nicht geladen werden.</strong>
                <span>{messagesError}</span>
              </p>
            ) : null}
            <div className={styles.timeline}>
              {timeline.length ? (
                timeline.map((item) => (
                  <article
                    className={`${styles.message} ${item.direction === "Fan" ? styles.messageFan : styles.messageTeam}`}
                    key={item.id}
                  >
                    <time
                      className={styles.messageTime}
                      dateTime={item.createdAt ?? undefined}
                    >
                      {item.time}
                    </time>
                    <div className={styles.messageAvatar} aria-hidden="true">
                      {item.avatar}
                    </div>
                    <div className={styles.messageBubble}>
                      <div className={styles.messageMeta}>
                        <span>
                          {item.direction} · {item.type}
                        </span>
                        <span className={styles.channelBadge}>
                          {item.channel}
                        </span>
                      </div>
                      <p>{item.text}</p>
                      <OriginalChatAction
                        actionLabel={getOriginalActionLabel(
                          item.channel + " " + item.type,
                          item.url,
                        )}
                        compact
                        url={item.url}
                      />
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState
                  title="Noch kein gespeicherter Nachrichtenverlauf."
                  body={
                    activeChannel === "all"
                      ? "Sobald echte Nachrichten eingehen, erscheinen sie hier chronologisch."
                      : "Für diesen Kanal gibt es noch keine gespeicherten Nachrichten."
                  }
                />
              )}
            </div>
          </article>
          <article className={`${styles.card} ${styles.replyCard}`}>
            <div className={styles.cardHeader}>
              <div>
                <p className={dashboardStyles.eyebrow}>Antwortvorbereitung</p>
                <h3>Manuelle Freigabe erforderlich</h3>
              </div>
              <span className={styles.statusBadge}>
                Automatisches Senden deaktiviert
              </span>
            </div>
            <ConversationStatusPanel conversation={conversation} />
            <form className={styles.replyBox}>
              <input name="contact_id" type="hidden" value={contact.id} />
              {conversation ? (
                <input
                  name="conversation_id"
                  type="hidden"
                  value={conversation.id}
                />
              ) : null}
              <textarea
                name="content"
                required
                maxLength={4000}
                placeholder={`Antwort an ${contact.display_name} vorbereiten …`}
                aria-label={`Antwort an ${contact.display_name} vorbereiten`}
              />
              <div className={styles.replyFooter}>
                <button
                  className={dashboardStyles.primaryButton}
                  formAction={saveReplyDraft}
                  type="submit"
                >
                  Entwurf speichern
                </button>
                <button
                  className={dashboardStyles.secondaryButton}
                  formAction={saveManualSentReply}
                  type="submit"
                >
                  Als manuell gesendet speichern
                </button>
                <Link className={dashboardStyles.secondaryButton} href="/inbox">
                  Zur Inbox
                </Link>
                <span className={styles.safeBadge}>
                  Es wird nichts automatisch gesendet. Manuell gesendet im
                  Originalkanal.
                </span>
              </div>
            </form>
            <ConversationActionForms
              contactId={contact.id}
              conversation={conversation}
            />
          </article>
        </main>

        <aside
          className={styles.copilot}
          aria-label="Fan-Analyse-Report und KI-Antwortvorschläge"
        >
          <FanMemoryCard memories={memories} memoriesError={memoriesError} />
          <AiReplySuggestions
            contact={{
              contactId: contact.id,
              displayName: contact.display_name,
              handle: contact.handle,
              sourcePlatform: contact.source_platform,
              storedConversationContext: buildAiMessageContext(
                messages,
                conversationSummary,
                contactAiProfile,
                workspaceVoiceProfile,
              ),
              language: contact.language,
              status: contact.status,
              tags: contact.tags,
              summary: contact.summary,
            }}
          />
        </aside>
      </section>
    </>
  );
}

function normalizeConversationChannel(value: string): ConversationChannelKey {
  return conversationChannelTabs.some((tab) => tab.key === value)
    ? (value as ConversationChannelKey)
    : "all";
}

function buildConversationChannelTabs(
  messages: ConversationMessageRow[],
  contactId: string,
  activeChannel: ConversationChannelKey,
) {
  return conversationChannelTabs.map((tab) => {
    const channelMessages =
      tab.key === "all" ? messages : filterMessagesByChannel(messages, tab.key);
    const hasUnread = channelMessages.some(
      (message) => message.direction === "inbound" && !message.seen_at,
    );
    const href =
      tab.key === "all"
        ? `/fans/${contactId}`
        : `/fans/${contactId}?channel=${tab.key}`;

    return { ...tab, active: tab.key === activeChannel, hasUnread, href };
  });
}

function filterMessagesByChannel(
  messages: ConversationMessageRow[],
  channel: ConversationChannelKey,
): ConversationMessageRow[] {
  if (channel === "all") return messages;
  return messages.filter((message) => isMessageInChannel(message, channel));
}

function isMessageInChannel(
  message: ConversationMessageRow,
  channel: Exclude<ConversationChannelKey, "all">,
): boolean {
  const sourceType = (
    message.source_type ??
    message.message_type ??
    ""
  ).toLowerCase();
  const platform = (message.source_platform ?? "").toLowerCase();
  const messageType = (message.message_type ?? "").toLowerCase();
  const haystack = [sourceType, platform, messageType].filter(Boolean);

  if (channelSourceTypes[channel].some((source) => haystack.includes(source))) {
    return true;
  }

  if (channel === "notes") {
    return message.direction === "note" || messageType === "note";
  }
  if (channel === "email") {
    return platform.includes("mail") || sourceType.includes("mail");
  }
  if (channel === "webform") {
    return platform.includes("form") || sourceType.includes("form");
  }

  return platform === channel || sourceType.startsWith(`${channel}_`);
}

function ConversationStatusPanel({
  conversation,
}: {
  conversation: ConversationRow | null;
}) {
  if (!conversation) {
    return (
      <div className={styles.conversationState}>
        <span>Status: Offen</span>
        <span>Priorität: Normal</span>
        <span>Nächster Schritt: Antwort vorbereiten</span>
      </div>
    );
  }

  return (
    <div className={styles.conversationState}>
      <span>Status: {formatConversationStatus(conversation.status)}</span>
      <span>
        Priorität: {formatConversationPriority(conversation.priority)}
      </span>
      <span>
        Nächster Schritt: {conversation.next_step || "Antwort vorbereiten"}
      </span>
    </div>
  );
}

function ConversationActionForms({
  contactId,
  conversation,
}: {
  contactId: string;
  conversation: ConversationRow | null;
}) {
  return (
    <div className={styles.conversationActions}>
      <form action={setConversationPriority} className={styles.priorityForm}>
        <input name="contact_id" type="hidden" value={contactId} />
        {conversation ? (
          <input name="conversation_id" type="hidden" value={conversation.id} />
        ) : null}
        <select
          name="priority"
          defaultValue={conversation?.priority ?? "normal"}
        >
          <option value="low">Niedrig</option>
          <option value="normal">Normal</option>
          <option value="medium">Mittel</option>
          <option value="high">Hoch</option>
        </select>
        <button className={dashboardStyles.secondaryButton} type="submit">
          Priorität ändern
        </button>
      </form>
    </div>
  );
}

function OriginalChatAction({
  actionLabel,
  className,
  url,
}: {
  actionLabel: string;
  className?: string;
  compact?: boolean;
  url?: string;
}) {
  if (!url) return null;

  return (
    <div className={className}>
      <a
        className={dashboardStyles.secondaryButton}
        href={url}
        rel="noreferrer"
        target="_blank"
      >
        {actionLabel}
      </a>
    </div>
  );
}

function FanMemoryCard({
  memories,
  memoriesError,
}: {
  memories: MemoryRow[];
  memoriesError?: string;
}) {
  const reportSections = buildFanAnalysisReportSections(memories);

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h3>Fan-Analyse-Report</h3>
          <p className={styles.reportIntro}>
            Assistenz-Report aus gespeicherten Nachrichten, Interaktionen und
            Analyse-Notizen. Einschätzungen bleiben kommunikative Hinweise und
            keine Diagnose.
          </p>
        </div>
      </div>
      {memoriesError ? (
        <p className={dashboardStyles.error}>
          <strong>Analyse-Report konnte nicht geladen werden.</strong>
          <span>{memoriesError}</span>
        </p>
      ) : null}
      {reportSections.length ? (
        <div className={styles.reportSectionList}>
          {reportSections.map((section) => (
            <section className={styles.reportSection} key={section.title}>
              <div className={styles.reportSectionHeader}>
                <strong>{section.title}</strong>
                <span>{section.entries.length} Hinweis(e)</span>
              </div>
              <div className={styles.compactList}>
                {section.entries.map((memory) => (
                  <article className={styles.compactItem} key={memory.id}>
                    <strong>{formatMemoryType(memory.type)}</strong>
                    <p>{memory.content}</p>
                    <p className={styles.muted}>
                      Wichtigkeit: {memory.importance ?? "normal"} ·{" "}
                      {formatDate(memory.created_at)}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ))}
          <p className={styles.reportSafetyNote}>
            Bitte als vorsichtige Kommunikationshilfe lesen: keine medizinische
            oder psychologische Diagnose, keine harten sensiblen Behauptungen.
            Spirituelle oder energetische Hinweise nur weich interpretieren und
            nicht als Fakt bewerten.
          </p>
        </div>
      ) : (
        <EmptyState
          title="Noch kein Fan-Analyse-Report vorhanden."
          body="Sobald genügend Nachrichten vorliegen, kann FanMind Kommunikationsstil, Interessen, Stimmung, Trigger und passende Antwortstrategie zusammenfassen."
        />
      )}
    </article>
  );
}
const fanAnalysisReportSectionOrder = [
  "Kurzprofil",
  "Kommunikationsstil",
  "Stimmung / emotionale Tendenz",
  "Interessen & Trigger",
  "Kauf-/Reaktionswahrscheinlichkeit",
  "Empfohlener Antwortstil",
  "Vorsicht / No-Gos",
  "Optionale spirituelle oder energetische Hinweise",
] as const;

type FanAnalysisReportSectionTitle =
  (typeof fanAnalysisReportSectionOrder)[number];

function buildFanAnalysisReportSections(memories: MemoryRow[]): {
  title: FanAnalysisReportSectionTitle;
  entries: MemoryRow[];
}[] {
  const sections = new Map<FanAnalysisReportSectionTitle, MemoryRow[]>();

  memories.forEach((memory) => {
    const sectionTitle = getFanAnalysisReportSection(memory);
    sections.set(sectionTitle, [...(sections.get(sectionTitle) ?? []), memory]);
  });

  return fanAnalysisReportSectionOrder
    .map((title) => ({ title, entries: sections.get(title) ?? [] }))
    .filter((section) => section.entries.length > 0);
}

function getFanAnalysisReportSection(
  memory: MemoryRow,
): FanAnalysisReportSectionTitle {
  const type = (memory.type ?? "").toLowerCase();
  const content = memory.content.toLowerCase();
  const haystack = `${type} ${content}`;

  if (includesAny(haystack, ["no-go", "nogo", "vorsicht", "trigger"])) {
    return "Vorsicht / No-Gos";
  }
  if (includesAny(haystack, ["spirit", "energie", "energetisch", "intuition"])) {
    return "Optionale spirituelle oder energetische Hinweise";
  }
  if (includesAny(haystack, ["antwort", "stil", "ton", "strategie"])) {
    return "Empfohlener Antwortstil";
  }
  if (includesAny(haystack, ["kauf", "conversion", "reagiert", "wahrscheinlichkeit"])) {
    return "Kauf-/Reaktionswahrscheinlichkeit";
  }
  if (includesAny(haystack, ["interesse", "thema", "preis", "verfügbarkeit"])) {
    return "Interessen & Trigger";
  }
  if (includesAny(haystack, ["stimmung", "emotional", "gefühl", "wirkt"])) {
    return "Stimmung / emotionale Tendenz";
  }
  if (includesAny(haystack, ["kommunikation", "kommuniziert", "kurz", "direkt"])) {
    return "Kommunikationsstil";
  }

  return "Kurzprofil";
}

function includesAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(needle));
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className={dashboardStyles.emptyState}>
      <strong>{title}</strong>
      {body ? <p>{body}</p> : null}
    </div>
  );
}

function FanNotFound() {
  return (
    <section className={dashboardStyles.moduleCard}>
      <div className={dashboardStyles.moduleHeader}>
        <div>
          <p className={dashboardStyles.eyebrow}>Kontakt</p>
          <h2>Fan nicht gefunden</h2>
        </div>
        <span>Empty State</span>
      </div>
      <EmptyState
        title="Fan nicht gefunden"
        body="Für diese ID wurde im aktuellen Workspace kein Kontakt gefunden."
      />
    </section>
  );
}

function buildMessageTimeline(messages: ConversationMessageRow[]) {
  return messages.map((message) => ({
    id: message.id,
    createdAt: message.created_at,
    avatar:
      message.direction === "inbound"
        ? "F"
        : message.direction === "note"
          ? "N"
          : "T",
    direction: formatDirection(message.direction),
    type:
      message.direction === "note" && message.author_label === "Antwortentwurf"
        ? "Antwortentwurf · nicht gesendet"
        : formatMessageType(message.message_type),
    channel: formatDetailedSource(
      message.source_platform,
      message.source_type ?? message.message_type,
    ),
    time: formatDate(message.created_at),
    text: message.original_text_excerpt || message.content,
    url:
      normalizeHttpUrl(message.reply_target_url) ??
      normalizeHttpUrl(message.source_url),
  }));
}

function buildAiMessageContext(
  messages: ConversationMessageRow[],
  conversationSummary: ConversationSummaryRow | null,
  contactAiProfile: ContactAiProfileRow | null,
  workspaceVoiceProfile: WorkspaceVoiceProfileRow | null,
): string {
  const profileContext = [
    conversationSummary?.summary
      ? `Conversation Summary: ${conversationSummary.summary}`
      : "",
    contactAiProfile
      ? `Fan-Profil: Sprache ${contactAiProfile.language ?? "unbekannt"}, Ton ${contactAiProfile.tone ?? "im Aufbau"}, Quellen ${contactAiProfile.source_message_count ?? 0}.`
      : "",
    workspaceVoiceProfile
      ? `Workspace-Schreibstil: Ton ${workspaceVoiceProfile.tone ?? "im Aufbau"}, Beispiele ${workspaceVoiceProfile.examples_count ?? 0}.`
      : "",
    "Sicherheitsgrenze: nichts automatisch senden; Antwort nur als Entwurf oder manuell gesendet dokumentieren.",
  ]
    .filter(Boolean)
    .join("\n");
  const recentMessages = messages
    .slice(-50)
    .map(
      (message) =>
        `${formatDate(message.created_at)} · ${formatDirection(message.direction)} · ${formatSource(message.source_platform)} · ${formatMessageType(message.message_type)}: ${message.content}`,
    )
    .join("\n");

  return [profileContext, recentMessages].filter(Boolean).join("\n\n");
}

function getOriginalActionLabel(platform: string, url?: string): string {
  const prepared = getChannelSourceConfig(platform);
  if (prepared)
    return getChannelSourceActionLabel(prepared.sourceType, Boolean(url));

  if (!url) return "Original öffnen";
  const normalized = platform.toLowerCase();

  if (normalized.includes("comment") || normalized.includes("kommentar"))
    return "Kommentar öffnen";
  if (normalized.includes("post") || normalized.includes("beitrag"))
    return "Beitrag öffnen";
  if (
    normalized.includes("dm") ||
    normalized.includes("message") ||
    normalized.includes("messenger") ||
    normalized.includes("chat")
  )
    return "Chat öffnen";
  if (normalized.includes("mail")) return "E-Mail öffnen";

  return "Original öffnen";
}

function formatDetailedSource(
  platform: string | null,
  sourceType: string | null,
): string {
  const preparedLabel = getChannelSourceLabel(sourceType, "");
  if (preparedLabel) return preparedLabel;
  const source = (sourceType ?? "").toLowerCase();
  const base = formatSource(platform);
  if (source.includes("comment")) return `${base} Kommentare`;
  if (source.includes("dm") || source.includes("message"))
    return `${base} Nachrichten`;
  return base;
}

function formatConversationStatus(value: string): string {
  return (
    {
      open: "Offen",
      waiting: "Wartet",
      done: "Erledigt",
      archived: "Archiviert",
    }[value] ?? value
  );
}

function formatConversationPriority(value: string): string {
  return (
    { low: "Niedrig", normal: "Normal", medium: "Mittel", high: "Hoch" }[
      value
    ] ?? value
  );
}

function formatDirection(value: string): string {
  if (value === "outbound") return "Team / Owner";
  if (value === "note") return "Notiz";
  return "Fan";
}

function formatMessageType(value: string | null): string {
  const labels: Record<string, string> = {
    dm: "DM",
    comment: "Kommentar",
    post: "Post",
    email: "E-Mail",
    form: "Formular",
    note: "Notiz",
    manual: "Manuell",
  };
  return getChannelSourceLabel(value, labels[value ?? ""] ?? "DM");
}

function formatMemoryType(value: string | null): string {
  if (value === "note") {
    return "Notiz";
  }

  return value ?? "Notiz";
}

function formatSource(value: string | null): string {
  return getChannelSourceLabel(value, formatPlatformLabel(value));
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Kein Datum hinterlegt";
  }

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function normalizeParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function formatNotice(value: string): string {
  if (value === "draft_saved")
    return "Entwurf gespeichert – noch nicht gesendet.";
  if (value === "done")
    return "Konversation als erledigt markiert. Es wurde nichts extern gesendet.";
  if (value === "waiting")
    return "Konversation wartet auf Antwort im Originalkanal.";
  if (value === "open") return "Konversation wieder geöffnet.";
  if (value === "priority_saved") return "Priorität gespeichert.";
  return value;
}

function getUserDisplayName(
  metadata: Record<string, unknown> | undefined,
  fallback: string,
): string {
  const displayName = metadata?.display_name ?? metadata?.full_name;

  return typeof displayName === "string" && displayName.trim()
    ? displayName.trim()
    : fallback;
}

export default async function FanDetailPage({
  params,
  searchParams,
}: FanDetailPageProps) {
  const { id } = await params;
  const pageSearchParams = await searchParams;
  const seenMessageId = normalizeParam(pageSearchParams?.seen_message);
  const activeChannel = normalizeConversationChannel(
    normalizeParam(pageSearchParams?.channel),
  );
  const { data, error: userError } = await getSupabaseServerUser();

  if (!data.user) {
    redirect("/login");
  }

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  const workspace = workspaceResult.workspace;

  if (workspace && seenMessageId) {
    await markContactInboundMessagesSeen({
      workspaceId: workspace.id,
      contactId: id,
    });
  }
  const contactsResult = workspace
    ? await getWorkspaceContacts(workspace.id)
    : null;
  const contactResult = workspace
    ? await getWorkspaceContact(workspace.id, id)
    : null;
  const memoriesResult =
    workspace && contactResult?.contact
      ? await getContactMemories(workspace.id, contactResult.contact.id)
      : null;
  const followupsResult =
    workspace && contactResult?.contact
      ? await getContactFollowups(workspace.id, contactResult.contact.id)
      : null;
  const messagesResult =
    workspace && contactResult?.contact
      ? await getContactConversationMessages(
          workspace.id,
          contactResult.contact.id,
        )
      : null;
  const conversationsResult = workspace
    ? await getWorkspaceConversations(workspace.id)
    : null;
  const conversation =
    conversationsResult?.conversations.find((item) => item.contact_id === id) ??
    null;
  const openFollowupCountResult = workspace
    ? await getOpenFollowupCount(workspace.id)
    : null;
  const conversationSummaryResult =
    workspace && conversation
      ? await getConversationSummary({
          workspaceId: workspace.id,
          conversationId: conversation.id,
        })
      : null;
  const contactAiProfileResult =
    workspace && contactResult?.contact
      ? await getContactAiProfile(workspace.id, contactResult.contact.id)
      : null;
  const workspaceVoiceProfileResult = workspace
    ? await getWorkspaceVoiceProfile(workspace.id, data.user.id)
    : null;

  return (
    <main className={dashboardStyles.page}>
      {workspace ? (
        <FanDetailWorkspace
          workspace={workspace}
          userDisplayName={getUserDisplayName(
            data.user.user_metadata,
            workspace.name,
          )}
          contact={contactResult?.contact ?? null}
          contactCount={contactsResult?.contacts.length ?? 0}
          contactError={contactResult?.error?.message}
          followups={followupsResult?.followups ?? []}
          messages={messagesResult?.messages ?? []}
          messagesError={messagesResult?.error?.message}
          conversation={conversation}
          conversationsError={conversationsResult?.error?.message}
          memories={memoriesResult?.memories ?? []}
          memoriesError={memoriesResult?.error?.message}
          openFollowupCount={openFollowupCountResult?.count ?? 0}
          notice={normalizeParam(pageSearchParams?.notice)}
          conversationSummary={conversationSummaryResult?.summary ?? null}
          contactAiProfile={contactAiProfileResult?.profile ?? null}
          workspaceVoiceProfile={workspaceVoiceProfileResult?.profile ?? null}
          activeChannel={activeChannel}
        />
      ) : (
        <section
          className={dashboardStyles.fallbackCard}
          aria-label="FanMind Workspace"
        >
          <div>
            <p className={dashboardStyles.eyebrow}>FanMind Fan-Detail</p>
            <h1>Workspace-Status</h1>
            <p>
              Fan-Details sind geschützt: Supabase Auth ist aktiv. Für deinen
              Account wurde noch kein Workspace gefunden.
            </p>
          </div>
          {userError ? (
            <p className={dashboardStyles.error}>
              <strong>
                Supabase-Session konnte nicht vollständig geprüft werden.
              </strong>
              <span>{userError.message}</span>
            </p>
          ) : null}
          {workspaceResult.error ? (
            <p className={dashboardStyles.error}>
              <strong>Workspace-Daten konnten nicht geladen werden.</strong>
              <span>{workspaceResult.error.message}</span>
            </p>
          ) : null}
          <form action={logout}>
            <button type="submit" className={dashboardStyles.secondaryButton}>
              Abmelden
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
