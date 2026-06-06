export type PlanId = "pilot" | "starter" | "growth" | "agency";

export type FeatureStatus =
  | "active"
  | "demo"
  | "limited"
  | "upgrade"
  | "coming_soon"
  | "hidden"
  | "preview";

export type FeatureVisibility =
  | "visible"
  | "hidden"
  | "roadmap_only"
  | "admin_only"
  | "sales_demo_only";

export type FeatureContext =
  | "landing"
  | "app"
  | "roadmap"
  | "admin"
  | "sales_demo";

export type FeatureKey =
  | "login"
  | "dashboard"
  | "contacts"
  | "contact_detail"
  | "sandra_demo"
  | "ai_replies"
  | "memory"
  | "followups"
  | "csv_import"
  | "roadmap"
  | "single_profile"
  | "multiple_profiles"
  | "multi_client_workspace"
  | "basic_segments"
  | "campaigns"
  | "analytics"
  | "team_roles"
  | "integrations"
  | "payments"
  | "automatic_sending";

export type PlanMode = "demo" | "production" | "agency";

export type FeatureAccessConfig = {
  status: FeatureStatus;
  visibility: FeatureVisibility;
};

export type PlanConfig = {
  id: PlanId;
  name: string;
  badge: string;
  priceLabel: string;
  mode: PlanMode;
  maxProfiles: number | null;
  maxContacts: number | null;
  contactsLabel: string;
  description: string;
  primaryAction: string;
  upgradePlan?: Exclude<PlanId, "pilot">;
  featureConfig: Record<FeatureKey, FeatureAccessConfig>;
  upgradeTargets: Partial<Record<FeatureKey, PlanId>>;
};

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  login: "Login / Registrierung",
  dashboard: "Geschütztes Dashboard",
  contacts: "Kontakte / Follower",
  contact_detail: "Kontaktdetailseite",
  sandra_demo: "Sandra M. Demo",
  ai_replies: "KI-Antwortvorschläge",
  memory: "Memory / Fan-Gedächtnis",
  followups: "Follow-ups",
  csv_import: "CSV-Import",
  roadmap: "Roadmap",
  single_profile: "Ein Profil",
  multiple_profiles: "Mehrere Profile",
  multi_client_workspace: "Multi-Client-Workspace",
  basic_segments: "Basis-Segmente",
  campaigns: "Kampagnen",
  analytics: "Analytics",
  team_roles: "Team-Rollen / Rechte",
  integrations: "Integrationen",
  payments: "Zahlungen",
  automatic_sending: "Automatisches Senden",
};

export const FEATURE_KEYS = Object.keys(FEATURE_LABELS) as FeatureKey[];

const DEFAULT_VISIBILITY: Record<FeatureKey, FeatureVisibility> = {
  login: "visible",
  dashboard: "visible",
  contacts: "visible",
  contact_detail: "visible",
  sandra_demo: "visible",
  ai_replies: "visible",
  memory: "visible",
  followups: "visible",
  csv_import: "visible",
  roadmap: "visible",
  single_profile: "visible",
  multiple_profiles: "visible",
  multi_client_workspace: "visible",
  basic_segments: "visible",
  campaigns: "roadmap_only",
  analytics: "roadmap_only",
  team_roles: "roadmap_only",
  integrations: "roadmap_only",
  payments: "hidden",
  automatic_sending: "hidden",
};

function featureConfig(
  statuses: Record<FeatureKey, FeatureStatus>,
  visibilityOverrides: Partial<Record<FeatureKey, FeatureVisibility>> = {},
): Record<FeatureKey, FeatureAccessConfig> {
  return FEATURE_KEYS.reduce(
    (config, featureKey) => ({
      ...config,
      [featureKey]: {
        status: statuses[featureKey],
        visibility:
          featureKey === "automatic_sending"
            ? "hidden"
            : visibilityOverrides[featureKey] ?? DEFAULT_VISIBILITY[featureKey],
      },
    }),
    {} as Record<FeatureKey, FeatureAccessConfig>,
  );
}

const pilotUpgradeTargets: Partial<Record<FeatureKey, PlanId>> = {
  single_profile: "starter",
  multiple_profiles: "growth",
  basic_segments: "growth",
  analytics: "growth",
  multi_client_workspace: "agency",
};

const starterUpgradeTargets: Partial<Record<FeatureKey, PlanId>> = {
  multiple_profiles: "growth",
  basic_segments: "growth",
  analytics: "growth",
  team_roles: "agency",
  multi_client_workspace: "agency",
};

const growthUpgradeTargets: Partial<Record<FeatureKey, PlanId>> = {
  multi_client_workspace: "agency",
  team_roles: "agency",
  analytics: "agency",
};

