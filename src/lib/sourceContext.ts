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

export type ReplyTargetQuality =
  | "exact_thread"
  | "manual_exact_thread"
  | "inbox_fallback"
  | "unavailable";

export type ReplyTargetAction = {
  href: string | null;
  label: string;
  quality: ReplyTargetQuality;
  reason: string;
  disabledHint: string;
  fallbackContactLabel?: string | null;
  fallbackContactId?: string | null;
};

const generalChatContext: MessageSourceContext = {
  contextKey: "general_chat",
  contextLabel: "Allgemeiner Chat",
  contextType: "general_chat",
  contextUrl: null,
};

export function getMessageSourceContext(
  message: SourceContextMessage,
): MessageSourceContext {
  const contextUrl =
    normalizeHttpUrl(message.reply_target_url) ??
    normalizeHttpUrl(message.source_url);
  const sourceType = normalizeText(message.source_type ?? message.message_type);
  const platform = normalizeText(message.source_platform);
  const externalPostId = normalizeText(message.external_post_id);
  const externalCommentId = normalizeText(message.external_comment_id);
  const externalThreadId = normalizeText(message.external_thread_id);
  const contentLabel = buildContentLabel(
    message.original_text_excerpt ?? message.content,
  );

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
      contextKey: [
        platform || "source",
        "comment_thread",
        externalCommentId,
      ].join(":"),
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

export function getSourceContextActionLabel(
  context: MessageSourceContext,
): string {
  if (!context.contextUrl) return "Original öffnen";
  if (context.contextType === "comment_thread") return "Kommentar öffnen";
  if (context.contextType === "video" || context.contextType === "reel")
    return "Video öffnen";
  if (context.contextType === "general_chat") return "Chat öffnen";
  return "Beitrag öffnen";
}

export function buildReplyTargetAction(
  messageOrConversation: SourceContextMessage | null | undefined,
  fallback?: SourceContextMessage | null,
  options?: {
    fallbackContactLabel?: string | null;
    fallbackContactId?: string | null;
    manualReplyTargetUrl?: string | null;
  },
): ReplyTargetAction {
  const primary = messageOrConversation ?? null;
  const platform = normalizeText(
    primary?.source_platform ?? fallback?.source_platform,
  );
  const sourceType = normalizeText(
    primary?.source_type ??
      primary?.message_type ??
      fallback?.source_type ??
      fallback?.message_type,
  );
  const replyTargetUrl =
    normalizeHttpUrl(primary?.reply_target_url) ??
    normalizeHttpUrl(fallback?.reply_target_url);
  const sourceUrl =
    normalizeHttpUrl(primary?.source_url) ??
    normalizeHttpUrl(fallback?.source_url);

  if (platform === "facebook" && isMessengerSource(sourceType)) {
    const manualExactUrl = isAllowedManualFacebookThreadUrl(
      options?.manualReplyTargetUrl,
    )
      ? options.manualReplyTargetUrl
      : null;
    if (manualExactUrl) {
      return {
        href: manualExactUrl,
        label: "In Facebook-Chat antworten",
        quality: "manual_exact_thread",
        reason: "Manuell hinterlegter Chat-Link.",
        disabledHint: "Originalkanal-Link noch nicht verfügbar.",
      };
    }

    const exactUrl =
      [replyTargetUrl, sourceUrl].find(isExactFacebookThreadUrl) ?? null;
    if (exactUrl) {
      return {
        href: exactUrl,
        label: "In Facebook-Chat antworten",
        quality: "exact_thread",
        reason:
          "Ein verifizierter Facebook-Conversation-/Thread-Link ist gespeichert.",
        disabledHint: "Originalkanal-Link noch nicht verfügbar.",
      };
    }

    const inboxUrl = buildFacebookInboxFallbackUrl();
    return {
      href: inboxUrl,
      label: "Facebook-Postfach öffnen",
      quality: "inbox_fallback",
      reason:
        "Nur der allgemeine Facebook-Postfach-Zugang ist verfügbar. Bitte den Kontakt dort manuell auswählen.",
      disabledHint: "Originalkanal-Link noch nicht verfügbar.",
      fallbackContactLabel: options?.fallbackContactLabel ?? null,
      fallbackContactId: options?.fallbackContactId ?? null,
    };
  }

  const url = replyTargetUrl ?? sourceUrl;
  if (url) {
    return {
      href: url,
      label: getNonFacebookReplyLabel(platform || sourceType, url),
      quality: "exact_thread",
      reason: "Originalkanal-Link ist gespeichert.",
      disabledHint: "Originalkanal-Link noch nicht verfügbar.",
    };
  }

  return {
    href: null,
    label: "Originalkanal-Link noch nicht verfügbar",
    quality: "unavailable",
    reason:
      "Für diese Nachricht ist noch kein öffnbarer Originalkanal-Link gespeichert.",
    disabledHint: "Originalkanal-Link noch nicht verfügbar.",
  };
}

function isMessengerSource(sourceType: string): boolean {
  return (
    sourceType.includes("message") ||
    sourceType.includes("messenger") ||
    sourceType === "dm"
  );
}

export function isExactFacebookThreadUrl(
  value: string | null | undefined,
): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (!host.endsWith("facebook.com")) return false;
    const normalizedPath =
      url.pathname.toLowerCase().replace(/\/+$/, "") || "/";
    if (
      normalizedPath === "/" ||
      normalizedPath === "/latest/inbox" ||
      normalizedPath.startsWith("/latest/inbox/")
    ) {
      return false;
    }
    if (
      normalizedPath.includes("/posts/") ||
      normalizedPath.includes("/permalink/")
    ) {
      return false;
    }
    return (
      normalizedPath.includes("/inbox/t/") ||
      normalizedPath.includes("/messenger/t/") ||
      normalizedPath.includes("/messages/t/") ||
      Boolean(url.searchParams.get("thread_id"))
    );
  } catch {
    return false;
  }
}

