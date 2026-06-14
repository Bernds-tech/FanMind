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
import styles from "./fan-detail.module.css";
import { AiReplySuggestions } from "./AiReplySuggestions";
import {
  markConversationDone,
  markConversationWaiting,
  reopenConversation,
  saveInboundMessage,
  saveManualSentReply,
  saveReplyDraft,
  setConversationPriority,
} from "../actions";

type FanDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ notice?: string | string[] }>;
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
  followupsError?: string;
  messages: ConversationMessageRow[];
  messagesError?: string;
  conversation: ConversationRow | null;
  conversationsError?: string;
  openFollowupCount: number;
  notice?: string;
  conversationSummary: ConversationSummaryRow | null;
  contactAiProfile: ContactAiProfileRow | null;
  workspaceVoiceProfile: WorkspaceVoiceProfileRow | null;
};

const statusLabels: Record<string, string> = {
  new: "Neu",
  active: "Aktiv",
  warm: "Warm",
  follow_up: "Follow-up",
  paused: "Pausiert",
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
  followupsError,
  messages,
  messagesError,
  conversation,
  conversationsError,
  openFollowupCount,
  notice,
  conversationSummary,
  contactAiProfile,
  workspaceVoiceProfile,
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
        searchPlaceholder: "Suche bleibt in dieser MVP-Ansicht unverändert ...",
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
            followupsError={followupsError}
            memories={memories}
            memoriesError={memoriesError}
            messages={messages}
            messagesError={messagesError}
            conversation={conversation}
            conversationsError={conversationsError}
            conversationSummary={conversationSummary}
            contactAiProfile={contactAiProfile}
            workspaceVoiceProfile={workspaceVoiceProfile}
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
  followupsError,
  messages,
  messagesError,
  conversation,
  conversationsError,
  conversationSummary,
  contactAiProfile,
  workspaceVoiceProfile,
}: {
  contact: ContactRow;
  memories: MemoryRow[];
  memoriesError?: string;
  followups: FollowupRow[];
  followupsError?: string;
  messages: ConversationMessageRow[];
  messagesError?: string;
  conversation: ConversationRow | null;
  conversationsError?: string;
  conversationSummary: ConversationSummaryRow | null;
  contactAiProfile: ContactAiProfileRow | null;
  workspaceVoiceProfile: WorkspaceVoiceProfileRow | null;
}) {
  const primaryChannel = formatSource(contact.source_platform);
  const tags = contact.tags?.length
    ? contact.tags
    : [formatStatus(contact.status)];
  const fanScore = calculateFanScore(
    contact,
    memories.length,
    followups.length,
  );
  const timeline = messages.length ? buildMessageTimeline(messages) : [];
  const originalChatUrl = getOriginalChatUrl(contact, messages, conversation);
  const originalActionLabel = getOriginalActionLabel(primaryChannel);
  const openFollowups = followups.filter(
    (followup) => followup.status !== "done",
  );

  return (
    <>
      <section className={styles.contactHeader} aria-label="Fan-Workbench">
        <div className={styles.headerMeta}>
          <p className={styles.handle}>
            {contact.handle || "Kein Handle hinterlegt"}
          </p>
          <div className={styles.pillRow} aria-label="Status und Segmente">
            <span className={styles.statusBadge}>
              {formatStatus(contact.status)}
            </span>
            {tags.slice(0, 5).map((tag) => (
              <span className={styles.tag} key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <dl className={styles.headerMetrics}>
          <div className={styles.metric}>
            <dt>Owner</dt>
            <dd>
              <strong>Team Inbox</strong>
            </dd>
          </div>
          <div className={styles.metric}>
            <dt>Fan Score</dt>
            <dd>
              <strong>{fanScore}/100</strong>
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
            <dt>Interaktionen</dt>
            <dd>
              <strong>
                {messages.length + memories.length + followups.length}
              </strong>
            </dd>
          </div>
          <div className={styles.metric}>
            <dt>Käufe</dt>
            <dd>
              <strong>
                {contact.tags?.some((tag) =>
                  tag.toLowerCase().includes("käufer"),
                )
                  ? "Hinweis in Tags"
                  : "Nicht hinterlegt"}
              </strong>
            </dd>
          </div>
          <div className={styles.metric}>
            <dt>Antwortstil-Match</dt>
            <dd>
              <strong>
                {contact.language === "de" ? "Hoch · DE" : "Zu prüfen"}
              </strong>
            </dd>
          </div>
          <div className={styles.metric}>
            <dt>Reaktionschance</dt>
            <dd>
              <strong>
                {fanScore > 70 ? "Hoch" : fanScore > 48 ? "Mittel" : "Unklar"}
              </strong>
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

        <nav className={styles.tabs} aria-label="Fan-Detail Tabs">
          <span className={styles.tabActive}>Überblick</span>
          <span className={styles.tab}>Verlauf</span>
          <span className={styles.tab}>Analyse</span>
          <span className={styles.tab}>Memory</span>
          <span className={styles.tab}>Dateien</span>
          <span className={styles.tab}>Follow-ups</span>
        </nav>
      </section>

      <section
        className={styles.workbenchGrid}
        aria-label="Conversation Workbench"
      >
        <aside className={styles.rail} aria-label="Fan-Kontext">
          <ContextCard
            title="Fan-Gedächtnis"
            eyebrow="Echte Daten"
            items={memories.map((memory) => ({
              title: formatMemoryType(memory.type),
              body: memory.content,
              meta: `Wichtigkeit: ${memory.importance ?? "normal"} · ${formatDate(memory.created_at)}`,
            }))}
            emptyTitle="Noch keine Memories gespeichert."
            emptyBody="Gespeicherte KI- oder Team-Memories erscheinen hier."
            error={memoriesError}
          />
          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <p className={dashboardStyles.eyebrow}>Kontext</p>
                <h3>Interessen, Tonalität & Grenzen</h3>
              </div>
              <span className={styles.pill}>MVP</span>
            </div>
            <div className={styles.compactList}>
              <InfoBlock
                title="Interessen"
                body={
                  contact.summary ||
                  tags.join(", ") ||
                  "Noch nicht sauber erkannt."
                }
              />
              <InfoBlock
                title="Kaufhistorie"
                body={
                  contact.tags?.some((tag) =>
                    tag.toLowerCase().includes("käufer"),
                  )
                    ? "Kauf-/Kundensignal aus Tags vorhanden."
                    : "Keine Kaufhistorie in FanMind hinterlegt."
                }
              />
              <InfoBlock
                title="Tonalität"
                body={
                  contact.language === "de"
                    ? "Deutsch, direkt, hilfreich; Emojis sparsam einsetzen."
                    : "Sprache und Stil vor Versand manuell prüfen."
                }
              />
              <InfoBlock
                title="Grenzen / No-Gos"
                body="Keine automatische Sendung, keine extern synchronisierten Plattformdaten behaupten."
              />
              <InfoBlock
                title="Gute Trigger"
                body="Auf letzte Nachricht eingehen, Memory nutzen, nächsten manuellen Schritt klar machen."
              />
            </div>
          </article>
          <ContextCard
            title="Offene Follow-ups"
            eyebrow="Echte Daten"
            items={openFollowups.map((followup) => ({
              title: formatFollowupDueDate(followup.due_date),
              body: followup.reason,
              meta: `Priorität: ${followup.priority ?? "normal"} · Status: ${followup.status ?? "open"}`,
            }))}
            emptyTitle="Keine offenen Follow-ups."
            emptyBody="KI-Empfehlungen können über sichere Server Actions gespeichert werden."
            error={followupsError}
          />
          <ProfileStatusCard
            conversationSummary={conversationSummary}
            contactAiProfile={contactAiProfile}
            workspaceVoiceProfile={workspaceVoiceProfile}
          />
          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <p className={dashboardStyles.eyebrow}>Dateien & Historie</p>
                <h3>Arbeitsnotizen</h3>
              </div>
              <span className={styles.pill}>Empty</span>
            </div>
            <p className={styles.muted}>
              Keine Dateien oder externen Plattform-Historien verknüpft. Diese
              Workbench zeigt nur Workspace-Kontakt, Memories und Follow-ups als
              echte Daten.
            </p>
          </article>
        </aside>

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
              <span className={styles.pill}>Lokale MVP-Struktur</span>
            </div>
            <InboundMessageForm contactId={contact.id} />
            <OriginalChatAction
              actionLabel={originalActionLabel}
              className={styles.originalChatPanel}
              url={originalChatUrl}
            />
            <div className={styles.filterChips} aria-label="Verlaufsfilter">
              <span>Alle</span>
              <span>Instagram</span>
              <span>WhatsApp</span>
              <span>E-Mail</span>
              <span>Webformular</span>
              <span>Notizen</span>
            </div>
            {conversationsError ? (
              <p className={dashboardStyles.error}>
                <strong>Conversation-Daten konnten gerade nicht geladen werden.</strong>
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
                    <div className={styles.messageMeta}>
                      <span>
                        {item.direction} · {item.type}
                      </span>
                      <span>
                        {item.channel} · {item.time}
                      </span>
                    </div>
                    <p>{item.text}</p>
                    <OriginalChatAction
                      actionLabel="Original öffnen"
                      url={item.url}
                    />
                  </article>
                ))
              ) : (
                <EmptyState
                  title="Noch kein gespeicherter Nachrichtenverlauf."
                  body="Erfasse eine Eingangsnachricht, um KI-Vorschläge und Verlauf aufzubauen."
                />
              )}
            </div>
          </article>
          <article className={styles.card}>
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
                <input name="conversation_id" type="hidden" value={conversation.id} />
              ) : null}
              <textarea
                name="content"
                required
                maxLength={4000}
                placeholder={`Antwort an ${contact.display_name} vorbereiten …`}
                aria-label={`Antwort an ${contact.display_name} vorbereiten`}
              />
              <div className={styles.replyFooter}>
                <button className={dashboardStyles.primaryButton} formAction={saveReplyDraft} type="submit">
                  Entwurf speichern
                </button>
                <button className={dashboardStyles.secondaryButton} formAction={saveManualSentReply} type="submit">
                  Als manuell gesendet speichern
                </button>
                <OriginalChatAction actionLabel={originalActionLabel} url={originalChatUrl} />
                <Link className={dashboardStyles.secondaryButton} href="/inbox">
                  Zur Inbox
                </Link>
                <span className={styles.safeBadge}>
                  Es wird nichts automatisch gesendet. Manuell gesendet im Originalkanal.
                </span>
              </div>
            </form>
            <ConversationActionForms contactId={contact.id} conversation={conversation} />
          </article>
        </main>

        <aside className={styles.copilot} aria-label="KI-CoPilot">
          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <p className={dashboardStyles.eyebrow}>KI-CoPilot</p>
                <h3>Analyse</h3>
              </div>
              <span className={styles.pill}>Keine Sendung</span>
            </div>
            <div className={styles.analysisGrid}>
              <InfoMetric
                label="Stimmung"
                value={contact.status === "warm" ? "Warm" : "Neutral"}
              />
              <InfoMetric
                label="Kaufinteresse"
                value={
                  tags.join(", ").toLowerCase().includes("vip")
                    ? "Hoch"
                    : "Zu prüfen"
                }
              />
              <InfoMetric
                label="Reaktionswahrscheinlichkeit"
                value={fanScore > 70 ? "Hoch" : "Mittel"}
              />
              <InfoMetric
                label="Beste Zeit"
                value="Manuell aus Verlauf ableiten"
              />
              <InfoMetric label="Risiko" value="Niedrig, solange geprüft" />
              <InfoMetric
                label="Stil-Match"
                value={contact.language === "de" ? "Deutsch" : "Unklar"}
              />
            </div>
          </article>
          <AiReplySuggestions
            contact={{
              contactId: contact.id,
              displayName: contact.display_name,
              handle: contact.handle,
              sourcePlatform: contact.source_platform,
              originalChatUrl,
              storedConversationContext: buildAiMessageContext(messages, conversationSummary, contactAiProfile, workspaceVoiceProfile),
              originalActionLabel,
              language: contact.language,
              status: contact.status,
              tags: contact.tags,
              summary: contact.summary,
            }}
          />
          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <p className={dashboardStyles.eyebrow}>Nächste beste Aktion</p>
                <h3>Priorisierte Empfehlung</h3>
              </div>
              <span className={styles.statusBadge}>
                Priorität {openFollowups.length ? "hoch" : "mittel"}
              </span>
            </div>
            <div className={styles.nextAction}>
              <strong>
                {openFollowups[0]?.reason ??
                  "Letzte Nachricht prüfen und Antwortentwurf vorbereiten."}
              </strong>
              <p className={styles.muted}>
                Begründung: FanMind hat {memories.length} Memories und{" "}
                {openFollowups.length} offene Follow-ups für diesen Kontakt
                geladen. Versand bleibt manuell.
              </p>
            </div>
            <div className={styles.quickActions}>
              <button type="button">Notiz speichern</button>
              <button type="button">Segment zuweisen</button>
              <button type="button">Follow-up planen</button>
              <button type="button">Profil öffnen</button>
            </div>
          </article>
        </aside>
      </section>
    </>
  );
}

