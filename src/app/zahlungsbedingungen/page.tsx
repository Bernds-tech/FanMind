import type { Metadata } from "next";
import { FanMindLogo } from "@/components/FanMindLogo";
import styles from "../datenschutz/datenschutz.module.css";

export const metadata: Metadata = {
  title: "Zahlungsbedingungen | FanMind",
  description: "MVP-Zahlungsbedingungen für FanMind: aktuell ohne Checkout, ohne automatische Abbuchung und ohne Zahlung auf der Website.",
  alternates: {
    canonical: "https://fanmind.ch/zahlungsbedingungen",
  },
};

const navItems = [
  { label: "Produkt", href: "/landing-v2#produkt-showcase", caret: true },
  { label: "Preise", href: "/landing-v2#preise" },
  { label: "Datenschutz", href: "/datenschutz" },
  { label: "Kontakt", href: "/landing-v2#kontakt" },
];

const sections = [
  {
    title: "1. Kostenlos testen",
    body: ["1 Stunde Demo-Zugang.", "Keine Zahlung, keine Kreditkarte, keine Bindung und kein Abo."],
  },
  {
    title: "2. Pilot / Setup",
    body: ["990 € einmalig.", "1 Testmonat, keine automatische Verlängerung und keine Bindung.", "Der Pilot endet, wenn er nicht aktiv fortgesetzt wird.", "Die Zahlung wird separat vorbereitet; aktuell gibt es keinen Checkout auf der Website."],
  },
  {
    title: "3. Starter Flex",
    body: ["990 € Setup plus 312 €/Monat.", "Jederzeit kündbar.", "Monatliche Abrechnung im Voraus.", "Die Zahlung wird separat vorbereitet; aktuell gibt es keinen Checkout auf der Website."],
  },
  {
    title: "4. Starter 12 Monate",
    body: ["0 € Setup plus 312 €/Monat.", "12 Monate Mindestlaufzeit.", "Monatliche Abrechnung im Voraus.", "Die Zahlung wird separat vorbereitet; aktuell gibt es keinen Checkout auf der Website."],
  },
  {
    title: "5. Growth und Agency",
    body: ["Coming Soon.", "Aktuell nicht produktiv buchbar.", "Keine Zahlung."],
  },
  {
    title: "6. Zahlungsart / SEPA später",
    body: ["Spätere Zahlung soll über einen Zahlungsanbieter wie Stripe Billing mit SEPA-Lastschrift vorbereitet werden.", "SEPA erfordert ein gültiges Mandat.", "FanMind speichert keine IBAN in der eigenen App-Datenbank.", "Abbuchungen erfolgen erst nach gültigem Zahlungsprozess und Mandat.", "Diese Website löst aktuell keine Zahlung und keine Abbuchung aus."],
  },
  {
    title: "7. Zahlungsverzug",
    body: ["Bei fehlgeschlagener Zahlung kann FanMind nach Hinweis und angemessener Frist den Zugang einschränken oder pausieren.", "Details werden im finalen Vertrag oder Angebot geregelt."],
  },
  {
    title: "8. Hinweis",
    body: ["Diese Zahlungsbedingungen sind eine MVP-Vorbereitung und müssen vor produktiver Zahlungsfreischaltung rechtlich und steuerlich final geprüft werden."],
  },
];

export default function ZahlungsbedingungenPage() {
  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlow} aria-hidden="true" />
      <header className={styles.header}>
        <FanMindLogo className={styles.logo} href="/landing-v2" ariaLabel="FanMind Landingpage öffnen" />
        <nav className={styles.nav} aria-label="Zahlungsbedingungen Navigation">
          {navItems.map((item) => (
            <a href={item.href} key={item.label}>
              {item.label}{item.caret ? <span>▾</span> : null}
            </a>
          ))}
        </nav>
        <div className={styles.headerActions}>
          <a className={styles.loginButton} href="/login">Login</a>
          <a className={styles.accessButton} href="/register">Zugang anfragen</a>
        </div>
      </header>

      <section className={styles.hero} aria-labelledby="payment-terms-title">
        <p className={styles.badge}>Billing-Vorbereitung · keine Zahlung auf der Website</p>
        <h1 id="payment-terms-title">Zahlungsbedingungen</h1>
        <p>
          Diese Seite beschreibt die aktuell sichtbaren FanMind-Pakete und bereitet spätere Zahlungsprozesse vor. Aktuell wird hier keine Zahlung, kein Checkout, keine Subscription-Abrechnung und keine automatische Abbuchung ausgelöst.
        </p>
      </section>

      <section className={styles.content} aria-label="Zahlungsbedingungen Inhalt">
        {sections.map((section) => (
          <article className={styles.sectionCard} key={section.title}>
            <h2>{section.title}</h2>
            {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </article>
        ))}
      </section>

      <footer className={styles.siteFooter}>
        <FanMindLogo className={styles.logo} compact href="/landing-v2" ariaLabel="FanMind Landingpage öffnen" />
        <nav aria-label="Rechtliche Links">
          <a href="/datenschutz">Datenschutz</a>
          <a href="/zahlungsbedingungen">Zahlungsbedingungen</a>
          <a href="/landing-v2#impressum">Impressum</a>
        </nav>
      </footer>
    </main>
  );
}
