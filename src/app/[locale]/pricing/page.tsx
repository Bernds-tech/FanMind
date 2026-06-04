import SiteNav from "@/components/SiteNav";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { isLocale, type Locale } from "@/i18n/config";
import { getPageContent } from "@/i18n/pageContent";
import { creatorPackages, fanMemberships } from "@/data/pricing";

function resolveLocale(value: string): Locale {
  return isLocale(value) ? value : "de";
}

export default async function LocalizedPricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const content = getPageContent(locale);
  const prefix = locale === "de" ? "" : `/${locale}`;

  return (
    <main>
      <div className="page-shell">
        <SiteNav active="Pricing" locale={locale} />
        <LanguageSwitcher current={locale} />

        <section>
          <div className="badge">FanMind Pricing</div>
          <h1>{content.pricingTitle}</h1>
          <p className="lead">{content.pricingText}</p>
        </section>

        <section className="section">
          <h2>Creator packages</h2>
          <p className="lead">Packages for people, clubs and brands that want to run a fan club on FanMind.</p>
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
                <a className="button" href={`${prefix}/register`}>{content.selectDemo}</a>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <h2>Fan memberships</h2>
          <p className="lead">Memberships that fans can buy from a creator, club or brand.</p>
          <div className="grid">
            {fanMemberships.map((plan) => (
              <article className="card" key={plan.name}>
                <div className="badge">{plan.name}</div>
                <h2>{plan.price}</h2>
                <p>{plan.subtitle}</p>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <a className="button" href={`${prefix}/creator/demo`}>{content.open}</a>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
