import SiteNav from "@/components/SiteNav";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getDictionary } from "@/i18n/dictionaries";
import { type Locale } from "@/i18n/config";

type LocalizedLandingProps = {
  locale: Locale;
};

const modules = [
  {
    title: "Creator Profile",
    text: "Public profiles, fan club positioning and exclusive posts."
  },
  {
    title: "Memberships",
    text: "Free, member and premium tiers for direct monetization."
  },
  {
    title: "Dashboard",
    text: "A first cockpit for fans, revenue, content and community signals."
  }
];

export default function LocalizedLanding({ locale }: LocalizedLandingProps) {
  const t = getDictionary(locale);
  const prefix = locale === "de" ? "" : `/${locale}`;

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
              <a className="button primary" href={`${prefix}/demo`}>{t.navDemo}</a>
              <a className="button" href={`${prefix}/pricing`}>{t.navPricing}</a>
              <a className="button" href={`${prefix}/creator/demo`}>{t.navCreator}</a>
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
              <p>Public fan updates and community teasers.</p>
            </div>
            <div className="post">
              <small>MEMBERS</small>
              <p>Exclusive challenges, posts and member benefits.</p>
            </div>
            <div className="post">
              <small>PREMIUM</small>
              <p>Personal Q&A and premium fan moments.</p>
            </div>
          </aside>
        </section>

        <section className="section">
          <h2>FanMind MVP modules</h2>
          <p className="lead">The first demo combines the most important direct-to-fan building blocks.</p>
          <div className="grid">
            {modules.map((module) => (
              <article className="card" key={module.title}>
                <h3>{module.title}</h3>
                <p>{module.text}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
