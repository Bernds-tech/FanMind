import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getSupabaseServerUser,
  getWorkspaceConversations,
  getUserWorkspaceDashboard,
  getWorkspaceContacts,
  getWorkspaceOpenFollowups,
  signOutSupabaseServerSession,
  type ContactRow,
  type ConversationRow,
  type FollowupRow,
  type WorkspaceDashboardRow,
} from "@/lib/supabase/server";
import { countUniqueFans, getFanGroupKey } from "@/lib/fanIdentity";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { getWorkspaceNavigation } from "@/lib/workspaceNavigation";
import dashboardStyles from "../dashboard/dashboard.module.css";
import { markConversationDone, markConversationWaiting } from "../fans/actions";
import styles from "./inbox.module.css";

type InboxPageProps = {
  searchParams?: Promise<{ filter?: string | string[]; q?: string | string[] }>;
};

type InboxWorkspaceProps = {
  workspace: WorkspaceDashboardRow;
  userDisplayName: string;
  contacts: ContactRow[];
  contactsError?: string;
  followups: FollowupRow[];
  followupsError?: string;
  conversations: ConversationRow[];
  conversationsError?: string;
  activeFilter: InboxFilter;
  searchQuery: string;
};

type InboxFilter =
  | "all"
  | "open"
  | "waiting"
  | "due"
  | "high"
  | "ai"
  | "done";

type InboxQueueItem = {
  key: string;
  contactId: string;
  fanName: string;
  handle: string;
  initials: string;
  tags: string[];
  channel: string;
  channelClass: string;
  messagePreview: string;
  conversationType: string;
  segment: string;
  status: "Offen" | "Wartet" | "Erledigt" | "Archiviert";
  statusValue: string;
  conversationId?: string;
  priority: "Hoch" | "Mittel" | "Warm" | "Normal" | "Niedrig";
  priorityScore: number;
  waitingSince: string;
  waitingMinutes: number;
  owner: string;
  aiStatus: "KI-ready" | "Teilweise" | "Nicht bereit";
  nextStep: string;
  replyTargetUrl?: string;
  originalPreview?: string;
  sourceType?: "dm" | "comment" | "post" | "email" | "form" | "manual";
  sourcePlatformLabel?: string;
  unread: boolean;
  dueToday: boolean;
};

const filterChips: { label: string; value: InboxFilter }[] = [
  { label: "Alle", value: "all" },
  { label: "Offen", value: "open" },
  { label: "Wartet", value: "waiting" },
  { label: "Antwort fällig", value: "due" },
  { label: "Hohe Priorität", value: "high" },
  { label: "Mit KI vorbereitet", value: "ai" },
  { label: "Erledigt", value: "done" },
];

async function logout() {
  "use server";

  await signOutSupabaseServerSession();
  redirect("/login");
}

