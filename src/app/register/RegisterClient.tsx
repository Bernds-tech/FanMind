"use client";

import { FormEvent, use, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient, syncSupabaseSessionForServer } from "@/lib/supabase/client";
import { isPlanId, resolvePlanId, type CommercialOption, type ProductiveCommercialOption } from "@/lib/plans";
import { PAYMENT_TERMS_VERSION, getBillingProvider, getInitialBillingStatus, getPaymentCollectionMethod, requiresPaymentTermsAcceptance } from "@/lib/billing";
import type { PlanId } from "@/config/plans";
import FeatureStatusLabel, { type FeatureStatusLabelVariant } from "@/components/FeatureStatusLabel";
import { FanMindLogo } from "@/components/FanMindLogo";
import { fanmindCopy, getFanMindLanguage, landingPath, localizedPath, type FanMindLanguage } from "@/lib/fanmindCopy";
import { ComingSoonMark } from "@/components/ComingSoonMark";
import {
  buildRegistrationHref,
  isDailyTestRegistration,
  isProductiveRegistrationEntry,
  normalizeStarterOfferOption,
} from "@/lib/registrationEntryPolicy.mjs";
import styles from "./register.module.css";

type RegisterPlanId = PlanId;
type StarterOfferOptionId = "starter_paid_setup" | "starter_no_setup_commitment";

type RegisterPageProps = {
  searchParams: Promise<{ lang?: string | string[]; plan?: string | string[]; option?: string | string[]; ref?: string | string[]; referral_code?: string | string[]; test_plan?: string | string[] }> | { lang?: string | string[]; plan?: string | string[]; option?: string | string[]; ref?: string | string[]; referral_code?: string | string[]; test_plan?: string | string[] };
  enablePublicDailyTestPlan: boolean;
};

type PlanSelectionCopy = {
  label: string;
  badge: string;
  title: string;
  price: string;
  description: string;
  bullets: string[];
  href: string;
  cta: string;
};

function planStatusVariant(planId: RegisterPlanId): FeatureStatusLabelVariant {
  if (planId === "growth") return "preview";
  if (planId === "agency") return "roadmap";
  return "active";
}

type StarterOptionCopy = {
  id: StarterOfferOptionId;
  title: string;
  price: string;
  description: string;
  bullets: string[];
  badge?: string;
};

const ACTIVE_REGISTER_PLANS: RegisterPlanId[] = ["starter"];

function firstParamValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function planCommercialOption(planId: RegisterPlanId, starterOption: StarterOfferOptionId): CommercialOption | StarterOfferOptionId {
  if (planId === "pilot") return "pilot_only";
  if (planId === "starter") return starterOption;
  if (planId === "growth") return "growth_preview";
  return "agency_preview";
}

function LanguageSwitch({
  language,
  planId,
  starterOption,
  referralCode,
  testPlan,
}: {
  language: FanMindLanguage;
  planId: RegisterPlanId;
  starterOption: StarterOfferOptionId;
  referralCode: string;
  testPlan?: "daily";
}) {
  return (
    <div className={styles.languageSwitch} aria-label={language === "en" ? "Language selection" : "Sprachauswahl"}>
      <a className={language === "de" ? styles.languageActive : undefined} href={buildRegistrationHref({ language: "de", planId, starterOption, referralCode, testPlan })} aria-current={language === "de" ? "true" : undefined}>DE</a>
      <span>|</span>
      <a className={language === "en" ? styles.languageActive : undefined} href={buildRegistrationHref({ language: "en", planId, starterOption, referralCode, testPlan })} aria-current={language === "en" ? "true" : undefined}>EN</a>
    </div>
  );
}

function isPreviewPlan(planId: RegisterPlanId) {
  return planId === "growth" || planId === "agency";
}

function showPlanStatusBadge(planId: RegisterPlanId) {
  return !isPreviewPlan(planId);
}