function ProfileStatusCard({
  conversationSummary,
  contactAiProfile,
  workspaceVoiceProfile,
}: {
  conversationSummary: ConversationSummaryRow | null;
  contactAiProfile: ContactAiProfileRow | null;
  workspaceVoiceProfile: WorkspaceVoiceProfileRow | null;
}) {
  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <p className={dashboardStyles.eyebrow}>Memory & Stilprofile</p>
          <h3>Profile im Aufbau</h3>
        </div>
        <span className={styles.pill}>MVP</span>
      </div>
      <InfoBlock
        title="Fan-Profil im Aufbau"
        body={contactAiProfile
          ? `Sprache: ${contactAiProfile.language ?? "unbekannt"} · Ton: ${contactAiProfile.tone ?? "im Aufbau"} · Quellen: ${contactAiProfile.source_message_count ?? 0} inbound Nachrichten.`
          : "Noch keine echten Fan-Erkenntnisse gespeichert. Fan-Profil lernt nur aus inbound Nachrichten."}
      />
      <InfoBlock
        title="Workspace-Schreibstil im Aufbau"
        body={workspaceVoiceProfile
          ? `Ton: ${workspaceVoiceProfile.tone ?? "im Aufbau"} · Beispiele: ${workspaceVoiceProfile.examples_count ?? 0} manuell bestätigte Antworten.`
          : "Noch kein Schreibstilprofil gespeichert. Nur bestätigte manuell gesendete Antworten verbessern den Workspace-Schreibstil."}
      />
      <InfoBlock
        title="Conversation Summary"
        body={conversationSummary?.summary || "Noch keine Langzeit-Zusammenfassung vorhanden."}
      />
    </article>
  );
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
      <span>Priorität: {formatConversationPriority(conversation.priority)}</span>
      <span>Nächster Schritt: {conversation.next_step || "Antwort vorbereiten"}</span>
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
      {[markConversationDone, markConversationWaiting, reopenConversation].map(
        (action, index) => (
          <form action={action} key={index}>
            <input name="contact_id" type="hidden" value={contactId} />
            {conversation ? (
              <input name="conversation_id" type="hidden" value={conversation.id} />
            ) : null}
            <button className={dashboardStyles.secondaryButton} type="submit">
              {index === 0
                ? "Als erledigt markieren"
                : index === 1
                  ? "Wartet auf Fan"
                  : "Wieder öffnen"}
            </button>
          </form>
        ),
      )}
      <form action={setConversationPriority} className={styles.priorityForm}>
        <input name="contact_id" type="hidden" value={contactId} />
        {conversation ? (
          <input name="conversation_id" type="hidden" value={conversation.id} />
        ) : null}
        <select name="priority" defaultValue={conversation?.priority ?? "normal"}>
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

