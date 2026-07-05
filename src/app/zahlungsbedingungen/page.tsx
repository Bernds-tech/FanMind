import type { Metadata } from "next";
import { LegalFooter, LegalHeader, type LegalSection } from "@/components/LegalPage";
import styles from "../datenschutz/datenschutz.module.css";

export const metadata: Metadata = { title: "Zahlungsbedingungen | FanMind", description: "Paket-, Laufzeit- und Zahlungsbedingungen für FanMind." };

const packageCards = [
  { title: "Pilot / Setup", price: "990 € einmalig · zzgl. USt.", bullets: ["1 Testmonat", "keine automatische Verlängerung", "endet ohne automatische Verlängerung"] },
  { title: "Starter Flex", price: "990 € Setup + 312 €/Monat · zzgl. USt.", bullets: ["monatlich kündbar", "monatliche Abrechnung", "für flexible Einstiege"] },
  { title: "Starter 12 Monate", price: "0 € Setup + 312 €/Monat · zzgl. USt.", bullets: ["12 Monate Laufzeit", "monatliche Abrechnung", "keine Einrichtungsgebühr"] },
  { title: "Growth / Agency", price: "Auf Anfrage / Coming Soon", bullets: ["nicht direkt buchbar", "individuelles Angebot", "rechtliche und technische Freigabe vor Live-Nutzung"] },
];

const sections: LegalSection[] = [
  { title: "SEPA- und Zahlungsabwicklung", body: ["Zahlungsdaten werden vom Zahlungsanbieter verarbeitet, insbesondere bei späterer Nutzung von Stripe oder vergleichbaren Zahlungsdiensten.", "FanMind speichert keine IBAN oder Bankdaten in der App-Datenbank.", "Abbuchungen oder Zahlungen erfolgen nur auf Grundlage eines gültigen Zahlungsprozesses und einer separaten Freigabe bzw. Vereinbarung."] },
  { title: "Kündigung und Laufzeit", body: ["Starter Flex ist monatlich kündbar, soweit im Angebot nichts Abweichendes vereinbart wurde.", "Der Pilot endet ohne automatische Verlängerung.", "Starter 12 Monate läuft gemäß vereinbarter 12-monatiger Laufzeit."] },
  { title: "Steuerhinweis", body: ["Alle genannten Preise verstehen sich zuzüglich gesetzlicher Umsatzsteuer, sofern nicht ausdrücklich anders angegeben.", "Rechnungs- und Steuerangaben werden im finalen Angebot bzw. Rechnungsprozess konkretisiert."] },
  { title: "B2B-Hinweis", body: ["FanMind richtet sich aktuell primär an geschäftliche Nutzer, Creator-Teams, Clubs, Agenturen und Organisationen.", "Falls eine Nutzung durch Verbraucher nicht ausgeschlossen wird, müssen Verbraucherinformationen und Widerrufsregelungen rechtlich gesondert geprüft werden."] },
];

function slug(value: string) { return value.toLowerCase().replaceAll(" ", "-").replaceAll("/", "-"); }

export default function ZahlungsbedingungenPage() {
  return <main id="top" className={styles.page}><div className={styles.backgroundGlow} aria-hidden="true" /><LegalHeader /><section className={`${styles.hero} ${styles.paymentHero}`} aria-labelledby="payment-terms-title"><p className={styles.badge}>Paket- und Zahlungsbedingungen</p><h1 id="payment-terms-title">Zahlungsbedingungen</h1><p>Prüfbarer Entwurf der Paket-, Laufzeit- und Zahlungsbedingungen. Keine Rechtsberatung.</p><a className={styles.homeLink} href="/landing-v2">Zurück zu FanMind</a><div className={styles.trustBox} aria-label="Wichtige Zahlungs-Hinweise"><span>✓ keine IBAN-Speicherung in FanMind</span><span>✓ Zahlungsanbieter verarbeitet Zahlungsdaten</span><span>✓ Pilot endet ohne Verlängerung</span><span>✓ Preise zzgl. USt.</span></div></section><section className={styles.paymentContent} aria-label="Paket- und Zahlungsmodelle"><div className={styles.packageGrid}>{packageCards.map((card) => <article className={styles.packageCard} key={card.title}><h2>{card.title}</h2><strong>{card.price}</strong><ul>{card.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul></article>)}</div>{sections.map((section) => <article className={styles.infoPanel} id={slug(section.title)} key={section.title}><h2>{section.title}</h2>{section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</article>)}</section><LegalFooter /></main>;
}