function getPlanSelectionCopy(
  language: FanMindLanguage,
  enablePublicDailyTestPlan: boolean,
  starterOption: StarterOfferOptionId,
  referralCode: string,
): PlanSelectionCopy[] {
  if (language === "en") {
    return [
      {
        label: "1",
        badge: "Active",
        title: "Choose Starter",
        price: "€312/month",
        description: "Two options for your productive start.",
        bullets: ["Starter Flex: €990 setup", "Starter 12 months: €0 setup"],
        href: buildRegistrationHref({ language, planId: "starter", starterOption, referralCode }),
        cta: "Choose Starter",
      },
      ...(enablePublicDailyTestPlan ? [{
        label: "3",
        badge: "Beta",
        title: "Beta-Test · 1 €/Tag",
        price: "1 €/day",
        description: "Interner/Beta-Testplan, täglich kündbar, 1 € pro Tag.",
        bullets: ["daily cancellable", "beta/internal test"],
        href: buildRegistrationHref({ language, planId: "pilot", referralCode, testPlan: "daily" }),
        cta: "Choose beta test",
      }] : []),
      {
        label: enablePublicDailyTestPlan ? "4" : "3",
        badge: "Preview",
        title: "Growth",
        price: "Coming Soon",
        description: "Roadmap preview.",
        bullets: ["Roadmap"],
        href: buildRegistrationHref({ language, planId: "growth", referralCode }),
        cta: "Learn more",
      },
      {
        label: enablePublicDailyTestPlan ? "5" : "4",
        badge: "Demo",
        title: "Agency",
        price: "Coming Soon",
        description: "Roadmap preview.",
        bullets: ["Roadmap"],
        href: buildRegistrationHref({ language, planId: "agency", referralCode }),
        cta: "Learn more",
      },
    ];
  }

  return [
    {
      label: "1",
      badge: "Aktiv",
      title: "Starter wählen",
      price: "312 €/Monat",
      description: "Zwei Optionen für deinen Produktivstart.",
      bullets: ["Starter Flex: 990 € Setup", "Starter 12 Monate: 0 € Setup"],
      href: buildRegistrationHref({ language, planId: "starter", starterOption, referralCode }),
      cta: "Starter wählen",
    },
    ...(enablePublicDailyTestPlan ? [{
      label: "3",
      badge: "Beta",
      title: "Beta-Test · 1 €/Tag",
      price: "1 €/Tag",
      description: "Interner/Beta-Testplan, täglich kündbar, 1 € pro Tag.",
      bullets: ["täglich kündbar", "Beta-/interner Test"],
      href: buildRegistrationHref({ language, planId: "pilot", referralCode, testPlan: "daily" }),
      cta: "Beta-Test wählen",
    }] : []),
    {
      label: enablePublicDailyTestPlan ? "4" : "3",
      badge: "Vorschau",
      title: "Growth",
      price: "Coming Soon",
      description: "Roadmap-Vorschau.",
      bullets: ["Roadmap"],
      href: buildRegistrationHref({ language, planId: "growth", referralCode }),
      cta: "Mehr erfahren",
    },
    {
      label: enablePublicDailyTestPlan ? "5" : "4",
      badge: "Demo",
      title: "Agency",
      price: "Coming Soon",
      description: "Roadmap-Vorschau.",
      bullets: ["Roadmap"],
      href: buildRegistrationHref({ language, planId: "agency", referralCode }),
      cta: "Mehr erfahren",
    },
  ];
}

