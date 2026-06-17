export type SourceContextType =
  | "general_chat"
  | "post"
  | "reel"
  | "video"
  | "story"
  | "ad"
  | "campaign"
  | "comment_thread"
  | "unknown";

export type SourceContextMessage = {
  id?: string | null;
  message_type?: string | null;
  source_platform?: string | null;
  source_type?: string | null;
  source_url?: string | null;
  reply_target_url?: string | null;
  external_thread_id?: string | null;
  external_message_id?: string | null;
  external_post_id?: string | null;
  external_comment_id?: string | null;
  original_text_excerpt?: string | null;
  content?: string | null;
};

export type MessageSourceContext = {
  contextKey: string;
  contextLabel: string;
  contextType: SourceContextType;
  contextUrl: string | null;
};

const generalChatContext: MessageSourceContext = {
  contextKey: "general_chat",
  contextLabel: "Allgemeiner Chat",
  contextType: "general_chat",
  contextUrl: null,
};

export function getMessageSourceContext(message: SourceContextMessage): MessageSourceContext {
  const contextUrl = normalizeHttpUrl(message.reply_target_url) ?? normalizeHttpUrl(message.source_url);
  const sourceType = normalizeText(message.source_type ?? message.message_type);
  const platform = normalizeText(message.source_platform);
  const externalPostId = normalizeText(message.external_post_id);
  const externalCommentId = normalizeText(message.external_comment_id);
  const externalThreadId = normalizeText(message.external_thread_id);
  const contentLabel = buildContentLabel(message.original_text_excerpt ?? message.content);

  if (externalPostId) {
    const contextType = getPostContextType(platform, sourceType, contextUrl);
    return {
      contextKey: [platform || "source", contextType, externalPostId].join(":"),
      contextLabel: `${getContextTypeLabel(contextType)}: ${contentLabel ?? shortenIdentifier(externalPostId)}`,
      contextType,
      contextUrl,
    };
  }

  if (externalCommentId) {
    return {
      contextKey: [platform || "source", "comment_thread", externalCommentId].join(":"),
      contextLabel: `Kommentar-Thread${contentLabel ? `: ${contentLabel}` : ""}`,
      contextType: "comment_thread",
      contextUrl,
    };
  }

  const inferredVideoId = inferVideoId(message, contextUrl);
  if (inferredVideoId) {
    return {
      contextKey: [platform || "source", "video", inferredVideoId].join(":"),
      contextLabel: `Video: ${contentLabel ?? shortenIdentifier(inferredVideoId)}`,
      contextType: "video",
      contextUrl,
    };
  }

  if (isCampaignSource(sourceType, contextUrl)) {
    const key = externalThreadId || contextUrl || message.id || "campaign";
    return {
      contextKey: [platform || "source", "campaign", key].join(":"),
      contextLabel: `Kampagne${contentLabel ? `: ${contentLabel}` : ""}`,
      contextType: "campaign",
      contextUrl,
    };
  }

  return generalChatContext;
}

export function getSourceContextKey(message: SourceContextMessage): string {
  return getMessageSourceContext(message).contextKey;
}

export function buildSourceContextLabel(message: SourceContextMessage): string {
  return getMessageSourceContext(message).contextLabel;
}

export function getSourceContextActionLabel(context: MessageSourceContext): string {
  if (!context.contextUrl) return "Original öffnen";
  if (context.contextType === "comment_thread") return "Kommentar öffnen";
  if (context.contextType === "video" || context.contextType === "reel") return "Video öffnen";
  if (context.contextType === "general_chat") return "Chat öffnen";
  return "Beitrag öffnen";
}

function getPostContextType(platform: string, sourceType: string, contextUrl: string | null): SourceContextType {
  const haystack = `${platform} ${sourceType} ${contextUrl ?? ""}`;
  if (haystack.includes("reel")) return "reel";
  if (haystack.includes("story")) return "story";
  if (haystack.includes("ad") || haystack.includes("anzeige")) return "ad";
  if (haystack.includes("video") || haystack.includes("tiktok")) return "video";
  return "post";
}

function getContextTypeLabel(contextType: SourceContextType): string {
  return {
    general_chat: "Allgemeiner Chat",
    post: "Post",
    reel: "Reel",
    video: "Video",
    story: "Story",
    ad: "Ad",
    campaign: "Kampagne",
    comment_thread: "Kommentar-Thread",
    unknown: "Unbekannt",
  }[contextType];
}

function isCampaignSource(sourceType: string, contextUrl: string | null): boolean {
  const haystack = `${sourceType} ${contextUrl ?? ""}`;
  return haystack.includes("campaign") || haystack.includes("kampagne") || haystack.includes("utm_campaign");
}

function inferVideoId(message: SourceContextMessage, contextUrl: string | null): string | null {
  const sourceType = normalizeText(message.source_type ?? message.message_type);
  if (!sourceType.includes("video") && !sourceType.includes("tiktok") && !contextUrl?.includes("/video")) return null;
  return normalizeText(message.external_message_id) || normalizeText(message.id) || null;
}

function buildContentLabel(value: string | null | undefined): string | null {
  const normalized = value?.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return normalized.length > 48 ? `${normalized.slice(0, 45).trim()}…` : normalized;
}

function shortenIdentifier(value: string): string {
  return value.length > 14 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

function normalizeHttpUrl(value: string | null | undefined): string | null {
  const prepared = value?.trim();
  if (!prepared) return null;
  return prepared.startsWith("http://") || prepared.startsWith("https://") ? prepared : null;
}
