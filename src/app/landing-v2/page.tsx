import type { Metadata } from "next";
import Image from "next/image";
import type { FeatureKey } from "@/config/plans";
import { shouldShowFeature } from "@/lib/plans";
import ProductShowcaseSection from "@/components/landing/ProductShowcaseSection";
import styles from "./landing-v2.module.css";

export const metadata: Metadata = {
  title: "FanMind | KI-CRM für Creator, Clubs und Events",
  description:
    "FanMind bündelt Kontakte, Gespräche, Fan-Gedächtnis, Follow-ups, CSV-Import und Roadmap für smarte Fan-Beziehungen; Kampagnen, Analytics und Integrationen bleiben im MVP klar markierte Vorschau.",
};

const navItems = [
  { label: "Produkt", href: "#produkt", caret: true },
  { label: "Features", href: "#features" },
  { label: "Zielgruppen", href: "#zielgruppen", caret: true },
  { label: "Screens", href: "#screens" },
  { label: "Preise", href: "#preise" },
  { label: "Ressourcen", href: "#ressourcen", caret: true },
  { label: "Kontakt", href: "#kontakt" },
];

const trustLogos = [
  "FC Bayern München",
  "BVB 09",
  "LEAGUE of LEGENDS",
  "BIG",
  "ELEVATE Festival",
  "Red Bull",
  "SK Gaming",
  "Team Liquid",
  "DAZN",
  "ELIAS NERLICH",
];

const features = [
  {
    icon: "✉",
    title: "Alle Kanäle im Blick",
    text: "Kontaktpunkte, Gesprächsnotizen und Kanal-Kontext werden zentral dokumentiert – dein Team behält alles nachvollziehbar im Blick.",
    tone: "blue",
  },
  {
    icon: "🧠",
    title: "KI versteht deine Fans",
    text: "Intelligente Vorschläge, geprüfte Antwortentwürfe und smarte Insights für bessere Beziehungen.",
    tone: "purple",
  },
  {
    icon: "♙",
    title: "Segmentieren & personalisieren",
    text: "Erstelle präzise Segmente und bereite die richtige Botschaft zur richtigen Zeit vor.",
    tone: "green",
  },
  {
    icon: "📣",
    title: "Kampagnen vorbereiten",
    text: "Plane Kampagnenentwürfe als Vorschau – ohne automatischen Versand und ohne vollständige Versandfunktion.",
    tone: "orange",
  },
  {
    icon: "▥",
    title: "Analytics auf der Roadmap",
    text: "Roadmap-Reports zeigen, welche Auswertungen später folgen; keine vollständige Analytics-Suite im MVP.",
    tone: "cyan",
  },
  {
    icon: "⬟",
    title: "Sicher & DSGVO-konform",
    text: "Deine Daten sind sicher, verschlüsselt und in europäischen Rechenzentren gehostet.",
    tone: "violet",
  },
];

const problemCards = [
  {
    icon: "⌘",
    title: "Zu viele Kanäle",
    text: "E-Mails, Chats, Socials, WhatsApp und Formulare laufen parallel – aber nichts ist wirklich zentralisiert.",
    detail: "Informationen gehen verloren und Doppelarbeit entsteht.",
  },
  {
    icon: "🧠",
    title: "Zu wenig Gedächtnis",
    text: "Wichtige Details, Vorlieben und bisherige Interaktionen gehen unter. Jeder Kontakt fühlt sich wieder wie der erste an.",
    detail: "Keine persönliche Ansprache, weniger Bindung.",
  },
  {
    icon: "◷",
    title: "Zu wenig Timing",
    text: "Kein Überblick über Follow-ups und Kampagnen. Chancen werden verpasst, Antworten kommen zu spät – oder gar nicht.",
    detail: "Verpasste Gelegenheiten kosten Umsatz und Fans.",
  },
];

const solutionBenefits = [
  { icon: "♙", title: "Alle Kontakte", text: "an einem Ort." },
  { icon: "🧠", title: "Kontext & Historie", text: "für jede Interaktion." },
  { icon: "✦", title: "KI-Vorschläge & Abläufe", text: "unterstützen dich." },
  { icon: "⌁", title: "Messbare Ergebnisse", text: "und Wachstum." },
];

const functionCards = [
  {
    icon: "♙",
    title: "1. Kontakte",
    text: "Alle Fans und Interaktionen an einem Ort.",
    body: "Sandra M. 92 · Alex 88 · Mia 85",
    cta: "Alle Kontakte ansehen",
    tone: "blue",
  },
  {
    icon: "🧠",
    title: "2. Fan-Gedächtnis",
    text: "Wichtige Details, Interessen und Historie übersichtlich festhalten.",
    body: "VIP · premium_interessiert · Letzter Kontakt: Heute, 09:42",
    cta: "Details ansehen",
    tone: "green",
  },
  {
    icon: "✦",
    title: "3. KI-Antworten",
    text: "KI liefert passende Vorschläge. Du prüfst und gibst frei.",
    body: "Vorschlag: Early-Bird Zugang und 10 % Rabatt sind noch verfügbar.",
    cta: "KI entdecken",
    tone: "purple",
  },
  {
    icon: "▣",
    title: "4. Follow-ups",
    text: "Nächste Aktionen, Erinnerungen und Aufgaben im Blick.",
    body: "VIP-Upgrade Infos · Heute, 10:00 · Feedback abfragen",
    cta: "Alle Follow-ups",
    tone: "cyan",
  },
  {
    icon: "📣",
    title: "5. Kampagnen",
    text: "Kampagnen als geprüfte Entwürfe vorbereiten – Versand bleibt Coming Soon.",
    body: "Sommer-Event Early Bird · Vorschau · manuelle Freigabe",
    cta: "Roadmap ansehen",
    tone: "violet",
  },
  {
    icon: "⌁",
    title: "6. Analytics",
    text: "Roadmap-Ausblick für spätere Auswertungen und Wachstumssignale.",
    body: "Roadmap-Auswertung · Coming Soon",
    cta: "Roadmap öffnen",
    tone: "green",
  },
];

const menuItems: Array<{ label: string; icon: string; featureKey: FeatureKey }> = [
  { label: "Dashboard", icon: "⌂", featureKey: "dashboard" },
  { label: "Kontakte", icon: "♙", featureKey: "contacts" },
  { label: "Kanäle", icon: "▣", featureKey: "contacts" },
  { label: "Segmente", icon: "◌", featureKey: "basic_segments" },
  { label: "Follow-ups", icon: "◴", featureKey: "followups" },
  { label: "Kampagnen (Roadmap)", icon: "☆", featureKey: "campaigns" },
  { label: "Analytics (Roadmap)", icon: "▥", featureKey: "analytics" },
  { label: "KI Insights", icon: "✧", featureKey: "ai_replies" },
  { label: "Einstellungen", icon: "⚙", featureKey: "dashboard" },
];

const visibleLandingMenuItems = menuItems.filter((item) =>
  shouldShowFeature("growth", item.featureKey, "landing"),
);

const sixStepCards = [
  {
    step: "1",
    title: "Kontakt erfassen",
    copy: "Neue Kontakte aus Formularen, E-Mail, Chat oder Import sauber erfassen und zentral ablegen.",
    cardTitle: "Neuer Kontakt",
    icon: "♙",
    tone: "blue",
    rows: [
      "Avatar SM · Sandra M.",
      "sandra@mania-club.com",
      "+43 660 123 45 67",
      "VIP interessiert",
      "Quelle: Website-Formular, E-Mail-Postfach, WhatsApp Chat",
      "Kontakt gespeichert",
    ],
    cta: "Details anzeigen",
  },
  {
    step: "2",
    title: "Fan-Gedächtnis aufbauen",
    copy: "Relevante Infos, Interessen und Interaktionen zentral speichern und sinnvoll verknüpfen.",
    cardTitle: "Fan-Gedächtnis",
    icon: "🧠",
    tone: "cyan",
    rows: [
      "Interessen: Sommer-Event, VIP-Angebote",
      "Kaufhistorie: 2 Upsells gekauft",
      "Tonalität: freundlich, wertschätzend",
      "Letzter Kontakt: Heute, 09:42",
    ],
    cta: "Details anzeigen",
  },
  {
    step: "3",
    title: "KI-Antwort erhalten",
    copy: "Die KI liefert passende Antwortvorschläge zum Kontext – dein Team prüft und gibt frei.",
    cardTitle: "KI-Antwortvorschläge",
    icon: "✦",
    tone: "purple",
    badge: "BETA",
    rows: [
      "Hi Sandra! Der Vorverkauf startet am 18. Mai um 10:00 Uhr.",
      "Als Member erhältst du 10 % Rabatt in den ersten 48 Stunden.",
      "Danke für dein Interesse! Melde dich gerne bei weiteren Fragen.",
      "Freigabe durch Mensch erforderlich",
    ],
    cta: "Mehr Vorschläge anzeigen",
  },
  {
    step: "4",
    title: "Follow-up planen",
    copy: "Zur richtigen Zeit mit der passenden Botschaft – vorbereitet, priorisiert und manuell steuerbar.",
    cardTitle: "Follow-up planen",
    icon: "☑",
    tone: "blue",
    rows: [
      "Nächster Schritt: VIP-Infos + Friend-Ticket",
      "Versand: Heute, 10:00",
      "Kanäle: E-Mail, WhatsApp, Chat",
      "Priorität: Hoch",
      "Owner: Nina D.",
    ],
    cta: "Alle Follow-ups anzeigen",
  },
  {
    step: "5",
    title: "Kampagne starten",
    copy: "Segmentierte Kampagnen vorbereiten, prüfen und mit klaren Freigaben geplant ausspielen.",
    cardTitle: "Sommer-Event Early Bird",
    icon: "📣",
    tone: "green",
    badge: "Geplant",
    rows: [
      "Zielgruppe: 1.260",
      "Öffnungsrate: 38 %",
      "Conversion: 9,4 %",
      "Kanäle: E-Mail, WhatsApp, Chat",
      "Status: Entwurf geprüft",
    ],
    cta: "Kampagnen-Übersicht",
  },
  {
    step: "6",
    title: "Analytics messen",
    copy: "Wachstum, Engagement und Conversion transparent auswerten und nächste Aktionen ableiten.",
    cardTitle: "Performance-Überblick",
    icon: "⌁",
    tone: "green",
    rows: [
      "Fan-Wachstum: +12,4 %",
      "Conversion Rate: 8,7 %",
      "Antwortquote: 34,8 %",
      "Insights für Optimierung vorbereitet",
    ],
    cta: "Alle Analytics anzeigen",
  },
];

