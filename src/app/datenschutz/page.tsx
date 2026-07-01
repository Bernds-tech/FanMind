import type { Metadata } from "next";
import { FanMindLogo } from "@/components/FanMindLogo";
import styles from "./datenschutz.module.css";

export const metadata: Metadata = {
  title: "Datenschutzerklärung | FanMind",
  description: "Datenschutzerklärung für FanMind als prüfbarer Entwurf vor Go-Live.",
};

const sections = [
  { title: "Verantwortlicher und Kontakt", body: ["Verantwortlicher: [Firma / Anbieter eintragen], [Geschäftsanschrift eintragen].", "E-Mail für Datenschutzanfragen: privacy@fanmind.ch oder kontakt@fanmind.de.", "Interner Hinweis: Die konkreten Firmendaten müssen vor Go-Live final geprüft und ersetzt werden."] },
  { title: "Welche Daten verarbeitet werden", body: ["Accountdaten wie Name, E-Mail-Adresse, Workspace-Zuordnung, Rolle und Kontostatus.", "Login-/Auth-Daten wie Authentifizierungsinformationen, Sitzungsdaten und sicherheitsrelevante Ereignisse.", "Workspace-Daten, Fan-/Kontakt-Daten, Nachrichten-, Notiz-, Memory- und Follow-up-Daten, die Nutzer eingeben oder importieren.", "Zahlungsstatusdaten wie Paket, Rechnungs- oder Zahlungsstatus; FanMind speichert keine Bankdaten oder IBAN in der App.", "Technische Server- und Logdaten wie IP-Adresse, Zeitpunkt, Browserinformationen, angefragte Ressourcen, Fehler- und Sicherheitslogs."] },
  { title: "Zwecke der Verarbeitung", body: ["Bereitstellung der Plattform, Registrierung, Login, Workspace-Verwaltung und Support.", "CRM-/Kontaktverwaltung, Kontextpflege, manuelle Follow-up-Verwaltung und nachvollziehbare Teamarbeit.", "Erzeugung KI-gestützter Antwortvorschläge auf Nutzeranfrage; FanMind sendet nicht automatisch.", "Zahlungsabwicklung, Rechnungsstatus, Missbrauchsprävention, Sicherheit, Fehleranalyse und stabiler Betrieb."] },
  { title: "Rechtsgrundlagen als Entwurf", body: ["Vertrag oder Vertragsanbahnung, soweit die Verarbeitung für Bereitstellung, Registrierung, Support und Abrechnung erforderlich ist.", "Berechtigtes Interesse, insbesondere für Sicherheit, Betrieb, Fehleranalyse, Produktverbesserung und Missbrauchsprävention.", "Gesetzliche Pflichten, insbesondere steuer- und handelsrechtliche Aufbewahrungspflichten, soweit einschlägig.", "Einwilligung, soweit einzelne optionale Verarbeitungen künftig ausdrücklich auf Einwilligung gestützt werden."] },
  { title: "Empfänger und Dienstleister", body: ["Supabase kann für Datenbank, Authentifizierung und Plattformfunktionen eingesetzt werden.", "OpenAI bzw. KI-Dienstleister können für KI-Verarbeitung eingesetzt werden, wenn Nutzer entsprechende Funktionen auslösen.", "Stripe verarbeitet Zahlungsdaten für Zahlungen; Zahlungsdaten werden durch den Zahlungsanbieter verarbeitet.", "E-Mail/SMTP-Anbieter, Hosting-/VPS-Dienstleister und technische Support-Dienstleister können Daten im erforderlichen Umfang verarbeiten.", "Meta oder Telegram werden nur berücksichtigt, soweit entsprechende Integrationen tatsächlich verbunden und genutzt werden."] },
  { title: "Drittlandtransfer", body: ["Einige Dienstleister können außerhalb der EU/des EWR sitzen oder dort Daten verarbeiten. In solchen Fällen sollen geeignete Garantien wie Standardvertragsklauseln oder vergleichbare Schutzmechanismen eingesetzt werden, soweit erforderlich.", "Die konkrete Dienstleisterliste und Transfergrundlage ist vor Go-Live rechtlich final zu prüfen."] },
  { title: "Speicherdauer", body: ["Personenbezogene Daten werden nur so lange gespeichert, wie dies für die genannten Zwecke, vertragliche Beziehungen, Support, Sicherheit oder gesetzliche Pflichten erforderlich ist.", "Kunden können Daten im Rahmen der verfügbaren Funktionen löschen oder eine Löschung anfragen, soweit keine vorrangigen Pflichten entgegenstehen."] },
  { title: "Rechte betroffener Personen", body: ["Betroffene Personen haben nach Maßgabe der anwendbaren Datenschutzgesetze Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch.", "Soweit eine Verarbeitung auf Einwilligung beruht, kann die Einwilligung mit Wirkung für die Zukunft widerrufen werden.", "Außerdem besteht ein Beschwerderecht bei einer zuständigen Datenschutzaufsichtsbehörde."] },
  { title: "Wichtige Plattformhinweise", body: ["FanMind sendet Nachrichten nicht automatisch. Nutzer prüfen und versenden Inhalte selbst über den jeweiligen Kanal.", "FanMind speichert keine Bankdaten oder IBAN in der App. Zahlungsdaten werden durch den Zahlungsanbieter verarbeitet.", "KI-Vorschläge sind Entwürfe und müssen vor Verwendung durch Nutzer geprüft werden."] },
];

