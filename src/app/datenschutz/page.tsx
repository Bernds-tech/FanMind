import type { Metadata } from "next";
import { FanMindLogo } from "@/components/FanMindLogo";
import styles from "./datenschutz.module.css";

export const metadata: Metadata = {
  title: "Datenschutzerklärung | FanMind",
  description:
    "Informationen zur Verarbeitung personenbezogener Daten bei der Nutzung der CRM- und Kommunikationsplattform FanMind.",
  alternates: {
    canonical: "https://fanmind.ch/datenschutz",
  },
  openGraph: {
    title: "Datenschutzerklärung | FanMind",
    description:
      "Informationen zur Verarbeitung personenbezogener Daten bei der Nutzung von FanMind.",
    url: "https://fanmind.ch/datenschutz",
    siteName: "FanMind",
    locale: "de_CH",
    type: "website",
  },
};

const navItems = [
  { label: "Produkt", href: "/landing-v2#produkt-showcase", caret: true },
  { label: "Probleme", href: "/landing-v2#problem" },
  { label: "Conversion", href: "/landing-v2#conversion", caret: true },
  { label: "Integrationen", href: "/landing-v2#integrationen" },
  { label: "Preise", href: "/landing-v2#preise" },
  { label: "Roadmap", href: "/landing-v2#roadmap", caret: true },
  { label: "Kontakt", href: "/landing-v2#kontakt" },
];

const sections = [
  {
    title: "Verantwortlicher",
    body: [
      "Verantwortlich für die Verarbeitung personenbezogener Daten im Zusammenhang mit FanMind ist FanMind.",
      "Kontakt für Datenschutzanfragen: privacy@fanmind.ch.",
    ],
  },
  {
    title: "Allgemeine Hinweise",
    body: [
      "Diese Datenschutzerklärung informiert darüber, welche personenbezogenen Daten bei der Nutzung von FanMind verarbeitet werden und zu welchen Zwecken dies geschieht.",
      "FanMind dient als CRM- und Kommunikationsplattform für Creator, Clubs, Events und Fan-Communities. Die Plattform unterstützt Teams dabei, Kontakte, Gesprächskontext und Follow-ups strukturiert zu verwalten.",
    ],
  },
  {
    title: "Erhebung und Verarbeitung personenbezogener Daten",
    body: [
      "Wir verarbeiten personenbezogene Daten, die Benutzer selbst eingeben, importieren oder über ausdrücklich verbundene Integrationen bereitstellen. Dazu können Namen, Kontaktdaten, Social-Media-Handles, Kommunikationshistorien, Präferenzen und organisatorische Informationen gehören.",
      "FanMind speichert insbesondere Kontakte, Tags, Notizen, Memories und Follow-ups, soweit diese Funktionen durch Benutzer verwendet werden.",
    ],
  },
  {
    title: "Registrierung und Benutzerkonten",
    body: [
      "Für die Nutzung geschützter Bereiche können Benutzerkonten erforderlich sein. Dabei verarbeiten wir Anmeldedaten, Kontaktdaten, Rollen, Workspace-Zuordnungen und technische Sitzungsinformationen.",
      "Diese Daten werden benötigt, um den Zugang bereitzustellen, Berechtigungen zu prüfen und die Sicherheit der Plattform zu gewährleisten.",
    ],
  },
  {
    title: "Kontakte und CRM-Daten",
    body: [
      "Benutzer können in FanMind CRM-Daten zu Fans, Kunden, Mitgliedern, Leads oder sonstigen Kontakten verwalten. Die Verantwortung für die Rechtmäßigkeit importierter oder eingegebener Kontaktdaten liegt grundsätzlich beim jeweiligen Benutzer bzw. der nutzenden Organisation.",
      "Social-Media-Integrationen können Daten importieren, sofern Benutzer diese ausdrücklich verbinden und die jeweilige Plattform dies technisch sowie rechtlich zulässt.",
    ],
  },
  {
    title: "Nachrichten und Kommunikationsdaten",
    body: [
      "FanMind kann Kommunikationsinhalte, Gesprächsnotizen, Kanalinformationen und Bearbeitungsstände speichern, damit Teams Interaktionen nachvollziehen und Follow-ups planen können.",
      "Nachrichten werden nicht automatisch versendet. Benutzer behalten die Kontrolle über Prüfung, Freigabe und Versand von Kommunikation.",
    ],
  },
  {
    title: "KI-Funktionen und Antwortvorschläge",
    body: [
      "FanMind kann KI-Funktionen bereitstellen, beispielsweise zur Erstellung von Antwortvorschlägen oder zur strukturierten Aufbereitung von Kontextinformationen.",
      "KI-Vorschläge werden nur auf ausdrückliche Benutzeranfrage erzeugt. Sie dienen als Entwürfe und ersetzen keine menschliche Prüfung oder Entscheidung.",
    ],
  },
  {
    title: "Cookies und Sitzungsverwaltung",
    body: [
      "FanMind verwendet technisch erforderliche Cookies oder vergleichbare Technologien, um Anmeldungen, Sitzungen, Sicherheitseinstellungen und grundlegende Plattformfunktionen bereitzustellen.",
      "Soweit darüber hinaus optionale Technologien eingesetzt werden, erfolgt dies nur im Rahmen der geltenden gesetzlichen Anforderungen.",
    ],
  },
  {
    title: "Server-Logfiles",
    body: [
      "Beim Zugriff auf FanMind können technische Zugriffsdaten verarbeitet werden, etwa IP-Adresse, Zeitpunkt des Zugriffs, Browserinformationen, angefragte Ressourcen, Referrer und Statuscodes.",
      "Diese Daten dienen der Sicherheit, Fehleranalyse, Stabilität und Missbrauchsprävention.",
    ],
  },
  {
    title: "Hosting und Infrastruktur",
    body: [
      "FanMind nutzt technische Dienstleister für Hosting, Datenbanken, Authentifizierung, E-Mail- oder Infrastrukturleistungen. Dabei können personenbezogene Daten im erforderlichen Umfang verarbeitet werden.",
      "Wir achten bei der Auswahl von Dienstleistern auf angemessene technische und organisatorische Schutzmaßnahmen sowie vertragliche Datenschutzpflichten.",
    ],
  },
  {
    title: "Datenweitergabe",
    body: [
      "Eine Weitergabe personenbezogener Daten erfolgt nur, wenn dies für den Betrieb von FanMind erforderlich ist, Benutzer dies veranlassen, eine gesetzliche Pflicht besteht oder eine andere Rechtsgrundlage vorliegt.",
      "FanMind verkauft keine personenbezogenen Daten.",
    ],
  },
  {
    title: "Aufbewahrungsdauer",
    body: [
      "Personenbezogene Daten werden nur so lange gespeichert, wie dies für die jeweiligen Zwecke erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen.",
      "Benutzer können Daten im Rahmen der verfügbaren Funktionen löschen oder eine Löschung über den Datenschutzkontakt anfragen, soweit keine vorrangigen Pflichten entgegenstehen.",
    ],
  },
  {
    title: "Datensicherheit",
    body: [
      "Wir treffen angemessene technische und organisatorische Maßnahmen, um personenbezogene Daten gegen Verlust, Missbrauch, unbefugten Zugriff, Veränderung oder Offenlegung zu schützen.",
      "Dazu gehören unter anderem Zugriffsbeschränkungen, verschlüsselte Übertragungen, rollenbasierte Berechtigungen und regelmäßige Überprüfung sicherheitsrelevanter Prozesse.",
    ],
  },
  {
    title: "Rechte betroffener Personen",
    body: [
      "Betroffene Personen können nach Maßgabe der anwendbaren Datenschutzgesetze Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch geltend machen.",
      "Soweit eine Verarbeitung auf Einwilligung beruht, kann diese Einwilligung mit Wirkung für die Zukunft widerrufen werden. Außerdem kann ein Beschwerderecht bei einer zuständigen Datenschutzaufsichtsbehörde bestehen.",
    ],
  },
  {
    title: "Kontakt zum Datenschutz",
    body: [
      "Für Fragen zur Verarbeitung personenbezogener Daten, zur Ausübung von Betroffenenrechten oder zu dieser Datenschutzerklärung kontaktieren Sie uns bitte unter:",
      "FanMind · E-Mail: privacy@fanmind.ch",
    ],
  },
  {
    title: "Änderungen dieser Datenschutzerklärung",
    body: [
      "Wir können diese Datenschutzerklärung anpassen, wenn sich Funktionen, rechtliche Anforderungen oder technische Abläufe ändern.",
      "Die jeweils aktuelle Fassung ist unter https://fanmind.ch/datenschutz abrufbar.",
    ],
  },
];