function InboundMessageForm({ contactId }: { contactId: string }) {
  return (
    <details className={styles.inboundCapture} open>
      <summary>Eingangsnachricht erfassen</summary>
      <form action={saveInboundMessage} className={styles.inboundForm}>
        <input name="contact_id" type="hidden" value={contactId} />
        <label>
          <span>Kanal/Plattform</span>
          <select name="source_platform" defaultValue="manual">
            <option value="manual">Manuell</option>
            <option value="instagram">Instagram</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="facebook">Facebook</option>
            <option value="x_twitter">X / Twitter</option>
            <option value="tiktok">TikTok</option>
            <option value="email">E-Mail</option>
            <option value="form">Webformular</option>
            <option value="other">Sonstiges</option>
          </select>
        </label>
        <label>
          <span>Typ</span>
          <select name="message_type" defaultValue="dm">
            <option value="dm">DM</option>
            <option value="comment">Kommentar</option>
            <option value="post">Post</option>
            <option value="email">E-Mail</option>
            <option value="form">Formular</option>
            <option value="note">Notiz</option>
          </select>
        </label>
        <label className={styles.inboundWide}>
          <span>Nachrichtentext</span>
          <textarea name="content" required maxLength={4000} />
        </label>
        <label className={styles.inboundWide}>
          <span>Original-Link / Chat-Link optional</span>
          <input name="source_url" placeholder="https://…" type="url" />
        </label>
        <button className={dashboardStyles.primaryButton} type="submit">
          Eingang speichern
        </button>
      </form>
    </details>
  );
}

