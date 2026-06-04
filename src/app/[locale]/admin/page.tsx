import SiteNav from "@/components/SiteNav";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { isLocale, type Locale } from "@/i18n/config";

function resolveLocale(value: string): Locale {
  return isLocale(value) ? value : "de";
}

const rows = [
  { area: "Creators", status: "3 demo profiles" },
  { area: "Fans", status: "1,248 demo fans" },
  { area: "Content", status: "12 demo posts" },
  { area: "Payments", status: "Not active yet" }
];

export default async function LocalizedAdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);

  return (
    <main>
      <div className="page-shell">
        <SiteNav locale={locale} />
        <LanguageSwitcher current={locale} />

        <section>
          <div className="badge">Admin Demo</div>
          <h1>Platform overview.</h1>
          <p className="lead">A first admin view for users, creators, content status and platform control.</p>
        </section>

        <section className="grid">
          {rows.map((row) => (
            <article className="card" key={row.area}>
              <h3>{row.area}</h3>
              <p>{row.status}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
