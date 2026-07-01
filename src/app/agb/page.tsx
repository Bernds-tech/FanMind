import type { Metadata } from "next";
import { FanMindLogo } from "@/components/FanMindLogo";
import styles from "../datenschutz/datenschutz.module.css";

export const metadata: Metadata = {
  title: "AGB / Vertragsbedingungen | FanMind",
  description: "Prüfbarer Entwurf der Vertragsbedingungen für FanMind.",
};

const sections = [
{ title: 'Geltungsbereich', body: ['Diese Bedingungen gelten für die Nutzung von FanMind durch Kunden, Pilotkunden und registrierte Nutzer, soweit keine abweichende individuelle Vereinbarung getroffen wurde.', 'Der Entwurf richtet sich primär an eine geschäftliche Nutzung; eine mögliche Verbrauchernutzung ist vor Go-Live rechtlich gesondert zu prüfen.'] },
{ title: 'Leistungsbeschreibung', body: ['FanMind ist ein CRM und KI-gestützter Copy-&-Open-Assistent für Kontakte, Fan-Kontext, Notizen, Memory und manuelle Follow-ups.', 'FanMind bietet keine automatische Sendefunktion: Nutzer prüfen Inhalte selbst und öffnen bzw. versenden Nachrichten eigenverantwortlich über den jeweiligen Kanal.'] },
{ title: 'Registrierung und Zugang', body: ['Für geschützte Bereiche ist ein Nutzerkonto erforderlich. Zugangsdaten sind vertraulich zu behandeln.', 'Der Kunde ist für die Verwaltung seiner Nutzer, Rollen und Workspace-Inhalte verantwortlich.'] },
{ title: 'Kundendaten und Verantwortung', body: ['Kunden sind dafür verantwortlich, dass eingegebene oder importierte Fan-, Kontakt- und Kommunikationsdaten rechtmäßig verarbeitet werden dürfen.', 'FanMind stellt technische Funktionen zur Verwaltung bereit und ersetzt keine rechtliche Prüfung der Kundendaten.'] },
{ title: 'KI-Hinweis', body: ['KI-Vorschläge sind Entwürfe und müssen vor Verwendung fachlich, inhaltlich und rechtlich geprüft werden.', 'FanMind übernimmt im Entwurf keine Garantie für Vollständigkeit, Richtigkeit, Angemessenheit oder gewünschte Wirkung von KI-Ausgaben.'] },
{ title: 'Zahlungen, Laufzeit und Kündigung', body: ['Zahlungsmodelle, Pilotbedingungen, Laufzeiten und Kündigungsregeln sind unter /zahlungsbedingungen beschrieben.', 'Abweichende Angebote oder Einzelvereinbarungen gehen diesen Bedingungen vor.'] },
{ title: 'Verfügbarkeit und Wartung', body: ['FanMind bemüht sich um einen stabilen Betrieb. Wartung, Updates, Sicherheitsmaßnahmen oder technische Störungen können die Verfügbarkeit zeitweise einschränken.', 'Konkrete Service-Level gelten nur, wenn sie ausdrücklich vereinbart wurden.'] },
{ title: 'Haftung', body: ['Haftungsregelung: [rechtlich final prüfen und konkrete Haftungsgrenzen eintragen oder anpassen].', 'Keine Haftungsbeschränkung darf zwingende gesetzliche Rechte unzulässig ausschließen.'] },
{ title: 'Datenschutz und Schlussbestimmungen', body: ['Informationen zur Verarbeitung personenbezogener Daten stehen in der Datenschutzerklärung unter /datenschutz.', 'Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt, soweit rechtlich zulässig.'] }
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
        <p className={styles.badge}>Entwurf – rechtlich final prüfen lassen.</p><h1 id="legal-title">AGB / Vertragsbedingungen</h1><p>Kurze Vertragsbedingungen für FanMind als B2B-orientierter Entwurf. Dies ist keine Rechtsberatung.</p>
      </section>
      <section className={styles.content} aria-label="AGB / Vertragsbedingungen Inhalt">
        <aside className={styles.toc} aria-label="Inhaltsverzeichnis"><strong>Kapitel</strong>{sections.map((s) => <a key={s.title} href={`#${slug(s.title)}`}>{s.title}</a>)}</aside>
        <div className={styles.sections}>
          <div className={styles.noticeBox}>Entwurf – rechtlich final prüfen lassen.</div>
          {sections.map((section) => <article className={styles.card} id={slug(section.title)} key={section.title}><h2>{section.title}</h2>{section.body.map((p) => <p key={p}>{p}</p>)}</article>)}
        </div>
      </section>
      <LegalFooter />
    </main>
  );
}
