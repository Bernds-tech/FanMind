import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Impressum | FanMind",
  description: "Anbieterkennzeichnung, Kontakt und rechtliche Hinweise für FanMind.",
};

const sections: LegalSection[] = [
  {
    title: "Anbieterkennzeichnung",
    body: [
      "FanMind ist ein KI-gestütztes CRM- und Kommunikationssystem für strukturierte Fan- und Kontaktbeziehungen. Die Plattform unterstützt Teams dabei, Kontakte zu verwalten, Antwortvorschläge vorzubereiten, relevante Erinnerungen festzuhalten und Follow-ups sauber nachzuhalten.",
      "Website: https://fanmind.ch",
      "Die finale Anbieter- beziehungsweise Firmierung wird im Produktumfeld nur mit bestätigten Angaben geführt. Nicht eindeutig bestätigte Firmen-, Register-, Steuer- oder Adressdaten werden hier bewusst nicht behauptet.",
    ],
  },
  {
    title: "Kontakt",
    body: [
      "Hauptkontakt für allgemeine Anfragen, Support, Pilotzugänge und vertragliche Themen: anfrage@fanmind.ch",
      "Kontakt für Datenschutzanfragen: privacy@fanmind.ch",
      "Datenschutzanfragen können alternativ auch an anfrage@fanmind.ch gerichtet werden.",
    ],
  },
  {
    title: "Register / Steuer",
    body: [
      "Register-, steuer- oder berufsrechtliche Angaben werden ausschließlich auf Grundlage bestätigter Anbieterinformationen veröffentlicht.",
      "Solange solche Angaben im Projekt nicht final bestätigt sind, werden keine Register- oder Steuernummern, keine UID und keine berufsrechtlichen Pflichtangaben aufgeführt.",
    ],
  },
  {
    title: "Verantwortlich für Inhalte",
    body: [
      "Die inhaltliche Verantwortung für diese Website wird im Rahmen der finalen Anbieterbestätigung präzisiert und nur mit belastbaren Angaben veröffentlicht.",
      "Bis zur finalen Bestätigung werden keine Personen- oder Unternehmensdaten ergänzt, die nicht eindeutig im Projekt hinterlegt und freigegeben sind.",
    ],
  },
  {
    title: "Produkt- und Roadmap-Hinweis",
    body: [
      "FanMind ist kein Bot und bietet keine automatische Sendefunktion. Die KI unterstützt den Arbeitsprozess, indem sie Antwortvorschläge, Memory-Hinweise und Follow-ups vorbereitet.",
      "Der Mensch bleibt verantwortlich: Vorschläge werden geprüft, bei Bedarf angepasst und anschließend manuell im passenden Kanal versendet.",
      "Externe Social-Integrationen werden erst nach technischer und rechtlicher Prüfung aktiviert. Roadmap-, Beta-, Pilot- und Coming-Soon-Funktionen sind nicht als aktive Live-Funktionen zu verstehen, solange sie nicht ausdrücklich als verfügbar gekennzeichnet sind.",
    ],
  },
  {
    title: "Datenschutzverweis",
    body: [
      <>
        Hinweise zur Verarbeitung personenbezogener Daten stehen in der <a href="/datenschutz">Datenschutzerklärung</a>.
      </>,
      "Datenschutzanfragen können an privacy@fanmind.ch oder anfrage@fanmind.ch gerichtet werden.",
    ],
  },
  {
    title: "Verbraucherstreitbeilegung",
    body: [
      "Angaben zur Teilnahme an einem Verbraucherstreitbeilegungsverfahren werden nur veröffentlicht, wenn eine entsprechende Entscheidung final bestätigt ist.",
      "Diese Information stellt keine rechtliche Zusage und keine Rechtsberatung dar.",
    ],
  },
];

export default function ImpressumPage() {
  return (
    <LegalPage
      badge="Anbieterkennzeichnung"
      title="Impressum"
      intro="Kontakt- und Anbieterinformationen für FanMind als KI-gestütztes CRM- und Kommunikationssystem. Die Angaben werden bewusst nur auf Grundlage bestätigter Informationen geführt."
      sections={sections}
    />
  );
}
