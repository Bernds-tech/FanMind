"use client";

import { useMemo, useState } from "react";
import dashboardStyles from "../dashboard/dashboard.module.css";
import type { FanMindLanguage } from "@/lib/fanmindCopy";
import type { FanMindBrightness } from "@/lib/userPreferences";
import { wt } from "@/lib/workspaceCopy";

const brightnessSteps: { value: FanMindBrightness; labelDe: string; labelEn: string }[] = [
  { value: "standard", labelDe: "Standard", labelEn: "Standard" },
  { value: "brighter", labelDe: "Heller", labelEn: "Brighter" },
  { value: "light", labelDe: "Hell", labelEn: "Bright" },
];

type SettingsPreferenceFormProps = {
  action: (formData: FormData) => void;
  locale: FanMindLanguage;
  brightness: FanMindBrightness;
};

function getBrightnessIndex(value: FanMindBrightness) {
  const index = brightnessSteps.findIndex((step) => step.value === value);
  return index >= 0 ? index : 0;
}

export function SettingsPreferenceForm({ action, locale, brightness }: SettingsPreferenceFormProps) {
  const [brightnessIndex, setBrightnessIndex] = useState(getBrightnessIndex(brightness));
  const selectedBrightness = brightnessSteps[brightnessIndex] ?? brightnessSteps[0];
  const brightnessLabel = useMemo(
    () => (locale === "en" ? selectedBrightness.labelEn : selectedBrightness.labelDe),
    [locale, selectedBrightness],
  );

  return (
    <form action={action} className={dashboardStyles.preferenceToolbar}>
      <fieldset className={dashboardStyles.compactPreferenceGroup}>
        <legend>{wt(locale, "Sprache")}</legend>
        <div className={dashboardStyles.segmentedLanguageControl}>
          {[
            { value: "de", label: "Deutsch", flag: "🇩🇪" },
            { value: "en", label: "English", flag: "🇬🇧" },
          ].map((option) => (
            <label key={option.value} className={dashboardStyles.languageSegment}>
              <input type="radio" name="locale" value={option.value} defaultChecked={locale === option.value} />
              <span aria-hidden="true">{option.flag}</span>
              <strong>{option.label}</strong>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={`${dashboardStyles.compactPreferenceGroup} ${dashboardStyles.brightnessSliderGroup}`}>
        <legend>{wt(locale, "Helligkeit")}</legend>
        <input type="hidden" name="brightness" value={selectedBrightness.value} />
        <div className={dashboardStyles.sliderHeader}>
          <span>{wt(locale, "Dark-Look")}</span>
          <strong>{brightnessLabel}</strong>
        </div>
        <input
          className={dashboardStyles.brightnessSlider}
          type="range"
          min="0"
          max="2"
          step="1"
          value={brightnessIndex}
          aria-valuetext={brightnessLabel}
          onChange={(event) => setBrightnessIndex(Number(event.currentTarget.value))}
        />
        <div className={dashboardStyles.sliderScale} aria-hidden="true">
          {brightnessSteps.map((step) => <span key={step.value}>{locale === "en" ? step.labelEn : step.labelDe}</span>)}
        </div>
      </fieldset>

      <button type="submit" className={dashboardStyles.primaryButton}>{wt(locale, "Einstellungen speichern")}</button>
    </form>
  );
}
