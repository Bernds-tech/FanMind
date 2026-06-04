import { type Locale } from "./config";

type LandingCard = {
  title: string;
  text: string;
};

type LandingPlan = {
  name: string;
  price: string;
  subtitle: string;
  features: string[];
};

type ClubArea = {
  label: string;
  text: string;
};

type LandingContent = {
  mvpBadge: string;
  exampleProfileAria: string;
  exampleProfileName: string;
  exampleProfileSubtitle: string;
  clubAreas: ClubArea[];
  whyTitle: string;
  whyText: string;
  whyCards: LandingCard[];
  modulesTitle: string;
  modulesText: string;
  moduleCards: LandingCard[];
  packagesTitle: string;
  packagesText: string;
  creatorPackageBadge: string;
  fanMembershipBadge: string;
  creatorPackages: LandingPlan[];
  fanMemberships: LandingPlan[];
  pilotBadge: string;
  pilotTitle: string;
  pilotText: string;
};

export const landingContent: Record<Locale, LandingContent> = {
  de: {
    mvpBadge: "FanMind MVP Demo 0.2",
    exampleProfileAria: "Mia Active Club Beispielprofil",
    exampleProfileName: "Mia Active Club",
    exampleProfileSubtitle: "Fitness, Motivation, Community",
    clubAreas: [
      {
        label: "Kostenlos / Free",
        text: "Öffentliche Updates, Einblicke und Community-Teaser für neue Fans."
      },
      {
        label: "Club-Mitglied / Member",
        text: "Exklusive Challenges, Beiträge und Vorteile für aktive Unterstützer."
      },
      {
        label: "Premium-Fan / Premium",
        text: "Persönlichere Q&A-Formate, Premium-Momente und besondere Aktionen."
      }
    ],
    whyTitle: "Warum FanMind?",
    whyText: "FanMind ist eine seriöse europäische Direct-to-Fan-Plattform für Menschen, Clubs und Marken mit echter Community.",
    whyCards: [
      {
        title: "Weniger Algorithmus-Abhängigkeit",
        text: "Anbieter sollen ihre Fangemeinschaft direkter erreichen und nicht nur von Social-Media-Reichweite leben."
      },
      {
        title: "Eigene Einnahmequelle",
        text: "Mitgliedschaften und Premium-Inhalte schaffen wiederkehrende Einnahmen außerhalb klassischer Werbemodelle."
      },
      {
        title: "Mehr Nähe zu Fans",
        text: "FanMind stellt die Beziehung zwischen Anbieter und Fan in den Mittelpunkt."
      }
    ],
    modulesTitle: "FanMind Produktmodule",
    modulesText: "Die MVP Demo 0.2 zeigt die wichtigsten Bausteine für Profile, Mitgliedschaften und Steuerung an einem Ort.",
    moduleCards: [
      {
        title: "Anbieterprofile",
        text: "Eigene Fanclub-Seiten mit Positionierung, Beiträgen und Mitgliedschaftsangebot."
      },
      {
        title: "Mitgliedschaften",
        text: "Kostenlose Fans, Club-Mitglieder und Premium-Fans als Basis der Monetarisierung."
      },
      {
        title: "Steuerzentrale",
        text: "Eine erste Übersicht für Fans, Einnahmen, Inhalte und Community-Aktivität."
      }
    ],
    packagesTitle: "Pakete und Mitgliedschaften",
    packagesText: "FanMind trennt Anbieter-Pakete klar von Fan-Mitgliedschaften. Die Preise sind Demo-Richtwerte für den MVP.",
    creatorPackageBadge: "Anbieter-Paket",
    fanMembershipBadge: "Fan-Mitgliedschaft",
    creatorPackages: [
      {
        name: "Starter",
        price: "0 EUR",
        subtitle: "Für Pilotkunden und erste Anbieter",
        features: [
          "Eigenes Anbieterprofil",
          "Freie Beiträge",
          "Eine Mitgliedschaftsstufe",
          "Einfache Statistik",
          "Plattformgebühr auf Einnahmen"
        ]
      },
      {
        name: "Pro",
        price: "19 bis 49 EUR",
        subtitle: "Für aktive Anbieter mit wachsender Fangemeinschaft",
        features: [
          "Mehrere Mitgliedschaftsstufen",
          "Freie Inhalte und Mitgliederinhalte",
          "Premium-Inhalte",
          "Bessere Statistik",
          "Nachrichtenfunktion später"
        ]
      },
      {
        name: "Business / Verein",
        price: "ab 99 EUR",
        subtitle: "Für Vereine, Teams, Studios und Organisationen",
        features: [
          "Mehrere Anbieterprofile",
          "Teamverwaltung",
          "Vereins- oder Markenprofil",
          "Erweiterte Statistik",
          "Kampagnen und Aktionen"
        ]
      }
    ],
    fanMemberships: [
      {
        name: "Kostenloser Fan",
        price: "0 EUR",
        subtitle: "Freier Einstieg in die Fangemeinschaft",
        features: [
          "Öffentliche Beiträge",
          "Basis-Updates",
          "Vorschau auf exklusive Inhalte",
          "Zugang zum freien Bereich"
        ]
      },
      {
        name: "Club-Mitglied",
        price: "9,90 EUR",
        subtitle: "Monatliche Mitgliedschaft für exklusive Inhalte",
        features: [
          "Exklusive Beiträge",
          "Mitglieder-Updates",
          "Challenges",
          "Hintergrundinhalte",
          "Community-Vorteile"
        ]
      },
      {
        name: "Premium-Fan",
        price: "29,90 EUR",
        subtitle: "Premium-Zugang für besonders engagierte Fans",
        features: [
          "Premium-Inhalte",
          "Persönlichere Einblicke",
          "Priorisierte Fragen",
          "Besondere Aktionen",
          "Exklusive Formate"
        ]
      }
    ],
    pilotBadge: "Pilotkunden gesucht",
    pilotTitle: "FanMind wird aktuell als MVP aufgebaut.",
    pilotText: "Erste Anbieter können als Pilotkunden Feedback geben und die Plattform aktiv mitgestalten."
  },
  en: {
    mvpBadge: "FanMind MVP Demo 0.2",
    exampleProfileAria: "Mia Active Club sample profile",
    exampleProfileName: "Mia Active Club",
    exampleProfileSubtitle: "Fitness, motivation, community",
    clubAreas: [
      {
        label: "Free fan",
        text: "Public updates, behind-the-scenes glimpses and community teasers for new fans."
      },
      {
        label: "Club member",
        text: "Exclusive challenges, posts and perks for active supporters."
      },
      {
        label: "Premium fan",
        text: "More personal Q&A formats, premium moments and special campaigns."
      }
    ],
    whyTitle: "Why FanMind?",
    whyText: "FanMind is a trusted European direct-to-fan platform for people, clubs and brands with real communities.",
    whyCards: [
      {
        title: "Less algorithm dependency",
        text: "Providers can reach their fan communities more directly instead of relying only on social media reach."
      },
      {
        title: "Your own revenue stream",
        text: "Memberships and premium content create recurring revenue beyond traditional ad models."
      },
      {
        title: "Closer fan relationships",
        text: "FanMind puts the relationship between provider and fan at the center."
      }
    ],
    modulesTitle: "FanMind product modules",
    modulesText: "The MVP Demo 0.2 shows the key building blocks for profiles, memberships and management in one place.",
    moduleCards: [
      {
        title: "Provider profiles",
        text: "Dedicated fan club pages with positioning, posts and membership offers."
      },
      {
        title: "Memberships",
        text: "Free fans, club members and premium fans as the foundation for monetization."
      },
      {
        title: "Control center",
        text: "An initial overview for fans, revenue, content and community activity."
      }
    ],
    packagesTitle: "Packages and memberships",
    packagesText: "FanMind clearly separates provider packages from fan memberships. Prices are demo guide values for the MVP.",
    creatorPackageBadge: "Provider package",
    fanMembershipBadge: "Fan membership",
    creatorPackages: [
      {
        name: "Starter",
        price: "0 EUR",
        subtitle: "For pilot customers and first providers",
        features: [
          "Own provider profile",
          "Free posts",
          "One membership tier",
          "Simple analytics",
          "Platform fee on revenue"
        ]
      },
      {
        name: "Pro",
        price: "19 to 49 EUR",
        subtitle: "For active providers with a growing fan community",
        features: [
          "Multiple membership tiers",
          "Free and member-only content",
          "Premium content",
          "Better analytics",
          "Messaging feature later"
        ]
      },
      {
        name: "Business / Club",
        price: "from 99 EUR",
        subtitle: "For clubs, teams, studios and organizations",
        features: [
          "Multiple provider profiles",
          "Team management",
          "Club or brand profile",
          "Advanced analytics",
          "Campaigns and promotions"
        ]
      }
    ],
    fanMemberships: [
      {
        name: "Free fan",
        price: "0 EUR",
        subtitle: "Free entry into the fan community",
        features: [
          "Public posts",
          "Basic updates",
          "Preview of exclusive content",
          "Access to the free area"
        ]
      },
      {
        name: "Club member",
        price: "9.90 EUR",
        subtitle: "Monthly membership for exclusive content",
        features: [
          "Exclusive posts",
          "Member updates",
          "Challenges",
          "Behind-the-scenes content",
          "Community perks"
        ]
      },
      {
        name: "Premium fan",
        price: "29.90 EUR",
        subtitle: "Premium access for especially engaged fans",
        features: [
          "Premium content",
          "More personal insights",
          "Prioritized questions",
          "Special campaigns",
          "Exclusive formats"
        ]
      }
    ],
    pilotBadge: "Looking for pilot customers",
    pilotTitle: "FanMind is currently being built as an MVP.",
    pilotText: "First providers can give feedback as pilot customers and actively shape the platform."
  },
  ro: {
    mvpBadge: "FanMind MVP Demo 0.2",
    exampleProfileAria: "Profil exemplu Mia Active Club",
    exampleProfileName: "Mia Active Club",
    exampleProfileSubtitle: "Fitness, motivatie, comunitate",
    clubAreas: [
      {
        label: "Fan gratuit",
        text: "Actualizari publice, perspective din culise si teasere de comunitate pentru fanii noi."
      },
      {
        label: "Membru de club",
        text: "Challenge-uri, postari si beneficii exclusive pentru sustinatori activi."
      },
      {
        label: "Fan premium",
        text: "Formate Q&A mai personale, momente premium si actiuni speciale."
      }
    ],
    whyTitle: "De ce FanMind?",
    whyText: "FanMind este o platforma europeana direct-to-fan serioasa pentru oameni, cluburi si branduri cu comunitati reale.",
    whyCards: [
      {
        title: "Mai putina dependenta de algoritmi",
        text: "Furnizorii isi pot contacta comunitatea de fani mai direct si nu depind doar de reach-ul din social media."
      },
      {
        title: "Propria sursa de venit",
        text: "Abonamentele si continutul premium creeaza venituri recurente in afara modelelor clasice de publicitate."
      },
      {
        title: "Mai aproape de fani",
        text: "FanMind pune relatia dintre furnizor si fan in centrul platformei."
      }
    ],
    modulesTitle: "Modulele produsului FanMind",
    modulesText: "MVP Demo 0.2 arata intr-un singur loc cele mai importante componente pentru profiluri, abonamente si administrare.",
    moduleCards: [
      {
        title: "Profiluri de furnizor",
        text: "Pagini proprii de fan club cu pozitionare, postari si oferta de abonamente."
      },
      {
        title: "Abonamente",
        text: "Fani gratuiti, membri de club si fani premium ca baza pentru monetizare."
      },
      {
        title: "Centru de control",
        text: "O prima imagine de ansamblu pentru fani, venituri, continut si activitatea comunitatii."
      }
    ],
    packagesTitle: "Pachete si abonamente",
    packagesText: "FanMind separa clar pachetele pentru furnizori de abonamentele pentru fani. Preturile sunt valori demo orientative pentru MVP.",
    creatorPackageBadge: "Pachet furnizor",
    fanMembershipBadge: "Abonament fan",
    creatorPackages: [
      {
        name: "Starter",
        price: "0 EUR",
        subtitle: "Pentru clienti pilot si primii furnizori",
        features: [
          "Profil propriu de furnizor",
          "Postari gratuite",
          "Un nivel de abonament",
          "Statistici simple",
          "Comision de platforma pe venituri"
        ]
      },
      {
        name: "Pro",
        price: "19 pana la 49 EUR",
        subtitle: "Pentru furnizori activi cu o comunitate de fani in crestere",
        features: [
          "Mai multe niveluri de abonament",
          "Continut gratuit si pentru membri",
          "Continut premium",
          "Statistici mai bune",
          "Functie de mesaje ulterior"
        ]
      },
      {
        name: "Business / Club",
        price: "de la 99 EUR",
        subtitle: "Pentru cluburi, echipe, studiouri si organizatii",
        features: [
          "Mai multe profiluri de furnizor",
          "Administrare de echipa",
          "Profil de club sau brand",
          "Statistici avansate",
          "Campanii si actiuni"
        ]
      }
    ],
    fanMemberships: [
      {
        name: "Fan gratuit",
        price: "0 EUR",
        subtitle: "Intrare gratuita in comunitatea de fani",
        features: [
          "Postari publice",
          "Actualizari de baza",
          "Preview pentru continut exclusiv",
          "Acces la zona gratuita"
        ]
      },
      {
        name: "Membru de club",
        price: "9,90 EUR",
        subtitle: "Abonament lunar pentru continut exclusiv",
        features: [
          "Postari exclusive",
          "Actualizari pentru membri",
          "Challenge-uri",
          "Continut din culise",
          "Beneficii de comunitate"
        ]
      },
      {
        name: "Fan premium",
        price: "29,90 EUR",
        subtitle: "Acces premium pentru fani deosebit de implicati",
        features: [
          "Continut premium",
          "Perspective mai personale",
          "Intrebari prioritizate",
          "Actiuni speciale",
          "Formate exclusive"
        ]
      }
    ],
    pilotBadge: "Cautam clienti pilot",
    pilotTitle: "FanMind este construit in prezent ca MVP.",
    pilotText: "Primii furnizori pot oferi feedback ca clienti pilot si pot modela activ platforma."
  },
  es: {
    mvpBadge: "FanMind MVP Demo 0.2",
    exampleProfileAria: "Perfil de ejemplo de Mia Active Club",
    exampleProfileName: "Mia Active Club",
    exampleProfileSubtitle: "Fitness, motivacion, comunidad",
    clubAreas: [
      {
        label: "Fan gratuito",
        text: "Actualizaciones publicas, miradas entre bastidores y avances de comunidad para nuevos fans."
      },
      {
        label: "Miembro del club",
        text: "Retos, publicaciones y ventajas exclusivas para seguidores activos."
      },
      {
        label: "Fan premium",
        text: "Formatos Q&A mas personales, momentos premium y acciones especiales."
      }
    ],
    whyTitle: "¿Por que FanMind?",
    whyText: "FanMind es una plataforma europea direct-to-fan seria para personas, clubes y marcas con comunidades reales.",
    whyCards: [
      {
        title: "Menos dependencia del algoritmo",
        text: "Los proveedores pueden llegar a su comunidad de fans de forma mas directa y no depender solo del alcance en redes sociales."
      },
      {
        title: "Tu propia fuente de ingresos",
        text: "Las membresias y el contenido premium generan ingresos recurrentes fuera de los modelos publicitarios clasicos."
      },
      {
        title: "Mas cercania con los fans",
        text: "FanMind pone la relacion entre proveedor y fan en el centro."
      }
    ],
    modulesTitle: "Modulos de producto de FanMind",
    modulesText: "La MVP Demo 0.2 muestra en un solo lugar los bloques principales para perfiles, membresias y gestion.",
    moduleCards: [
      {
        title: "Perfiles de proveedores",
        text: "Paginas propias de fan club con posicionamiento, publicaciones y ofertas de membresia."
      },
      {
        title: "Membresias",
        text: "Fans gratuitos, miembros del club y fans premium como base de monetizacion."
      },
      {
        title: "Centro de control",
        text: "Una primera vista general de fans, ingresos, contenido y actividad de la comunidad."
      }
    ],
    packagesTitle: "Paquetes y membresias",
    packagesText: "FanMind separa claramente los paquetes para proveedores de las membresias para fans. Los precios son valores demo orientativos para el MVP.",
    creatorPackageBadge: "Paquete de proveedor",
    fanMembershipBadge: "Membresia de fan",
    creatorPackages: [
      {
        name: "Starter",
        price: "0 EUR",
        subtitle: "Para clientes piloto y primeros proveedores",
        features: [
          "Perfil propio de proveedor",
          "Publicaciones gratuitas",
          "Un nivel de membresia",
          "Estadisticas simples",
          "Comision de plataforma sobre ingresos"
        ]
      },
      {
        name: "Pro",
        price: "19 a 49 EUR",
        subtitle: "Para proveedores activos con una comunidad de fans en crecimiento",
        features: [
          "Varios niveles de membresia",
          "Contenido gratuito y para miembros",
          "Contenido premium",
          "Mejores estadisticas",
          "Funcion de mensajes mas adelante"
        ]
      },
      {
        name: "Business / Club",
        price: "desde 99 EUR",
        subtitle: "Para clubes, equipos, estudios y organizaciones",
        features: [
          "Varios perfiles de proveedor",
          "Gestion de equipo",
          "Perfil de club o marca",
          "Estadisticas avanzadas",
          "Campanas y acciones"
        ]
      }
    ],
    fanMemberships: [
      {
        name: "Fan gratuito",
        price: "0 EUR",
        subtitle: "Entrada gratuita a la comunidad de fans",
        features: [
          "Publicaciones publicas",
          "Actualizaciones basicas",
          "Vista previa de contenido exclusivo",
          "Acceso al area gratuita"
        ]
      },
      {
        name: "Miembro del club",
        price: "9,90 EUR",
        subtitle: "Membresia mensual para contenido exclusivo",
        features: [
          "Publicaciones exclusivas",
          "Actualizaciones para miembros",
          "Retos",
          "Contenido entre bastidores",
          "Ventajas de comunidad"
        ]
      },
      {
        name: "Fan premium",
        price: "29,90 EUR",
        subtitle: "Acceso premium para fans especialmente comprometidos",
        features: [
          "Contenido premium",
          "Perspectivas mas personales",
          "Preguntas priorizadas",
          "Acciones especiales",
          "Formatos exclusivos"
        ]
      }
    ],
    pilotBadge: "Buscamos clientes piloto",
    pilotTitle: "FanMind se esta construyendo actualmente como MVP.",
    pilotText: "Los primeros proveedores pueden dar feedback como clientes piloto y ayudar activamente a dar forma a la plataforma."
  }
};

export function getLandingContent(locale: Locale) {
  return landingContent[locale];
}
