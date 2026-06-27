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

const trustItems = [
  "kein Checkout auf dieser Seite",
  "keine automatische Abbuchung",
  "keine IBAN-Eingabe in FanMind",
  "spätere Zahlungsfreigabe separat",
];

const packageCards = [
  { title: "Kostenlos testen", price: "1 Stunde Demo-Zugang", bullets: ["keine Zahlung", "keine Kreditkarte", "kein Abo", "endet automatisch"] },
  { title: "Pilot / Setup", price: "990 € einmalig", bullets: ["1 Testmonat", "keine automatische Verlängerung", "keine Bindung", "späterer Wechsel in Starter möglich"] },
  { title: "Starter Flex", price: "990 € Setup + 312 €/Monat", bullets: ["monatliche Abrechnung im Voraus", "jederzeit kündbar", "für flexible Einstiege"] },
  { title: "Starter 12 Monate", price: "0 € Setup + 312 €/Monat", bullets: ["12 Monate Mindestlaufzeit", "monatliche Abrechnung im Voraus", "keine Einrichtungsgebühr"] },
  { title: "Growth & Agency", price: "Coming Soon", bullets: ["aktuell noch nicht direkt buchbar", "Freischaltung später", "derzeit keine Online-Zahlung"] },
];

const processItems = [
  "FanMind speichert aktuell keine IBAN in der App-Datenbank",
  "Zahlungen werden erst nach separater Freigabe aktiviert",
  "Abbuchungen erfolgen nur mit gültigem Mandat und aktivem Zahlungsprozess",
  "aktuell wird keine Zahlung auf dieser Website ausgelöst",
];

const noteItems = [
  "Diese Seite beschreibt die aktuelle MVP-Vorbereitung.",
  "Preise und Modelle dienen der strukturierten Produktfreigabe.",
  "Rechtliche und steuerliche Prüfung erfolgt vor produktiver Zahlungsfreischaltung final.",
  "Details zu Rechnung, Abbuchung und Mandat werden im finalen Vertrags- oder Angebotsprozess geregelt.",
];

export default function ZahlungsbedingungenPage() {
  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlow} aria-hidden="true" />
      <header className={styles.header}>
        <FanMindLogo className={styles.logo} href="/landing-v2" ariaLabel="FanMind Landingpage öffnen" />
        <nav className={styles.nav} aria-label="Zahlungsbedingungen Navigation">
          {navItems.map((item) => (
            <a href={item.href} key={item.label}>{item.label}{item.caret ? <span>▾</span> : null}</a>
          ))}
        </nav>
        <div className={styles.headerActions}>
          <a className={styles.loginButton} href="/login">Login</a>
          <a className={styles.accessButton} href="/register">Zugang anfragen</a>
        </div>
      </header>

      <section className={`${styles.hero} ${styles.paymentHero}`} aria-labelledby="payment-terms-title">
        <p className={styles.badge}>Billing-Vorbereitung</p>
        <h1 id="payment-terms-title">Zahlungsbedingungen</h1>
        <p>Hier findest du die aktuell geplanten Paket- und Zahlungsmodelle von FanMind. Aktuell wird auf dieser Website noch keine Zahlung ausgelöst.</p>
        <div className={styles.trustBox} aria-label="Wichtige Zahlungs-Hinweise">
          {trustItems.map((item) => <span key={item}>✓ {item}</span>)}
        </div>
      </section>

      <section className={styles.paymentContent} aria-label="Paket- und Zahlungsmodelle">
        <div className={styles.packageGrid}>
          {packageCards.map((card) => (
            <article className={styles.packageCard} key={card.title}>
              <h2>{card.title}</h2>
              <strong>{card.price}</strong>
              <ul>{card.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
            </article>
          ))}
        </div>

        <section className={styles.infoPanel} aria-labelledby="future-payment-title">
          <p className={styles.badge}>keine Zahlung auf dieser Website</p>
          <h2 id="future-payment-title">Spätere Zahlungsabwicklung</h2>
          <p>Die spätere Zahlungsabwicklung soll über einen geeigneten Zahlungsanbieter vorbereitet werden, zum Beispiel Stripe Billing mit SEPA-Lastschrift.</p>
          <ul>{processItems.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        <section className={styles.infoPanel} aria-labelledby="important-notes-title">
          <h2 id="important-notes-title">Wichtige Hinweise</h2>
          <ul>{noteItems.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
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
