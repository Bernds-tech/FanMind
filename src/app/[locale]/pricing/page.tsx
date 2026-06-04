import SiteNav from "@/components/SiteNav";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { isLocale, type Locale } from "@/i18n/config";
import { creatorPackages, fanMemberships, pricingNotice } from "@/data/pricing";

function resolveLocale(value: string): Locale {
  return isLocale(value) ? value : "de";
}

export default async function LocalizedPricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const prefix = locale === "de" ? "" : `/${locale}`;

  return (
    <main>
      <div className="page-shell">
        <SiteNav active="Pricing" locale={locale} />
        <LanguageSwitcher current={locale} />

        <section>
          <div className="badge">FanMind Agency Pricing</div>
          <h1>Packages for managed profiles, fan memory and better follow-up work.</h1>
          <p className="lead">
            FanMind starts as an assistant for agencies and teams that manage multiple profiles and want to structure fan conversations more professionally.
          </p>
        </section>

        <section className="section hero-card">
          <div className="badge">Human-in-control principle</div>
          <h2>The human remains the decision maker.</h2>
          <p className="lead">{pricingNotice}</p>
        </section>

        <section className="section">
          <h2>FanMind packages</h2>
          <p className="lead">These packages are designed for agencies, teams and organizations with managed profiles.</p>
          <div className="grid">
            {creatorPackages.map((plan) => (
              <article className="card" key={plan.name}>
                <div className="badge">{plan.name}</div>
                <h2>{plan.price}</h2>
                <p>{plan.subtitle}</p>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <a className="button" href={`${prefix}/register`}>Request pilot</a>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <h2>How FanMind works</h2>
          <p className="lead">At launch, FanMind focuses on preparation, overview and control instead of automatic sending.</p>
          <div className="grid">
            {fanMemberships.map((plan) => (
              <article className="card" key={plan.name}>
                <div className="badge">Principle</div>
                <h3>{plan.name}</h3>
                <h2>{plan.price}</h2>
                <p>{plan.subtitle}</p>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <a className="button" href={`${prefix}/demo`}>Open demo</a>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
