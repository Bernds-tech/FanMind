import SiteNav from "@/components/SiteNav";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";

function resolveLocale(value: string): Locale {
  return isLocale(value) ? value : "de";
}

export default async function LocalizedHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const t = getDictionary(locale);

  return (
    <main>
      <div className="page-shell">
        <SiteNav locale={locale} />
        <LanguageSwitcher current={locale} />

        <section className="hero">
          <div>
            <div className="badge">{t.productBadge}</div>
            <h1>{t.heroTitle}</h1>
            <p className="lead">{t.heroText}</p>
            <div className="actions">
              <a className="button primary" href={locale === "de" ? "/dashboard" : `/${locale}/dashboard`}>
                {t.ctaPrimary}
              </a>
              <a className="button" href={locale === "de" ? "/creator/demo" : `/${locale}/creator/demo`}>
                {t.ctaSecondary}
              </a>
            </div>
          </div>

          <aside className="hero-card">
            <div className="profile-head">
              <div className="avatar" />
              <div>
                <div className="profile-title">Mia Active Club</div>
                <div className="profile-subtitle">Fitness, Motivation, Community</div>
              </div>
            </div>
            <div className="post">
              <small>FREE</small>
              <p>Welcome to the FanMind demo club.</p>
            </div>
            <div className="post">
              <small>MEMBERS</small>
              <p>Exclusive challenges and member updates.</p>
            </div>
            <div className="post">
              <small>PREMIUM</small>
              <p>Personal Q&A and premium fan moments.</p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