const sixStepBenefits = [
  {
    icon: "♙",
    title: "Stärkere Beziehungen",
    text: "Mehr Kontext. Mehr Relevanz. Mehr Vertrauen.",
    tone: "blue",
  },
  {
    icon: "◎",
    title: "Weniger Aufwand",
    text: "Bereite Routinen vor und fokussiere dich auf das Wesentliche.",
    tone: "green",
  },
  {
    icon: "↗",
    title: "Höhere Conversion",
    text: "Die richtige Nachricht, zum richtigen Zeitpunkt.",
    tone: "purple",
  },
  {
    icon: "◇",
    title: "Volle Kontrolle",
    text: "Transparente Daten, smarte Regeln und maximale Sicherheit.",
    tone: "cyan",
  },
];


const integrationChannels = [
  {
    icon: "✉",
    title: "E-Mail",
    text: "Anfragen zentral bündeln.",
    status: "Im MVP",
    tone: "blue",
  },
  {
    icon: "☏",
    title: "WhatsApp",
    text: "Chats als Roadmap-Kontext.",
    status: "Roadmap",
    tone: "green",
  },
  {
    icon: "◖",
    title: "Discord",
    text: "Community-Signale strukturieren.",
    status: "Roadmap",
    tone: "violet",
  },
  {
    icon: "f",
    title: "Facebook",
    text: "Nachrichten später einordnen.",
    status: "Roadmap",
    tone: "blue",
  },
  {
    icon: "𝕏",
    title: "X",
    text: "DMs als Roadmap-Quelle.",
    status: "Roadmap",
    tone: "white",
  },
  {
    icon: "♪",
    title: "TikTok",
    text: "Kommentare später abbilden.",
    status: "Roadmap",
    tone: "purple",
  },
  {
    icon: "◎",
    title: "Instagram",
    text: "DMs und Storys bündeln.",
    status: "Roadmap",
    tone: "pink",
  },
  {
    icon: "▤",
    title: "Webformulare",
    text: "Formulare sauber erfassen.",
    status: "Bereit",
    tone: "cyan",
  },
];

const integrationSources = [
  { icon: "✉", label: "E-Mail" },
  { icon: "◖", label: "Discord" },
  { icon: "☏", label: "WhatsApp" },
  { icon: "♪", label: "TikTok" },
  { icon: "◎", label: "Instagram" },
  { icon: "𝕏", label: "X" },
  { icon: "f", label: "Facebook" },
  { icon: "▤", label: "Webformulare" },
];

const integrationActions = [
  {
    icon: "♙",
    title: "Segmente",
    text: "Fans sinnvoll gruppieren.",
  },
  {
    icon: "☑",
    title: "Follow-ups",
    text: "Nachfassaktionen vorbereiten.",
  },
  {
    icon: "📣",
    title: "Kampagnen",
    text: "Geprüfte Entwürfe planen.",
  },
  {
    icon: "⌁",
    title: "Analytics",
    text: "Roadmap-Signale einordnen.",
  },
];

const integrationBenefits = [
  {
    icon: "ϟ",
    title: "Schneller verbunden",
    text: "Kanäle zentral bündeln.",
    tone: "blue",
  },
  {
    icon: "◷",
    title: "Weniger manuelle Arbeit",
    text: "Routinen schlank vorbereiten.",
    tone: "purple",
  },
  {
    icon: "▣",
    title: "Zentrale Datenbasis",
    text: "Kontext sauber zusammenführen.",
    tone: "green",
  },
  {
    icon: "◇",
    title: "Sicher & zuverlässig",
    text: "Nachvollziehbar für EU-Teams.",
    tone: "cyan",
  },
];


const responsiveBenefits = [
  {
    icon: "▯",
    title: "Mobil arbeitsfähig",
    text: "Kontakte, Follow-ups und Insights bleiben auch unterwegs übersichtlich erreichbar.",
    tone: "blue",
  },
  {
    icon: "ϟ",
    title: "Schnelle Reaktion unterwegs",
    text: "Prioritäten, Erinnerungen und nächste Schritte helfen dir, keine Chance zu verpassen.",
    tone: "purple",
  },
  {
    icon: "◎",
    title: "Konsistente Fan-Daten auf jedem Gerät",
    text: "Ein gemeinsamer Kontext für dich und dein Team – vom großen Screen bis zum Smartphone.",
    tone: "green",
  },
];




const privacyControlCards = [
  {
    number: "1",
    icon: "🛡",
    title: "DSGVO-orientierte Einwilligungen",
    text: "Einwilligungen und Opt-outs sollen transparent dokumentiert und für dein Team nachvollziehbar bleiben.",
    label: "Rechtssicher gedacht",
    tone: "blue",
  },
  {
    number: "2",
    icon: "👥",
    title: "Rollen & Rechte",
    text: "Team-Zugriffe werden bewusst geplant – mit klaren Zuständigkeiten statt ungeprüfter Vollzugriffe.",
    label: "Roadmap: Team-Rechte",
    tone: "purple",
  },
  {
    number: "3",
    icon: "▤",
    title: "Audit-Log",
    text: "Änderungen, Freigaben und sensible Aktionen sind als nachvollziehbare Protokollierung vorgesehen.",
    label: "Roadmap: Protokolle",
    tone: "green",
  },
  {
    number: "4",
    icon: "⚠",
    title: "Do-not-push-Regeln",
    text: "Präferenzen und Sperrlisten werden respektiert – für vertrauensvolle, bewusste Kommunikation.",
    label: "Automatisch geschützt gedacht",
    tone: "amber",
  },
  {
    number: "5",
    icon: "☑",
    title: "Manuelle Freigabe vor Versand",
    text: "KI-Vorschläge bleiben Vorschläge. Dein Team prüft bewusst, bevor etwas an Fans geht.",
    label: "Kontrolle vor Versand",
    tone: "violet",
  },
  {
    number: "6",
    icon: "✦",
    title: "EU-Datenfokus",
    text: "Datenschutz, Transparenz und europäische Anforderungen werden als Produktprinzip mitgedacht.",
    label: "Sicherheitsfokus EU",
    tone: "blue",
  },
];

const privacyControlBenefits = [
  {
    icon: "☑",
    title: "Keine automatischen Nachrichten ohne Freigabe",
    text: "Jede KI-Antwort bleibt ein geprüfter Entwurf.",
    tone: "blue",
  },
  {
    icon: "▤",
    title: "Transparente Nachvollziehbarkeit",
    text: "Wichtige Schritte werden klar sichtbar eingeordnet.",
    tone: "purple",
  },
  {
    icon: "♙",
    title: "Sichere Workflows für Teams",
    text: "Klare Prozesse, definierte Regeln und bewusste Zuständigkeiten.",
    tone: "green",
  },
];


const faqHighlights = [
  {
    icon: "▣",
    title: "Alles an einem Ort",
    text: "E-Mails, Formulare und Gesprächsnotizen werden zentral gebündelt.",
    accent: "Weniger Chaos, mehr Überblick",
    tone: "purple",
  },
  {
    icon: "🧠",
    title: "KI, die versteht",
    text: "FanMind bereitet passende Vorschläge vor – dein Team prüft und entscheidet.",
    accent: "Intelligent & kontextbasiert",
    tone: "green",
  },
  {
    icon: "🛡",
    title: "Sicher & DSGVO-orientiert",
    text: "Datenschutz, Transparenz und bewusste Freigaben stehen im Fokus.",
    accent: "Vertrauen & Transparenz",
    tone: "blue",
  },
  {
    icon: "▥",
    title: "Messbar mehr Wirkung",
    text: "Kontakte, Follow-ups und Roadmap-Signale helfen dir, Wirkung besser einzuordnen.",
    accent: "Mehr Impact, weniger Aufwand",
    tone: "violet",
  },
];

