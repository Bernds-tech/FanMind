import Link from "next/link";
import { redirect } from "next/navigation";
import { BillingCheckoutButton } from "@/components/BillingCheckoutButton";
import { getBillingCheckoutActionLabel, getBillingStatusLabel, shouldShowBillingCheckoutAction } from "@/lib/billing";
import { getCommercialOptionLabel } from "@/lib/dashboardFeatures";
import { isTemporaryDemoUser } from "@/lib/demoMode";
import { getSupabaseServerUser, getUserWorkspaceDashboard } from "@/lib/supabase/server";
import { getStripeConfigStatus } from "@/lib/stripeBilling";
import styles from "../../dashboard/dashboard.module.css";

function planLabel(planId?: string | null) {
  if (planId === "pilot") return "Pilot / Setup";
  if (planId === "starter") return "Starter";
  if (planId === "growth") return "Growth";
  if (planId === "agency") return "Agency";
  return planId ?? "Unbekannt";
}

export default async function BillingStartPage() {
  const { data } = await getSupabaseServerUser();
  if (!data.user) redirect("/login");

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  const workspace = workspaceResult.workspace;
  const stripe = getStripeConfigStatus();
  const isDemo = isTemporaryDemoUser(data.user) || workspace?.billing_status === "demo_free" || workspace?.name === "Temporary FanMind Demo";
  const canStartCheckout = Boolean(workspace && shouldShowBillingCheckoutAction(workspace));

  return (
    <main className={styles.page}>
      <section className={styles.fallbackCard} aria-label="Zahlung starten">
        <div>
          <p className={styles.eyebrow}>Paket &amp; Zahlung</p>
          <h1>Zahlung starten</h1>
          <p>Hier siehst du dein FanMind-Paket und startest die Online-Zahlung über Stripe Checkout.</p>
        </div>

        {workspaceResult.error ? (
          <p className={styles.error}><strong>Workspace konnte nicht geladen werden.</strong><span>{workspaceResult.error.message}</span></p>
        ) : null}

        {workspace ? (
          <dl className={styles.onboardingFacts}>
            <div><dt>Workspace</dt><dd>{workspace.name}</dd></div>
            <div><dt>Paket</dt><dd>{planLabel(workspace.plan_id)}</dd></div>
            <div><dt>Option</dt><dd>{getCommercialOptionLabel(workspace.commercial_option)}</dd></div>
            <div><dt>Zahlungsstatus</dt><dd>{getBillingStatusLabel(workspace.billing_status)}</dd></div>
          </dl>
        ) : null}

        {workspace?.billing_status === "active" ? (
          <div className={styles.emptyState}><strong>Dein Zugang ist aktiv.</strong><p>Die Zahlung wurde bestätigt und dein Workspace ist freigeschaltet.</p></div>
        ) : isDemo ? (
          <div className={styles.emptyState}><strong>Demo-Zugänge benötigen keine Zahlung.</strong><p>Für Demo-User ist Stripe Checkout deaktiviert.</p></div>
        ) : !stripe.readyForCheckout ? (
          <div className={styles.emptyState}><strong>Zahlung ist noch nicht aktiv konfiguriert. Bitte FanMind kontaktieren.</strong><p>Stripe Checkout ist serverseitig noch nicht vollständig konfiguriert.</p></div>
        ) : canStartCheckout && workspace ? (
          <div className={styles.emptyState}>
            <strong>Dein Zugang wurde erstellt. Starte jetzt die Zahlung, um FanMind freizuschalten.</strong>
            <BillingCheckoutButton planId={workspace.plan_id} commercialOption={workspace.commercial_option} label={getBillingCheckoutActionLabel(workspace.billing_status)} />
          </div>
        ) : (
          <div className={styles.emptyState}><strong>Für dieses Paket ist kein Checkout verfügbar.</strong><p>Growth und Agency sind Coming Soon; gekündigte Zugänge benötigen eine separate Reaktivierung.</p></div>
        )}

        <div className={styles.emptyActions}>
          <Link className={styles.secondaryButton} href="/dashboard">Zum Dashboard</Link>
          <Link className={styles.secondaryButton} href="/admin/billing">Zu Paket &amp; Rechnungen</Link>
        </div>
      </section>
    </main>
  );
}
