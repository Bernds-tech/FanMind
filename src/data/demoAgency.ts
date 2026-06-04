export const demoAgency = {
  id: "agency_demo_001",
  name: "FanMind Demo Agency",
  languageDefault: "de",
  plan: "FanMind Growth"
};

export const demoUsers = [
  {
    id: "user_demo_gerhard",
    agencyId: "agency_demo_001",
    name: "Gerhard Demo",
    email: "demo@fanmind.ch",
    role: "agency_admin"
  }
];

export const demoCreators = [
  {
    id: "creator_mia_active",
    agencyId: "agency_demo_001",
    displayName: "Mia Active Club",
    platform: "manual_demo",
    language: "de",
    tone: "motivierend, warm, direkt",
    personaNotes: "Fitness-Coach mit Fokus auf Motivation, Routinen und persoenliche Challenges.",
    boundaries: "Nicht zu aggressiv verkaufen. Keine medizinischen Versprechen. Keine automatischen Nachrichten."
  },
  {
    id: "creator_dj_nova",
    agencyId: "agency_demo_001",
    displayName: "DJ Nova",
    platform: "manual_demo",
    language: "en",
    tone: "energetic, friendly, confident",
    personaNotes: "DJ profile with fan conversations around events, VIP requests and music releases.",
    boundaries: "No false event promises. No automated sending. Keep replies short and personal."
  },
  {
    id: "creator_team_arena",
    agencyId: "agency_demo_001",
    displayName: "Team Arena",
    platform: "manual_demo",
    language: "de",
    tone: "professionell, sportlich, nahbar",
    personaNotes: "Sportnahes Profil fuer Fanbindung, Events, Ticketinteresse und Community-Aktionen.",
    boundaries: "Keine falschen Ticketzusagen. Keine aggressiven Sales-Nachrichten."
  }
];

export const demoFans = [
  {
    id: "fan_lukas_01",
    agencyId: "agency_demo_001",
    creatorId: "creator_mia_active",
    handle: "lukas_fit23",
    displayName: "Lukas",
    status: "warm",
    language: "de",
    summary: "Interessiert an Trainingsplaenen und reagiert gut auf persoenliche Motivation.",
    tags: ["fitness", "challenge", "warm"],
    valueLevel: "medium"
  },
  {
    id: "fan_sandra_02",
    agencyId: "agency_demo_001",
    creatorId: "creator_mia_active",
    handle: "sandra_moves",
    displayName: "Sandra",
    status: "buyer",
    language: "de",
    summary: "Hat bereits ein Challenge-Paket gekauft und fragt nach Premium-Begleitung.",
    tags: ["buyer", "premium_interest"],
    valueLevel: "high"
  },
  {
    id: "fan_mario_03",
    agencyId: "agency_demo_001",
    creatorId: "creator_mia_active",
    handle: "mario_startet",
    displayName: "Mario",
    status: "new",
    language: "de",
    summary: "Neuer Kontakt, fragt nach Einstieg und Aufwand pro Woche.",
    tags: ["new", "beginner"],
    valueLevel: "low"
  },
  {
    id: "fan_alex_04",
    agencyId: "agency_demo_001",
    creatorId: "creator_dj_nova",
    handle: "alex_vip",
    displayName: "Alex",
    status: "vip",
    language: "en",
    summary: "Interested in VIP access and early event information.",
    tags: ["vip", "event_interest"],
    valueLevel: "high"
  },
  {
    id: "fan_nina_05",
    agencyId: "agency_demo_001",
    creatorId: "creator_dj_nova",
    handle: "nina_dance",
    displayName: "Nina",
    status: "warm",
    language: "en",
    summary: "Often reacts to music snippets and asks about new releases.",
    tags: ["music", "warm"],
    valueLevel: "medium"
  },
  {
    id: "fan_tom_06",
    agencyId: "agency_demo_001",
    creatorId: "creator_team_arena",
    handle: "tom_fanclub",
    displayName: "Tom",
    status: "warm",
    language: "de",
    summary: "Fragt nach Fanclub-Aktionen und moechte Freunde zu einem Event mitnehmen.",
    tags: ["event", "group_interest"],
    valueLevel: "medium"
  },
  {
    id: "fan_ella_07",
    agencyId: "agency_demo_001",
    creatorId: "creator_team_arena",
    handle: "ella_supports",
    displayName: "Ella",
    status: "inactive",
    language: "de",
    summary: "War frueher sehr aktiv, hat seit mehreren Wochen nicht mehr reagiert.",
    tags: ["inactive", "reactivation"],
    valueLevel: "medium"
  },
  {
    id: "fan_rene_08",
    agencyId: "agency_demo_001",
    creatorId: "creator_team_arena",
    handle: "rene1908",
    displayName: "Rene",
    status: "do_not_push",
    language: "de",
    summary: "Reagiert negativ auf Verkaufsdruck, bevorzugt sachliche kurze Antworten.",
    tags: ["careful", "do_not_push"],
    valueLevel: "low"
  }
];

