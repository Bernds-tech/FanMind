"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./channels.module.css";
import {
  FACEBOOK_COMMENT_FEED_SCOPES,
  FACEBOOK_MESSAGES_OAUTH_SCOPES,
} from "@/lib/facebookScopes";
import {
  CHANNEL_SOURCE_CONFIGS,
  type PreparedSourceType,
} from "@/lib/channelSources";
import {
  TELEGRAM_BOT_USERNAME,
  TELEGRAM_EXPECTED_WEBHOOK_URL,
  type TelegramWebhookStatus,
} from "@/lib/telegramStatus";
import {
  activateFacebookPageWebhooks,
  checkFacebookPageWebhooks,
  syncFacebookMessengerHistory,
  diagnoseMetaPermissions,
  type MetaPermissionDiagnosis,
  type FacebookMessengerSyncResult,
  type FacebookPageWebhookActionResult,
} from "./facebookWebhookActions";

type ChannelStatus =
  | "Live"
  | "In Vorbereitung"
  | "Geplant"
  | "Coming Soon"
  | "Optional"
  | "Nicht verbunden"
  | "Verbunden";

type IntegrationType =
  | "account_inbox"
  | "page_inbox"
  | "comments"
  | "bot"
  | "form"
  | "email_inbox"
  | "business_inbox"
  | "community_inbox";

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
  last_messenger_sync_at: string | null;
  last_messenger_sync_checked_count: number | null;
  last_messenger_sync_imported_inbound_count: number | null;
  last_messenger_sync_imported_outbound_count: number | null;
  last_messenger_sync_imported_media_count: number | null;
  last_messenger_sync_skipped_count: number | null;
  last_messenger_sync_error: string | null;
  last_messenger_sync_outbound_at: string | null;
};

type MetaWebhookStorageHealth = {
  serviceRoleConfigured: boolean;
  tableReadable: boolean;
  error: string | null;
};

