import { FanMindLogo } from "@/components/FanMindLogo";
import { getFanMindLanguage, landingPath, localizedPath } from "@/lib/fanmindCopy";
import {
  isPaymentTermsActivationEnabled,
  PAYMENT_TERMS_ACTIVATION_BLOCK_CODE,
} from "@/lib/paymentTermsActivationPolicy.mjs";
import { getPublicDailyTestPlanEnabled } from "@/lib/runtimeProductSettings";
import { isInternalDailyTestWorkspaceProvisioningReady } from "@/lib/supabase/server";
import { getStripeConfigStatus } from "@/lib/stripeBilling";
import { isInternalDailyTestAdmissionReady } from "@/lib/internalDailyTestReadinessPolicy.mjs";
import RegisterClient from "./RegisterClient";
import styles from "./register.module.css";

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
  const params = await searchParams;
  const language = getFanMindLanguage(params.lang);

  if (!isPaymentTermsActivationEnabled()) {
    const loginHref = localizedPath("/login", language);
    const demoHref = language === "en" ? "/login?demo=1&lang=en" : "/login?demo=1";

    return (
      <main className={styles.page}>
        <div className={styles.gridPattern} aria-hidden="true" />
        <section
          className={styles.shell}
          aria-label={
            language === "en"
              ? "FanMind registration status"
              : "FanMind Registrierungsstatus"
          }
        >
          <header className={styles.header}>
            <FanMindLogo
              className={styles.logo}
              compact
              href={landingPath(language)}
              ariaLabel={
                language === "en"
                  ? "Open FanMind homepage"
                  : "FanMind Startseite öffnen"
              }
            />
          </header>

          <div className={styles.authGrid}>
            <section className={styles.formCard}>
              <div className={styles.formHeader}>
                <p className={styles.eyebrow}>
                  {language === "en" ? "Registration paused" : "Registrierung pausiert"}
                </p>
                <h1>
                  {language === "en"
                    ? "Paid activation is temporarily unavailable"
                    : "Entgeltliche Aktivierung ist vorübergehend nicht verfügbar"}
                </h1>
                <p>
                  {language === "en"
                    ? "We are finalizing the binding version of the payment terms. No paid account, checkout or subscription can be started until that version is approved."
                    : "Wir finalisieren die verbindliche Version der Zahlungsbedingungen. Bis diese Version freigegeben ist, kann kein entgeltlicher Account, Checkout oder Abo gestartet werden."}
                </p>
              </div>

              <p className={styles.warning} role="status">
                {language === "en"
                  ? "The free 60-minute demo remains available and does not trigger a payment."
                  : "Die kostenlose 60-Minuten-Demo bleibt verfügbar und löst keine Zahlung aus."}
              </p>

              <div className={styles.pausedPlanSummary} aria-label={
                language === "en"
                  ? "Starter package prices"
                  : "Preise der Starter-Pakete"
              }>
                <p>
                  <strong>Starter Flex</strong>
                  <span>
                    {language === "en"
                      ? "€990 setup + €312/month"
                      : "990 € Setup + 312 €/Monat"}
                  </span>
                </p>
                <p>
                  <strong>
                    {language === "en" ? "Starter 12 months" : "Starter 12"}
                  </strong>
                  <span>
                    {language === "en"
                      ? "€0 setup + €312/month"
                      : "0 € Setup + 312 €/Monat"}
                  </span>
                </p>
              </div>

              <div className={styles.previewActions}>
                <a className={styles.primaryLink} href={demoHref}>
                  {language === "en" ? "Start free demo" : "Kostenlose Demo starten"}
                </a>
                <a className={styles.secondaryLink} href={loginHref}>
                  {language === "en" ? "Existing account login" : "Bestehenden Zugang öffnen"}
                </a>
              </div>

              <p className={styles.notice}>
                {PAYMENT_TERMS_ACTIVATION_BLOCK_CODE}
              </p>
            </section>
          </div>
        </section>
      </main>
    );
  }

  const [dailyTestWindowEnabled, dailyTestProvisioningReady] =
    await Promise.all([
      getPublicDailyTestPlanEnabled(),
      isInternalDailyTestWorkspaceProvisioningReady(),
    ]);
  const enablePublicDailyTestPlan = isInternalDailyTestAdmissionReady({
    windowEnabled: dailyTestWindowEnabled,
    workspaceProvisioningReady: dailyTestProvisioningReady,
    stripeConfig: getStripeConfigStatus(),
  });

  return (
    <RegisterClient
      searchParams={params}
      enablePublicDailyTestPlan={enablePublicDailyTestPlan}
    />
  );
}