function getStarterOptionsCopy(language: FanMindLanguage): StarterOptionCopy[] {
  if (language === "en") {
    return [
      {
        id: "starter_paid_setup",
        title: "Starter Flex",
        price: "€990 setup + €312/month",
        description: "Cancel any time at the end of the paid billing month",
        bullets: ["€990 one-time setup", "full current month remains payable"],
      },
      {
        id: "starter_no_setup_commitment",
        title: "Starter 12 months",
        price: "€0 setup + €312/month",
        description: "12-month minimum term, then renews monthly",
        bullets: ["no setup fee", "monthly renewal after month 12"],
      },
    ];
  }

  return [
    {
      id: "starter_paid_setup",
      title: "Starter Flex",
      price: "990 € Setup + 312 €/Monat",
      description: "Jederzeit zum Ende des bezahlten Abrechnungsmonats kündbar",
      bullets: ["990 € einmalige Einrichtung", "laufender Monat wird vollständig bezahlt"],
    },
    {
      id: "starter_no_setup_commitment",
      title: "Starter 12 Monate",
      price: "0 € Setup + 312 €/Monat",
      description: "12 Monate Mindestlaufzeit, danach monatliche Verlängerung",
      bullets: ["keine Einrichtungsgebühr", "nach 12 Monaten monatlich verlängerbar"],
    },
  ];
}

const EMAIL_CONFIRMATION_WORKSPACE_MESSAGES: Record<FanMindLanguage, string> = {
  de: "Registrierung angelegt. Bitte bestätige deine E-Mail-Adresse oder melde dich nach Freischaltung an.",
  en: "Registration created. Please confirm your email address or sign in after activation.",
};

const DAILY_TEST_WINDOW_CLOSED_MESSAGES: Record<FanMindLanguage, string> = {
  de: "Das Beta-Zeitfenster ist abgelaufen oder aktuell nicht verfügbar. Bitte aktualisiere die Seite oder wähle Starter.",
  en: "The beta window has expired or is currently unavailable. Refresh the page or choose Starter.",
};

const DAILY_TEST_WORKSPACE_RECOVERY_MESSAGES: Record<FanMindLanguage, string> = {
  de: "Dein Konto wurde erstellt, aber es wurde kein Daily-Test-Workspace angelegt. Bitte registriere dich nicht erneut, sondern kontaktiere FanMind für einen kontrollierten Wechsel zu Starter.",
  en: "Your account was created, but no Daily Test workspace was provisioned. Do not register again; contact FanMind for a controlled switch to Starter.",
};

const WORKSPACE_RECOVERY_MESSAGES: Record<FanMindLanguage, string> = {
  de: "Dein Konto wurde erstellt, aber der Workspace konnte noch nicht sicher eingerichtet werden. Bitte registriere dich nicht erneut; versuche es später erneut oder kontaktiere FanMind.",
  en: "Your account was created, but the workspace could not yet be provisioned securely. Do not register again; retry later or contact FanMind.",
};

