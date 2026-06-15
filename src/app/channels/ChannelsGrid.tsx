"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./channels.module.css";
import { FACEBOOK_COMMENT_FEED_SCOPES, FACEBOOK_MESSAGES_OAUTH_SCOPES } from "@/lib/facebookScopes";
import {
  activateFacebookPageWebhooks,
  checkFacebookPageWebhooks,
  fetchFacebookCommentsNow,
  type FacebookCommentFetchResult,
  type FacebookPageWebhookActionResult,
} from "./facebookWebhookActions";

type ChannelStatus =
  | "Verbunden"
  | "Verfügbar"
  | "In Arbeit"
  | "Vorschau"
  | "Coming Soon";

type FacebookConnection = {
  page_name: string | null;
  page_id: string | null;
  webhook_subscribed: boolean;
  last_event_at: string | null;
  has_page_access_token: boolean;
  scopes: string[] | null;
  last_comment_fetch_at: string | null;
  last_comment_fetch_count: number | null;
  last_comment_fetch_error: string | null;
};

type MetaWebhookStorageHealth = {
  serviceRoleConfigured: boolean;
  tableReadable: boolean;
  error: string | null;
};

type MetaWebhookSelfTestResult = {
  ok: boolean;
  workspace_id: string;
  page_id: string;
  event_type: string;
  status: string;
  error: string | null;
  saved: boolean;
  skipped: boolean;
};

type MetaWebhookEvent = {
  id: string;
  event_type: string;
  page_id: string | null;
  sender_id: string | null;
  text: string | null;
  message_text: string | null;
  status: string;
  error_reason: string | null;
  received_at: string;
};

type Channel = {
  key: string;
  name: string;
  description: string;
  status: ChannelStatus;
  technology: string;
  intakeTypes: string;
  logo: string;
  signal?: boolean;
};

const logoPath = (name: string) => `/channel-logos/${name}.svg`;

