import SiteNav from "@/components/SiteNav";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { isLocale, type Locale } from "@/i18n/config";
import { getPageContent } from "@/i18n/pageContent";

function resolveLocale(value: string): Locale {
  return isLocale(value) ? value : "de";
}

export default async function LocalizedRegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const content = getPageContent(locale);
  const prefix = locale === "de" ? "" : `/${locale}`;

  return (
    <main>
      <div className="page-shell">
        <SiteNav active="Registrieren" locale={locale} />
        <LanguageSwitcher current={locale} />

        <section className="hero">
          <div>
            <div className="badge">Register Demo</div>
            <h1>{content.registerTitle}</h1>
            <p className="lead">{content.registerText}</p>
          </div>

          <aside className="hero-card">
            <h2>Create account</h2>
            <div className="post">
              <small>ROLE</small>
              <p>Creator or fan</p>
            </div>
            <div className="post">
              <small>PROFILE</small>
              <p>Name, email, category and short description</p>
            </div>
            <a className="button primary" href={`${prefix}/creator/onboarding`}>{content.continueOnboarding}</a>
          </aside>
        </section>
      </div>
    </main>
  );
}