export function isAllowedManualFacebookThreadUrl(
  value: string | null | undefined,
): value is string {
  if (!value || !isExactFacebookThreadUrl(value)) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      ["business.facebook.com", "facebook.com", "www.facebook.com"].includes(
        url.hostname.toLowerCase(),
      )
    );
  } catch {
    return false;
  }
}

function buildFacebookInboxFallbackUrl(): string {
  const url = new URL("https://business.facebook.com/latest/inbox");
  const businessId = firstConfiguredEnv(
    "META_BUSINESS_ID",
    "NEXT_PUBLIC_META_BUSINESS_ID",
  );
  if (businessId) url.searchParams.set("business_id", businessId);
  return url.toString();
}

function firstConfiguredEnv(...names: string[]): string | null {
  for (const name of names) {
    const value = process.env[name];
    if (value?.trim()) return value.trim();
  }
  return null;
}

function getNonFacebookReplyLabel(platform: string, url: string): string {
  const haystack = `${platform} ${url}`.toLowerCase();
  if (haystack.includes("comment") || haystack.includes("kommentar"))
    return "Kommentar öffnen";
  if (haystack.includes("post") || haystack.includes("beitrag"))
    return "Beitrag öffnen";
  if (
    haystack.includes("dm") ||
    haystack.includes("message") ||
    haystack.includes("messenger") ||
    haystack.includes("chat")
  )
    return "Chat öffnen";
  if (haystack.includes("mail")) return "E-Mail öffnen";
  return "Original öffnen";
}

function getPostContextType(
  platform: string,
  sourceType: string,
  contextUrl: string | null,
): SourceContextType {
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

function isCampaignSource(
  sourceType: string,
  contextUrl: string | null,
): boolean {
  const haystack = `${sourceType} ${contextUrl ?? ""}`;
  return (
    haystack.includes("campaign") ||
    haystack.includes("kampagne") ||
    haystack.includes("utm_campaign")
  );
}

function inferVideoId(
  message: SourceContextMessage,
  contextUrl: string | null,
): string | null {
  const sourceType = normalizeText(message.source_type ?? message.message_type);
  if (
    !sourceType.includes("video") &&
    !sourceType.includes("tiktok") &&
    !contextUrl?.includes("/video")
  )
    return null;
  return (
    normalizeText(message.external_message_id) ||
    normalizeText(message.id) ||
    null
  );
}

function buildContentLabel(value: string | null | undefined): string | null {
  const normalized = value?.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return normalized.length > 48
    ? `${normalized.slice(0, 45).trim()}…`
    : normalized;
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
  return prepared.startsWith("http://") || prepared.startsWith("https://")
    ? prepared
    : null;
}
