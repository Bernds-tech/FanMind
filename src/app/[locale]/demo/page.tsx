import SiteNav from "@/components/SiteNav";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { isLocale, type Locale } from "@/i18n/config";
import { getPageContent } from "@/i18n/pageContent";

function resolveLocale(value: string): Locale {
  return isLocale(value) ? value : "de";
}

export default async function LocalizedDemoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const content = getPageContent(locale);
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
          <h1>{content.demoTitle}</h1>
          <p className="lead">{content.demoText}</p>
        </section>

        <section className="grid">
          {links.map((item) => (
            <article className="card" key={item.href}>
              <h3>{item.title}</h3>
              <p>FanMind module</p>
              <a className="button" href={item.href}>{content.open}</a>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
