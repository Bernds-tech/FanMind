import SiteNav from "@/components/SiteNav";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { isLocale, type Locale } from "@/i18n/config";
import { getPageContent } from "@/i18n/pageContent";

function resolveLocale(value: string): Locale {
  return isLocale(value) ? value : "de";
}

const posts = [
  { type: "FREE", title: "Welcome", text: "Public update for all fans." },
  { type: "MEMBERS", title: "7-day challenge", text: "Exclusive member content with a weekly plan." },
  { type: "PREMIUM", title: "Personal Q&A", text: "Premium access to personal fan moments." }
];

export default async function LocalizedCreatorDemoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const content = getPageContent(locale);
  const prefix = locale === "de" ? "" : `/${locale}`;

  return (
    <main>
      <div className="page-shell">
        <SiteNav active="Creator" locale={locale} />
        <LanguageSwitcher current={locale} />

        <section className="hero">
          <div>
            <div className="badge">Creator Profile</div>
            <h1>{content.creatorTitle}</h1>
            <p className="lead">{content.creatorText}</p>
            <div className="actions">
              <a className="button primary" href={`${prefix}/pricing`}>View membership</a>
              <a className="button" href={`${prefix}/dashboard`}>Open dashboard</a>
            </div>
          </div>

          <aside className="hero-card">
            <h2>Fan club membership</h2>
            <p className="lead">Exclusive posts, challenges and direct fan moments.</p>
          </aside>
        </section>

        <section className="grid">
          {posts.map((post) => (
            <article className="card" key={post.title}>
              <div className="badge">{post.type}</div>
              <h3>{post.title}</h3>
              <p>{post.text}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
