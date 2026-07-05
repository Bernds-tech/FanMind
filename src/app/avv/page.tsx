import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = { title: "AVV / Auftragsverarbeitung | FanMind", description: "Informationen zur geplanten Vereinbarung zur Auftragsverarbeitung für FanMind-Pilotkunden." };

const sections: LegalSection[] = [
  { title: "Hinweis für Pilotkunden", body: ["Für Pilotkunden stellen wir auf Anfrage eine Vereinbarung zur Auftragsverarbeitung bereit.", "Diese Seite ist ein vorbereitender Überblick und ersetzt nicht die konkrete AVV-Unterzeichnung."] },
  { title: "Kategorien von Daten", body: ["Account- und Nutzerinformationen, Workspace-Daten, Fan-/Kontakt-Daten, Kommunikationsnotizen, Memory-/Follow-up-Daten und technische Logdaten.", "Zahlungsstatusdaten können verarbeitet werden; Bankdaten oder IBAN speichert FanMind nicht in der App."] },
  { title: "Zwecke der Verarbeitung", body: ["Bereitstellung des CRM, Verwaltung von Kontakten und Kontext, KI-gestützte Antwortentwürfe, Follow-up-Organisation, Betrieb, Support und Sicherheit."] },
  { title: "Unterauftragnehmer / Dienstleister", body: ["Supabase kann für Datenbank, Authentifizierung und technische Plattformfunktionen eingesetzt werden.", "OpenAI bzw. KI-Dienstleister können für KI-Verarbeitung eingesetzt werden, soweit Nutzer KI-Funktionen auslösen.", "Stripe, E-Mail/SMTP-Anbieter und Hosting-/VPS-Dienstleister können im jeweils erforderlichen Umfang eingebunden werden."] },
  { title: "Technische und organisatorische Maßnahmen", body: ["Zugriffsbeschränkung und rollenbasierte Berechtigungen.", "Verschlüsselung beim Transport, abgesicherte Infrastrukturzugänge, Backups/Hosting-Prozesse und beschränkter Serverzugriff.", "Keine Zertifizierungen werden behauptet, solange sie nicht final nachweisbar sind."] },
];

export default function AvvPage() {
  return <LegalPage badge="B2B-Datenschutz" title="AVV / Auftragsverarbeitung" intro="Überblick für Pilotkunden: FanMind kann personenbezogene Kontakt- und Fan-Daten im Auftrag verarbeiten." sections={sections} />;
}
