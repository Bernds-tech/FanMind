"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ComingSoonMark } from "@/components/ComingSoonMark";
import { PlatformLogo } from "@/components/PlatformLogo";
import styles from "./channels.module.css";
import { type TelegramWebhookStatus } from "@/lib/telegramStatus";

type ChannelStatus =
  | "Live / manuell nutzbar"
  | "Coming Soon / geplant / vorbereitet";
type ChannelPurpose =
  | "Nachrichten"
  | "Kommentare"
  | "Reviews"
  | "Community"
  | "Inbox";
type ChannelCategory =
  | "Globale Hauptkanäle"
  | "Creator & Community"
  | "Business & Reviews"
  | "Internationale Märkte";

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

type ChannelInput = {
  key: string;
  name: string;
  description: string;
  status: ChannelStatus;
  purpose: ChannelPurpose;
  technology: string;
  live: boolean;
};

type Channel = {
  key: string;
  logoKey: string;
  name: string;
  category: ChannelCategory;
  description: string;
  status: ChannelStatus;
  purpose: ChannelPurpose;
  technology: string;
  live: boolean;
  inputs: ChannelInput[];
};

type ChannelGroup = {
  id: string;
  label: ChannelCategory;
  channels: Channel[];
};

const safetyNotice =
  "Keine automatische Sendefunktion. Antworten werden vorbereitet und manuell geprüft.";
const demoNotice =
  "Dieser Demo-Workspace ist öffentlich. Echte Kanalverbindungen und externe Tests sind deaktiviert.";

const makeInput = (
  key: string,
  name: string,
  purpose: ChannelPurpose,
  description: string,
  technology = "Roadmap-Eingang vorbereitet",
  live = false,
): ChannelInput => ({
  key,
  name,
  description,
  status: live
    ? "Live / manuell nutzbar"
    : "Coming Soon / geplant / vorbereitet",
  purpose,
  technology,
  live,
});

const makeChannel = (
  group: ChannelCategory,
  key: string,
  name: string,
  purpose: ChannelPurpose,
  description: string,
  technology = "Roadmap-Eingang vorbereitet",
  inputs?: ChannelInput[],
): Channel => {
  const channelInputs = inputs ?? [
    makeInput(key, name, purpose, description, technology),
  ];
  const live = channelInputs.every((input) => input.live);

  return {
    key,
    logoKey: key,
    name,
    category: group,
    description,
    status: live
      ? "Live / manuell nutzbar"
      : "Coming Soon / geplant / vorbereitet",
    purpose,
    technology,
    live,
    inputs: channelInputs,
  };
};

