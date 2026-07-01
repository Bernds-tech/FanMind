import type { Metadata } from "next";
import { FanMindLogo } from "@/components/FanMindLogo";
import styles from "../datenschutz/datenschutz.module.css";

export const metadata: Metadata = { title: "Zahlungsbedingungen | FanMind", description: "Paket-, Laufzeit- und Zahlungsbedingungen für FanMind." };

const packageCards = [
  { title: "Pilot / Setup", price: "990 € einmalig · zzgl. USt.", bullets: ["1 Testmonat", "keine automatische Verlängerung", "endet ohne automatische Verlängerung"] },
  { title: "Starter Flex", price: "990 € Setup + 312 €/Monat · zzgl. USt.", bullets: ["monatlich kündbar", "monatliche Abrechnung", "für flexible Einstiege"] },
  { title: "Starter 12 Monate", price: "0 € Setup + 312 €/Monat · zzgl. USt.", bullets: ["12 Monate Laufzeit", "monatliche Abrechnung", "keine Einrichtungsgebühr"] },
  { title: "Growth / Agency", price: "Auf Anfrage / Coming Soon", bullets: ["nicht direkt buchbar", "individuelles Angebot", "rechtliche und technische Freigabe vor Live-Nutzung"] },
];

const sections = [
  { title: "SEPA- und Zahlungsabwicklung", body: ["Zahlungsdaten werden vom Zahlungsanbieter verarbeitet, insbesondere bei späterer Nutzung von Stripe oder vergleichbaren Zahlungsdiensten.", "FanMind speichert keine IBAN oder Bankdaten in der App-Datenbank.", "Abbuchungen oder Zahlungen erfolgen nur auf Grundlage eines gültigen Zahlungsprozesses und einer separaten Freigabe bzw. Vereinbarung."] },
  { title: "Kündigung und Laufzeit", body: ["Starter Flex ist monatlich kündbar, soweit im Angebot nichts Abweichendes vereinbart wurde.", "Der Pilot endet ohne automatische Verlängerung.", "Starter 12 Monate läuft gemäß vereinbarter 12-monatiger Laufzeit."] },
  { title: "Steuerhinweis", body: ["Alle genannten Preise verstehen sich zuzüglich gesetzlicher Umsatzsteuer, sofern nicht ausdrücklich anders angegeben.", "Rechnungs- und Steuerangaben werden im finalen Angebot bzw. Rechnungsprozess konkretisiert."] },
  { title: "B2B-Hinweis", body: ["FanMind richtet sich aktuell primär an geschäftliche Nutzer, Creator-Teams, Clubs, Agenturen und Organisationen.", "Falls eine Nutzung durch Verbraucher nicht ausgeschlossen wird, müssen Verbraucherinformationen und Widerrufsregelungen vor Go-Live rechtlich gesondert geprüft werden."] },
];

function slug(value: string) { return value.toLowerCase().replaceAll(" ", "-").replaceAll("/", "-"); }

function LegalFooter() { return <footer className={styles.siteFooter}><FanMindLogo className={styles.logo} compact href="/landing-v2" ariaLabel="FanMind Landingpage öffnen" /><p>FanMind · KI-gestütztes Fan-CRM mit manuellem Copy-&-Open-Workflow · kontakt@fanmind.de</p><nav aria-label="Footer Navigation"><a href="/impressum">Impressum</a><a href="/datenschutz">Datenschutz</a><a href="/agb">AGB</a><a href="/zahlungsbedingungen">Zahlungsbedingungen</a><a href="/avv">AVV</a><a href="/roadmap">Roadmap</a><a href="/login">Login</a><a href="/register">Registrieren</a></nav><p className={styles.updated}>Entwurf · Stand: Juni 2026</p><a className={styles.backTop} href="#top" aria-label="Nach oben">↑</a></footer>; }

export default function ZahlungsbedingungenPage() {
  return <main id="top" className={styles.page}><div className={styles.backgroundGlow} aria-hidden="true" /><header className={styles.header}><FanMindLogo className={styles.logo} href="/landing-v2" ariaLabel="FanMind Landingpage öffnen" /><nav className={styles.nav} aria-label="Rechtsseiten Navigation"><a href="/impressum">Impressum</a><a href="/datenschutz">Datenschutz</a><a href="/agb">AGB</a><a href="/zahlungsbedingungen">Zahlungsbedingungen</a><a href="/avv">AVV</a></nav><div className={styles.headerActions}><a className={styles.loginButton} href="/login">Login</a><a className={styles.accessButton} href="/register">Registrieren</a></div></header><section className={`${styles.hero} ${styles.paymentHero}`} aria-labelledby="payment-terms-title"><p className={styles.badge}>Paket- und Zahlungsbedingungen</p><h1 id="payment-terms-title">Zahlungsbedingungen</h1><p>Prüfbarer Entwurf der Paket-, Laufzeit- und Zahlungsbedingungen. Keine Stripe-Live-Umstellung in diesem Schritt.</p><div className={styles.trustBox} aria-label="Wichtige Zahlungs-Hinweise"><span>✓ keine IBAN-Speicherung in FanMind</span><span>✓ Zahlungsanbieter verarbeitet Zahlungsdaten</span><span>✓ Pilot endet automatisch</span><span>✓ Preise zzgl. USt.</span></div></section><section className={styles.paymentContent} aria-label="Paket- und Zahlungsmodelle"><div className={styles.noticeBox}>Interner Hinweis: Bitte Firmendaten vor Go-Live final prüfen und ersetzen.</div><div className={styles.packageGrid}>{packageCards.map((card) => <article className={styles.packageCard} key={card.title}><h2>{card.title}</h2><strong>{card.price}</strong><ul>{card.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul></article>)}</div>{sections.map((section) => <article className={styles.infoPanel} id={slug(section.title)} key={section.title}><h2>{section.title}</h2>{section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</article>)}</section><LegalFooter /></main>;
}
