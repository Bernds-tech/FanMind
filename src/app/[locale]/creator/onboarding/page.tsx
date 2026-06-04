import SiteNav from "@/components/SiteNav";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { isLocale, type Locale } from "@/i18n/config";
import { getPageContent } from "@/i18n/pageContent";

function resolveLocale(value: string): Locale {
  return isLocale(value) ? value : "de";
}

const steps = [
  "Create profile",
  "Describe fan club",
  "Define membership tiers",
  "Prepare exclusive content",
  "Share invite link"
];

export default async function LocalizedCreatorOnboardingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const content = getPageContent(locale);

  return (
    <main>
      <div className="page-shell">
        <SiteNav active="Creator" locale={locale} />
        <LanguageSwitcher current={locale} />

        <section>
          <div className="badge">Creator Onboarding</div>
          <h1>{content.onboardingTitle}</h1>
          <p className="lead">{content.onboardingText}</p>
        </section>

        <section className="grid">
          {steps.map((step, index) => (
            <article className="card" key={step}>
              <div className="badge">Step {index + 1}</div>
              <h3>{step}</h3>
              <p>This will become a guided setup step in the product version.</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
