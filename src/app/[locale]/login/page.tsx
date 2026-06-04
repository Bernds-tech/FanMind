import SiteNav from "@/components/SiteNav";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { isLocale, type Locale } from "@/i18n/config";

function resolveLocale(value: string): Locale {
  return isLocale(value) ? value : "de";
}

export default async function LocalizedLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const prefix = locale === "de" ? "" : `/${locale}`;

  return (
    <main>
      <div className="page-shell">
        <SiteNav active="Login" locale={locale} />
        <LanguageSwitcher current={locale} />

        <section className="hero">
          <div>
            <div className="badge">Login Demo</div>
            <h1>Welcome back to FanMind.</h1>
            <p className="lead">This screen is the first login mockup for creators, fans and admins.</p>
          </div>

          <aside className="hero-card">
            <h2>Login</h2>
            <div className="post">
              <small>EMAIL</small>
              <p>creator@fanmind.at</p>
            </div>
            <div className="post">
              <small>PASSWORD</small>
              <p>************</p>
            </div>
            <a className="button primary" href={`${prefix}/dashboard`}>Demo login</a>
          </aside>
        </section>
      </div>
    </main>
  );
}
