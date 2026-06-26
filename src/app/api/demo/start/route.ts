import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { SUPABASE_ACCESS_TOKEN_COOKIE, SUPABASE_REFRESH_TOKEN_COOKIE } from "@/lib/supabase/config";
import { createTemporaryDemoWorkspace, deleteExpiredTemporaryDemo } from "@/lib/supabase/server";
import { getSupabaseAuthUrl, getSupabaseHeaders } from "@/lib/supabase/config";
import { FANMIND_LOCALE_COOKIE, localeCookieOptions, normalizeWorkspaceLocale } from "@/lib/workspaceLocale";

const isProduction = process.env.NODE_ENV === "production";
const DEMO_DURATION_MS = 60 * 60 * 1000;

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

function randomToken(byteLength = 24): string {
  return randomBytes(byteLength).toString("base64url");
}

async function parseError(response: Response): Promise<string> {
  const payload = (await response.json().catch(() => null)) as { message?: string; msg?: string; error_description?: string; error?: string } | null;
  return payload?.message ?? payload?.msg ?? payload?.error_description ?? payload?.error ?? "Demo konnte nicht vorbereitet werden.";
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { locale?: string; lang?: string } | null;
  const locale = normalizeWorkspaceLocale(body?.locale ?? body?.lang ?? request.nextUrl.searchParams.get("lang"));
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: "Demo-Start ist serverseitig noch nicht konfiguriert." }, { status: 500 });
  }

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
    return NextResponse.json({ error: await parseError(createUserResponse) }, { status: 500 });
  }

  const createdUser = (await createUserResponse.json()) as SupabaseAdminUserResponse;
  const userId = createdUser.id ?? createdUser.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Demo-User wurde ohne ID erstellt." }, { status: 500 });
  }

  const workspaceResult = await createTemporaryDemoWorkspace({ userId, userEmail: email, locale });
  if (workspaceResult.error) {
    await fetch(getSupabaseAuthUrl(`/admin/users/${encodeURIComponent(userId)}`), { method: "DELETE", headers: getSupabaseHeaders(serviceRoleKey), cache: "no-store" }).catch(() => undefined);
    return NextResponse.json({ error: workspaceResult.error.message }, { status: 500 });
  }

  const tokenResponse = await fetch(getSupabaseAuthUrl("/token?grant_type=password"), {
    method: "POST",
    headers: getSupabaseHeaders(),
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  if (!tokenResponse.ok) {
    if (workspaceResult.workspace) await deleteExpiredTemporaryDemo({ id: userId, email, user_metadata: { fanmind_demo: true, demo_type: "temporary", demo_expires_at: now.toISOString() } }, { ...workspaceResult.workspace, role: "owner" });
    return NextResponse.json({ error: await parseError(tokenResponse) }, { status: 500 });
  }

  const session = (await tokenResponse.json()) as SupabaseTokenResponse;
  if (!session.access_token) {
    return NextResponse.json({ error: "Supabase hat keine gültige Demo-Session zurückgegeben." }, { status: 500 });
  }

  const redirectTo = locale === "en" ? "/dashboard?lang=en" : "/dashboard";
  const response = NextResponse.json({ ok: true, redirectTo });
  response.cookies.set(FANMIND_LOCALE_COOKIE, locale, localeCookieOptions());
  response.cookies.set(SUPABASE_ACCESS_TOKEN_COOKIE, session.access_token, { httpOnly: true, sameSite: "lax", secure: isProduction, path: "/", maxAge: session.expires_in ?? 60 * 60 });
  if (session.refresh_token) {
    response.cookies.set(SUPABASE_REFRESH_TOKEN_COOKIE, session.refresh_token, { httpOnly: true, sameSite: "lax", secure: isProduction, path: "/", maxAge: 60 * 60 });
  }
  return response;
}
