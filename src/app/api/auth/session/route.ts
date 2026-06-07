import { NextRequest, NextResponse } from "next/server";
import { SUPABASE_ACCESS_TOKEN_COOKIE, SUPABASE_REFRESH_TOKEN_COOKIE } from "@/lib/supabase/config";

const isProduction = process.env.NODE_ENV === "production";

function clearSessionCookies(response: NextResponse): NextResponse {
  response.cookies.delete(SUPABASE_ACCESS_TOKEN_COOKIE);
  response.cookies.delete(SUPABASE_REFRESH_TOKEN_COOKIE);

  return response;
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as { accessToken?: string; refreshToken?: string; expiresIn?: number } | null;

  if (!payload?.accessToken) {
    return NextResponse.json({ error: "accessToken fehlt." }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  const accessMaxAge = typeof payload.expiresIn === "number" && payload.expiresIn > 0 ? payload.expiresIn : 60 * 60;

  response.cookies.set(SUPABASE_ACCESS_TOKEN_COOKIE, payload.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: accessMaxAge,
  });

  if (payload.refreshToken) {
    response.cookies.set(SUPABASE_REFRESH_TOKEN_COOKIE, payload.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}

export async function DELETE() {
  return clearSessionCookies(NextResponse.json({ ok: true }));
}
