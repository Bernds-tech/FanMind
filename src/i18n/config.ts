export const locales = ["de", "en", "ro", "es"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "de";

export const localeLabels: Record<Locale, string> = {
  de: "Deutsch",
  en: "Englisch",
  ro: "Romana",
  es: "Espanol"
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