const faqs = [
  {
    number: "1",
    question: "Für wen ist FanMind gedacht?",
    answer:
      "FanMind ist für Creator, Clubs, Agenturen und Brands gedacht, die Fan-Kommunikation professionell verwalten und strukturieren wollen – vom ersten Pilot bis zum wachsenden Team.",
    open: true,
  },
  {
    number: "2",
    question: "Kann FanMind E-Mail, WhatsApp und Chat verbinden?",
    answer:
      "E-Mail, Kontakte, CSV-Import und zentrale Gesprächsnotizen stehen im MVP im Fokus. Weitere Kanäle wie WhatsApp, Social DMs und Community-Chats sind als Roadmap transparent markiert.",
  },
  {
    number: "3",
    question: "Sendet die KI automatisch Nachrichten?",
    answer:
      "Nein. FanMind bereitet KI-Vorschläge vor, aber dein Team prüft Inhalte bewusst und gibt Kommunikation selbst frei. Es gibt keinen ungeprüften automatischen Versand.",
  },
  {
    number: "4",
    question: "Sind meine Daten DSGVO-konform geschützt?",
    answer:
      "FanMind ist mit Datenschutz-Fokus, klaren Freigaben und EU-orientierten Produktprinzipien konzipiert. Sensible Workflows werden bewusst transparent gehalten.",
  },
  {
    number: "5",
    question: "Kann ich mehrere Profile oder Kunden verwalten?",
    answer:
      "Mehrere Profile und Kunden sind vor allem für Growth- und Agency-Workflows vorgesehen. Im Pilot klären wir gemeinsam, welche Struktur für dein Team sinnvoll ist.",
  },
  {
    number: "6",
    question: "Kann ich bestehende Kontakte importieren?",
    answer:
      "Ja, Kontakt-Import per CSV ist Teil des Produktfokus. Feld-Zuordnung, Validierung und größere Import-Workflows werden schrittweise ausgebaut.",
  },
  {
    number: "7",
    question: "Gibt es Early Access oder eine Demo?",
    answer:
      "Ja. Du kannst eine Demo oder Early Access anfragen, damit wir FanMind mit deinem konkreten Use Case und deinen Fan-Prozessen einordnen.",
  },
];

const faqContacts = [
  {
    icon: "✉",
    title: "Kontakt aufnehmen",
    text: "Schreib uns eine Nachricht oder buche ein persönliches Gespräch.",
    cta: "Jetzt schreiben",
    href: "mailto:kontakt@fanmind.de?subject=Frage%20zu%20FanMind",
    tone: "blue",
  },
  {
    icon: "▶",
    title: "Demo anfragen",
    text: "Erlebe FanMind live und sieh, wie es für dich funktioniert.",
    cta: "Demo anfragen",
    href: "#demo",
    tone: "purple",
  },
  {
    icon: "ϟ",
    title: "Antwort in unter 24 Stunden",
    text: "Wir antworten schnell – persönlich und auf den Punkt.",
    cta: "Mehr erfahren",
    href: "#early-access",
    tone: "green",
  },
];


const landingFooterColumns = [
  {
    icon: "✦",
    title: "Produkt",
    links: [
      { label: "Features", href: "#features" },
      { label: "Integrationen", href: "#integrationen" },
      { label: "Preise", href: "#preise" },
      { label: "Demo", href: "#demo" },
    ],
  },
  {
    icon: "👥",
    title: "Unternehmen",
    links: [
      { label: "Über FanMind", href: "#produkt" },
      { label: "Kontakt", href: "#kontakt" },
      { label: "Partner", href: "#zielgruppen" },
      { label: "Karriere", href: "#kontakt" },
    ],
  },
  {
    icon: "▤",
    title: "Ressourcen",
    links: [
      { label: "FAQ", href: "#faq" },
      { label: "Datenschutz", href: "#datenschutz-kontrolle" },
      { label: "Impressum", href: "#impressum" },
      { label: "AGB", href: "#agb" },
    ],
  },
  {
    icon: "🛡",
    title: "Rechtliches",
    links: [
      { label: "DSGVO", href: "#datenschutz-kontrolle" },
      { label: "Cookies", href: "#cookies" },
      { label: "Sicherheit", href: "#datenschutz-kontrolle" },
    ],
  },
];

const landingFooterSocials = [
  { label: "Instagram", href: "https://www.instagram.com/", icon: "◎" },
  { label: "LinkedIn", href: "https://www.linkedin.com/", icon: "in" },
  { label: "X", href: "https://x.com/", icon: "𝕏" },
  { label: "YouTube", href: "https://www.youtube.com/", icon: "▶" },
  { label: "Discord", href: "https://discord.com/", icon: "◖" },
];

const pricingPlans = [
  {
    icon: "🚀",
    name: "Pilot",
    eyebrow: "Zum Einstieg",
    audience: "Für Teams, die FanMind real testen möchten.",
    pricePrefix: "",
    price: "990 €",
    cadence: "einmalig",
    cta: "Pilot anfragen",
    tone: "purple",
    featured: false,
    features: [
      "Geführter Setup- & Demo-Start",
      "1 Demo-Workspace",
      "Beispielkontakte & Demo-Daten",
      "KI-Antwortvorschläge testen",
      "Memory & Follow-ups erleben",
      "Ideal für Erstgespräch / Pilotphase",
    ],
  },
  {
    icon: "♙",
    name: "Starter",
    eyebrow: "",
    audience: "Für kleine Teams mit einem ersten echten Workspace.",
    pricePrefix: "",
    price: "299 €",
    cadence: "/ Monat",
    cta: "Starter wählen",
    tone: "blue",
    featured: false,
    features: [
      "1 betreutes Profil",
      "Kontakte & CSV-Import",
      "KI-Antwortvorschläge",
      "Fan-Gedächtnis / Memory",
      "Follow-ups & Aufgaben",
      "Roadmap-Zugang",
    ],
  },
  {
    icon: "▥",
    name: "Growth",
    eyebrow: "Beliebtester Plan",
    audience: "Für wachsende Teams mit mehreren Profilen und mehr Struktur.",
    pricePrefix: "",
    price: "499 €",
    cadence: "/ Monat",
    cta: "Growth wählen",
    tone: "blue",
    featured: true,
    features: [
      "Bis zu 3–5 betreute Profile",
      "Mehr Kontakte & mehr KI-Nutzung",
      "Erweiterte Follow-ups",
      "Basis-Segmente",
      "Priority Support",
      "Skalierbarer Workspace",
    ],
  },
  {
    icon: "♧",
    name: "Agency",
    eyebrow: "",
    audience: "Für Agenturen mit mehreren Kunden und professionellem Team-Workflow.",
    pricePrefix: "ab",
    price: "990 €",
    cadence: "/ Monat",
    cta: "Demo buchen",
    tone: "purple",
    featured: false,
    features: [
      "Mehrere betreute Profile / Kunden",
      "Team-Workspace",
      "Große Kontaktmengen",
      "Erweiterte Workflow-Steuerung",
      "Persönliches Onboarding",
      "Analytics, Rollen & Integrationen als Roadmap / Coming Soon",
    ],
  },
];

const pricingProofs = [
  {
    icon: "♙",
    title: "Mensch prüft & sendet selbst",
    text: "Du behältst die Kontrolle – FanMind unterstützt dich.",
    tone: "blue",
  },
  {
    icon: "✈",
    title: "Keine automatische Sendefunktion",
    text: "FanMind sendet nicht automatisch. Du entscheidest, wann und wie.",
    tone: "purple",
  },
  {
    icon: "◇",
    title: "DSGVO-konform gedacht",
    text: "Datenschutz steht im Fokus – Privacy by Design.",
    tone: "cyan",
  },
  {
    icon: "⚑",
    title: "Roadmap klar gekennzeichnet",
    text: "Geplante Funktionen sind transparent markiert.",
    tone: "blue",
  },
  {
    icon: "▣",
    title: "Sicherer KI-Einsatz",
    text: "Prompts & Daten werden verantwortungsvoll verarbeitet.",
    tone: "green",
  },
];

const roadmapPhases = [
  {
    number: "01",
    phase: "Phase 1",
    icon: "rocket",
    title: "MVP-Kern",
    status: "Verfügbar",
    statusIcon: "●",
    tone: "blue",
    items: [
      "Login & Registrierung",
      "Dashboard & Kontakte",
      "Fan-Gedächtnis",
      "KI-Antwortvorschläge",
      "Follow-ups",
    ],
  },
  {
    number: "02",
    phase: "Phase 2",
    icon: "upload",
    title: "Kontakt-Import",
    status: "In Arbeit",
    statusIcon: "✣",
    tone: "green",
    items: [
      "CSV-Import",
      "Feld-Zuordnung",
      "Kontakt-Mapping",
      "Import-Validierung",
    ],
  },
  {
    number: "03",
    phase: "Phase 3",
    icon: "campaign",
    title: "Segmente & Kampagnen",
    status: "Coming Soon",
    statusIcon: "◷",
    tone: "purple",
    items: ["Segmente", "Kampagnen", "Vorlagen", "A/B-Tests"],
  },
  {
    number: "04",
    phase: "Phase 4",
    icon: "analytics",
    title: "Analytics & Team",
    status: "Coming Soon",
    statusIcon: "◷",
    tone: "violet",
    items: ["Analytics", "Team & Rollen", "Performance-Übersicht", "Workspaces"],
  },
  {
    number: "05",
    phase: "Phase 5",
    icon: "integrations",
    title: "Integrationen",
    status: "Coming Soon",
    statusIcon: "◷",
    tone: "gold",
    items: ["Instagram", "TikTok", "WhatsApp", "Facebook", "X & Discord"],
  },
];

const roadmapNotes = [
  {
    icon: "♢",
    title: "Mensch prüft vor Versand",
    text: "Qualität und Vertrauen stehen an erster Stelle.",
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
    title: "Roadmap wird laufend erweitert",
    text: "Deine Wünsche und Feedback fließen ein.",
    tone: "cyan",
  },
];


