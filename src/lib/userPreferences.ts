import type { SupabaseServerUser } from "@/lib/supabase/server";
import type { FanMindLanguage } from "@/lib/fanmindCopy";

export type FanMindBrightness = "standard" | "brighter" | "light";

export const FANMIND_BRIGHTNESS_COOKIE = "fanmind_brightness";

export const fanmindBrightnessOptions: FanMindBrightness[] = ["standard", "brighter", "light"];

export function normalizeFanMindBrightness(value: unknown): FanMindBrightness {
  return value === "brighter" || value === "light" ? value : "standard";
}

export function getUserMetadataBrightness(
  user?: Pick<SupabaseServerUser, "user_metadata"> | null,
): FanMindBrightness | null {
  const value = user?.user_metadata?.fanmind_brightness;
  return value === "standard" || value === "brighter" || value === "light" ? value : null;
}

export function getThemeClass(brightness: FanMindBrightness): string {
  return `fanmind-theme-${brightness}`;
}

export function preferenceCookieOptions(maxAge = 60 * 60 * 24 * 365) {
  return {
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function getPreferenceMetadata(input: {
  currentMetadata?: Record<string, unknown>;
  locale: FanMindLanguage;
  brightness: FanMindBrightness;
}) {
  return {
    ...(input.currentMetadata ?? {}),
    fanmind_locale: input.locale === "en" ? "en" : "de",
    locale: input.locale === "en" ? "en" : "de",
    fanmind_brightness: normalizeFanMindBrightness(input.brightness),
  };
}
