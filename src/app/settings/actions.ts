"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getSupabaseServerUser,
  updateSupabaseServerUserMetadata,
} from "@/lib/supabase/server";
import { FANMIND_LOCALE_COOKIE, localeCookieOptions } from "@/lib/workspaceLocale";
import {
  FANMIND_BRIGHTNESS_COOKIE,
  getPreferenceMetadata,
  normalizeFanMindBrightness,
  preferenceCookieOptions,
} from "@/lib/userPreferences";

export async function saveAppearancePreferences(formData: FormData) {
  const { data } = await getSupabaseServerUser();
  if (!data.user) redirect("/login");

  const locale = formData.get("locale") === "en" ? "en" : "de";
  const brightness = normalizeFanMindBrightness(formData.get("brightness"));
  const cookieStore = await cookies();

  cookieStore.set(FANMIND_LOCALE_COOKIE, locale, localeCookieOptions());
  cookieStore.set(FANMIND_BRIGHTNESS_COOKIE, brightness, preferenceCookieOptions());

  const metadata = getPreferenceMetadata({
    currentMetadata: data.user.user_metadata,
    locale,
    brightness,
  });
  const result = await updateSupabaseServerUserMetadata(metadata);

  const returnTo = String(formData.get("returnTo") || "/settings");
  const safeReturnTo = returnTo.startsWith("/settings") ? returnTo : "/settings";
  const search = result.error ? `?preferences_error=${encodeURIComponent(result.error.message)}` : "?preferences_saved=1";
  redirect(`${safeReturnTo}${search}`);
}
