"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ComingSoonMark } from "@/components/ComingSoonMark";
import { PlatformLogo } from "@/components/PlatformLogo";
import styles from "./channels.module.css";
import { type TelegramWebhookStatus } from "@/lib/telegramStatus";

type ChannelStatus = "Live / manuell nutzbar" | "Coming Soon / geplant / vorbereitet";
type ChannelPurpose = "Nachrichten" | "Kommentare" | "Reviews" | "Community" | "Inbox";
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

const makeChannel = (
  group: ChannelCategory,
  key: string,
  name: string,
  purpose: ChannelPurpose,
  description: string,
  technology = "Roadmap-Eingang vorbereitet",
): Channel => ({
  key,
  logoKey: key,
  name,
  category: group,
  description,
  status: "Coming Soon / geplant / vorbereitet",
  purpose,
  technology,
  live: false,
});

const channelGroups: ChannelGroup[] = [
  {
    id: "global",
    label: "Globale Hauptkanäle",
    channels: [
      makeChannel("Globale Hauptkanäle", "instagram-messages", "Instagram Nachrichten", "Nachrichten", "DM-Inbox als vorbereiteter Eingang."),
      makeChannel("Globale Hauptkanäle", "instagram-comments", "Instagram Kommentare", "Kommentare", "Kommentar-Moderation als geplanter Eingang."),
      makeChannel("Globale Hauptkanäle", "tiktok-messages", "TikTok Nachrichten", "Nachrichten", "TikTok-DMs für spätere Inbox-Bündelung."),
      makeChannel("Globale Hauptkanäle", "tiktok-comments", "TikTok Kommentare", "Kommentare", "Kommentar-Signale für spätere Prüfung."),
      makeChannel("Globale Hauptkanäle", "youtube-comments", "YouTube Kommentare", "Kommentare", "Kommentar-Eingang für Kanalfeedback."),
      makeChannel("Globale Hauptkanäle", "youtube-live-chat", "YouTube Live-Chat", "Community", "Live-Chat-Auswertung ist geplant."),
      makeChannel("Globale Hauptkanäle", "facebook-messages", "Facebook Nachrichten", "Nachrichten", "Messenger-Inbox bleibt bis zur produktiven Freigabe geplant."),
      makeChannel("Globale Hauptkanäle", "facebook-comments", "Facebook Kommentare", "Kommentare", "Page-Kommentare bleiben bis zur produktiven Freigabe geplant."),
      makeChannel("Globale Hauptkanäle", "whatsapp", "WhatsApp Nachrichten", "Nachrichten", "WhatsApp Business Inbox als Roadmap-Kanal."),
      makeChannel("Globale Hauptkanäle", "telegram", "Telegram", "Inbox", "Telegram bleibt Coming Soon, solange kein produktiver Kanal aktiv ist."),
      makeChannel("Globale Hauptkanäle", "snapchat", "Snapchat", "Nachrichten", "Snapchat-Inbox ist vorgemerkt."),
      makeChannel("Globale Hauptkanäle", "linkedin", "LinkedIn Nachrichten / Kommentare", "Inbox", "LinkedIn Inbox und Kommentare als kombinierte Roadmap-Karte."),
      makeChannel("Globale Hauptkanäle", "discord", "Discord", "Community", "Discord Server / Channel Inbox als geplanter Community-Eingang."),
      makeChannel("Globale Hauptkanäle", "twitter", "X / Twitter", "Inbox", "DMs, Mentions und Antworten als geplanter Eingang."),
      makeChannel("Globale Hauptkanäle", "threads", "Threads", "Kommentare", "Threads-Kommentare und Antworten sind vorgemerkt."),
      makeChannel("Globale Hauptkanäle", "reddit", "Reddit", "Community", "Reddit-Konversationen als geplanter Community-Eingang."),
      makeChannel("Globale Hauptkanäle", "email", "E-Mail", "Inbox", "Starter: 1 E-Mail-Inbox vorbereitet. Growth: bis zu 3. Agency: bis zu 10.", "Inbox-Kontingente vorbereitet"),
      makeChannel("Globale Hauptkanäle", "website-chat", "Website-Chat", "Nachrichten", "Website-Chat als späterer Inbox-Kanal."),
      makeChannel("Globale Hauptkanäle", "webform", "Webformular", "Inbox", "Formular-Eingang für Leads und Support-Anfragen."),
      {
        key: "manual",
        logoKey: "manual",
        name: "Manuell / CSV",
        category: "Globale Hauptkanäle",
        description: "Manuelle Erfassung und CSV-Import sind live nutzbar.",
        status: "Live / manuell nutzbar",
        purpose: "Inbox",
        technology: "Manuelle Kontakte · Notizen · CSV",
        live: true,
      },
    ],
  },
  {
    id: "creator",
    label: "Creator & Community",
    channels: [
      makeChannel("Creator & Community", "twitch", "Twitch", "Community", "Streams, Chat und Community-Signale."),
      makeChannel("Creator & Community", "pinterest", "Pinterest", "Kommentare", "Pins und Kommentare als geplanter Eingang."),
      makeChannel("Creator & Community", "patreon", "Patreon / Memberships", "Community", "Membership-Nachrichten und Support-Kontext."),
      makeChannel("Creator & Community", "ko-fi", "Ko-fi", "Community", "Supporter-Nachrichten und Membership-Signale."),
      makeChannel("Creator & Community", "buy-me-a-coffee", "Buy Me a Coffee", "Community", "Supporter-Nachrichten als Roadmap-Kanal."),
      makeChannel("Creator & Community", "substack", "Newsletter / Substack", "Inbox", "Newsletter-Antworten und Community-Kontext."),
      makeChannel("Creator & Community", "youtube-live-chat", "YouTube Live-Chat", "Community", "Live-Chat-Auswertung für Creator."),
      makeChannel("Creator & Community", "discord-server", "Discord Server", "Community", "Server-Community und Channel-Nachrichten."),
      makeChannel("Creator & Community", "reddit-communities", "Reddit Communities", "Community", "Subreddit-Konversationen und Kommentare."),
    ],
  },
  {
    id: "business",
    label: "Business & Reviews",
    channels: ["Google Business Profile", "Google Reviews", "Reviews / Bewertungen", "Trustpilot", "App Store Reviews", "Play Store Reviews", "Shopify", "Amazon", "Etsy", "Mercado Libre"].map((name) =>
      makeChannel("Business & Reviews", name, name, "Reviews", "Review-, Shop- oder Business-Feedback als geplanter Eingang."),
    ),
  },
  {
    id: "international",
    label: "Internationale Märkte",
    channels: ["WeChat", "Douyin", "Xiaohongshu / RedNote", "Weibo", "Kuaishou", "Bilibili", "QQ", "LINE", "KakaoTalk", "Viber", "ShareChat", "Moj", "Josh"].map((name) =>
      makeChannel("Internationale Märkte", name, name, "Community", "Internationaler Marktkanal als langfristige Roadmap-Vorbereitung."),
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
    channelGroups.find((group) => group.id === activeGroupId) ?? channelGroups[0];

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

              <span className={styles.cardSpacer} />
              <span className={styles.cardActions}>
                <span className={styles.primaryCardAction}>Details</span>
              </span>
              {!channel.live ? (
                <ComingSoonMark className={styles.soonCornerBadge} size="overlay" />
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
                      <span className={`${styles.statusBadge} ${styles.statusConnected}`}>
                        {activeChannel.status}
                      </span>
                    )}
                    <span className={styles.techBadge}>{activeChannel.category}</span>
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
                      <li>Keine OAuth-, Connect- oder Sync-Aktion</li>
                      <li>Externe Kanalaktionen bleiben deaktiviert</li>
                    </ul>
                  </div>
                  <div className={styles.releaseBox}>
                    <strong>Sicherheit</strong>
                    <ul>
                      <li>{safetyNotice}</li>
                      {demoConnectionsDisabled ? <li>{demoNotice}</li> : null}
                      <li>Kein Scraping, kein automatisches Senden, kein Payment.</li>
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
                    onClick={() =>
                      setNotice(
                        `${activeChannel.name} wurde lokal vorgemerkt. Es wurde keine API-Aktion gestartet.`,
                      )
                    }
                  >
                    Verbindung vormerken
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