export default function RegisterClient({ searchParams, enablePublicDailyTestPlan }: RegisterPageProps) {
  const params = searchParams instanceof Promise ? use(searchParams) : searchParams;
  const language = getFanMindLanguage(params.lang);
  const rawPlan = firstParamValue(params.plan);
  const referralCodeFromUrl = firstParamValue(params.ref) ?? firstParamValue(params.referral_code) ?? "";
  const requestedTestPlan = firstParamValue(params.test_plan);
  const requestedStarterOption = normalizeStarterOfferOption(firstParamValue(params.option));
  const hasInvalidPlan = Boolean(rawPlan && !isPlanId(rawPlan));
  const resolvedPlanId = resolvePlanId(rawPlan, "starter");
  const isDailyTestPlanSelected = isDailyTestRegistration({
    enabled: enablePublicDailyTestPlan,
    planId: resolvedPlanId,
    testPlan: requestedTestPlan,
  });
  const isRetiredPilotRequested = resolvedPlanId === "pilot" && !isDailyTestPlanSelected;
  const selectedPlanId = isRetiredPilotRequested ? "starter" : resolvedPlanId;
  const isProductiveRegistration =
    ACTIVE_REGISTER_PLANS.includes(selectedPlanId) ||
    isProductiveRegistrationEntry({
      enabled: enablePublicDailyTestPlan,
      planId: selectedPlanId,
      testPlan: requestedTestPlan,
    });
  const copy = fanmindCopy[language].register;
  const loginHref = localizedPath("/login", language);
  const billingStartHref = "/billing/start";
  const paymentTermsHref = language === "en" ? "/zahlungsbedingungen?lang=en" : "/zahlungsbedingungen";
  const starterOptionsCopy = getStarterOptionsCopy(language);
  const [starterOption, setStarterOption] = useState<StarterOptionId>(requestedStarterOption);
  const planSelectionCopy = getPlanSelectionCopy(
    language,
    enablePublicDailyTestPlan,
    starterOption,
    referralCodeFromUrl,
  );
  const [success, setSuccess] = useState(false);
  const [awaitingEmailConfirmation, setAwaitingEmailConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const commercialOption = isDailyTestPlanSelected ? "internal_daily_test" : planCommercialOption(selectedPlanId, starterOption);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isProductiveRegistration || (selectedPlanId !== "pilot" && selectedPlanId !== "starter")) {
      setError(language === "en" ? "This package is currently a preview. Please start with Starter or request a demo." : "Dieses Paket ist aktuell eine Vorschau. Bitte starte mit Starter oder frage eine Demo an.");
      return;
    }

    setSuccess(false);
    setAwaitingEmailConfirmation(false);
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const organization = String(formData.get("organisation") ?? "").trim();
    const role = String(formData.get("rolle") ?? "").trim();
    const message = String(formData.get("nachricht") ?? "").trim();
    const commercialOptionValue = String(formData.get("commercialOption") ?? starterOption);
    const selectedCommercialOption: ProductiveCommercialOption | StarterOfferOptionId = isDailyTestPlanSelected && commercialOptionValue === "internal_daily_test"
      ? "internal_daily_test"
      : selectedPlanId === "starter" && (commercialOptionValue === "starter_paid_setup" || commercialOptionValue === "starter_no_setup_commitment")
        ? commercialOptionValue
        : "pilot_only";
    const paymentTermsAccepted = formData.get("paymentTermsAccepted") === "on";
    const referralCode = String(formData.get("referralCode") ?? referralCodeFromUrl).trim();

    if (requiresPaymentTermsAcceptance(selectedPlanId, selectedCommercialOption) && !paymentTermsAccepted) {
      setError(language === "en" ? "Please accept the payment terms before continuing." : "Bitte akzeptiere die Zahlungsbedingungen, bevor du fortfährst.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (selectedCommercialOption === "internal_daily_test") {
        let windowResponse: Response;
        let windowPayload: { ok?: boolean } | null;
        try {
          windowResponse = await fetch("/api/register/daily-test-window", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ commercialOption: "internal_daily_test" }),
            cache: "no-store",
          });
          windowPayload = await windowResponse.json().catch(() => null) as
            | { ok?: boolean }
            | null;
        } catch {
          setError(DAILY_TEST_WINDOW_CLOSED_MESSAGES[language]);
          return;
        }

        if (!windowResponse.ok || windowPayload?.ok !== true) {
          setError(DAILY_TEST_WINDOW_CLOSED_MESSAGES[language]);
          return;
        }
      }

      const supabase = createSupabaseBrowserClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name || undefined,
            display_name: name || undefined,
            organization: organization || undefined,
            role: role || undefined,
            message: message || undefined,
            fanmind_locale: language,
            plan_id: selectedPlanId,
            commercial_option: selectedCommercialOption,
            payment_terms_version: PAYMENT_TERMS_VERSION,
            payment_terms_accepted_at: paymentTermsAccepted ? new Date().toISOString() : undefined,
            payment_terms_accepted: paymentTermsAccepted || undefined,
            billing_provider: getBillingProvider(),
            payment_collection_method: getPaymentCollectionMethod(selectedPlanId, selectedCommercialOption),
            billing_status: getInitialBillingStatus(selectedPlanId, selectedCommercialOption),
            referral_code: referralCode || undefined,
          },
        },
      });

      if (!authError && data.session?.access_token) {
        await syncSupabaseSessionForServer(data.session);
      }

      if (!authError && data.session?.user) {
        const workspaceResponse = await fetch("/api/register/workspace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: selectedPlanId,
            commercialOption: selectedCommercialOption,
            paymentTermsAccepted,
          }),
          cache: "no-store",
        });
        const workspacePayload = await workspaceResponse.json().catch(() => null) as
          | { ok?: boolean; code?: string }
          | null;

        if (!workspaceResponse.ok || workspacePayload?.ok !== true) {
          setError(
            workspacePayload?.code === "daily_test_window_closed"
              ? DAILY_TEST_WORKSPACE_RECOVERY_MESSAGES[language]
              : WORKSPACE_RECOVERY_MESSAGES[language],
          );
          return;
        }

        if (referralCode) {
          const referralResponse = await fetch("/api/referrals/attribution", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ referralCode }),
          });
          if (!referralResponse.ok) {
            const referralPayload = await referralResponse.json().catch(() => ({}));
            setError(typeof referralPayload.error === "string" ? referralPayload.error : (language === "en" ? "Referral code could not be saved." : "Referral-Code konnte nicht gespeichert werden."));
            return;
          }
        }
      }

      if (authError) {
        setError(authError.message);
        return;
      }

      setSuccess(true);
      setAwaitingEmailConfirmation(!data.session);

      if (data.session?.user) {
        router.push("/billing/start");
        router.refresh();
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unbekannter Supabase-Fehler.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.gridPattern} aria-hidden="true" />
      <section className={styles.shell} aria-label={language === "en" ? "FanMind access" : "FanMind Zugang"}>
        <header className={styles.header}>
          <FanMindLogo className={styles.logo} compact href={landingPath(language)} ariaLabel={language === "en" ? "Open FanMind homepage" : "FanMind Startseite öffnen"} />
          <nav className={styles.topLinks} aria-label="Registrierung Navigation">
            <LanguageSwitch
              language={language}
              planId={selectedPlanId}
              starterOption={starterOption}
              referralCode={referralCodeFromUrl}
              testPlan={isDailyTestPlanSelected ? "daily" : undefined}
            />
            <span>{copy.loginPrompt}</span>
            <a href={loginHref}>{copy.loginLink}</a>
          </nav>
        </header>

        <div className={styles.authGrid}>
          <aside className={styles.visualPanel} aria-label={language === "en" ? "Package logic" : "Paketlogik"}>
            <div className={styles.planIntro}>
              <p className={styles.eyebrow}>{language === "en" ? "Setup first" : "Setup zuerst"}</p>
              <h1>{language === "en" ? "Choose your FanMind entry" : "Wähle deinen FanMind-Einstieg"}</h1>
              <p>{language === "en" ? "Compact overview for Starter and roadmap." : "Kompakte Paketübersicht für Starter und Roadmap."}</p>
            </div>

            {hasInvalidPlan && (
              <p className={styles.warning} role="status">
                {language === "en" ? `Unknown package “${rawPlan}”. Starter is shown instead.` : `Unbekanntes Paket „${rawPlan}“. Starter wird stattdessen angezeigt.`}
              </p>
            )}
            {isRetiredPilotRequested && (
              <p className={styles.warning} role="status">
                {language === "en" ? "The former paid pilot offer is closed. Starter is shown instead." : "Das frühere entgeltliche Pilotangebot ist geschlossen. Stattdessen wird Starter angezeigt."}
              </p>
            )}

            <div className={styles.planSelection}>
              {planSelectionCopy.map((plan) => {
                const planId = plan.href.match(/plan=([^&]+)/)?.[1] as RegisterPlanId;
                const isSelected = isDailyTestPlanSelected ? plan.href.includes("test_plan=daily") : planId === selectedPlanId;
                return (
                  <a
                    key={plan.title}
                    className={`${styles.planCard} ${isSelected ? styles.planCardSelected : ""} ${isPreviewPlan(planId) ? styles.cardWithComingSoon : ""}`}
                    href={plan.href}
                    aria-current={isSelected ? "page" : undefined}
                  >
                    <div className={styles.planCardHeader}>
                      <span className={styles.planNumber}>{plan.label}</span>
                      {showPlanStatusBadge(planId) ? (
                        <FeatureStatusLabel variant={planStatusVariant(planId)}>{plan.badge}</FeatureStatusLabel>
                      ) : null}
                    </div>
                    <h2>{plan.title}</h2>
                    <strong>{plan.price}</strong>
                    <p>{plan.description}</p>
                    <ul>
                      {plan.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                    </ul>
                    <span className={styles.planCta}>{plan.cta} →</span>
                    {isPreviewPlan(planId) ? <ComingSoonMark size="small" className={styles.comingSoonImage} /> : null}
                  </a>
                );
              })}
            </div>
          </aside>

          {isProductiveRegistration ? (
            <form className={styles.formCard} onSubmit={handleRegister}>
              <div className={styles.formHeader}>
                <p className={styles.eyebrow}>{isDailyTestPlanSelected ? "Beta-Test" : "Starter-Paket"}</p>
                <h1>{isDailyTestPlanSelected ? "Beta-Test · 1 €/Tag" : (language === "en" ? "Start Starter" : "Starter starten")}</h1>
                <p>{isDailyTestPlanSelected ? "Interner/Beta-Testplan, täglich kündbar, 1 € pro Tag." : (language === "en" ? "Choose your Starter option. No payment is triggered here." : "Wähle deine Starter-Variante. Hier wird noch keine Zahlung ausgelöst.")}</p>
              </div>

              {selectedPlanId === "starter" && (
                <fieldset className={styles.commercialOptions}>
                  <legend>{language === "en" ? "Starter options" : "Starter-Optionen"}</legend>
                  {starterOptionsCopy.map((option) => (
                    <label key={option.id} className={`${styles.optionCard} ${option.id === starterOption ? styles.optionCardSelected : ""}`}>
                      <input
                        type="radio"
                        name="commercialOption"
                        value={option.id}
                        checked={starterOption === option.id}
                        onChange={() => setStarterOption(option.id)}
                      />
                      <span className={styles.optionMarker} aria-hidden="true">{option.id === "starter_paid_setup" ? "A" : "B"}</span>
                      <span>
                        <span className={styles.optionTitleRow}>
                          <strong>{option.title}</strong>
                        </span>
                        <b>{option.price}</b>
                        {option.id === starterOption ? <em className={styles.selectedOptionLabel}>{language === "en" ? "Selected" : "Ausgewählt"}</em> : null}
                        <small>{option.description}</small>
                        <ul>
                          {option.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                        </ul>
                      </span>
                    </label>
                  ))}
                </fieldset>
              )}

              {selectedPlanId !== "starter" ? <input type="hidden" name="commercialOption" value={commercialOption} /> : null}

              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>{copy.name}</span>
                  <div className={styles.inputWrap}>
                    <span aria-hidden="true">♙</span>
                    <input type="text" name="name" placeholder={language === "en" ? "Your name" : "Dein Name"} autoComplete="name" />
                  </div>
                </label>

                <label className={styles.field}>
                  <span>{copy.email}</span>
                  <div className={styles.inputWrap}>
                    <span aria-hidden="true">✉</span>
                    <input type="email" name="email" placeholder={language === "en" ? "Your email address" : "Deine E-Mail-Adresse"} autoComplete="email" required />
                  </div>
                </label>
              </div>

              <label className={styles.field}>
                <span>{copy.password}</span>
                <div className={styles.inputWrap}>
                  <span aria-hidden="true">▣</span>
                  <input type={showPassword ? "text" : "password"} name="password" placeholder={language === "en" ? "Choose a secure password" : "Wähle ein sicheres Passwort"} autoComplete="new-password" minLength={6} required />
                  <button
                    className={styles.passwordToggle}
                    type="button"
                    aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? "◉" : "◌"}
                  </button>
                </div>
              </label>

              <div className={styles.formGrid}>
                <label className={styles.field}>
                <span>{copy.organization}</span>
                <div className={styles.inputWrap}>
                  <span aria-hidden="true">▤</span>
                  <input type="text" name="organisation" placeholder={language === "en" ? "e.g. Team Arena, club or creator name" : "z. B. Team Arena, Club oder Creator-Name"} autoComplete="organization" required />
                </div>
              </label>

              <label className={styles.field}>
                <span>{copy.role}</span>
                <div className={styles.inputWrap}>
                  <span aria-hidden="true">◇</span>
                  <select name="rolle" defaultValue="" required>
                    <option value="" disabled>{language === "en" ? "Please select" : "Bitte auswählen"}</option>
                    <option>Creator</option>
                    <option>{language === "en" ? "Club or association" : "Club oder Verein"}</option>
                    <option>{language === "en" ? "Event team" : "Event-Team"}</option>
                    <option>Fan-Community</option>
                    <option>{language === "en" ? "Agency" : "Agentur"}</option>
                  </select>
                </div>
              </label>

              </div>

              <label className={`${styles.field} ${styles.referralField}`}>
                <span>{language === "en" ? "Referral code" : "Referral-Code"}</span>
                {referralCodeFromUrl ? (
                  <div className={styles.referralDetected}>
                    <strong>{language === "en" ? "Referral code detected" : "Referral-Code erkannt"}</strong>
                    <small>{language === "en" ? `Referred by ${referralCodeFromUrl}` : `Geworben durch ${referralCodeFromUrl}`}</small>
                  </div>
                ) : null}
                <div className={styles.inputWrap}>
                  <span aria-hidden="true">%</span>
                  <input type="text" name="referralCode" defaultValue={referralCodeFromUrl} placeholder={language === "en" ? "Optional, e.g. FM-ABC123" : "Optional, z. B. FM-ABC123"} autoComplete="off" />
                </div>
              </label>

              <label className={styles.field}>
                <span>{copy.message}</span>
                <div className={styles.textareaWrap}>
                  <textarea name="nachricht" placeholder={language === "en" ? "What would you like to improve first with FanMind?" : "Was möchtest du mit FanMind zuerst verbessern?"} rows={1} />
                </div>
              </label>

              <label className={styles.termsCheckbox}>
                <input type="checkbox" name="paymentTermsAccepted" required={requiresPaymentTermsAcceptance(selectedPlanId, commercialOption)} />
                <span>
                  {language === "en"
                    ? "I accept the payment terms and understand that no payment is collected here."
                    : "Ich akzeptiere die Zahlungsbedingungen. Mir ist bewusst, dass hier noch keine Zahlung ausgelöst wird."} {" "}
                  <a href={paymentTermsHref} target="_blank" rel="noreferrer">{language === "en" ? "Payment terms" : "Zahlungsbedingungen"}</a>
                </span>
              </label>

              <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>
                {isSubmitting ? (language === "en" ? "Creating account…" : "Konto wird erstellt…") : copy.submit} <span>→</span>
              </button>

              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}

              {success && (
                <p className={styles.success} role="status">
                  {copy.success} {awaitingEmailConfirmation
                    ? (EMAIL_CONFIRMATION_WORKSPACE_MESSAGES[language])
                    : isDailyTestPlanSelected
                      ? (language === "en" ? "Your beta test access is prepared. Open payment to activate the daily test subscription." : "Dein Beta-Testzugang ist vorbereitet. Öffne die Zahlung, um das tägliche Testabo zu aktivieren.")
                      : (language === "en" ? "Profile, workspace and Starter option are prepared. You will be forwarded to onboarding." : "Profil, Workspace und Starter-Option sind vorbereitet. Dein Zugang wurde erstellt. Starte jetzt die Zahlung, um FanMind freizuschalten.")} <a href={billingStartHref}>{language === "en" ? "Open payment" : "Zahlung öffnen"}</a>
                </p>
              )}

              <p className={styles.notice}>{language === "en" ? "No payment on this page. No checkout, no debit, no subscription activation." : "Keine Zahlung auf dieser Seite. Kein Checkout, keine Abbuchung, keine Subscription-Aktivierung."}</p>

              <div className={styles.footerLinks}>
                <a href={loginHref}>{copy.loginPrompt} {copy.loginLink}</a>
                <a href={landingPath(language)}>{copy.landing}</a>
                <a href={paymentTermsHref}>{language === "en" ? "Payment terms" : "Zahlungsbedingungen"}</a>
              </div>
            </form>
          ) : (
            <section className={`${styles.previewCard} ${styles.cardWithComingSoon}`} aria-label={selectedPlanId === "growth" ? "Growth Vorschau" : "Agency Demo"}>
              <p className={styles.eyebrow}>{selectedPlanId === "growth" ? (language === "en" ? "Growth preview" : "Growth Vorschau") : (language === "en" ? "Agency demo" : "Agency Demo/Erstgespräch")}</p>
              <h1>{selectedPlanId === "growth" ? "Growth" : "Agency"}</h1>
              <p>{selectedPlanId === "growth" ? (language === "en" ? "Growth is visible for planning, but it is not directly available as a productive registration in the Produkt start." : "Growth ist für die Planung sichtbar, aber zum Produkt-Start noch nicht direkt produktiv registrierbar.") : (language === "en" ? "Agency starts with a demo/intro call. It is not directly available as a productive registration in the Produkt start." : "Agency startet mit Demo/Erstgespräch. Zum Produkt-Start ist es noch nicht direkt produktiv registrierbar.")}</p>
              <div className={styles.previewNotice}>
                <FeatureStatusLabel variant={selectedPlanId === "growth" ? "preview" : "roadmap"}>
                  {selectedPlanId === "growth" ? (language === "en" ? "Preview" : "Vorschau") : "Roadmap"}
                </FeatureStatusLabel>
                <span>{language === "en" ? "Growth and Agency remain Coming Soon / roadmap previews and are not productively activated here." : "Growth und Agency bleiben Coming Soon / Roadmap-Vorschau und werden hier nicht produktiv freigeschaltet."}</span>
              </div>
              <div className={styles.previewActions}>
                <a className={styles.primaryLink} href={buildRegistrationHref({ language, planId: "starter", starterOption, referralCode: referralCodeFromUrl })}>{language === "en" ? "Start with Starter" : "Mit Starter starten"}</a>
                <a className={styles.secondaryLink} href="mailto:kontakt@fanmind.ch?subject=FanMind%20Demo%20anfragen">{language === "en" ? "Request demo" : "Zugang anfragen"}</a>
              </div>
              {error && <p className={styles.error} role="alert">{error}</p>}
              <p className={styles.notice}>{language === "en" ? "No productive Growth/Agency activation, no payment and no subscription billing are created here." : "Hier wird keine produktive Growth-/Agency-Freischaltung, keine Zahlung und keine Subscription-Abrechnung erstellt."}</p>
              <ComingSoonMark size="medium" className={styles.comingSoonImage} />
              <div className={styles.footerLinks}>
                <a href={loginHref}>{copy.loginPrompt} {copy.loginLink}</a>
                <a href={landingPath(language)}>{copy.landing}</a>
                <a href={paymentTermsHref}>{language === "en" ? "Payment terms" : "Zahlungsbedingungen"}</a>
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
