import { Locale } from "./config";

export const dictionaries: Record<Locale, Record<string, string>> = {
  de: {
    productBadge: "FanMind.ch | Europäische Direct-to-Fan Plattform",
    heroTitle: "Baue deinen eigenen digitalen Fanclub.",
    heroText: "FanMind.ch hilft Inhaltserstellern, Sportlern, Musikern, Trainern und Vereinen dabei, exklusive Inhalte zu teilen, echte Fanbindung aufzubauen und direkt mit der eigenen Fangemeinschaft Geld zu verdienen.",
    ctaPrimary: "Demo Dashboard ansehen",
    ctaSecondary: "Creator Profil ansehen",
    navDemo: "Demo",
    navPricing: "Pricing",
    navCreator: "Creator",
    navDashboard: "Dashboard",
    navLogin: "Login",
    navRegister: "Registrieren"
  },
  en: {
    productBadge: "FanMind.ch | European direct-to-fan platform",
    heroTitle: "Build your own digital fan club.",
    heroText: "FanMind.ch helps creators, athletes, musicians, coaches and clubs share exclusive content, build real fan relationships and earn directly from their community.",
    ctaPrimary: "View demo dashboard",
    ctaSecondary: "View creator profile",
    navDemo: "Demo",
    navPricing: "Pricing",
    navCreator: "Creator",
    navDashboard: "Dashboard",
    navLogin: "Login",
    navRegister: "Sign up"
  },
  ro: {
    productBadge: "FanMind.ch | Platforma europeana direct-to-fan",
    heroTitle: "Construieste-ti propriul fan club digital.",
    heroText: "FanMind.ch ajuta creatorii, sportivii, muzicienii, coachii si cluburile sa distribuie continut exclusiv, sa construiasca relatii reale cu fanii si sa castige direct din comunitatea lor.",
    ctaPrimary: "Vezi dashboard demo",
    ctaSecondary: "Vezi profil creator",
    navDemo: "Demo",
    navPricing: "Preturi",
    navCreator: "Creator",
    navDashboard: "Dashboard",
    navLogin: "Login",
    navRegister: "Inregistrare"
  },
  es: {
    productBadge: "FanMind.ch | Plataforma europea direct-to-fan",
    heroTitle: "Crea tu propio club de fans digital.",
    heroText: "FanMind.ch ayuda a creadores, deportistas, musicos, coaches y clubes a compartir contenido exclusivo, crear relaciones reales con sus fans y ganar directamente con su comunidad.",
    ctaPrimary: "Ver dashboard demo",
    ctaSecondary: "Ver perfil de creator",
    navDemo: "Demo",
    navPricing: "Precios",
    navCreator: "Creator",
    navDashboard: "Dashboard",
    navLogin: "Login",
    navRegister: "Registrarse"
  }
};

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
