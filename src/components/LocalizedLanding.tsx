import SiteNav from "@/components/SiteNav";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { landingModules, whyFanMind } from "@/data/landing";
import { creatorPackages, fanMemberships } from "@/data/pricing";
import { getDictionary } from "@/i18n/dictionaries";
import { type Locale } from "@/i18n/config";

type LocalizedLandingProps = {
  locale: Locale;
};

const miaClubAreas = [
  {
    label: "Kostenlos / Free",
    text: "Öffentliche Updates, Einblicke und Community-Teaser für neue Fans."
  },
  {
    label: "Club-Mitglied / Member",
    text: "Exklusive Challenges, Beiträge und Vorteile für aktive Unterstützer."
  },
  {
    label: "Premium-Fan / Premium",
    text: "Persönlichere Q&A-Formate, Premium-Momente und besondere Aktionen."
  }
];

function localizedPath(locale: Locale, path: `/${string}`) {
  return locale === "de" ? path : `/${locale}${path}`;
}

export default function LocalizedLanding({ locale }: LocalizedLandingProps) {
  const t = getDictionary(locale);

  return (
    <main>
      <div className="page-shell">
        <SiteNav locale={locale} />
        <LanguageSwitcher current={locale} />

        <section className="hero">
          <div>
            <div className="badge">FanMind MVP Demo 0.2</div>
            <div className="badge">{t.productBadge}</div>
            <h1>{t.heroTitle}</h1>
            <p className="lead">{t.heroText}</p>
            <div className="actions">
              <a className="button primary" href={localizedPath(locale, "/demo")}>{t.navDemo}</a>
              <a className="button" href={localizedPath(locale, "/pricing")}>{t.navPricing}</a>
              <a className="button" href={localizedPath(locale, "/creator/demo")}>{t.navCreator}</a>
            </div>
          </div>

          <aside className="hero-card" aria-label="Mia Active Club Beispielprofil">
            <div className="profile-head">
              <div className="avatar" />
              <div>
                <div className="profile-title">Mia Active Club</div>
                <div className="profile-subtitle">Fitness, Motivation, Community</div>
              </div>
            </div>
            {miaClubAreas.map((area) => (
              <div className="post" key={area.label}>
                <small>{area.label}</small>
                <p>{area.text}</p>
              </div>
            ))}
          </aside>
        </section>

        <section className="section">
          <h2>Warum FanMind?</h2>
          <p className="lead">
            FanMind ist eine seriöse europäische Direct-to-Fan-Plattform für Menschen, Clubs und Marken mit echter Community.
          </p>
          <div className="grid">
            {whyFanMind.map((reason) => (
              <article className="card" key={reason.title}>
                <h3>{reason.title}</h3>
                <p>{reason.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <h2>FanMind Produktmodule</h2>
          <p className="lead">
            Die MVP Demo 0.2 zeigt die wichtigsten Bausteine für Profile, Mitgliedschaften und Steuerung an einem Ort.
          </p>
          <div className="grid">
            {landingModules.map((module) => (
              <article className="card" key={module.title}>
                <h3>{module.title}</h3>
                <p>{module.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <h2>Pakete und Mitgliedschaften</h2>
          <p className="lead">
            FanMind trennt Anbieter-Pakete klar von Fan-Mitgliedschaften. Die Preise sind Demo-Richtwerte für den MVP.
          </p>
          <div className="grid">
            {creatorPackages.map((plan) => (
              <article className="card" key={plan.name}>
                <div className="badge">Anbieter-Paket</div>
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
            {fanMemberships.map((plan) => (
              <article className="card" key={plan.name}>
                <div className="badge">Fan-Mitgliedschaft</div>
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
          <div className="badge">Pilotkunden gesucht</div>
          <h2>FanMind wird aktuell als MVP aufgebaut.</h2>
          <p className="lead">
            Erste Anbieter können als Pilotkunden Feedback geben und die Plattform aktiv mitgestalten.
          </p>
          <div className="actions">
            <a className="button primary" href={localizedPath(locale, "/register")}>{t.navRegister}</a>
            <a className="button" href={localizedPath(locale, "/demo")}>{t.navDemo}</a>
          </div>
        </section>
      </div>
    </main>
  );
}