function RoadmapLineIcon({ icon }: { icon: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2.4,
  };

  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      {icon === "rocket" && (
        <>
          <path {...common} d="M14 46c6-1 12-5 16-10" />
          <path {...common} d="M24 42 14 54l12-4" />
          <path {...common} d="M23 31 13 29l8-8 10 2" />
          <path {...common} d="M33 41l2 10 8-8-2-10" />
          <path {...common} d="M24 40c-4-4-4-12 0-16 7-7 20-11 32-10-1 12-5 25-12 32-4 4-12 4-16 0Z" />
          <circle {...common} cx="42" cy="28" r="5" />
        </>
      )}
      {icon === "upload" && (
        <>
          <path {...common} d="M20 43h-3a10 10 0 0 1 0-20 15 15 0 0 1 28-3 11 11 0 0 1 3 22h-4" />
          <path {...common} d="M32 50V28" />
          <path {...common} d="M22 38 32 28l10 10" />
        </>
      )}
      {icon === "campaign" && (
        <>
          <path {...common} d="M35 22 52 14v30l-17-8Z" />
          <path {...common} d="M18 26h17v12H18a6 6 0 0 1 0-12Z" />
          <path {...common} d="M24 38l5 12h9l-6-12" />
          <circle {...common} cx="14" cy="18" r="4" />
          <circle {...common} cx="25" cy="15" r="3" />
        </>
      )}
      {icon === "analytics" && (
        <>
          <path {...common} d="M14 46h38" />
          <path {...common} d="M18 38V26h8v12" />
          <path {...common} d="M30 38V18h8v20" />
          <path {...common} d="M42 38V12h8v26" />
          <path {...common} d="M18 52c2-5 8-8 14-8s12 3 14 8" />
          <circle {...common} cx="22" cy="44" r="4" />
          <circle {...common} cx="32" cy="43" r="4" />
          <circle {...common} cx="42" cy="44" r="4" />
        </>
      )}
      {icon === "integrations" && (
        <>
          <circle {...common} cx="32" cy="32" r="5" />
          <circle {...common} cx="32" cy="12" r="5" />
          <circle {...common} cx="49" cy="42" r="5" />
          <circle {...common} cx="15" cy="42" r="5" />
          <circle {...common} cx="16" cy="22" r="3" />
          <circle {...common} cx="48" cy="22" r="3" />
          <path {...common} d="M32 17v10M36 35l9 5M28 35l-9 5M19 23l8 6M45 23l-8 6" />
        </>
      )}
    </svg>
  );
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <a className={styles.logo} href="#top" aria-label="FanMind Start">
      <svg viewBox="0 0 52 52" aria-hidden="true" className={styles.logoMark}>
        <path d="M25.7 17.2C22.7 7.8 13.5 4.6 9.2 9.7c-4.4 5.1.4 13.1 10.1 12.2-8.8 4.9-8.6 15.4-1.7 17.1 6.8 1.6 10.2-7.4 8.4-16.4 1.8 9 6.8 16.7 13.1 13.7 6.4-3 4.6-13.3-5-16.1 9.7-.3 12.7-9.4 7.1-13.2-5.6-3.9-13.5 1.5-15.5 10.2Z" />
        <circle cx="17.1" cy="17.5" r="3.4" />
        <circle cx="34.9" cy="17.5" r="3.4" />
        <circle cx="25.9" cy="31.5" r="3.4" />
      </svg>
      {!compact && <span>FanMind</span>}
    </a>
  );
}

function MetricCard({
  label,
  value,
  change,
  color,
}: {
  label: string;
  value: string;
  change: string;
  color: string;
}) {
  return (
    <div
      className={styles.metricCard}
      style={{ "--accent": color } as React.CSSProperties}
    >
      <div className={styles.metricIcon}>⌁</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{change}</small>
      </div>
    </div>
  );
}

