import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Datenschutzerklärung | FanMind",
  description: "Datenschutzerklärung für FanMind als prüfbarer Entwurf.",
};

const sections: LegalSection[] = [
  { title: "Verantwortlicher und Kontakt", body: ["Kontakt für Datenschutzanfragen: privacy@fanmind.ch oder kontakt@fanmind.de.", "Die konkrete Verantwortlichenangabe wird im Vertrags- und Anbieterprozess finalisiert, ohne unbestätigte Firmendaten öffentlich zu behaupten."] },
  { title: "Welche Daten verarbeitet werden", body: ["Accountdaten wie Name, E-Mail-Adresse, Workspace-Zuordnung, Rolle und Kontostatus.", "Login-/Auth-Daten, Sitzungsdaten und sicherheitsrelevante Ereignisse.", "Workspace-Daten, Fan-/Kontakt-Daten, Nachrichten-, Notiz-, Memory- und Follow-up-Daten, die Nutzer eingeben oder importieren.", "Zahlungsstatusdaten wie Paket, Rechnungs- oder Zahlungsstatus; FanMind speichert keine Bankdaten oder IBAN in der App.", "Technische Server- und Logdaten wie IP-Adresse, Zeitpunkt, Browserinformationen, angefragte Ressourcen, Fehler- und Sicherheitslogs."] },
  { title: "Zwecke der Verarbeitung", body: ["Bereitstellung der Plattform, Registrierung, Login, Workspace-Verwaltung und Support.", "CRM-/Kontaktverwaltung, Kontextpflege, manuelle Follow-up-Verwaltung und nachvollziehbare Teamarbeit.", "Erzeugung KI-gestützter Antwortvorschläge auf Nutzeranfrage; FanMind sendet nicht automatisch.", "Zahlungsabwicklung, Rechnungsstatus, Missbrauchsprävention, Sicherheit, Fehleranalyse und stabiler Betrieb."] },
  { title: "Rechtsgrundlagen als Entwurf", body: ["Vertrag oder Vertragsanbahnung, soweit die Verarbeitung für Bereitstellung, Registrierung, Support und Abrechnung erforderlich ist.", "Berechtigtes Interesse, insbesondere für Sicherheit, Betrieb, Fehleranalyse, Produktverbesserung und Missbrauchsprävention.", "Gesetzliche Pflichten, insbesondere steuer- und handelsrechtliche Aufbewahrungspflichten, soweit einschlägig.", "Einwilligung, soweit einzelne optionale Verarbeitungen künftig ausdrücklich auf Einwilligung gestützt werden."] },
  { title: "Empfänger und Dienstleister", body: ["Supabase kann für Datenbank, Authentifizierung und Plattformfunktionen eingesetzt werden.", "OpenAI bzw. KI-Dienstleister können für KI-Verarbeitung eingesetzt werden, wenn Nutzer entsprechende Funktionen auslösen.", "Stripe verarbeitet Zahlungsdaten für Zahlungen; Zahlungsdaten werden durch den Zahlungsanbieter verarbeitet.", "E-Mail/SMTP-Anbieter, Hosting-/VPS-Dienstleister und technische Support-Dienstleister können Daten im erforderlichen Umfang verarbeiten.", "Meta oder Telegram werden nur berücksichtigt, soweit entsprechende Integrationen tatsächlich verbunden und genutzt werden."] },
  { title: "Drittlandtransfer", body: ["Einige Dienstleister können außerhalb der EU/des EWR sitzen oder dort Daten verarbeiten. In solchen Fällen sollen geeignete Garantien wie Standardvertragsklauseln oder vergleichbare Schutzmechanismen eingesetzt werden, soweit erforderlich.", "Die konkrete Dienstleisterliste und Transfergrundlage ist rechtlich final zu prüfen."] },
  { title: "Speicherdauer und Rechte", body: ["Personenbezogene Daten werden nur so lange gespeichert, wie dies für die genannten Zwecke, vertragliche Beziehungen, Support, Sicherheit oder gesetzliche Pflichten erforderlich ist.", "Betroffene Personen haben nach Maßgabe der anwendbaren Datenschutzgesetze Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch.", "Außerdem besteht ein Beschwerderecht bei einer zuständigen Datenschutzaufsichtsbehörde."] },
  { title: "Wichtige Plattformhinweise", body: ["FanMind sendet Nachrichten nicht automatisch. Nutzer prüfen und versenden Inhalte selbst über den jeweiligen Kanal.", "FanMind speichert keine Bankdaten oder IBAN in der App. Zahlungsdaten werden durch den Zahlungsanbieter verarbeitet.", "KI-Vorschläge sind Entwürfe und müssen vor Verwendung durch Nutzer geprüft werden."] },
];

export default function DatenschutzPage() {
  return <LegalPage badge="Datenschutz & Transparenz" title="Datenschutzerklärung" intro="Prüfbarer Entwurf zur Verarbeitung personenbezogener Daten bei FanMind. Dies ist keine Rechtsberatung." sections={sections} />;
}
