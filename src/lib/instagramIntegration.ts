import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { META_GRAPH_API_VERSION } from "@/lib/metaIntegrationPolicy.mjs";
import {
  INSTAGRAM_COMMENTS_OAUTH_SCOPES,
  INSTAGRAM_INSIGHTS_OAUTH_SCOPES,
  INSTAGRAM_MESSAGES_OAUTH_SCOPES,
} from "@/lib/instagramScopes";

const STATE_MAX_AGE_SECONDS = 10 * 60;

export type InstagramConnectionType =
  | "instagram_messages"
  | "instagram_comments"
  | "instagram_insights";

export type InstagramOAuthState = {
  workspaceId: string;
  userId: string;
  connectionType: InstagramConnectionType;
  nonce: string;
  issuedAt: number;
};

export type InstagramToken = {
  accessToken: string;
  userId: string;
  expiresIn: number | null;
};

export type InstagramProfile = {
  userId: string;
  username: string;
  name: string | null;
  profilePictureUrl: string | null;
};

export function getInstagramOAuthScopes(
  connectionType: InstagramConnectionType,
): readonly string[] {
  if (connectionType === "instagram_comments")
    return INSTAGRAM_COMMENTS_OAUTH_SCOPES;
  if (connectionType === "instagram_insights")
    return INSTAGRAM_INSIGHTS_OAUTH_SCOPES;
  return INSTAGRAM_MESSAGES_OAUTH_SCOPES;
}

export function getInstagramOAuthUrl(
  state: string,
  scopes: readonly string[],
): string {
  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", requireInstagramAppId());
  url.searchParams.set("redirect_uri", requireInstagramRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scopes.join(","));
  url.searchParams.set("state", state);
  url.searchParams.set("enable_fb_login", "0");
  url.searchParams.set("force_authentication", "1");
  return url.toString();
}

export function createInstagramOAuthState(
  input: Omit<InstagramOAuthState, "nonce" | "issuedAt">,
): string {
  const payload: InstagramOAuthState = {
    ...input,
    nonce: randomBytes(16).toString("hex"),
    issuedAt: Math.floor(Date.now() / 1000),
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  return `${encoded}.${signState(encoded)}`;
}

export function verifyInstagramOAuthState(
  state: string | null,
): InstagramOAuthState | null {
  if (!state) return null;
  const [encoded, signature] = state.split(".");
  if (!encoded || !signature || !safeEqual(signature, signState(encoded)))
    return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as Partial<InstagramOAuthState>;
    const now = Math.floor(Date.now() / 1000);
    if (
      !validIdentifier(payload.workspaceId) ||
      !validIdentifier(payload.userId) ||
      !isInstagramConnectionType(payload.connectionType) ||
      typeof payload.nonce !== "string" ||
      !/^[a-f0-9]{32}$/u.test(payload.nonce) ||
      !Number.isSafeInteger(payload.issuedAt) ||
      !payload.issuedAt ||
      payload.issuedAt > now + 30 ||
      now - payload.issuedAt > STATE_MAX_AGE_SECONDS
    ) {
      return null;
    }
    return payload as InstagramOAuthState;
  } catch {
    return null;
  }
}

export async function exchangeInstagramCode(
  code: string,
): Promise<InstagramToken> {
  const body = new URLSearchParams();
  body.set("client_id", requireInstagramAppId());
  body.set("client_secret", requireInstagramAppSecret());
  body.set("grant_type", "authorization_code");
  body.set("redirect_uri", requireInstagramRedirectUri());
  body.set("code", code);

  const response = await fetch(
    "https://api.instagram.com/oauth/access_token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    },
  );
  const payload = (await response.json().catch(() => null)) as {
    access_token?: string;
    user_id?: string | number;
    error_message?: string;
    error?: { message?: string; code?: number; type?: string };
  } | null;
  const userId = stringValue(payload?.user_id);
  if (!response.ok || !payload?.access_token || !userId) {
    logInstagramApiError("Instagram OAuth code exchange failed", payload);
    throw new Error("Instagram OAuth-Code konnte nicht getauscht werden.");
  }
  return {
    accessToken: payload.access_token,
    userId,
    expiresIn: null,
  };
}

export async function exchangeInstagramLongLivedToken(
  shortLivedToken: InstagramToken,
): Promise<InstagramToken> {
  const url = new URL("https://graph.instagram.com/access_token");
  url.searchParams.set("grant_type", "ig_exchange_token");
  url.searchParams.set("client_secret", requireInstagramAppSecret());
  url.searchParams.set("access_token", shortLivedToken.accessToken);

  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as {
    access_token?: string;
    token_type?: string;
    expires_in?: number;
    error?: { message?: string; code?: number; type?: string };
  } | null;
  if (!response.ok || !payload?.access_token) {
    logInstagramApiError("Instagram long-lived token exchange failed", payload);
    throw new Error("Instagram-Langzeittoken konnte nicht erstellt werden.");
  }
  return {
    accessToken: payload.access_token,
    userId: shortLivedToken.userId,
    expiresIn: Number.isFinite(payload.expires_in)
      ? Math.max(0, Math.trunc(payload.expires_in!))
      : null,
  };
}

