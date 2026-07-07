"use client";

import { useEffect } from "react";
import type { FanMindLanguage } from "@/lib/fanmindCopy";
import type { FanMindBrightness } from "@/lib/userPreferences";
import { getThemeClass } from "@/lib/userPreferences";

const LOCALE_STORAGE_KEY = "fanmind_locale";
const BRIGHTNESS_STORAGE_KEY = "fanmind_brightness";

export function UserPreferenceFallback({
  locale,
  brightness,
}: {
  locale: FanMindLanguage;
  brightness: FanMindBrightness;
}) {
  useEffect(() => {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    localStorage.setItem(BRIGHTNESS_STORAGE_KEY, brightness);
    document.documentElement.lang = locale;
    document.documentElement.classList.remove(
      getThemeClass("standard"),
      getThemeClass("brighter"),
      getThemeClass("light"),
    );
    document.documentElement.classList.add(getThemeClass(brightness));
  }, [brightness, locale]);

  return null;
}
