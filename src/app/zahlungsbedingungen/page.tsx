import type { Metadata } from "next";
import Link from "next/link";
import LegalTopHeader from "@/components/LegalTopHeader";
import type { ReactNode } from "react";
import { getCommercialTerms } from "@/lib/plans";
import styles from "./zahlungsbedingungen.module.css";

export const metadata: Metadata = {
  title: "Zahlungsbedingungen / Paket- und Vertragskonditionen | FanMind",
  description:
    "Preise, Laufzeiten, Zahlungsprozess, Freischaltung und Zahlungsstatus bei FanMind.",
};

const pilotTerms = getCommercialTerms("pilot_only");
const starterFlexTerms = getCommercialTerms("starter_paid_setup");
const starterCommitmentTerms = getCommercialTerms("starter_no_setup_commitment");

function euros(cents: number) {
  return `${cents / 100} €`;
}

type PackageCard = {
  title: string;
  badge: string;
  price: string;
  points: string[];
};

type PaymentSection = {
  title: string;
  content: ReactNode;
};

const trustItems = [
  "Preise zzgl. USt.",
  "Keine Bankdaten in FanMind",
  "SEPA über Zahlungsdienstleister",
  "Pilot ohne automatische Verlängerung",
];

const packageCards: PackageCard[] = [
  {
    title: "Pilot / Setup",
    badge: "Aktiv / Setup",
    price: `${euros(pilotTerms.setupFeeCents)} einmalig · zzgl. USt.`,
    points: [
      "1 Testmonat",
      "Keine automatische Verlängerung",
      "Keine Bindung",
      "Kein Abo",
      "Zahlung nur bei aktivem Checkout oder individueller Vereinbarung",
    ],
  },
  {
    title: "Starter Flex",
    badge: "Aktiv / Produktiv",
    price: `${euros(starterFlexTerms.setupFeeCents)} Setup + ${euros(starterFlexTerms.monthlyFeeCents)}/Monat · zzgl. USt.`,
    points: [
      "Monatlich kündbar, sofern nichts anderes vereinbart",
      "Produktiver MVP-Workspace",
      "1 Profil",
      "Bis zu 1.000 Kontakte, sofern technisch/vertraglich so vorgesehen",
    ],
  },
  {
    title: "Starter 12 Monate",
    badge: "Aktiv / 12 Monate",
    price: `${euros(starterCommitmentTerms.setupFeeCents)} Setup + ${euros(starterCommitmentTerms.monthlyFeeCents)}/Monat · zzgl. USt.`,
    points: ["12 Monate Laufzeit", "Produktiver MVP-Workspace", "1 Profil", "Keine Einrichtungsgebühr"],
  },
  {
    title: "Growth / Agency",
    badge: "Coming Soon",
    price: "Coming Soon / individuelles Angebot",
    points: [
      "Nicht direkt produktiv buchbar",
      "Roadmap / Vorschau",
      "Technische und rechtliche Freigabe erforderlich",
    ],
  },
];

const legalLinks = [
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" },
  { href: "/agb", label: "AGB" },
  { href: "/zahlungsbedingungen", label: "Zahlungsbedingungen" },
  { href: "mailto:kontakt@fanmind.ch", label: "Kontakt" },
];