function OriginalChatAction({
  actionLabel,
  className,
  url,
}: {
  actionLabel: string;
  className?: string;
  url?: string;
}) {
  return (
    <div className={className}>
      {url ? (
        <a
          className={dashboardStyles.secondaryButton}
          href={url}
          rel="noreferrer"
          target="_blank"
        >
          {actionLabel}
        </a>
      ) : (
        <p className={styles.originalChatMissing}>
          Original-Chat-Link noch nicht verbunden.
        </p>
      )}
    </div>
  );
}

function ContextCard({
  title,
  eyebrow,
  items,
  emptyTitle,
  emptyBody,
  error,
}: {
  title: string;
  eyebrow: string;
  items: { title: string; body: string; meta: string }[];
  emptyTitle: string;
  emptyBody: string;
  error?: string;
}) {
  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <p className={dashboardStyles.eyebrow}>{eyebrow}</p>
          <h3>{title}</h3>
        </div>
        <span className={styles.pill}>{items.length}</span>
      </div>
      {error ? (
        <p className={dashboardStyles.error}>
          <strong>{title} konnten nicht geladen werden.</strong>
          <span>{error}</span>
        </p>
      ) : null}
      {items.length ? (
        <div className={styles.compactList}>
          {items.map((item) => (
            <article
              className={styles.compactItem}
              key={`${item.title}-${item.body}`}
            >
              <strong>{item.title}</strong>
              <p>{item.body}</p>
              <p className={styles.muted}>{item.meta}</p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title={emptyTitle} body={emptyBody} />
      )}
    </article>
  );
}

function InfoBlock({ title, body }: { title: string; body: string }) {
  return (
    <article className={styles.compactItem}>
      <strong>{title}</strong>
      <p>{body}</p>
    </article>
  );
}

function InfoMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className={styles.label}>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MemoryCard({
  memories,
  memoriesError,
}: {
  memories: MemoryRow[];
  memoriesError?: string;
}) {
  return (
    <article className={dashboardStyles.moduleCard}>
      <div className={dashboardStyles.moduleHeader}>
        <div>
          <p className={dashboardStyles.eyebrow}>Fan-Gedächtnis</p>
          <h2>Gespeicherte Memories</h2>
        </div>
        <span>Echte Daten</span>
      </div>
      {memoriesError ? (
        <p className={dashboardStyles.error}>
          <strong>Memories konnten nicht geladen werden.</strong>
          <span>{memoriesError}</span>
        </p>
      ) : null}
      {memories.length ? (
        <div className={styles.contextList}>
          {memories.map((memory) => (
            <article className={styles.contextItem} key={memory.id}>
              <p>{memory.content}</p>
              <small>
                {formatMemoryType(memory.type)} · Wichtigkeit:{" "}
                {memory.importance ?? "normal"} ·{" "}
                {formatDate(memory.created_at)}
              </small>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Noch keine Memories gespeichert."
          body="Sobald du einen KI-vorgeschlagenen Memory speicherst, erscheint er hier."
        />
      )}
    </article>
  );
}

function FollowupCard({
  followups,
  followupsError,
  messages,
  messagesError,
  conversation,
  conversationsError,
}: {
  followups: FollowupRow[];
  followupsError?: string;
  messages: ConversationMessageRow[];
  messagesError?: string;
  conversation: ConversationRow | null;
  conversationsError?: string;
}) {
  return (
    <article className={dashboardStyles.moduleCard}>
      <div className={dashboardStyles.moduleHeader}>
        <div>
          <p className={dashboardStyles.eyebrow}>Follow-ups</p>
          <h2>Gespeicherte nächste Schritte</h2>
        </div>
        <span>Manuell</span>
      </div>
      {followupsError ? (
        <p className={dashboardStyles.error}>
          <strong>Follow-ups konnten nicht geladen werden.</strong>
          <span>{followupsError}</span>
        </p>
      ) : null}
      {followups.length ? (
        <div className={styles.contextList}>
          {followups.map((followup) => (
            <article className={styles.contextItem} key={followup.id}>
              <p>{followup.reason}</p>
              <small>
                {formatFollowupDueDate(followup.due_date)} · Priorität:{" "}
                {followup.priority ?? "normal"} · Status:{" "}
                {followup.status ?? "open"}
              </small>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Noch keine Follow-ups gespeichert."
          body="Sobald du einen KI-vorgeschlagenen Follow-up speicherst, erscheint er hier. Es wird nichts automatisch versendet."
        />
      )}
    </article>
  );
}

function PlaceholderCard({
  eyebrow,
  title,
  badge,
  body,
}: {
  eyebrow: string;
  title: string;
  badge: string;
  body: string;
}) {
  return (
    <article className={dashboardStyles.moduleCard}>
      <div className={dashboardStyles.moduleHeader}>
        <div>
          <p className={dashboardStyles.eyebrow}>{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <span>{badge}</span>
      </div>
      <EmptyState title={title} body={body} />
    </article>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className={dashboardStyles.emptyState}>
      <strong>{title}</strong>
      <p>{body}</p>
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

function calculateFanScore(
  contact: ContactRow,
  memoryCount: number,
  followupCount: number,
): number {
  const tagScore = Math.min(contact.tags?.length ?? 0, 6) * 6;
  const statusScore =
    contact.status === "warm" ? 22 : contact.status === "active" ? 18 : 10;
  const contextScore = contact.summary ? 14 : 0;
  const memoryScore = Math.min(memoryCount, 4) * 5;
  const followupScore = followupCount ? 8 : 0;

  return Math.min(
    100,
    32 + tagScore + statusScore + contextScore + memoryScore + followupScore,
  );
}

function buildMessageTimeline(messages: ConversationMessageRow[]) {
  return messages.map((message) => ({
    id: message.id,
    direction: formatDirection(message.direction),
    type: message.direction === "note" && message.author_label === "Antwortentwurf"
      ? "Antwortentwurf · nicht gesendet"
      : formatMessageType(message.message_type),
    channel: formatSource(message.source_platform),
    time: formatDate(message.created_at),
    text: message.content,
    url: message.reply_target_url || message.source_url || undefined,
  }));
}

function buildAiMessageContext(
  messages: ConversationMessageRow[],
  conversationSummary: ConversationSummaryRow | null,
  contactAiProfile: ContactAiProfileRow | null,
  workspaceVoiceProfile: WorkspaceVoiceProfileRow | null,
): string {
  const profileContext = [
    conversationSummary?.summary ? `Conversation Summary: ${conversationSummary.summary}` : "",
    contactAiProfile ? `Fan-Profil: Sprache ${contactAiProfile.language ?? "unbekannt"}, Ton ${contactAiProfile.tone ?? "im Aufbau"}, Quellen ${contactAiProfile.source_message_count ?? 0}.` : "",
    workspaceVoiceProfile ? `Workspace-Schreibstil: Ton ${workspaceVoiceProfile.tone ?? "im Aufbau"}, Beispiele ${workspaceVoiceProfile.examples_count ?? 0}.` : "",
    "Sicherheitsgrenze: nichts automatisch senden; Antwort nur als Entwurf oder manuell gesendet dokumentieren.",
  ].filter(Boolean).join("\n");
  const recentMessages = messages
    .slice(-50)
    .map(
      (message) =>
        `${formatDate(message.created_at)} · ${formatDirection(message.direction)} · ${formatSource(message.source_platform)} · ${formatMessageType(message.message_type)}: ${message.content}`,
    )
    .join("\n");

  return [profileContext, recentMessages].filter(Boolean).join("\n\n");
}

function getOriginalChatUrl(
  contact: ContactRow,
  messages: ConversationMessageRow[] = [],
  conversation?: ConversationRow | null,
): string | undefined {
  const latestMessageUrl = [...messages]
    .reverse()
    .map((message) => message.reply_target_url || message.source_url)
    .find((value) => value && /^https?:\/\//i.test(value));

  if (latestMessageUrl) return latestMessageUrl;
  const conversationUrl = conversation?.reply_target_url || conversation?.source_url;
  if (conversationUrl && /^https?:\/\//i.test(conversationUrl)) return conversationUrl;
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

function getOriginalActionLabel(platform: string): string {
  const normalized = platform.toLowerCase();

  if (normalized.includes("facebook")) return "Facebook öffnen";
  if (normalized.includes("messenger")) return "Messenger öffnen";
  if (normalized.includes("instagram")) return "Instagram öffnen";
  if (normalized.includes("whatsapp")) return "WhatsApp öffnen";
  if (normalized.includes("mail")) return "E-Mail öffnen";

  return "Original-Chat öffnen";
}

function formatConversationStatus(value: string): string {
  return { open: "Offen", waiting: "Wartet", done: "Erledigt", archived: "Archiviert" }[value] ?? value;
}

function formatConversationPriority(value: string): string {
  return { low: "Niedrig", normal: "Normal", medium: "Mittel", high: "Hoch" }[value] ?? value;
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
  return labels[value ?? ""] ?? "DM";
}

function inferMessageType(sourcePlatform: string | null): string {
  const normalized = sourcePlatform?.toLowerCase() ?? "";

  if (normalized.includes("mail")) return "E-Mail";
  if (normalized.includes("form") || normalized.includes("web"))
    return "Formular";
  if (normalized.includes("comment") || normalized.includes("kommentar"))
    return "Kommentar";
  if (normalized.includes("post")) return "Post";

  return "DM";
}

function formatMemoryType(value: string | null): string {
  if (value === "note") {
    return "Notiz";
  }

  return value ?? "Notiz";
}

function formatFollowupDueDate(value: string | null): string {
  if (!value) {
    return "Kein Fälligkeitsdatum";
  }

  return `Fällig am ${new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00Z`))}`;
}

function formatSource(value: string | null): string {
  return formatPlatformLabel(value);
}

function formatStatus(value: string | null): string {
  return statusLabels[value ?? ""] ?? value ?? "Nicht hinterlegt";
}

function formatLanguage(value: string | null): string {
  if (value === "de") {
    return "Deutsch";
  }

  if (value === "en") {
    return "Englisch";
  }

  if (value === "fr") {
    return "Französisch";
  }

  return value ?? "Nicht hinterlegt";
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
  if (value === "draft_saved") return "Entwurf gespeichert – noch nicht gesendet.";
  if (value === "done") return "Konversation als erledigt markiert. Es wurde nichts extern gesendet.";
  if (value === "waiting") return "Konversation wartet auf Antwort im Originalkanal.";
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
  const { data, error: userError } = await getSupabaseServerUser();

  if (!data.user) {
    redirect("/login");
  }

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  const workspace = workspaceResult.workspace;
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
  const conversationSummaryResult = workspace && conversation
    ? await getConversationSummary({ workspaceId: workspace.id, conversationId: conversation.id })
    : null;
  const contactAiProfileResult = workspace && contactResult?.contact
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
          followupsError={followupsResult?.error?.message}
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
