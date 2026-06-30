import Link from "next/link";
import { redirect } from "next/navigation";
import buttonStyles from "@/components/BillingCheckoutButton.module.css";
import { FanMindLogo } from "@/components/FanMindLogo";
import { shouldShowBillingCheckoutAction } from "@/lib/billing";
import { isPlatformAdminEmail } from "@/lib/admin";
import { isTemporaryDemoUser } from "@/lib/demoMode";
import { getPreActivationRedirect } from "@/lib/preActivation";
import { getSupabaseServerUser, getUserWorkspaceDashboard } from "@/lib/supabase/server";
import { createStripeCheckoutSession, getStripeConfigStatus, resolveCheckoutPlan } from "@/lib/stripeBilling";
import styles from "./billingStart.module.css";

export const dynamic = "force-dynamic";

type BillingPlanSummary = {
  name: string;
  dueToday: string;
  monthly?: string;
  term: string;
  status: string;
};

function getBillingPlanSummary(planId?: string | null, commercialOption?: string | null): BillingPlanSummary {
  if (planId === "pilot") {
    return {
      name: "Pilot / Setup",
      dueToday: "990 € einmalig · zzgl. USt.",
      term: "1 Testmonat · keine automatische Verlängerung",
      status: "Zahlung offen",
    };
  }

  if (planId === "starter" && commercialOption === "starter_no_setup_commitment") {
    return {
      name: "Starter 12 Monate",
      dueToday: "0 € Setup",
      monthly: "312 €/Monat · zzgl. USt.",
      term: "12 Monate",
      status: "Zahlung offen",
    };
  }

  if (planId === "starter" && commercialOption === "starter_paid_setup") {
    return {
      name: "Starter Flex",
      dueToday: "990 € Setup · zzgl. USt.",
      monthly: "312 €/Monat · zzgl. USt.",
      term: "monatlich kündbar",
      status: "Zahlung offen",
    };
  }

  return {
    name: "Ausgewähltes Paket",
    dueToday: "gemäß Auswahl · zzgl. USt.",
    monthly: "gemäß Auswahl",
    term: "gemäß Auswahl",
    status: "Zahlung offen",
  };
}

const checkoutSteps = ["Konto erstellt", "Zahlung", "Freischaltung"];


