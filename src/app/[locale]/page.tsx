import LocalizedLanding from "@/components/LocalizedLanding";
import { isLocale, type Locale } from "@/i18n/config";

function resolveLocale(value: string): Locale {
  return isLocale(value) ? value : "de";
}

export default async function LocalizedHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);

  return <LocalizedLanding locale={locale} />;
}
