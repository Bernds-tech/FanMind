import { NextResponse } from "next/server";
import { isPlatformAdminEmail } from "@/lib/admin";
import { markAdminNotificationRead } from "@/lib/operations";
import { getSupabaseServerUser } from "@/lib/supabase/server";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const { data } = await getSupabaseServerUser();
  if (!data.user) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  if (!isPlatformAdminEmail(data.user.email)) return NextResponse.json({ error: "platform_admin_required" }, { status: 403 });
  const { id } = await context.params;
  const payload = await request.json().catch(() => ({}));
  const result = await markAdminNotificationRead(id, data.user.id, payload?.acknowledge === true);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true });
}