export default function LandingV2() {
  return (
    <main id="top" className={styles.page}>
      <div className={styles.backgroundGlow} aria-hidden="true" />
      <section className={styles.heroSection} aria-label="Startbereich FanMind">
        <header className={styles.header}>
          <Logo />
          <nav className={styles.nav} aria-label="Hauptnavigation">
            {navItems.map((item) => (
              <a key={item.label} href={item.href}>
                {item.label}
                {item.caret && <span>⌄</span>}
              </a>
            ))}
          </nav>
          <div className={styles.headerActions}>
            <a id="login" className={styles.loginButton} href="#top">
              Login
            </a>
            <a className={styles.accessButton} href="#early-access">
              Early Access <span>→</span>
            </a>
          </div>
        </header>

        <section id="produkt" className={styles.hero}>
          <div className={styles.heroCopy}>
            <a className={styles.badge} href="#features">
              <span>NEU</span> Die intelligente Fan-Management Plattform
            </a>
            <h1>
              Das KI-CRM für <span>Creator, Clubs, Events</span> und{" "}
              <span>Fan-Communities.</span>
            </h1>
            <p>
              FanMind bündelt Kontakte, Gespräche, Fan-Gedächtnis, Segmente,
              Follow-ups, CSV-Import und Roadmap in einer intelligenten
              Plattform – damit aus Fans echte Beziehungen und messbare
              Conversions werden.
            </p>
            <div className={styles.heroCtas}>
              <a className={styles.demoButton} href="#demo">
                <span>▶</span> Demo ansehen
              </a>
              <a className={styles.outlineButton} href="#early-access">
                <span>♙</span> Early Access anfragen
              </a>
            </div>
            <div id="zielgruppen" className={styles.socialProof}>
              <div
                className={styles.avatars}
                aria-label="Creator, Clubs und Veranstalter"
              >
                {["A", "M", "J", "S"].map((avatar, index) => (
                  <span
                    key={avatar}
                    className={styles.avatar}
                    style={{ "--i": index } as React.CSSProperties}
                  >
                    {avatar}
                  </span>
                ))}
              </div>
              <p>Über 10.000 Creator, Clubs & Veranstalter vertrauen FanMind</p>
              <div className={styles.rating}>
                <strong>★★★★★</strong>
                <span>4,9/5 auf G2</span>
              </div>
            </div>
          </div>

          <div
            id="screens"
            className={styles.dashboardWrap}
            aria-label="FanMind Dashboard Mockup"
          >
            <div className={styles.dashboardShell}>
              <aside className={styles.sidebar}>
                <Logo compact />
                <span className={styles.sidebarBrand}>FanMind</span>
                <div className={styles.sidebarMenu}>
                  {visibleLandingMenuItems.map((item, index) => (
                    <a
                      className={index === 0 ? styles.activeMenu : ""}
                      href={index === 0 ? "#screens" : "#produkt"}
                      key={item.label}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                      {item.featureKey === "followups" && <b>128</b>}
                    </a>
                  ))}
                </div>
                <div className={styles.profileCard}>
                  <span>ND</span>
                  <div>
                    <strong>Nina D.</strong>
                    <small>Team Arena</small>
                  </div>
                  <i>›</i>
                </div>
              </aside>

              <section className={styles.dashboardMain}>
                <div className={styles.dashboardTopbar}>
                  <div>
                    <h2>Dashboard</h2>
                    <p>Willkommen zurück, Nina 👋</p>
                    <small>
                      Heute ist Mittwoch, der 21. Mai 2025 · 09:42 Uhr
                    </small>
                  </div>
                  <div className={styles.dashboardControls}>
                    <span>● Alle Systeme aktiv</span>
                    <button>Letzte 30 Tage⌄</button>
                    <a href="#kontakt">+ Neuer Kontakt</a>
                  </div>
                </div>

                <div className={styles.metricsGrid}>
                  <MetricCard
                    label="Gesamtfans"
                    value="10.248"
                    change="+12,1 % vs. letzter Monat"
                    color="#0b8cff"
                  />
                  <MetricCard
                    label="Aktive Fans"
                    value="4.892"
                    change="+8,8 % vs. letzter Monat"
                    color="#00d86f"
                  />
                  <MetricCard
                    label="Offene Follow-ups"
                    value="136"
                    change="12 fällig heute"
                    color="#cf34ff"
                  />
                  <MetricCard
                    label="Conversion Rate"
                    value="9,4 %"
                    change="+1,2 % vs. letzter Monat"
                    color="#00d86f"
                  />
                </div>

                <div className={styles.analyticsGrid}>
                  <div className={styles.chartCard}>
                    <div className={styles.cardTitle}>
                      <strong>Fan-Wachstum</strong>
                      <button>Letzte 30 Tage⌄</button>
                    </div>
                    <span>Entwicklung der Gesamtfans</span>
                    <div className={styles.lineChart}>
                      <svg viewBox="0 0 430 170" aria-hidden="true">
                        <defs>
                          <linearGradient
                            id="blueFill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0"
                              stopColor="#0c8cff"
                              stopOpacity="0.34"
                            />
                            <stop
                              offset="1"
                              stopColor="#0c8cff"
                              stopOpacity="0"
                            />
                          </linearGradient>
                        </defs>
                        {[32, 64, 96, 128].map((y) => (
                          <line key={y} x1="0" x2="430" y1={y} y2={y} />
                        ))}
                        {[70, 170, 270, 370].map((x) => (
                          <line key={x} y1="16" y2="164" x1={x} x2={x} />
                        ))}
                        <path
                          d="M16 126 C70 102 100 100 144 88 S236 54 285 52 S358 35 414 24 L414 164 L16 164 Z"
                          fill="url(#blueFill)"
                        />
                        <path
                          d="M16 126 C70 102 100 100 144 88 S236 54 285 52 S358 35 414 24"
                          className={styles.blueLine}
                        />
                        <path
                          d="M16 154 C82 142 116 138 153 139 S232 130 284 112 S360 96 414 82"
                          className={styles.greenLine}
                        />
                        <circle cx="285" cy="52" r="6" />
                        <circle
                          cx="284"
                          cy="112"
                          r="6"
                          className={styles.greenDot}
                        />
                      </svg>
                      <div className={styles.tooltip}>
                        13. Mai 2025
                        <br />
                        Gesamtfans: 10.248
                        <br />
                        Aktive Fans: 4.892
                      </div>
                      <div className={styles.legend}>
                        <span /> Gesamtfans <i /> Aktive Fans
                      </div>
                    </div>
                  </div>

                  <div className={styles.channelCard}>
                    <strong>Interaktionen nach Kanal</strong>
                    <span>Interaktionen pro Kanal</span>
                    {[
                      "E-Mail",
                      "Formular",
                      "Chat-Notiz",
                      "CSV-Import",
                      "Demo-Daten",
                      "Roadmap",
                    ].map((channel, index) => (
                      <div className={styles.channelRow} key={channel}>
                        <b>{channel}</b>
                        <div>
                          <span style={{ width: `${36 + index * 3}%` }} />
                          <i style={{ width: `${25 - index}%` }} />
                          <em style={{ width: `${20 + index}%` }} />
                          <small />
                        </div>
                      </div>
                    ))}
                    <div className={styles.percentScale}>
                      0% <span>20%</span>
                      <span>40%</span>
                      <span>60%</span>
                      <span>80%</span>
                      <span>100%</span>
                    </div>
                    <div className={styles.channelLegend}>
                      Nachrichten · Replies · Klicks · Sonstige
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <aside className={styles.floatingPanel}>
              <div className={styles.scoreCard}>
                <span>♡</span>
                <small>Fan Score</small>
                <strong>92 ◆</strong>
                <p>Sehr starkes Potenzial</p>
              </div>
              <div className={styles.nextAction}>
                <b>✦ Nächste beste Aktion</b>
                <div>
                  VIP-Infos +<br />
                  Friend-Ticket vorbereiten
                </div>
                <span>→ Hohe Priorität</span>
              </div>
              <div className={styles.conversionCard}>
                <span>Roadmap-Ausblick</span>
                <strong>Soon</strong>
                <small>keine Vollsuite im MVP</small>
                <svg viewBox="0 0 230 70" aria-hidden="true">
                  <path d="M4 56 C28 58 34 42 49 45 S76 43 85 38 S108 44 120 30 S141 35 151 22 S176 31 184 15 S206 20 226 7" />
                </svg>
              </div>
              <div className={styles.miniStats}>
                <div>
                  <span>Review-Quote</span>
                  <strong>38 %</strong>
                  <small>+4,2 %</small>
                </div>
                <div>
                  <span>Follow-up Quote</span>
                  <strong>34,8 %</strong>
                  <small>+2,1 %</small>
                </div>
              </div>
              <a href="#features">und viele mehr</a>
            </aside>
          </div>
        </section>

        <section
          className={styles.heroTrustBar}
          aria-label="Vertrauen von Top Creator, Clubs und Brands"
        >
          <strong>Vertraut von Top Creator, Clubs & Brands</strong>
          {trustLogos.map((logo) => (
            <span key={logo}>{logo}</span>
          ))}
        </section>

        <section id="features" className={styles.heroFeatureGrid}>
          {features.map((feature) => (
            <article
              className={styles.heroFeatureCard}
              key={feature.title}
              data-tone={feature.tone}
            >
              <div>{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </section>

        <section id="early-access" className={styles.heroBottomCta}>
          <div className={styles.gift}>▣</div>
          <div>
            <h2>Starte jetzt smartere Fan-Beziehungen.</h2>
            <p>
              Keine Kreditkarte erforderlich <span>•</span> Setup in 2 Minuten{" "}
              <span>•</span> Jederzeit kündbar
            </p>
          </div>
          <a
            id="preise"
            className={styles.accessButton}
            href="mailto:kontakt@fanmind.de?subject=Early%20Access%20FanMind"
          >
            Early Access sichern <span>→</span>
          </a>
          <a
            id="demo"
            className={styles.demoSecondary}
            href="mailto:kontakt@fanmind.de?subject=FanMind%20Demo%20ansehen"
          >
            <span>▶</span> Demo ansehen
          </a>
        </section>

      </section>

      <section
        className={styles.problemSolutionSection}
        aria-labelledby="problem-solution-title"
      >
        <div className={styles.problemOrbit} aria-hidden="true" />
        <div className={styles.problemHeader}>
          <div className={styles.problemBadge}>
            <span>!</span> DAS PROBLEM HEUTE
          </div>
          <h2 id="problem-solution-title">
            Fan-Kommunikation ist heute <span>verstreut, unübersichtlich</span>{" "}
            und <em>schwer messbar.</em>
          </h2>
          <p>
            Viele Kanäle, wenig Kontext und manuelle Prozesse verhindern echte
            Fan-Nähe, schnelle Antworten und nachhaltiges Wachstum.
          </p>
        </div>

        <div className={styles.problemSolutionGrid}>
          <div className={styles.problemCards}>
            {problemCards.map((card) => (
              <article className={styles.problemCard} key={card.title}>
                <div className={styles.problemIcon}>{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
                <div className={styles.problemMiniAlert}>
                  <span>△</span>
                  {card.detail}
                </div>
              </article>
            ))}
          </div>

          <article className={styles.solutionCard}>
            <div className={styles.solutionBadge}>
              <span>✓</span> DIE LÖSUNG
            </div>
            <h3>
              <span>FanMind</span> verbindet Kontakte, Fan-Gedächtnis, KI,
              Follow-ups und Roadmap in <em>einem System.</em>
            </h3>
            <p>
              Alle Informationen, Interaktionen und Abläufe laufen zusammen – für echte
              Fan-Beziehungen, die skalieren. KI-Vorschläge bleiben Vorschläge:
              Der Mensch prüft und gibt frei.
            </p>
            <div className={styles.solutionBenefits}>
              {solutionBenefits.map((benefit) => (
                <div key={benefit.title}>
                  <span>{benefit.icon}</span>
                  <strong>{benefit.title}</strong>
                  <small>{benefit.text}</small>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className={styles.solutionFlow}>
          {functionCards.map((card) => (
            <article
              className={styles.solutionFunctionCard}
              data-tone={card.tone}
              key={card.title}
            >
              <div className={styles.functionTitle}>
                <span>{card.icon}</span>
                <div>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </div>
              </div>
              <div className={styles.functionPreview}>{card.body}</div>
              <a href="#early-access">
                {card.cta} <span>→</span>
              </a>
            </article>
          ))}
        </div>

        <div className={styles.problemCtas}>
          <a className={styles.demoButton} href="#demo">
            <span>▶</span> Demo ansehen
          </a>
          <a className={styles.outlineButton} href="#early-access">
            <span>♙</span> Early Access anfragen
          </a>
        </div>
      </section>

      <ProductShowcaseSection />

      <section
        id="six-steps"
        className={styles.sixStepsSection}
        aria-labelledby="six-steps-title"
      >
        <div className={styles.sixStepsConstellationLeft} aria-hidden="true" />
        <div className={styles.sixStepsConstellationRight} aria-hidden="true" />
        <div className={styles.sixStepsHeader}>
          <div className={styles.sixStepsBadge}>
            <Logo compact />
            <span>FanMind in 6 Schritten</span>
          </div>
          <h2 id="six-steps-title">
            Von der ersten Anfrage bis zum geprüften <span>Follow-up.</span>
          </h2>
          <p>
            FanMind verbindet Kontakte, KI und Aktionen in einem System – damit
            du Beziehungen aufbaust, rechtzeitig reagierst und nächste Schritte
            nachvollziehbar vorbereitest.
          </p>
        </div>

        <div className={styles.processTrack} aria-label="FanMind Prozesslinie">
          {sixStepCards.map((step, index) => (
            <article
              className={styles.processStep}
              data-tone={step.tone}
              key={step.title}
            >
              <div className={styles.stepNodeWrap}>
                <span className={styles.stepNode}>{step.step}</span>
              </div>
              <h3>
                {step.step}. {step.title}
              </h3>
              <p>{step.copy}</p>
              <div className={styles.stepExampleCard}>
                <div className={styles.stepCardTitle}>
                  <span>{step.icon}</span>
                  <strong>{step.cardTitle}</strong>
                  {step.badge && <em>{step.badge}</em>}
                </div>
                <div className={styles.stepRows}>
                  {step.rows.map((row, rowIndex) => (
                    <div className={styles.stepRow} key={row}>
                      <i aria-hidden="true">
                        {rowIndex === step.rows.length - 1 ? "✓" : ""}
                      </i>
                      <span>{row}</span>
                      {index === 2 && rowIndex < 3 && (
                        <button type="button">Auswählen</button>
                      )}
                    </div>
                  ))}
                </div>
                <a href="#early-access">
                  {step.cta}
                  <span>→</span>
                </a>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.sixStepsStatement}>
          <span>★</span>
          <strong>Ein System für Beziehungen, Aktionen und Ergebnisse.</strong>
        </div>

        <div className={styles.sixStepsBenefits}>
          {sixStepBenefits.map((benefit) => (
            <article data-tone={benefit.tone} key={benefit.title}>
              <span>{benefit.icon}</span>
              <div>
                <h3>{benefit.title}</h3>
                <p>{benefit.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        id="sandra-use-case"
        className={styles.sandraUseCaseSection}
        aria-labelledby="sandra-use-case-title"
      >
        <div className={styles.sandraUseCaseHero}>
          <div className={styles.sandraUseCaseHeader}>
            <span className={styles.sandraUseCaseBadge}>Use Case Sandra M.</span>
            <h2 id="sandra-use-case-title">
              Aus Interesse wird <span>Conversion.</span>
            </h2>
            <p>
              FanMind verwandelt eine einfache Fan-Frage in den richtigen
              nächsten Schritt – kontextbasiert, persönlich und messbar
              erfolgreich.
            </p>
          </div>

          <aside
            className={styles.sandraProfileSummary}
            aria-label="Sandra M. Profil und zentrale FanMind Vorteile"
          >
            <div className={styles.sandraProfileIntro}>
              <span className={styles.sandraAvatar}>SM</span>
              <div>
                <strong>Sandra M.</strong>
                <div className={styles.sandraSignalStrip}>
                  <span>Käuferin</span>
                  <span>VIP interessiert</span>
                </div>
                <p>
                  Mia Active Club <i aria-hidden="true">•</i> Fan Score 92
                </p>
              </div>
            </div>
            <div className={styles.sandraSummaryPillars}>
              <article>
                <span>🧠</span>
                <strong>KI versteht Kontext</strong>
                <p>Relevante Insights in Echtzeit.</p>
              </article>
              <article>
                <span>✧</span>
                <strong>Next-Best-Action</strong>
                <p>Die passende Aktion zur richtigen Zeit.</p>
              </article>
              <article>
                <span>↗</span>
                <strong>Mehr Conversion</strong>
                <p>Bessere Erlebnisse, stärkere Bindung.</p>
              </article>
            </div>
          </aside>
        </div>

        <div
          className={styles.sandraUseCaseFlow}
          aria-label="FanMind Demo-Fläche für Sandra M. mit Fan-Gedächtnis, KI-Antwortvorschlägen und Follow-up-Planung"
        >
          <article className={styles.sandraFlowStep}>
            <div className={styles.sandraStepNode}>1</div>
            <h3>Sandra fragt nach dem Sommer-Event</h3>
            <div className={styles.sandraFlowCard}>
              <div className={styles.sandraMiniProfile}>
                <span>SM</span>
                <strong>Sandra M.</strong>
                <em>09:21</em>
              </div>
              <div className={styles.sandraChatWindow}>
                <div className={styles.sandraMessageInbound}>
                  Hi liebes Team! Wann startet der Vorverkauf für das Sommer-Event?
                </div>
                <div className={styles.sandraMessageOutbound}>
                  Hallo Sandra! Der Vorverkauf beginnt am 18. Mai um 10:00 Uhr. 🙂
                </div>
              </div>
              <div className={styles.sandraCardMeta}>
                <span>▱ Kanal: Chat</span>
                <span>◷ Heute, 09:21</span>
              </div>
            </div>
            <p>
              Sandra zeigt Interesse am Sommer-Event. Die Nachricht landet im
              zentralen Posteingang.
            </p>
          </article>

          <article className={styles.sandraFlowStep}>
            <div className={styles.sandraStepNode}>2</div>
            <h3>FanMind erkennt den Kontext</h3>
            <div className={styles.sandraFlowCard}>
              <div className={styles.sandraMiniProfile}>
                <span>SM</span>
                <strong>Sandra M.</strong>
                <em>Mia Active Club</em>
              </div>
              <div className={styles.sandraMemoryList}>
                <div>
                  <span>Status</span>
                  <strong>Käuferin</strong>
                </div>
                <div>
                  <span>Interesse</span>
                  <strong>VIP interessiert</strong>
                </div>
                <div>
                  <span>Fan Score</span>
                  <strong>92</strong>
                </div>
                <div>
                  <span>Historie</span>
                  <strong>48 Interaktionen</strong>
                </div>
                <div>
                  <span>Letzter Kontakt</span>
                  <strong>Heute, 09:21</strong>
                </div>
                <div>
                  <span>Positive Signale</span>
                  <strong>hohes Interesse</strong>
                </div>
              </div>
            </div>
            <p>
              FanMind vereint Profil, Historie und Verhalten zu einem klaren
              Bild – in Sekunden.
            </p>
          </article>

          <article className={styles.sandraFlowStep}>
            <div className={styles.sandraStepNode}>3</div>
            <h3>KI schlägt die passende Antwort vor</h3>
            <div className={styles.sandraFlowCard}>
              <div className={styles.sandraAiBox}>
                <div className={styles.sandraAiHeader}>
                  <span>✧</span>
                  <strong>KI-Antwortvorschlag</strong>
                  <em>Beta</em>
                </div>
                <p>
                  Ja, als Mitglied bekommst du Early-Bird-Zugang und 10 % Rabatt.
                  Wenn du möchtest, sende ich dir gleich alle Details zum Start.
                </p>
                <div>
                  <button type="button">kurzer</button>
                  <button type="button">freundlicher</button>
                  <button type="button">mit Memory</button>
                </div>
              </div>
              <div className={styles.sandraReasonList}>
                <strong>Gründe</strong>
                <span>hohes Kaufinteresse</span>
                <span>Early-Bird relevant</span>
                <span>Mitglied & VIP-Potenzial</span>
              </div>
            </div>
            <p>
              Unsere KI formuliert die beste Antwort – persönlich, relevant und
              auf Sandra abgestimmt.
            </p>
          </article>

          <article className={styles.sandraFlowStep}>
            <div className={styles.sandraStepNode}>4</div>
            <h3>Nächste beste Aktion vorgeschlagen</h3>
            <div className={styles.sandraFlowCard}>
              <div className={styles.sandraActionPanel}>
                <div>
                  <strong>VIP-Infos + Friend-Ticket senden</strong>
                  <span>Empfohlen</span>
                </div>
                <ul>
                  <li>hohes Kaufinteresse</li>
                  <li>positiver Verlauf</li>
                  <li>Early-Bird relevant</li>
                  <li>hohe Conversion-Chance</li>
                </ul>
              </div>
              <div className={styles.sandraFollowUpBox}>
                <strong>Follow-up planen</strong>
                <span>Erinnerung senden <em>Morgen, 09:00</em></span>
                <span>Segmentzuweisung prüfen <em>Morgen, 12:00</em></span>
              </div>
            </div>
            <p>
              FanMind empfiehlt die optimale Aktion und plant ein Follow-up –
              zur manuellen Freigabe.
            </p>
          </article>

          <article className={styles.sandraFlowStep}>
            <div className={styles.sandraStepNode}>5</div>
            <h3>Ergebnis: mehr Conversion, besseres Timing, mehr Impact</h3>
            <div className={`${styles.sandraFlowCard} ${styles.sandraResultCard}`}>
              <div className={styles.sandraConversionPanel}>
                <strong>Conversion</strong>
                <span>9,4 %</span>
                <em>↑ +1,2 % vs. letzter Zeitraum</em>
                <div aria-hidden="true" />
              </div>
              <div className={styles.sandraMetricPair}>
                <div>
                  <strong>Öffnungsrate</strong>
                  <span>38 %</span>
                  <em>↑ +4,2 %</em>
                </div>
                <div>
                  <strong>Antwortquote</strong>
                  <span>34,8 %</span>
                  <em>↑ +2,1 %</em>
                </div>
              </div>
            </div>
            <p>
              Sandra kauft ihr Ticket. Der richtige Zeitpunkt, die richtige
              Aktion – messbar mehr Erfolg.
            </p>
          </article>
        </div>

        <div className={styles.sandraUseCaseBenefits}>
          <div className={styles.sandraBenefitLead}>
            <span>🧠</span>
            <div>
              <strong>
                Mit Memory, KI und Follow-ups zum richtigen nächsten Schritt.
              </strong>
              <p>
                FanMind denkt mit. Für echte Verbindungen und messbare Ergebnisse.
              </p>
            </div>
          </div>
          <article>
            <span>◎</span>
            <strong>Mehr Relevanz</strong>
            <p>Jede Antwort nutzt Sandras Kontext und Fan-Gedächtnis.</p>
          </article>
          <article>
            <span>↗</span>
            <strong>Mehr Conversion</strong>
            <p>
              Passende Vorschläge entstehen aus Sandras Verlauf und aktuellem
              Bedarf.
            </p>
          </article>
          <article>
            <span>♡</span>
            <strong>Mehr Loyalität</strong>
            <p>
              Nächste Kontakte werden geplant, priorisiert und manuell freigegeben.
            </p>
          </article>
        </div>
      </section>


      <section
        id="integrationen"
        className={styles.integrationsSection}
        aria-labelledby="integrations-title"
      >
        <div className={styles.integrationsConstellationLeft} aria-hidden="true" />
        <div className={styles.integrationsConstellationRight} aria-hidden="true" />

        <div className={styles.integrationsHeader}>
          <div className={styles.integrationsBadge}>
            <span>⌬</span> INTEGRATIONEN
          </div>
          <h2 id="integrations-title">
            Verbinde deine wichtigsten <span>Kanäle.</span>
          </h2>
          <p>
            FanMind bündelt E-Mail, Formulare und Roadmap-Kanäle in einem klaren
            Workflow. Kontext wird vorbereitet, geprüft und bleibt unter
            deiner Kontrolle.
          </p>
        </div>

        <div className={styles.integrationChannelGrid}>
          {integrationChannels.map((channel) => (
            <article
              className={styles.integrationChannelCard}
              data-tone={channel.tone}
              key={channel.title}
            >
              <div className={styles.integrationChannelIcon}>{channel.icon}</div>
              <h3>{channel.title}</h3>
              <p>{channel.text}</p>
              <span>{channel.status}</span>
            </article>
          ))}
        </div>

        <div className={styles.integrationFlowPanel}>
          <div className={styles.integrationSourcePanel}>
            <strong>DATENQUELLEN</strong>
            <div>
              {integrationSources.map((source) => (
                <span key={source.label}>
                  <i aria-hidden="true">{source.icon}</i>
                  {source.label}
                  <em aria-hidden="true" />
                </span>
              ))}
            </div>
          </div>

          <svg
            className={styles.integrationFlowLinesLeft}
            aria-hidden="true"
            viewBox="0 0 120 124"
            preserveAspectRatio="none"
            focusable="false"
          >
            <defs>
              <filter id="integration-flow-glow-cyan" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="2.05" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <marker
                id="integration-flow-arrow-cyan"
                markerWidth="6.6"
                markerHeight="6.6"
                refX="5.4"
                refY="3.3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M 0.2 0.4 L 6.2 3.3 L 0.2 6.2 Q 1.4 3.3 0.2 0.4 z" />
              </marker>
            </defs>
            <g filter="url(#integration-flow-glow-cyan)">
              <path d="M 0 23 C 28 15 52 22 91 47" />
              <path d="M 0 50 C 31 45 57 50 92 59" />
              <path d="M 0 76 C 32 84 58 77 92 68" />
              <path d="M 1 100 C 32 101 60 89 91 77" />
            </g>
          </svg>

          <div className={styles.integrationBrainCard}>
            <div>🧠</div>
            <strong>FanMind</strong>
            <span>Bündelt • Ordnet • Bereitet vor</span>
          </div>

          <svg
            className={styles.integrationFlowLinesRight}
            aria-hidden="true"
            viewBox="0 0 120 124"
            preserveAspectRatio="none"
            focusable="false"
          >
            <defs>
              <filter id="integration-flow-glow-magenta" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="2.05" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <marker
                id="integration-flow-arrow-magenta"
                markerWidth="6.6"
                markerHeight="6.6"
                refX="5.4"
                refY="3.3"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M 0.2 0.4 L 6.2 3.3 L 0.2 6.2 Q 1.4 3.3 0.2 0.4 z" />
              </marker>
            </defs>
            <g filter="url(#integration-flow-glow-magenta)">
              <path d="M 119 30 C 82 25 47 30 14 48" />
              <path d="M 119 54 C 84 50 48 50 13 58" />
              <path d="M 119 72 C 84 76 49 76 13 68" />
              <path d="M 118 92 C 82 96 48 92 14 78" />
            </g>
          </svg>

          <div className={styles.integrationActionPanel}>
            <strong>AKTIONEN & ERGEBNISSE</strong>
            <div>
              {integrationActions.map((action) => (
                <article key={action.title}>
                  <span>{action.icon}</span>
                  <h3>{action.title}</h3>
                  <p>{action.text}</p>
                  <i aria-hidden="true">✓</i>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.integrationBenefits}>
          {integrationBenefits.map((benefit) => (
            <article data-tone={benefit.tone} key={benefit.title}>
              <span>{benefit.icon}</span>
              <div>
                <strong>{benefit.title}</strong>
                <p>{benefit.text}</p>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.integrationCtaBox}>
          <div>
            <a className={styles.demoButton} href="#demo">
              <span>▶</span> Demo ansehen
            </a>
            <a className={styles.outlineButton} href="#early-access">
              Early Access anfragen
            </a>
          </div>
          <p>
            <span>✓ Keine Kreditkarte erforderlich</span>
            <span>✓ MVP klar gekennzeichnet</span>
            <span>✓ Kein automatischer Versand</span>
          </p>
        </div>
      </section>


      <section
        id="roadmap"
        className={styles.roadmapSection}
        aria-labelledby="roadmap-title"
      >
        <div className={styles.roadmapConstellationLeft} aria-hidden="true" />
        <div className={styles.roadmapConstellationRight} aria-hidden="true" />

        <div className={styles.roadmapHeader}>
          <div className={styles.roadmapBadge}>
            <span>♢</span> ROADMAP & NÄCHSTE SCHRITTE
          </div>
          <h2 id="roadmap-title">
            FanMind <span>Roadmap</span>
          </h2>
          <p>Was heute verfügbar ist – und was als Nächstes kommt.</p>
        </div>

        <div className={styles.roadmapTimeline} aria-hidden="true">
          {roadmapPhases.map((phase) => (
            <div className={styles.roadmapTimelineNode} data-tone={phase.tone} key={phase.number}>
              <strong>{phase.number}</strong>
              <i />
            </div>
          ))}
        </div>

        <div className={styles.roadmapGrid}>
          {roadmapPhases.map((phase) => (
            <article className={styles.roadmapCard} data-tone={phase.tone} key={phase.phase}>
              <div className={styles.roadmapPhasePill}>{phase.phase}</div>
              <div className={styles.roadmapIcon}>
                <RoadmapLineIcon icon={phase.icon} />
              </div>
              <h3>{phase.title}</h3>
              <div className={styles.roadmapStatus}>
                <span>{phase.statusIcon}</span> {phase.status}
              </div>
              <ul>
                {phase.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className={styles.roadmapNotes}>
          {roadmapNotes.map((note) => (
            <article data-tone={note.tone} key={note.title}>
              <span>{note.icon}</span>
              <div>
                <strong>{note.title}</strong>
                <p>{note.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>


      <section
        id="responsive"
        className={styles.responsiveSection}
        aria-labelledby="responsive-title"
      >
        <div className={styles.responsiveOrbitOne} aria-hidden="true" />
        <div className={styles.responsiveOrbitTwo} aria-hidden="true" />

        <div className={styles.responsiveCopy}>
          <div className={styles.responsiveBadge}>
            <span>▯</span> RESPONSIVE EXPERIENCE
          </div>
          <h2 id="responsive-title">
            Desktop, Tablet und Mobile – <span>überall klar.</span>
          </h2>
          <p>
            FanMind ist für alle Bildschirmgrößen gestaltet: volle Übersicht am
            Desktop, schnelle Aktionen unterwegs und konsistente Fan-Daten für
            dein Team.
          </p>

          <div className={styles.responsiveBenefitList}>
            {responsiveBenefits.map((benefit) => (
              <article data-tone={benefit.tone} key={benefit.title}>
                <span>{benefit.icon}</span>
                <div>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.text}</p>
                </div>
              </article>
            ))}
          </div>

        </div>

        <div className={styles.responsiveShowcase} aria-label="FanMind Geräteansichten">
          <Image
            className={styles.responsiveDeviceVisual}
            src="/landing/08-responsive-devices.png"
            alt="FanMind Dashboard auf Desktop, Tablet und Smartphone"
            width={1536}
            height={1024}
            sizes="(max-width: 1180px) 100vw, 60vw"
            priority={false}
          />
        </div>

        <div className={styles.responsiveCtaPanel}>
          <div className={styles.responsiveCtaLead}>
            <span>🧠</span>
            <div>
              <strong>FanMind auf jedem Screen.</strong>
              <p>Volle Power, egal welches Gerät du nutzt.</p>
            </div>
          </div>
          <div className={styles.responsiveCtaActions}>
            <a className={styles.demoButton} href="#demo">
              <span>▶</span> Demo ansehen
            </a>
            <a className={styles.outlineButton} href="#early-access">
              Early Access anfragen
            </a>
          </div>
          <p>
            <span>✓ MVP klar gekennzeichnet</span>
            <span>✓ Keine Kreditkarte erforderlich</span>
            <span>✓ Kein automatischer Versand</span>
            <span>✓ Manuelle Freigabe</span>
          </p>
        </div>
      </section>


      <section
        id="preise"
        className={styles.pricingSection}
        aria-labelledby="pricing-title"
      >
        <div className={styles.pricingConstellation} aria-hidden="true" />

        <div className={styles.pricingHeader}>
          <div className={styles.pricingBadge}>
            Für Agenturen, Creator-Teams & Communities
          </div>
          <h2 id="pricing-title">
            Wähle das passende <span>FanMind-Paket</span> für deinen Einstieg.
          </h2>
          <p>
            FanMind ist ein KI-gestützter Antwort- und Memory-Assistent für
            Teams. Dieses MVP konzentriert sich auf Kontakte,
            KI-Antwortvorschläge, Memory, Follow-ups und CSV-Import.
          </p>
        </div>

        <div className={styles.pricingGrid} aria-label="FanMind Pakete">
          {pricingPlans.map((plan) => (
            <article
              className={styles.pricingPlanCard}
              data-featured={plan.featured ? "true" : undefined}
              data-tone={plan.tone}
              key={plan.name}
            >
              {plan.eyebrow && <div className={styles.pricingPlanPill}>{plan.eyebrow}</div>}
              <div className={styles.pricingPlanIcon}>{plan.icon}</div>
              <h3>{plan.name}</h3>
              <p>{plan.audience}</p>
              <div className={styles.pricingAmount}>
                {plan.pricePrefix && <span>{plan.pricePrefix}</span>}
                <strong>{plan.price}</strong>
                <small>{plan.cadence}</small>
              </div>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <a href={plan.name === "Agency" ? "#demo" : "#early-access"}>
                {plan.cta} <span>→</span>
              </a>
            </article>
          ))}
        </div>

        <div className={styles.pricingProofBar}>
          {pricingProofs.map((proof) => (
            <article data-tone={proof.tone} key={proof.title}>
              <span>{proof.icon}</span>
              <div>
                <strong>{proof.title}</strong>
                <p>{proof.text}</p>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.pricingCtaPanel}>
          <div>
            <h3>
              Baue <span>stärkere Fan-Beziehungen</span> – mit weniger Chaos
              und besseren Antworten.
            </h3>
            <p>
              FanMind bündelt Kontakte, KI, Memory und Follow-ups an einem Ort.
            </p>
          </div>
          <div className={styles.pricingCtaActions}>
            <a className={styles.demoButton} href="#demo">
              <span>▷</span> Demo ansehen
            </a>
            <a className={styles.outlineButton} href="#early-access">
              <span>🚀</span> Pilot anfragen
            </a>
            <p>
              <span>✓ Keine Kreditkarte erforderlich</span>
              <span>✓ Schneller Einstieg</span>
              <span>✓ Upgrade später möglich</span>
            </p>
          </div>
        </div>
      </section>

      <section
        id="datenschutz-kontrolle"
        className={styles.privacyControlSection}
        aria-labelledby="privacy-control-title"
      >
        <div className={styles.privacyControlAura} aria-hidden="true" />

        <div className={styles.privacyControlHero}>
          <div className={styles.privacyControlCopy}>
            <div className={styles.privacyControlBadge}>
              <span>🛡</span> DATENSCHUTZ & KONTROLLE
            </div>
            <h2 id="privacy-control-title">
              KI-Unterstützung mit <span>Kontrolle.</span>
            </h2>
            <p>
              FanMind unterstützt dein Team mit KI – während du die Kontrolle
              über Versand, Berechtigungen und Compliance jederzeit bewusst
              behältst.
            </p>

            <div className={styles.privacyOrbit} aria-label="Kontrollprinzipien rund um FanMind">
              <div className={styles.privacyOrbitCore}>
                <span>🧠</span>
                <strong>FanMind</strong>
              </div>
              <span className={`${styles.privacyOrbitItem} ${styles.privacyOrbitData}`}>
                <i>▣</i> Sichere Daten
              </span>
              <span className={`${styles.privacyOrbitItem} ${styles.privacyOrbitRoles}`}>
                <i>👥</i> Rollen & Rechte
              </span>
              <span className={`${styles.privacyOrbitItem} ${styles.privacyOrbitAudit}`}>
                <i>▤</i> Audit-Log
              </span>
              <span className={`${styles.privacyOrbitItem} ${styles.privacyOrbitRules}`}>
                <i>⚠</i> Regeln & Kontrollen
              </span>
              <span className={`${styles.privacyOrbitItem} ${styles.privacyOrbitEu}`}>
                <i>☁</i> EU-Fokus
              </span>
              <span className={`${styles.privacyOrbitItem} ${styles.privacyOrbitApproval}`}>
                <i>☑</i> Freigabe & Zustimmung
              </span>
            </div>
          </div>

          <div className={styles.privacyControlGrid}>
            {privacyControlCards.map((card) => (
              <article className={styles.privacyControlCard} data-tone={card.tone} key={card.title}>
                <span className={styles.privacyControlNumber}>{card.number}</span>
                <div className={styles.privacyControlIcon}>{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
                <div className={styles.privacyControlStatus}>
                  <span>✓</span> {card.label}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className={styles.privacyControlStatement}>
          <div className={styles.privacyStatementIcon}>🛡</div>
          <h3>
            Smarte KI. <span>Volle Kontrolle.</span> <strong>Sichere Daten.</strong>
          </h3>
          <p>
            FanMind kombiniert KI-Unterstützung mit klaren Regeln, Transparenz
            und Datenschutz – für nachhaltiges Fan-Management.
          </p>
        </div>

        <div className={styles.privacyControlBottom}>
          <div className={styles.privacyBenefitList}>
            {privacyControlBenefits.map((benefit) => (
              <article data-tone={benefit.tone} key={benefit.title}>
                <span>{benefit.icon}</span>
                <div>
                  <strong>{benefit.title}</strong>
                  <p>{benefit.text}</p>
                </div>
              </article>
            ))}
          </div>
          <div className={styles.privacyControlActions}>
            <a className={styles.demoButton} href="#datenschutz-kontrolle">
              <span>🔒</span> Datenschutz ansehen
            </a>
            <a className={styles.outlineButton} href="#demo">
              Demo buchen <span>→</span>
            </a>
            <p>
              <span>🛡</span> Vertrauen entsteht durch Sicherheit. FanMind liefert
              klare KI-Unterstützung mit bewusster Kontrolle.
            </p>
          </div>
        </div>
      </section>


      <section
        id="faq"
        className={styles.faqSection}
        aria-labelledby="faq-title"
      >
        <div className={styles.faqAura} aria-hidden="true" />

        <div className={styles.faqMainGrid}>
          <div className={styles.faqIntro}>
            <div className={styles.faqBadge}>
              <span>?</span> FAQ
            </div>
            <h2 id="faq-title">
              Häufige Fragen zu <span>FanMind</span>
            </h2>
            <p>
              Antworten auf die häufigsten Fragen von Creator, Clubs,
              Agenturen und Brands – klar, ehrlich und auf den Punkt.
            </p>

            <div className={styles.faqHighlightGrid}>
              {faqHighlights.map((item) => (
                <article className={styles.faqHighlightCard} data-tone={item.tone} key={item.title}>
                  <div className={styles.faqHighlightIcon}>{item.icon}</div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <strong>{item.accent}</strong>
                </article>
              ))}
            </div>

            <div className={styles.faqAudienceCard}>
              <span>👥</span>
              <div>
                <strong>Für Creator, Clubs, Agenturen und Brands.</strong>
                <p>Antworten für Teams mit wachsenden Communities.</p>
              </div>
            </div>
          </div>

          <div className={styles.faqList} aria-label="Häufige Fragen">
            {faqs.map((faq) => (
              <details className={styles.faqItem} key={faq.number} open={faq.open}>
                <summary>
                  <span>{faq.number}</span>
                  <strong>{faq.question}</strong>
                  <i aria-hidden="true" />
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>

        <div className={styles.faqContactPanel}>
          <div className={styles.faqContactLead}>
            <span>🎧</span>
            <div>
              <h3>Noch Fragen?</h3>
              <p>
                Unser Team ist für dich da – persönlich, schnell und zuverlässig.
              </p>
            </div>
          </div>
          {faqContacts.map((contact) => (
            <article className={styles.faqContactItem} data-tone={contact.tone} key={contact.title}>
              <span>{contact.icon}</span>
              <div>
                <strong>{contact.title}</strong>
                <p>{contact.text}</p>
                <a href={contact.href}>{contact.cta} <span>→</span></a>
              </div>
            </article>
          ))}
        </div>
      </section>


      <section
        className={styles.landingFooterSection}
        aria-labelledby="landing-footer-title"
      >
        <div className={styles.landingFooterPanel}>
          <div className={styles.landingFooterBrand}>
            <Logo />
            <h2 id="landing-footer-title">
              Das <span>KI-CRM für Creator, Clubs, Events und Fan-Communities.</span>
            </h2>
            <p>
              FanMind verbindet Kontakte, KI und Aktionen in einem System – für
              echte Fan-Beziehungen, mehr Conversion und nachhaltiges Wachstum.
            </p>

            <div className={styles.landingFooterDivider} aria-hidden="true" />

            <strong>Folge uns</strong>
            <div className={styles.landingFooterSocials} aria-label="FanMind Social Media">
              {landingFooterSocials.map((social) => (
                <a href={social.href} aria-label={social.label} key={social.label}>
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div className={styles.landingFooterNav}>
            {landingFooterColumns.map((column) => (
              <nav aria-label={column.title} key={column.title}>
                <h3>
                  <span>{column.icon}</span> {column.title}
                </h3>
                {column.links.map((link) => (
                  <a href={link.href} key={link.label}>
                    {link.label} <span>›</span>
                  </a>
                ))}
              </nav>
            ))}
          </div>

          <div className={styles.landingFooterNewsletter}>
            <div className={styles.landingFooterMailIcon}>✉</div>
            <div>
              <h3>
                Bleib <span>einen Schritt voraus.</span>
              </h3>
              <p>
                Für Updates, Early-Access-Hinweise und Insights kannst du eine
                persönliche Anfrage an unser Team senden.
              </p>
            </div>
            <div className={styles.landingFooterSignup} aria-label="Early Access Anfrage">
              <span>E-Mail-Adresse eingeben</span>
              <a href="#early-access">Early Access <span>→</span></a>
              <small>🛡 Persönliche Anfrage statt automatischem Newsletter.</small>
            </div>
          </div>
        </div>
      </section>


      <footer id="ressourcen" className={styles.siteFooter}>
        <Logo />
        <p>© 2025 FanMind. Alle Rechte vorbehalten.</p>
        <nav aria-label="Footer Navigation">
          <a id="datenschutz" href="#datenschutz">
            Datenschutz
          </a>
          <a id="impressum" href="#impressum">
            Impressum
          </a>
          <a id="agb" href="#agb">
            AGB
          </a>
          <a id="cookies" href="#cookies">
            Cookies
          </a>
        </nav>
        <div id="kontakt" className={styles.socials}>
          <a href="https://www.instagram.com/" aria-label="Instagram">
            ◎
          </a>
          <a href="https://discord.com/" aria-label="Discord">
            ◖
          </a>
          <a href="https://x.com/" aria-label="X">
            𝕏
          </a>
          <a href="https://www.linkedin.com/" aria-label="LinkedIn">
            in
          </a>
          <a href="https://www.youtube.com/" aria-label="YouTube">
            ▶
          </a>
        </div>
        <a className={styles.backTop} href="#top" aria-label="Nach oben">
          ↑
        </a>
      </footer>
    </main>
  );
}
