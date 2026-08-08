import "server-only";

import {
  createWebsiteChatSessionToken,
  hashWebsiteChatSessionToken,
  normalizeWebsiteChatMessage,
  normalizeSessionTtlMinutes,
  requireAllowedWebsiteChatOrigin,
  requireConsent,
  requirePublicInstallationId,
  requireWebsiteChatClientMessageId,
} from "@/lib/websiteChatPolicy.mjs";
import { getSupabaseHeaders, getSupabaseRestUrl } from "@/lib/supabase/config";

type InstallationRow = {
  id: string;
  workspace_id: string;
  enabled: boolean;
  consent_version: string;
  session_ttl_minutes: number;
};

type OriginRow = { origin: string; verified_at: string | null };

export class WebsiteChatServiceError extends Error {
  readonly code:
    | "configuration"
    | "installation_unavailable"
    | "origin_forbidden"
    | "consent_required"
    | "session_unavailable"
    | "message_invalid"
    | "persistence_unavailable";

  constructor(code: WebsiteChatServiceError["code"]) {
    super("Website Chat is unavailable.");
    this.name = "WebsiteChatServiceError";
    this.code = code;
  }
}

type IngestedMessageRow = {
  accepted: boolean;
  duplicate: boolean;
  conversation_id: string | null;
  message_id: string | null;
};

export async function ingestWebsiteChatMessage(input: {
  publicInstallationId: unknown;
  origin: unknown;
  sessionToken: unknown;
  clientMessageId: unknown;
  message: unknown;
}) {
  const { serviceKey, sessionSecret } = serviceConfiguration();
  const { origin } = await resolveWebsiteChatInstallation(input);

  let visitorSubjectHash: string;
  let clientMessageId: string;
  let content: string;
  try {
    visitorSubjectHash = hashWebsiteChatSessionToken({
      token: input.sessionToken,
      secret: sessionSecret,
    });
    clientMessageId = requireWebsiteChatClientMessageId(input.clientMessageId);
    content = normalizeWebsiteChatMessage(input.message);
  } catch {
    throw new WebsiteChatServiceError("message_invalid");
  }

  const result = await fetch(getSupabaseRestUrl("rpc/ingest_website_chat_message"), {
    method: "POST",
    headers: { ...getSupabaseHeaders(serviceKey), Prefer: "return=representation" },
    body: JSON.stringify({
      p_public_installation_id: input.publicInstallationId,
      p_origin: origin,
      p_visitor_subject_hash: visitorSubjectHash,
      p_client_message_id: clientMessageId,
      p_content: content,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  }).catch(() => null);
  if (!result?.ok) {
    if (result?.status === 404) {
      throw new WebsiteChatServiceError("session_unavailable");
    }
    throw new WebsiteChatServiceError("persistence_unavailable");
  }
  const rows = await result.json() as IngestedMessageRow[];
  const row = rows[0];
  if (row && !row.accepted) {
    throw new WebsiteChatServiceError("session_unavailable");
  }
  if (!row?.accepted || !row.conversation_id || !row.message_id) {
    throw new WebsiteChatServiceError("persistence_unavailable");
  }
  return {
    accepted: true as const,
    duplicate: row.duplicate === true,
    conversationId: row.conversation_id,
    messageId: row.message_id,
  };
}

function serviceConfiguration() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  const sessionSecret = process.env.FANMIND_WEBSITE_CHAT_SESSION_SECRET?.trim() ?? "";
  if (!serviceKey || sessionSecret.length < 32) {
    throw new WebsiteChatServiceError("configuration");
  }
  return { serviceKey, sessionSecret };
}

async function fetchRows<T>(path: string, serviceKey: string): Promise<T[]> {
  const response = await fetch(`${getSupabaseRestUrl(path)}`, {
    headers: getSupabaseHeaders(serviceKey),
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  }).catch(() => null);
  if (!response?.ok) throw new WebsiteChatServiceError("persistence_unavailable");
  return response.json() as Promise<T[]>;
}

export async function resolveWebsiteChatInstallation(input: {
  publicInstallationId: unknown;
  origin: unknown;
}) {
  const { serviceKey } = serviceConfiguration();
  const publicId = requirePublicInstallationId(input.publicInstallationId);
  const installations = await fetchRows<InstallationRow>(
    `website_chat_installations?select=id,workspace_id,enabled,consent_version,session_ttl_minutes&public_installation_id=eq.${encodeURIComponent(publicId)}&limit=1`,
    serviceKey,
  );
  const installation = installations[0];
  if (!installation?.enabled) {
    throw new WebsiteChatServiceError("installation_unavailable");
  }

  const origins = await fetchRows<OriginRow>(
    `website_chat_allowed_origins?select=origin,verified_at&installation_id=eq.${encodeURIComponent(installation.id)}`,
    serviceKey,
  );
  const verifiedOrigins = origins.filter((row) => row.verified_at).map((row) => row.origin);
  let origin: string;
  try {
    origin = requireAllowedWebsiteChatOrigin(input.origin, verifiedOrigins);
  } catch {
    throw new WebsiteChatServiceError("origin_forbidden");
  }
  return { installation, origin };
}

export async function createWebsiteChatVisitorSession(input: {
  publicInstallationId: unknown;
  origin: unknown;
  consent: unknown;
}) {
  const { serviceKey, sessionSecret } = serviceConfiguration();
  const { installation, origin } = await resolveWebsiteChatInstallation(input);
  try {
    requireConsent(input.consent, installation.consent_version);
  } catch {
    throw new WebsiteChatServiceError("consent_required");
  }

  const token = createWebsiteChatSessionToken();
  const subjectHash = hashWebsiteChatSessionToken({ token, secret: sessionSecret });
  const consentGrantedAt = new Date();
  const ttlMinutes = normalizeSessionTtlMinutes(installation.session_ttl_minutes);
  const expiresAt = new Date(consentGrantedAt.getTime() + ttlMinutes * 60_000);
  const response = await fetch(getSupabaseRestUrl("website_chat_visitor_sessions"), {
    method: "POST",
    headers: { ...getSupabaseHeaders(serviceKey), Prefer: "return=minimal" },
    body: JSON.stringify({
      installation_id: installation.id,
      workspace_id: installation.workspace_id,
      origin,
      visitor_subject_hash: subjectHash,
      consent_version: installation.consent_version,
      consent_granted_at: consentGrantedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      last_seen_at: consentGrantedAt.toISOString(),
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  }).catch(() => null);
  if (!response?.ok) throw new WebsiteChatServiceError("persistence_unavailable");

  return { token, expiresAt: expiresAt.toISOString(), consentVersion: installation.consent_version };
}