function Logo() {
  return <FanMindLogo className={styles.logo} compact href="/landing-v2" />;
}

export default function DatenschutzPage() {
  return (
    <main id="top" className={styles.page}>
      <div className={styles.backgroundGlow} aria-hidden="true" />
      <header className={styles.header}>
        <Logo />
        <nav className={styles.nav} aria-label="Hauptnavigation">
          {navItems.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
              {item.caret && <span>⌄</span>}
            </a>
          ))}
        </nav>
        <div className={styles.headerActions}>
          <a className={styles.loginButton} href="/login">Login</a>
          <a className={styles.accessButton} href="/register">Zugang anfragen <span>→</span></a>
        </div>
      </header>

      <section className={styles.hero} aria-labelledby="privacy-title">
        <p className={styles.badge}>Datenschutz & Transparenz</p>
        <h1 id="privacy-title">Datenschutzerklärung</h1>
        <p>
          Informationen zur Verarbeitung personenbezogener Daten bei der Nutzung von FanMind.
        </p>
      </section>

      <section className={styles.content} aria-label="Datenschutzerklärung Inhalt">
        <aside className={styles.toc} aria-label="Inhaltsverzeichnis">
          <strong>Kapitel</strong>
          {sections.map((section) => (
            <a key={section.title} href={`#${section.title.toLowerCase().replaceAll(" ", "-")}`}>
              {section.title}
            </a>
          ))}
        </aside>
        <div className={styles.sections}>
          {sections.map((section) => (
            <article className={styles.card} id={section.title.toLowerCase().replaceAll(" ", "-")} key={section.title}>
              <h2>{section.title}</h2>
              {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </article>
          ))}
        </div>
      </section>

      <footer className={styles.siteFooter}>
        <Logo />
        <p>© 2026 FanMind. Alle Rechte vorbehalten.</p>
        <nav aria-label="Footer Navigation">
          <a href="/datenschutz">Datenschutz</a>
          <a href="/landing-v2#impressum">Impressum</a>
          <a href="/landing-v2#agb">AGB</a>
          <a href="/landing-v2#cookies">Cookies</a>
        </nav>
        <p className={styles.updated}>Letzte Aktualisierung: Juni 2026</p>
        <a className={styles.backTop} href="#top" aria-label="Nach oben">↑</a>
      </footer>
    </main>
  );
}
