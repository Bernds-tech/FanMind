import { NextRequest, NextResponse } from "next/server";

import { readBoundedJsonRequest } from "@/lib/httpMutationPolicy.mjs";
import { getClientIp } from "@/lib/rateLimit";
import { consumeSharedRateLimit } from "@/lib/sharedRateLimit";
import { MAX_BODY_BYTES } from "@/lib/websiteChatPolicy.mjs";
import {
  createWebsiteChatVisitorSession,
  resolveWebsiteChatInstallation,
  WebsiteChatServiceError,
} from "@/lib/websiteChat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INSTALLATION_HEADER = "x-fanmind-installation";
const ALLOWED_HEADERS = `content-type,${INSTALLATION_HEADER}`;
const SESSION_RATE_WINDOW_MS = 10 * 60 * 1000;
const SESSION_RATE_MAXIMUM = 10;

function corsHeaders(origin?: string) {
  return {
    ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Max-Age": "600",
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    Vary: "Origin",
  };
}

function response(payload: Record<string, unknown>, status: number, origin?: string) {
  return NextResponse.json(payload, { status, headers: corsHeaders(origin) });
}

function installationId(request: Request) {
  return request.headers.get(INSTALLATION_HEADER);
}

export async function OPTIONS(request: NextRequest) {
  try {
    const resolved = await resolveWebsiteChatInstallation({
      publicInstallationId: installationId(request),
      origin: request.headers.get("origin"),
    });
    return new NextResponse(null, { status: 204, headers: corsHeaders(resolved.origin) });
  } catch {
    return response({ ok: false, code: "ORIGIN_FORBIDDEN" }, 403);
  }
}

export async function POST(request: NextRequest) {
  let resolved;
  try {
    resolved = await resolveWebsiteChatInstallation({
      publicInstallationId: installationId(request),
      origin: request.headers.get("origin"),
    });
  } catch {
    return response({ ok: false, code: "ORIGIN_FORBIDDEN" }, 403);
  }

  if (request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() !== "application/json") {
    return response({ ok: false, code: "VALIDATION_ERROR" }, 400, resolved.origin);
  }
  const parsed = await readBoundedJsonRequest(request, MAX_BODY_BYTES);
  if (!parsed.ok) {
    return response(
      { ok: false, code: parsed.reason === "payload_too_large" ? "PAYLOAD_TOO_LARGE" : "VALIDATION_ERROR" },
      parsed.reason === "payload_too_large" ? 413 : 400,
      resolved.origin,
    );
  }

  let rateLimit;
  try {
    rateLimit = await consumeSharedRateLimit({
      scope: "website_chat_session_ip",
      subject: `${resolved.origin}:${getClientIp(request)}`,
      maxRequests: SESSION_RATE_MAXIMUM,
      windowMs: SESSION_RATE_WINDOW_MS,
    });
  } catch {
    return response({ ok: false, code: "SERVICE_UNAVAILABLE" }, 503, resolved.origin);
  }
  if (!rateLimit.allowed) {
    return response({ ok: false, code: "RATE_LIMITED" }, 429, resolved.origin);
  }

  try {
    const session = await createWebsiteChatVisitorSession({
      publicInstallationId: installationId(request),
      origin: resolved.origin,
      consent: (parsed.value as { consent?: unknown } | null)?.consent,
    });
    return response({ ok: true, session }, 201, resolved.origin);
  } catch (error) {
    if (error instanceof WebsiteChatServiceError && error.code === "consent_required") {
      return response({ ok: false, code: "CONSENT_REQUIRED" }, 400, resolved.origin);
    }
    return response({ ok: false, code: "SERVICE_UNAVAILABLE" }, 503, resolved.origin);
  }
}
