import { redirect } from "next/navigation";
import { getSupabaseServerUser, getUserWorkspaceDashboard } from "@/lib/supabase/server";
import { canManageSubscription, getCancellationState } from "@/lib/subscriptionCancellationPolicy.mjs";
import { getCommercialOptionLabel } from "@/lib/dashboardFeatures";
import { SubscriptionManager } from "./SubscriptionManager";

export const dynamic = "force-dynamic";

type SubscriptionWorkspace = {
  owner_user_id: string;
  commercial_option?: string | null;
  billing_status?: string | null;
  stripe_subscription_id?: string | null;
  cancellation_requested_at?: string | null;
  cancellation_effective_at?: string | null;
  archive_mode?: boolean | null;
};

export default async function SubscriptionSettingsPage() {
  const { data } = await getSupabaseServerUser();
  if (!data.user) redirect("/login?returnTo=/settings/subscription");
  const result = await getUserWorkspaceDashboard(data.user);
  const workspace = result.workspace as SubscriptionWorkspace | null;
  if (!workspace) redirect("/dashboard");

  const cancellation = getCancellationState(workspace);
  return (
    <main style={{ minHeight: "100vh", background: "#020817", padding: 24 }}>
      <SubscriptionManager
        status={workspace.billing_status ?? "unbekannt"}
        packageName={getCommercialOptionLabel(workspace.commercial_option)}
        effectiveAt={cancellation.effectiveAt}
        archiveMode={cancellation.archiveMode}
        canManage={canManageSubscription(workspace, data.user.id)}
      />
    </main>
  );
}