const channels: Channel[] = [
  {
    key: "instagram",
    name: "Instagram",
    description: "Direktnachrichten und Anfragen importieren",
    status: "In Arbeit",
    technology: "OAuth · Webhook",
    intakeTypes: "DMs · Anfragen",
    logo: logoPath("instagram"),
    signal: true,
  },
  {
    key: "tiktok",
    name: "TikTok",
    description: "Direktnachrichten und Kommentare abrufen",
    status: "In Arbeit",
    technology: "OAuth · Webhook",
    intakeTypes: "DMs · Kommentare",
    logo: logoPath("tiktok"),
    signal: true,
  },
  {
    key: "facebook_messages",
    name: "Facebook Nachrichten",
    description: "Messenger-DMs empfangen und in den FanMind-Arbeits-Eingang übernehmen.",
    status: "Verfügbar",
    technology: "facebook_messages · Graph API · OAuth",
    intakeTypes: "DM",
    logo: logoPath("facebook"),
    signal: true,
  },
  {
    key: "facebook_comments",
    name: "Facebook Kommentare",
    description: "Kommentare unter Facebook-Page-Posts importieren.",
    status: "Verfügbar",
    technology: "facebook_comments · Graph API · OAuth",
    intakeTypes: "Kommentar · Post-Kommentar",
    logo: logoPath("facebook"),
    signal: true,
  },
  {
    key: "twitter",
    name: "X / Twitter",
    description: "Mentions und Direktnachrichten empfangen",
    status: "Coming Soon",
    technology: "API v2",
    intakeTypes: "Mentions · DMs",
    logo: logoPath("twitter"),
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    description: "Nachrichten empfangen und importieren",
    status: "In Arbeit",
    technology: "Cloud API · Webhook",
    intakeTypes: "Nachrichten",
    logo: logoPath("whatsapp"),
    signal: true,
  },
  {
    key: "discord",
    name: "Discord",
    description: "DMs und Server-Nachrichten importieren",
    status: "Coming Soon",
    technology: "Bot API · Webhook",
    intakeTypes: "DMs · Server",
    logo: logoPath("discord"),
  },
  {
    key: "telegram",
    name: "Telegram",
    description: "Nachrichten und Gruppen-Eingänge abrufen",
    status: "Coming Soon",
    technology: "Bot API · Webhook",
    intakeTypes: "Nachrichten · Gruppen",
    logo: logoPath("telegram"),
  },
  {
    key: "youtube",
    name: "YouTube",
    description: "Kommentare und Live-Chat-Nachrichten importieren",
    status: "Coming Soon",
    technology: "YouTube API",
    intakeTypes: "Kommentare · Live-Chat",
    logo: logoPath("youtube"),
  },
  {
    key: "twitch",
    name: "Twitch",
    description: "Chat-Nachrichten und Whispers importieren",
    status: "Coming Soon",
    technology: "EventSub · API",
    intakeTypes: "Chat · Whispers",
    logo: logoPath("twitch"),
  },
  {
    key: "onlyfans",
    name: "OnlyFans",
    description: "Nachrichten und Sub-Anfragen importieren",
    status: "Vorschau",
    technology: "API (Beta)",
    intakeTypes: "Nachrichten · Sub-Anfragen",
    logo: logoPath("onlyfans"),
  },
  {
    key: "patreon",
    name: "Patreon",
    description: "Nachrichten und Support-Anfragen abrufen",
    status: "Vorschau",
    technology: "API (Beta)",
    intakeTypes: "Nachrichten · Support",
    logo: logoPath("patreon"),
  },
  {
    key: "email",
    name: "E-Mail / Postfach",
    description: "E-Mails automatisch inboxen",
    status: "Verfügbar",
    technology: "IMAP · OAuth",
    intakeTypes: "E-Mails",
    logo: logoPath("email"),
    signal: true,
  },
  {
    key: "webform",
    name: "Webformular / Website-Lead",
    description: "Leads und Anfragen aus Formularen empfangen",
    status: "Verfügbar",
    technology: "Webhook · Form-API",
    intakeTypes: "Leads · Anfragen",
    logo: logoPath("webform"),
    signal: true,
  },
  {
    key: "shopify",
    name: "Shopify / Shop-Bestellungen",
    description: "Bestellungen und Kunden-Anfragen importieren",
    status: "Verfügbar",
    technology: "API · Webhook",
    intakeTypes: "Bestellungen · Kundenfragen",
    logo: logoPath("shopify"),
    signal: true,
  },
  {
    key: "eventbrite",
    name: "Eventbrite / Event-Anfragen",
    description: "Event-Anmeldungen und Anfragen importieren",
    status: "Verfügbar",
    technology: "API · Webhook",
    intakeTypes: "Anmeldungen · Anfragen",
    logo: logoPath("eventbrite"),
    signal: true,
  },
  {
    key: "csv",
    name: "CSV-Import",
    description: "Kontakte & Nachrichten per CSV hochladen",
    status: "Verbunden",
    technology: "CSV · Datei-Upload",
    intakeTypes: "Kontakte · Nachrichten",
    logo: logoPath("csv"),
    signal: true,
  },
  {
    key: "manual",
    name: "Manueller Eingang",
    description: "Manuelle Kontakte & Nachrichten erfassen",
    status: "Verfügbar",
    technology: "Manuell",
    intakeTypes: "Kontakte · Notizen",
    logo: logoPath("manual"),
    signal: true,
  },
  {
    key: "api",
    name: "API / Custom Connector",
    description: "Eigene Systeme und Plattformen anbinden",
    status: "Verfügbar",
    technology: "API · Webhook",
    intakeTypes: "Eigene Events",
    logo: logoPath("api"),
    signal: true,
  },
  {
    key: "linkedin",
    name: "LinkedIn",
    description: "Nachrichten und Lead-Kommentare vormerken",
    status: "Coming Soon",
    technology: "API · Webhook",
    intakeTypes: "Nachrichten · Leads",
    logo: logoPath("linkedin"),
  },
  {
    key: "threads",
    name: "Threads",
    description: "Mentions und Antworten als Eingang planen",
    status: "Vorschau",
    technology: "API (Beta)",
    intakeTypes: "Mentions · Antworten",
    logo: logoPath("threads"),
  },
  {
    key: "snapchat",
    name: "Snapchat",
    description: "Creator-Nachrichten und Story-Antworten prüfen",
    status: "Coming Soon",
    technology: "API",
    intakeTypes: "Nachrichten · Story-Antworten",
    logo: logoPath("snapchat"),
  },
  {
    key: "reddit",
    name: "Reddit",
    description: "Kommentare, Modmail und Erwähnungen sammeln",
    status: "Coming Soon",
    technology: "API · Webhook",
    intakeTypes: "Kommentare · Modmail",
    logo: logoPath("reddit"),
  },
  {
    key: "pinterest",
    name: "Pinterest",
    description: "Kommentare und Produkt-Anfragen aufnehmen",
    status: "Coming Soon",
    technology: "API",
    intakeTypes: "Kommentare · Anfragen",
    logo: logoPath("pinterest"),
  },
  {
    key: "fediverse",
    name: "Bluesky / Mastodon",
    description: "Mentions und Community-Antworten importieren",
    status: "Vorschau",
    technology: "ATProto · ActivityPub",
    intakeTypes: "Mentions · Antworten",
    logo: logoPath("fediverse"),
  },
  {
    key: "woocommerce",
    name: "WooCommerce",
    description: "Shop-Anfragen und Bestellungen übernehmen",
    status: "Verfügbar",
    technology: "REST API · Webhook",
    intakeTypes: "Bestellungen · Support",
    logo: logoPath("woocommerce"),
    signal: true,
  },
  {
    key: "ticketing",
    name: "Ticketing / Events",
    description: "Event-Tickets und Supportfälle zentral sammeln",
    status: "Coming Soon",
    technology: "API · Webhook",
    intakeTypes: "Tickets · Events",
    logo: logoPath("ticketing"),
  },
];

