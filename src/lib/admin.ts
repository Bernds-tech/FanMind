import { redirect } from "next/navigation";
import { getSupabaseServerUser, type SupabaseServerUser } from "@/lib/supabase/server";

const FALLBACK_ADMIN_EMAILS = "fanmind@fanmind.ch,b.guggennberger@gmail.com";

function normalizeEmail(email: string | null | undefined): string {
  return String(email ?? "").trim().toLowerCase();
}

export function getAdminEmails(): string[] {
  const configured = process.env.FANMIND_ADMIN_EMAILS?.trim() || FALLBACK_ADMIN_EMAILS;
  return configured.split(",").map(normalizeEmail).filter(Boolean);
}

export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  const normalizedEmail = normalizeEmail(email);
  return Boolean(normalizedEmail && getAdminEmails().includes(normalizedEmail));
}

export async function requirePlatformAdmin(): Promise<SupabaseServerUser> {
  const { data } = await getSupabaseServerUser();

  if (!data.user) redirect("/login");
  if (!isPlatformAdminEmail(data.user.email)) redirect("/dashboard");

  return data.user;
}
