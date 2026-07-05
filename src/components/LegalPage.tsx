import Link from "next/link";
import type { ReactNode } from "react";
import { FanMindLogo } from "@/components/FanMindLogo";
import styles from "@/app/datenschutz/datenschutz.module.css";

export type LegalSection = {
  title: string;
  body: ReactNode[];
};

type LegalPageProps = {
  badge: string;
  title: string;
  intro: string;
  sections: LegalSection[];
  children?: ReactNode;
};

function slug(value: string) {
  return value.toLowerCase().replaceAll(" ", "-").replaceAll("/", "-");
}

export function LegalFooter() {
  return (
    <footer className={styles.siteFooter}>
      <FanMindLogo className={styles.logo} compact href="/" ariaLabel="FanMind Startseite öffnen" />
      <p>FanMind · KI-gestützter Antwort- und Memory-Assistent · kontakt@fanmind.ch</p>
      <nav aria-label="Footer Navigation">
        <a href="/impressum">Impressum</a>
        <a href="/datenschutz">Datenschutz</a>
        <a href="/agb">AGB</a>
        <a href="/zahlungsbedingungen">Zahlungsbedingungen</a>
        <a href="/avv">AVV</a>
        <a href="/roadmap">Roadmap</a>
        <a href="/login">Login</a>
        <a href="/register">Registrieren</a>
      </nav>
      <p className={styles.updated}>Stand: Juli 2026</p>
      <a className={styles.backTop} href="#top" aria-label="Nach oben">↑</a>
    </footer>
  );
}

export function LegalHeader() {
  return (
    <header className={styles.header}>
      <FanMindLogo className={styles.logo} href="/" ariaLabel="FanMind Startseite öffnen" />
      <nav className={styles.nav} aria-label="Rechtsseiten Navigation">
        <a href="/impressum">Impressum</a>
        <a href="/datenschutz">Datenschutz</a>
        <a href="/agb">AGB</a>
        <a href="/zahlungsbedingungen">Zahlungsbedingungen</a>
        <a href="/avv">AVV</a>
      </nav>
      <div className={styles.headerActions}>
        <a className={styles.loginButton} href="/login">Login</a>
        <a className={styles.accessButton} href="/register">Registrieren</a>
      </div>
    </header>
  );
}

export function LegalPage({ badge, title, intro, sections, children }: LegalPageProps) {
  return (
    <main id="top" className={styles.page}>
      <div className={styles.backgroundGlow} aria-hidden="true" />
      <LegalHeader />
      <section className={styles.hero} aria-labelledby="legal-title">
        <p className={styles.badge}>{badge}</p>
        <h1 id="legal-title">{title}</h1>
        <p>{intro}</p>
        <Link className={styles.homeLink} href="/">Zurück zu FanMind</Link>
      </section>
      <section className={styles.content} aria-label={`${title} Inhalt`}>
        <aside className={styles.toc} aria-label="Inhaltsverzeichnis">
          <strong>Kapitel</strong>
          {sections.map((section) => <a key={section.title} href={`#${slug(section.title)}`}>{section.title}</a>)}
        </aside>
        <div className={styles.sections}>
          {children}
          {sections.map((section) => (
            <article className={styles.card} id={slug(section.title)} key={section.title}>
              <h2>{section.title}</h2>
              {section.body.map((paragraph, index) => <p key={`${section.title}-${index}`}>{paragraph}</p>)}
            </article>
          ))}
        </div>
      </section>
      <LegalFooter />
    </main>
  );
}
