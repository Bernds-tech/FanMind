import type { Metadata } from "next";
import { FanMindLogo } from "@/components/FanMindLogo";
import styles from "../datenschutz/datenschutz.module.css";

export const metadata: Metadata = {
  title: "Impressum | FanMind",
  description: "Anbieterkennzeichnung und Kontaktinformationen für FanMind.",
};

const sections = [
{ title: 'Anbieter / Firma', body: ['[Firma / Anbieter eintragen]', 'Rechtsform: [Rechtsform eintragen oder entfernen]', 'Geschäftsanschrift: [Geschäftsanschrift eintragen]'] },
{ title: 'Kontakt', body: ['E-Mail: kontakt@fanmind.de', 'Website: https://fanmind.ch', 'Support: kontakt@fanmind.de'] },
{ title: 'Register- und Steuerangaben', body: ['Firmenbuchnummer: [Firmenbuchnummer eintragen oder entfernen]', 'Firmenbuchgericht: [Firmenbuchgericht eintragen oder entfernen]', 'UID-Nummer: [UID eintragen oder entfernen]'] },
{ title: 'Kammer / Berufsrecht', body: ['Zuständige Kammer oder Berufsverband: [eintragen oder entfernen, falls nicht relevant]', 'Anwendbare gewerbe- oder berufsrechtliche Vorschriften: [eintragen oder entfernen, falls nicht relevant]'] },
{ title: 'Preishinweis', body: ['Preise werden auf FanMind klar als netto zuzüglich gesetzlicher Umsatzsteuer oder als brutto ausgewiesen.', 'Aktuelle Paket- und Zahlungsinformationen stehen unter /zahlungsbedingungen.'] }
];

function slug(value: string) {
  return value.toLowerCase().replaceAll(" ", "-").replaceAll("/", "-");
}

function LegalFooter() {
  return (
    <footer className={styles.siteFooter}>
      <FanMindLogo className={styles.logo} compact href="/landing-v2" ariaLabel="FanMind Landingpage öffnen" />
      <p>FanMind · KI-gestütztes Fan-CRM mit manuellem Copy-&-Open-Workflow · kontakt@fanmind.de</p>
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
      <p className={styles.updated}>Entwurf · Stand: Juni 2026</p>
      <a className={styles.backTop} href="#top" aria-label="Nach oben">↑</a>
    </footer>
  );
}

export default function Page() {
  return (
    <main id="top" className={styles.page}>
      <div className={styles.backgroundGlow} aria-hidden="true" />
      <header className={styles.header}>
        <FanMindLogo className={styles.logo} href="/landing-v2" ariaLabel="FanMind Landingpage öffnen" />
        <nav className={styles.nav} aria-label="Rechtsseiten Navigation">
          <a href="/impressum">Impressum</a><a href="/datenschutz">Datenschutz</a><a href="/agb">AGB</a><a href="/zahlungsbedingungen">Zahlungsbedingungen</a><a href="/avv">AVV</a>
        </nav>
        <div className={styles.headerActions}><a className={styles.loginButton} href="/login">Login</a><a className={styles.accessButton} href="/register">Registrieren</a></div>
      </header>
      <section className={styles.hero} aria-labelledby="legal-title">
        <p className={styles.badge}>Anbieterkennzeichnung</p><h1 id="legal-title">Impressum</h1><p>Pflichtangaben als prüfbarer Entwurf mit Platzhaltern, bis alle Firmendaten final bestätigt sind.</p>
      </section>
      <section className={styles.content} aria-label="Impressum Inhalt">
        <aside className={styles.toc} aria-label="Inhaltsverzeichnis"><strong>Kapitel</strong>{sections.map((s) => <a key={s.title} href={`#${slug(s.title)}`}>{s.title}</a>)}</aside>
        <div className={styles.sections}>
          <div className={styles.noticeBox}>Interner Hinweis: Bitte Firmendaten vor Go-Live final prüfen und ersetzen.</div>
          {sections.map((section) => <article className={styles.card} id={slug(section.title)} key={section.title}><h2>{section.title}</h2>{section.body.map((p) => <p key={p}>{p}</p>)}</article>)}
        </div>
      </section>
      <LegalFooter />
    </main>
  );
}
