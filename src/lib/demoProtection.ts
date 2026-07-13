import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import {
  getSupabaseHeaders,
  getSupabaseRestUrl,
} from "@/lib/supabase/config";

export const DEMO_BROWSER_COOKIE = "fanmind_demo_browser";

export type DemoClaimDecision =
  | "reserved"
  | "existing"
  | "capacity"
  | "blocked_ip_short"
  | "blocked_ip_day"
  | "blocked_browser_day"
  | "invalid";

export type DemoClaimResult = {
  decision: DemoClaimDecision;
  reservationId: string | null;
  retryAfterSeconds: number;
  activeCount: number;
  error: string | null;
};

export type DemoCleanupCandidate = {
  sessionId: string;
  authUserId: string | null;
  workspaceId: string | null;
};

type DemoClaimRow = {
  decision: DemoClaimDecision;
  reservation_id: string | null;
  retry_after_seconds: number | null;
  active_count: number | null;
};

type DemoCleanupRow = {
  session_id: string;
  auth_user_id: string | null;
  workspace_id: string | null;
};

type TurnstileResponse = {
  success?: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
};

function serviceRoleKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
}

function positiveInt(name: string, fallback: number, maximum: number): number {
  const parsed = Number(process.env[name]);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, maximum);
}

function protectionSecret(): string | null {
  const value = process.env.FANMIND_DEMO_RATE_LIMIT_SECRET?.trim();
  return value && value.length >= 32 ? value : null;
}

function cleanupSecret(): string | null {
  const value = process.env.FANMIND_DEMO_CLEANUP_SECRET?.trim();
  return value && value.length >= 32 ? value : null;
}

function timingSafeTextEqual(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(actual, "utf8");
  return (
    expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  );
}

export function publicDemoEnabled(): boolean {
  return process.env.FANMIND_PUBLIC_DEMO_ENABLED === "true";
}

export function demoCleanupAuthorized(authorization: string | null): boolean {
  const secret = cleanupSecret();
  if (!secret) return false;

  const value = authorization?.trim() ?? "";
  if (!value.startsWith("Bearer ")) return false;
  const supplied = value.slice("Bearer ".length).trim();
  if (!supplied) return false;

  return timingSafeTextEqual(secret, supplied);
}

export function getTrustedClientIp(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export function hashDemoIdentifier(
  purpose: "ip" | "browser",
  value: string,
): string | null {
  const secret = protectionSecret();
  if (!secret || !value.trim()) return null;
  return crypto
    .createHmac("sha256", secret)
    .update(`${purpose}:${value.trim()}`)
    .digest("hex");
}

async function callDemoRpc<T>(
  name: string,
  body: Record<string, unknown>,
): Promise<{ rows: T[]; error: string | null }> {
  const key = serviceRoleKey();
  if (!key) {
    return {
      rows: [],
      error: "SUPABASE_SERVICE_ROLE_KEY ist nicht konfiguriert.",
    };
  }

  try {
    const response = await fetch(getSupabaseRestUrl(`rpc/${name}`), {
      method: "POST",
      headers: getSupabaseHeaders(key),
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return {
        rows: [],
        error: `${name} fehlgeschlagen (${response.status})${detail ? `: ${detail.slice(0, 250)}` : ""}`,
      };
    }
    const payload = (await response.json().catch(() => [])) as T[] | T | null;
    return {
      rows: Array.isArray(payload) ? payload : payload ? [payload] : [],
      error: null,
    };
  } catch (error) {
    return {
      rows: [],
      error: error instanceof Error ? error.message : `${name} fehlgeschlagen.`,
    };
  }
}

export async function verifyDemoTurnstile(input: {
  token?: string | null;
  remoteIp?: string | null;
}): Promise<{ ok: boolean; error: string | null }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();

  if (!secret && !siteKey) return { ok: true, error: null };
  if (!secret || !siteKey) {
    return {
      ok: false,
      error: "Der Demo-Bot-Schutz ist unvollständig konfiguriert.",
    };
  }
  if (!input.token?.trim()) {
    return { ok: false, error: "Bitte bestätige den Bot-Schutz." };
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", input.token.trim());
  if (input.remoteIp && input.remoteIp !== "unknown") {
    body.set("remoteip", input.remoteIp);
  }
  body.set("idempotency_key", crypto.randomUUID());

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      },
    );
    const result = (await response.json().catch(() => null)) as
      | TurnstileResponse
      | null;
    if (!response.ok || !result?.success) {
      return {
        ok: false,
        error: `Bot-Schutz nicht bestätigt${result?.["error-codes"]?.length ? ` (${result["error-codes"].join(", ")})` : ""}.`,
      };
    }

    const expectedHostname = (() => {
      const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
      if (!raw) return null;
      try {
        return new URL(raw).hostname;
      } catch {
        return null;
      }
    })();
    if (
      expectedHostname &&
      result.hostname &&
      result.hostname !== expectedHostname
    ) {
      return { ok: false, error: "Bot-Schutz wurde für einen falschen Host gelöst." };
    }
    if (result.action && result.action !== "fanmind_demo_start") {
      return { ok: false, error: "Bot-Schutz-Aktion ist ungültig." };
    }
    return { ok: true, error: null };
  } catch {
    return {
      ok: false,
      error: "Bot-Schutz konnte gerade nicht geprüft werden.",
    };
  }
}

