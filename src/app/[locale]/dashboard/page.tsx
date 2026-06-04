import SiteNav from "@/components/SiteNav";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { isLocale, type Locale } from "@/i18n/config";
import { getPageContent } from "@/i18n/pageContent";

function resolveLocale(value: string): Locale {
  return isLocale(value) ? value : "de";
}

const stats = [
  { label: "Fans", value: "1,248" },
  { label: "Members", value: "186" },
  { label: "Revenue", value: "3,420 EUR" },
  { label: "Messages", value: "27" }
];

export default async function LocalizedDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const content = getPageContent(locale);

  return (
    <main>
      <div className="page-shell">
        <SiteNav active="Dashboard" locale={locale} />
        <LanguageSwitcher current={locale} />

        <section>
          <div className="badge">Creator Dashboard</div>
          <h1>{content.dashboardTitle}</h1>
          <p className="lead">{content.dashboardText}</p>
        </section>

        <section className="grid">
          {stats.map((stat) => (
            <article className="card" key={stat.label}>
              <p>{stat.label}</p>
              <h2>{stat.value}</h2>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
