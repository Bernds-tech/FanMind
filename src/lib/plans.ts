import {
  FEATURE_KEYS,
  FEATURE_LABELS,
  PLANS,
  type FeatureContext,
  type FeatureKey,
  type FeatureStatus,
  type FeatureVisibility,
  type PlanConfig,
  type PlanId,
} from "@/config/plans";

export type OnboardingStep = {
  title: string;
  description: string;
  featureKey: FeatureKey;
};

const validPlanIds = new Set<PlanId>(["pilot", "starter", "growth", "agency"]);

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && validPlanIds.has(value as PlanId);
}

export function resolvePlanId(value: unknown, fallback: PlanId = "pilot"): PlanId {
  if (Array.isArray(value)) {
    return resolvePlanId(value[0], fallback);
  }

  return isPlanId(value) ? value : fallback;
}

export function getPlan(planId: PlanId): PlanConfig {
  return PLANS[planId];
}

export function getFeatureStatus(
  planId: PlanId,
  featureKey: FeatureKey,
): FeatureStatus {
  return getPlan(planId).featureConfig[featureKey].status;
}

export function getFeatureVisibility(
  planId: PlanId,
  featureKey: FeatureKey,
): FeatureVisibility {
  return getPlan(planId).featureConfig[featureKey].visibility;
}

export function canUseFeature(planId: PlanId, featureKey: FeatureKey): boolean {
  const status = getFeatureStatus(planId, featureKey);
  return status === "active" || status === "demo" || status === "limited";
}

export function isFeatureLocked(planId: PlanId, featureKey: FeatureKey): boolean {
  const status = getFeatureStatus(planId, featureKey);
  return status === "upgrade" || status === "hidden";
}

export function isComingSoon(planId: PlanId, featureKey: FeatureKey): boolean {
  return getFeatureStatus(planId, featureKey) === "coming_soon";
}

export function shouldShowComingSoon(context: FeatureContext): boolean {
  return context !== "app";
}

export function isRoadmapOnly(planId: PlanId, featureKey: FeatureKey): boolean {
  return getFeatureVisibility(planId, featureKey) === "roadmap_only";
}

export function isAdminOnly(planId: PlanId, featureKey: FeatureKey): boolean {
  return getFeatureVisibility(planId, featureKey) === "admin_only";
}

export function shouldShowFeature(
  planId: PlanId,
  featureKey: FeatureKey,
  context: FeatureContext,
): boolean {
  if (featureKey === "automatic_sending") {
    return false;
  }

  const status = getFeatureStatus(planId, featureKey);
  const visibility = getFeatureVisibility(planId, featureKey);

  if (status === "hidden" || visibility === "hidden") {
    return false;
  }

  if (status === "coming_soon" && !shouldShowComingSoon(context)) {
    return false;
  }

  switch (visibility) {
    case "visible":
      return true;
    case "roadmap_only":
      return context === "landing" || context === "roadmap" || context === "sales_demo";
    case "admin_only":
      return context === "admin";
    case "sales_demo_only":
      return context === "sales_demo";
  }
}

export function getVisibleFeatureKeys(
  planId: PlanId,
  context: FeatureContext,
  featureKeys: FeatureKey[] = FEATURE_KEYS,
): FeatureKey[] {
  return featureKeys.filter((featureKey) => shouldShowFeature(planId, featureKey, context));
}

export function getUpgradeTarget(
  planId: PlanId,
  featureKey: FeatureKey,
): PlanConfig | null {
  const targetPlanId = getPlan(planId).upgradeTargets[featureKey];
  return targetPlanId ? getPlan(targetPlanId) : null;
}

export function getPlanBadge(planId: PlanId): string {
  return getPlan(planId).badge;
}

export function getOnboardingSteps(planId: PlanId): OnboardingStep[] {
  const commonSteps: OnboardingStep[] = [
    {
      title: "Workspace prüfen",
      description: "Dashboard, Kontakte und Fan-Gedächtnis für dein Paket vorbereiten.",
      featureKey: "dashboard",
    },
    {
      title: "KI-Demo testen",
      description: "Sandra M. öffnen und echte serverseitige Antwortvorschläge prüfen.",
      featureKey: "ai_replies",
    },
    {
      title: "Follow-ups planen",
      description: "Nächste manuelle Aktionen priorisieren und Erinnerungen setzen.",
      featureKey: "followups",
    },
  ];

  if (planId === "pilot") {
    return [
      {
        title: "Demo-Daten laden",
        description: "Sandra M. und Beispieldaten als sicheren Testmodus verwenden.",
        featureKey: "sandra_demo",
      },
      ...commonSteps,
      {
        title: "CSV-Import ansehen",
        description: "Import als Vorschau kennenlernen; produktiv erst ab Starter.",
        featureKey: "csv_import",
      },
    ];
  }

  if (planId === "starter") {
    return [
      {
        title: "Ein Profil einrichten",
        description: "Dein erstes Fan-Profil und bis zu 1.000 Kontakte vorbereiten.",
        featureKey: "single_profile",
      },
      {
        title: "CSV-Import starten",
        description: "Kontakte strukturiert importieren und Memory-Felder prüfen.",
        featureKey: "csv_import",
      },
      ...commonSteps,
    ];
  }

  if (planId === "growth") {
    return [
      {
        title: "3–5 Profile planen",
        description: "Profile für Creator, Teams oder Events strukturieren.",
        featureKey: "multiple_profiles",
      },
      {
        title: "Basis-Segmente aktivieren",
        description: "Einfache Segmente für Follow-ups und manuelle Kampagnenvorbereitung nutzen.",
        featureKey: "basic_segments",
      },
      ...commonSteps,
    ];
  }

  const agencySteps: OnboardingStep[] = [
    {
      title: "Kundenstruktur anlegen",
      description: "Mehrere Profile oder Kunden als Agency-Vorschau strukturieren.",
      featureKey: "multi_client_workspace",
    },
    {
      title: "Owner-Struktur klären",
      description: "Verantwortlichkeiten sichtbar machen; Enterprise-Rollen bleiben Coming Soon.",
      featureKey: "team_roles",
    },
    ...commonSteps,
    {
      title: "Roadmap abstimmen",
      description: "Kampagnen, Analytics und Integrationen als Vorschau prüfen.",
      featureKey: "roadmap",
    },
  ];

  return agencySteps.filter((step) => shouldShowFeature(planId, step.featureKey, "app"));
}

export function getFeatureLabel(featureKey: FeatureKey): string {
  return FEATURE_LABELS[featureKey];
}
