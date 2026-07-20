export type RoadmapAvailability = "done" | "upcoming" | "later";

export type RoadmapItemState = "done" | "progress" | "partial" | "planned" | "later";

export type RoadmapPhase = {
  number: string;
  phase: string;
  icon: string;
  title: string;
  status: string;
  statusIcon: string;
  tone: string;
  availability: RoadmapAvailability;
  items: Array<{ label: string; state: RoadmapItemState; status?: string }>;
};

export const roadmapPhases: RoadmapPhase[] = [
  {
    number: "01",
    phase: "Phase 1",
    icon: "rocket",
    title: "Produktkern",
    status: "Verfügbar",
    statusIcon: "✓",
    tone: "blue",
    availability: "done",
    items: [
      { label: "Login & Registrierung", state: "done" },
      { label: "Dashboard & Fans", state: "done" },
      { label: "Manuelle Fans", state: "done" },
      { label: "CSV-Import minimal", state: "done" },
      { label: "Kontaktwissen", state: "done" },
      { label: "KI-Antwortvorschläge", state: "done" },
      { label: "Follow-ups", state: "done" },
      { label: "Kommunikationsübersicht", state: "done" },
    ],
  },

  {
    number: "02",
    phase: "Phase 2",
    icon: "upload",
    title: "Fan-Import & Datenqualität",
    status: "Erledigt / Basis steht",
    statusIcon: "✓",
    tone: "green",
    availability: "done",
    items: [
      { label: "Erweiterte CSV-Feldzuordnung", state: "done" },
      { label: "Import-Validierung", state: "done" },
      { label: "Fan-Mapping", state: "done" },
      { label: "Duplikaterkennung", state: "done" },
      { label: "Segment-Vorbereitung", state: "done" },
    ],
  },

  {
    number: "03",
    phase: "Phase 3",
    icon: "integrations",
    title: "Meta-Vorbereitung",
    status: "Beta / in Vorbereitung",
    statusIcon: "◷",
    tone: "blue",
    availability: "upcoming",
    items: [
      { label: "Facebook", state: "planned", status: "Roadmap" },
      { label: "Instagram", state: "planned", status: "Roadmap" },
      { label: "WhatsApp", state: "planned", status: "Roadmap" },
      { label: "Technische & rechtliche Prüfung", state: "planned", status: "Pflicht" },
    ],
  },

  {
    number: "04",
    phase: "Phase 4",
    icon: "upload",
    title: "Verkaufsstart freigegeben",
    status: "Erledigt / Verkaufsstart freigegeben",
    statusIcon: "✓",
    tone: "green",
    availability: "done",
    items: [
      { label: "Stripe-Live-Schritte", state: "done", status: "Erledigt" },
      { label: "Abrechnung & Admin-Basis", state: "done", status: "Erledigt" },
      { label: "Profil/Paket/Rechnungen", state: "done", status: "Erledigt" },
      { label: "Sales-Unterlagen", state: "done", status: "Vorbereitet" },
      { label: "Produktionsfreigabe", state: "done", status: "Erledigt" },
      { label: "Finaler Go-Live-Smoke-Test", state: "done", status: "Erledigt" },
    ],
  },

  {
    number: "05",
    phase: "Phase 5",
    icon: "analytics",
    title: "Produktion & Testumgebung",
    status: "Technisch abgesichert",
    statusIcon: "◷",
    tone: "violet",
    availability: "upcoming",
    items: [
      { label: "Operations-Grundlage", state: "done", status: "Produktiv aktiv" },
      { label: "Produktions- und Testdaten trennen", state: "partial", status: "Technik fertig · externe Ressourcen offen" },
      { label: "Release-Checks", state: "done", status: "Automatisch aktiv" },
      { label: "Umgebungs-Governance", state: "done", status: "Fail-closed aktiv" },
    ],
  },

  {
    number: "06",
    phase: "Phase 6",
    icon: "integrations",
    title: "Weitere Social-Kanäle",
    status: "Später",
    statusIcon: "◇",
    tone: "gold",
    availability: "later",
    items: [
      { label: "TikTok", state: "later", status: "Roadmap" },
      { label: "X / Twitter", state: "later", status: "Roadmap" },
      { label: "Discord", state: "later", status: "Roadmap" },
      { label: "LinkedIn & weitere Kanäle", state: "later", status: "Roadmap" },
    ],
  },

  {
    number: "07",
    phase: "Phase 7",
    icon: "campaign",
    title: "Segmente & Listen",
    status: "In Arbeit",
    statusIcon: "◷",
    tone: "purple",
    availability: "upcoming",
    items: [
      { label: "Segment-Ansichten", state: "planned", status: "Vorbereitet" },
      { label: "Listenlogik", state: "planned", status: "In Arbeit" },
      { label: "Filter & Tags", state: "planned", status: "In Arbeit" },
      { label: "CSV-Import für Segmente nutzen", state: "planned", status: "Nächster Schritt" },
    ],
  },

  {
    number: "08",
    phase: "Phase 8",
    icon: "campaign",
    title: "Kampagnen-Vorbereitung",
    status: "In Arbeit",
    statusIcon: "◷",
    tone: "violet",
    availability: "upcoming",
    items: [
      { label: "Geprüfte Kampagnen-Entwürfe", state: "planned", status: "Geplant" },
      { label: "Vorlagen", state: "later", status: "Coming Soon" },
      { label: "Manuelle Freigabe", state: "planned", status: "Pflicht" },
      { label: "Kein Auto-Senden", state: "planned", status: "Guardrail" },
    ],
  },

  {
    number: "09",
    phase: "Phase 9",
    icon: "analytics",
    title: "Analytics & Reichweitenerkennung",
    status: "In Kürze",
    statusIcon: "◷",
    tone: "gold",
    availability: "upcoming",
    items: [
      { label: "Reichweiten-Auswertung", state: "later", status: "Coming Soon" },
      { label: "Performance-Signale", state: "later", status: "Roadmap" },
      { label: "Fan-/Kanal-Reichweite erkennen", state: "later", status: "Roadmap" },
      { label: "Interaktionen und Wachstumssignale einordnen", state: "later", status: "Roadmap" },
      { label: "Keine Vollanalytics als Live-Suite", state: "planned", status: "Ehrlich" },
    ],
  },

  {
    number: "10",
    phase: "Phase 10",
    icon: "analytics",
    title: "Team & Rollen/Rechte",
    status: "Später",
    statusIcon: "◇",
    tone: "purple",
    availability: "later",
    items: [
      { label: "Teamzugänge", state: "later", status: "Roadmap" },
      { label: "Rollen/Rechte", state: "later", status: "Roadmap" },
      { label: "Auditierbare Freigaben", state: "later", status: "Roadmap" },
    ],
  },

  {
    number: "11",
    phase: "Phase 11",
    icon: "rocket",
    title: "Multi-Workspace / Agency",
    status: "Später",
    statusIcon: "◇",
    tone: "blue",
    availability: "later",
    items: [
      { label: "Mehrere Workspaces", state: "later", status: "Roadmap" },
      { label: "Agency-Ansichten", state: "later", status: "Roadmap" },
      { label: "Workspace-Grenzen", state: "later", status: "Roadmap" },
    ],
  },

  {
    number: "12",
    phase: "Phase 12",
    icon: "campaign",
    title: "Kostenpflichtige KI-Erweiterungen",
    status: "Später",
    statusIcon: "◇",
    tone: "violet",
    availability: "later",
    items: [
      { label: "KI Plus", state: "later", status: "bezahlte Erweiterung" },
      { label: "KI Ultra", state: "later", status: "Premium-Erweiterung" },
      { label: "Prompt-Bibliothek", state: "later", status: "Roadmap" },
      { label: "Fan-spezifische Prompts", state: "later", status: "Roadmap" },
      { label: "Automationen nur als geprüfte Erinnerungen", state: "later", status: "Kein Auto-Senden" },
    ],
  },

  {
    number: "13",
    phase: "Phase 13",
    icon: "analytics",
    title: "Datenschutz & Kontrolle",
    status: "Später",
    statusIcon: "◇",
    tone: "cyan",
    availability: "later",
    items: [
      { label: "DSGVO-orientierte Einwilligungen", state: "later", status: "Geplant" },
      { label: "Rollen & Rechte", state: "later", status: "Roadmap" },
      { label: "Audit-Log", state: "later", status: "Roadmap" },
      { label: "Do-not-push-Regeln", state: "later", status: "Roadmap" },
      { label: "Manuelle Freigabe vor Versand", state: "later", status: "Kontrollprinzip" },
      { label: "EU-Datenfokus", state: "later", status: "Produktprinzip" },
    ],
  },
] satisfies RoadmapPhase[];

export const roadmapNotes = [
  {
    icon: "♢",
    title: "Mensch prüft und sendet final selbst",
    text: "FanMind bleibt ein manueller Copy-&-Open-Workflow: KI bereitet Antworten vor, der Mensch prüft und sendet final selbst.",
    tone: "blue",
  },
  {
    icon: "▣",
    title: "Keine automatischen Nachrichten",
    text: "Keine Bots. Keine Massenmails. Kein Spam.",
    tone: "purple",
  },
  {
    icon: "ϟ",
    title: "Integrationen nach Prüfung",
    text: "Externe Kanalverbindungen sind geplant, in der Demo blockiert und werden erst nach technischer und rechtlicher Prüfung aktiviert.",
    tone: "cyan",
  },
];
