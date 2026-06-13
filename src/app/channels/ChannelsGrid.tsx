"use client";

import { useState } from "react";
import styles from "./channels.module.css";

type ChannelStatus =
  | "Verbunden"
  | "Verfügbar"
  | "In Arbeit"
  | "Vorschau"
  | "Coming Soon";

type Channel = {
  key: string;
  initials: string;
  name: string;
  description: string;
  status: ChannelStatus;
  technology: string;
  buttonLabel: string;
  signal?: boolean;
  intakeTypes: string;
};

const channels: Channel[] = [
  { key: "instagram", initials: "IG", name: "Instagram", description: "Direktnachrichten und Anfragen importieren", status: "In Arbeit", technology: "OAuth · Webhook", buttonLabel: "Vorschau", intakeTypes: "DMs · Anfragen", signal: true },
  { key: "tiktok", initials: "TT", name: "TikTok", description: "Direktnachrichten und Kommentare abrufen", status: "In Arbeit", technology: "OAuth · Webhook", buttonLabel: "Vorschau", intakeTypes: "DMs · Kommentare", signal: true },
  { key: "facebook", initials: "FB", name: "Facebook", description: "Kommentare und Nachrichten importieren", status: "Coming Soon", technology: "Graph API", buttonLabel: "Benachrichtigen", intakeTypes: "Kommentare · Nachrichten" },
  { key: "twitter", initials: "X", name: "X / Twitter", description: "Mentions und Direktnachrichten empfangen", status: "Coming Soon", technology: "API v2", buttonLabel: "Benachrichtigen", intakeTypes: "Mentions · DMs" },
  { key: "whatsapp", initials: "WA", name: "WhatsApp", description: "Nachrichten empfangen und importieren", status: "In Arbeit", technology: "Cloud API · Webhook", buttonLabel: "Vorschau", intakeTypes: "Nachrichten", signal: true },
  { key: "discord", initials: "DC", name: "Discord", description: "DMs und Server-Nachrichten importieren", status: "Coming Soon", technology: "Bot API · Webhook", buttonLabel: "Benachrichtigen", intakeTypes: "DMs · Server" },
  { key: "telegram", initials: "TG", name: "Telegram", description: "Nachrichten und Gruppen-Eingänge abrufen", status: "Coming Soon", technology: "Bot API · Webhook", buttonLabel: "Benachrichtigen", intakeTypes: "Nachrichten · Gruppen" },
  { key: "youtube", initials: "YT", name: "YouTube", description: "Kommentare und Live-Chat-Nachrichten importieren", status: "Coming Soon", technology: "YouTube API", buttonLabel: "Benachrichtigen", intakeTypes: "Kommentare · Live-Chat" },
  { key: "twitch", initials: "TW", name: "Twitch", description: "Chat-Nachrichten und Whispers importieren", status: "Coming Soon", technology: "EventSub · API", buttonLabel: "Benachrichtigen", intakeTypes: "Chat · Whispers" },
  { key: "onlyfans", initials: "OF", name: "OnlyFans", description: "Nachrichten und Sub-Anfragen importieren", status: "Vorschau", technology: "API (Beta)", buttonLabel: "Vorschau", intakeTypes: "Nachrichten · Sub-Anfragen" },
  { key: "patreon", initials: "PT", name: "Patreon", description: "Nachrichten und Support-Anfragen abrufen", status: "Vorschau", technology: "API (Beta)", buttonLabel: "Vorschau", intakeTypes: "Nachrichten · Support" },
  { key: "email", initials: "@", name: "E-Mail / Postfach", description: "E-Mails automatisch inboxen", status: "Verfügbar", technology: "IMAP · OAuth", buttonLabel: "Verbinden", intakeTypes: "E-Mails", signal: true },
  { key: "webform", initials: "WF", name: "Webformular / Website-Lead", description: "Leads und Anfragen aus Formularen empfangen", status: "Verfügbar", technology: "Webhook · Form-API", buttonLabel: "Verbinden", intakeTypes: "Leads · Anfragen", signal: true },
  { key: "shopify", initials: "SH", name: "Shopify / Shop-Bestellungen", description: "Bestellungen und Kunden-Anfragen importieren", status: "Verfügbar", technology: "API · Webhook", buttonLabel: "Verbinden", intakeTypes: "Bestellungen · Kundenfragen", signal: true },
  { key: "eventbrite", initials: "EV", name: "Eventbrite / Event-Anfragen", description: "Event-Anmeldungen und Anfragen importieren", status: "Verfügbar", technology: "API · Webhook", buttonLabel: "Verbinden", intakeTypes: "Anmeldungen · Anfragen", signal: true },
  { key: "csv", initials: "CSV", name: "CSV-Import", description: "Kontakte & Nachrichten per CSV hochladen", status: "Verbunden", technology: "CSV · Datei-Upload", buttonLabel: "Verwalten", intakeTypes: "Kontakte · Nachrichten", signal: true },
  { key: "manual", initials: "+", name: "Manueller Eingang", description: "Manuelle Kontakte & Nachrichten erfassen", status: "Verfügbar", technology: "Manuell", buttonLabel: "Öffnen", intakeTypes: "Kontakte · Notizen", signal: true },
  { key: "api", initials: "API", name: "API / Custom Connector", description: "Eigene Systeme und Plattformen anbinden", status: "Verfügbar", technology: "API · Webhook", buttonLabel: "Dokumentation", intakeTypes: "Eigene Events", signal: true },
  { key: "linkedin", initials: "IN", name: "LinkedIn", description: "Nachrichten und Lead-Kommentare vormerken", status: "Coming Soon", technology: "API · Webhook", buttonLabel: "Benachrichtigen", intakeTypes: "Nachrichten · Leads" },
  { key: "threads", initials: "TH", name: "Threads", description: "Mentions und Antworten als Eingang planen", status: "Vorschau", technology: "API (Beta)", buttonLabel: "Vorschau", intakeTypes: "Mentions · Antworten" },
  { key: "snapchat", initials: "SC", name: "Snapchat", description: "Creator-Nachrichten und Story-Antworten prüfen", status: "Coming Soon", technology: "API", buttonLabel: "Benachrichtigen", intakeTypes: "Nachrichten · Story-Antworten" },
  { key: "reddit", initials: "RD", name: "Reddit", description: "Kommentare, Modmail und Erwähnungen sammeln", status: "Coming Soon", technology: "API · Webhook", buttonLabel: "Benachrichtigen", intakeTypes: "Kommentare · Modmail" },
  { key: "pinterest", initials: "PI", name: "Pinterest", description: "Kommentare und Produkt-Anfragen aufnehmen", status: "Coming Soon", technology: "API", buttonLabel: "Benachrichtigen", intakeTypes: "Kommentare · Anfragen" },
  { key: "fediverse", initials: "BS", name: "Bluesky / Mastodon", description: "Mentions und Community-Antworten importieren", status: "Vorschau", technology: "ATProto · ActivityPub", buttonLabel: "Vorschau", intakeTypes: "Mentions · Antworten" },
  { key: "woocommerce", initials: "WC", name: "WooCommerce", description: "Shop-Anfragen und Bestellungen übernehmen", status: "Verfügbar", technology: "REST API · Webhook", buttonLabel: "Verbinden", intakeTypes: "Bestellungen · Support", signal: true },
  { key: "ticketing", initials: "TK", name: "Ticketing / Events", description: "Event-Tickets und Supportfälle zentral sammeln", status: "Coming Soon", technology: "API · Webhook", buttonLabel: "Benachrichtigen", intakeTypes: "Tickets · Events" },
];