const sections: PaymentSection[] = [
  {
    title: "Geltungsbereich",
    content: (
      <>
        <p>Diese Zahlungsbedingungen gelten für Pilot-, Starter- und künftig freigegebene Pakete von FanMind, soweit keine abweichende individuelle Vereinbarung getroffen wurde.</p>
        <p>Sie ergänzen die AGB / Vertragsbedingungen. Bei Widersprüchen gehen individuelle Angebote oder Auftragsbestätigungen vor.</p>
      </>
    ),
  },
  {
    title: "Preise und Umsatzsteuer",
    content: (
      <>
        <p>Alle Preise verstehen sich zuzüglich gesetzlicher Umsatzsteuer, sofern nicht ausdrücklich anders angegeben. Preisangaben auf der Website können durch individuelle Angebote ersetzt werden.</p>
        <p>Growth und Agency sind derzeit Coming Soon oder auf Anfrage und begründen kein verbindliches Leistungs- oder Preisversprechen.</p>
      </>
    ),
  },
  {
    title: "Pilot / Setup",
    content: <p>Pilot / Setup kostet {euros(pilotTerms.setupFeeCents)} einmalig zzgl. USt. Der Pilot umfasst einen Testmonat / Setup-Monat und endet ohne automatische Verlängerung. Eine Fortführung erfolgt nur durch ausdrückliche Vereinbarung oder Wechsel in ein anderes Paket. Der Pilot dient der Prüfung, Einrichtung und Demonstration des FanMind-MVP.</p>,
  },
  {
    title: "Starter Flex",
    content: <p>Starter Flex kostet {euros(starterFlexTerms.setupFeeCents)} Setup zzgl. USt. plus {euros(starterFlexTerms.monthlyFeeCents)}/Monat zzgl. USt. Starter Flex ist monatlich kündbar, sofern nichts anderes vereinbart wurde. Das Paket umfasst einen produktiven MVP-Workspace für ein Profil. Externe Integrationen bleiben Roadmap/Preview, soweit sie nicht ausdrücklich produktiv freigegeben und verbunden sind.</p>,
  },
  {
    title: "Starter 12 Monate",
    content: <p>Starter 12 Monate kostet {euros(starterCommitmentTerms.setupFeeCents)} Setup zzgl. USt. plus {euros(starterCommitmentTerms.monthlyFeeCents)}/Monat zzgl. USt. Die Laufzeit beträgt {starterCommitmentTerms.commitmentMonths} Monate. Die monatliche Zahlung bleibt während der Laufzeit geschuldet, sofern nichts anderes vereinbart wurde. Die Setup-Gebühr entfällt aufgrund der Laufzeitbindung.</p>,
  },
  {
    title: "Growth und Agency",
    content: <p>Growth und Agency sind derzeit Coming Soon, Roadmap oder individuelles Angebot. Sie sind nicht direkt produktiv buchbar, solange sie nicht ausdrücklich freigeschaltet sind. Preise, Laufzeiten, Leistungsumfang, Nutzer-/Profilgrenzen, Rollen, Integrationen und Analytics werden individuell oder später produktseitig festgelegt. Keine Aussage auf dieser Seite stellt Growth/Agency als bereits aktiv verfügbares Paket dar.</p>,
  },
  {
    title: "Registrierung und Zahlungsstart",
    content: <p>Die Registrierung selbst löst keine Zahlung aus. Bei Pilot und Starter wird ein Workspace vorbereitet. Der Zahlungsprozess startet erst, wenn Nutzerinnen und Nutzer den Zahlungsprozess aktiv fortsetzen oder eine individuelle Zahlungsvereinbarung getroffen wurde. Bei Pilot und Starter müssen Zahlungsbedingungen akzeptiert werden. Demo-User und temporäre Demo-Workspaces können keinen Checkout starten.</p>,
  },
  {
    title: "Zahlungsabwicklung über Stripe / SEPA",
    content: <p>Soweit der Zahlungsprozess produktiv aktiviert ist, kann FanMind Stripe für die Zahlungsabwicklung einsetzen. Die Zahlung erfolgt im Checkout über den Zahlungsdienstleister. Für Pilot kann eine einmalige Zahlung verwendet werden; für Starter kann ein Subscription-Modell verwendet werden. SEPA-Lastschrift kann als Zahlungsmethode verwendet werden. Bei SEPA-Lastschrift kann die endgültige Bestätigung einige Geschäftstage dauern. FanMind speichert keine vollständigen Bankdaten und keine IBAN in der Anwendung. Zahlungsdaten werden durch den Zahlungsdienstleister verarbeitet. Der Checkout ist nur verfügbar, wenn die technische Zahlungs-Konfiguration vollständig aktiv ist.</p>,
  },
  {
    title: "Freischaltung und Zahlungsstatus",
    content: (
      <>
        <p>Nach erfolgreicher Zahlung oder Zahlungsbestätigung kann der Workspace freigeschaltet werden. Bei ausstehenden Zahlungen bleibt der Status offen oder in Bearbeitung. Bei asynchronen Zahlungsarten kann die Freischaltung verzögert erfolgen.</p>
        <ul className={styles.statusList}>
          <li>Zahlung offen</li><li>SEPA-Bestätigung offen</li><li>aktiv</li><li>überfällig</li><li>Zahlung fehlgeschlagen</li><li>gesperrt</li><li>gekündigt</li><li>abgelaufen</li>
        </ul>
      </>
    ),
  },
  {
    title: "Fehlgeschlagene Zahlungen und Sperrung",
    content: <p>Wenn Zahlungen fehlschlagen, ausbleiben oder zurückgegeben werden, kann FanMind den Kunden informieren und eine erneute Zahlung verlangen. FanMind kann den Zugang bis zur Klärung einschränken oder sperren, soweit dies vertraglich und gesetzlich zulässig ist. Offene Zahlungsansprüche bleiben bestehen. Eine manuelle Sperrung kann bei Missbrauch, Sicherheitsrisiken oder ungeklärten Zahlungsvorgängen erfolgen.</p>,
  },
  {
    title: "Kündigung",
    content: <p>Pilot / Setup endet ohne automatische Verlängerung. Starter Flex ist monatlich kündbar, sofern nichts anderes vereinbart. Starter 12 Monate läuft für 12 Monate. Kündigungen müssen in Textform erfolgen, sofern kein anderer Kündigungsprozess bereitgestellt wird. Kündigung an: <a href="mailto:kontakt@fanmind.ch">kontakt@fanmind.ch</a>. Individuelle Angebote können abweichende Kündigungsregeln enthalten.</p>,
  },
  {
    title: "Rückerstattung und Gutschriften",
    content: <p>Rückerstattungen erfolgen nur, soweit gesetzlich vorgeschrieben oder individuell vereinbart. Setup-Leistungen, Pilot-/Einrichtungsleistungen und bereits bereitgestellte Leistungen sind grundsätzlich nicht automatisch erstattungsfähig, soweit gesetzlich zulässig. Kulanzregelungen bleiben möglich. Bei fehlerhaften Abbuchungen oder Doppelzahlungen soll der Kunde FanMind unter <a href="mailto:kontakt@fanmind.ch">kontakt@fanmind.ch</a> kontaktieren.</p>,
  },
  {
    title: "Rechnungen und Aufbewahrung",
    content: <p>Rechnungen werden elektronisch oder über den Zahlungs-/Rechnungsprozess bereitgestellt. Kunden sind für richtige Rechnungsdaten verantwortlich. Rechnungs- und Buchhaltungsdaten werden entsprechend gesetzlichen Aufbewahrungspflichten gespeichert. Steuer-ID, UID oder Rechnungsadresse können im Zahlungsprozess abgefragt werden. FanMind darf Rechnungs- und Zahlungsinformationen zur Erfüllung gesetzlicher Pflichten speichern.</p>,
  },
  {
    title: "B2B-Hinweis",
    content: <p>FanMind richtet sich aktuell primär an geschäftliche Nutzer, Creator-Teams, Clubs, Agenturen, Organisationen und Pilotkunden. Falls eine Nutzung durch Verbraucher zugelassen wird, müssen Verbraucherinformationen, Widerrufsrechte und besondere gesetzliche Pflichten gesondert geprüft und bereitgestellt werden.</p>,
  },
  {
    title: "Änderungen von Preisen und Paketen",
    content: <p>FanMind kann Preise, Pakete und Leistungsumfänge für die Zukunft ändern. Bestehende individuelle Vereinbarungen bleiben nach Maßgabe der jeweiligen Vereinbarung unberührt. Änderungen werden rechtzeitig kommuniziert, soweit sie bestehende Verträge betreffen. Coming-Soon-Funktionen begründen keinen Anspruch auf bestimmte Preise oder Termine.</p>,
  },
  {
    title: "Verhältnis zu AGB und Datenschutz",
    content: <p>Die <Link href="/agb">AGB</Link> regeln die allgemeinen Vertragsbedingungen. Die <Link href="/datenschutz">Datenschutzerklärung</Link> informiert über Datenverarbeitung. Soweit FanMind personenbezogene Daten im Auftrag eines Kunden verarbeitet, wird die Auftragsverarbeitung bei Bedarf individuell vertraglich geregelt. Ergänzende Anbieterangaben stehen im <Link href="/impressum">Impressum</Link>. Die Zahlungsbedingungen ergänzen diese Dokumente.</p>,
  },
  {
    title: "Kontakt",
    content: <p>Fragen zu Zahlungen, Rechnungen, Paketwechsel, Kündigung oder Freischaltung bitte an: <a href="mailto:kontakt@fanmind.ch">kontakt@fanmind.ch</a>.</p>,
  },
];

