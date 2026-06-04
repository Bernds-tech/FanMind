import SiteNav from "@/components/SiteNav";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getLandingContent } from "@/i18n/landingContent";
import { getDictionary } from "@/i18n/dictionaries";
import { type Locale } from "@/i18n/config";

type LocalizedLandingProps = {
  locale: Locale;
};

function localizedPath(locale: Locale, path: `/${string}`) {
  return locale === "de" ? path : `/${locale}${path}`;
}

export default function LocalizedLanding({ locale }: LocalizedLandingProps) {
  const t = getDictionary(locale);
  const landing = getLandingContent(locale);

  return (
    <main>
      <div className="page-shell">
        <SiteNav locale={locale} />
        <LanguageSwitcher current={locale} />

        <section className="hero">
          <div>
            <div className="badge">{landing.mvpBadge}</div>
            <div className="badge">{t.productBadge}</div>
            <h1>{t.heroTitle}</h1>
            <p className="lead">{t.heroText}</p>
            <div className="actions">
              <a className="button primary" href={localizedPath(locale, "/demo")}>{t.navDemo}</a>
              <a className="button" href={localizedPath(locale, "/pricing")}>{t.navPricing}</a>
              <a className="button" href={localizedPath(locale, "/creator/demo")}>{t.navCreator}</a>
            </div>
          </div>

          <aside className="hero-card" aria-label={landing.exampleProfileAria}>
            <div className="profile-head">
              <div className="avatar" />
              <div>
                <div className="profile-title">{landing.exampleProfileName}</div>
                <div className="profile-subtitle">{landing.exampleProfileSubtitle}</div>
              </div>
            </div>
            {landing.clubAreas.map((area) => (
              <div className="post" key={area.label}>
                <small>{area.label}</small>
                <p>{area.text}</p>
              </div>
            ))}
          </aside>
        </section>

        <section className="section">
          <h2>{landing.whyTitle}</h2>
          <p className="lead">{landing.whyText}</p>
          <div className="grid">
            {landing.whyCards.map((reason) => (
              <article className="card" key={reason.title}>
                <h3>{reason.title}</h3>
                <p>{reason.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <h2>{landing.modulesTitle}</h2>
          <p className="lead">{landing.modulesText}</p>
          <div className="grid">
            {landing.moduleCards.map((module) => (
              <article className="card" key={module.title}>
                <h3>{module.title}</h3>
                <p>{module.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <h2>{landing.packagesTitle}</h2>
          <p className="lead">{landing.packagesText}</p>
          <div className="grid">
            {landing.creatorPackages.map((plan) => (
              <article className="card" key={plan.name}>
                <div className="badge">{landing.creatorPackageBadge}</div>
                <h3>{plan.name}</h3>
                <h2>{plan.price}</h2>
                <p>{plan.subtitle}</p>
                <ul>
                  {plan.features.slice(0, 5).map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="grid">
            {landing.fanMemberships.map((plan) => (
              <article className="card" key={plan.name}>
                <div className="badge">{landing.fanMembershipBadge}</div>
                <h3>{plan.name}</h3>
                <h2>{plan.price}</h2>
                <p>{plan.subtitle}</p>
                <ul>
                  {plan.features.slice(0, 5).map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="section hero-card">
          <div className="badge">{landing.pilotBadge}</div>
          <h2>{landing.pilotTitle}</h2>
          <p className="lead">{landing.pilotText}</p>
          <div className="actions">
            <a className="button primary" href={localizedPath(locale, "/register")}>{t.navRegister}</a>
            <a className="button" href={localizedPath(locale, "/demo")}>{t.navDemo}</a>
          </div>
        </section>
      </div>
    </main>
  );
}
