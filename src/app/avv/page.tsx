import type { Metadata } from "next";
import { FanMindLogo } from "@/components/FanMindLogo";
import styles from "../datenschutz/datenschutz.module.css";

export const metadata: Metadata = {
  title: "AVV / Auftragsverarbeitung | FanMind",
  description: "Informationen zur geplanten Vereinbarung zur Auftragsverarbeitung für FanMind-Pilotkunden.",
};

const sections = [
{ title: 'Hinweis für Pilotkunden', body: ['Für Pilotkunden stellen wir auf Anfrage eine Vereinbarung zur Auftragsverarbeitung bereit.', 'Diese Seite ist ein vorbereitender Überblick und ersetzt nicht die konkrete AVV-Unterzeichnung.'] },
{ title: 'Kategorien von Daten', body: ['Account- und Nutzerinformationen, Workspace-Daten, Fan-/Kontakt-Daten, Kommunikationsnotizen, Memory-/Follow-up-Daten und technische Logdaten.', 'Zahlungsstatusdaten können verarbeitet werden; Bankdaten oder IBAN speichert FanMind nicht in der App.'] },
{ title: 'Zwecke der Verarbeitung', body: ['Bereitstellung des CRM, Verwaltung von Kontakten und Kontext, KI-gestützte Antwortentwürfe, Follow-up-Organisation, Betrieb, Support und Sicherheit.'] },
{ title: 'Unterauftragnehmer / Dienstleister als Entwurf', body: ['Supabase für Datenbank, Authentifizierung und technische Plattformfunktionen.', 'OpenAI bzw. KI-Dienstleister für KI-Verarbeitung, soweit Nutzer KI-Funktionen auslösen.', 'Stripe für Zahlungsabwicklung, E-Mail/SMTP-Anbieter für transaktionale E-Mails sowie Hosting/VPS-Dienstleister für den Betrieb.'] },
{ title: 'Technische und organisatorische Maßnahmen', body: ['Zugriffsbeschränkung und rollenbasierte Berechtigungen.', 'Verschlüsselung beim Transport, abgesicherte Infrastrukturzugänge, Backups/Hosting-Prozesse und beschränkter Serverzugriff.', 'Keine Zertifizierungen werden behauptet, solange sie nicht final nachweisbar sind.'] }
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
        <p className={styles.badge}>B2B-Datenschutz</p><h1 id="legal-title">AVV / Auftragsverarbeitung</h1><p>Überblick für Pilotkunden: FanMind kann personenbezogene Kontakt- und Fan-Daten im Auftrag verarbeiten.</p>
      </section>
      <section className={styles.content} aria-label="AVV / Auftragsverarbeitung Inhalt">
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
