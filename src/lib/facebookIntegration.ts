import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const OAUTH_VERSION = "v20.0";
const STATE_MAX_AGE_SECONDS = 10 * 60;

export const REQUIRED_FACEBOOK_PAGE_PERMISSIONS = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_metadata",
] as const;

export type FacebookPermissionStatus = {
  permission: string;
  status: string;
};

export type FacebookOAuthState = {
  workspaceId: string;
  userId: string;
  nonce: string;
  issuedAt: number;
};

export type FacebookPage = {
  id: string;
  name: string;
  accessToken: string | null;
  scopes: string[];
};

export function getFacebookOAuthUrl(state: string): string {
  const appId = requireEnv("META_APP_ID");
  const redirectUri = requireEnv("META_REDIRECT_URI");
  const url = new URL(`https://www.facebook.com/${OAUTH_VERSION}/dialog/oauth`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("auth_type", "rerequest");
  url.searchParams.set(
    "scope",
    REQUIRED_FACEBOOK_PAGE_PERMISSIONS.join(","),
  );
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
  url.searchParams.set("client_id", requireEnv("META_APP_ID"));
  url.searchParams.set("client_secret", requireEnv("META_APP_SECRET"));
  url.searchParams.set("redirect_uri", requireEnv("META_REDIRECT_URI"));
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

  return [];
}

type FacebookRawPage = {
  id?: string;
  name?: string;
  access_token?: string;
  perms?: string[];
  tasks?: string[];
};

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

export async function subscribeFacebookPage(
  pageId: string,
  pageAccessToken: string,
): Promise<boolean> {
  const url = new URL(
    `https://graph.facebook.com/${OAUTH_VERSION}/${pageId}/subscribed_apps`,
  );
  url.searchParams.set("subscribed_fields", "messages,feed");
  url.searchParams.set("access_token", pageAccessToken);
  const response = await fetch(url, { method: "POST", cache: "no-store" });
  return response.ok;
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
  return createHmac("sha256", requireEnv("META_APP_SECRET"))
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

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} ist nicht konfiguriert.`);
  return value;
}
