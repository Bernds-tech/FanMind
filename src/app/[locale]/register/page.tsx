import SiteNav from "@/components/SiteNav";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { isLocale, type Locale } from "@/i18n/config";

function resolveLocale(value: string): Locale {
  return isLocale(value) ? value : "de";
}

export default async function LocalizedRegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const prefix = locale === "de" ? "" : `/${locale}`;

  return (
    <main>
      <div className="page-shell">
        <SiteNav active="Registrieren" locale={locale} />
        <LanguageSwitcher current={locale} />

        <section className="hero">
          <div>
            <div className="badge">Register Demo</div>
            <h1>Start your FanMind club.</h1>
            <p className="lead">Creators will use this flow to create a profile, define fan tiers and launch their club.</p>
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
            <a className="button primary" href={`${prefix}/creator/onboarding`}>Continue onboarding</a>
          </aside>
        </section>
      </div>
    </main>
  );
}
