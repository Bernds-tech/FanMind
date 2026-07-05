import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Impressum | FanMind",
  description: "Anbieterkennzeichnung und Kontaktinformationen für FanMind.",
};

const sections: LegalSection[] = [
  { title: "Anbieter und Projektkontakt", body: ["FanMind ist ein KI-gestütztes CRM- und Kommunikationssystem für Fan-Beziehungen mit manuellem Copy-&-Open-Workflow.", "Kontakt für Anbieter- und Projektanfragen: anfrage@fanmind.ch", "Website: https://fanmind.ch"] },
  { title: "Kommunikation und Support", body: ["Für Support-, Pilot- und Vertragsfragen ist anfrage@fanmind.ch der zentrale Kontakt.", "Datenschutzanfragen können an privacy@fanmind.ch oder anfrage@fanmind.ch gerichtet werden."] },
  { title: "Rechtlicher Status", body: ["Diese Anbieterkennzeichnung ist ein Arbeitsstand für die produktionsnahe FanMind-Plattform und ersetzt keine individuelle rechtliche Prüfung.", "Konkrete register-, steuer- oder berufsrechtliche Angaben werden nicht behauptet, solange sie nicht final bestätigt sind."] },
  { title: "Preise und Produktumfang", body: ["Aktuelle Paket- und Zahlungsinformationen stehen unter /zahlungsbedingungen.", "FanMind bietet Antwortentwürfe und Arbeitsabläufe zur manuellen Prüfung; Nachrichten werden nicht automatisch versendet."] },
];

export default function ImpressumPage() {
  return <LegalPage badge="Anbieterkennzeichnung" title="Impressum" intro="Kontakt- und Anbieterinformationen für FanMind als prüfbarer Entwurf. Keine Rechtsberatung." sections={sections} />;
}
