import SiteNav from "@/components/SiteNav";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { isLocale, type Locale } from "@/i18n/config";

function resolveLocale(value: string): Locale {
  return isLocale(value) ? value : "de";
}

const plans = [
  { name: "Free Fan", price: "0 EUR", text: "Public updates and basic community access." },
  { name: "Club Member", price: "9.90 EUR", text: "Exclusive posts, challenges and member updates." },
  { name: "Premium Fan", price: "29.90 EUR", text: "Personal Q&A moments and premium fan benefits." }
];

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
          <div className="badge">FanMind Pricing</div>
          <h1>Membership tiers for recurring revenue.</h1>
          <p className="lead">FanMind lets creators define fan tiers and exclusive benefits for their own fan club.</p>
        </section>

        <section className="grid">
          {plans.map((plan) => (
            <article className="card" key={plan.name}>
              <div className="badge">{plan.name}</div>
              <h2>{plan.price}</h2>
              <p>{plan.text}</p>
              <a className="button" href={`${prefix}/register`}>Select demo</a>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
