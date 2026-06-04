import SiteNav from "@/components/SiteNav";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { isLocale, type Locale } from "@/i18n/config";

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

  return (
    <main>
      <div className="page-shell">
        <SiteNav active="Dashboard" locale={locale} />
        <LanguageSwitcher current={locale} />

        <section>
          <div className="badge">Creator Dashboard</div>
          <h1>Manage your fan club.</h1>
          <p className="lead">A first dashboard view for fans, members, revenue, content and community activity.</p>
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