export async function fetchInstagramProfile(
  token: InstagramToken,
): Promise<InstagramProfile> {
  const url = new URL(
    `https://graph.instagram.com/${META_GRAPH_API_VERSION}/me`,
  );
  url.searchParams.set("fields", "user_id,username,name,profile_picture_url");
  url.searchParams.set("access_token", token.accessToken);

  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as {
    id?: string | number;
    user_id?: string | number;
    username?: string;
    name?: string;
    profile_picture_url?: string;
    error?: { message?: string; code?: number; type?: string };
  } | null;
  const userId = stringValue(payload?.user_id) ?? stringValue(payload?.id);
  const username = stringValue(payload?.username);
  if (!response.ok || !userId || !username || userId !== token.userId) {
    logInstagramApiError("Instagram profile fetch failed", payload);
    throw new Error("Instagram-Professional-Konto konnte nicht bestätigt werden.");
  }
  return {
    userId,
    username,
    name: stringValue(payload?.name),
    profilePictureUrl: validHttpsUrl(payload?.profile_picture_url),
  };
}

export async function subscribeInstagramAccount(
  profileId: string,
  accessToken: string,
  connectionType: InstagramConnectionType,
): Promise<boolean> {
  if (connectionType === "instagram_insights") return false;
  const requestedField =
    connectionType === "instagram_comments" ? "comments" : "messages";
  const currentFields = await fetchInstagramSubscribedFields(
    profileId,
    accessToken,
  );
  const subscribedFields = [...new Set([...currentFields, requestedField])];
  const url = new URL(
    `https://graph.instagram.com/${META_GRAPH_API_VERSION}/${encodeURIComponent(profileId)}/subscribed_apps`,
  );
  url.searchParams.set("subscribed_fields", subscribedFields.join(","));
  url.searchParams.set("access_token", accessToken);
  const response = await fetch(url, { method: "POST", cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as {
    success?: boolean;
    error?: { message?: string; code?: number; type?: string };
  } | null;
  if (!response.ok || payload?.success !== true) {
    logInstagramApiError("Instagram webhook subscription failed", payload);
    return false;
  }
  return true;
}

async function fetchInstagramSubscribedFields(
  profileId: string,
  accessToken: string,
): Promise<string[]> {
  const url = new URL(
    `https://graph.instagram.com/${META_GRAPH_API_VERSION}/${encodeURIComponent(profileId)}/subscribed_apps`,
  );
  url.searchParams.set("fields", "subscribed_fields");
  url.searchParams.set("access_token", accessToken);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return [];
  const payload = (await response.json().catch(() => null)) as {
    data?: Array<{ subscribed_fields?: unknown }>;
  } | null;
  const values = payload?.data?.flatMap((entry) =>
    Array.isArray(entry.subscribed_fields)
      ? entry.subscribed_fields
      : [],
  );
  return [
    ...new Set(
      (values ?? []).filter(
        (value): value is string =>
          typeof value === "string" && /^[a-z][a-z0-9_]{0,63}$/u.test(value),
      ),
    ),
  ];
}

export function isInstagramOAuthConfigured(): boolean {
  return Boolean(
    optionalEnv("INSTAGRAM_APP_ID", "META_APP_ID") &&
      optionalEnv("INSTAGRAM_APP_SECRET", "META_APP_SECRET") &&
      optionalEnv("INSTAGRAM_REDIRECT_URI"),
  );
}

function isInstagramConnectionType(
  value: unknown,
): value is InstagramConnectionType {
  return (
    value === "instagram_messages" ||
    value === "instagram_comments" ||
    value === "instagram_insights"
  );
}

function signState(encodedPayload: string): string {
  return createHmac("sha256", requireInstagramAppSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function requireInstagramAppId(): string {
  return requireEnv("INSTAGRAM_APP_ID", "META_APP_ID");
}

function requireInstagramAppSecret(): string {
  return requireEnv("INSTAGRAM_APP_SECRET", "META_APP_SECRET");
}

function requireInstagramRedirectUri(): string {
  return requireEnv("INSTAGRAM_REDIRECT_URI");
}

function optionalEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

function requireEnv(name: string, fallbackName?: string): string {
  const value = optionalEnv(name, ...(fallbackName ? [fallbackName] : []));
  if (!value) throw new Error(`${name} ist nicht konfiguriert.`);
  return value;
}

function validIdentifier(value: unknown): boolean {
  return /^[A-Za-z0-9_-]{8,255}$/u.test(String(value ?? "").trim());
}

function stringValue(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function validHttpsUrl(value: unknown): string | null {
  const normalized = stringValue(value);
  if (!normalized) return null;
  try {
    const url = new URL(normalized);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function logInstagramApiError(
  message: string,
  payload:
    | {
        error_message?: string;
        error?: { message?: string; code?: number; type?: string };
      }
    | null,
) {
  console.error(message, {
    code: payload?.error?.code,
    type: payload?.error?.type,
    message: payload?.error?.message ?? payload?.error_message,
  });
}
