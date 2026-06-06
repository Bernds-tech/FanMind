import type { Metadata } from "next";
import OnboardingMaster from "@/components/onboarding/OnboardingMaster";
import { resolvePlanId } from "@/lib/plans";

export const metadata: Metadata = {
  title: "FanMind | Workspace einrichten",
  description: "Paketabhängiges Onboarding für den FanMind MVP-Workspace.",
};

type OnboardingPageProps = {
  searchParams: Promise<{ plan?: string | string[] }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const { plan } = await searchParams;
  const planId = resolvePlanId(plan, "pilot");

  return <OnboardingMaster planId={planId} />;
}
