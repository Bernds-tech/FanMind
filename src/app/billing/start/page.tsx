import Link from "next/link";
import { redirect } from "next/navigation";
import { BillingCheckoutButton } from "@/components/BillingCheckoutButton";
import { getBillingStatusLabel, shouldShowBillingCheckoutAction } from "@/lib/billing";
import { isTemporaryDemoUser } from "@/lib/demoMode";
import { getPreActivationRedirect } from "@/lib/preActivation";
import { getSupabaseServerUser, getUserWorkspaceDashboard } from "@/lib/supabase/server";
import { getStripeConfigStatus } from "@/lib/stripeBilling";
import styles from "../../dashboard/dashboard.module.css";

function formatEuro(cents?: number | null) {
  return `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }).format((cents ?? 0) / 100)} €`;
}

function planLabel(planId?: string | null) {
  if (planId === "pilot") return "Pilot / Setup";
  if (planId === "starter") return "Starter";
  if (planId === "growth") return "Growth";
  if (planId === "agency") return "Agency";
  return planId ?? "Ausgewähltes Paket";
}

function featureSummary(planId?: string | null) {
  if (planId === "starter") return "Fan-CRM, Follow-ups, Kanalüberblick, KI-Antwortvorbereitung und produktiver MVP-Workspace.";
  if (planId === "pilot") return "Setup-/Pilotmonat mit sicherem Workspace, Kontaktpflege und gemeinsamer Freischaltung.";
  return "FanMind Workspace mit Paketumfang gemäß deiner Auswahl.";
}

export default async function BillingStartPage() {
  const { data } = await getSupabaseServerUser();
  if (!data.user) redirect("/login");

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  if (workspaceResult.error?.message === "TEMPORARY_DEMO_DELETED") redirect("/login?demo_deleted=1");
  const workspace = workspaceResult.workspace;
  const stripe = getStripeConfigStatus();
  const isDemo = isTemporaryDemoUser(data.user) || workspace?.billing_status === "demo_free" || workspace?.name === "Temporary FanMind Demo";
  const redirectTarget = getPreActivationRedirect(workspace);
  if (workspace?.billing_status === "active" || redirectTarget === "/dashboard") redirect("/dashboard");
  if (redirectTarget === "/billing/pending") redirect("/billing/pending");
  if (redirectTarget === "/billing/suspended") redirect("/billing/suspended");
  const canStartCheckout = Boolean(workspace && shouldShowBillingCheckoutAction(workspace) && stripe.readyForCheckout && !isDemo);

  return (
    <main className={styles.page}>
      <section className={styles.fallbackCard} aria-label="FanMind freischalten">
        <div>
          <p className={styles.eyebrow}>Setup &amp; Billing</p>
          <h1>FanMind freischalten</h1>
          <p>Willkommen bei FanMind. Bitte prüfe deine Paket- und Rechnungsdaten — danach leiten wir dich sicher zu Stripe weiter.</p>
        </div>

        {workspace ? (
          <>
            <dl className={styles.onboardingFacts}>
              <div><dt>Paket</dt><dd>{planLabel(workspace.plan_id)}</dd></div>
              <div><dt>Preis</dt><dd>{formatEuro(workspace.setup_fee_cents)} Setup · {formatEuro(workspace.monthly_fee_cents)} monatlich</dd></div>
              <div><dt>Leistungsumfang</dt><dd>{featureSummary(workspace.plan_id)}</dd></div>
              <div><dt>Status</dt><dd>{getBillingStatusLabel(workspace.billing_status)}</dd></div>
            </dl>

            <div className={styles.emptyState}>
              <strong>Rechnungsdaten bestätigen</strong>
              <dl className={styles.onboardingFacts}>
                <div><dt>Firma / Name</dt><dd>{workspace.name}</dd></div>
                <div><dt>Rechnungsadresse</dt><dd>Wird im nächsten Schritt sicher in Stripe ergänzt oder bestätigt.</dd></div>
                <div><dt>Land</dt><dd>Deutschland / EU — bitte in Stripe final prüfen.</dd></div>
                <div><dt>UID/VAT</dt><dd>Optional in Stripe hinterlegen.</dd></div>
              </dl>
            </div>
          </>
        ) : (
          <div className={styles.emptyState}><strong>Dein Workspace wird vorbereitet.</strong><p>Bitte aktualisiere die Seite in Kürze. Du wirst nicht in das Produkt-Dashboard weitergeleitet, bevor Setup und Billing bereit sind.</p></div>
        )}

        {!stripe.readyForCheckout && !isDemo ? (
          <div className={styles.emptyState}><strong>Checkout wird vorbereitet.</strong><p>Die Zahlungsfreischaltung ist noch nicht vollständig konfiguriert. Bitte kontaktiere FanMind, falls dieser Hinweis bestehen bleibt.</p></div>
        ) : canStartCheckout && workspace ? (
          <BillingCheckoutButton planId={workspace.plan_id} commercialOption={workspace.commercial_option} label="Weiter zu Stripe" />
        ) : isDemo ? (
          <div className={styles.emptyState}><strong>Demo-Zugang aktiv.</strong><p>Für diesen Zugang ist keine Zahlung erforderlich.</p></div>
        ) : null}

        <div className={styles.emptyActions}>
          <Link className={styles.secondaryButton} href="/logout">Abmelden</Link>
        </div>
      </section>
    </main>
  );
}
