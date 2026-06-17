export type PreparedSourceType =
  | "facebook_messages"
  | "facebook_comments"
  | "instagram_messages"
  | "instagram_comments"
  | "whatsapp_messages"
  | "tiktok_comments"
  | "tiktok_messages"
  | "email"
  | "webform"
  | "manual";

export type SourceInteractionType = "message" | "comment" | "note";
export type SourceStatus = "live" | "prepared" | "parked" | "import_only" | "manual";
export type SourcePlatform = "facebook" | "instagram" | "whatsapp" | "tiktok" | "email" | "webform" | "manual";

export type ChannelSourceConfig = {
  sourceType: PreparedSourceType;
  source_platform: SourcePlatform;
  source_type: PreparedSourceType;
  label: string;
  platformName: "Facebook" | "Instagram" | "WhatsApp" | "TikTok" | "E-Mail" | "Webformular" | "Manuell";
  platformKey: SourcePlatform;
  interactionType: SourceInteractionType;
  inboundSupported: boolean;
  outboundSupported: boolean;
  mediaSupported: boolean;
  historySyncSupported: boolean;
  liveWebhookSupported: boolean;
  manualFallbackSupported: boolean;
  defaultSyncLimit: number | null;
  status: SourceStatus;
  statusText: string;
  statusHint: string;
  actionLabel: "Chat öffnen" | "Kommentar öffnen" | "Beitrag öffnen" | "Original öffnen" | "Notiz öffnen";
  fallbackText: "Original-Link noch nicht verfügbar";
};

export const ORIGINAL_LINK_FALLBACK = "Original-Link noch nicht verfügbar" as const;

const base = {
  fallbackText: ORIGINAL_LINK_FALLBACK,
  manualFallbackSupported: true,
  defaultSyncLimit: null,
} as const;