function InboxWorkspace({
  workspace,
  userDisplayName,
  contacts,
  contactsError,
  followups,
  followupsError,
  conversations,
  conversationsError,
  activeFilter,
  searchQuery,
}: InboxWorkspaceProps) {
  const { mainNavigation, settingsNavigation, savedViews } =
    getWorkspaceNavigation("inbox");
  const queueItems = conversations.length
    ? buildConversationInboxQueue(conversations, contacts)
    : buildInboxQueue(contacts, followups);
  const visibleItems = filterQueueItems(queueItems, activeFilter, searchQuery);
  const kpis = getInboxKpis(queueItems);

  return (
    <WorkspaceShell
      workspaceName={workspace.name}
      userLabel={userDisplayName || workspace.name || "Nutzer"}
      planLabel={workspace.plan_id}
      planMeta={workspace.role}
      planStatus="Aktiv"
      mainNavigation={mainNavigation}
      settingsNavigation={settingsNavigation}
      savedViews={savedViews}
      header={{
        title: "Inbox",
        subtitle:
          "Priorisierte Arbeitsliste für eingehende Nachrichten, Follow-ups und KI-vorbereitete Antworten.",
        searchPlaceholder: "Suche nach Fan, Kanal, Nachricht, Segment …",
        primaryActionLabel: "Zur Fanliste",
        primaryActionHref: "/fans#fans-list",
      }}
      contactCount={countUniqueFans(contacts)}
      openFollowupCount={followups.length}
      logoutAction={logout}
    >
      <div className={styles.inboxStack}>
        <section className={styles.introBar} aria-label="Inbox Suche">
          <div>
            <p className={dashboardStyles.eyebrow}>Lokale MVP-Arbeitsliste</p>
            <h2>Workspace-Daten statt Social-Sync</h2>
            <p>
              Die Queue nutzt echte gespeicherte Conversations. Wenn noch keine
              Conversation existiert, bleibt der vorhandene
              Kontakte-/Follow-up-Fallback aktiv.
            </p>
          </div>
          <form className={styles.searchForm} action="/inbox">
            <input type="hidden" name="filter" value={activeFilter} />
            <label className={styles.searchLabel} htmlFor="inbox-search">
              Suche
            </label>
            <input
              id="inbox-search"
              name="q"
              defaultValue={searchQuery}
              placeholder="Suche nach Fan, Kanal, Nachricht, Segment …"
            />
          </form>
        </section>

        <section className={styles.kpiGrid} aria-label="Inbox Kennzahlen">
          {kpis.map((kpi) => (
            <article className={styles.kpiCard} key={kpi.label}>
              <span>{kpi.label}</span>
              <strong>{kpi.value}</strong>
              <small>{kpi.meta}</small>
            </article>
          ))}
        </section>

        <div className={styles.contentGrid}>
          <section className={styles.queueCard} aria-labelledby="queue-title">
            <div className={styles.queueHeader}>
              <div>
                <p className={dashboardStyles.eyebrow}>Conversation Queue</p>
                <h2 id="queue-title">Offene Konversationen</h2>
              </div>
              <Link className={styles.secondaryLink} href="/fans#fans-list">
                Zur Fanliste
              </Link>
            </div>

            {contactsError ? (
              <ErrorBox
                title="Kontakte konnten nicht geladen werden."
                message={contactsError}
              />
            ) : null}
            {followupsError ? (
              <ErrorBox
                title="Follow-ups konnten nicht geladen werden."
                message={followupsError}
              />
            ) : null}
            {conversationsError ? (
              <ErrorBox
                title="Conversations konnten nicht geladen werden."
                message={conversationsError}
              />
            ) : null}

            <nav className={styles.filterBar} aria-label="Inbox Filter">
              {filterChips.map((chip) => (
                <Link
                  className={
                    chip.value === activeFilter
                      ? styles.filterChipActive
                      : styles.filterChip
                  }
                  href={`/inbox?filter=${chip.value}${
                    searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""
                  }`}
                  key={chip.value}
                >
                  {chip.label}
                </Link>
              ))}
            </nav>

            {visibleItems.length ? (
              <QueueList items={visibleItems} />
            ) : (
              <EmptyState />
            )}
          </section>

          <aside className={styles.sideRail} aria-label="Inbox Regeln">
            <InfoCard
              title="Queue-Regeln"
              items={[
                "VIP zuerst",
                "Käufer priorisieren",
                "Negative Stimmung markieren",
                "Antworten nie automatisch senden",
              ]}
            />
            <div className={styles.noticeCard}>
              <h3>Hinweis</h3>
              <p>
                FanMind zentralisiert Eingänge. Antworten werden manuell geprüft
                und erst nach Freigabe gesendet.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </WorkspaceShell>
  );
}

function ErrorBox({ title, message }: { title: string; message: string }) {
  return (
    <p className={dashboardStyles.error}>
      <strong>{title}</strong>
      <span>{message}</span>
    </p>
  );
}

