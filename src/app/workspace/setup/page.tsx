import Link from "next/link";
import { redirect } from "next/navigation";
import { getBillingContinuationHref } from "@/lib/preActivation";
import { resolveWorkspaceLocale } from "@/lib/workspaceLocale";
import {
  isPaymentTermsActivationEnabled,
  PAYMENT_TERMS_ACTIVATION_BLOCK_CODE,
} from "@/lib/paymentTermsActivationPolicy.mjs";
import {
  buildTrustedProvisioningUser,
  parseTrustedProvisioningSelection,
} from "@/lib/trustedWorkspaceProvisioning";
import {
  ensureUserWorkspace,
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  signOutSupabaseServerSession,
} from "@/lib/supabase/server";
import styles from "../../dashboard/dashboard.module.css";

export const dynamic = "force-dynamic";

async function logout() {
  "use server";
  await signOutSupabaseServerSession();
  redirect("/");
}

async function provisionStarterWorkspace(formData: FormData) {
  "use server";

  if (!isPaymentTermsActivationEnabled()) {
    redirect(`/workspace/setup?error=${PAYMENT_TERMS_ACTIVATION_BLOCK_CODE}`);
  }

  const { data } = await getSupabaseServerUser();
  if (!data.user) redirect("/login?returnTo=/workspace/setup");

  const selection = parseTrustedProvisioningSelection({
    planId: formData.get("planId"),
    commercialOption: formData.get("commercialOption"),
  });
  const paymentTermsAccepted = formData.get("paymentTermsAccepted") === "on";
  if (
    !selection ||
    selection.planId !== "starter" ||
    paymentTermsAccepted !== true
  ) {
    redirect("/workspace/setup?error=payment_terms_required");
  }

  const trustedUser = buildTrustedProvisioningUser(
    data.user,
    selection,
    true,
  );
  if (!trustedUser) {
    redirect(`/workspace/setup?error=${PAYMENT_TERMS_ACTIVATION_BLOCK_CODE}`);
  }

  const result = await ensureUserWorkspace(trustedUser);
  if (!result.workspace) redirect("/workspace/setup?error=workspace_setup_failed");
  redirect(getBillingContinuationHref(result.workspace));
}

export default async function WorkspaceSetupPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string | string[]; error?: string | string[] }>;
}) {
  const params = await searchParams;
  const { data } = await getSupabaseServerUser();
  if (!data.user) {
    const requestedLang = Array.isArray(params?.lang)
      ? params.lang[0]
      : params?.lang;
    const returnTo = requestedLang === "en"
      ? "/workspace/setup?lang=en"
      : "/workspace/setup";
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const locale = await resolveWorkspaceLocale({
    lang: params?.lang,
    user: data.user,
  });

  const existingWorkspaceResult = await getUserWorkspaceDashboard(data.user);
  if (existingWorkspaceResult.error?.message === "TEMPORARY_DEMO_DELETED") redirect("/login?demo_deleted=1");
  if (existingWorkspaceResult.workspace) redirect(getBillingContinuationHref(existingWorkspaceResult.workspace));

  const activationEnabled = isPaymentTermsActivationEnabled();
  const errorCode = Array.isArray(params?.error) ? params.error[0] : params?.error;
  const paymentTermsHref = locale === "en"
    ? "/zahlungsbedingungen?lang=en"
    : "/zahlungsbedingungen";

  return (
    <main className={styles.page}>
      <section
        className={styles.fallbackCard}
        aria-label={locale === "en" ? "Set up workspace" : "Workspace einrichten"}
      >
        <div>
          <p className={styles.eyebrow}>FanMind Setup</p>
          <h1>
            {activationEnabled
              ? locale === "en"
                ? "Confirm your Starter option"
                : "Bestätige deine Starter-Option"
              : locale === "en"
                ? "Paid activation is currently paused"
                : "Entgeltliche Aktivierung ist aktuell pausiert"}
          </h1>
          <p>
            {activationEnabled
              ? locale === "en"
                ? "For security, an account without a workspace is never provisioned from editable profile metadata. Choose the Starter option again and explicitly accept the current payment terms."
                : "Aus Sicherheitsgründen wird ein Konto ohne Workspace niemals aus bearbeitbaren Profildaten automatisch provisioniert. Wähle die Starter-Option erneut und akzeptiere die aktuellen Zahlungsbedingungen ausdrücklich."
              : locale === "en"
                ? "The binding payment-terms version has not yet been released. No paid workspace or Stripe checkout can be created until that version is confirmed."
                : "Die verbindliche Version der Zahlungsbedingungen ist noch nicht freigegeben. Bis zur Bestätigung wird weder ein entgeltlicher Workspace noch ein Stripe-Checkout erzeugt."}
          </p>
        </div>

        {activationEnabled ? (
          <div className={styles.emptyState}>
            <form action={provisionStarterWorkspace}>
              <input type="hidden" name="planId" value="starter" />
              <input type="hidden" name="commercialOption" value="starter_paid_setup" />
              <label>
                <input type="checkbox" name="paymentTermsAccepted" required />
                {" "}
                {locale === "en" ? "I accept the current payment terms." : "Ich akzeptiere die aktuellen Zahlungsbedingungen."}
              </label>
              <p><Link href={paymentTermsHref}>{locale === "en" ? "Open payment terms" : "Zahlungsbedingungen öffnen"}</Link></p>
              <button className={styles.primaryButton} type="submit">
                {locale === "en" ? "Starter Flex · €990 setup + €312/month" : "Starter Flex · 990 € Setup + 312 €/Monat"}
              </button>
            </form>

            <form action={provisionStarterWorkspace}>
              <input type="hidden" name="planId" value="starter" />
              <input type="hidden" name="commercialOption" value="starter_no_setup_commitment" />
              <label>
                <input type="checkbox" name="paymentTermsAccepted" required />
                {" "}
                {locale === "en" ? "I accept the current payment terms." : "Ich akzeptiere die aktuellen Zahlungsbedingungen."}
              </label>
              <p><Link href={paymentTermsHref}>{locale === "en" ? "Open payment terms" : "Zahlungsbedingungen öffnen"}</Link></p>
              <button className={styles.primaryButton} type="submit">
                {locale === "en" ? "Starter 12 months · €0 setup + €312/month" : "Starter 12 Monate · 0 € Setup + 312 €/Monat"}
              </button>
            </form>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <strong>{PAYMENT_TERMS_ACTIVATION_BLOCK_CODE}</strong>
            <p>{locale === "en" ? "The free demo remains available." : "Die kostenlose Demo bleibt verfügbar."}</p>
            <Link className={styles.primaryButton} href={locale === "en" ? "/login?demo=1&lang=en" : "/login?demo=1"}>
              {locale === "en" ? "Start free demo" : "Kostenlose Demo starten"}
            </Link>
          </div>
        )}

        {errorCode ? (
          <p className={styles.error} role="alert">
            {locale === "en"
              ? `Workspace provisioning is still blocked (${errorCode}).`
              : `Die Workspace-Einrichtung ist weiterhin gesperrt (${errorCode}).`}
          </p>
        ) : null}

        <div className={styles.emptyActions}>
          <form action={logout}>
            <button className={styles.secondaryButton} type="submit">
              {locale === "en" ? "Sign out" : "Abmelden"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