const statusClassName: Record<ChannelStatus, string> = {
  Verbunden: styles.statusConnected,
  Verfügbar: styles.statusAvailable,
  "In Arbeit": styles.statusProgress,
  Vorschau: styles.statusPreview,
  "Coming Soon": styles.statusSoon,
};

export function ChannelsGrid() {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  return (
    <section className={styles.gridSection} aria-labelledby="channel-grid-title">
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>Social Sync Center</p>
          <h2 id="channel-grid-title">Plattformen & Eingänge</h2>
        </div>
        <p>Verbindungen werden hier vorbereitet. Externe OAuth/API-Flows starten in diesem PR nicht.</p>
      </div>

      <div className={styles.channelGrid}>
        {channels.map((channel) => {
          const isActive = activeKey === channel.key;

          return (
            <article className={styles.channelCard} key={channel.key}>
              <div className={styles.cardTopline}>
                <div className={styles.identityGroup}>
                  <span className={styles.logoTile} aria-hidden="true">{channel.initials}</span>
                  <div>
                    <h3>{channel.name}</h3>
                    <p>{channel.description}</p>
                  </div>
                </div>
                <span className={styles.infoIcon} title="Keine automatische Sendefunktion" aria-label="Info">i</span>
              </div>

              <div className={styles.metaRow}>
                <span className={`${styles.statusBadge} ${statusClassName[channel.status]}`}>
                  {channel.signal ? <span className={styles.signalDot} aria-hidden="true" /> : null}
                  {channel.status}
                </span>
                <span className={styles.techBadge}>{channel.technology}</span>
              </div>

              <div className={styles.releaseBox} aria-label={`Nachrichtenfreigabe für ${channel.name}`}>
                <strong>Nachrichtenfreigabe</strong>
                <ul>
                  <li>Eingänge in Arbeits-Eingang übernehmen</li>
                  <li>{channel.intakeTypes} je nach Kanal</li>
                  <li>Manuelle Prüfung vor Antwort</li>
                  <li>Automatisches Senden: deaktiviert</li>
                </ul>
              </div>

              {isActive ? (
                <p className={styles.inlineNotice} role="status">
                  Verbindung wird vorbereitet. Kein automatisches Senden.
                </p>
              ) : null}

              <div className={styles.cardActions}>
                <button type="button" onClick={() => setActiveKey(channel.key)}>
                  {channel.buttonLabel}
                </button>
                {channel.status === "Verbunden" ? (
                  <button type="button" className={styles.disconnectButton} onClick={() => setActiveKey(channel.key)}>
                    Trennen
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