function QueueList({ items }: { items: InboxQueueItem[] }) {
  return (
    <div
      className={styles.queueTable}
      role="table"
      aria-label="Lokale Conversation Queue"
    >
      <div className={`${styles.queueRow} ${styles.queueHead}`} role="row">
        <span>Auswahl</span>
        <span>Fan</span>
        <span>Kanal</span>
        <span>Letzte Nachricht</span>
        <span>Typ</span>
        <span>Status</span>
        <span>Priorität</span>
        <span>Wartet seit</span>
        <span>Owner</span>
        <span>KI-Status</span>
        <span>Nächster Schritt</span>
        <span>Original</span>
      </div>
      {items.map((item) => (
        <div className={styles.queueRowWrap} key={item.key}>
          <div className={styles.selectCell}>
            <input aria-label={`${item.fanName} auswählen`} type="checkbox" />
          </div>
          <Link
            className={styles.queueRowLink}
            href={`/fans/${item.contactId}`}
          >
            <span className={styles.fanCell}>
              <span className={styles.avatar}>{item.initials}</span>
              <span>
                <strong>{item.fanName}</strong>
                <small>{item.handle}</small>
                <em>
                  {item.tags.slice(0, 2).join(" · ") || "Workspace-Daten"}
                </em>
              </span>
            </span>
            <span>
              <b
                className={`${styles.channelBadge} ${styles[item.channelClass]}`}
              >
                {item.channel}
              </b>
            </span>
            <span className={styles.messageCell}>
              {item.messagePreview}
              {item.originalPreview ? <small>{item.originalPreview}</small> : null}
            </span>
            <span>{item.conversationType}</span>
            <span>{item.status}</span>
            <span>
              <b
                className={`${styles.priorityBadge} ${
                  styles[`priority${item.priority}`]
                }`}
              >
                {item.priority}
              </b>
            </span>
            <span>{item.waitingSince}</span>
            <span>{item.owner}</span>
            <span>
              <b className={styles.aiBadge}>{item.aiStatus}</b>
            </span>
            <span className={styles.nextStep}>{item.nextStep}</span>
          </Link>
          <div className={styles.originalCell}>
            {item.replyTargetUrl ? (
              <a
                className={styles.originalLink}
                href={item.replyTargetUrl}
                rel="noreferrer"
                target="_blank"
              >
                {getOriginalActionLabel(item.sourceType, item.replyTargetUrl, item.sourcePlatformLabel)}
              </a>
            ) : (
              <button
                className={styles.originalLinkDisabled}
                title="Für diesen Kontakt ist noch kein Original-Chat-Link gespeichert."
                type="button"
                disabled
              >
                Original-Link noch nicht verfügbar
              </button>
            )}
            {!item.replyTargetUrl ? (
              <small>
                Original-Link noch nicht verfügbar. Spätere Echt-Events können hier den Kommentar- oder Chat-Link liefern.
              </small>
            ) : null}
            <div className={styles.rowActions}>
              <Link href={`/fans/${item.contactId}?focus=reply`}>
                Antwort vorbereiten
              </Link>
              <Link href={`/fans/${item.contactId}?focus=followup`}>
                Follow-up planen
              </Link>
              {item.conversationId ? (
                <>
                  <form action={markConversationDone}>
                    <input name="contact_id" type="hidden" value={item.contactId} />
                    <input name="conversation_id" type="hidden" value={item.conversationId} />
                    <input name="return_to" type="hidden" value="inbox" />
                    <button type="submit">Als erledigt</button>
                  </form>
                  <form action={markConversationWaiting}>
                    <input name="contact_id" type="hidden" value={item.contactId} />
                    <input name="conversation_id" type="hidden" value={item.conversationId} />
                    <input name="return_to" type="hidden" value="inbox" />
                    <button type="submit">Wartet</button>
                  </form>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className={dashboardStyles.emptyState}>
      <strong>Keine Queue-Einträge für diesen Filter.</strong>
      <p>
        Lege Fans oder offene Follow-ups an, um die lokale MVP-Arbeitsliste zu
        füllen. Ohne echte Social-Synchronisierung wird keine externe
        Eingangsnachricht behauptet.
      </p>
    </div>
  );
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className={styles.rulesCard}>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function buildConversationInboxQueue(
  conversations: ConversationRow[],
  contacts: ContactRow[],
): InboxQueueItem[] {
  const contactsById = new Map(
    contacts.map((contact) => [contact.id, contact]),
  );

  return conversations
    .map<InboxQueueItem | null>((conversation) => {
      const contact = contactsById.get(conversation.contact_id);
      if (!contact) return null;

      const tags = contact.tags ?? [];
      const priority = getConversationPriority(conversation.priority);
      const waitingMinutes = getWaitingMinutes(
        null,
        conversation.last_inbound_at ??
          conversation.updated_at ??
          conversation.created_at,
      );
      const channel = getChannelLabel(
        conversation.source_platform ?? contact.source_platform,
      );
      const replyTargetUrl =
        conversation.reply_target_url || conversation.source_url || undefined;

      return {
        key: conversation.id,
        conversationId: conversation.id,
        contactId: contact.id,
        fanName: contact.display_name || contact.handle || "Unbenannter Fan",
        handle: contact.handle || "Kein Handle hinterlegt",
        initials: getInitials(contact.display_name || contact.handle),
        tags,
        channel,
        channelClass: getChannelClass(
          conversation.source_platform ?? contact.source_platform,
        ),
        messagePreview:
          conversation.last_message_preview ||
          "Conversation ohne gespeicherte Vorschau.",
        conversationType: formatConversationType(conversation.source_type),
        segment: getSegment(contact),
        status: formatConversationStatus(conversation.status),
        statusValue: conversation.status,
        priority,
        priorityScore: getPriorityScore(priority),
        waitingSince: formatWaitingSince(waitingMinutes),
        waitingMinutes,
        owner: conversation.assigned_owner || "Team Inbox",
        aiStatus: formatAiStatus(conversation.ai_status),
        nextStep: conversation.next_step || "Antwort vorbereiten",
        replyTargetUrl,
        originalPreview: conversation.original_text_excerpt ?? undefined,
        sourceType: getSourceType(conversation.source_type),
        sourcePlatformLabel: channel,
        unread: Boolean(conversation.last_inbound_at),
        dueToday: false,
      } satisfies InboxQueueItem;
    })
    .filter((item): item is InboxQueueItem => Boolean(item))
    .sort(
      (a, b) =>
        b.priorityScore - a.priorityScore ||
        b.waitingMinutes - a.waitingMinutes,
    );
}

function buildInboxQueue(
  contacts: ContactRow[],
  followups: FollowupRow[],
): InboxQueueItem[] {
  const followupsByContact = new Map<string, FollowupRow[]>();

  for (const followup of followups) {
    if (followup.status && followup.status !== "open") {
      continue;
    }

    followupsByContact.set(followup.contact_id, [
      ...(followupsByContact.get(followup.contact_id) ?? []),
      followup,
    ]);
  }

  const itemsByFan = new Map<string, InboxQueueItem>();

  for (const contact of contacts) {
    const contactFollowups = followupsByContact.get(contact.id) ?? [];
    const item = createQueueItem(contact, contactFollowups);
    const existing = itemsByFan.get(item.key);

    if (
      !existing ||
      item.priorityScore > existing.priorityScore ||
      item.waitingMinutes > existing.waitingMinutes
    ) {
      itemsByFan.set(item.key, item);
    }
  }

  return Array.from(itemsByFan.values()).sort(
    (a, b) =>
      b.priorityScore - a.priorityScore || b.waitingMinutes - a.waitingMinutes,
  );
}

function createQueueItem(
  contact: ContactRow,
  followups: FollowupRow[],
): InboxQueueItem {
  const tags = contact.tags ?? [];
  const latestFollowup = followups[0];
  const priority = getPriority(contact, latestFollowup);
  const waitingMinutes = getWaitingMinutes(
    latestFollowup?.due_date,
    contact.updated_at ?? contact.created_at,
  );
  const hasContext = Boolean(
    contact.summary?.trim() || latestFollowup?.reason?.trim(),
  );
  const hasTags = tags.length > 0;
  const replyTargetUrl = getReplyTargetUrl(contact);
  const sourcePlatformLabel = getChannelLabel(contact.source_platform);

  return {
    key: getFanGroupKey(contact),
    contactId: contact.id,
    fanName: contact.display_name || contact.handle || "Unbenannter Fan",
    handle: contact.handle || "Kein Handle hinterlegt",
    initials: getInitials(contact.display_name || contact.handle),
    tags,
    channel: getChannelLabel(contact.source_platform),
    channelClass: getChannelClass(contact.source_platform),
    messagePreview:
      latestFollowup?.reason ||
      "Noch keine gespeicherte Eingangsnachricht. Kontext manuell einfügen.",
    conversationType: getConversationType(
      contact.source_platform,
      latestFollowup,
    ),
    segment: getSegment(contact),
    status: "Offen",
    statusValue: "open",
    priority,
    priorityScore: getPriorityScore(priority) + (latestFollowup ? 20 : 0),
    waitingSince: formatWaitingSince(waitingMinutes),
    waitingMinutes,
    owner: "Team Inbox",
    aiStatus:
      hasContext && hasTags
        ? "KI-ready"
        : hasContext
          ? "Teilweise"
          : "Nicht bereit",
    nextStep: latestFollowup
      ? "Antwort vorbereiten"
      : hasContext
        ? "Vorschlag laden"
        : "Info bereitstellen",
    replyTargetUrl,
    sourceType: getSourceType(contact.source_platform),
    sourcePlatformLabel,
    unread: Boolean(latestFollowup),
    dueToday: isDueToday(latestFollowup?.due_date),
  };
}

function getConversationPriority(
  value: string | null,
): InboxQueueItem["priority"] {
  if (value === "high") return "Hoch";
  if (value === "medium") return "Mittel";
  if (value === "low") return "Niedrig";
  return "Normal";
}

function formatConversationStatus(value: string): InboxQueueItem["status"] {
  if (value === "waiting") return "Wartet";
  if (value === "done") return "Erledigt";
  if (value === "archived") return "Archiviert";
  return "Offen";
}

function formatAiStatus(value: string | null): InboxQueueItem["aiStatus"] {
  if (value === "ready") return "KI-ready";
  if (value === "partial") return "Teilweise";
  return "Nicht bereit";
}

function formatConversationType(value: string | null): string {
  const labels: Record<string, string> = {
    facebook_messages: "Facebook Nachrichten",
    facebook_comments: "Facebook Kommentare",
    dm: "DM",
    comment: "Kommentar",
    post_comment: "Post-Kommentar",
    post: "Post",
    email: "E-Mail",
    form: "Formular",
    note: "Notiz",
    manual: "Manuell",
  };
  return labels[value ?? ""] ?? "DM";
}

function getPriority(
  contact: ContactRow,
  followup?: FollowupRow,
): InboxQueueItem["priority"] {
  const raw = `${followup?.priority ?? ""} ${contact.status ?? ""} ${(
    contact.tags ?? []
  ).join(" ")}`.toLowerCase();

  if (/high|hoch|urgent|vip|kritisch/.test(raw)) return "Hoch";
  if (/buyer|käufer|kaeufer|kunde/.test(raw)) return "Mittel";
  if (/warm|follow/.test(raw)) return "Warm";
  if (/low|niedrig|paused|inactive/.test(raw)) return "Niedrig";

  return "Normal";
}

function getPriorityScore(priority: InboxQueueItem["priority"]): number {
  return { Hoch: 100, Mittel: 75, Warm: 60, Normal: 40, Niedrig: 10 }[priority];
}

function getSegment(contact: ContactRow): string {
  const raw =
    `${contact.status ?? ""} ${(contact.tags ?? []).join(" ")}`.toLowerCase();

  if (raw.includes("vip")) return "VIP";
  if (/buyer|käufer|kaeufer|kunde/.test(raw)) return "Käufer";
  if (/event|show|meet/.test(raw)) return "Event";
  if (raw.includes("warm")) return "Warm";

  return "Fan";
}

function getChannelLabel(value: string | null): string {
  const labels: Record<string, string> = {
    facebook: "Facebook",
    messenger: "Messenger",
    facebook_messenger: "Messenger",
    instagram: "Instagram",
    whatsapp: "WhatsApp",
    email: "E-Mail",
    form: "Webformular",
    webform: "Webformular",
    manual: "Manuell",
    tiktok: "TikTok",
  };

  return labels[(value ?? "manual").toLowerCase()] ?? "Manuell";
}

function getReplyTargetUrl(contact: ContactRow): string | undefined {
  const metadata = contact as ContactRow & Record<string, unknown>;

  for (const key of [
    "source_url",
    "reply_target_url",
    "external_thread_url",
    "external_message_url",
    "replyTargetUrl",
  ]) {
    const value = metadata[key];

    if (typeof value === "string" && /^https?:\/\//i.test(value.trim())) {
      return value.trim();
    }
  }

  return undefined;
}

function getSourceType(source: string | null): InboxQueueItem["sourceType"] {
  const value = (source ?? "").toLowerCase();

  if (value.includes("facebook_comments")) return "comment";
  if (value.includes("facebook_messages")) return "dm";
  if (value.includes("mail")) return "email";
  if (value.includes("form") || value.includes("web")) return "form";
  if (value.includes("post") && (value.includes("comment") || value.includes("kommentar"))) return "post";
  if (value.includes("comment") || value.includes("kommentar"))
    return "comment";
  if (value.includes("post")) return "post";
  if (value.includes("manual") || !value) return "manual";

  return "dm";
}

function getOriginalActionLabel(
  sourceType?: InboxQueueItem["sourceType"],
  url?: string,
  platform?: string,
): string {
  const normalized = `${sourceType ?? ""} ${platform ?? ""}`.toLowerCase();

  if (normalized.includes("comment") || normalized.includes("kommentar")) {
    return url ? "Kommentar öffnen" : "Original-Link noch nicht verfügbar";
  }

  if (normalized.includes("post")) return "Beitrag öffnen";
  if (normalized.includes("dm") || normalized.includes("message") || normalized.includes("messenger")) {
    return url ? "Chat öffnen" : "Original-Link noch nicht verfügbar";
  }

  return url ? "Original öffnen" : "Original-Link noch nicht verfügbar";
}

function getChannelClass(value: string | null): string {
  const channel = (value ?? "manual").toLowerCase();

  if (channel.includes("instagram")) return "channelInstagram";
  if (channel.includes("facebook") || channel.includes("messenger"))
    return "channelInstagram";
  if (channel.includes("whatsapp")) return "channelWhatsapp";
  if (channel.includes("email")) return "channelEmail";
  if (channel.includes("form")) return "channelForm";

  return "channelManual";
}

function getConversationType(
  source: string | null,
  followup?: FollowupRow,
): string {
  if (!followup) return "Manuell";

  const value = (source ?? "").toLowerCase();

  if (value.includes("facebook_comments")) return "Facebook Kommentare";
  if (value.includes("facebook_messages")) return "Facebook Nachrichten";
  if (value.includes("email")) return "E-Mail";
  if (value.includes("form")) return "Formular";
  if (value.includes("post") && (value.includes("comment") || value.includes("kommentar"))) return "Post-Kommentar";
  if (value.includes("comment") || value.includes("kommentar")) return "Kommentar";
  if (
    value.includes("instagram") ||
    value.includes("whatsapp") ||
    value.includes("tiktok")
  ) {
    return "DM";
  }

  return "Notiz";
}

function getWaitingMinutes(
  dueDate?: string | null,
  fallbackDate?: string | null,
): number {
  const value = dueDate ? `${dueDate}T00:00:00Z` : fallbackDate;

  if (!value) return 0;

  return Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 60000),
  );
}

function formatWaitingSince(minutes: number): string {
  if (minutes <= 0) return "—";
  if (minutes < 60) return `${minutes} Min.`;

  const hours = Math.floor(minutes / 60);

  if (hours < 48) return `${hours} Std.`;

  return `${Math.floor(hours / 24)} Tage`;
}

function isDueToday(value?: string | null): boolean {
  if (!value) return false;

  return value <= new Date().toISOString().slice(0, 10);
}

function getInitials(value?: string | null): string {
  const parts = (value ?? "FM")
    .replace(/^@/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);

  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "FM"
  );
}

function filterQueueItems(
  items: InboxQueueItem[],
  filter: InboxFilter,
  query: string,
): InboxQueueItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  return items.filter((item) => {
    const matchesFilter =
      (filter === "all" && item.statusValue !== "done") ||
      (filter === "open" && item.statusValue === "open") ||
      (filter === "waiting" && item.statusValue === "waiting") ||
      (filter === "due" && item.dueToday) ||
      (filter === "high" && item.priority === "Hoch") ||
      (filter === "ai" && item.aiStatus === "KI-ready") ||
      (filter === "done" && item.statusValue === "done");

    if (!matchesFilter) return false;
    if (!normalizedQuery) return true;

    return [
      item.fanName,
      item.handle,
      item.channel,
      item.messagePreview,
      item.segment,
      ...item.tags,
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery);
  });
}

function getInboxKpis(items: InboxQueueItem[]) {
  const responseReady = items.filter(
    (item) => item.aiStatus === "KI-ready",
  ).length;
  const averageMinutes = items.length
    ? Math.round(
        items.reduce((sum, item) => sum + item.waitingMinutes, 0) /
          items.length,
      )
    : 0;

  return [
    {
      label: "Offene Konversationen",
      value: String(items.length),
      meta: "pro Fan dedupliziert",
    },
    {
      label: "Wartet",
      value: String(items.filter((item) => item.statusValue === "waiting").length),
      meta: "auf Fan-Antwort",
    },
    {
      label: "Antwort fällig heute",
      value: String(items.filter((item) => item.dueToday).length),
      meta: "aus Fälligkeitsdatum",
    },
    {
      label: "Hohe Priorität",
      value: String(items.filter((item) => item.priority === "Hoch").length),
      meta: "Status, Tags, Follow-ups",
    },
    {
      label: "Mit KI vorbereitet",
      value: String(responseReady),
      meta: "Kontext + Tags vorhanden",
    },
    {
      label: "Ø Antwortzeit",
      value:
        averageMinutes >= 1440
          ? `${Math.round(averageMinutes / 1440)} Tage`
          : `${Math.round(averageMinutes / 60)} Std.`,
      meta: "lokal abgeleitet",
    },
  ];
}

function stringMetadataValue(
  metadata: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const value = metadata?.[key];

  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function getUserDisplayName(
  metadata: Record<string, unknown> | undefined,
  workspaceName: string,
): string {
  return (
    stringMetadataValue(metadata, "display_name") ??
    stringMetadataValue(metadata, "name") ??
    stringMetadataValue(metadata, "full_name") ??
    workspaceName ??
    "Nutzer"
  );
}

function normalizeParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function normalizeFilter(value: string): InboxFilter {
  return filterChips.some((chip) => chip.value === value)
    ? (value as InboxFilter)
    : "all";
}

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const params = await searchParams;
  const { data } = await getSupabaseServerUser();

  if (!data.user) {
    redirect("/login");
  }

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  const workspace = workspaceResult.workspace;
  const contactsResult = workspace
    ? await getWorkspaceContacts(workspace.id)
    : null;
  const followupsResult = workspace
    ? await getWorkspaceOpenFollowups(workspace.id)
    : null;
  const conversationsResult = workspace
    ? await getWorkspaceConversations(workspace.id)
    : null;

  return (
    <main className={dashboardStyles.page}>
      {workspace ? (
        <InboxWorkspace
          workspace={workspace}
          userDisplayName={getUserDisplayName(
            data.user.user_metadata,
            workspace.name,
          )}
          contacts={contactsResult?.contacts ?? []}
          contactsError={contactsResult?.error?.message}
          followups={followupsResult?.followups ?? []}
          followupsError={followupsResult?.error?.message}
          conversations={conversationsResult?.conversations ?? []}
          conversationsError={conversationsResult?.error?.message}
          activeFilter={normalizeFilter(normalizeParam(params?.filter))}
          searchQuery={normalizeParam(params?.q)}
        />
      ) : (
        <section
          className={dashboardStyles.fallbackCard}
          aria-label="FanMind Inbox"
        >
          <h1>Inbox</h1>
          <p>Workspace konnte noch nicht geladen werden.</p>
          {workspaceResult.error ? (
            <p className={dashboardStyles.error}>
              <strong>Workspace-Daten konnten nicht geladen werden.</strong>
              <span>{workspaceResult.error.message}</span>
            </p>
          ) : null}
        </section>
      )}
    </main>
  );
}
