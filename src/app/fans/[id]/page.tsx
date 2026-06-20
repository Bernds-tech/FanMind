import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getContactAiProfile,
  getContactConversationMessages,
  getConversationSummary,
  getContactFollowups,
  getContactMemories,
  getContactReplyTarget,
  getFanAnalysisReport,
  getOpenFollowupCount,
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  getWorkspaceContact,
  getWorkspaceContacts,
  getWorkspaceSocialConnections,
  getWorkspaceConversations,
  getWorkspaceVoiceProfile,
  markContactInboundMessagesSeen,
  signOutSupabaseServerSession,
  type ContactAiProfileRow,
  type ContactReplyTargetRow,
  type ContactRow,
  type ConversationSummaryRow,
  type ConversationMessageRow,
  type ConversationRow,
  type FanAnalysisReportRow,
  type FollowupRow,
  type MemoryRow,
  type WorkspaceDashboardRow,
  type WorkspaceVoiceProfileRow,
} from "@/lib/supabase/server";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { getWorkspaceNavigation } from "@/lib/workspaceNavigation";
import { getFanGroupKey } from "@/lib/fanIdentity";
import dashboardStyles from "../../dashboard/dashboard.module.css";
import { formatPlatformLabel } from "../import/csv";
import { getChannelSourceLabel } from "@/lib/channelSources";
import styles from "./fan-detail.module.css";
import {
  buildReplyTargetAction,
  getMessageSourceContext,
  type MessageSourceContext,
  type ReplyTargetAction,
} from "@/lib/sourceContext";
import { AiReplySuggestions, type ReplyMode } from "./AiReplySuggestions";
import { FanAnalysisReport } from "./FanAnalysisReport";
import {
  saveContactInternalNotes,
  saveFacebookReplyTarget,
  syncFacebookChatForContact,
} from "../actions";

type FanDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    notice?: string | string[];
    seen_message?: string | string[];
    channel?: string | string[];
    source?: string | string[];
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
  fanAnalysisReport: FanAnalysisReportRow | null;
  fanAnalysisReportError?: string;
  workspaceVoiceProfile: WorkspaceVoiceProfileRow | null;
  activeChannel: ConversationChannelKey;
  activeSource: string;
  facebookMessengerLastSyncedAt?: string | null;
  facebookReplyTarget: ContactReplyTargetRow | null;
  facebookReplyTargetError?: string;
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
  fanAnalysisReport,
  fanAnalysisReportError,
  workspaceVoiceProfile,
  activeChannel,
  activeSource,
  facebookMessengerLastSyncedAt,
  facebookReplyTarget,
  facebookReplyTargetError,
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
            fanAnalysisReport={fanAnalysisReport}
            fanAnalysisReportError={fanAnalysisReportError}
            workspaceVoiceProfile={workspaceVoiceProfile}
            activeChannel={activeChannel}
            activeSource={activeSource}
            facebookMessengerLastSyncedAt={facebookMessengerLastSyncedAt}
            facebookReplyTarget={facebookReplyTarget}
            facebookReplyTargetError={facebookReplyTargetError}
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
  fanAnalysisReport,
  fanAnalysisReportError,
  workspaceVoiceProfile,
  activeChannel,
  activeSource,
  facebookMessengerLastSyncedAt,
  facebookReplyTarget,
  facebookReplyTargetError,
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
  fanAnalysisReport: FanAnalysisReportRow | null;
  fanAnalysisReportError?: string;
  workspaceVoiceProfile: WorkspaceVoiceProfileRow | null;
  activeChannel: ConversationChannelKey;
  activeSource: string;
  facebookMessengerLastSyncedAt?: string | null;
  facebookReplyTarget: ContactReplyTargetRow | null;
  facebookReplyTargetError?: string;
}) {
  const primaryChannel = formatSource(contact.source_platform);
  const channelTabs = buildConversationChannelTabs(
    messages,
    contact.id,
    activeChannel,
    activeSource,
  );
  const sourceFilters = buildSourceFilters(
    messages,
    contact.id,
    activeChannel,
    activeSource,
  );
  const channelMessages = filterMessagesByChannel(messages, activeChannel);
  const filteredMessages = filterMessagesBySource(
    channelMessages,
    activeSource,
  );
  const timeline = filteredMessages.length
    ? buildMessageTimeline(filteredMessages, contact, facebookReplyTarget)
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
            <nav
              className={styles.sourceTabs}
              aria-label="Verlauf nach Ursprung filtern"
            >
              {sourceFilters.map((filter) => (
                <Link
                  aria-current={filter.active ? "page" : undefined}
                  className={
                    filter.active ? styles.sourceTabActive : styles.sourceTab
                  }
                  href={filter.href}
                  key={filter.key}
                >
                  {filter.label}
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
            {contact &&
            messages.some(
              (message) =>
                message.source_platform === "facebook" &&
                (message.source_type === "facebook_messages" ||
                  message.message_type === "dm"),
            ) ? (
              <div className={styles.syncBox}>
                <p className={styles.syncHint}>
                  Facebook-Chat zuletzt synchronisiert:{" "}
                  <strong>
                    {facebookMessengerLastSyncedAt
                      ? formatDate(facebookMessengerLastSyncedAt)
                      : "noch nicht"}
                  </strong>{" "}
                  · bis zu 50 Nachrichten je Conversation.
                </p>
                <form
                  action={syncFacebookChatForContact.bind(null, contact.id)}
                >
                  <button
                    className={dashboardStyles.secondaryButton}
                    type="submit"
                  >
                    Facebook-Chat aktualisieren
                  </button>
                </form>
              </div>
            ) : null}
            {contact && hasFacebookMessages(messages) ? (
              <FacebookReplyTargetCard
                contact={contact}
                target={facebookReplyTarget}
                error={facebookReplyTargetError}
              />
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
                        <span className={styles.sourceBadge}>
                          {item.sourceContext.contextLabel}
                        </span>
                      </div>
                      <p>{item.text}</p>
                      <AttachmentPreview attachments={item.attachments} />
                      <OriginalChatAction action={item.replyAction} compact />
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
              latestInboundMessage: getLatestInboundMessage(messages),
              analysisReport: stringifyAnalysisReport(fanAnalysisReport),
              language: contact.language,
              status: contact.status,
              tags: contact.tags,
              summary: contact.summary,
            }}
            modes={defaultReplyModes}
            originalChannelAction={getOriginalChannelAction(
              conversation,
              messages,
              contact,
              facebookReplyTarget,
            )}
          />
        </main>

        <aside
          className={styles.copilot}
          aria-label="Fan-Analyse-Report und KI-Antwortvorschläge"
        >
          <FanNotesCard contact={contact} />
          <FanMemoryCard
            contactId={contact.id}
            report={fanAnalysisReport}
            reportError={fanAnalysisReportError}
            memories={memories}
            memoriesError={memoriesError}
          />
        </aside>
      </section>
    </>
  );
}

const defaultReplyModes: ReplyMode[] = [
  {
    id: "friendly",
    label: "Freundlich",
    prompt: "warm, persönlich und hilfreich",
  },
  {
    id: "short",
    label: "Kurz & direkt",
    prompt: "knapp, klar und ohne Umwege",
  },
  {
    id: "sales",
    label: "Verkaufsorientiert",
    prompt: "vorsichtig verkaufsorientiert ohne Druck",
  },
  {
    id: "calming",
    label: "Beruhigend",
    prompt: "ruhig, deeskalierend und sicherheitsgebend",
  },
  { id: "casual", label: "Locker", prompt: "natürlich, locker und nahbar" },
  {
    id: "vip",
    label: "VIP/Premium",
    prompt: "wertschätzend, exklusiv und serviceorientiert",
  },
];

function normalizeConversationChannel(value: string): ConversationChannelKey {
  return conversationChannelTabs.some((tab) => tab.key === value)
    ? (value as ConversationChannelKey)
    : "all";
}

function buildConversationChannelTabs(
  messages: ConversationMessageRow[],
  contactId: string,
  activeChannel: ConversationChannelKey,
  activeSource: string,
) {
  return conversationChannelTabs.map((tab) => {
    const channelMessages =
      tab.key === "all" ? messages : filterMessagesByChannel(messages, tab.key);
    const hasUnread = channelMessages.some(
      (message) => message.direction === "inbound" && !message.seen_at,
    );
    const params = new URLSearchParams();
    if (tab.key !== "all") params.set("channel", tab.key);
    if (activeSource !== "all") params.set("source", activeSource);
    const query = params.toString();
    const href = `/fans/${contactId}${query ? `?${query}` : ""}`;

    return { ...tab, active: tab.key === activeChannel, hasUnread, href };
  });
}

function buildSourceFilters(
  messages: ConversationMessageRow[],
  contactId: string,
  activeChannel: ConversationChannelKey,
  activeSource: string,
) {
  const channelMessages = filterMessagesByChannel(messages, activeChannel);
  const contexts = new Map<string, MessageSourceContext>();

  for (const message of channelMessages) {
    const context = getMessageSourceContext(message);
    if (!contexts.has(context.contextKey)) {
      contexts.set(context.contextKey, context);
    }
  }

  const paramsFor = (source: string) => {
    const params = new URLSearchParams();
    if (activeChannel !== "all") params.set("channel", activeChannel);
    if (source !== "all") params.set("source", source);
    const query = params.toString();
    return `/fans/${contactId}${query ? `?${query}` : ""}`;
  };

  return [
    {
      key: "all",
      label: "Alle Ursprünge",
      active: activeSource === "all",
      href: paramsFor("all"),
    },
    ...Array.from(contexts.values()).map((context) => ({
      key: context.contextKey,
      label: context.contextLabel,
      active: activeSource === context.contextKey,
      href: paramsFor(context.contextKey),
    })),
  ];
}

function filterMessagesBySource(
  messages: ConversationMessageRow[],
  activeSource: string,
): ConversationMessageRow[] {
  if (activeSource === "all") return messages;
  return messages.filter(
    (message) => getMessageSourceContext(message).contextKey === activeSource,
  );
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

function OriginalChatAction({
  action,
  className,
}: {
  action: ReplyTargetAction;
  className?: string;
  compact?: boolean;
}) {
  if (!action.href) return null;

  return (
    <div className={className}>
      <a
        className={dashboardStyles.secondaryButton}
        href={action.href}
        rel="noreferrer"
        target="_blank"
        title={action.reason}
      >
        {action.label}
      </a>
      {(action.quality === "manual_exact_thread" ||
        action.quality === "exact_thread") &&
      action.platform === "facebook" ? (
        <small className={styles.muted}>
          Öffnet den für diesen Kontakt gespeicherten Chat-Link.
        </small>
      ) : null}
      {action.quality === "inbox_fallback" ? (
        <small className={styles.muted}>
          Meta öffnet eventuell die zuletzt aktive Unterhaltung. Bitte im Postfach manuell auswählen: {action.fallbackContactLabel ?? "Kontakt"}
          {action.fallbackContactId
            ? ` · Facebook-ID: ${action.fallbackContactId}`
            : ""}
        </small>
      ) : null}
    </div>
  );
}

function FacebookReplyTargetCard({
  contact,
  target,
  error,
}: {
  contact: ContactRow;
  target: ContactReplyTargetRow | null;
  error?: string;
}) {
  const storageUnavailable =
    error?.includes("Der exakte Chat-Link kann derzeit nicht gespeichert werden.") ??
    false;
  const fallbackHint = target
    ? "Öffne einmal den richtigen Facebook-Chat, kopiere die URL aus dem Browser und speichere sie hier."
    : storageUnavailable
      ? "Der exakte Chat-Link kann derzeit nicht gespeichert werden. Das Facebook-Postfach kann weiterhin geöffnet werden."
      : error
      ? "Der gespeicherte Chat-Link konnte gerade nicht geladen werden. Du kannst das Facebook-Postfach öffnen und den Kontakt dort manuell auswählen."
      : "Du kannst das Facebook-Postfach öffnen und den Kontakt dort manuell auswählen.";

  return (
    <details className={styles.replyTargetBox} open={!target || Boolean(error)}>
      <summary>
        {target
          ? "Exakter Facebook-Chat-Link hinterlegt"
          : "Noch kein exakter Facebook-Chat-Link hinterlegt"}
      </summary>
      <p className={styles.syncHint}>
        {fallbackHint}
      </p>
      {target ? (
        <div className={styles.replyTargetStatus}>
          <span>Manuell hinterlegter Chat-Link</span>
          <a
            className={dashboardStyles.secondaryButton}
            href={target.url}
            rel="noreferrer"
            target="_blank"
          >
            Link testen
          </a>
        </div>
      ) : null}
      {!storageUnavailable ? (
        <form action={saveFacebookReplyTarget} className={styles.inlineForm}>
          <input name="contact_id" type="hidden" value={contact.id} />
          <label>
            <span>{target ? "Link ändern" : "Facebook-Chat-URL"}</span>
            <input
              defaultValue={target?.url ?? ""}
              name="reply_target_url"
              placeholder="https://business.facebook.com/.../inbox/t/..."
              type="url"
              required
            />
          </label>
          <button className={dashboardStyles.secondaryButton} type="submit">
            {target ? "Ändern" : "Chat-Link speichern"}
          </button>
        </form>
      ) : null}
    </details>
  );
}

function FanNotesCard({ contact }: { contact: ContactRow }) {
  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h3>Notizen</h3>
          <p className={styles.reportIntro}>
            Interne Notizen zu diesem Fan. Nur im Workspace sichtbar.
          </p>
        </div>
      </div>
      <form action={saveContactInternalNotes} className={styles.notesForm}>
        <input name="contact_id" type="hidden" value={contact.id} />
        <textarea
          aria-label="Interne Notizen zu diesem Fan"
          defaultValue={contact.internal_notes ?? ""}
          maxLength={8000}
          name="internal_notes"
          placeholder="Eigene Notizen, Kontext, Team-Hinweise …"
        />
        <div className={styles.replyFooter}>
          <button className={dashboardStyles.primaryButton} type="submit">
            Notizen speichern
          </button>
        </div>
      </form>
    </article>
  );
}

function FanMemoryCard({
  contactId,
  report,
  reportError,
  memoriesError,
}: {
  contactId: string;
  report: FanAnalysisReportRow | null;
  reportError?: string;
  memories: MemoryRow[];
  memoriesError?: string;
}) {
  return (
    <FanAnalysisReport
      contactId={contactId}
      initialReport={report}
      loadError={reportError ?? memoriesError}
    />
  );
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

function hasFacebookMessages(messages: ConversationMessageRow[]): boolean {
  return messages.some(
    (message) =>
      message.source_platform === "facebook" &&
      (message.source_type === "facebook_messages" ||
        message.message_type === "dm"),
  );
}

function getManualFacebookReplyTargetUrl(
  message: ConversationMessageRow,
  target: ContactReplyTargetRow | null,
): string | null {
  if (!target || target.quality !== "manual_exact_thread") return null;
  if (target.source_platform !== "facebook") return null;
  const sourceType = message.source_type ?? message.message_type;
  if (target.source_type !== "facebook_messages") return null;
  if (sourceType !== "facebook_messages" && message.message_type !== "dm") {
    return null;
  }
  return target.url;
}

function buildMessageTimeline(
  messages: ConversationMessageRow[],
  contact: ContactRow,
  facebookReplyTarget: ContactReplyTargetRow | null,
) {
  return messages.map((message) => ({
    id: message.id,
    createdAt: message.created_at,
    avatar:
      message.direction === "inbound"
        ? "F"
        : message.direction === "note"
          ? "N"
          : "T",
    direction: formatDirection(message.direction, message.author_label),
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
    attachments: message.attachments ?? [],
    sourceContext: getMessageSourceContext(message),
    replyAction: buildReplyTargetAction(message, null, {
      fallbackContactLabel: contact.display_name,
      fallbackContactId: contact.handle,
      manualReplyTargetUrl: getManualFacebookReplyTargetUrl(
        message,
        facebookReplyTarget,
      ),
    }),
  }));
}

function AttachmentPreview({
  attachments,
}: {
  attachments: ConversationMessageRow["attachments"];
}) {
  if (!attachments?.length) return null;

  return (
    <div className={styles.attachmentList}>
      {attachments.map((attachment, index) => {
        const label = getAttachmentLabel(attachment.type);
        const title = attachment.title || attachment.name || label;

        return (
          <div
            className={styles.attachmentCard}
            key={`${attachment.type}-${index}`}
          >
            {attachment.type === "image" && attachment.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={title} src={attachment.url} />
            ) : (
              <span className={styles.attachmentIcon}>
                {getAttachmentIcon(attachment.type)}
              </span>
            )}
            <div>
              <strong>{title}</strong>
              <small>
                {label}
                {attachment.mime_type ? ` · ${attachment.mime_type}` : ""}
                {typeof attachment.size === "number"
                  ? ` · ${attachment.size} Bytes`
                  : ""}
              </small>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getLatestInboundMessage(messages: ConversationMessageRow[]): string {
  return (
    [...messages].reverse().find((message) => message.direction === "inbound")
      ?.content ?? ""
  );
}

function stringifyAnalysisReport(report: FanAnalysisReportRow | null): string {
  return report ? JSON.stringify(report.report_json) : "";
}

function getOriginalChannelAction(
  conversation: ConversationRow | null,
  messages: ConversationMessageRow[],
  contact: ContactRow,
  facebookReplyTarget: ContactReplyTargetRow | null,
): ReplyTargetAction {
  const latestInbound = [...messages]
    .reverse()
    .find((message) => message.direction === "inbound");
  return buildReplyTargetAction(latestInbound ?? conversation, conversation, {
    fallbackContactLabel: contact.display_name,
    fallbackContactId: contact.handle,
    manualReplyTargetUrl: facebookReplyTarget?.url ?? null,
  });
}

function getAttachmentLabel(type: string): string {
  return (
    {
      image: "Bild empfangen",
      video: "Video empfangen",
      audio: "Audio empfangen",
      file: "Datei empfangen",
      unknown: "Anhang empfangen",
    }[type] ?? "Anhang empfangen"
  );
}

function getAttachmentIcon(type: string): string {
  return (
    { image: "🖼️", video: "🎬", audio: "🎧", file: "📎", unknown: "📎" }[
      type
    ] ?? "📎"
  );
}

function formatAiMessageText(message: ConversationMessageRow): string {
  const text = message.content || message.original_text_excerpt || "";
  if (!message.attachments?.length) return text;
  const hasImage = message.attachments.some(
    (attachment) => attachment.type === "image",
  );
  const mediaContext = hasImage
    ? "Der Fan hat ein Bild gesendet."
    : `Der Fan hat ${message.attachments.length === 1 ? "einen Anhang" : "Anhänge"} gesendet.`;
  return text ? `${mediaContext} Begleittext: ${text}` : mediaContext;
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
        `${formatDate(message.created_at)} · ${formatDirection(message.direction, message.author_label)} · ${formatSource(message.source_platform)} · ${formatMessageType(message.message_type)}: ${formatAiMessageText(message)}`,
    )
    .join("\n");

  return [profileContext, recentMessages].filter(Boolean).join("\n\n");
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

function formatDirection(value: string, authorLabel?: string | null): string {
  if (value === "outbound") return authorLabel?.trim() || "Team";
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
  if (value === "notes_saved")
    return "Gespeichert: Notizen wurden aktualisiert.";
  if (value === "analysis_saved")
    return "Fan-Analyse-Report wurde aktualisiert.";
  if (value === "reply_target_saved")
    return "Exakter Facebook-Chat-Link wurde gespeichert.";
  if (value === "reply_target_save_failed")
    return "Der Chat-Link konnte gerade nicht gespeichert werden. Bitte später erneut versuchen.";
  if (value === "reply_target_storage_unavailable")
    return "Der exakte Chat-Link kann derzeit nicht gespeichert werden. Das Facebook-Postfach kann weiterhin geöffnet werden.";
  if (value === "reply_target_invalid")
    return "Bitte speichere nur einen HTTPS-Link zu einem konkreten Facebook-Chat, keinen generischen Postfach-Link.";
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
  const activeChannel = normalizeConversationChannel(
    normalizeParam(pageSearchParams?.channel),
  );
  const activeSource = normalizeParam(pageSearchParams?.source) || "all";
  const { data, error: userError } = await getSupabaseServerUser();

  if (!data.user) {
    redirect("/login");
  }

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  const workspace = workspaceResult.workspace;

  const [contactsResult, contactResult, socialConnectionsResult] = workspace
    ? await Promise.all([
        getWorkspaceContacts(workspace.id),
        getWorkspaceContact(workspace.id, id),
        getWorkspaceSocialConnections(workspace.id),
      ])
    : [null, null, null];

  const contact = contactResult?.contact ?? null;
  const relatedContactIds =
    contact && contactsResult
      ? getRelatedFanContactIds(contact, contactsResult.contacts).filter(
          (contactId) => contactId !== contact.id,
        )
      : [];

  if (workspace && contact) {
    await Promise.all(
      [contact.id, ...relatedContactIds].map((contactId) =>
        markContactInboundMessagesSeen({
          workspaceId: workspace.id,
          contactId,
        }),
      ),
    );
  }

  const facebookConnection =
    socialConnectionsResult?.connections.find(
      (connection) =>
        connection.platform === "facebook" && connection.status === "connected",
    ) ?? null;

  const [
    memoriesResult,
    followupsResult,
    initialMessagesResult,
    conversationsResult,
    openFollowupCountResult,
    contactAiProfileResult,
    fanAnalysisReportResult,
    workspaceVoiceProfileResult,
    facebookReplyTargetResult,
  ] = workspace
    ? await Promise.all([
        contact
          ? getContactMemories(workspace.id, contact.id)
          : Promise.resolve(null),
        contact
          ? getContactFollowups(workspace.id, contact.id)
          : Promise.resolve(null),
        contact
          ? getContactConversationMessages(workspace.id, contact.id)
          : Promise.resolve(null),
        getWorkspaceConversations(workspace.id),
        getOpenFollowupCount(workspace.id),
        contact
          ? getContactAiProfile(workspace.id, contact.id)
          : Promise.resolve(null),
        contact
          ? getFanAnalysisReport(workspace.id, contact.id)
          : Promise.resolve(null),
        getWorkspaceVoiceProfile(workspace.id, data.user.id),
        contact
          ? getContactReplyTarget(workspace.id, contact.id, "facebook_messages")
          : Promise.resolve(null),
      ])
    : [null, null, null, null, null, null, null, null, null];

  let messagesResult = initialMessagesResult;

  let additionalMessagesError: string | undefined;

  if (
    workspace &&
    contact &&
    messagesResult &&
    messagesResult.messages.length === 0 &&
    relatedContactIds.length
  ) {
    const relatedMessageResults = await Promise.all(
      relatedContactIds.map((contactId) =>
        getContactConversationMessages(workspace.id, contactId),
      ),
    );

    const mergedMessages = relatedMessageResults.flatMap(
      (result) => result.messages,
    );
    if (mergedMessages.length) {
      messagesResult = {
        messages: mergeUniqueMessagesById([
          ...messagesResult.messages,
          ...mergedMessages,
        ]),
        error: messagesResult.error,
      };
    }

    const firstError = relatedMessageResults.find((result) => result.error)
      ?.error;
    if (firstError) additionalMessagesError = firstError.message;
  }

  const conversation =
    conversationsResult?.conversations.find((item) => item.contact_id === id) ??
    (relatedContactIds.length
      ? conversationsResult?.conversations.find((item) =>
          relatedContactIds.includes(item.contact_id),
        )
      : null) ??
    null;
  const conversationSummaryResult =
    workspace && conversation
      ? await getConversationSummary({
          workspaceId: workspace.id,
          conversationId: conversation.id,
        })
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
          messagesError={
            messagesResult?.error?.message ?? additionalMessagesError
          }
          conversation={conversation}
          conversationsError={conversationsResult?.error?.message}
          memories={memoriesResult?.memories ?? []}
          memoriesError={memoriesResult?.error?.message}
          openFollowupCount={openFollowupCountResult?.count ?? 0}
          notice={normalizeParam(pageSearchParams?.notice)}
          conversationSummary={conversationSummaryResult?.summary ?? null}
          contactAiProfile={contactAiProfileResult?.profile ?? null}
          fanAnalysisReport={fanAnalysisReportResult?.report ?? null}
          fanAnalysisReportError={fanAnalysisReportResult?.error?.message}
          workspaceVoiceProfile={workspaceVoiceProfileResult?.profile ?? null}
          activeChannel={activeChannel}
          activeSource={activeSource}
          facebookMessengerLastSyncedAt={
            facebookConnection?.last_messenger_sync_at ?? null
          }
          facebookReplyTarget={facebookReplyTargetResult?.target ?? null}
          facebookReplyTargetError={facebookReplyTargetResult?.error?.message}
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

function getRelatedFanContactIds(
  contact: ContactRow,
  contacts: ContactRow[],
): string[] {
  const baseKey = getFanGroupKey(contact);
  return contacts
    .filter((entry) => getFanGroupKey(entry) === baseKey)
    .map((entry) => entry.id);
}

function mergeUniqueMessagesById(
  messages: ConversationMessageRow[],
): ConversationMessageRow[] {
  const byId = new Map<string, ConversationMessageRow>();
  for (const message of messages) {
    byId.set(message.id, message);
  }

  return Array.from(byId.values()).sort(
    (left, right) =>
      new Date(left.created_at ?? 0).getTime() -
      new Date(right.created_at ?? 0).getTime(),
  );
}