type FacebookLiveSetupStatus = {
  facebookAppIdConfigured: boolean;
  facebookAppSecretConfigured: boolean;
  webhookVerifyTokenConfigured: boolean;
  publicBaseUrlConfigured: boolean;
  metaBusinessIdConfigured: boolean;
  oauthCallbackUrl: string | null;
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

type TelegramMessage = {
  id: string;
  contact_id: string;
  author_label: string | null;
  content: string;
  source_type: string | null;
  created_at: string | null;
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
  logo?: string;
  logoInitials?: string;
  signal?: boolean;
  childSources?: PreparedSourceType[];
  connectionCardCount?: 1 | 2;
};

const logoPath = (name: string) => `/channel-logos/${name}.svg`;

const channels: Channel[] = [
  {
    key: "telegram",
    name: "Telegram",
    description: "Eigenes Telegram-Konto verbinden · Bot nur optional",
    status: "In Vorbereitung",
    technology: "Hauptweg: Account/Inbox · Zusatzweg: Bot",
    intakeTypes: "Telegram Account / Inbox",
    signal: true,
    logo: logoPath("telegram"),
    childSources: ["telegram_messages"],
  },
  {
    key: "facebook",
    name: "Facebook",
    description: "Eigene Facebook Page/Inbox verbinden",
    status: "Nicht verbunden",
    technology: "Page / Inbox als Hauptweg · Kommentare als Zusatzweg",
    intakeTypes: "Facebook Page / Inbox",
    logo: logoPath("facebook"),
    signal: true,
    childSources: ["facebook_messages", "facebook_comments"],
  },
  {
    key: "instagram",
    name: "Instagram",
    description: "Eigenes Instagram Account / Inbox verbinden",
    status: "Geplant",
    technology: "Account / Inbox als Hauptweg · Kommentare als Zusatzweg",
    intakeTypes: "Instagram Account / Inbox",
    logo: logoPath("instagram"),
    childSources: ["instagram_messages", "instagram_comments"],
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    description: "Eigene WhatsApp Business Inbox verbinden",
    status: "Geplant",
    technology: "Business Inbox als Hauptweg",
    intakeTypes: "WhatsApp Business Inbox",
    logo: logoPath("whatsapp"),
    childSources: ["whatsapp_messages"],
  },
  {
    key: "tiktok",
    name: "TikTok",
    description: "Eigenes TikTok Account / Inbox verbinden",
    status: "In Vorbereitung",
    technology: "Account / Inbox als Hauptweg · Kommentare als Zusatzweg",
    intakeTypes: "TikTok Account / Inbox",
    logo: logoPath("tiktok"),
    childSources: ["tiktok_comments", "tiktok_messages"],
  },
  {
    key: "linkedin",
    name: "LinkedIn",
    description: "Eigenes LinkedIn Account / Inbox verbinden",
    status: "Geplant",
    technology: "Account / Inbox als Hauptweg · Page/Kommentare als Zusatzweg",
    intakeTypes: "LinkedIn Account / Inbox",
    logo: logoPath("linkedin"),
  },
  {
    key: "youtube",
    name: "YouTube",
    description: "Eigenen YouTube Kanal / Kommentare verbinden",
    status: "Geplant",
    technology: "Kanal/Kommentare als Hauptweg · Live-Chat als Zusatzweg",
    intakeTypes: "YouTube Kanal / Kommentare",
    logo: logoPath("youtube"),
    connectionCardCount: 2,
  },
  {
    key: "discord",
    name: "Discord",
    description: "Eigenen Discord Server/Channel verbinden",
    status: "Geplant",
    technology: "Server / Channel Inbox als Hauptweg",
    intakeTypes: "Discord Server / Channel Inbox",
    logo: logoPath("discord"),
  },
  {
    key: "bluesky",
    name: "Bluesky",
    description: "Mentions geplant",
    status: "Geplant",
    technology: "API-Prüfung nötig",
    intakeTypes: "Mentions · Antworten",
    logoInitials: "BS",
  },
  {
    key: "twitter",
    name: "X / Twitter",
    description: "Eigenes X/Twitter Account / Inbox verbinden",
    status: "Geplant",
    technology: "Account / Inbox als Hauptweg · Mentions als Zusatzweg",
    intakeTypes: "X / Twitter Account / Inbox",
    logo: logoPath("twitter"),
  },
  {
    key: "email",
    name: "E-Mail",
    description: "Eigene E-Mail Inbox verbinden",
    status: "In Vorbereitung",
    technology: "Inbox als Hauptweg",
    intakeTypes: "E-Mail Inbox",
    logo: logoPath("email"),
    signal: true,
    childSources: ["email"],
  },
  {
    key: "webform",
    name: "Webformular",
    description: "Eigenen Formular-Eingang verbinden",
    status: "In Vorbereitung",
    technology: "Formular als Hauptweg",
    intakeTypes: "Formular-Eingang",
    logo: logoPath("webform"),
    signal: true,
    childSources: ["webform"],
  },
  {
    key: "manual",
    name: "Manuell / CSV",
    description: "Manuelle Erfassung und CSV-Import",
    status: "Live",
    technology: "Manuell nutzbar",
    intakeTypes: "Kontakte · Notizen · CSV",
    logo: logoPath("manual"),
    signal: true,
    childSources: ["manual"],
  },
];

const statusClassName: Record<ChannelStatus, string> = {
  Live: styles.statusConnected,
  "In Vorbereitung": styles.statusProgress,
  Geplant: styles.statusPreview,
  "Coming Soon": styles.statusPreview,
  Optional: styles.statusPreview,
  "Nicht verbunden": styles.statusAvailable,
  Verbunden: styles.statusConnected,
};

function isBookable(status: ChannelStatus) {
  return (
    status === "Coming Soon" ||
    status === "In Vorbereitung" ||
    status === "Geplant"
  );
}

export function ChannelsGrid({
  facebookConnection,
  facebookError,
  metaWebhookEvents,
  metaWebhookError,
  metaWebhookStorageHealth,
  facebookLiveSetupStatus,
  telegramMessages,
  telegramMessagesError,
  telegramSetupStatus,
  telegramCheckRequested,
}: {
  facebookConnection: FacebookConnection | null;
  facebookError?: boolean;
  metaWebhookEvents: MetaWebhookEvent[];
  metaWebhookError?: string | null;
  metaWebhookStorageHealth: MetaWebhookStorageHealth;
  facebookLiveSetupStatus: FacebookLiveSetupStatus;
  telegramMessages: TelegramMessage[];
  telegramMessagesError?: string | null;
  telegramSetupStatus: TelegramWebhookStatus;
  telegramCheckRequested: boolean;
}) {
  const router = useRouter();
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [notice, setNotice] = useState("");
  const [selfTestPending, setSelfTestPending] = useState(false);
  const [selfTestResult, setSelfTestResult] =
    useState<MetaWebhookSelfTestResult | null>(null);
  const [selfTestError, setSelfTestError] = useState<string | null>(null);
  const [pageWebhookPending, setPageWebhookPending] = useState<
    "check" | "activate" | null
  >(null);
  const [pageWebhookResult, setPageWebhookResult] =
    useState<FacebookPageWebhookActionResult | null>(null);
  const [messengerSyncPending, setMessengerSyncPending] = useState(false);
  const [metaPermissionPending, setMetaPermissionPending] = useState(false);
  const [metaPermissionDiagnosis, setMetaPermissionDiagnosis] =
    useState<MetaPermissionDiagnosis | null>(null);
  const [messengerSyncResult, setMessengerSyncResult] =
    useState<FacebookMessengerSyncResult | null>(null);
  const [facebookErrorCode] = useState<string | null>(() => {
    if (!facebookError || typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("facebook_error");
  });

  useEffect(() => {
    if (!activeChannel) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveChannel(null);
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
    };
  }, [activeChannel]);

  const openModal = (channel: Channel) => {
    setNotice("");
    setSelfTestError(null);
    setSelfTestResult(null);
    setPageWebhookResult(null);
    setMessengerSyncResult(null);
    setMetaPermissionDiagnosis(null);
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
      const payload = (await response.json()) as
        | MetaWebhookSelfTestResult
        | { error?: string };

      if (!response.ok) {
        if ("workspace_id" in payload)
          setSelfTestResult(payload as MetaWebhookSelfTestResult);
        setSelfTestError(payload.error ?? "Webhook-Selbsttest fehlgeschlagen.");
      } else {
        setSelfTestResult(payload as MetaWebhookSelfTestResult);
        router.refresh();
      }
    } catch (error) {
      setSelfTestError(
        error instanceof Error
          ? error.message
          : "Webhook-Selbsttest fehlgeschlagen.",
      );
    } finally {
      setSelfTestPending(false);
    }
  }

  async function runPageWebhookAction(action: "check" | "activate") {
    setPageWebhookPending(action);
    setPageWebhookResult(null);

    try {
      const result =
        action === "check"
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
        fields: {
          feed: "unknown",
          messages: "unknown",
          message_echoes: "unknown",
        },
        error:
          error instanceof Error
            ? error.message
            : "Page-Webhooks konnten nicht verarbeitet werden.",
        updatedConnection: false,
      });
    } finally {
      setPageWebhookPending(null);
    }
  }

  async function runMetaPermissionDiagnosis() {
    setMetaPermissionPending(true);
    setMetaPermissionDiagnosis(null);
    try {
      setMetaPermissionDiagnosis(await diagnoseMetaPermissions());
    } catch (error) {
      setMetaPermissionDiagnosis({
        ok: false,
        checkedAt: new Date().toISOString(),
        connectionActive: Boolean(facebookConnection),
        pageIdDetected: Boolean(facebookConnection?.page_id),
        tokenCheckSuccessful: false,
        pageAccessTokenPresent: Boolean(
          facebookConnection?.has_page_access_token,
        ),
        detectedPermissions: [],
        visiblePageRights: facebookConnection?.scopes ?? [],
        missingPermissions: [
          "pages_show_list",
          "pages_manage_metadata",
          "pages_messaging",
          "pages_read_engagement",
          "pages_read_user_content",
          "pages_manage_engagement",
        ],
        appReviewCheckRecommended: true,
        advancedAccessCheckRecommended: true,
        tokenAppearsRestricted: true,
        directChatIdStatus:
          "Mit aktuellem Zugriff liefert Meta keine Direktchat-ID.",
        note: "Meta-Berechtigungsdiagnose konnte nicht abgeschlossen werden.",
        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Diagnosefehler.",
      });
    } finally {
      setMetaPermissionPending(false);
    }
  }

  async function runMessengerSync() {
    setMessengerSyncPending(true);
    setMessengerSyncResult(null);
    try {
      const result = await syncFacebookMessengerHistory();
      setMessengerSyncResult(result);
      router.refresh();
    } catch (error) {
      const failedAt = new Date().toISOString();
      setMessengerSyncResult({
        ok: false,
        syncedAt: failedAt,
        conversationsChecked: 0,
        checkedConversations: 0,
        checkedMessages: 0,
        importedInbound: 0,
        importedOutbound: 0,
        importedMedia: 0,
        skippedDuplicates: 0,
        errors: [],
        syncLimit: 50,
        lastSyncAt: failedAt,
        error:
          error instanceof Error
            ? error.message
            : "Facebook-Verlauf konnte nicht abgerufen werden. Prüfe Page Access Token und Messenger-Berechtigungen.",
      });
    } finally {
      setMessengerSyncPending(false);
    }
  }

  const lastWebhookEvent = metaWebhookEvents[0] ?? null;
  const selfTestDisabledReason = !metaWebhookStorageHealth.serviceRoleConfigured
    ? "Service-Role-Key fehlt"
    : !metaWebhookStorageHealth.tableReadable
      ? "Meta-Webhook-Tabelle fehlt oder ist nicht lesbar"
      : null;
  const lastMessageEvent = metaWebhookEvents.find(
    (event) =>
      event.event_type === "messages" && (event.text ?? event.message_text),
  );
  const lastInboundMessageEvent = metaWebhookEvents.find(isInboundMessageEvent);
  const lastOutboundEchoEvent = metaWebhookEvents.find(isOutboundEchoEvent);
  const lastFeedCommentEvent = metaWebhookEvents.find(
    (event) =>
      (event.event_type === "feed" || event.event_type === "feed_comment") &&
      (event.text ?? event.message_text),
  );
  const detectedFacebookScopes =
    pageWebhookResult?.tokenScopes ?? facebookConnection?.scopes ?? [];
  const pagesMessagingGranted =
    pageWebhookResult?.pagesMessagingGranted ??
    detectedFacebookScopes.includes("pages_messaging");
  const requestedMessagesOauthScopes = [...FACEBOOK_MESSAGES_OAUTH_SCOPES];
  const requestedCommentOauthScopes = [...FACEBOOK_COMMENT_FEED_SCOPES];
  const commentFeedScopesRequested = FACEBOOK_COMMENT_FEED_SCOPES.every(
    (scope) => requestedCommentOauthScopes.includes(scope),
  );
  const pagesReadUserContentGranted =
    pageWebhookResult?.pagesReadUserContentGranted ??
    detectedFacebookScopes.includes("pages_read_user_content");
  const pagesManageEngagementGranted =
    pageWebhookResult?.pagesManageEngagementGranted ??
    detectedFacebookScopes.includes("pages_manage_engagement");
  const commentFeedScopesGranted =
    pageWebhookResult?.commentFeedScopesGranted ??
    FACEBOOK_COMMENT_FEED_SCOPES.every((scope) =>
      detectedFacebookScopes.includes(scope),
    );
  const displayedWebhookStatus =
    pageWebhookResult ??
    (facebookConnection
      ? ({
          ok: facebookConnection.webhook_subscribed,
          pageId: facebookConnection.page_id,
          hasPageAccessToken: facebookConnection.has_page_access_token,
          subscribedAppsStatus: facebookConnection.webhook_subscribed
            ? "active"
            : "unknown",
          fields: {
            feed: facebookConnection.webhook_subscribed ? "active" : "unknown",
            messages: facebookConnection.webhook_subscribed
              ? "active"
              : "unknown",
            message_echoes: facebookConnection.webhook_subscribed
              ? "unknown"
              : "unknown",
          },
          error: null,
          updatedConnection: false,
        } satisfies FacebookPageWebhookActionResult)
      : null);

  const missingFacebookSetupItems = [
    !facebookLiveSetupStatus.facebookAppIdConfigured
      ? "FACEBOOK_APP_ID fehlt"
      : null,
    !facebookLiveSetupStatus.facebookAppSecretConfigured
      ? "FACEBOOK_APP_SECRET fehlt"
      : null,
    !facebookLiveSetupStatus.webhookVerifyTokenConfigured
      ? "FACEBOOK_WEBHOOK_VERIFY_TOKEN fehlt"
      : null,
    !facebookLiveSetupStatus.publicBaseUrlConfigured
      ? "NEXT_PUBLIC_APP_URL fehlt"
      : null,
    !metaWebhookStorageHealth.serviceRoleConfigured
      ? "SUPABASE_SERVICE_ROLE_KEY fehlt"
      : null,
  ].filter(Boolean);
  const messengerWebhookReady =
    displayedWebhookStatus?.fields.messages === "active";
  const messageEchoesReady =
    displayedWebhookStatus?.fields.message_echoes === "active";
  const activeSourceConfig = activeChannel
    ? CHANNEL_SOURCE_CONFIGS[
        (activeChannel.key === "facebook"
          ? "facebook_messages"
          : activeChannel.key === "telegram"
            ? "telegram_messages"
            : (activeChannel.childSources?.[0] ??
              activeChannel.key)) as PreparedSourceType
      ]
    : undefined;
  const activeSyncStatus = activeSourceConfig
    ? buildChannelSyncStatus(activeSourceConfig, facebookConnection)
    : null;

  const telegramLive =
    telegramSetupStatus.configured &&
    telegramSetupStatus.webhookUrlMatches &&
    !telegramSetupStatus.lastErrorMessage;
  const telegramConfiguredNeedsCheck =
    telegramSetupStatus.configured && !telegramLive;
  const telegramStatusLabel = telegramLive
    ? "Live-Sync aktiv"
    : telegramConfiguredNeedsCheck
      ? "Konfiguriert · Prüfung nötig"
      : "Nicht vollständig konfiguriert";
  const telegramWebhookLabel = telegramLive
    ? "aktiv"
    : telegramSetupStatus.checked
      ? "nicht bestätigt"
      : "Prüfung nötig";
  const getTelegramSourceTypeLabel = (sourceType: string | null) =>
    sourceType === "dm"
      ? "Telegram DM"
      : sourceType === "telegram_messages"
        ? "Telegram Nachricht"
        : "Telegram";

  const activeDisplayStatus =
    activeChannel?.key === "telegram"
      ? telegramLive
        ? "Optional"
        : "In Vorbereitung"
      : activeChannel?.key === "facebook" && facebookConnection
        ? "Verbunden"
        : activeChannel?.status;
  const activeConnectionCards = activeChannel
    ? buildConnectionCards({
        channel: activeChannel,
        facebookConnection,
        telegramLive,
        telegramWebhookLabel,
      })
    : [];

  return (
    <section className={styles.gridSection} aria-label="Kanalkarten">
      <div className={styles.channelGrid}>
        {channels.map((channel) => {
          const isFacebook = channel.key === "facebook";
          const isFacebookMessages = isFacebook;
          const isTelegram = channel.key === "telegram";
          const displayStatus = isTelegram
            ? telegramLive
              ? "Optional"
              : "In Vorbereitung"
            : isFacebook && facebookConnection
              ? "Verbunden"
              : channel.status;
          const pageName = isFacebook ? facebookConnection?.page_name : null;
          const showComingSoonBadge =
            isBookable(displayStatus) &&
            !isTelegram &&
            !isFacebook;

          return (
            <article className={styles.channelCard} key={channel.key}>
              <button
                type="button"
                className={styles.cardButton}
                onClick={() => openModal(channel)}
              >
                <div className={styles.cardTopline}>
                  <div className={styles.identityGroup}>
                    {channel.logo ? (
                      <img
                        className={styles.logoTile}
                        src={channel.logo}
                        alt=""
                        aria-hidden="true"
                      />
                    ) : (
                      <span className={styles.logoTile} aria-hidden="true">
                        {channel.logoInitials ?? channel.name.slice(0, 2)}
                      </span>
                    )}
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

                {pageName ? (
                  <span className={styles.connectionHint}>
                    Page: {pageName}
                  </span>
                ) : null}
                {isFacebookMessages && facebookConnection ? (
                  <span className={styles.connectionHint}>
                    Letzter Messenger-Webhook:{" "}
                    {lastWebhookEvent
                      ? formatDateTime(lastWebhookEvent.received_at)
                      : "noch keines empfangen"}
                  </span>
                ) : null}
                <span className={styles.cardSpacer} />
                <span className={styles.cardActions}>
                  <span className={styles.primaryCardAction}>Details</span>
                </span>
                {showComingSoonBadge ? (
                  <img
                    className={styles.soonCornerBadge}
                    src="/assets/coming-soon-badge.png"
                    alt="Coming Soon"
                  />
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
              {activeChannel.logo ? (
                <img
                  className={styles.modalLogo}
                  src={activeChannel.logo}
                  alt=""
                  aria-hidden="true"
                />
              ) : (
                <span className={styles.modalLogo} aria-hidden="true">
                  {activeChannel.logoInitials ?? activeChannel.name.slice(0, 2)}
                </span>
              )}
              <div>
                <p className={styles.modalEyebrow}>Kanal verbinden</p>
                <h2 id="channel-modal-title">
                  {activeChannel.key === "telegram"
                    ? "Telegram verbinden"
                    : activeChannel.name}
                </h2>
                <div className={styles.metaRow}>
                  {activeDisplayStatus && isBookable(activeDisplayStatus) ? (
                    <img
                      className={styles.soonBadgeImage}
                      src="/assets/coming-soon-badge.png"
                      alt="Verbindung in Vorbereitung"
                    />
                  ) : (
                    <span
                      className={`${styles.statusBadge} ${statusClassName[activeDisplayStatus ?? "Live"]}`}
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
            <div className={styles.modalBody}>
              <p className={styles.modalText}>
                {activeChannel.key === "telegram"
                  ? "Telegram hat zwei getrennte Wege: Telegram Account / Inbox als Hauptintegration in Vorbereitung und FanMind Bot als optionaler Live-Eingang. Der Bot ist nicht deine persönliche Telegram-Inbox."
                  : activeChannel.key === "facebook" && facebookConnection
                    ? "Du verbindest deinen eigenen Kanal. FanMind synchronisiert deine eigenen Kontakte, Fans und Nachrichten in deinen Workspace. Antworten werden vorbereitet; gesendet wird manuell im Originalkanal oder über einen sicheren Reply-Link/API-Flow."
                    : isBookable(activeChannel.status)
                      ? "Dieser Kanal ist als Account-/Inbox-Integration vorbereitet oder geplant. Es wird keine echte Anmeldung vorgetäuscht und keine automatische Sendefunktion gestartet."
                      : "Verbinde deinen eigenen Kanal, damit FanMind deine echten Nachrichten, Kontakte und Fans in deinem Workspace verwalten kann."}
              </p>

              {activeConnectionCards.length > 0 &&
              activeChannel.key !== "telegram" ? (
                <div
                  className={`${styles.childSourceGrid} ${
                    activeConnectionCards.length === 1
                      ? styles.childSourceGridSingle
                      : ""
                  }`}
                  aria-label={`${activeChannel.name} Verbindungsmöglichkeiten`}
                >
                  {activeConnectionCards.map((connectionCard) => (
                    <div
                      className={styles.childSourceCard}
                      key={connectionCard.key}
                    >
                      <div>
                        <strong>{connectionCard.title}</strong>
                        <p>{connectionCard.description}</p>
                      </div>
                      <ul className={styles.connectionCardList}>
                        <li>Status: {connectionCard.status}</li>
                        <li>Integrationstyp: {connectionCard.integrationType}</li>
                        <li>Verbindungstyp: {connectionCard.connectionType}</li>
                        <li>Auto-Senden: deaktiviert</li>
                        {connectionCard.details.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                      {connectionCard.key === "facebook_messages" ? (
                        <div className={styles.releaseBox}>
                          <strong>Nachrichten-Status</strong>
                          <ul className={styles.connectionCardList}>
                            <li>Page: {facebookConnection?.page_name ?? facebookConnection?.page_id ?? "nicht verbunden"}</li>
                            <li>Webhook messages: {formatWebhookStatus(displayedWebhookStatus?.fields.messages)}</li>
                            <li>Webhook message_echoes: {formatWebhookStatus(displayedWebhookStatus?.fields.message_echoes)}</li>
                            <li>Letzte Nachricht: {lastMessageEvent ? formatDateTime(lastMessageEvent.received_at) : "noch keine Nachricht empfangen"}</li>
                            <li>Letzter Messenger-Sync: {facebookConnection?.last_messenger_sync_at ? formatDateTime(facebookConnection.last_messenger_sync_at) : "noch nicht ausgeführt"}</li>
                            <li>OAuth Callback: {facebookLiveSetupStatus.oauthCallbackUrl ?? "nicht vollständig konfiguriert"}</li>
                          </ul>
                        </div>
                      ) : null}
                      {connectionCard.key === "facebook_comments" ? (
                        <div className={styles.releaseBox}>
                          <strong>Kommentar-Status</strong>
                          <ul className={styles.connectionCardList}>
                            <li>Letztes Kommentar-Event: {lastFeedCommentEvent ? formatDateTime(lastFeedCommentEvent.received_at) : "noch kein echter Kommentar empfangen"}</li>
                            <li>Letzter Kommentar-Abruf: {facebookConnection?.last_comment_fetch_at ? formatDateTime(facebookConnection.last_comment_fetch_at) : "geparkt, nicht ausgeführt"}</li>
                            <li>Kommentar-Scopes angefordert: {commentFeedScopesRequested ? "ja" : "nein"}</li>
                            <li>Token-Scopes vollständig: {commentFeedScopesGranted ? "ja" : "nein"}</li>
                            <li>feed/Kommentare: geparkt, nicht automatisch aktiviert</li>
                          </ul>
                        </div>
                      ) : null}
                      <div className={styles.connectionCardActions}>
                        {connectionCard.key === "facebook_messages" &&
                        !facebookConnection ? (
                          <a
                            className={styles.modalLinkButton}
                            href="/api/integrations/facebook/start?type=facebook_messages"
                          >
                            Nachrichten verbinden
                          </a>
                        ) : (
                          <button
                            type="button"
                            className={styles.secondaryModalButton}
                            onClick={() => {
                              if (connectionCard.key === "facebook_messages") {
                                if (facebookConnection) {
                                  runPageWebhookAction("check");
                                } else {
                                  setNotice(
                                    "DM-Verbindung ist vorbereitet. Starte die Facebook-Verbindung über die DM-Karte.",
                                  );
                                }
                                return;
                              }
                              if (connectionCard.key === "facebook_comments") {
                                setNotice(
                                  "Kommentarverbindung ist vorbereitet. Es wurde kein OAuth-Flow und kein Scraping gestartet.",
                                );
                                return;
                              }
                              setNotice(
                                `${connectionCard.title} ist nach dem einheitlichen Kanalstandard vorbereitet. Es wurde keine externe Anmeldung gestartet.`,
                              );
                            }}
                            disabled={
                              connectionCard.key === "facebook_messages" &&
                              Boolean(pageWebhookPending)
                            }
                          >
                            {connectionCard.key === "facebook_messages" &&
                            pageWebhookPending === "check"
                              ? "DM-Verbindung wird geprüft ..."
                              : connectionCard.actionLabel}
                          </button>
                        )}
                        {connectionCard.key === "facebook_messages" &&
                        facebookConnection ? (
                          <form
                            method="post"
                            action="/api/integrations/facebook/disconnect"
                          >
                            <button
                              type="submit"
                              className={styles.dangerModalButton}
                            >
                              DM-Verbindung trennen
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {activeChannel.key === "telegram" ? (
                <div
                  className={styles.telegramSplitGrid}
                  aria-label="Telegram Integrationswege"
                >
                  <section
                    className={styles.telegramColumn}
                    aria-label="Telegram Account und Inbox"
                  >
                    <div className={styles.telegramColumnHeader}>
                      <p className={styles.modalEyebrow}>Hauptintegration</p>
                      <h3>Telegram Account / Inbox</h3>
                      <p>
                        Verbinde dein eigenes Telegram-Konto, damit FanMind
                        deine Telegram-Chats/Kontakte als Arbeits-Eingang
                        verwalten kann. Du entscheidest, welche Chats
                        importiert werden. Antworten werden nie automatisch
                        gesendet.
                      </p>
                    </div>
                    <div
                      className={styles.releaseBox}
                      aria-label="Telegram Account und Inbox Status"
                    >
                      <strong>Status & Verbindung</strong>
                      <ul className={styles.compactStatusList}>
                        <li>Status: Geplant / Vorbereitung</li>
                        <li>Integrationstyp: telegram_account</li>
                        <li>Verbindung: noch nicht live geschaltet</li>
                        <li>Import: nur nach deiner Auswahl</li>
                        <li>Auto-Senden: deaktiviert</li>
                        <li>Antworten: vorbereitet oder manuell gesendet</li>
                      </ul>
                      <p className={styles.modalNotice}>
                        Diese Verbindung ist als Produkt-/UI-Vorbereitung
                        sichtbar. Es wird aktuell keine Telefonnummer abgefragt,
                        keine Telegram-Session gespeichert und kein privater
                        Chat importiert.
                      </p>
                    </div>
                    <div
                      className={styles.releaseBox}
                      aria-label="Telegram Account und Inbox Datenschutz"
                    >
                      <strong>Datenschutz & Kontrolle</strong>
                      <ul className={styles.compactStatusList}>
                        <li>Du entscheidest, welche Chats importiert werden.</li>
                        <li>Keine automatische Antwort.</li>
                        <li>Jeder Workspace sieht nur seine eigenen Telegram-Daten.</li>
                        <li>Trennung pro Nutzer/Workspace.</li>
                        <li>Disconnect jederzeit möglich.</li>
                        <li>Kein Zugriff auf fremde Workspaces.</li>
                      </ul>
                    </div>
                    <div
                      className={styles.releaseBox}
                      aria-label="Telegram Account und Inbox Ablauf"
                    >
                      <strong>Geplanter Ablauf</strong>
                      <ul className={styles.compactStatusList}>
                        <li>Einwilligung und Scope-Auswahl pro Workspace</li>
                        <li>Chat-Auswahl vor Import statt Vollimport</li>
                        <li>Ingress in den FanMind Arbeits-Eingang</li>
                        <li>Antworten nur vorbereitet oder manuell</li>
                        <li>Keine automatische Sendefunktion</li>
                        <li>Saubere Trennung je Nutzer/Workspace</li>
                      </ul>
                    </div>
                    <div
                      className={styles.connectionCardActions}
                      aria-label="Telegram Account und Inbox Aktionen"
                    >
                      <button
                        type="button"
                        className={styles.secondaryModalButton}
                        disabled
                        title="Telegram Account / Inbox ist als Hauptintegration in Vorbereitung"
                      >
                        Telegram-Inbox verbinden
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryModalButton}
                        onClick={() =>
                          setNotice(
                            "Telegram Account / Inbox ist als Hauptintegration geplant. Noch kein MTProto-/TDLib-Flow, keine Telefonnummern und keine Session-Speicherung aktiv.",
                          )
                        }
                      >
                        Coming Soon
                      </button>
                    </div>
                  </section>
                  <section
                    className={styles.telegramColumn}
                    aria-label="FanMind Bot"
                  >
                    <div className={styles.telegramColumnHeader}>
                      <p className={styles.modalEyebrow}>Optionaler Zusatz</p>
                      <h3>FanMind Bot</h3>
                      <p>
                        Optionaler Bot-Eingang für Nachrichten, die direkt an
                        {" "}
                        {TELEGRAM_BOT_USERNAME}
                        {" "}
                        gesendet werden. Geeignet für Tests, Support oder
                        einfache Bot-Kommunikation. Das ist nicht deine
                        persönliche Telegram-Inbox.
                      </p>
                    </div>
                    <div
                      className={styles.releaseBox}
                      aria-label="FanMind Bot Status"
                    >
                      <strong>Status & Verbindung</strong>
                      {telegramCheckRequested ? (
                        <p className={styles.inlineStatus}>
                          Bot-Verbindung wurde gerade geprüft.
                        </p>
                      ) : null}
                      <ul className={styles.compactStatusList}>
                        <li>Status: Live</li>
                        <li>Integrationstyp: telegram_bot</li>
                        <li>Bot: {TELEGRAM_BOT_USERNAME}</li>
                        <li>Webhook: {telegramWebhookLabel}</li>
                        <li>Live-Check: {telegramStatusLabel}</li>
                        <li>Auto-Senden: deaktiviert</li>
                        <li>Rolle: optionaler Eingang</li>
                      </ul>
                      {telegramSetupStatus.error ||
                      telegramSetupStatus.lastErrorMessage ? (
                        <p className={styles.modalNotice}>
                          Prüfung nötig:{" "}
                          {telegramSetupStatus.lastErrorMessage ??
                            telegramSetupStatus.error}
                        </p>
                      ) : null}
                      <p className={styles.modalNotice}>
                        Eingehende Nachrichten an den FanMind Bot landen nur
                        im explizit serverseitig konfigurierten Test-Workspace.
                        Ohne eindeutige Workspace-Zuordnung wird nichts angelegt.
                      </p>
                    </div>
                    <div
                      className={styles.releaseBox}
                      aria-label="Letzte FanMind Bot Eingänge"
                    >
                      <strong>Letzte Bot-Eingänge</strong>
                      <p className={styles.subtleModalText}>
                        Quelle: conversation_messages · source_platform=telegram
                        · FanMind Bot
                      </p>
                      {telegramMessages.length > 0 ? (
                        <ul className={styles.messageList}>
                          {telegramMessages.map((message) => (
                            <li key={`bot-${message.id}`}>
                              <a href={`/fans/${message.contact_id}`}>
                                <strong>
                                  {message.author_label ?? "Telegram Kontakt"}
                                </strong>
                                <span>
                                  {" "}
                                  ·{" "}
                                  {getTelegramSourceTypeLabel(
                                    message.source_type,
                                  )}
                                </span>
                                <span>
                                  {" "}
                                  · {formatDateTime(message.created_at)}
                                </span>
                                <p>{message.content.slice(0, 140)}</p>
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : telegramMessagesError ? (
                        <p className={styles.modalNotice}>
                          Bot-Eingänge konnten nicht geladen werden:{" "}
                          {telegramMessagesError}
                        </p>
                      ) : (
                        <p className={styles.modalNotice}>
                          Noch keine Bot-Eingänge in diesem Workspace gefunden.
                        </p>
                      )}
                    </div>
                    <div
                      className={styles.releaseBox}
                      aria-label="FanMind Bot technische Details"
                    >
                      <strong>Technische Details</strong>
                      <ul className={styles.compactStatusList}>
                        <li>
                          Letzte Prüfung:{" "}
                          {telegramSetupStatus.checkedAt
                            ? formatDateTime(telegramSetupStatus.checkedAt)
                            : "noch nicht geprüft"}
                        </li>
                        <li>
                          Webhook-URL:{" "}
                          <span className={styles.breakableText}>
                            {telegramSetupStatus.webhookUrl ??
                              TELEGRAM_EXPECTED_WEBHOOK_URL}
                          </span>
                        </li>
                        <li>
                          Pending Updates: {" "}
                          {telegramSetupStatus.pendingUpdateCount ??
                            "nicht geprüft"}
                        </li>
                        <li>Eingang: Bot-Textnachrichten</li>
                        <li>Workspace-Zuordnung: explizit konfigurierte Testbindung</li>
                      </ul>
                    </div>
                    <div
                      className={styles.releaseBox}
                      aria-label="FanMind Bot Testablauf"
                    >
                      <strong>Bot-Eingang testen</strong>
                      <ol className={styles.stepList}>
                        <li>FanMind Bot öffnen.</li>
                        <li>In Telegram auf Start drücken.</li>
                        <li>Testnachricht an den Bot senden.</li>
                        <li>Bot-Verbindung prüfen oder FanMind neu laden.</li>
                        <li>Nachricht erscheint in Inbox und Fan-Detail.</li>
                      </ol>
                    </div>
                    <div
                      className={styles.connectionCardActions}
                      aria-label="FanMind Bot Aktionen"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          router.push("/channels?check=telegram");
                          router.refresh();
                        }}
                      >
                        Bot-Verbindung prüfen
                      </button>
                      <a
                        className={styles.modalLinkButton}
                        href="https://t.me/FanMindBot"
                        target="_blank"
                        rel="noreferrer"
                      >
                        FanMind Bot öffnen
                      </a>
                      <button
                        type="button"
                        className={styles.secondaryModalButton}
                        onClick={() =>
                          setNotice(
                            "FanMind Bot ist ein optionaler Zusatzkanal. Die persönliche Telegram Account-/Inbox-Integration bleibt der Hauptweg und ist in Vorbereitung.",
                          )
                        }
                      >
                        Hinweis anzeigen
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryModalButton}
                        onClick={() => setActiveChannel(null)}
                      >
                        Schließen
                      </button>
                    </div>
                  </section>
                </div>
              ) : null}

              {activeSyncStatus && activeConnectionCards.length === 0 && activeChannel.key !== "telegram" ? (
                <div
                  className={styles.releaseBox}
                  aria-label={`Statusblock für ${activeChannel.name}`}
                >
                  <strong>Kanal-Statusstandard</strong>
                  <ul>
                    <li>Verbindung/Status: {activeSyncStatus.connection}</li>
                    <li>Webhook: {activeSyncStatus.webhook}</li>
                    <li>Verlauf-Sync: {activeSyncStatus.historySync}</li>
                    <li>Sync-Limit: {activeSyncStatus.syncLimit}</li>
                    <li>Letzter Sync: {activeSyncStatus.lastSync}</li>
                    <li>
                      Imported inbound: {activeSyncStatus.importedInbound}
                    </li>
                    <li>
                      Imported outbound: {activeSyncStatus.importedOutbound}
                    </li>
                    <li>Imported media: {activeSyncStatus.importedMedia}</li>
                    <li>
                      Dubletten übersprungen:{" "}
                      {activeSyncStatus.skippedDuplicates}
                    </li>
                    <li>Letzter Fehler: {activeSyncStatus.lastError}</li>
                  </ul>
                </div>
              ) : null}
              {activeChannel.key === "facebook" && activeConnectionCards.length === 0 && !facebookConnection ? (
                <p
                  className={styles.modalNotice}
                  role={missingFacebookSetupItems.length ? "alert" : "status"}
                >
                  Live-Setup Facebook Nachrichten:{" "}
                  <strong>
                    {missingFacebookSetupItems.length
                      ? `unvollständig (${missingFacebookSetupItems.join(", ")})`
                      : "bereit zum Verbinden"}
                  </strong>
                  <br />
                  OAuth Callback URL:{" "}
                  <strong>
                    {facebookLiveSetupStatus.oauthCallbackUrl ??
                      "NEXT_PUBLIC_APP_URL/FACEBOOK_REDIRECT_URI fehlt"}
                  </strong>
                  <br />
                  Page verbunden: <strong>nein</strong>
                  <br />
                  Webhook bereit: <strong>nicht bestätigt</strong>
                </p>
              ) : null}
              {activeChannel.key === "facebook" && activeConnectionCards.length === 0 && facebookConnection ? (
                <>
                  <p className={styles.modalNotice}>
                    OAuth verbunden · Page:{" "}
                    <strong>
                      {facebookConnection.page_name ??
                        facebookConnection.page_id}
                    </strong>
                    <br />
                    Setup-Konfiguration:{" "}
                    <strong>
                      {missingFacebookSetupItems.length
                        ? `unvollständig (${missingFacebookSetupItems.join(", ")})`
                        : "vollständig"}
                    </strong>
                    <br />
                    Business-ID bekannt:{" "}
                    <strong>
                      {facebookLiveSetupStatus.metaBusinessIdConfigured
                        ? "ja"
                        : "nein · Postfach-Fallback bleibt nutzbar"}
                    </strong>
                    <br />
                    Conversation-Links beim Sync:{" "}
                    <strong>
                      werden aus dem Graph-Feld link gespeichert, falls Meta es
                      für Conversations liefert
                    </strong>
                    <br />
                    Aktuelle Öffnen-Qualität:{" "}
                    <strong>
                      exakter Chat nur mit gespeichertem Conversation-Link,
                      sonst Facebook-Postfach-Fallback
                    </strong>
                    <br />
                    OAuth Callback URL:{" "}
                    <strong>
                      {facebookLiveSetupStatus.oauthCallbackUrl ??
                        "NEXT_PUBLIC_APP_URL/FACEBOOK_REDIRECT_URI fehlt"}
                    </strong>
                    <br />
                    Page verbunden:{" "}
                    <strong>
                      {facebookConnection.page_id ? "ja" : "nein"}
                    </strong>
                    <br />
                    Webhook bereit:{" "}
                    <strong>
                      {messengerWebhookReady ? "bestätigt" : "nicht bestätigt"}
                    </strong>
                    <br />
                    Webhook messages:{" "}
                    <strong>
                      {formatWebhookStatus(
                        displayedWebhookStatus?.fields.messages,
                      )}
                    </strong>
                    <br />
                    Webhook message_echoes:{" "}
                    <strong>
                      {formatWebhookStatus(
                        displayedWebhookStatus?.fields.message_echoes,
                      )}
                    </strong>
                    <br />
                    Letztes Webhook-Event:{" "}
                    <strong>
                      {lastWebhookEvent
                        ? formatDateTime(lastWebhookEvent.received_at)
                        : "noch keines empfangen"}
                    </strong>
                    <br />
                    Letzte Nachricht:{" "}
                    <strong>
                      {lastMessageEvent
                        ? formatDateTime(lastMessageEvent.received_at)
                        : "noch keine Nachricht empfangen"}
                    </strong>
                    <br />
                    Letzter inbound message Event-Zeitpunkt:{" "}
                    <strong>
                      {lastInboundMessageEvent
                        ? formatDateTime(lastInboundMessageEvent.received_at)
                        : "noch kein inbound messages Event empfangen"}
                    </strong>
                    <br />
                    Letzter outbound echo Event-Zeitpunkt:{" "}
                    <strong>
                      {lastOutboundEchoEvent
                        ? formatDateTime(lastOutboundEchoEvent.received_at)
                        : "Kein message_echoes Event empfangen"}
                    </strong>
                    <br />
                    Letztes echtes feed/comment Event:{" "}
                    <strong>
                      {lastFeedCommentEvent
                        ? `${formatDateTime(lastFeedCommentEvent.received_at)} · ${lastFeedCommentEvent.text ?? lastFeedCommentEvent.message_text ?? "ohne Text"}`
                        : "noch kein echter Kommentar empfangen"}
                    </strong>
                    <br />
                    Letzter Messenger-Sync:{" "}
                    <strong>
                      {facebookConnection.last_messenger_sync_at
                        ? `${formatDateTime(facebookConnection.last_messenger_sync_at)} · ${facebookConnection.last_messenger_sync_checked_count ?? 0} Conversations geprüft · inbound ${facebookConnection.last_messenger_sync_imported_inbound_count ?? 0} · outbound ${facebookConnection.last_messenger_sync_imported_outbound_count ?? 0} · Medien ${facebookConnection.last_messenger_sync_imported_media_count ?? 0} · Dubletten ${facebookConnection.last_messenger_sync_skipped_count ?? 0} · bis zu 50 Nachrichten je Conversation`
                        : "noch nicht ausgeführt · bis zu 50 Nachrichten je Conversation"}
                    </strong>
                    <br />
                    Letzte importierte outbound Message:{" "}
                    <strong>
                      {facebookConnection.last_messenger_sync_outbound_at
                        ? formatDateTime(
                            facebookConnection.last_messenger_sync_outbound_at,
                          )
                        : "noch keine via Sync importiert"}
                    </strong>
                    {facebookConnection.last_messenger_sync_error ? (
                      <>
                        <br />
                        Messenger-Sync Fehler:{" "}
                        <strong>
                          {facebookConnection.last_messenger_sync_error}
                        </strong>
                      </>
                    ) : null}
                    <br />
                    Letzter Kommentar-Abruf:{" "}
                    <strong>
                      {facebookConnection.last_comment_fetch_at
                        ? `${formatDateTime(facebookConnection.last_comment_fetch_at)} · ${facebookConnection.last_comment_fetch_count ?? 0} neu importiert`
                        : "geparkt, nicht ausgeführt"}
                    </strong>
                    {facebookConnection.last_comment_fetch_error ? (
                      <>
                        <br />
                        Kommentar-Abruf Fehler:{" "}
                        <strong>
                          {facebookConnection?.last_comment_fetch_error}
                        </strong>
                      </>
                    ) : null}
                    <br />
                    Page-ID:{" "}
                    <strong>
                      {displayedWebhookStatus?.pageId ??
                        facebookConnection.page_id ??
                        "unbekannt"}
                    </strong>
                    <br />
                    Page Access Token vorhanden:{" "}
                    <strong>
                      {displayedWebhookStatus?.hasPageAccessToken
                        ? "ja"
                        : "nein"}
                    </strong>
                    <br />
                    Angeforderte Messenger-OAuth-Scopes:{" "}
                    <strong>
                      {formatScopeList(requestedMessagesOauthScopes)}
                    </strong>
                    <br />
                    comment/feed-relevante Scopes angefordert:{" "}
                    <strong>
                      {commentFeedScopesRequested ? "ja" : "nein"}
                    </strong>
                    <br />
                    Vom Token erkannte Scopes:{" "}
                    <strong>{formatScopeList(detectedFacebookScopes)}</strong>
                    <br />
                    pages_messaging vorhanden:{" "}
                    <strong>{pagesMessagingGranted ? "ja" : "nein"}</strong>
                    <br />
                    pages_read_user_content vorhanden:{" "}
                    <strong>
                      {pagesReadUserContentGranted ? "ja" : "nein"}
                    </strong>
                    <br />
                    pages_manage_engagement vorhanden:{" "}
                    <strong>
                      {pagesManageEngagementGranted ? "ja" : "nein"}
                    </strong>
                    <br />
                    comment/feed-relevante Token-Scopes vollständig:{" "}
                    <strong>{commentFeedScopesGranted ? "ja" : "nein"}</strong>
                    <br />
                    Page subscribed_apps:{" "}
                    <strong>
                      {formatWebhookStatus(
                        displayedWebhookStatus?.subscribedAppsStatus,
                      )}
                    </strong>
                    <br />
                    messages:{" "}
                    <strong>
                      {formatWebhookStatus(
                        displayedWebhookStatus?.fields.messages,
                      )}
                    </strong>{" "}
                    · message_echoes:{" "}
                    <strong>
                      {formatWebhookStatus(
                        displayedWebhookStatus?.fields.message_echoes,
                      )}
                    </strong>{" "}
                    · feed/Kommentare:{" "}
                    <strong>geparkt, nicht automatisch aktiviert</strong>
                    {!messageEchoesReady ? (
                      <>
                        <br />
                        <strong>
                          Keine outbound Echo-Events empfangen. Nutze
                          Messenger-Sync als Fallback.
                        </strong>
                      </>
                    ) : null}
                    {displayedWebhookStatus?.error ? (
                      <>
                        <br />
                        Meta-Fehler:{" "}
                        <strong>{displayedWebhookStatus.error}</strong>
                      </>
                    ) : null}
                    {!lastFeedCommentEvent &&
                    (!commentFeedScopesGranted ||
                      displayedWebhookStatus?.fields.feed !== "active") ? (
                      <>
                        <br />
                        Kommentar-Empfang blockiert:{" "}
                        <strong>
                          {getFacebookCommentBlockingReason(
                            commentFeedScopesGranted,
                            displayedWebhookStatus?.fields.feed,
                          )}
                        </strong>
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
                      {pageWebhookPending === "check"
                        ? "Page-Webhooks prüfen ..."
                        : "Page-Webhooks prüfen"}
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryModalButton}
                      onClick={() => runPageWebhookAction("activate")}
                      disabled={Boolean(pageWebhookPending)}
                    >
                      {pageWebhookPending === "activate"
                        ? "Page-Webhooks aktivieren ..."
                        : "Page-Webhooks aktivieren"}
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryModalButton}
                      onClick={runMetaPermissionDiagnosis}
                      disabled={metaPermissionPending}
                    >
                      {metaPermissionPending
                        ? "Meta-Berechtigungen prüfen ..."
                        : "Meta-Berechtigungen prüfen"}
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryModalButton}
                      onClick={runMessengerSync}
                      disabled={messengerSyncPending}
                    >
                      {messengerSyncPending
                        ? "Messenger-Verlauf synchronisiert ..."
                        : "Messenger-Verlauf synchronisieren"}
                    </button>
                  </div>
                  {metaPermissionDiagnosis ? (
                    <div
                      className={styles.releaseBox}
                      role={metaPermissionDiagnosis.ok ? "status" : "alert"}
                      aria-label="Meta-Berechtigungsdiagnose"
                    >
                      <strong>Meta-Berechtigungen prüfen</strong>
                      <ul>
                        <li>
                          Verbindung aktiv:{" "}
                          {formatBoolean(
                            metaPermissionDiagnosis.connectionActive,
                          )}
                        </li>
                        <li>
                          Page-ID erkannt:{" "}
                          {formatBoolean(
                            metaPermissionDiagnosis.pageIdDetected,
                          )}
                        </li>
                        <li>
                          Page Access Token vorhanden:{" "}
                          {formatBoolean(
                            metaPermissionDiagnosis.pageAccessTokenPresent,
                          )}
                        </li>
                        <li>
                          Token-Prüfung erfolgreich:{" "}
                          {formatBoolean(
                            metaPermissionDiagnosis.tokenCheckSuccessful,
                          )}
                        </li>
                        <li>
                          Erkannte Berechtigungen:{" "}
                          {formatScopeList(
                            metaPermissionDiagnosis.detectedPermissions,
                          )}
                        </li>
                        <li>
                          Sichtbare Page-/Messenger-/Business-Rechte:{" "}
                          {formatScopeList(
                            metaPermissionDiagnosis.visiblePageRights,
                          )}
                        </li>
                        <li>
                          Möglicherweise fehlende Berechtigungen:{" "}
                          {formatScopeList(
                            metaPermissionDiagnosis.missingPermissions,
                          )}
                        </li>
                        <li>
                          App Review prüfen:{" "}
                          {formatBoolean(
                            metaPermissionDiagnosis.appReviewCheckRecommended,
                          )}
                        </li>
                        <li>
                          Advanced Access prüfen:{" "}
                          {formatBoolean(
                            metaPermissionDiagnosis.advancedAccessCheckRecommended,
                          )}
                        </li>
                        <li>
                          Token wirkt eingeschränkt:{" "}
                          {formatBoolean(
                            metaPermissionDiagnosis.tokenAppearsRestricted,
                          )}
                        </li>
                        <li>{metaPermissionDiagnosis.directChatIdStatus}</li>
                      </ul>
                      <p>{metaPermissionDiagnosis.note}</p>
                      {metaPermissionDiagnosis.error ? (
                        <p>Meta-Hinweis: {metaPermissionDiagnosis.error}</p>
                      ) : null}
                    </div>
                  ) : null}
                  {messengerSyncResult ? (
                    <p
                      className={styles.modalNotice}
                      role={messengerSyncResult.ok ? "status" : "alert"}
                    >
                      Messenger-Sync: {messengerSyncResult.conversationsChecked}{" "}
                      Conversations geprüft ·{" "}
                      {messengerSyncResult.importedInbound} inbound neu ·{" "}
                      {messengerSyncResult.importedOutbound} outbound neu ·{" "}
                      {messengerSyncResult.importedMedia} Medien ·{" "}
                      {messengerSyncResult.skippedDuplicates} Dubletten
                      übersprungen
                      {messengerSyncResult.error
                        ? ` · Fehler: ${messengerSyncResult.error}`
                        : ""}
                    </p>
                  ) : null}
                </>
              ) : null}
              {activeChannel.key === "facebook" &&
              activeConnectionCards.length === 0 &&
              facebookConnection &&
              metaWebhookError ? (
                <p className={styles.modalNotice} role="alert">
                  Meta-Webhook-Events konnten nicht gelesen werden:{" "}
                  {metaWebhookError}
                </p>
              ) : null}
              {activeChannel.key === "facebook" && activeConnectionCards.length === 0 && facebookConnection ? (
                <div
                  className={styles.releaseBox}
                  aria-label="Meta Webhook Diagnose"
                >
                  <strong>Meta Webhook Diagnose (letzte 20 Events)</strong>
                  <p>
                    Service-Role-Key:{" "}
                    <strong>
                      {metaWebhookStorageHealth.serviceRoleConfigured
                        ? "verfügbar"
                        : "fehlt"}
                    </strong>{" "}
                    · Tabelle public.meta_webhook_events:{" "}
                    <strong>
                      {metaWebhookStorageHealth.tableReadable
                        ? "lesbar"
                        : "fehlt/nicht lesbar"}
                    </strong>
                    {metaWebhookStorageHealth.error
                      ? ` · Fehler: ${metaWebhookStorageHealth.error}`
                      : ""}
                  </p>
                  {selfTestDisabledReason ? (
                    <p role="alert">
                      Selbsttest blockiert: {selfTestDisabledReason}.
                    </p>
                  ) : null}
                  <button
                    type="button"
                    className={styles.secondaryModalButton}
                    onClick={runMetaWebhookSelfTest}
                    disabled={
                      selfTestPending || Boolean(selfTestDisabledReason)
                    }
                    title={
                      selfTestDisabledReason ??
                      "Speichert ein Testevent in public.meta_webhook_events"
                    }
                  >
                    {selfTestPending
                      ? "Webhook-Selbsttest läuft ..."
                      : "Webhook-Selbsttest starten"}
                  </button>
                  {selfTestResult ? (
                    <p role="status">
                      Selbsttest:{" "}
                      {selfTestResult.ok
                        ? "Insert erfolgreich"
                        : "Insert fehlgeschlagen"}{" "}
                      · workspace_id {selfTestResult.workspace_id} · event_type{" "}
                      {selfTestResult.event_type} · status{" "}
                      {selfTestResult.status}
                      {selfTestResult.error
                        ? ` · Fehler: ${selfTestResult.error}`
                        : ""}
                    </p>
                  ) : null}
                  {selfTestError ? (
                    <p role="alert">
                      Selbsttest fehlgeschlagen: {selfTestError}
                    </p>
                  ) : null}
                  {!lastOutboundEchoEvent ? (
                    <p role="status">
                      Keine outbound Echo-Events empfangen. Nutze Messenger-Sync
                      als Fallback; message_echoes bleibt weiterhin aktiv und
                      wird verarbeitet, sobald Meta Events liefert.
                    </p>
                  ) : null}
                  {metaWebhookEvents.length ? (
                    <ul>
                      {metaWebhookEvents.map((event) => (
                        <li key={event.id}>
                          {formatDateTime(event.received_at)} ·{" "}
                          {formatMetaWebhookEventKind(event)} · Page{" "}
                          {event.page_id ?? "unbekannt"} · Sender{" "}
                          {event.sender_id ?? "unbekannt"} · Status{" "}
                          {event.status}
                          {(event.text ?? event.message_text)
                            ? ` · Text: ${event.text ?? event.message_text}`
                            : ""}
                          {event.error_reason
                            ? ` · Grund: ${event.error_reason}`
                            : ""}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Noch keine Meta-Webhook-Events empfangen.</p>
                  )}
                </div>
              ) : null}

              {false ? (
                <p
                  className={styles.modalNotice}
                  role={
                    facebookConnection?.last_comment_fetch_error ||
                    facebookErrorCode === "comment_review"
                      ? "alert"
                      : "status"
                  }
                >
                  Kommentare vorbereitet, Live-Test später. Nachrichten können
                  trotzdem separat verbunden werden.
                  <br />
                  Technischer Typ: <strong>facebook_comments</strong>
                  <br />
                  Angeforderte Kommentar-OAuth-Scopes:{" "}
                  <strong>
                    {formatScopeList(requestedCommentOauthScopes)}
                  </strong>
                  <br />
                  Optionale Scopes werden nur vorbereitet, wenn Meta/App-Review
                  sie erlaubt:{" "}
                  <strong>
                    pages_read_user_content, pages_manage_engagement
                  </strong>
                  <br />
                  Status: <strong>vorbereitet · Live-Test später</strong>
                  {facebookConnection?.last_comment_fetch_error ? (
                    <>
                      <br />
                      Letzter Kommentarimport-Fehler:{" "}
                      <strong>
                        {facebookConnection?.last_comment_fetch_error}
                      </strong>
                    </>
                  ) : null}
                </p>
              ) : null}
              {activeChannel.key === "facebook" && facebookError ? (
                <p className={styles.modalNotice} role="alert">
                  {getFacebookErrorMessage(facebookErrorCode)}
                </p>
              ) : null}
              {activeConnectionCards.length === 0 ? (
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
              ) : null}
              {notice ? (
                <p className={styles.modalNotice} role="status">
                  {notice}
                </p>
              ) : null}
              {activeConnectionCards.length === 0 ? (
                <div className={styles.modalActions}>
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
                  <button
                    type="button"
                    className={styles.secondaryModalButton}
                    onClick={() => setActiveChannel(null)}
                  >
                    Schließen
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function buildChannelSyncStatus(
  config: (typeof CHANNEL_SOURCE_CONFIGS)[PreparedSourceType],
  facebookConnection: FacebookConnection | null,
): {
  connection: string;
  webhook: string;
  historySync: string;
  syncLimit: string;
  lastSync: string;
  importedInbound: string;
  importedOutbound: string;
  importedMedia: string;
  skippedDuplicates: string;
  lastError: string;
} {
  const isFacebookMessages = config.sourceType === "facebook_messages";
  if (isFacebookMessages && facebookConnection) {
    return {
      connection: `verbunden${facebookConnection.page_name ? ` · ${facebookConnection.page_name}` : ""}`,
      webhook: facebookConnection.webhook_subscribed
        ? "aktiv"
        : "nicht bestätigt",
      historySync: config.historySyncSupported
        ? "aktiv/manuell auslösbar"
        : "nicht verfügbar",
      syncLimit: config.defaultSyncLimit
        ? `${config.defaultSyncLimit} Nachrichten je Conversation`
        : "kein Limit gesetzt",
      lastSync: facebookConnection.last_messenger_sync_at
        ? formatDateTime(facebookConnection.last_messenger_sync_at)
        : "noch nicht ausgeführt",
      importedInbound: String(
        facebookConnection.last_messenger_sync_imported_inbound_count ?? 0,
      ),
      importedOutbound: String(
        facebookConnection.last_messenger_sync_imported_outbound_count ?? 0,
      ),
      importedMedia: String(
        facebookConnection.last_messenger_sync_imported_media_count ?? 0,
      ),
      skippedDuplicates: String(
        facebookConnection.last_messenger_sync_skipped_count ?? 0,
      ),
      lastError:
        facebookConnection.last_messenger_sync_error ??
        "kein Fehler gespeichert",
    };
  }
  return {
    connection: config.statusText,
    webhook: config.liveWebhookSupported
      ? "vorbereitet"
      : "nicht aktiv/vorbereitet",
    historySync: config.historySyncSupported
      ? "vorbereitet"
      : "nicht verfügbar oder später",
    syncLimit: config.defaultSyncLimit
      ? `${config.defaultSyncLimit} Nachrichten je Conversation`
      : "kein Live-Sync-Limit",
    lastSync: "kein echter Sync ausgeführt",
    importedInbound: "—",
    importedOutbound: "—",
    importedMedia: "—",
    skippedDuplicates: "—",
    lastError: "—",
  };
}

type ConnectionCard = {
  key: string;
  title: string;
  description: string;
  status: ChannelStatus;
  integrationType: IntegrationType;
  connectionType: string;
  actionLabel: string;
  details: string[];
};

function baseAccountPolicyDetails(): string[] {
  return [
    "Du verbindest deinen eigenen Kanal",
    "Keine automatische Antwort",
    "Jeder Workspace sieht nur eigene Daten",
    "Trennung pro Nutzer/Workspace",
    "Disconnect jederzeit möglich",
  ];
}

function defaultActionLabel(status: ChannelStatus): string {
  if (status === "Verbunden" || status === "Live") return "Verbindung prüfen";
  if (status === "Optional") return "Zusatzweg anzeigen";
  if (status === "Nicht verbunden") return "Kanal verbinden";
  if (status === "Coming Soon") return "Coming Soon";
  return "Verbindung vormerken";
}

function createCard(input: {
  key: string;
  title: string;
  description: string;
  status: ChannelStatus;
  integrationType: IntegrationType;
  connectionType: string;
  actionLabel?: string;
  details?: string[];
}): ConnectionCard {
  return {
    key: input.key,
    title: input.title,
    description: input.description,
    status: input.status,
    integrationType: input.integrationType,
    connectionType: input.connectionType,
    actionLabel: input.actionLabel ?? defaultActionLabel(input.status),
    details: input.details ?? baseAccountPolicyDetails(),
  };
}

function buildConnectionCards({
  channel,
  facebookConnection,
  telegramLive,
  telegramWebhookLabel,
}: {
  channel: Channel;
  facebookConnection: FacebookConnection | null;
  telegramLive: boolean;
  telegramWebhookLabel: string;
}): ConnectionCard[] {
  if (channel.key === "facebook") {
    return [
      createCard({
        key: "facebook_messages",
        title: "Facebook Page / Inbox",
        description:
          "Verbinde deine eigene Facebook Page/Inbox, damit FanMind deine echten Nachrichten und Kontakte in deinem Workspace verwalten kann.",
        status: facebookConnection ? "Verbunden" : "Nicht verbunden",
        integrationType: "page_inbox",
        connectionType: "page_inbox",
        actionLabel: facebookConnection
          ? "DM-Verbindung prüfen"
          : "Facebook Page verbinden",
        details: [
          ...baseAccountPolicyDetails(),
          `Page: ${facebookConnection?.page_name ?? facebookConnection?.page_id ?? "nicht verbunden"}`,
          `Webhook: ${facebookConnection?.webhook_subscribed ? "aktiv" : "nicht bestätigt"}`,
        ],
      }),
      createCard({
        key: "facebook_comments",
        title: "Facebook Kommentare",
        description:
          "Zusatzquelle für Kommentare deiner eigenen Facebook-Präsenz. Nicht deine komplette persönliche Inbox.",
        status: "Optional",
        integrationType: "comments",
        connectionType: "comments",
        actionLabel: "Kommentarverbindung vorbereiten",
        details: [
          "Optionaler Zusatzweg",
          "Live-Test später",
          "Kein Scraping",
          `Letzter Abruf: ${facebookConnection?.last_comment_fetch_at ? "vorhanden" : "geparkt"}`,
        ],
      }),
    ];
  }

  if (channel.key === "telegram") {
    return [
      createCard({
        key: "telegram_account",
        title: "Telegram Account / Inbox",
        description:
          "Hauptintegration in Vorbereitung: eigenes Telegram-Konto verbinden, Chats/Kontakte gezielt importieren und im Workspace verwalten.",
        status: "In Vorbereitung",
        integrationType: "account_inbox",
        connectionType: "account_inbox",
        actionLabel: "Telegram-Inbox verbinden",
        details: [
          ...baseAccountPolicyDetails(),
          "Du entscheidest, welche Chats importiert werden",
        ],
      }),
      createCard({
        key: "telegram_messages",
        title: "FanMind Bot",
        description:
          "Optionaler Bot-Eingang für Test-, Support- oder einfache Bot-Kommunikation. Nicht deine persönliche Inbox.",
        status: telegramLive ? "Live" : "Optional",
        integrationType: "bot",
        connectionType: `bot · Webhook ${telegramWebhookLabel}`,
        actionLabel: "Bot-Verbindung prüfen",
        details: [
          "Optionaler Zusatzweg",
          "Nicht deine persönliche Inbox",
          "Auto-Senden deaktiviert",
        ],
      }),
    ];
  }

  const byChannelKey: Partial<Record<string, ConnectionCard[]>> = {
    instagram: [
      createCard({
        key: "instagram_account",
        title: "Instagram Account / Inbox",
        description:
          "Verbinde dein eigenes Instagram-Konto, damit FanMind Nachrichten und Kontakte in deinem Workspace verwalten kann.",
        status: "Geplant",
        integrationType: "account_inbox",
        connectionType: "account_inbox",
      }),
      createCard({
        key: "instagram_comments",
        title: "Instagram Kommentare",
        description:
          "Optionaler Kommentar-Eingang als Zusatzquelle für deinen eigenen Kanal.",
        status: "In Vorbereitung",
        integrationType: "comments",
        connectionType: "comments",
      }),
    ],
    whatsapp: [
      createCard({
        key: "whatsapp_business",
        title: "WhatsApp Business Inbox",
        description:
          "Verbinde deine eigene WhatsApp Business Inbox als Hauptweg für Nachrichten in FanMind.",
        status: "Geplant",
        integrationType: "business_inbox",
        connectionType: "business_inbox",
      }),
    ],
    linkedin: [
      createCard({
        key: "linkedin_account",
        title: "LinkedIn Account / Inbox",
        description:
          "Verbinde dein eigenes LinkedIn-Konto, damit FanMind deine Kontakte und Nachrichten im Workspace verwalten kann.",
        status: "Geplant",
        integrationType: "account_inbox",
        connectionType: "account_inbox",
      }),
      createCard({
        key: "linkedin_page_comments",
        title: "LinkedIn Page / Kommentare",
        description:
          "Optionaler Zusatzweg für Page- und Kommentar-Kontexte. Nicht deine persönliche Inbox.",
        status: "Coming Soon",
        integrationType: "comments",
        connectionType: "comments",
      }),
    ],
    tiktok: [
      createCard({
        key: "tiktok_account",
        title: "TikTok Account / Inbox",
        description:
          "Verbinde dein eigenes TikTok-Konto, damit FanMind Nachrichten und Kontakte in deinem Workspace verwalten kann.",
        status: "In Vorbereitung",
        integrationType: "account_inbox",
        connectionType: "account_inbox",
      }),
      createCard({
        key: "tiktok_comments",
        title: "TikTok Kommentare",
        description:
          "Kommentar-Eingang als Zusatzquelle fuer deinen eigenen TikTok-Kanal.",
        status: "Geplant",
        integrationType: "comments",
        connectionType: "comments",
      }),
    ],
    youtube: [
      createCard({
        key: "youtube_channel_comments",
        title: "YouTube Kanal / Kommentare",
        description:
          "Hauptweg fuer Kommentare deines eigenen YouTube-Kanals in deinem Workspace.",
        status: "Geplant",
        integrationType: "account_inbox",
        connectionType: "account_inbox",
      }),
      createCard({
        key: "youtube_live_chat",
        title: "YouTube Live-Chat",
        description:
          "Optionaler Zusatzweg fuer Live-Chat-Kontexte. Nicht deine persoenliche Inbox.",
        status: "Coming Soon",
        integrationType: "comments",
        connectionType: "comments",
      }),
    ],
    email: [
      createCard({
        key: "email_inbox",
        title: "E-Mail Inbox",
        description:
          "Verbinde dein eigenes E-Mail-Postfach, damit FanMind Eingänge im Workspace verwalten kann.",
        status: "In Vorbereitung",
        integrationType: "email_inbox",
        connectionType: "email_inbox",
      }),
    ],
    webform: [
      createCard({
        key: "webform_intake",
        title: "Formular-Eingang",
        description:
          "Verbinde deinen eigenen Formular-Eingang als Hauptweg fuer Web-Leads und Anfragen.",
        status: "In Vorbereitung",
        integrationType: "form",
        connectionType: "form",
      }),
    ],
    discord: [
      createCard({
        key: "discord_server_inbox",
        title: "Discord Server / Channel Inbox",
        description:
          "Verbinde deinen eigenen Discord-Server bzw. Channel als Inbox-Quelle in deinem Workspace.",
        status: "Geplant",
        integrationType: "community_inbox",
        connectionType: "community_inbox",
      }),
    ],
    twitter: [
      createCard({
        key: "twitter_account",
        title: "X / Twitter Account / Inbox",
        description:
          "Verbinde dein eigenes X/Twitter-Konto, damit FanMind Kontakte und Nachrichten im Workspace verwalten kann.",
        status: "Geplant",
        integrationType: "account_inbox",
        connectionType: "account_inbox",
      }),
      createCard({
        key: "twitter_mentions",
        title: "X / Twitter Mentions",
        description:
          "Optionaler Zusatzweg fuer Mentions und oeffentliche Interaktionen.",
        status: "Coming Soon",
        integrationType: "comments",
        connectionType: "comments",
      }),
    ],
    manual: [
      createCard({
        key: "manual_import",
        title: "Manuell / CSV Eingang",
        description:
          "Direkter FanMind-Standardweg fuer manuelle Daten und CSV-Import in den eigenen Workspace.",
        status: "Live",
        integrationType: "form",
        connectionType: "form",
      }),
    ],
  };

  if (byChannelKey[channel.key]) {
    return byChannelKey[channel.key] ?? [];
  }

  const sources = channel.childSources?.length
    ? channel.childSources
    : [channel.key as PreparedSourceType];

  return sources.map((sourceType) => {
    const config = CHANNEL_SOURCE_CONFIGS[sourceType];
    const sourceLabel = config?.label ?? channel.name;

    return createCard({
      key: sourceType,
      title: `${sourceLabel} Account / Inbox`,
      description:
        config?.statusText ??
        `Verbinde deinen eigenen ${channel.name}-Kanal, damit FanMind Nachrichten und Kontakte in deinem Workspace verwalten kann.`,
      status: channel.status,
      integrationType: "account_inbox",
      connectionType: "account_inbox",
      details: [
        ...baseAccountPolicyDetails(),
        config?.statusHint ?? "Keine automatische Sendefunktion",
      ],
    });
  });
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
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatWebhookStatus(
  status: "active" | "missing" | "error" | "unknown" | undefined,
): string {
  if (status === "active") return "aktiv";
  if (status === "missing") return "fehlt";
  if (status === "error") return "Fehler";
  return "nicht geprüft";
}

function formatBoolean(value: boolean): string {
  return value ? "ja" : "nein";
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

function isOutboundEchoEvent(event: MetaWebhookEvent): boolean {
  const status = event.status.toLowerCase();
  const text = `${event.text ?? ""} ${event.message_text ?? ""}`.toLowerCase();
  return (
    event.event_type === "messages" &&
    (status.includes("message_echoes") ||
      status.includes("outbound") ||
      text.includes("message_echoes / outbound"))
  );
}

function isInboundMessageEvent(event: MetaWebhookEvent): boolean {
  return event.event_type === "messages" && !isOutboundEchoEvent(event);
}

function formatMetaWebhookEventKind(event: MetaWebhookEvent): string {
  if (isOutboundEchoEvent(event)) return "message_echoes / outbound";
  if (event.event_type === "messages") return "messages / inbound";
  return event.event_type;
}