export default async function BillingStartPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const { data } = await getSupabaseServerUser();
  if (!data.user) redirect("/login?returnTo=/billing/start");
  if (isPlatformAdminEmail(data.user.email)) redirect("/dashboard");

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  if (workspaceResult.error?.message === "TEMPORARY_DEMO_DELETED") redirect("/login?demo_deleted=1");
  const workspace = workspaceResult.workspace;
  const stripe = getStripeConfigStatus();
  const isDemo = isTemporaryDemoUser(data.user) || workspace?.billing_status === "demo_free" || workspace?.name === "Temporary FanMind Demo";
  const redirectTarget = getPreActivationRedirect(workspace, data.user.email);
  if (redirectTarget === "/workspace/setup") redirect("/workspace/setup");
  if (workspace?.billing_status === "active" || redirectTarget === "/dashboard") redirect("/dashboard");
  if (redirectTarget === "/billing/pending") redirect("/billing/pending");
  if (redirectTarget === "/billing/suspended") redirect("/billing/suspended");
  const resolvedCheckoutPlan = workspace ? resolveCheckoutPlan(workspace.plan_id, workspace.commercial_option) : null;

  const hasUnclearPaymentOption = Boolean(workspace && !resolvedCheckoutPlan && !isDemo);
  const canStartCheckout = Boolean(workspace && shouldShowBillingCheckoutAction(workspace) && stripe.readyForCheckout && !isDemo && resolvedCheckoutPlan);
  let checkoutUrl: string | undefined;
  let checkoutPreparationFailed = false;

  if (canStartCheckout && workspace && resolvedCheckoutPlan) {
    try {
      const session = await createStripeCheckoutSession({
        plan: resolvedCheckoutPlan,
        userId: data.user.id,
        workspaceId: workspace.id,
        userEmail: data.user.email,
      });
      checkoutUrl = session.url;
      checkoutPreparationFailed = !checkoutUrl;
    } catch (error) {
      checkoutPreparationFailed = true;
      console.error("Stripe checkout session could not be created", error);
    }
  }

  const plan = workspace ? getBillingPlanSummary(workspace.plan_id, workspace.commercial_option) : null;

  return (
    <main className={styles.shell}>
      <section className={styles.overlay} aria-label="FanMind freischalten">
        <div className={styles.topbar}>
          <div className={styles.brandBlock}>
            <FanMindLogo className={styles.logo} compact href="/landing-v2" ariaLabel="FanMind Landingpage öffnen" />
            <p>Setup &amp; Zahlung</p>
          </div>
          <ol className={styles.progress} aria-label="Checkout-Fortschritt">
            {checkoutSteps.map((step, index) => (
              <li className={index === 1 ? styles.activeStep : undefined} key={step} aria-current={index === 1 ? "step" : undefined}>
                <span>{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <header className={styles.header}>
          <h1>FanMind freischalten</h1>
          <p>Schließe deine Zahlung ab, damit dein Workspace aktiviert werden kann.</p>
        </header>

        {workspace && plan ? (
          <div className={styles.grid}>
            <section className={styles.panel} aria-labelledby="billing-plan-title">
              <p className={styles.panelKicker}>Ausgewähltes Angebot</p>
              <h2 id="billing-plan-title">Dein Paket</h2>
              <dl className={styles.facts}>
                <div><dt>Paketname</dt><dd>{plan.name}</dd></div>
                <div><dt>Heute fällig</dt><dd>{plan.dueToday}</dd></div>
                {plan.monthly ? <div><dt>Danach monatlich</dt><dd>{plan.monthly}</dd></div> : null}
                <div><dt>Laufzeit</dt><dd>{plan.term}</dd></div>
                <div><dt>Status</dt><dd><span className={styles.status}>{plan.status}</span></dd></div>
              </dl>
            </section>

            <section className={styles.panel} aria-labelledby="billing-payment-title">
              <p className={styles.panelKicker}>Nächster Schritt</p>
              <h2 id="billing-payment-title">Sichere Zahlung</h2>
              <dl className={styles.facts}>
                <div><dt>Workspace</dt><dd>{workspace.name}</dd></div>
                <div><dt>Zahlungsabwicklung</dt><dd>Sichere Zahlung</dd></div>
                <div><dt>Zahlart</dt><dd>SEPA-Lastschrift im nächsten Schritt</dd></div>
                <div><dt>Datenerfassung</dt><dd>Stripe kümmert sich um die Abbuchungen.</dd></div>
              </dl>
            </section>
          </div>
        ) : (
          <div className={styles.infoBox}>Dein Workspace wird vorbereitet. Bitte aktualisiere die Seite in Kürze.</div>
        )}

        <div className={styles.checkoutFooter}>
          <ul className={styles.trustList} aria-label="Sicherheit und Vertrauen">
            <li>Sichere Zahlung</li>
            <li>SEPA-Lastschrift im nächsten Schritt</li>
            <li>Keine Bankdaten in FanMind</li>
            <li>Rechnungs- und Zahlungsdaten werden von FanMind nicht gespeichert</li>
          </ul>
          <div className={styles.actions}>
            {!stripe.readyForCheckout && !isDemo ? (
              <div className={styles.infoBox}>Die Zahlung ist aktuell noch nicht vollständig konfiguriert. Bitte kontaktiere FanMind.</div>
            ) : hasUnclearPaymentOption || params?.error === "payment-option" ? (
              <div className={styles.infoBox}>Deine Zahlungsoption konnte nicht eindeutig zugeordnet werden. Bitte kontaktiere FanMind.</div>
            ) : checkoutPreparationFailed || params?.error === "payment-start" ? (
              <div className={styles.infoBox}>Die Zahlung konnte aktuell nicht vorbereitet werden. Bitte versuche es erneut oder kontaktiere FanMind.</div>
            ) : checkoutUrl ? (
              <div className={buttonStyles.wrap}>
                <a className={buttonStyles.button} href={checkoutUrl}>Weiter zur Zahlung</a>
              </div>
            ) : isDemo ? (
              <div className={styles.infoBox}>Demo-Zugang aktiv. Für diesen Zugang ist keine Zahlung erforderlich.</div>
            ) : null}
          </div>
        </div>
        <Link className={styles.logout} href="/logout">Abmelden</Link>
      </section>
    </main>
  );
}
