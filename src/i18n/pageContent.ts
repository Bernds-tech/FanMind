import { type Locale } from "./config";

type PageContent = {
  demoTitle: string;
  demoText: string;
  pricingTitle: string;
  pricingText: string;
  loginTitle: string;
  loginText: string;
  registerTitle: string;
  registerText: string;
  dashboardTitle: string;
  dashboardText: string;
  creatorTitle: string;
  creatorText: string;
  onboardingTitle: string;
  onboardingText: string;
  adminTitle: string;
  adminText: string;
  open: string;
  selectDemo: string;
  demoLogin: string;
  continueOnboarding: string;
};

export const pageContent: Record<Locale, PageContent> = {
  de: {
    demoTitle: "Alle Demo-Seiten auf einen Blick.",
    demoText: "Diese Seite verbindet die aktuellen FanMind-Prototyp-Seiten.",
    pricingTitle: "Fan-Stufen für wiederkehrende Einnahmen.",
    pricingText: "FanMind ermöglicht Creatorn eigene Mitgliedschaftsstufen und exklusive Vorteile pro Fanclub.",
    loginTitle: "Zurück in deinen Fanclub.",
    loginText: "Diese Seite ist der erste Login-Mockup für Creator, Fans und Admins.",
    registerTitle: "Starte deinen FanMind Club.",
    registerText: "Creator können hier später ihr Profil anlegen, Fan-Stufen definieren und ihren digitalen Fanclub starten.",
    dashboardTitle: "Verwalte deinen Fanclub.",
    dashboardText: "Ein erstes Dashboard für Fans, Mitglieder, Einnahmen, Inhalte und Community-Aktivität.",
    creatorTitle: "Mia Active Club",
    creatorText: "Ein Demo-Creator-Profil mit freien, Mitglieder- und Premium-Inhalten.",
    onboardingTitle: "In fünf Schritten zum eigenen Fanclub.",
    onboardingText: "Ein geführter Einstieg vom Profil bis zum ersten veröffentlichten Fanclub-Link.",
    adminTitle: "Plattformübersicht.",
    adminText: "Ein erster Adminbereich für Nutzer, Creator, Inhalte und Plattformkontrolle.",
    open: "Oeffnen",
    selectDemo: "Demo auswählen",
    demoLogin: "Demo Login",
    continueOnboarding: "Weiter zum Onboarding"
  },
  en: {
    demoTitle: "All demo pages at a glance.",
    demoText: "This page connects the current FanMind prototype screens.",
    pricingTitle: "Fan tiers for recurring revenue.",
    pricingText: "FanMind lets creators define membership tiers and exclusive benefits for their own fan club.",
    loginTitle: "Welcome back to your fan club.",
    loginText: "This screen is the first login mockup for creators, fans and admins.",
    registerTitle: "Start your FanMind club.",
    registerText: "Creators will use this flow to create a profile, define fan tiers and launch their club.",
    dashboardTitle: "Manage your fan club.",
    dashboardText: "A first dashboard view for fans, members, revenue, content and community activity.",
    creatorTitle: "Mia Active Club",
    creatorText: "A demo creator profile with public, member-only and premium content.",
    onboardingTitle: "Launch your fan club in five steps.",
    onboardingText: "A guided setup from profile creation to the first published fan club link.",
    adminTitle: "Platform overview.",
    adminText: "A first admin view for users, creators, content status and platform control.",
    open: "Open",
    selectDemo: "Select demo",
    demoLogin: "Demo login",
    continueOnboarding: "Continue onboarding"
  },
  ro: {
    demoTitle: "Toate paginile demo dintr-o privire.",
    demoText: "Aceasta pagina conecteaza ecranele actuale ale prototipului FanMind.",
    pricingTitle: "Niveluri de fani pentru venituri recurente.",
    pricingText: "FanMind permite creatorilor sa defineasca abonamente si beneficii exclusive pentru propriul fan club.",
    loginTitle: "Bine ai revenit in fan clubul tau.",
    loginText: "Acest ecran este primul mockup de login pentru creatori, fani si administratori.",
    registerTitle: "Porneste clubul tau FanMind.",
    registerText: "Creatorii vor putea crea un profil, defini niveluri de fani si lansa propriul club.",
    dashboardTitle: "Administreaza fan clubul tau.",
    dashboardText: "Un prim dashboard pentru fani, membri, venituri, continut si activitate comunitara.",
    creatorTitle: "Mia Active Club",
    creatorText: "Un profil demo de creator cu continut public, pentru membri si premium.",
    onboardingTitle: "Lanseaza fan clubul in cinci pasi.",
    onboardingText: "Un proces ghidat de la crearea profilului pana la primul link publicat.",
    adminTitle: "Prezentare platforma.",
    adminText: "O prima zona admin pentru utilizatori, creatori, continut si controlul platformei.",
    open: "Deschide",
    selectDemo: "Alege demo",
    demoLogin: "Login demo",
    continueOnboarding: "Continua onboarding"
  },
  es: {
    demoTitle: "Todas las paginas demo de un vistazo.",
    demoText: "Esta pagina conecta las pantallas actuales del prototipo FanMind.",
    pricingTitle: "Niveles de fans para ingresos recurrentes.",
    pricingText: "FanMind permite a los creadores definir membresias y beneficios exclusivos para su propio fan club.",
    loginTitle: "Bienvenido de nuevo a tu fan club.",
    loginText: "Esta pantalla es el primer mockup de login para creadores, fans y admins.",
    registerTitle: "Inicia tu club FanMind.",
    registerText: "Los creadores podran crear un perfil, definir niveles de fans y lanzar su club.",
    dashboardTitle: "Gestiona tu fan club.",
    dashboardText: "Un primer dashboard para fans, miembros, ingresos, contenido y actividad de comunidad.",
    creatorTitle: "Mia Active Club",
    creatorText: "Un perfil demo de creator con contenido publico, para miembros y premium.",
    onboardingTitle: "Lanza tu fan club en cinco pasos.",
    onboardingText: "Un proceso guiado desde el perfil hasta el primer enlace publicado.",
    adminTitle: "Vista general de la plataforma.",
    adminText: "Una primera zona admin para usuarios, creadores, contenido y control de plataforma.",
    open: "Abrir",
    selectDemo: "Seleccionar demo",
    demoLogin: "Login demo",
    continueOnboarding: "Continuar onboarding"
  }
};

export function getPageContent(locale: Locale) {
  return pageContent[locale];
}