function sectionId(index: number) {
  return `abschnitt-${index + 1}`;
}

export default function ZahlungsbedingungenPage() {
  return (
    <main id="top" className={styles.page}>
      <div className={styles.shapeOne} aria-hidden="true" />
      <div className={styles.shapeTwo} aria-hidden="true" />
      <div className={styles.dotPattern} aria-hidden="true" />
      <div className={styles.shell}>
        <LegalTopHeader active="zahlungsbedingungen" />

        <header className={styles.hero}>
          <h1>ZAHLUNGSBEDINGUNGEN</h1>
          <p className={styles.subtitle}>Preise, Laufzeiten, Zahlungsprozess und Freischaltung bei FanMind</p>
          <p className={styles.stand}>Stand: Juli 2026</p>
          <p className={styles.intro}>Diese Zahlungsbedingungen ergänzen die AGB / Vertragsbedingungen und beschreiben Preise, Pakete, Laufzeiten, Zahlungsabläufe, Freischaltung und Zahlungsstatus bei FanMind. Abweichende individuelle Angebote, Auftragsbestätigungen oder Vereinbarungen gehen diesen Zahlungsbedingungen vor.</p>
          <div className={styles.trustBox} aria-label="Wichtige Zahlungs-Hinweise">
            {trustItems.map((item) => <span key={item}>✓ {item}</span>)}
          </div>
        </header>

        <section className={styles.packageGrid} aria-label="Paketübersicht">
          {packageCards.map((card) => (
            <article className={styles.packageCard} key={card.title}>
              <span className={styles.cardBadge}>{card.badge}</span>
              <h2>{card.title}</h2>
              <p className={styles.cardPrice}>{card.price}</p>
              <ul>{card.points.map((point) => <li key={point}>{point}</li>)}</ul>
            </article>
          ))}
        </section>

        <article className={styles.document} aria-label="Paket- und Zahlungsbedingungen für FanMind">
          {sections.map((section, index) => (
            <section className={styles.section} id={sectionId(index)} key={section.title}>
              <div className={styles.number} aria-hidden="true">{index + 1}</div>
              <div className={styles.sectionBody}>
                <h2>{section.title}</h2>
                {section.content}
              </div>
            </section>
          ))}
        </article>

        <footer className={styles.footer}>
          <div className={styles.footerBrand}>
            <strong>FanMind</strong>
            <a href="mailto:kontakt@fanmind.ch">kontakt@fanmind.ch</a>
            <a href="https://fanmind.ch">www.fanmind.ch</a>
          </div>
          <nav aria-label="Rechtliche Links">
            {legalLinks.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
          </nav>
        </footer>
      </div>
      <a className={styles.backToTop} href="#top" aria-label="Zurück nach oben">↑</a>
    </main>
  );
}