export async function claimPublicDemoStart(input: {
  ipHash: string;
  browserHash: string;
}): Promise<DemoClaimResult> {
  const result = await callDemoRpc<DemoClaimRow>("claim_public_demo_start", {
    p_ip_hash: input.ipHash,
    p_browser_hash: input.browserHash,
    p_duration_minutes: 60,
    p_max_per_ip_10_min: positiveInt(
      "FANMIND_DEMO_MAX_PER_IP_10_MIN",
      1,
      20,
    ),
    p_max_per_ip_day: positiveInt("FANMIND_DEMO_MAX_PER_IP_DAY", 5, 100),
    p_max_per_browser_day: positiveInt(
      "FANMIND_DEMO_MAX_PER_BROWSER_DAY",
      2,
      30,
    ),
    p_max_active: positiveInt("FANMIND_DEMO_MAX_ACTIVE", 50, 2000),
  });
  if (result.error) {
    return {
      decision: "invalid",
      reservationId: null,
      retryAfterSeconds: 600,
      activeCount: 0,
      error: result.error,
    };
  }
  const row = result.rows[0];
  return {
    decision: row?.decision ?? "invalid",
    reservationId: row?.reservation_id ?? null,
    retryAfterSeconds: row?.retry_after_seconds ?? 600,
    activeCount: row?.active_count ?? 0,
    error: null,
  };
}

export async function activatePublicDemoStart(input: {
  reservationId: string;
  authUserId: string;
  workspaceId: string;
  expiresAt: Date;
}): Promise<boolean> {
  const result = await callDemoRpc<boolean>("activate_public_demo_start", {
    p_reservation_id: input.reservationId,
    p_auth_user_id: input.authUserId,
    p_workspace_id: input.workspaceId,
    p_expires_at: input.expiresAt.toISOString(),
  });
  return !result.error && result.rows[0] === true;
}

export async function failPublicDemoStart(
  reservationId: string,
  errorCode: string,
): Promise<void> {
  await callDemoRpc<boolean>("fail_public_demo_start", {
    p_reservation_id: reservationId,
    p_error_code: errorCode.slice(0, 200),
  });
}

export async function claimExpiredDemoCleanup(
  requestedLimit = 25,
): Promise<{ candidates: DemoCleanupCandidate[]; error: string | null }> {
  const normalizedLimit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(Math.floor(requestedLimit), 100))
    : 25;
  const result = await callDemoRpc<DemoCleanupRow>("claim_expired_demo_cleanup", {
    p_limit: normalizedLimit,
  });
  if (result.error) return { candidates: [], error: result.error };

  return {
    candidates: result.rows
      .filter((row) => Boolean(row.session_id))
      .map((row) => ({
        sessionId: row.session_id,
        authUserId: row.auth_user_id ?? null,
        workspaceId: row.workspace_id ?? null,
      })),
    error: null,
  };
}

export async function completeDemoCleanup(input: {
  sessionId: string;
  success: boolean;
  errorCode?: string | null;
}): Promise<{ ok: boolean; error: string | null }> {
  const result = await callDemoRpc<boolean>("complete_demo_cleanup", {
    p_session_id: input.sessionId,
    p_success: input.success,
    p_error_code: input.errorCode?.slice(0, 200) ?? null,
  });
  if (result.error) return { ok: false, error: result.error };
  if (result.rows[0] !== true) {
    return {
      ok: false,
      error: "Cleanup-Status konnte nicht aktualisiert werden.",
    };
  }
  return { ok: true, error: null };
}
