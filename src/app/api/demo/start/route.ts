import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  SUPABASE_ACCESS_TOKEN_COOKIE,
  SUPABASE_REFRESH_TOKEN_COOKIE,
  getSupabaseAuthUrl,
  getSupabaseHeaders,
} from "@/lib/supabase/config";
import {
  createTemporaryDemoWorkspace,
  deleteExpiredTemporaryDemo,
  getSupabaseServerUser,
} from "@/lib/supabase/server";
import {
  DEMO_BROWSER_COOKIE,
  activatePublicDemoStart,
  claimPublicDemoStart,
  failPublicDemoStart,
  getTrustedClientIp,
  hashDemoIdentifier,
  publicDemoEnabled,
  verifyDemoTurnstile,
} from "@/lib/demoProtection";
import {
  getTemporaryDemoExpiryState,
  isTemporaryDemoUser,
} from "@/lib/demoMode";
import {
  FANMIND_LOCALE_COOKIE,
  localeCookieOptions,
  normalizeWorkspaceLocale,
} from "@/lib/workspaceLocale";

const isProduction = process.env.NODE_ENV === "production";
const DEMO_DURATION_MS = 60 * 60 * 1000;
const DEMO_BROWSER_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

type SupabaseAdminUserResponse = {
  id?: string;
  email?: string;
  user?: { id: string; email?: string };
};

type SupabaseTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: { id: string; email?: string };
  error?: string;
  error_description?: string;
};

type DemoStartBody = {
  locale?: string;
  lang?: string;
  turnstileToken?: string;
};

function randomToken(byteLength = 24): string {
  return randomBytes(byteLength).toString("base64url");
}

async function parseError(response: Response): Promise<string> {
  const payload = (await response.json().catch(() => null)) as {
    message?: string;
    msg?: string;
    error_description?: string;
    error?: string;
  } | null;

  return (
    payload?.message ??
    payload?.msg ??
    payload?.error_description ??
    payload?.error ??
    "Demo konnte nicht vorbereitet werden."
  );
}

function browserCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    maxAge: DEMO_BROWSER_COOKIE_MAX_AGE,
  };
}

function demoJson(
  body: Record<string, unknown>,
  status: number,
  browserToken: string,
  retryAfterSeconds?: number,
) {
  const response = NextResponse.json(body, { status });
  response.cookies.set(
    DEMO_BROWSER_COOKIE,
    browserToken,
    browserCookieOptions(),
  );

  if (retryAfterSeconds && retryAfterSeconds > 0) {
    response.headers.set("Retry-After", String(retryAfterSeconds));
  }

  return response;
}

