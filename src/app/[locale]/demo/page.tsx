import SiteNav from "@/components/SiteNav";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { isLocale, type Locale } from "@/i18n/config";

function resolveLocale(value: string): Locale {
  return isLocale(value) ? value : "de";
}

export default async function LocalizedDemoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const prefix = locale === "de" ? "" : `/${locale}`;

  const links = [
    { title: "Home", href: prefix || "/" },
    { title: "Pricing", href: `${prefix}/pricing` },
    { title: "Login", href: `${prefix}/login` },
    { title: "Register", href: `${prefix}/register` },
    { title: "Creator", href: `${prefix}/creator/demo` },
    { title: "Dashboard", href: `${prefix}/dashboard` }
  ];

  return (
    <main>
      <div className="page-shell">
        <SiteNav active="Demo" locale={locale} />
        <LanguageSwitcher current={locale} />

        <section>
          <div className="badge">FanMind Demo</div>
          <h1>FanMind demo pages.</h1>
          <p className="lead">This page connects the current localized FanMind prototype screens.</p>
        </section>

        <section className="grid">
          {links.map((item) => (
            <article className="card" key={item.href}>
              <h3>{item.title}</h3>
              <p>Open this FanMind demo module.</p>
              <a className="button" href={item.href}>Open</a>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
