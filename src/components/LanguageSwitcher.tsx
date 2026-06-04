import { localeLabels, locales, type Locale } from "@/i18n/config";

export default function LanguageSwitcher({ current = "de" }: { current?: Locale }) {
  return (
    <div className="nav-links" aria-label="Language switcher">
      {locales.map((locale) => (
        <a key={locale} href={`/${locale}`} aria-current={current === locale ? "page" : undefined}>
          {localeLabels[locale]}
        </a>
      ))}
    </div>
  );
}