async function cleanupCreatedDemo(input: {
  userId: string;
  email: string;
  workspace: NonNullable<
    Awaited<ReturnType<typeof createTemporaryDemoWorkspace>>["workspace"]
  >;
}) {
  return deleteExpiredTemporaryDemo(
    {
      id: input.userId,
      email: input.email,
      user_metadata: {
        fanmind_demo: true,
        demo_type: "temporary",
        demo_expires_at: new Date(0).toISOString(),
      },
    },
    { ...input.workspace, role: "owner" },
  );
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as DemoStartBody | null;
  const locale = normalizeWorkspaceLocale(
    body?.locale ?? body?.lang ?? request.nextUrl.searchParams.get("lang"),
  );

  const existingUserResult = await getSupabaseServerUser();
  const existingUser = existingUserResult.data.user;
  if (existingUser && isTemporaryDemoUser(existingUser)) {
    const expiry = getTemporaryDemoExpiryState(existingUser);
    if (!expiry.isExpired) {
      return NextResponse.json({
        ok: true,
        reused: true,
        redirectTo: "/dashboard",
        expiresAt: expiry.expiresAt.toISOString(),
      });
    }
  }

  const suppliedBrowserToken = request.cookies
    .get(DEMO_BROWSER_COOKIE)
    ?.value?.trim();
  const browserToken =
    suppliedBrowserToken && suppliedBrowserToken.length >= 32
      ? suppliedBrowserToken
      : randomToken(32);

  if (!publicDemoEnabled()) {
    return demoJson(
      {
        error:
          "Der öffentliche temporäre Demo-Start ist derzeit deaktiviert. Nutze den bereitgestellten Demo-Zugang oder registriere einen eigenen Workspace.",
        code: "public_demo_disabled",
      },
      503,
      browserToken,
    );
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return demoJson(
      {
        error: "Demo-Start ist serverseitig noch nicht konfiguriert.",
        code: "demo_not_configured",
      },
      503,
      browserToken,
    );
  }

  const clientIp = getTrustedClientIp(request);
  const ipHash = hashDemoIdentifier("ip", clientIp);
  const browserHash = hashDemoIdentifier("browser", browserToken);

  if (!ipHash || !browserHash) {
    return demoJson(
      {
        error:
          "Der Demo-Schutz ist serverseitig noch nicht vollständig konfiguriert.",
        code: "demo_protection_not_configured",
      },
      503,
      browserToken,
    );
  }

  const turnstile = await verifyDemoTurnstile({
    token: body?.turnstileToken,
    remoteIp: clientIp,
  });
  if (!turnstile.ok) {
    return demoJson(
      {
        error: turnstile.error ?? "Bot-Schutz konnte nicht bestätigt werden.",
        code: "turnstile_failed",
      },
      400,
      browserToken,
    );
  }

  const claim = await claimPublicDemoStart({ ipHash, browserHash });
  if (claim.error) {
    console.error("Public demo reservation failed", {
      decision: claim.decision,
      error: claim.error,
    });
    return demoJson(
      {
        error: "Der Demo-Start konnte gerade nicht reserviert werden.",
        code: "demo_reservation_failed",
      },
      503,
      browserToken,
      claim.retryAfterSeconds,
    );
  }

  if (claim.decision === "existing") {
    return demoJson(
      {
        error:
          "Für diesen Browser läuft bereits eine temporäre Demo. Öffne die bestehende Demo im ursprünglichen Browserfenster oder versuche es nach Ablauf erneut.",
        code: "demo_already_active",
      },
      429,
      browserToken,
      claim.retryAfterSeconds,
    );
  }

  if (claim.decision === "capacity") {
    return demoJson(
      {
        error:
          "Alle öffentlichen Demo-Plätze sind derzeit belegt. Bitte versuche es in wenigen Minuten erneut.",
        code: "demo_capacity_reached",
      },
      503,
      browserToken,
      claim.retryAfterSeconds,
    );
  }

  if (
    claim.decision === "blocked_ip_short" ||
    claim.decision === "blocked_ip_day" ||
    claim.decision === "blocked_browser_day"
  ) {
    return demoJson(
      {
        error:
          "Das Demo-Limit wurde erreicht. Bitte nutze deine bestehende Demo oder versuche es später erneut.",
        code: claim.decision,
      },
      429,
      browserToken,
      claim.retryAfterSeconds,
    );
  }

  if (claim.decision !== "reserved" || !claim.reservationId) {
    return demoJson(
      {
        error: "Der Demo-Start wurde aus Sicherheitsgründen abgebrochen.",
        code: "invalid_demo_claim",
      },
      503,
      browserToken,
      claim.retryAfterSeconds,
    );
  }

  const reservationId = claim.reservationId;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + DEMO_DURATION_MS);
  const email = `demo+${randomToken(12)}@fanmind.local`;
  const password = `${randomToken(18)}aA1!`;

  const createUserResponse = await fetch(getSupabaseAuthUrl("/admin/users"), {
    method: "POST",
    headers: getSupabaseHeaders(serviceRoleKey),
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        fanmind_demo: true,
        demo_type: "temporary",
        demo_started_at: now.toISOString(),
        demo_expires_at: expiresAt.toISOString(),
        demo_workspace_name: "FanMind Demo Workspace",
        display_name: locale === "en" ? "Demo User" : "Demo Nutzer",
        fanmind_locale: locale,
        locale,
      },
    }),
    cache: "no-store",
  });

  if (!createUserResponse.ok) {
    await failPublicDemoStart(reservationId, "auth_user_create_failed");
    return demoJson(
      {
        error: await parseError(createUserResponse),
        code: "auth_user_create_failed",
      },
      500,
      browserToken,
    );
  }

  const createdUser =
    (await createUserResponse.json()) as SupabaseAdminUserResponse;
  const userId = createdUser.id ?? createdUser.user?.id;
  if (!userId) {
    await failPublicDemoStart(reservationId, "auth_user_id_missing");
    return demoJson(
      {
        error: "Demo-User wurde ohne ID erstellt.",
        code: "auth_user_id_missing",
      },
      500,
      browserToken,
    );
  }

  const workspaceResult = await createTemporaryDemoWorkspace({
    userId,
    userEmail: email,
    locale,
  });

  if (workspaceResult.error || !workspaceResult.workspace) {
    await fetch(getSupabaseAuthUrl(`/admin/users/${encodeURIComponent(userId)}`), {
      method: "DELETE",
      headers: getSupabaseHeaders(serviceRoleKey),
      cache: "no-store",
    }).catch(() => undefined);
    await failPublicDemoStart(reservationId, "workspace_create_failed");

    return demoJson(
      {
        error:
          workspaceResult.error?.message ??
          "Demo-Workspace konnte nicht erstellt werden.",
        code: "workspace_create_failed",
      },
      500,
      browserToken,
    );
  }

  const tokenResponse = await fetch(
    getSupabaseAuthUrl("/token?grant_type=password"),
    {
      method: "POST",
      headers: getSupabaseHeaders(),
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    },
  );

  if (!tokenResponse.ok) {
    await cleanupCreatedDemo({
      userId,
      email,
      workspace: workspaceResult.workspace,
    });
    await failPublicDemoStart(reservationId, "session_create_failed");

    return demoJson(
      {
        error: await parseError(tokenResponse),
        code: "session_create_failed",
      },
      500,
      browserToken,
    );
  }

  const session = (await tokenResponse.json()) as SupabaseTokenResponse;
  if (!session.access_token) {
    await cleanupCreatedDemo({
      userId,
      email,
      workspace: workspaceResult.workspace,
    });
    await failPublicDemoStart(reservationId, "session_access_token_missing");

    return demoJson(
      {
        error: "Supabase hat keine gültige Demo-Session zurückgegeben.",
        code: "session_access_token_missing",
      },
      500,
      browserToken,
    );
  }

  const activated = await activatePublicDemoStart({
    reservationId,
    authUserId: userId,
    workspaceId: workspaceResult.workspace.id,
    expiresAt,
  });

  if (!activated) {
    await cleanupCreatedDemo({
      userId,
      email,
      workspace: workspaceResult.workspace,
    });
    await failPublicDemoStart(reservationId, "reservation_activation_failed");

    return demoJson(
      {
        error: "Die Demo-Reservierung konnte nicht aktiviert werden.",
        code: "reservation_activation_failed",
      },
      500,
      browserToken,
    );
  }

  const response = demoJson(
    {
      ok: true,
      redirectTo: "/dashboard",
      expiresAt: expiresAt.toISOString(),
    },
    200,
    browserToken,
  );
  response.cookies.set(
    FANMIND_LOCALE_COOKIE,
    locale,
    localeCookieOptions(),
  );
  response.cookies.set(SUPABASE_ACCESS_TOKEN_COOKIE, session.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: Math.min(session.expires_in ?? 60 * 60, 60 * 60),
  });

  if (session.refresh_token) {
    response.cookies.set(SUPABASE_REFRESH_TOKEN_COOKIE, session.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
      maxAge: 60 * 60,
    });
  }

  return response;
}
