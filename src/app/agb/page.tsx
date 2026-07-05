import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = { title: "AGB / Vertragsbedingungen | FanMind", description: "Prüfbarer Entwurf der Vertragsbedingungen für FanMind." };

const sections: LegalSection[] = [
  { title: "Geltungsbereich", body: ["Diese Bedingungen gelten für die Nutzung von FanMind durch Kunden, Pilotkunden und registrierte Nutzer, soweit keine abweichende individuelle Vereinbarung getroffen wurde.", "Der Entwurf richtet sich primär an eine geschäftliche Nutzung; eine mögliche Verbrauchernutzung ist rechtlich gesondert zu prüfen."] },
  { title: "Leistungsbeschreibung", body: ["FanMind ist ein CRM und KI-gestützter Copy-&-Open-Assistent für Kontakte, Fan-Kontext, Notizen, Memory und manuelle Follow-ups.", "FanMind bietet keine automatische Sendefunktion: Nutzer prüfen Inhalte selbst und öffnen bzw. versenden Nachrichten eigenverantwortlich über den jeweiligen Kanal."] },
  { title: "Registrierung und Zugang", body: ["Für geschützte Bereiche ist ein Nutzerkonto erforderlich. Zugangsdaten sind vertraulich zu behandeln.", "Der Kunde ist für die Verwaltung seiner Nutzer, Rollen und Workspace-Inhalte verantwortlich."] },
  { title: "Kundendaten und Verantwortung", body: ["Kunden sind dafür verantwortlich, dass eingegebene oder importierte Fan-, Kontakt- und Kommunikationsdaten rechtmäßig verarbeitet werden dürfen.", "FanMind stellt technische Funktionen zur Verwaltung bereit und ersetzt keine rechtliche Prüfung der Kundendaten."] },
  { title: "KI-Hinweis", body: ["KI-Vorschläge sind Entwürfe und müssen vor Verwendung fachlich, inhaltlich und rechtlich geprüft werden.", "FanMind gibt keine Garantie für Vollständigkeit, Richtigkeit, Angemessenheit oder gewünschte Wirkung von KI-Ausgaben."] },
  { title: "Zahlungen, Laufzeit und Kündigung", body: ["Zahlungsmodelle, Pilotbedingungen, Laufzeiten und Kündigungsregeln sind unter /zahlungsbedingungen beschrieben.", "Abweichende Angebote oder Einzelvereinbarungen gehen diesen Bedingungen vor."] },
  { title: "Verfügbarkeit und Wartung", body: ["FanMind bemüht sich um einen stabilen Betrieb. Wartung, Updates, Sicherheitsmaßnahmen oder technische Störungen können die Verfügbarkeit zeitweise einschränken.", "Konkrete Service-Level gelten nur, wenn sie ausdrücklich vereinbart wurden."] },
  { title: "Haftung und Schlussbestimmungen", body: ["Haftungsregelungen müssen in Verträgen rechtlich final geprüft werden; zwingende gesetzliche Rechte dürfen nicht unzulässig ausgeschlossen werden.", "Informationen zur Verarbeitung personenbezogener Daten stehen in der Datenschutzerklärung unter /datenschutz."] },
];

export default function AgbPage() {
  return <LegalPage badge="Vertragsbedingungen" title="AGB / Vertragsbedingungen" intro="Kurze Vertragsbedingungen für FanMind als B2B-orientierter Entwurf. Dies ist keine Rechtsberatung." sections={sections} />;
}