export const demoMessages = [
  {
    id: "msg_001",
    fanId: "fan_lukas_01",
    creatorId: "creator_mia_active",
    direction: "inbound",
    content: "Ich wuerde gern starten, aber ich weiss nicht, ob ich das zeitlich schaffe.",
    source: "manual_demo"
  },
  {
    id: "msg_002",
    fanId: "fan_sandra_02",
    creatorId: "creator_mia_active",
    direction: "inbound",
    content: "Die Challenge war super. Gibt es etwas Persoenlicheres fuer mich?",
    source: "manual_demo"
  },
  {
    id: "msg_003",
    fanId: "fan_alex_04",
    creatorId: "creator_dj_nova",
    direction: "inbound",
    content: "Can I get early access to the next VIP event?",
    source: "manual_demo"
  }
];

export const demoMemories = [
  {
    id: "memory_001",
    fanId: "fan_lukas_01",
    creatorId: "creator_mia_active",
    memoryType: "preference",
    content: "Lukas mag kurze, motivierende Antworten und moechte realistische Wochenziele.",
    importance: "medium"
  },
  {
    id: "memory_002",
    fanId: "fan_sandra_02",
    creatorId: "creator_mia_active",
    memoryType: "purchase_signal",
    content: "Sandra hat Interesse an Premium-Begleitung nach erfolgreicher Challenge.",
    importance: "high"
  },
  {
    id: "memory_003",
    fanId: "fan_rene_08",
    creatorId: "creator_team_arena",
    memoryType: "boundary",
    content: "Rene nicht draengen. Kurz, sachlich und ohne Verkaufsdruck antworten.",
    importance: "high"
  }
];

export const demoFollowups = [
  {
    id: "followup_001",
    fanId: "fan_lukas_01",
    creatorId: "creator_mia_active",
    dueLabel: "Heute",
    reason: "Nachfragen, ob ein 3-Tage-Einstieg fuer ihn machbar waere.",
    priority: "medium",
    status: "open"
  },
  {
    id: "followup_002",
    fanId: "fan_sandra_02",
    creatorId: "creator_mia_active",
    dueLabel: "Diese Woche",
    reason: "Premium-Angebot mit persoenlicher Begleitung vorsichtig vorstellen.",
    priority: "high",
    status: "open"
  },
  {
    id: "followup_003",
    fanId: "fan_alex_04",
    creatorId: "creator_dj_nova",
    dueLabel: "Heute",
    reason: "VIP-Interesse beantworten und Warteliste anbieten.",
    priority: "high",
    status: "open"
  },
  {
    id: "followup_004",
    fanId: "fan_ella_07",
    creatorId: "creator_team_arena",
    dueLabel: "Ueberfaellig",
    reason: "Reaktivierung mit freundlichem Update versuchen.",
    priority: "medium",
    status: "open"
  },
  {
    id: "followup_005",
    fanId: "fan_rene_08",
    creatorId: "creator_team_arena",
    dueLabel: "Diese Woche",
    reason: "Nur sachlich informieren, kein Sales-Druck.",
    priority: "low",
    status: "open"
  }
];

export const demoReplySuggestions = [
  {
    fanId: "fan_lukas_01",
    options: [
      {
        label: "Warm",
        text: "Verstehe ich total. Wir koennen es klein starten: 3 kurze Einheiten pro Woche, ohne Druck. Soll ich dir einen einfachen Einstieg vorschlagen?"
      },
      {
        label: "Kurz",
        text: "Klar, dann starten wir klein. 3 kurze Einheiten pro Woche reichen fuer den Anfang."
      },
      {
        label: "Follow-up",
        text: "Ich schicke dir einen einfachen Startplan und frage in zwei Tagen nach, wie es sich anfuehlt."
      }
    ],
    suggestedMemory: "Lukas ist zeitlich unsicher und braucht niedrige Einstiegshuerde.",
    suggestedFollowup: "In 2 Tagen nachfragen, ob der 3-Tage-Einstieg passt."
  }
];
