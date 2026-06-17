export type PreparedSourceType =
  | "facebook_messages"
  | "facebook_comments"
  | "instagram_messages"
  | "instagram_comments"
  | "whatsapp_messages"
  | "tiktok_comments"
  | "tiktok_messages";

export type SourceInteractionType = "message" | "comment";
export type SourceStatus = "live" | "prepared" | "parked" | "import_only";

export type ChannelSourceConfig = {
  sourceType: PreparedSourceType;
  label: string;
  platformName: "Facebook" | "Instagram" | "WhatsApp" | "TikTok";
  platformKey: "facebook" | "instagram" | "whatsapp" | "tiktok";
  interactionType: SourceInteractionType;
  actionLabel: "Chat öffnen" | "Kommentar öffnen" | "Beitrag öffnen" | "Original öffnen";
  fallbackText: "Original-Link noch nicht verfügbar";
  status: SourceStatus;
  statusHint: string;
};

export const ORIGINAL_LINK_FALLBACK = "Original-Link noch nicht verfügbar" as const;

export const CHANNEL_SOURCE_CONFIGS: Record<PreparedSourceType, ChannelSourceConfig> = {
  facebook_messages: {
    sourceType: "facebook_messages",
    label: "Facebook Nachrichten",
    platformName: "Facebook",
    platformKey: "facebook",
    interactionType: "message",
    actionLabel: "Chat öffnen",
    fallbackText: ORIGINAL_LINK_FALLBACK,
    status: "live",
    statusHint: "Messenger-DMs laufen über den vorbereiteten Meta/OAuth-Intake. Kein automatisches Senden.",
  },
  facebook_comments: {
    sourceType: "facebook_comments",
    label: "Facebook Kommentare",
    platformName: "Facebook",
    platformKey: "facebook",
    interactionType: "comment",
    actionLabel: "Kommentar öffnen",
    fallbackText: ORIGINAL_LINK_FALLBACK,
    status: "parked",
    statusHint: "Geparkt/vorbereitet: kein Live-Test in diesem PR, keine automatische Antwort.",
  },
  instagram_messages: {
    sourceType: "instagram_messages",
    label: "Instagram Nachrichten",
    platformName: "Instagram",
    platformKey: "instagram",
    interactionType: "message",
    actionLabel: "Chat öffnen",
    fallbackText: ORIGINAL_LINK_FALLBACK,
    status: "prepared",
    statusHint: "Als Meta-Nachrichtenkanal vorbereitet; Live-Events später gesammelt testen.",
  },
  instagram_comments: {
    sourceType: "instagram_comments",
    label: "Instagram Kommentare",
    platformName: "Instagram",
    platformKey: "instagram",
    interactionType: "comment",
    actionLabel: "Kommentar öffnen",
    fallbackText: ORIGINAL_LINK_FALLBACK,
    status: "prepared",
    statusHint: "Als Meta-Kommentarkanal vorbereitet; kein automatisches Antworten.",
  },
  whatsapp_messages: {
    sourceType: "whatsapp_messages",
    label: "WhatsApp Nachrichten",
    platformName: "WhatsApp",
    platformKey: "whatsapp",
    interactionType: "message",
    actionLabel: "Chat öffnen",
    fallbackText: ORIGINAL_LINK_FALLBACK,
    status: "prepared",
    statusHint: "Cloud-API-Payloads sind vorbereitet; keine Tokens im Frontend und kein automatisches Senden.",
  },
  tiktok_comments: {
    sourceType: "tiktok_comments",
    label: "TikTok Kommentare",
    platformName: "TikTok",
    platformKey: "tiktok",
    interactionType: "comment",
    actionLabel: "Kommentar öffnen",
    fallbackText: ORIGINAL_LINK_FALLBACK,
    status: "prepared",
    statusHint: "Kommentare sind vorbereitet; Live-Zugriff erst mit offizieller Freigabe. Kein Scraping.",
  },
  tiktok_messages: {
    sourceType: "tiktok_messages",
    label: "TikTok Nachrichten",
    platformName: "TikTok",
    platformKey: "tiktok",
    interactionType: "message",
    actionLabel: "Chat öffnen",
    fallbackText: ORIGINAL_LINK_FALLBACK,
    status: "import_only",
    statusHint: "Nicht-live: nur Export-/Data-Portability-Importpfad. Kein Scraping, keine inoffizielle API.",
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
