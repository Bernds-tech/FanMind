import Link from "next/link";
import { redirect } from "next/navigation";
import { BillingCheckoutButton } from "@/components/BillingCheckoutButton";
import { shouldShowBillingCheckoutAction } from "@/lib/billing";
import { isTemporaryDemoUser } from "@/lib/demoMode";
import { getPreActivationRedirect } from "@/lib/preActivation";
import { getSupabaseServerUser, getUserWorkspaceDashboard } from "@/lib/supabase/server";
import { getStripeConfigStatus } from "@/lib/stripeBilling";
import styles from "./billingStart.module.css";

type BillingPlanSummary = {
  name: string;
  price: string;
  setupFee: string;
  term: string;
};

function getBillingPlanSummary(planId?: string | null, commercialOption?: string | null): BillingPlanSummary {
  if (planId === "pilot") {
    return {
      name: "Pilot / Setup",
      price: "990 € einmalig · zzgl. USt.",
      setupFee: "im Pilotpreis enthalten",
      term: "1 Testmonat · keine automatische Verlängerung",
    };
  }

  if (planId === "starter" && commercialOption === "starter_no_setup_commitment") {
    return {
      name: "Starter 12 Monate",
      price: "312 €/Monat · zzgl. USt.",
      setupFee: "0 €",
      term: "12 Monate",
    };
  }

  if (planId === "starter" && commercialOption === "starter_paid_setup") {
    return {
      name: "Starter Flex",
      price: "312 €/Monat · zzgl. USt.",
      setupFee: "990 € einmalig · zzgl. USt.",
      term: "monatlich kündbar",
    };
  }

  return {
    name: "Ausgewähltes Paket",
    price: "gemäß Auswahl · zzgl. USt.",
    setupFee: "gemäß Auswahl",
    term: "gemäß Auswahl",
  };
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
  if (redirectTarget === "/workspace/setup") redirect("/workspace/setup");
  if (workspace?.billing_status === "active" || redirectTarget === "/dashboard") redirect("/dashboard");
  if (redirectTarget === "/billing/pending") redirect("/billing/pending");
  if (redirectTarget === "/billing/suspended") redirect("/billing/suspended");
  const canStartCheckout = Boolean(workspace && shouldShowBillingCheckoutAction(workspace) && stripe.readyForCheckout && !isDemo);

  const plan = workspace ? getBillingPlanSummary(workspace.plan_id, workspace.commercial_option) : null;

  return (
    <main className={styles.shell}>
      <section className={styles.overlay} aria-label="FanMind freischalten">
        <header className={styles.header}>
          <p className={styles.brand}>FanMind · Setup &amp; Zahlung</p>
          <h1>FanMind freischalten</h1>
          <p>Bestätige dein Paket und starte anschließend die sichere Zahlung.</p>
        </header>

        {workspace && plan ? (
          <div className={styles.grid}>
            <section className={styles.panel} aria-labelledby="billing-plan-title">
              <h2 id="billing-plan-title">Paket &amp; Preis</h2>
              <dl className={styles.facts}>
                <div><dt>Paket</dt><dd>{plan.name}</dd></div>
                <div><dt>Preis netto</dt><dd>{plan.price}</dd></div>
                <div><dt>Setup Fee netto</dt><dd>{plan.setupFee}</dd></div>
                <div><dt>Laufzeit / Bindung</dt><dd>{plan.term}</dd></div>
                <div><dt>USt.-Hinweis</dt><dd>Alle Preise zzgl. USt.</dd></div>
                <div><dt>Status</dt><dd><span className={styles.status}>Zahlung offen</span></dd></div>
              </dl>
            </section>

            <section className={styles.panel} aria-labelledby="billing-payment-title">
              <h2 id="billing-payment-title">Rechnung &amp; Zahlung</h2>
              <dl className={styles.facts}>
                <div><dt>Firma / Name</dt><dd>{workspace.name}</dd></div>
                <div><dt>Nächster Schritt</dt><dd>Rechnungs- und Zahlungsdaten werden im nächsten Schritt sicher bei Stripe eingegeben.</dd></div>
                <div><dt>Bankdaten</dt><dd>FanMind speichert keine Bankdaten.</dd></div>
              </dl>
              <div className={styles.notice}>
                <p>Stripe Checkout verarbeitet die Zahlungsdaten verschlüsselt und führt dich nach Abschluss zurück zu FanMind.</p>
              </div>
            </section>
          </div>
        ) : (
          <div className={styles.infoBox}>Dein Workspace wird vorbereitet. Bitte aktualisiere die Seite in Kürze.</div>
        )}

        <div className={styles.actions}>
          {!stripe.readyForCheckout && !isDemo ? (
            <div className={styles.infoBox}>Die Zahlung ist aktuell noch nicht vollständig konfiguriert. Bitte kontaktiere FanMind.</div>
          ) : canStartCheckout && workspace ? (
            <BillingCheckoutButton planId={workspace.plan_id} commercialOption={workspace.commercial_option} label="Weiter zur Zahlung" />
          ) : isDemo ? (
            <div className={styles.infoBox}>Demo-Zugang aktiv. Für diesen Zugang ist keine Zahlung erforderlich.</div>
          ) : null}
          <Link className={styles.logout} href="/logout">Abmelden</Link>
        </div>
      </section>
    </main>
  );
}
