import { NextResponse } from "next/server";
import { isPlatformAdminEmail } from "@/lib/admin";
import { getRecentAdminNotifications, getUnreadAdminNotificationCount } from "@/lib/operations";
import { getSupabaseServerUser } from "@/lib/supabase/server";

export async function GET() {
  const { data } = await getSupabaseServerUser();
  if (!data.user) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  if (!isPlatformAdminEmail(data.user.email)) return NextResponse.json({ error: "platform_admin_required" }, { status: 403 });
  const [notifications, unread] = await Promise.all([getRecentAdminNotifications(8), getUnreadAdminNotificationCount()]);
  return NextResponse.json({ notifications: notifications.data ?? [], unreadCount: unread.count, error: notifications.error ?? unread.error }, { headers: { "Cache-Control": "no-store" } });
}
