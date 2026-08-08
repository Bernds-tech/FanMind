import { getPublicDailyTestPlanEnabled } from "@/lib/runtimeProductSettings";
import { isInternalDailyTestWorkspaceProvisioningReady } from "@/lib/supabase/server";
import RegisterClient from "./RegisterClient";

type RegisterPageProps = {
  searchParams: Promise<{
    lang?: string | string[];
    plan?: string | string[];
    option?: string | string[];
    ref?: string | string[];
    referral_code?: string | string[];
    test_plan?: string | string[];
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const [dailyTestWindowEnabled, dailyTestProvisioningReady] =
    await Promise.all([
      getPublicDailyTestPlanEnabled(),
      isInternalDailyTestWorkspaceProvisioningReady(),
    ]);
  const enablePublicDailyTestPlan =
    dailyTestWindowEnabled && dailyTestProvisioningReady;

  return (
    <RegisterClient
      searchParams={searchParams}
      enablePublicDailyTestPlan={enablePublicDailyTestPlan}
    />
  );
}
