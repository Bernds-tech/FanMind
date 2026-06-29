import Link from "next/link";
import { redirect } from "next/navigation";
import { getBillingStatusLabel } from "@/lib/billing";
import { getBillingContinuationHref } from "@/lib/preActivation";
import { getSupabaseServerUser, getUserWorkspaceDashboard } from "@/lib/supabase/server";
import styles from "../../dashboard/dashboard.module.css";

export const dynamic = "force-dynamic";

export default async function BillingSuccessPage() {
  const { data } = await getSupabaseServerUser();
  if (!data.user) redirect("/login?returnTo=/billing/success");
  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  if (workspaceResult.error?.message === "TEMPORARY_DEMO_DELETED") redirect("/login?demo_deleted=1");
  const workspace = workspaceResult.workspace;
  const isActive = workspace?.billing_status === "active";
  const continuationHref = getBillingContinuationHref(workspace);
  if (workspace && !isActive && ["pending_sepa_mandate", "pending_payment_setup"].includes(String(workspace.billing_status))) redirect("/billing/pending");

  return (
    <main className={styles.page}>
      <section className={styles.fallbackCard}>
        <p className={styles.eyebrow}>Sichere Zahlungsseite</p>
        <h1>{isActive ? "Freischaltung erfolgreich" : "Zahlung wurde gestartet"}</h1>
        <p>{isActive ? "Deine Zahlung wurde bestätigt und dein FanMind-Workspace ist freigeschaltet." : "Die Zahlung wurde angenommen. Bei SEPA-Lastschrift kann die finale Bestätigung einige Geschäftstage dauern."}</p>
        {workspace ? <div className={styles.emptyState}><strong>Aktueller Status: {getBillingStatusLabel(workspace.billing_status)}</strong></div> : null}
        <div className={styles.emptyActions}>
          <Link className={styles.primaryButton} href={continuationHref}>{isActive ? "Zum Dashboard" : "Status ansehen"}</Link>
          {!isActive ? <Link className={styles.secondaryButton} href="/billing/pending">Zu Zahlung eingereicht</Link> : null}
        </div>
      </section>
    </main>
  );
}
