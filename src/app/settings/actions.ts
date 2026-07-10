"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  updateSupabaseServerUserMetadata,
  updateWorkspaceProfileSettings,
} from "@/lib/supabase/server";
import { FANMIND_LOCALE_COOKIE, localeCookieOptions } from "@/lib/workspaceLocale";
import {
  FANMIND_BRIGHTNESS_COOKIE,
  getPreferenceMetadata,
  normalizeFanMindBrightness,
  preferenceCookieOptions,
} from "@/lib/userPreferences";

function cleanText(formData: FormData, key: string, maxLength: number, required = false): { value: string | null; error: string | null } {
  const raw = formData.get(key);
  const value = typeof raw === "string" ? raw.trim().replace(/\s+/g, " ") : "";
  if (!value) return required ? { value: null, error: `${key} ist erforderlich.` } : { value: null, error: null };
  if (value.length > maxLength) return { value: null, error: `${key} darf maximal ${maxLength} Zeichen haben.` };
  return { value, error: null };
}

export async function saveAppearancePreferences(formData: FormData) {
  const { data } = await getSupabaseServerUser();
  if (!data.user) redirect("/login");

  const locale = formData.get("locale") === "en" ? "en" : "de";
  const brightness = normalizeFanMindBrightness(formData.get("brightness"));
  const cookieStore = await cookies();

  cookieStore.set(FANMIND_LOCALE_COOKIE, locale, localeCookieOptions());
  cookieStore.set(FANMIND_BRIGHTNESS_COOKIE, String(brightness), preferenceCookieOptions());

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

export async function saveProfileSettings(formData: FormData) {
  const { data } = await getSupabaseServerUser();
  if (!data.user) redirect("/login");

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  if (!workspaceResult.workspace) {
    redirect(`/settings/profile?profile_error=${encodeURIComponent(workspaceResult.error?.message ?? "Workspace konnte nicht geladen werden.")}`);
  }

  const fields = {
    displayName: cleanText(formData, "displayName", 120),
    phone: cleanText(formData, "phone", 40),
    roleAudience: cleanText(formData, "roleAudience", 120),
    workspaceName: cleanText(formData, "workspaceName", 120, true),
    organizationName: cleanText(formData, "organizationName", 160),
    streetAddress: cleanText(formData, "streetAddress", 180),
    postalCode: cleanText(formData, "postalCode", 24),
    city: cleanText(formData, "city", 100),
    country: cleanText(formData, "country", 80),
    vatId: cleanText(formData, "vatId", 40),
    taxNumber: cleanText(formData, "taxNumber", 60),
    companyRegisterNumber: cleanText(formData, "companyRegisterNumber", 80),
    companyRegisterCourt: cleanText(formData, "companyRegisterCourt", 120),
  };

  const validationError = Object.values(fields).find((field) => field.error)?.error;
  if (validationError || !fields.workspaceName.value) {
    redirect(`/settings/profile?profile_error=${encodeURIComponent(validationError ?? "Workspace-Name ist erforderlich.")}`);
  }

  const result = await updateWorkspaceProfileSettings(data.user, workspaceResult.workspace.id, {
    displayName: fields.displayName.value,
    phone: fields.phone.value,
    roleAudience: fields.roleAudience.value,
    workspaceName: fields.workspaceName.value,
    organizationName: fields.organizationName.value,
    streetAddress: fields.streetAddress.value,
    postalCode: fields.postalCode.value,
    city: fields.city.value,
    country: fields.country.value,
    vatId: fields.vatId.value,
    taxNumber: fields.taxNumber.value,
    companyRegisterNumber: fields.companyRegisterNumber.value,
    companyRegisterCourt: fields.companyRegisterCourt.value,
  });

  const search = result.error ? `profile_error=${encodeURIComponent(result.error.message)}` : "profile_saved=1";
  redirect(`/settings/profile?${search}`);
}
