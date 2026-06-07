import type { Metadata } from "next";
import OnboardingMaster from "@/components/onboarding/OnboardingMaster";
import { resolveCurrentPlanId } from "@/lib/plans";

export const metadata: Metadata = {
  title: "FanMind | Workspace einrichten",
  description: "Paketabhängiges Onboarding für den FanMind MVP-Workspace.",
};

type OnboardingPageProps = {
  searchParams: Promise<{ plan?: string | string[] }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const { plan } = await searchParams;
  const planId = resolveCurrentPlanId({ queryPlan: plan, fallback: "pilot" });

  return <OnboardingMaster planId={planId} />;
}