export const PLANS: Record<PlanId, PlanConfig> = {
  pilot: {
    id: "pilot",
    name: "Pilot",
    badge: "Demo/Testmodus",
    priceLabel: "990 € einmalig",
    mode: "demo",
    maxProfiles: 0,
    maxContacts: null,
    contactsLabel: "Demo-Daten",
    description:
      "Demo-Workspace mit Sandra M., Beispieldaten und geführtem MVP-Kern ohne produktive Kanäle.",
    primaryAction: "Demo starten",
    upgradePlan: "starter",
    featureConfig: featureConfig({
      login: "active",
      dashboard: "demo",
      contacts: "demo",
      contact_detail: "demo",
      sandra_demo: "active",
      ai_replies: "demo",
      memory: "demo",
      followups: "demo",
      csv_import: "preview",
      roadmap: "active",
      single_profile: "upgrade",
      multiple_profiles: "upgrade",
      multi_client_workspace: "upgrade",
      basic_segments: "upgrade",
      campaigns: "coming_soon",
      analytics: "upgrade",
      team_roles: "hidden",
      integrations: "coming_soon",
      payments: "hidden",
      automatic_sending: "hidden",
    }),
    upgradeTargets: pilotUpgradeTargets,
  },
  starter: {
    id: "starter",
    name: "Starter",
    badge: "Produktiver MVP-Workspace",
    priceLabel: "299 €/Monat",
    mode: "production",
    maxProfiles: 1,
    maxContacts: 1000,
    contactsLabel: "bis 1.000 Kontakte",
    description:
      "Ein produktives Profil mit Kontakten, Memory, Follow-ups, CSV-Import und limitierten KI-Antwortvorschlägen.",
    primaryAction: "Workspace einrichten",
    upgradePlan: "growth",
    featureConfig: featureConfig({
      login: "active",
      dashboard: "active",
      contacts: "active",
      contact_detail: "active",
      sandra_demo: "active",
      ai_replies: "limited",
      memory: "active",
      followups: "active",
      csv_import: "active",
      roadmap: "active",
      single_profile: "active",
      multiple_profiles: "upgrade",
      multi_client_workspace: "upgrade",
      basic_segments: "upgrade",
      campaigns: "coming_soon",
      analytics: "upgrade",
      team_roles: "upgrade",
      integrations: "coming_soon",
      payments: "hidden",
      automatic_sending: "hidden",
    }),
    upgradeTargets: starterUpgradeTargets,
  },
  growth: {
    id: "growth",
    name: "Growth",
    badge: "Skalierender MVP-Workspace",
    priceLabel: "499 €/Monat",
    mode: "production",
    maxProfiles: 5,
    maxContacts: 10000,
    contactsLabel: "bis 10.000 Kontakte",
    description:
      "Mehrere Profile, aktive Basis-Segmente und voller MVP-Kern für wachsende Teams.",
    primaryAction: "Growth einrichten",
    upgradePlan: "agency",
    featureConfig: featureConfig({
      login: "active",
      dashboard: "active",
      contacts: "active",
      contact_detail: "active",
      sandra_demo: "active",
      ai_replies: "active",
      memory: "active",
      followups: "active",
      csv_import: "active",
      roadmap: "active",
      single_profile: "active",
      multiple_profiles: "active",
      multi_client_workspace: "upgrade",
      basic_segments: "active",
      campaigns: "coming_soon",
      analytics: "upgrade",
      team_roles: "upgrade",
      integrations: "coming_soon",
      payments: "hidden",
      automatic_sending: "hidden",
    }),
    upgradeTargets: growthUpgradeTargets,
  },
  agency: {
    id: "agency",
    name: "Agency",
    badge: "Agency-Vorschau",
    priceLabel: "ab 990 €/Monat",
    mode: "agency",
    maxProfiles: null,
    maxContacts: null,
    contactsLabel: "nach Vereinbarung",
    description:
      "Mehrere Profile oder Kunden-Workspaces mit sichtbarer Owner-Struktur. Erweiterte Rollen, Analytics und Kampagnen bleiben im MVP als Coming Soon markiert.",
    primaryAction: "Agency einrichten",
    featureConfig: featureConfig({
      login: "active",
      dashboard: "active",
      contacts: "active",
      contact_detail: "active",
      sandra_demo: "active",
      ai_replies: "active",
      memory: "active",
      followups: "active",
      csv_import: "active",
      roadmap: "active",
      single_profile: "active",
      multiple_profiles: "active",
      multi_client_workspace: "preview",
      basic_segments: "active",
      campaigns: "coming_soon",
      analytics: "coming_soon",
      team_roles: "coming_soon",
      integrations: "coming_soon",
      payments: "hidden",
      automatic_sending: "hidden",
    }),
    upgradeTargets: {},
  },
};
