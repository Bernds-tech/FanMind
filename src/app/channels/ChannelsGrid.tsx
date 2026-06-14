"use client";

import { useEffect, useState } from "react";
import styles from "./channels.module.css";

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
    key: "facebook",
    name: "Facebook",
    description: "Kommentare und Nachrichten importieren",
    status: "Verfügbar",
    technology: "Graph API · OAuth",
    intakeTypes: "Kommentare · Nachrichten",
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
}: {
  facebookConnection: FacebookConnection | null;
  facebookError?: boolean;
}) {
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [notice, setNotice] = useState("");
  const [facebookErrorCode, setFacebookErrorCode] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!facebookError) return;
    const params = new URLSearchParams(window.location.search);
    setFacebookErrorCode(params.get("facebook_error"));
  }, [facebookError]);

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
    setActiveChannel(channel);
  };

  const activeDisplayStatus =
    activeChannel?.key === "facebook" && facebookConnection
      ? "Verbunden"
      : activeChannel?.status;

  return (
    <section className={styles.gridSection} aria-label="Kanalkarten">
      <div className={styles.channelGrid}>
        {channels.map((channel) => {
          const isFacebook = channel.key === "facebook";
          const displayStatus =
            isFacebook && facebookConnection ? "Verbunden" : channel.status;
          const pageName = isFacebook ? facebookConnection?.page_name : null;

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
                  {displayStatus === "Coming Soon" ? (
                    <img
                      className={styles.soonBadgeImage}
                      src="/assets/coming-soon-badge.png"
                      alt="Verbindung in Vorbereitung"
                    />
                  ) : (
                    <span
                      className={`${styles.statusBadge} ${statusClassName[displayStatus]}`}
                    >
                      {channel.signal ? (
                        <span className={styles.signalDot} aria-hidden="true" />
                      ) : null}
                      {displayStatus}
                    </span>
                  )}
                  <span className={styles.techBadge}>{channel.technology}</span>
                </span>

                <span className={styles.cardSpacer} />
                <span className={styles.cardActions}>
                  <span className={styles.primaryCardAction}>
                    {isFacebook
                      ? facebookConnection
                        ? "Verwalten"
                        : "Facebook verbinden"
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
              {activeChannel.key === "facebook" && facebookConnection
                ? "Facebook ist verbunden. Eingänge werden in FanMind übernommen. Antworten werden manuell im Originalkanal gesendet."
                : "Melde dich an, um diesen Kanal zu verbinden und eingehende Nachrichten für FanMind freizugeben."}
            </p>
            {activeChannel.key === "facebook" && facebookConnection ? (
              <p className={styles.modalNotice}>
                Verbundene Page:{" "}
                <strong>
                  {facebookConnection.page_name ?? facebookConnection.page_id}
                </strong>
              </p>
            ) : null}
            {activeChannel.key === "facebook" && facebookError ? (
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
              {activeChannel.key === "facebook" ? (
                facebookConnection ? (
                  <>
                    <a className={styles.modalLinkButton} href="/channels">
                      Verwalten
                    </a>
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
                    href="/api/integrations/facebook/start"
                  >
                    Facebook verbinden
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
    return "Facebook hat keine verwaltbare Seite zurückgegeben. Bitte prüfe, ob du im Facebook-Dialog eine Seite ausgewählt hast und ob die App die Page-Berechtigungen pages_show_list, pages_read_engagement und pages_manage_metadata im Testmodus hat.";
  }

  if (errorCode === "oauth" || errorCode === "callback") {
    return "Facebook-Verbindung konnte nicht abgeschlossen werden. Bitte starte die Verbindung erneut und prüfe, ob der Facebook-Dialog vollständig bestätigt wurde.";
  }

  if (errorCode === "encryption") {
    return "Facebook-Verbindung kann nicht gespeichert werden: Verschlüsselung nicht konfiguriert. Facebook-Verbindung ist serverseitig noch nicht vollständig konfiguriert.";
  }

  return "Facebook-Verbindung konnte nicht gespeichert werden. Bitte prüfe die Facebook-Konfiguration und starte die Verbindung erneut.";
}