const channelGroups: ChannelGroup[] = [
  {
    id: "global",
    label: "Globale Hauptkanäle",
    channels: [
      makeChannel(
        "Globale Hauptkanäle",
        "instagram",
        "Instagram",
        "Inbox",
        "DMs und Kommentare werden als getrennte spätere Verbindungen vorbereitet.",
        "2 vorbereitete Eingänge",
        [
          makeInput(
            "instagram-messages",
            "Nachrichten / DM",
            "Nachrichten",
            "DM-Inbox als vorbereiteter Eingang.",
          ),
          makeInput(
            "instagram-comments",
            "Kommentare",
            "Kommentare",
            "Kommentar-Moderation als geplanter Eingang.",
          ),
        ],
      ),
      makeChannel(
        "Globale Hauptkanäle",
        "tiktok",
        "TikTok",
        "Inbox",
        "Nachrichten und Kommentare bleiben getrennte Roadmap-Verbindungen.",
        "2 vorbereitete Eingänge",
        [
          makeInput(
            "tiktok-messages",
            "Nachrichten",
            "Nachrichten",
            "TikTok-DMs für spätere Inbox-Bündelung.",
          ),
          makeInput(
            "tiktok-comments",
            "Kommentare",
            "Kommentare",
            "Kommentar-Signale für spätere Prüfung.",
          ),
        ],
      ),
      makeChannel(
        "Globale Hauptkanäle",
        "youtube",
        "YouTube",
        "Community",
        "Kommentare und Live-Chat sind getrennt sichtbar, aber unter YouTube gebündelt.",
        "2 vorbereitete Eingänge",
        [
          makeInput(
            "youtube-comments",
            "Kommentare",
            "Kommentare",
            "Kommentar-Eingang für Kanalfeedback.",
          ),
          makeInput(
            "youtube-live-chat",
            "Live-Chat",
            "Community",
            "Live-Chat-Auswertung ist geplant.",
          ),
        ],
      ),
      makeChannel(
        "Globale Hauptkanäle",
        "facebook",
        "Facebook",
        "Inbox",
        "Messenger und Page-Kommentare bleiben getrennte vorbereitete Verbindungen.",
        "2 vorbereitete Eingänge",
        [
          makeInput(
            "facebook-messages",
            "Nachrichten",
            "Nachrichten",
            "Messenger-Inbox bleibt bis zur produktiven Freigabe geplant.",
          ),
          makeInput(
            "facebook-comments",
            "Kommentare",
            "Kommentare",
            "Page-Kommentare bleiben bis zur produktiven Freigabe geplant.",
          ),
        ],
      ),
      makeChannel(
        "Globale Hauptkanäle",
        "whatsapp",
        "WhatsApp",
        "Nachrichten",
        "WhatsApp Business Inbox als Roadmap-Kanal.",
        "1 vorbereiteter Eingang",
        [
          makeInput(
            "whatsapp-messages",
            "Nachrichten",
            "Nachrichten",
            "WhatsApp Business Inbox als Roadmap-Kanal.",
          ),
        ],
      ),
      makeChannel(
        "Globale Hauptkanäle",
        "telegram",
        "Telegram",
        "Inbox",
        "Telegram bleibt Coming Soon, solange kein produktiver Kanal aktiv ist.",
        "Bot-/Account-Struktur vorbereitet",
        [
          makeInput(
            "telegram-inbox",
            "Telegram",
            "Inbox",
            "Bot- oder Account-Struktur ist vorbereitet, aber nicht produktiv verbunden.",
            "Bot-/Account-Struktur vorbereitet",
          ),
        ],
      ),
      makeChannel(
        "Globale Hauptkanäle",
        "snapchat",
        "Snapchat",
        "Nachrichten",
        "Snapchat-Inbox ist vorgemerkt.",
      ),
      makeChannel(
        "Globale Hauptkanäle",
        "linkedin",
        "LinkedIn",
        "Inbox",
        "LinkedIn-Nachrichten und Kommentare werden getrennt geplant.",
        "2 vorbereitete Eingänge",
        [
          makeInput(
            "linkedin-messages",
            "Nachrichten",
            "Nachrichten",
            "LinkedIn-Nachrichten als späterer Inbox-Eingang.",
          ),
          makeInput(
            "linkedin-comments",
            "Kommentare",
            "Kommentare",
            "LinkedIn-Kommentare als späterer Moderations-Eingang.",
          ),
        ],
      ),
      makeChannel(
        "Globale Hauptkanäle",
        "discord",
        "Discord",
        "Community",
        "Discord Server / Channel Inbox als geplanter Community-Eingang.",
      ),
      makeChannel(
        "Globale Hauptkanäle",
        "twitter",
        "X / Twitter",
        "Inbox",
        "DMs, Mentions und Antworten als geplanter Eingang.",
      ),
      makeChannel(
        "Globale Hauptkanäle",
        "threads",
        "Threads",
        "Kommentare",
        "Threads-Kommentare und Antworten sind vorgemerkt.",
      ),
      makeChannel(
        "Globale Hauptkanäle",
        "reddit",
        "Reddit",
        "Community",
        "Reddit-Konversationen als geplanter Community-Eingang.",
      ),
      makeChannel(
        "Globale Hauptkanäle",
        "email",
        "E-Mail",
        "Inbox",
        "Starter: 1 E-Mail-Inbox. Growth: bis zu 3. Agency: bis zu 10.",
        "Inbox-Kontingente vorbereitet",
        [
          makeInput(
            "email-inbox",
            "E-Mail-Inbox",
            "Inbox",
            "Starter: 1 E-Mail-Inbox · Growth: bis zu 3 · Agency: bis zu 10.",
            "1 / 3 / 10 Inboxes vorbereitet",
          ),
        ],
      ),
      makeChannel(
        "Globale Hauptkanäle",
        "website-chat",
        "Website-Chat",
        "Nachrichten",
        "Website-Chat als späterer Inbox-Kanal.",
      ),
      makeChannel(
        "Globale Hauptkanäle",
        "webform",
        "Webformular",
        "Inbox",
        "Formular-Eingang für Leads und Support-Anfragen.",
      ),
      makeChannel(
        "Globale Hauptkanäle",
        "manual",
        "Manuell / CSV",
        "Inbox",
        "Manuelle Erfassung und CSV-Import sind live nutzbar.",
        "Manuelle Kontakte · Notizen · CSV",
        [
          makeInput(
            "manual-csv",
            "Manuell / CSV",
            "Inbox",
            "Manuelle Erfassung und CSV-Import sind live nutzbar.",
            "Manuelle Kontakte · Notizen · CSV",
            true,
          ),
        ],
      ),
    ],
  },
  {
    id: "creator",
    label: "Creator & Community",
    channels: [
      makeChannel(
        "Creator & Community",
        "twitch",
        "Twitch",
        "Community",
        "Streams, Chat und Community-Signale.",
      ),
      makeChannel(
        "Creator & Community",
        "pinterest",
        "Pinterest",
        "Kommentare",
        "Pins und Kommentare als geplanter Eingang.",
      ),
      makeChannel(
        "Creator & Community",
        "patreon",
        "Patreon / Memberships",
        "Community",
        "Membership-Nachrichten und Support-Kontext.",
      ),
      makeChannel(
        "Creator & Community",
        "ko-fi",
        "Ko-fi",
        "Community",
        "Supporter-Nachrichten und Membership-Signale.",
      ),
      makeChannel(
        "Creator & Community",
        "buy-me-a-coffee",
        "Buy Me a Coffee",
        "Community",
        "Supporter-Nachrichten als Roadmap-Kanal.",
      ),
      makeChannel(
        "Creator & Community",
        "substack",
        "Newsletter / Substack",
        "Inbox",
        "Newsletter-Antworten und Community-Kontext.",
      ),
      makeChannel(
        "Creator & Community",
        "youtube-live-chat",
        "YouTube Live-Chat",
        "Community",
        "Live-Chat-Auswertung für Creator.",
      ),
      makeChannel(
        "Creator & Community",
        "discord-server",
        "Discord Server",
        "Community",
        "Server-Community und Channel-Nachrichten.",
      ),
      makeChannel(
        "Creator & Community",
        "reddit-communities",
        "Reddit Communities",
        "Community",
        "Subreddit-Konversationen und Kommentare.",
      ),
    ],
  },
  {
    id: "business",
    label: "Business & Reviews",
    channels: [
      "Google Business Profile",
      "Google Reviews",
      "Reviews / Bewertungen",
      "Trustpilot",
      "App Store Reviews",
      "Play Store Reviews",
      "Shopify",
      "Amazon",
      "Etsy",
      "Mercado Libre",
    ].map((name) =>
      makeChannel(
        "Business & Reviews",
        name,
        name,
        "Reviews",
        "Review-, Shop- oder Business-Feedback als geplanter Eingang.",
      ),
    ),
  },
  {
    id: "international",
    label: "Internationale Märkte",
    channels: [
      "WeChat",
      "Douyin",
      "Xiaohongshu / RedNote",
      "Weibo",
      "Kuaishou",
      "Bilibili",
      "QQ",
      "LINE",
      "KakaoTalk",
      "Viber",
      "ShareChat",
      "Moj",
      "Josh",
    ].map((name) =>
      makeChannel(
        "Internationale Märkte",
        name,
        name,
        "Community",
        "Internationaler Marktkanal als langfristige Roadmap-Vorbereitung.",
      ),
    ),
  },
];
function BodyPortal({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;

  return createPortal(children, document.body);
}

export function ChannelsGrid({
  demoConnectionsDisabled = false,
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
  demoConnectionsDisabled?: boolean;
}) {
  const [activeGroupId, setActiveGroupId] = useState(channelGroups[0].id);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [notice, setNotice] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const activeGroup =
    channelGroups.find((group) => group.id === activeGroupId) ??
    channelGroups[0];

  useEffect(() => {
    if (!activeChannel) return;

    modalBodyRef.current?.scrollTo({ top: 0, left: 0 });
    modalRef.current?.focus({ preventScroll: true });

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
    setActiveChannel(channel);
  };

  return (
    <section className={styles.gridSection} aria-label="Kanalkarten">
      {demoConnectionsDisabled ? (
        <p className={styles.modalNotice} role="status">
          {demoNotice}
        </p>
      ) : null}

      <div className={styles.tabs} role="tablist" aria-label="Kanalgruppen">
        {channelGroups.map((group) => {
          const active = group.id === activeGroup.id;

          return (
            <button
              key={group.id}
              type="button"
              className={`${styles.tabButton} ${active ? styles.tabButtonActive : ""}`}
              role="tab"
              aria-selected={active}
              aria-controls="channel-tab-panel"
              id={`channel-tab-${group.id}`}
              onClick={() => setActiveGroupId(group.id)}
            >
              <span>{group.label}</span>
              <span className={styles.tabCount}>{group.channels.length}</span>
            </button>
          );
        })}
      </div>

      <div
        id="channel-tab-panel"
        role="tabpanel"
        aria-labelledby={`channel-tab-${activeGroup.id}`}
        className={styles.channelGrid}
      >
        {activeGroup.channels.map((channel) => (
          <article className={styles.channelCard} key={channel.key}>
            <button
              type="button"
              className={styles.cardButton}
              onClick={() => openModal(channel)}
            >
              <div className={styles.cardTopline}>
                <div className={styles.identityGroup}>
                  <PlatformLogo
                    className={styles.logoTile}
                    platform={channel.logoKey}
                    size="md"
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
                  className={`${styles.statusBadge} ${
                    channel.live ? styles.statusConnected : styles.statusPreview
                  }`}
                >
                  {channel.live ? (
                    <span className={styles.signalDot} aria-hidden="true" />
                  ) : null}
                  {channel.status}
                </span>
                <span className={styles.techBadge}>{channel.technology}</span>
              </span>

              <span className={styles.cardSummary}>
                <span className={styles.inputCountBadge}>
                  {channel.inputs.length === 1
                    ? "1 Eingang vorbereitet"
                    : `${channel.inputs.length} Eingänge vorbereitet`}
                </span>
                <span className={styles.inputTypeHint}>
                  {channel.inputs.map((input) => input.purpose).join(" · ")}
                </span>
              </span>

              <span className={styles.cardSpacer} />
              <span className={styles.cardActions}>
                <span className={styles.primaryCardAction}>Details</span>
              </span>
              {!channel.live ? (
                <ComingSoonMark
                  className={styles.soonCornerBadge}
                  size="overlay"
                />
              ) : null}
            </button>
          </article>
        ))}
      </div>

      {activeChannel ? (
        <BodyPortal>
          <div
            className={styles.modalBackdrop}
            role="presentation"
            onMouseDown={() => setActiveChannel(null)}
          >
            <div
              ref={modalRef}
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="channel-modal-title"
              tabIndex={-1}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <PlatformLogo
                  className={styles.modalLogo}
                  platform={activeChannel.logoKey}
                  size="lg"
                />
                <div>
                  <p className={styles.modalEyebrow}>Kanal-Roadmap</p>
                  <h2 id="channel-modal-title">{activeChannel.name}</h2>
                  <div className={styles.metaRow}>
                    {!activeChannel.live ? (
                      <ComingSoonMark
                        className={styles.soonBadgeImage}
                        size="small"
                        alt="Coming Soon / geplant / vorbereitet"
                      />
                    ) : (
                      <span
                        className={`${styles.statusBadge} ${styles.statusConnected}`}
                      >
                        {activeChannel.status}
                      </span>
                    )}
                    <span className={styles.techBadge}>
                      {activeChannel.category}
                    </span>
                  </div>
                </div>
              </div>

              <div ref={modalBodyRef} className={styles.modalBody}>
                <p className={styles.modalText}>{activeChannel.description}</p>
                <div className={styles.modalDetailGrid}>
                  <div className={styles.releaseBox}>
                    <strong>Details</strong>
                    <ul className={styles.compactStatusList}>
                      <li>Kanalname: {activeChannel.name}</li>
                      <li>Kategorie: {activeChannel.category}</li>
                      <li>Status: {activeChannel.status}</li>
                      <li>Zweck: {activeChannel.purpose}</li>
                      <li>
                        Verbindungen: {activeChannel.inputs.length} getrennte
                        Eingänge
                      </li>
                      <li>Keine OAuth-, Connect- oder Sync-Aktion</li>
                      <li>Externe Kanalaktionen bleiben deaktiviert</li>
                    </ul>
                  </div>

                  <div
                    className={`${styles.releaseBox} ${styles.fullWidthBlock}`}
                  >
                    <strong>Geplante Verbindungsblöcke</strong>
                    <div className={styles.connectionGrid}>
                      {activeChannel.inputs.map((input) => (
                        <article
                          className={styles.connectionCard}
                          key={input.key}
                        >
                          <div className={styles.connectionCardHeader}>
                            <strong>
                              {activeChannel.name} {input.name}
                            </strong>
                            <span
                              className={`${styles.statusBadge} ${
                                input.live
                                  ? styles.statusConnected
                                  : styles.statusPreview
                              }`}
                            >
                              {input.live ? "Live / manuell" : input.status}
                            </span>
                          </div>
                          <p>{input.description}</p>
                          <div className={styles.inputMeta}>
                            <span>{input.purpose}</span>
                            <span>{input.technology}</span>
                          </div>
                          <span className={styles.connectionHint}>
                            Separat verbindbar, sobald freigegeben.
                          </span>
                          <div className={styles.connectionCardActions}>
                            <button
                              type="button"
                              disabled={demoConnectionsDisabled}
                              onClick={() =>
                                setNotice(
                                  demoConnectionsDisabled
                                    ? demoNotice
                                    : `${activeChannel.name} ${input.name} wurde lokal vorgemerkt. Es wurde keine API-Aktion gestartet.`,
                                )
                              }
                            >
                              {demoConnectionsDisabled
                                ? "Im Demo-Modus deaktiviert"
                                : input.live
                                  ? "Details vormerken"
                                  : "Verbindung vormerken"}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                  <div className={styles.releaseBox}>
                    <strong>Sicherheit</strong>
                    <ul>
                      <li>{safetyNotice}</li>
                      {demoConnectionsDisabled ? <li>{demoNotice}</li> : null}
                      <li>
                        Kein Scraping, kein automatisches Senden, kein Payment.
                      </li>
                    </ul>
                  </div>
                </div>
                {notice ? (
                  <p className={styles.modalNotice} role="status">
                    {notice}
                  </p>
                ) : null}
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.secondaryModalButton}
                    disabled={demoConnectionsDisabled}
                    onClick={() =>
                      setNotice(
                        demoConnectionsDisabled
                          ? demoNotice
                          : `${activeChannel.name} wurde lokal vorgemerkt. Es wurde keine API-Aktion gestartet.`,
                      )
                    }
                  >
                    {demoConnectionsDisabled
                      ? "Demo-Modus aktiv"
                      : "Details vormerken"}
                  </button>
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
          </div>
        </BodyPortal>
      ) : null}
    </section>
  );
}