const statusClassName: Record<ChannelStatus, string> = {
  Verbunden: styles.statusConnected,
  Verfügbar: styles.statusAvailable,
  "In Arbeit": styles.statusProgress,
  Vorschau: styles.statusPreview,
  "Coming Soon": styles.statusPreview,
};

function isBookable(status: ChannelStatus) {
  return (
    status === "Coming Soon" || status === "In Arbeit" || status === "Vorschau"
  );
}

export function ChannelsGrid({
  facebookConnection,
  facebookError,
  metaWebhookEvents,
  metaWebhookError,
  metaWebhookStorageHealth,
}: {
  facebookConnection: FacebookConnection | null;
  facebookError?: boolean;
  metaWebhookEvents: MetaWebhookEvent[];
  metaWebhookError?: string | null;
  metaWebhookStorageHealth: MetaWebhookStorageHealth;
}) {
  const router = useRouter();
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [notice, setNotice] = useState("");
  const [selfTestPending, setSelfTestPending] = useState(false);
  const [selfTestResult, setSelfTestResult] = useState<MetaWebhookSelfTestResult | null>(null);
  const [selfTestError, setSelfTestError] = useState<string | null>(null);
  const [pageWebhookPending, setPageWebhookPending] = useState<"check" | "activate" | null>(null);
  const [pageWebhookResult, setPageWebhookResult] = useState<FacebookPageWebhookActionResult | null>(null);
  const [commentFetchPending, setCommentFetchPending] = useState(false);
  const [commentFetchResult, setCommentFetchResult] = useState<FacebookCommentFetchResult | null>(null);
  const [facebookErrorCode] = useState<string | null>(() => {
    if (!facebookError || typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("facebook_error");
  });

  useEffect(() => {
    if (!activeChannel) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveChannel(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeChannel]);

  const openModal = (channel: Channel) => {
    setNotice("");
    setSelfTestError(null);
    setSelfTestResult(null);
    setPageWebhookResult(null);
    setCommentFetchResult(null);
    setActiveChannel(channel);
  };

  async function runMetaWebhookSelfTest() {
    setSelfTestPending(true);
    setSelfTestError(null);
    setSelfTestResult(null);

    try {
      const response = await fetch("/api/webhooks/meta/self-test", {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      const payload = (await response.json()) as MetaWebhookSelfTestResult | { error?: string };

      if (!response.ok) {
        if ("workspace_id" in payload) setSelfTestResult(payload as MetaWebhookSelfTestResult);
        setSelfTestError(payload.error ?? "Webhook-Selbsttest fehlgeschlagen.");
      } else {
        setSelfTestResult(payload as MetaWebhookSelfTestResult);
        router.refresh();
      }
    } catch (error) {
      setSelfTestError(error instanceof Error ? error.message : "Webhook-Selbsttest fehlgeschlagen.");
    } finally {
      setSelfTestPending(false);
    }
  }

  async function runPageWebhookAction(action: "check" | "activate") {
    setPageWebhookPending(action);
    setPageWebhookResult(null);

    try {
      const result = action === "check"
        ? await checkFacebookPageWebhooks()
        : await activateFacebookPageWebhooks();
      setPageWebhookResult(result);
      router.refresh();
    } catch (error) {
      setPageWebhookResult({
        ok: false,
        pageId: facebookConnection?.page_id ?? null,
        hasPageAccessToken: Boolean(facebookConnection?.has_page_access_token),
        subscribedAppsStatus: "error",
        fields: { feed: "unknown", messages: "unknown" },
        error: error instanceof Error ? error.message : "Page-Webhooks konnten nicht verarbeitet werden.",
        updatedConnection: false,
      });
    } finally {
      setPageWebhookPending(null);
    }
  }

  async function runCommentFetch() {
    setCommentFetchPending(true);
    setCommentFetchResult(null);

    try {
      const result = await fetchFacebookCommentsNow();
      setCommentFetchResult(result);
      router.refresh();
    } catch (error) {
      setCommentFetchResult({
        ok: false,
        fetchedAt: new Date().toISOString(),
        postsChecked: 0,
        commentsChecked: 0,
        importedCount: 0,
        error: error instanceof Error ? error.message : "Facebook-Kommentare konnten nicht abgerufen werden.",
      });
    } finally {
      setCommentFetchPending(false);
    }
  }

  const lastWebhookEvent = metaWebhookEvents[0] ?? null;
  const selfTestDisabledReason = !metaWebhookStorageHealth.serviceRoleConfigured
    ? "Service-Role-Key fehlt"
    : !metaWebhookStorageHealth.tableReadable
      ? "Meta-Webhook-Tabelle fehlt oder ist nicht lesbar"
      : null;
  const lastMessageEvent = metaWebhookEvents.find((event) => event.event_type === "messages" && (event.text ?? event.message_text));
  const lastFeedCommentEvent = metaWebhookEvents.find((event) => (event.event_type === "feed" || event.event_type === "feed_comment") && (event.text ?? event.message_text));
  const detectedFacebookScopes = pageWebhookResult?.tokenScopes ?? facebookConnection?.scopes ?? [];
  const pagesMessagingGranted = pageWebhookResult?.pagesMessagingGranted ?? detectedFacebookScopes.includes("pages_messaging");
  const requestedMessagesOauthScopes = [...FACEBOOK_MESSAGES_OAUTH_SCOPES];
  const requestedCommentOauthScopes = [...FACEBOOK_COMMENT_FEED_SCOPES];
  const commentFeedScopesRequested = FACEBOOK_COMMENT_FEED_SCOPES.every((scope) => requestedCommentOauthScopes.includes(scope));
  const pagesReadUserContentGranted = pageWebhookResult?.pagesReadUserContentGranted ?? detectedFacebookScopes.includes("pages_read_user_content");
  const pagesManageEngagementGranted = pageWebhookResult?.pagesManageEngagementGranted ?? detectedFacebookScopes.includes("pages_manage_engagement");
  const commentFeedScopesGranted = pageWebhookResult?.commentFeedScopesGranted ?? FACEBOOK_COMMENT_FEED_SCOPES.every((scope) => detectedFacebookScopes.includes(scope));
  const displayedWebhookStatus = pageWebhookResult ?? (facebookConnection ? {
    ok: facebookConnection.webhook_subscribed,
    pageId: facebookConnection.page_id,
    hasPageAccessToken: facebookConnection.has_page_access_token,
    subscribedAppsStatus: facebookConnection.webhook_subscribed ? "active" : "unknown",
    fields: {
      feed: facebookConnection.webhook_subscribed ? "active" : "unknown",
      messages: facebookConnection.webhook_subscribed ? "active" : "unknown",
    },
    error: null,
    updatedConnection: false,
  } satisfies FacebookPageWebhookActionResult : null);

  const facebookCommentsReady = Boolean(facebookConnection && commentFeedScopesGranted && !facebookConnection.last_comment_fetch_error);
  const activeDisplayStatus =
    activeChannel?.key === "facebook_messages" && facebookConnection
      ? "Verbunden"
      : activeChannel?.key === "facebook_comments" && facebookCommentsReady
        ? "Verbunden"
        : activeChannel?.key === "facebook_comments" && facebookConnection?.last_comment_fetch_error
          ? "In Arbeit"
          : activeChannel?.status;

  return (
    <section className={styles.gridSection} aria-label="Kanalkarten">
      <div className={styles.channelGrid}>
        {channels.map((channel) => {
          const isFacebookMessages = channel.key === "facebook_messages";
          const isFacebookComments = channel.key === "facebook_comments";
          const isFacebook = isFacebookMessages || isFacebookComments;
          const commentsReady = facebookCommentsReady;
          const displayStatus = isFacebookMessages && facebookConnection
            ? "Verbunden"
            : isFacebookComments && commentsReady
              ? "Verbunden"
              : isFacebookComments && facebookConnection?.last_comment_fetch_error
                ? "In Arbeit"
                : channel.status;
          const pageName = isFacebook ? facebookConnection?.page_name : null;
          const showComingSoonBadge = isBookable(displayStatus) && !isFacebookMessages && !(isFacebookComments && commentsReady);

          return (
            <article className={styles.channelCard} key={channel.key}>
              <button
                type="button"
                className={styles.cardButton}
                onClick={() => openModal(channel)}
              >
                <div className={styles.cardTopline}>
                  <div className={styles.identityGroup}>
                    <img
                      className={styles.logoTile}
                      src={channel.logo}
                      alt=""
                      aria-hidden="true"
                    />
                    <div>
                      <h3>{channel.name}</h3>
                      <p>{channel.description}</p>
                    </div>
                  </div>
                  <span
                    className={styles.infoIcon}
                    title="Keine automatische Sendefunktion"
                    aria-label="Info"
                  >
                    i
                  </span>
                </div>

                <span className={styles.metaRow}>
                  <span
                    className={`${styles.statusBadge} ${statusClassName[displayStatus]}`}
                  >
                    {channel.signal ? (
                      <span className={styles.signalDot} aria-hidden="true" />
                    ) : null}
                    {displayStatus}
                  </span>
                  <span className={styles.techBadge}>{channel.technology}</span>
                </span>

                <span className={styles.cardSpacer} />
                <span className={styles.cardActions}>
                  <span className={styles.primaryCardAction}>
                    {isFacebookMessages
                      ? facebookConnection
                        ? "Nachrichten verwalten"
                        : "Nachrichten verbinden"
                      : isFacebookComments
                        ? facebookConnection
                          ? "Kommentare importieren"
                          : "Kommentare verbinden"
                      : isBookable(displayStatus)
                        ? "Verbindung vormerken"
                        : `Mit ${channel.name} verbinden`}
                  </span>
                </span>
                {pageName ? (
                  <span className={styles.connectionHint}>
                    Page: {pageName}
                  </span>
                ) : null}
                {isFacebookMessages && facebookConnection ? (
                  <span className={styles.connectionHint}>
                    Letzter Messenger-Webhook: {lastWebhookEvent ? formatDateTime(lastWebhookEvent.received_at) : "noch keines empfangen"}
                  </span>
                ) : null}
                {isFacebookComments && facebookConnection && !commentsReady ? (
                  <span className={styles.connectionHint}>Kommentarimport benötigt zusätzliche Meta-Freigaben/App-Review. Nachrichten können trotzdem separat verbunden werden.</span>
                ) : null}
                {showComingSoonBadge ? (
                  <img className={styles.soonCornerBadge} src="/assets/coming-soon-badge.png" alt="Coming Soon" />
                ) : null}
              </button>
            </article>
          );
        })}
      </div>

      {activeChannel ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={() => setActiveChannel(null)}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="channel-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <img
                className={styles.modalLogo}
                src={activeChannel.logo}
                alt=""
                aria-hidden="true"
              />
              <div>
                <p className={styles.modalEyebrow}>Kanal verbinden</p>
                <h2 id="channel-modal-title">{activeChannel.name}</h2>
                <div className={styles.metaRow}>
                  {activeDisplayStatus === "Coming Soon" ? (
                    <img
                      className={styles.soonBadgeImage}
                      src="/assets/coming-soon-badge.png"
                      alt="Verbindung in Vorbereitung"
                    />
                  ) : (
                    <span
                      className={`${styles.statusBadge} ${statusClassName[activeDisplayStatus ?? "Verfügbar"]}`}
                    >
                      {activeDisplayStatus}
                    </span>
                  )}
                  <span className={styles.techBadge}>
                    {activeChannel.technology}
                  </span>
                </div>
              </div>
            </div>
            <p className={styles.modalText}>
              {activeChannel.key === "facebook_messages" && facebookConnection
                ? "Facebook ist verbunden. Eingänge werden in FanMind übernommen. Antworten werden manuell im Originalkanal gesendet."
                : "Melde dich an, um diesen Kanal zu verbinden und eingehende Nachrichten für FanMind freizugeben."}
            </p>
            {activeChannel.key === "facebook_messages" && facebookConnection ? (
              <>
              <p className={styles.modalNotice}>
                OAuth verbunden · Page: <strong>{facebookConnection.page_name ?? facebookConnection.page_id}</strong>
                <br />
                Webhook feed/messages: <strong>{displayedWebhookStatus?.ok ? "aktiv" : "unbekannt"}</strong>
                <br />
                Letztes Webhook-Event: <strong>{lastWebhookEvent ? formatDateTime(lastWebhookEvent.received_at) : "noch keines empfangen"}</strong>
                <br />
                Letzte Nachricht: <strong>{lastMessageEvent ? formatDateTime(lastMessageEvent.received_at) : "noch keine Nachricht empfangen"}</strong>
                <br />
                Letztes echtes feed/comment Event: <strong>{lastFeedCommentEvent ? `${formatDateTime(lastFeedCommentEvent.received_at)} · ${lastFeedCommentEvent.text ?? lastFeedCommentEvent.message_text ?? "ohne Text"}` : "noch kein echter Kommentar empfangen"}</strong>
                <br />
                Letzter Kommentar-Abruf: <strong>{commentFetchResult ? `${formatDateTime(commentFetchResult.fetchedAt)} · ${commentFetchResult.importedCount} neu importiert` : facebookConnection.last_comment_fetch_at ? `${formatDateTime(facebookConnection.last_comment_fetch_at)} · ${facebookConnection.last_comment_fetch_count ?? 0} neu importiert` : "noch nicht ausgeführt"}</strong>
                {(commentFetchResult?.error ?? facebookConnection.last_comment_fetch_error) ? (
                  <>
                    <br />
                    Kommentar-Abruf Fehler: <strong>{commentFetchResult?.error ?? facebookConnection.last_comment_fetch_error}</strong>
                  </>
                ) : null}
                <br />
                Page-ID: <strong>{displayedWebhookStatus?.pageId ?? facebookConnection.page_id ?? "unbekannt"}</strong>
                <br />
                Page Access Token vorhanden: <strong>{displayedWebhookStatus?.hasPageAccessToken ? "ja" : "nein"}</strong>
                <br />
                Angeforderte Messenger-OAuth-Scopes: <strong>{formatScopeList(requestedMessagesOauthScopes)}</strong>
                <br />
                comment/feed-relevante Scopes angefordert: <strong>{commentFeedScopesRequested ? "ja" : "nein"}</strong>
                <br />
                Vom Token erkannte Scopes: <strong>{formatScopeList(detectedFacebookScopes)}</strong>
                <br />
                pages_messaging vorhanden: <strong>{pagesMessagingGranted ? "ja" : "nein"}</strong>
                <br />
                pages_read_user_content vorhanden: <strong>{pagesReadUserContentGranted ? "ja" : "nein"}</strong>
                <br />
                pages_manage_engagement vorhanden: <strong>{pagesManageEngagementGranted ? "ja" : "nein"}</strong>
                <br />
                comment/feed-relevante Token-Scopes vollständig: <strong>{commentFeedScopesGranted ? "ja" : "nein"}</strong>
                <br />
                Page subscribed_apps: <strong>{formatWebhookStatus(displayedWebhookStatus?.subscribedAppsStatus)}</strong>
                <br />
                feed subscribed: <strong>{formatWebhookStatus(displayedWebhookStatus?.fields.feed)}</strong> · messages: <strong>{formatWebhookStatus(displayedWebhookStatus?.fields.messages)}</strong>
                {displayedWebhookStatus?.error ? (
                  <>
                    <br />
                    Meta-Fehler: <strong>{displayedWebhookStatus.error}</strong>
                  </>
                ) : null}
                {!lastFeedCommentEvent && (!commentFeedScopesGranted || displayedWebhookStatus?.fields.feed !== "active") ? (
                  <>
                    <br />
                    Kommentar-Empfang blockiert: <strong>{getFacebookCommentBlockingReason(commentFeedScopesGranted, displayedWebhookStatus?.fields.feed)}</strong>
                  </>
                ) : null}
              </p>
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.secondaryModalButton}
                    onClick={() => runPageWebhookAction("check")}
                    disabled={Boolean(pageWebhookPending)}
                  >
                    {pageWebhookPending === "check" ? "Page-Webhooks prüfen ..." : "Page-Webhooks prüfen"}
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryModalButton}
                    onClick={() => runPageWebhookAction("activate")}
                    disabled={Boolean(pageWebhookPending)}
                  >
                    {pageWebhookPending === "activate" ? "Page-Webhooks aktivieren ..." : "Page-Webhooks aktivieren"}
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryModalButton}
                    onClick={runCommentFetch}
                    disabled={commentFetchPending}
                  >
                    {commentFetchPending ? "Kommentare werden abgerufen ..." : "Kommentare jetzt abrufen"}
                  </button>
                </div>
                {commentFetchResult ? (
                  <p className={styles.modalNotice} role={commentFetchResult.ok ? "status" : "alert"}>
                    Kommentar-Abruf: {commentFetchResult.ok ? "erfolgreich" : "fehlgeschlagen"} · Posts geprüft: {commentFetchResult.postsChecked} · Kommentare geprüft: {commentFetchResult.commentsChecked} · Neu importiert: {commentFetchResult.importedCount}
                    {commentFetchResult.error ? ` · Fehler: ${commentFetchResult.error}` : ""}
                    <br />
                    Endpoint-Typ: <strong>{commentFetchResult.endpointType ?? "nicht ermittelt"}</strong> · Page Token genutzt: <strong>{commentFetchResult.usedPageAccessToken ? "ja" : "nein"}</strong> · Erkannte Scopes: <strong>{formatScopeList(commentFetchResult.tokenScopes)}</strong>
                  </p>
                ) : null}
              </>
            ) : null}
            {activeChannel.key === "facebook_messages" && facebookConnection && metaWebhookError ? (
              <p className={styles.modalNotice} role="alert">
                Meta-Webhook-Events konnten nicht gelesen werden: {metaWebhookError}
              </p>
            ) : null}
            {activeChannel.key === "facebook_messages" && facebookConnection ? (
              <div className={styles.releaseBox} aria-label="Meta Webhook Diagnose">
                <strong>Meta Webhook Diagnose (letzte 20 Events)</strong>
                <p>
                  Service-Role-Key: <strong>{metaWebhookStorageHealth.serviceRoleConfigured ? "verfügbar" : "fehlt"}</strong> · Tabelle public.meta_webhook_events: <strong>{metaWebhookStorageHealth.tableReadable ? "lesbar" : "fehlt/nicht lesbar"}</strong>
                  {metaWebhookStorageHealth.error ? ` · Fehler: ${metaWebhookStorageHealth.error}` : ""}
                </p>
                {selfTestDisabledReason ? (
                  <p role="alert">Selbsttest blockiert: {selfTestDisabledReason}.</p>
                ) : null}
                <button
                  type="button"
                  className={styles.secondaryModalButton}
                  onClick={runMetaWebhookSelfTest}
                  disabled={selfTestPending || Boolean(selfTestDisabledReason)}
                  title={selfTestDisabledReason ?? "Speichert ein Testevent in public.meta_webhook_events"}
                >
                  {selfTestPending ? "Webhook-Selbsttest läuft ..." : "Webhook-Selbsttest starten"}
                </button>
                {selfTestResult ? (
                  <p role="status">
                    Selbsttest: {selfTestResult.ok ? "Insert erfolgreich" : "Insert fehlgeschlagen"} · workspace_id {selfTestResult.workspace_id} · event_type {selfTestResult.event_type} · status {selfTestResult.status}
                    {selfTestResult.error ? ` · Fehler: ${selfTestResult.error}` : ""}
                  </p>
                ) : null}
                {selfTestError ? <p role="alert">Selbsttest fehlgeschlagen: {selfTestError}</p> : null}
                {metaWebhookEvents.length ? (
                  <ul>
                    {metaWebhookEvents.map((event) => (
                      <li key={event.id}>
                        {formatDateTime(event.received_at)} · {event.event_type} · Page {event.page_id ?? "unbekannt"} · Sender {event.sender_id ?? "unbekannt"} · Status {event.status}
                        {event.text ?? event.message_text ? ` · Text: ${event.text ?? event.message_text}` : ""}
                        {event.error_reason ? ` · Grund: ${event.error_reason}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Noch keine Meta-Webhook-Events empfangen.</p>
                )}
              </div>
            ) : null}

            {activeChannel.key === "facebook_comments" ? (
              <p className={styles.modalNotice} role={facebookConnection?.last_comment_fetch_error || facebookErrorCode === "comment_review" ? "alert" : "status"}>
                Kommentarimport benötigt zusätzliche Meta-Freigaben/App-Review. Nachrichten können trotzdem separat verbunden werden.
                <br />
                Technischer Typ: <strong>facebook_comments</strong>
                <br />
                Angeforderte Kommentar-OAuth-Scopes: <strong>{formatScopeList(requestedCommentOauthScopes)}</strong>
                <br />
                Optionale Scopes werden nur vorbereitet, wenn Meta/App-Review sie erlaubt: <strong>pages_read_user_content, pages_manage_engagement</strong>
                <br />
                Status: <strong>{facebookCommentsReady ? "verbunden" : facebookConnection?.last_comment_fetch_error ? "fehlerhaft" : "verfügbar"}</strong>
                {facebookConnection?.last_comment_fetch_error ? (
                  <>
                    <br />
                    Letzter Kommentarimport-Fehler: <strong>{facebookConnection.last_comment_fetch_error}</strong>
                  </>
                ) : null}
              </p>
            ) : null}
            {(activeChannel.key === "facebook_messages" || activeChannel.key === "facebook_comments") && facebookError ? (
              <p className={styles.modalNotice} role="alert">
                {getFacebookErrorMessage(facebookErrorCode)}
              </p>
            ) : null}
            <div
              className={styles.releaseBox}
              aria-label={`Nachrichtenfreigabe für ${activeChannel.name}`}
            >
              <strong>Nachrichtenfreigabe</strong>
              <ul>
                <li>Eingänge in Arbeits-Eingang übernehmen</li>
                <li>{activeChannel.intakeTypes} je nach Kanal</li>
                <li>Manuelle Prüfung vor Antwort</li>
                <li>Automatisches Senden deaktiviert</li>
              </ul>
            </div>
            {notice ? (
              <p className={styles.modalNotice} role="status">
                {notice}
              </p>
            ) : null}
            <div className={styles.modalActions}>
              {activeChannel.key === "facebook_messages" || activeChannel.key === "facebook_comments" ? (
                facebookConnection ? (
                  <>
                    {activeChannel.key === "facebook_comments" ? (
                      <button type="button" className={styles.secondaryModalButton} onClick={runCommentFetch} disabled={commentFetchPending}>
                        {commentFetchPending ? "Kommentare werden abgerufen ..." : "Kommentare importieren"}
                      </button>
                    ) : (
                      <a className={styles.modalLinkButton} href="/channels">Nachrichten verwalten</a>
                    )}
                    <form
                      method="post"
                      action="/api/integrations/facebook/disconnect"
                    >
                      <button
                        type="submit"
                        className={styles.dangerModalButton}
                      >
                        Trennen
                      </button>
                    </form>
                  </>
                ) : (
                  <a
                    className={styles.modalLinkButton}
                    href={activeChannel.key === "facebook_comments" ? "/api/integrations/facebook/start?type=facebook_comments" : "/api/integrations/facebook/start?type=facebook_messages"}
                  >
                    {activeChannel.key === "facebook_messages" ? "Nachrichten verbinden" : "Kommentare verbinden"}
                  </a>
                )
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setNotice(
                      "Verbindung wird vorbereitet. Externe Anmeldung/OAuth ist noch nicht aktiv.",
                    )
                  }
                >
                  {isBookable(activeChannel.status)
                    ? "Verbindung vormerken"
                    : `Mit ${activeChannel.name} verbinden`}
                </button>
              )}
              <button
                type="button"
                className={styles.secondaryModalButton}
                onClick={() => setActiveChannel(null)}
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function getFacebookErrorMessage(errorCode: string | null): string {
  if (errorCode === "no_page") {
    return "Facebook hat keine verwaltbare Seite an FanMind zurückgegeben. Bitte prüfe, ob du eine Seite ausgewählt hast, ob du vollständigen Seitenzugriff besitzt und ob die Page-Rechte im Meta-Testmodus aktiv sind.";
  }

  if (errorCode === "no_page_token") {
    return "Facebook hat die Seite erkannt, aber kein Page-Access-Token geliefert. Bitte prüfe, ob du vollständigen Seitenzugriff besitzt und die App im Testmodus Zugriff auf diese Seite hat.";
  }

  if (errorCode === "page_permissions") {
    return "Facebook hat nicht alle benötigten Seitenrechte freigegeben. pages_messaging fehlt im Token oder wurde von Meta nicht gewährt. Bitte erneut verbinden und alle angefragten Page-Berechtigungen bestätigen.";
  }

  if (errorCode === "callback") {
    return "Facebook-Verbindung konnte nicht abgeschlossen werden. Bitte erneut verbinden oder Serverlog prüfen.";
  }

  if (errorCode === "oauth") {
    return "Facebook-Verbindung konnte nicht abgeschlossen werden. Bitte starte die Verbindung erneut und prüfe, ob der Facebook-Dialog vollständig bestätigt wurde.";
  }

  if (errorCode === "encryption") {
    return "Facebook-Verbindung kann nicht gespeichert werden: Verschlüsselung nicht konfiguriert. Facebook-Verbindung ist serverseitig noch nicht vollständig konfiguriert.";
  }

  if (errorCode === "save") {
    return "Facebook-Seite wurde erkannt, aber die Verbindung konnte nicht gespeichert werden. Bitte erneut versuchen oder Serverlog prüfen.";
  }

  return "Facebook-Verbindung konnte nicht gespeichert werden. Bitte prüfe die Facebook-Konfiguration und starte die Verbindung erneut.";
}

function formatDateTime(value: string | null): string {
  if (!value) return "unbekannt";
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function formatWebhookStatus(status: "active" | "missing" | "error" | "unknown" | undefined): string {
  if (status === "active") return "aktiv";
  if (status === "missing") return "fehlt";
  if (status === "error") return "Fehler";
  return "unbekannt";
}

function formatScopeList(scopes: string[] | null | undefined): string {
  return scopes && scopes.length > 0 ? scopes.join(", ") : "keine erkannt";
}

function getFacebookCommentBlockingReason(
  scopesGranted: boolean,
  feedStatus: "active" | "missing" | "error" | "unknown" | undefined,
): string {
  if (!scopesGranted) {
    return "comment/feed-relevante Token-Scopes fehlen. Bitte Facebook neu verbinden und alle Page-Kommentar-Rechte bestätigen.";
  }
  if (feedStatus !== "active") {
    return "Page-Webhook-Feld feed ist nicht aktiv. Bitte Page-Webhooks prüfen oder aktivieren.";
  }
  return "noch kein echtes feed/comment Event von Meta empfangen.";
}
