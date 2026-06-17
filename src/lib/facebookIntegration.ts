import {
  FACEBOOK_COMMENT_FEED_SCOPES,
  FACEBOOK_MESSAGES_OAUTH_SCOPES,
  FACEBOOK_PAGES_MANAGE_ENGAGEMENT_SCOPE,
  FACEBOOK_PAGES_MESSAGING_SCOPE,
  FACEBOOK_PAGES_READ_USER_CONTENT_SCOPE,
} from "@/lib/facebookScopes";
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const OAUTH_VERSION = "v20.0";
const STATE_MAX_AGE_SECONDS = 10 * 60;

export const REQUIRED_FACEBOOK_PAGE_PERMISSIONS = FACEBOOK_MESSAGES_OAUTH_SCOPES;

export type FacebookPermissionStatus = {
  permission: string;
  status: string;
};

export type FacebookOAuthState = {
  workspaceId: string;
  userId: string;
  nonce: string;
  issuedAt: number;
  connectionType?: "facebook_messages" | "facebook_comments";
};

export type FacebookPage = {
  id: string;
  name: string;
  accessToken: string | null;
  scopes: string[];
};

export type FacebookTokenDiagnostics = {
  app_id?: string;
  is_valid?: boolean;
  user_id?: string;
  scopes?: string[];
  granular_scopes?: Array<{
    scope?: string;
    target_ids?: string[];
  }>;
  error?: { message?: string; code?: number; type?: string };
};