export const CHANNEL_SOURCE_CONFIGS: Record<PreparedSourceType, ChannelSourceConfig> = {
  facebook_messages: {
    ...base, sourceType: "facebook_messages", source_platform: "facebook", source_type: "facebook_messages", label: "Facebook Nachrichten", platformName: "Facebook", platformKey: "facebook", interactionType: "message", actionLabel: "Chat öffnen", status: "live", inboundSupported: true, outboundSupported: true, mediaSupported: true, historySyncSupported: true, liveWebhookSupported: true, defaultSyncLimit: 50, statusText: "Live verbunden, wenn Page/OAuth eingerichtet ist · kein automatisches Senden", statusHint: "Messenger-DMs laufen über den Meta/OAuth-Intake. Verlauf-Sync importiert inbound/outbound bis 50 Nachrichten je Conversation. Kein automatisches Senden.",
  },
  facebook_comments: {
    ...base, sourceType: "facebook_comments", source_platform: "facebook", source_type: "facebook_comments", label: "Facebook Kommentare", platformName: "Facebook", platformKey: "facebook", interactionType: "comment", actionLabel: "Kommentar öffnen", status: "parked", inboundSupported: false, outboundSupported: false, mediaSupported: false, historySyncSupported: false, liveWebhookSupported: false, statusText: "Geparkt/vorbereitet · Live-Test später", statusHint: "Geparkt/vorbereitet: kein Live-Test in diesem PR, keine automatische Antwort.",
  },
  instagram_messages: {
    ...base, sourceType: "instagram_messages", source_platform: "instagram", source_type: "instagram_messages", label: "Instagram Nachrichten", platformName: "Instagram", platformKey: "instagram", interactionType: "message", actionLabel: "Chat öffnen", status: "prepared", inboundSupported: false, outboundSupported: false, mediaSupported: true, historySyncSupported: false, liveWebhookSupported: false, statusText: "Vorbereitet · API-/Freigabe erforderlich", statusHint: "Als Meta-Nachrichtenkanal vorbereitet; Live-Events später gesammelt testen.",
  },
  instagram_comments: {
    ...base, sourceType: "instagram_comments", source_platform: "instagram", source_type: "instagram_comments", label: "Instagram Kommentare", platformName: "Instagram", platformKey: "instagram", interactionType: "comment", actionLabel: "Kommentar öffnen", status: "prepared", inboundSupported: false, outboundSupported: false, mediaSupported: true, historySyncSupported: false, liveWebhookSupported: false, statusText: "Vorbereitet · API-/Freigabe erforderlich", statusHint: "Als Meta-Kommentarkanal vorbereitet; kein automatisches Antworten.",
  },
  whatsapp_messages: {
    ...base, sourceType: "whatsapp_messages", source_platform: "whatsapp", source_type: "whatsapp_messages", label: "WhatsApp Nachrichten", platformName: "WhatsApp", platformKey: "whatsapp", interactionType: "message", actionLabel: "Chat öffnen", status: "prepared", inboundSupported: false, outboundSupported: false, mediaSupported: true, historySyncSupported: false, liveWebhookSupported: false, statusText: "Vorbereitet · Cloud-API-Konfiguration erforderlich", statusHint: "Cloud-API-Payloads sind vorbereitet; keine Tokens im Frontend und kein automatisches Senden.",
  },
  tiktok_comments: {
    ...base, sourceType: "tiktok_comments", source_platform: "tiktok", source_type: "tiktok_comments", label: "TikTok Kommentare", platformName: "TikTok", platformKey: "tiktok", interactionType: "comment", actionLabel: "Kommentar öffnen", status: "prepared", inboundSupported: false, outboundSupported: false, mediaSupported: true, historySyncSupported: false, liveWebhookSupported: false, statusText: "Vorbereitet · offizielle Freigabe erforderlich", statusHint: "Kommentare sind vorbereitet; Live-Zugriff erst mit offizieller Freigabe. Kein Scraping.",
  },
  tiktok_messages: {
    ...base, sourceType: "tiktok_messages", source_platform: "tiktok", source_type: "tiktok_messages", label: "TikTok Nachrichten", platformName: "TikTok", platformKey: "tiktok", interactionType: "message", actionLabel: "Chat öffnen", status: "import_only", inboundSupported: false, outboundSupported: false, mediaSupported: true, historySyncSupported: false, liveWebhookSupported: false, statusText: "Nicht-live · Export/Data-Portability vorbereitet", statusHint: "Nicht-live: nur Export-/Data-Portability-Importpfad. Kein Scraping, keine inoffizielle API.",
  },
  email: {
    ...base, sourceType: "email", source_platform: "email", source_type: "email", label: "E-Mail / Postfach", platformName: "E-Mail", platformKey: "email", interactionType: "message", actionLabel: "Original öffnen", status: "prepared", inboundSupported: false, outboundSupported: false, mediaSupported: true, historySyncSupported: false, liveWebhookSupported: false, statusText: "Vorbereitet · Postfach-Anbindung später", statusHint: "E-Mail ist als Nachrichtenquelle vorbereitet; keine automatische Sendefunktion in FanMind.",
  },
  webform: {
    ...base, sourceType: "webform", source_platform: "webform", source_type: "webform", label: "Webformular / Website-Lead", platformName: "Webformular", platformKey: "webform", interactionType: "message", actionLabel: "Original öffnen", status: "prepared", inboundSupported: false, outboundSupported: false, mediaSupported: false, historySyncSupported: false, liveWebhookSupported: false, statusText: "Vorbereitet · Formular-Webhook später", statusHint: "Webformular-Leads sind als Inbound-Quelle vorbereitet; keine Fake-Live-Synchronisation.",
  },
  manual: {
    ...base, sourceType: "manual", source_platform: "manual", source_type: "manual", label: "Manueller Eingang / Notiz", platformName: "Manuell", platformKey: "manual", interactionType: "note", actionLabel: "Notiz öffnen", status: "manual", inboundSupported: true, outboundSupported: false, mediaSupported: false, historySyncSupported: false, liveWebhookSupported: false, statusText: "Manuell nutzbar · kein Live-Sync", statusHint: "Manuelle Notizen bleiben manuell und werden nicht als Live-Kanal ausgegeben.",
  },
};

export function isPreparedSourceType(value: string | null | undefined): value is PreparedSourceType {
  return Boolean(value && value.toLowerCase() in CHANNEL_SOURCE_CONFIGS);
}
export function getChannelSourceConfig(value: string | null | undefined): ChannelSourceConfig | undefined {
  const key = value?.toLowerCase();
  return isPreparedSourceType(key) ? CHANNEL_SOURCE_CONFIGS[key] : undefined;
}
export function getChannelSourceLabel(value: string | null | undefined, fallback = "Manuell"): string {
  return getChannelSourceConfig(value)?.label ?? fallback;
}
export function getChannelSourceActionLabel(value: string | null | undefined, hasValidUrl: boolean): string {
  if (!hasValidUrl) return ORIGINAL_LINK_FALLBACK;
  return getChannelSourceConfig(value)?.actionLabel ?? "Original öffnen";
}
export function getChannelSourceInteractionType(value: string | null | undefined): SourceInteractionType | undefined {
  return getChannelSourceConfig(value)?.interactionType;
}
export function isValidHttpUrl(value: string | null | undefined): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}
export function normalizeHttpUrl(value: string | null | undefined): string | undefined {
  return isValidHttpUrl(value) ? value.trim() : undefined;
}
