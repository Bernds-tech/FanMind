import type { Metadata } from "next";
import styles from "./impressum.module.css";

export const metadata: Metadata = {
  title: "Impressum | FanMind",
  description: "Anbieterkennzeichnung, Kontakt und rechtliche Hinweise für FanMind.",
};

const contactRows = [
  { label: "Allgemeine Anfragen", value: "anfrage@fanmind.ch", href: "mailto:anfrage@fanmind.ch" },
  { label: "Datenschutz", value: "privacy@fanmind.ch", href: "mailto:privacy@fanmind.ch" },
];

export default function ImpressumPage() {
  return (
    <main className={styles.page}>
      <div className={styles.headerWrap}>
        <header className={styles.header}>
          <a className={styles.backLink} href="/landing-v2">← Zurück</a>
          <h1>Impressum</h1>
          <p>Anbieterkennzeichnung und Kontaktinformationen für FanMind.</p>
        </header>
      </div>

      <div className={styles.contentWrap}>
        <article className={styles.document} aria-label="Impressum für FanMind">
          <p className={styles.intro}>
            Diese Seite bündelt die öffentlich bereitgestellten Anbieter-, Kontakt- und Produktinformationen für FanMind. Angaben werden bewusst nur auf Grundlage final bestätigter Informationen veröffentlicht.
          </p>

          <section className={styles.section} aria-labelledby="anbieterkennzeichnung">
            <h2 id="anbieterkennzeichnung">Für den Inhalt verantwortlich / Anbieterkennzeichnung</h2>
            <div className={styles.lines}>
              <p className={styles.line}>
                FanMind ist ein KI-gestütztes CRM- und Kommunikationssystem für strukturierte Fan- und Kontaktbeziehungen. Die Plattform unterstützt Teams dabei, Kontakte zu verwalten, Antwortvorschläge vorzubereiten, relevante Erinnerungen festzuhalten und Follow-ups sauber nachzuhalten.
              </p>
              <p className={styles.line}>
                Website: <a href="https://fanmind.ch">https://fanmind.ch</a>
              </p>
              <p className={styles.line}>
                Die finale Anbieter- beziehungsweise Firmierung wird im Produktumfeld nur mit bestätigten Angaben geführt. Nicht eindeutig bestätigte Firmen-, Register-, Steuer- oder Adressdaten werden hier bewusst nicht behauptet.
              </p>
            </div>
          </section>

          <section className={styles.section} aria-labelledby="kontakt">
            <h2 id="kontakt">Kontakt</h2>
            <dl className={styles.metaList}>
              {contactRows.map((row) => (
                <div className={styles.metaRow} key={row.label}>
                  <dt>{row.label}</dt>
                  <dd><a href={row.href}>{row.value}</a></dd>
                </div>
              ))}
            </dl>
            <p className={styles.footerNote}>Datenschutzanfragen können alternativ auch an anfrage@fanmind.ch gerichtet werden.</p>
          </section>

          <section className={styles.section} aria-labelledby="register-steuer">
            <h2 id="register-steuer">Register / Steuer</h2>
            <div className={styles.lines}>
              <p className={styles.line}>Register-, steuer- oder berufsrechtliche Angaben werden ausschließlich auf Grundlage bestätigter Anbieterinformationen veröffentlicht.</p>
              <p className={styles.line}>Solange solche Angaben im Projekt nicht final bestätigt sind, werden keine Register- oder Steuernummern, keine UID und keine berufsrechtlichen Pflichtangaben aufgeführt.</p>
            </div>
          </section>

          <section className={styles.section} aria-labelledby="verantwortlich-inhalte">
            <h2 id="verantwortlich-inhalte">Verantwortlich für Inhalte</h2>
            <div className={styles.lines}>
              <p className={styles.line}>Die inhaltliche Verantwortung für diese Website wird im Rahmen der finalen Anbieterbestätigung präzisiert und nur mit belastbaren Angaben veröffentlicht.</p>
              <p className={styles.line}>Bis zur finalen Bestätigung werden keine Personen- oder Unternehmensdaten ergänzt, die nicht eindeutig im Projekt hinterlegt und freigegeben sind.</p>
            </div>
          </section>

          <section className={styles.section} aria-labelledby="produkt-roadmap">
            <h2 id="produkt-roadmap">Produkt- und Roadmap-Hinweis</h2>
            <div className={styles.lines}>
              <p className={styles.line}>FanMind ist kein Bot und bietet keine automatische Sendefunktion. Die KI unterstützt den Arbeitsprozess, indem sie Antwortvorschläge, Memory-Hinweise und Follow-ups vorbereitet.</p>
              <p className={styles.line}>Der Mensch bleibt verantwortlich: Vorschläge werden geprüft, bei Bedarf angepasst und anschließend manuell im passenden Kanal versendet.</p>
              <p className={styles.line}>Externe Social-Integrationen werden erst nach technischer und rechtlicher Prüfung aktiviert. Roadmap-, Beta-, Pilot- und Coming-Soon-Funktionen sind nicht als aktive Live-Funktionen zu verstehen, solange sie nicht ausdrücklich als verfügbar gekennzeichnet sind.</p>
            </div>
          </section>

          <section className={styles.section} aria-labelledby="datenschutzverweis">
            <h2 id="datenschutzverweis">Datenschutzverweis</h2>
            <div className={styles.lines}>
              <p className={styles.line}>Hinweise zur Verarbeitung personenbezogener Daten stehen in der <a href="/datenschutz">Datenschutzerklärung</a>.</p>
              <p className={styles.line}>Datenschutzanfragen können an privacy@fanmind.ch oder anfrage@fanmind.ch gerichtet werden.</p>
            </div>
          </section>

          <section className={styles.section} aria-labelledby="verbraucherstreitbeilegung">
            <h2 id="verbraucherstreitbeilegung">Verbraucherstreitbeilegung</h2>
            <div className={styles.lines}>
              <p className={styles.line}>Angaben zur Teilnahme an einem Verbraucherstreitbeilegungsverfahren werden nur veröffentlicht, wenn eine entsprechende Entscheidung final bestätigt ist.</p>
              <p className={styles.line}>Diese Information stellt keine rechtliche Zusage und keine Rechtsberatung dar.</p>
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}