export function getFacebookOAuthUrl(state: string, scopes: readonly string[] = FACEBOOK_MESSAGES_OAUTH_SCOPES): string {
  const appId = requireEnv("FACEBOOK_APP_ID", "META_APP_ID");
  const redirectUri = requireEnv("FACEBOOK_REDIRECT_URI", "META_REDIRECT_URI");
  const url = new URL(`https://www.facebook.com/${OAUTH_VERSION}/dialog/oauth`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("auth_type", "rerequest");
  url.searchParams.set("scope", scopes.join(","));
  return url.toString();
}

export function createFacebookOAuthState(
  input: Omit<FacebookOAuthState, "nonce" | "issuedAt">,
): string {
  const payload: FacebookOAuthState = {
    ...input,
    nonce: randomBytes(16).toString("hex"),
    issuedAt: Math.floor(Date.now() / 1000),
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  return `${encoded}.${signState(encoded)}`;
}

export function verifyFacebookOAuthState(
  state: string | null,
): FacebookOAuthState | null {
  if (!state) return null;
  const [encoded, signature] = state.split(".");
  if (!encoded || !signature) return null;
  if (!safeEqual(signature, signState(encoded))) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as FacebookOAuthState;
    const now = Math.floor(Date.now() / 1000);
    if (
      !payload.workspaceId ||
      !payload.userId ||
      !payload.nonce ||
      !payload.issuedAt
    )
      return null;
    if (now - payload.issuedAt > STATE_MAX_AGE_SECONDS) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function exchangeFacebookCode(code: string): Promise<string> {
  const url = new URL(
    `https://graph.facebook.com/${OAUTH_VERSION}/oauth/access_token`,
  );
  url.searchParams.set("client_id", requireEnv("FACEBOOK_APP_ID", "META_APP_ID"));
  url.searchParams.set("client_secret", requireEnv("FACEBOOK_APP_SECRET", "META_APP_SECRET"));
  url.searchParams.set("redirect_uri", requireEnv("FACEBOOK_REDIRECT_URI", "META_REDIRECT_URI"));
  url.searchParams.set("code", code);

  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as {
    access_token?: string;
    error?: { message?: string; code?: number; type?: string };
  } | null;
  if (!response.ok || !payload?.access_token) {
    logFacebookApiError("Facebook OAuth code exchange failed", payload?.error);
    throw new Error(
      payload?.error?.message ??
        "Facebook OAuth-Code konnte nicht getauscht werden.",
    );
  }
  return payload.access_token;
}

export async function fetchFacebookGrantedPermissions(
  userAccessToken: string,
): Promise<FacebookPermissionStatus[] | null> {
  const url = new URL(
    `https://graph.facebook.com/${OAUTH_VERSION}/me/permissions`,
  );
  url.searchParams.set("access_token", userAccessToken);

  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as {
    data?: FacebookPermissionStatus[];
    error?: { message?: string; code?: number; type?: string };
  } | null;

  if (!response.ok) {
    logFacebookApiError("Facebook permissions fetch failed", payload?.error);
    return null;
  }

  const permissions = payload?.data ?? [];
  const requiredPermissionDiagnostics = REQUIRED_FACEBOOK_PAGE_PERMISSIONS.map(
    (requiredPermission) => {
      const permission = permissions.find(
        (entry) => entry.permission === requiredPermission,
      );
      return {
        permission: requiredPermission,
        status: permission?.status ?? "missing",
      };
    },
  );

  console.info("Facebook permissions diagnostics", {
    permissions: requiredPermissionDiagnostics,
  });

  return permissions;
}

export function getGrantedFacebookPermissionNames(
  permissions: FacebookPermissionStatus[] | null,
): string[] {
  return (permissions ?? [])
    .filter((entry) => entry.status === "granted")
    .map((entry) => entry.permission);
}

export function getFacebookGrantedScopeNames(
  diagnostics: FacebookTokenDiagnostics | null,
): string[] {
  const scopes = new Set<string>();
  for (const scope of diagnostics?.scopes ?? []) {
    if (scope) scopes.add(scope);
  }
  for (const granularScope of diagnostics?.granular_scopes ?? []) {
    if (granularScope.scope) scopes.add(granularScope.scope);
  }
  return [...scopes].sort();
}

export function hasFacebookPagesMessagingScope(scopes: string[] | null | undefined): boolean {
  return Boolean(scopes?.includes(FACEBOOK_PAGES_MESSAGING_SCOPE));
}

export function hasFacebookPagesReadUserContentScope(scopes: string[] | null | undefined): boolean {
  return Boolean(scopes?.includes(FACEBOOK_PAGES_READ_USER_CONTENT_SCOPE));
}

export function hasFacebookPagesManageEngagementScope(scopes: string[] | null | undefined): boolean {
  return Boolean(scopes?.includes(FACEBOOK_PAGES_MANAGE_ENGAGEMENT_SCOPE));
}

export function hasFacebookCommentFeedScopes(scopes: string[] | null | undefined): boolean {
  return FACEBOOK_COMMENT_FEED_SCOPES.every((scope) => scopes?.includes(scope));
}

export function hasRequiredFacebookPagePermissions(
  permissions: FacebookPermissionStatus[] | null,
): boolean {
  if (!permissions) return true;

  return REQUIRED_FACEBOOK_PAGE_PERMISSIONS.every((requiredPermission) =>
    permissions.some(
      (entry) =>
        entry.permission === requiredPermission && entry.status === "granted",
    ),
  );
}

export async function fetchFacebookPages(
  userAccessToken: string,
): Promise<FacebookPage[]> {
  const primary = await fetchFacebookPagesFromAccountsEdge(userAccessToken);
  if (primary.pages.length > 0) return primary.pages;

  console.warn("Facebook /me/accounts returned no usable pages", {
    httpStatus: primary.httpStatus,
    pageCount: primary.pages.length,
    pagesMissingAccessToken: primary.pagesMissingAccessToken,
    hasMetaError: Boolean(primary.error),
    errorCode: primary.error?.code,
    errorType: primary.error?.type,
    errorMessage: primary.error?.message,
  });

  const fallback = await fetchFacebookPagesFromMeAccountsField(userAccessToken);
  if (fallback.pages.length > 0) {
    console.info("Facebook pages recovered through /me accounts field", {
      pageCount: fallback.pages.length,
      pagesMissingAccessToken: fallback.pagesMissingAccessToken,
    });
    return fallback.pages;
  }

  console.warn("Facebook pages fetch returned 0 pages after fallback", {
    primaryHttpStatus: primary.httpStatus,
    fallbackHttpStatus: fallback.httpStatus,
    primaryMetaError: primary.error
      ? {
          code: primary.error.code,
          type: primary.error.type,
          message: primary.error.message,
        }
      : null,
    fallbackMetaError: fallback.error
      ? {
          code: fallback.error.code,
          type: fallback.error.type,
          message: fallback.error.message,
        }
      : null,
  });

  const diagnostics = await fetchFacebookTokenDiagnostics(userAccessToken);
  const targetIds = getFacebookGranularPageTargetIds(diagnostics);
  if (targetIds.length === 0) return [];

  const recoveredPages = await fetchFacebookPagesFromGranularTargets(
    userAccessToken,
    targetIds,
  );
  if (recoveredPages.length > 0) return recoveredPages;

  return [];
}

type FacebookRawPage = {
  id?: string;
  name?: string;
  access_token?: string;
  perms?: string[];
  tasks?: string[];
};

export async function fetchFacebookTokenDiagnostics(
  userAccessToken: string,
): Promise<FacebookTokenDiagnostics | null> {
  const url = new URL(
    `https://graph.facebook.com/${OAUTH_VERSION}/debug_token`,
  );
  url.searchParams.set("input_token", userAccessToken);
  url.searchParams.set(
    "access_token",
    `${requireEnv("FACEBOOK_APP_ID", "META_APP_ID")}|${requireEnv("FACEBOOK_APP_SECRET", "META_APP_SECRET")}`,
  );

  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as {
    data?: FacebookTokenDiagnostics;
    error?: { message?: string; code?: number; type?: string };
  } | null;
  const diagnostics = payload?.data ?? null;
  const error = payload?.error ?? diagnostics?.error;

  console.info("Facebook token diagnostics", {
    httpStatus: response.status,
    appId: diagnostics?.app_id,
    isValid: diagnostics?.is_valid,
    userIdPresent: Boolean(diagnostics?.user_id),
    scopes: diagnostics?.scopes ?? [],
    granularScopes: (diagnostics?.granular_scopes ?? []).map((entry) => ({
      scope: entry.scope,
      targetCount: entry.target_ids?.length ?? 0,
    })),
    errorCode: error?.code,
    errorType: error?.type,
    errorMessage: error?.message,
  });

  if (!response.ok) {
    logFacebookApiError("Facebook debug_token fetch failed", error);
    return null;
  }

  return diagnostics;
}

function getFacebookGranularPageTargetIds(
  diagnostics: FacebookTokenDiagnostics | null,
): string[] {
  const relevantScopes = new Set<string>(REQUIRED_FACEBOOK_PAGE_PERMISSIONS);
  const targetCounts = new Map<string, number>();

  for (const granularScope of diagnostics?.granular_scopes ?? []) {
    if (!granularScope.scope || !relevantScopes.has(granularScope.scope)) {
      continue;
    }

    for (const targetId of granularScope.target_ids ?? []) {
      if (!targetId) continue;
      targetCounts.set(targetId, (targetCounts.get(targetId) ?? 0) + 1);
    }
  }

  const preferredTargets = [...targetCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([targetId]) => targetId);
  const targetIds =
    preferredTargets.length > 0 ? preferredTargets : [...targetCounts.keys()];

  console.info("Facebook granular page targets detected", {
    targetCount: targetIds.length,
  });

  return targetIds;
}

async function fetchFacebookPagesFromGranularTargets(
  userAccessToken: string,
  targetIds: string[],
): Promise<FacebookPage[]> {
  const pages: FacebookPage[] = [];

  for (const targetId of targetIds) {
    const page = await fetchFacebookPageById(userAccessToken, targetId);
    if (!page) continue;

    console.info("Facebook page recovered from granular scope target", {
      hasAccessToken: Boolean(page.accessToken),
    });
    pages.push(page);
  }

  return pages;
}

async function fetchFacebookPageById(
  userAccessToken: string,
  pageId: string,
): Promise<FacebookPage | null> {
  const withToken = await fetchFacebookPageByIdWithFields(
    userAccessToken,
    pageId,
    "id,name,access_token",
  );

  if (withToken.page || !isFacebookFieldError(withToken.error)) {
    return withToken.page;
  }

  console.warn("Facebook direct page fetch without access_token fallback", {
    errorCode: withToken.error?.code,
    errorType: withToken.error?.type,
    errorMessage: withToken.error?.message,
  });

  const withoutToken = await fetchFacebookPageByIdWithFields(
    userAccessToken,
    pageId,
    "id,name",
  );
  return withoutToken.page;
}

type FacebookDirectPageFetchResult = {
  page: FacebookPage | null;
  error?: { message?: string; code?: number; type?: string };
};

async function fetchFacebookPageByIdWithFields(
  userAccessToken: string,
  pageId: string,
  fields: "id,name,access_token" | "id,name",
): Promise<FacebookDirectPageFetchResult> {
  const url = new URL(`https://graph.facebook.com/${OAUTH_VERSION}/${pageId}`);
  url.searchParams.set("fields", fields);
  url.searchParams.set("access_token", userAccessToken);

  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as
    | (FacebookRawPage & {
        error?: { message?: string; code?: number; type?: string };
      })
    | null;

  console.info("Facebook direct page fetch diagnostics", {
    httpStatus: response.status,
    fields,
    hasPage: Boolean(payload?.id && payload?.name),
    hasAccessToken: Boolean(payload?.access_token),
    errorCode: payload?.error?.code,
    errorType: payload?.error?.type,
    errorMessage: payload?.error?.message,
  });

  if (!response.ok) {
    logFacebookApiError("Facebook direct page fetch failed", payload?.error);
    return { page: null, error: payload?.error };
  }

  if (!payload?.id || !payload.name) {
    return { page: null, error: payload?.error };
  }

  return {
    page: {
      id: payload.id,
      name: payload.name,
      accessToken: payload.access_token ?? null,
      scopes: [],
    },
    error: payload.error,
  };
}

function isFacebookFieldError(
  error: { message?: string; code?: number; type?: string } | undefined,
): boolean {
  return error?.code === 100;
}

type FacebookPagesFetchResult = {
  pages: FacebookPage[];
  httpStatus: number;
  pagesMissingAccessToken: number;
  error?: { message?: string; code?: number; type?: string };
};

async function fetchFacebookPagesFromAccountsEdge(
  userAccessToken: string,
): Promise<FacebookPagesFetchResult> {
  const url = new URL(
    `https://graph.facebook.com/${OAUTH_VERSION}/me/accounts`,
  );
  url.searchParams.set("fields", "id,name,access_token,perms,tasks");
  url.searchParams.set("access_token", userAccessToken);

  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as {
    data?: FacebookRawPage[];
    error?: { message?: string; code?: number; type?: string };
  } | null;

  const result = buildFacebookPagesFetchResult(
    response.status,
    payload?.data ?? [],
    payload?.error,
  );

  console.info("Facebook /me/accounts pages diagnostics", {
    httpStatus: result.httpStatus,
    pageCount: result.pages.length,
    pagesMissingAccessToken: result.pagesMissingAccessToken,
    errorCode: result.error?.code,
    errorType: result.error?.type,
    errorMessage: result.error?.message,
  });

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ?? "Facebook Pages konnten nicht geladen werden.",
    );
  }

  return result;
}

async function fetchFacebookPagesFromMeAccountsField(
  userAccessToken: string,
): Promise<FacebookPagesFetchResult> {
  const url = new URL(`https://graph.facebook.com/${OAUTH_VERSION}/me`);
  url.searchParams.set("fields", "accounts{id,name,access_token,perms,tasks}");
  url.searchParams.set("access_token", userAccessToken);

  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as {
    accounts?: { data?: FacebookRawPage[] };
    error?: { message?: string; code?: number; type?: string };
  } | null;

  const result = buildFacebookPagesFetchResult(
    response.status,
    payload?.accounts?.data ?? [],
    payload?.error,
  );

  console.info("Facebook /me accounts field pages diagnostics", {
    httpStatus: result.httpStatus,
    pageCount: result.pages.length,
    pagesMissingAccessToken: result.pagesMissingAccessToken,
    errorCode: result.error?.code,
    errorType: result.error?.type,
    errorMessage: result.error?.message,
  });

  if (!response.ok) {
    logFacebookApiError(
      "Facebook /me accounts field fetch failed",
      payload?.error,
    );
  }

  return result;
}

function buildFacebookPagesFetchResult(
  httpStatus: number,
  rawPages: FacebookRawPage[],
  error?: { message?: string; code?: number; type?: string },
): FacebookPagesFetchResult {
  const pages = rawPages
    .filter((page) => page.id && page.name)
    .map((page) => ({
      id: page.id!,
      name: page.name!,
      accessToken: page.access_token ?? null,
      scopes: page.tasks ?? page.perms ?? [],
    }));

  return {
    pages,
    httpStatus,
    pagesMissingAccessToken: pages.filter((page) => !page.accessToken).length,
    error,
  };
}

export type FacebookPageWebhookFieldStatus = "active" | "missing" | "unknown";

export const FACEBOOK_PAGE_MESSENGER_WEBHOOK_FIELDS = ["messages", "message_echoes"] as const;

export type FacebookPageWebhookStatus = {
  ok: boolean;
  pageId: string | null;
  hasPageAccessToken: boolean;
  subscribedAppsStatus: "active" | "missing" | "error" | "unknown";
  fields: Record<"feed" | "messages" | "message_echoes", FacebookPageWebhookFieldStatus>;
  error: string | null;
  metaError?: { message?: string; code?: number; type?: string };
};

type FacebookSubscribedApp = {
  id?: string;
  name?: string;
  subscribed_fields?: string[];
};

export async function fetchFacebookPageWebhookStatus(
  pageId: string | null,
  pageAccessToken: string | null,
): Promise<FacebookPageWebhookStatus> {
  if (!pageId) return buildWebhookStatus(pageId, Boolean(pageAccessToken), "unknown", [], "Facebook Page-ID fehlt.");
  if (!pageAccessToken) return buildWebhookStatus(pageId, false, "unknown", [], "Page Access Token fehlt serverseitig.");

  const url = new URL(`https://graph.facebook.com/${OAUTH_VERSION}/${pageId}/subscribed_apps`);
  url.searchParams.set("fields", "id,name,subscribed_fields");
  url.searchParams.set("access_token", pageAccessToken);

  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as {
    data?: FacebookSubscribedApp[];
    error?: { message?: string; code?: number; type?: string };
  } | null;

  if (!response.ok) {
    logFacebookApiError("Facebook Page subscribed_apps check failed", payload?.error);
    return {
      ...buildWebhookStatus(pageId, true, "error", [], payload?.error?.message ?? "Meta subscribed_apps konnte nicht geprüft werden."),
      metaError: payload?.error,
    };
  }

  const appId = getOptionalEnv("FACEBOOK_APP_ID", "META_APP_ID");
  const appSubscription = (payload?.data ?? []).find((entry) => !appId || entry.id === appId) ?? null;
  const subscribedFields = appSubscription?.subscribed_fields ?? [];
  return buildWebhookStatus(
    pageId,
    true,
    appSubscription ? "active" : "missing",
    subscribedFields,
    null,
  );
}

export async function subscribeFacebookPage(
  pageId: string,
  pageAccessToken: string,
): Promise<FacebookPageWebhookStatus> {
  const url = new URL(
    `https://graph.facebook.com/${OAUTH_VERSION}/${pageId}/subscribed_apps`,
  );
  url.searchParams.set("subscribed_fields", FACEBOOK_PAGE_MESSENGER_WEBHOOK_FIELDS.join(","));
  url.searchParams.set("access_token", pageAccessToken);
  const response = await fetch(url, { method: "POST", cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as {
    success?: boolean;
    error?: { message?: string; code?: number; type?: string };
  } | null;

  if (!response.ok || payload?.success === false) {
    logFacebookApiError("Facebook Page subscribe failed", payload?.error);
    return {
      ...buildWebhookStatus(pageId, true, "error", [], payload?.error?.message ?? "Meta hat die Page-Webhook-Aktivierung abgelehnt."),
      metaError: payload?.error,
    };
  }

  return fetchFacebookPageWebhookStatus(pageId, pageAccessToken);
}

function buildWebhookStatus(
  pageId: string | null,
  hasPageAccessToken: boolean,
  subscribedAppsStatus: FacebookPageWebhookStatus["subscribedAppsStatus"],
  subscribedFields: string[],
  error: string | null,
): FacebookPageWebhookStatus {
  const fieldSet = new Set(subscribedFields);
  const fieldStatus = (field: "feed" | "messages" | "message_echoes"): FacebookPageWebhookFieldStatus => {
    if (subscribedAppsStatus === "error" || subscribedAppsStatus === "unknown") return "unknown";
    return fieldSet.has(field) ? "active" : "missing";
  };

  return {
    ok: subscribedAppsStatus === "active" && fieldSet.has("messages") && fieldSet.has("message_echoes"),
    pageId,
    hasPageAccessToken,
    subscribedAppsStatus,
    fields: { feed: fieldStatus("feed"), messages: fieldStatus("messages"), message_echoes: fieldStatus("message_echoes") },
    error,
  };
}

export function isTokenEncryptionConfigured(): boolean {
  return Boolean(getEncryptionKey());
}

export function encryptToken(token: string): string | null {
  const key = getEncryptionKey();
  if (!key) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${ciphertext.toString("base64url")}`;
}

export function decryptToken(encrypted: string): string | null {
  const key = getEncryptionKey();
  const [, ivRaw, tagRaw, ciphertextRaw] = encrypted.split(":");
  if (!key || !ivRaw || !tagRaw || !ciphertextRaw) return null;
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivRaw, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextRaw, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function tokenLastFour(token: string | null): string | null {
  return token ? token.slice(-4) : null;
}

function signState(encodedPayload: string): string {
  return createHmac("sha256", requireEnv("FACEBOOK_APP_SECRET", "META_APP_SECRET"))
    .update(encodedPayload)
    .digest("base64url");
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

function getEncryptionKey(): Buffer | null {
  const raw = process.env.FANMIND_TOKEN_ENCRYPTION_KEY;
  if (!raw) return null;
  const decoded = Buffer.from(
    raw,
    raw.length === 64 && /^[a-f0-9]+$/i.test(raw) ? "hex" : "base64",
  );
  return decoded.length === 32 ? decoded : null;
}

function logFacebookApiError(
  message: string,
  error: { message?: string; code?: number; type?: string } | undefined,
) {
  console.error(message, {
    code: error?.code,
    type: error?.type,
    message: error?.message,
  });
}

function getOptionalEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  return undefined;
}

function requireEnv(name: string, fallbackName?: string): string {
  const value = getOptionalEnv(name, ...(fallbackName ? [fallbackName] : []));
  if (!value) {
    throw new Error(
      fallbackName
        ? `${name} ist nicht konfiguriert (Fallback ${fallbackName} fehlt ebenfalls).`
        : `${name} ist nicht konfiguriert.`,
    );
  }
  return value;
}

export type FacebookPagePost = {
  id: string;
  message?: string;
  created_time?: string;
  permalink_url?: string;
};

export type FacebookPageCommentAttachment = {
  media?: { image?: { src?: string } };
  target?: { url?: string };
  type?: string;
  url?: string;
};

export type FacebookPageComment = {
  id: string;
  message?: string;
  created_time?: string;
  permalink_url?: string;
  attachment?: FacebookPageCommentAttachment;
  attachments?: { data?: FacebookPageCommentAttachment[] };
  from?: { id?: string; name?: string };
  postId: string;
  postPermalinkUrl?: string;
};

export type FacebookCommentFetchEndpointType = "page-feed-with-comments" | "post-comments-fallback";

export type FacebookCommentFetchDiagnostics = {
  endpointType: FacebookCommentFetchEndpointType;
  usedPageAccessToken: boolean;
};

export class FacebookCommentFetchError extends Error {
  readonly endpointType: FacebookCommentFetchEndpointType;
  readonly usedPageAccessToken: boolean;
  readonly graphErrorCode?: number;

  constructor(
    message: string,
    input: { endpointType: FacebookCommentFetchEndpointType; usedPageAccessToken: boolean; graphErrorCode?: number },
  ) {
    super(message);
    this.name = "FacebookCommentFetchError";
    this.endpointType = input.endpointType;
    this.usedPageAccessToken = input.usedPageAccessToken;
    this.graphErrorCode = input.graphErrorCode;
  }
}

type FacebookPagePostWithInlineComments = FacebookPagePost & {
  comments?: {
    data?: Array<Omit<FacebookPageComment, "postId" | "postPermalinkUrl">>;
  };
};

export async function fetchFacebookPagePostsWithComments(
  pageId: string,
  pageAccessToken: string,
): Promise<{ posts: FacebookPagePost[]; comments: FacebookPageComment[]; diagnostics: FacebookCommentFetchDiagnostics }> {
  const feedUrl = new URL(`https://graph.facebook.com/${OAUTH_VERSION}/${pageId}/feed`);
  feedUrl.searchParams.set("fields", "id,message,created_time,permalink_url,comments.limit(50){id,message,created_time,from,permalink_url,attachment,attachments{media,target,type,url}}");
  feedUrl.searchParams.set("limit", "25");
  feedUrl.searchParams.set("access_token", pageAccessToken);

  try {
    const feedPosts = await fetchGraphCollection<FacebookPagePostWithInlineComments>(
      feedUrl,
      "Facebook Page-Feed mit Kommentaren konnte nicht geladen werden.",
    );
    const posts = feedPosts.map((post) => ({
      id: post.id,
      message: post.message,
      created_time: post.created_time,
      permalink_url: post.permalink_url,
    }));
    const comments = feedPosts.flatMap((post) =>
      (post.comments?.data ?? [])
        .filter((comment) => Boolean(comment.id))
        .map((comment) => ({ ...comment, postId: post.id, postPermalinkUrl: post.permalink_url })),
    );
    return { posts, comments, diagnostics: { endpointType: "page-feed-with-comments", usedPageAccessToken: true } };
  } catch (error) {
    if (!isMetaPermissionError(error)) throw withCommentFetchEndpoint(error, "page-feed-with-comments");
  }

  const postsUrl = new URL(`https://graph.facebook.com/${OAUTH_VERSION}/${pageId}/feed`);
  postsUrl.searchParams.set("fields", "id,message,created_time,permalink_url");
  postsUrl.searchParams.set("limit", "25");
  postsUrl.searchParams.set("access_token", pageAccessToken);

  const posts = await fetchGraphCollection<FacebookPagePost>(
    postsUrl,
    "Facebook Page-Feed konnte nicht geladen werden.",
  ).catch((error) => {
    throw withCommentFetchEndpoint(error, "post-comments-fallback");
  });
  const comments: FacebookPageComment[] = [];

  for (const post of posts) {
    const commentsUrl = new URL(`https://graph.facebook.com/${OAUTH_VERSION}/${post.id}/comments`);
    commentsUrl.searchParams.set("fields", "id,message,created_time,from,permalink_url,attachment,attachments{media,target,type,url}");
    commentsUrl.searchParams.set("filter", "stream");
    commentsUrl.searchParams.set("limit", "100");
    commentsUrl.searchParams.set("access_token", pageAccessToken);
    const postComments = await fetchGraphCollection<Omit<FacebookPageComment, "postId" | "postPermalinkUrl">>(
      commentsUrl,
      `Facebook-Kommentare für Post ${post.id} konnten nicht geladen werden.`,
    ).catch((error) => {
      throw withCommentFetchEndpoint(error, "post-comments-fallback");
    });
    comments.push(...postComments.map((comment) => ({ ...comment, postId: post.id, postPermalinkUrl: post.permalink_url })));
  }

  return { posts, comments, diagnostics: { endpointType: "post-comments-fallback", usedPageAccessToken: true } };
}

function isMetaPermissionError(error: unknown): boolean {
  return error instanceof GraphApiError && error.code === 10;
}

function withCommentFetchEndpoint(error: unknown, endpointType: FacebookCommentFetchEndpointType): Error {
  if (error instanceof FacebookCommentFetchError) return error;
  if (error instanceof GraphApiError) {
    return new FacebookCommentFetchError(error.message, { endpointType, usedPageAccessToken: true, graphErrorCode: error.code });
  }
  if (error instanceof Error) {
    return new FacebookCommentFetchError(error.message, { endpointType, usedPageAccessToken: true });
  }
  return new FacebookCommentFetchError("Facebook-Kommentarabruf fehlgeschlagen.", { endpointType, usedPageAccessToken: true });
}

class GraphApiError extends Error {
  readonly code?: number;

  constructor(message: string, code?: number) {
    super(message);
    this.name = "GraphApiError";
    this.code = code;
  }
}

async function fetchGraphCollection<T extends { id?: string }>(url: URL, errorFallback: string): Promise<T[]> {
  const items: T[] = [];
  let nextUrl: string | null = url.toString();

  while (nextUrl && items.length < 500) {
    const response = await fetch(nextUrl, { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as {
      data?: T[];
      paging?: { next?: string };
      error?: { message?: string; code?: number; type?: string };
    } | null;

    if (!response.ok) {
      logFacebookApiError(errorFallback, payload?.error);
      throw new GraphApiError(payload?.error?.message ?? errorFallback, payload?.error?.code);
    }

    items.push(...(payload?.data ?? []).filter((item) => Boolean(item.id)));
    nextUrl = payload?.paging?.next ?? null;
  }

  return items;
}
