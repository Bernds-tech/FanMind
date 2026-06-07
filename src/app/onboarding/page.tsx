import type { Metadata } from "next";
import { redirect } from "next/navigation";
import OnboardingMaster from "@/components/onboarding/OnboardingMaster";
import { resolveCurrentPlanId } from "@/lib/plans";
import { getSupabaseServerUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "FanMind | Workspace einrichten",
  description: "Paketabhängiges Onboarding für den FanMind MVP-Workspace.",
};

type OnboardingPageProps = {
  searchParams: Promise<{ plan?: string | string[]; demo?: string | string[]; lang?: string | string[] }>;
};

function hasQueryValue(value: string | string[] | undefined): boolean {
  if (Array.isArray(value)) {
    return value.some(Boolean);
  }

  return Boolean(value);
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const { plan, demo } = await searchParams;
  const explicitDemoMode = Array.isArray(demo) ? demo.includes("1") : demo === "1";
  const { data } = await getSupabaseServerUser();
  const isDemoMode = explicitDemoMode || (!data.user && hasQueryValue(plan));

  if (!isDemoMode && !data.user) {
    redirect("/login");
  }

  const planId = resolveCurrentPlanId({ queryPlan: plan, fallback: "starter" });

  return <OnboardingMaster planId={planId} isDemoMode={isDemoMode} />;
}