function slug(value: string) {
  return value.toLowerCase().replaceAll(" ", "-").replaceAll("/", "-");
}

function LegalFooter() {
  return (
    <footer className={styles.siteFooter}>
      <FanMindLogo className={styles.logo} compact href="/landing-v2" ariaLabel="FanMind Landingpage öffnen" />
      <p>FanMind · KI-gestütztes Fan-CRM mit manuellem Copy-&-Open-Workflow · kontakt@fanmind.de</p>
      <nav aria-label="Footer Navigation"><a href="/impressum">Impressum</a><a href="/datenschutz">Datenschutz</a><a href="/agb">AGB</a><a href="/zahlungsbedingungen">Zahlungsbedingungen</a><a href="/avv">AVV</a><a href="/roadmap">Roadmap</a><a href="/login">Login</a><a href="/register">Registrieren</a></nav>
      <p className={styles.updated}>Entwurf · Stand: Juni 2026</p><a className={styles.backTop} href="#top" aria-label="Nach oben">↑</a>
    </footer>
  );
}

export default function DatenschutzPage() {
  return <main id="top" className={styles.page}><div className={styles.backgroundGlow} aria-hidden="true" /><header className={styles.header}><FanMindLogo className={styles.logo} href="/landing-v2" ariaLabel="FanMind Landingpage öffnen" /><nav className={styles.nav} aria-label="Rechtsseiten Navigation"><a href="/impressum">Impressum</a><a href="/datenschutz">Datenschutz</a><a href="/agb">AGB</a><a href="/zahlungsbedingungen">Zahlungsbedingungen</a><a href="/avv">AVV</a></nav><div className={styles.headerActions}><a className={styles.loginButton} href="/login">Login</a><a className={styles.accessButton} href="/register">Registrieren</a></div></header><section className={styles.hero} aria-labelledby="privacy-title"><p className={styles.badge}>Datenschutz & Transparenz</p><h1 id="privacy-title">Datenschutzerklärung</h1><p>Prüfbarer Entwurf zur Verarbeitung personenbezogener Daten bei FanMind. Dies ist keine Rechtsberatung.</p></section><section className={styles.content} aria-label="Datenschutzerklärung Inhalt"><aside className={styles.toc} aria-label="Inhaltsverzeichnis"><strong>Kapitel</strong>{sections.map((section) => <a key={section.title} href={`#${slug(section.title)}`}>{section.title}</a>)}</aside><div className={styles.sections}><div className={styles.noticeBox}>Interner Hinweis: Bitte Firmendaten vor Go-Live final prüfen und ersetzen.</div>{sections.map((section) => <article className={styles.card} id={slug(section.title)} key={section.title}><h2>{section.title}</h2>{section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</article>)}</div></section><LegalFooter /></main>;
}
