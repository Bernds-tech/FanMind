import { NextResponse } from "next/server";
import { signOutSupabaseServerSession } from "@/lib/supabase/server";
import { SUPABASE_ACCESS_TOKEN_COOKIE, SUPABASE_REFRESH_TOKEN_COOKIE } from "@/lib/supabase/config";

export async function POST() {
  await signOutSupabaseServerSession();

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SUPABASE_ACCESS_TOKEN_COOKIE);
  response.cookies.delete(SUPABASE_REFRESH_TOKEN_COOKIE);

  return response;
}
