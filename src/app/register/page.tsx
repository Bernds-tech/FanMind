"use client";

import Image from "next/image";
import { FormEvent, use, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient, syncSupabaseSessionForServer } from "@/lib/supabase/client";
import { getRegistrationCommercialTerms, isPlanId, resolvePlanId, type CommercialOption, type ProductiveCommercialOption } from "@/lib/plans";
import type { PlanId } from "@/config/plans";
import FeatureStatusLabel, { type FeatureStatusLabelVariant } from "@/components/FeatureStatusLabel";
import { FanMindLogo } from "@/components/FanMindLogo";
import { fanmindCopy, getFanMindLanguage, landingPath, localizedPath, type FanMindLanguage } from "@/lib/fanmindCopy";
import styles from "./register.module.css";

type RegisterPlanId = PlanId;
type StarterOfferOptionId = "starter_paid_setup" | "starter_no_setup_commitment";

type RegisterPageProps = {
  searchParams: Promise<{ lang?: string | string[]; plan?: string | string[] }>;
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

const ACTIVE_REGISTER_PLANS: RegisterPlanId[] = ["pilot", "starter"];

function firstParamValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function registerPlanHref(planId: RegisterPlanId, language: FanMindLanguage) {
  return language === "en" ? `/register?plan=${planId}&lang=en` : `/register?plan=${planId}`;
}

function onboardingHref(planId: Extract<RegisterPlanId, "pilot" | "starter">, language: FanMindLanguage) {
  const base = planId === "pilot" ? "/onboarding?plan=pilot&demo=1" : "/onboarding?plan=starter";
  return language === "en" ? `${base}&lang=en` : base;
}

function planCommercialOption(planId: RegisterPlanId, starterOption: StarterOfferOptionId): CommercialOption | StarterOfferOptionId {
  if (planId === "pilot") return "pilot_only";
  if (planId === "starter") return starterOption;
  if (planId === "growth") return "growth_preview";
  return "agency_preview";
}

function LanguageSwitch({ language, planId }: { language: FanMindLanguage; planId: RegisterPlanId }) {
  return (
    <div className={styles.languageSwitch} aria-label={language === "en" ? "Language selection" : "Sprachauswahl"}>
      <a className={language === "de" ? styles.languageActive : undefined} href={`/register?plan=${planId}`} aria-current={language === "de" ? "true" : undefined}>DE</a>
      <span>|</span>
      <a className={language === "en" ? styles.languageActive : undefined} href={`/register?plan=${planId}&lang=en`} aria-current={language === "en" ? "true" : undefined}>EN</a>
    </div>
  );
}


function ComingSoonImage({ size = "medium" }: { size?: "small" | "medium" }) {
  return (
    <Image
      src="/assets/coming-soon-badge.png"
      alt="Coming Soon"
      width={1536}
      height={1024}
      className={`${styles.comingSoonImage} ${styles[`comingSoon-${size}`]}`}
    />
  );
}

function isPreviewPlan(planId: RegisterPlanId) {
  return planId === "growth" || planId === "agency";
}

function showPlanStatusBadge(planId: RegisterPlanId) {
  return !isPreviewPlan(planId);
}


function getPlanSelectionCopy(language: FanMindLanguage): PlanSelectionCopy[] {
  if (language === "en") {
    return [
      {
        label: "1",
        badge: "Active",
        title: "Start Pilot / Setup",
        price: "€990 one-time · test for 1 month · no commitment",
        description: "Setup access for 1 month. No automatic renewal; if you do not continue, the pilot ends.",
        bullets: ["no commitment", "no automatic renewal", "paid setup fee is credited if you continue with Starter"],
        href: registerPlanHref("pilot", language),
        cta: "Start Pilot / Setup",
      },
      {
        label: "2",
        badge: "Active",
        title: "Start Starter",
        price: "Option A: €990 setup + €299 / month",
        description: "Monthly cancellable after setup; no long commitment.",
        bullets: ["setup fee applies", "monthly cancellable", "no long-term commitment"],
        href: registerPlanHref("starter", language),
        cta: "Choose Starter",
      },
      {
        label: "3",
        badge: "Preview",
        title: "Growth",
        price: "Available soon",
        description: "Not directly available yet.",
        bullets: ["Coming Soon / roadmap preview", "not productively bookable yet", "start with Pilot / Setup or Starter for the Produkt"],
        href: registerPlanHref("growth", language),
        cta: "Learn more",
      },
      {
        label: "4",
        badge: "Demo",
        title: "Agency",
        price: "Available soon",
        description: "Intro call; not productively available yet.",
        bullets: ["Coming Soon / roadmap preview", "not productively bookable yet", "scope agency needs first"],
        href: registerPlanHref("agency", language),
        cta: "Learn more",
      },
    ];
  }

  return [
    {
      label: "1",
      badge: "Aktiv",
      title: "Pilot / Setup starten",
      price: "990 € einmalig · 1 Monat testen · keine Bindung",
      description: "Setup-/Testzugang für 1 Monat. Keine automatische Verlängerung; wenn du nicht weitermachst, endet der Pilot.",
      bullets: ["keine Bindung", "keine automatische Verlängerung", "bezahlte Setup-Gebühr wird beim Starter angerechnet"],
      href: registerPlanHref("pilot", language),
      cta: "Pilot / Setup starten",
    },
    {
      label: "2",
      badge: "Aktiv",
      title: "Starter starten",
      price: "Option A: 990 € Einrichtung + 299 €/Monat",
      description: "Monatlich kündbar nach Einrichtung; keine lange Bindung.",
      bullets: ["Setup-/Einrichtungsgebühr fällt an", "monatlich kündbar", "Option B: 299 €/Monat ohne Einrichtung, 12 Monate Bindung"],
      href: registerPlanHref("starter", language),
      cta: "Starter wählen",
    },
    {
      label: "3",
      badge: "Vorschau",
      title: "Growth",
      price: "Bald verfügbar",
      description: "Noch nicht direkt verfügbar.",
      bullets: ["Coming Soon / Roadmap-Vorschau", "noch nicht produktiv buchbar", "für den Produkt mit Pilot / Setup oder Starter starten"],
      href: registerPlanHref("growth", language),
      cta: "Mehr erfahren",
    },
    {
      label: "4",
      badge: "Demo",
      title: "Agency",
      price: "Bald verfügbar",
      description: "Erstgespräch; noch nicht direkt produktiv verfügbar.",
      bullets: ["Coming Soon / Roadmap-Vorschau", "noch nicht produktiv buchbar", "Agenturbedarf zuerst besprechen"],
      href: registerPlanHref("agency", language),
      cta: "Mehr erfahren",
    },
  ];
}

function getStarterOptionsCopy(language: FanMindLanguage): StarterOptionCopy[] {
  if (language === "en") {
    return [
      {
        id: "starter_paid_setup",
        title: "Option A",
        price: "€990 setup + €299 / month",
        description: "Setup fee applies; cancellable monthly.",
        bullets: ["setup/onboarding fee applies", "no long commitment"],
        badge: "Produkt access",
      },
      {
        id: "starter_no_setup_commitment",
        title: "Option B",
        price: "€299 / month",
        description: "No setup fee; 12-month commitment.",
        bullets: ["without setup fee", "12-month commitment"],
        badge: "Alternative",
      },
    ];
  }

  return [
    {
      id: "starter_paid_setup",
      title: "Option A",
      price: "990 € Einrichtung + 299 €/Monat",
      description: "Setup-/Einrichtungsgebühr fällt an; monatlich kündbar.",
      bullets: ["Setup-/Einrichtungsgebühr fällt an", "monatlich kündbar", "keine lange Bindung"],
      badge: "Produkt-Zugang",
    },
    {
      id: "starter_no_setup_commitment",
      title: "Option B",
      price: "299 €/Monat",
      description: "Ohne Einrichtung; 12 Monate Bindung.",
      bullets: ["ohne Einrichtungsgebühr", "12 Monate Bindung"],
      badge: "Alternative",
    },
  ];
}

type WorkspaceRow = {
  id: string;
};

type WorkspaceSetupError = {
  message: string;
};

const EMAIL_CONFIRMATION_WORKSPACE_MESSAGES: Record<FanMindLanguage, string> = {
  de: "Bitte bestätige deine E-Mail-Adresse. Dein Workspace wird danach beim ersten Login eingerichtet.",
  en: "Please confirm your email address. Your workspace will be set up after your first login.",
};

function workspaceSetupError(message: string): WorkspaceSetupError {
  return { message };
}

function invalidWorkspaceTermsMessage(language: FanMindLanguage): string {
  return language === "en"
    ? "The selected package/commercial option is not enabled for productive workspace setup."
    : "Die gewählte Paket-/Commercial-Option ist für produktive Workspace-Erstellung nicht freigegeben.";
}

async function prepareUserWorkspace(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  userId: string,
  email: string,
  displayName: string,
  workspaceName: string,
  planId: Extract<RegisterPlanId, "pilot" | "starter">,
  commercialOption: ProductiveCommercialOption | StarterOfferOptionId,
  language: FanMindLanguage,
): Promise<WorkspaceSetupError | null> {
  const commercialTerms = planId === "starter"
    ? getRegistrationCommercialTerms(planId, commercialOption === "starter_no_setup_commitment" ? "starter_no_setup_commitment" : "starter_paid_setup")
    : getRegistrationCommercialTerms(planId);

  if (!commercialTerms || commercialTerms.commercialOption !== commercialOption) {
    return workspaceSetupError(invalidWorkspaceTermsMessage(language));
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    email,
    display_name: displayName || null,
  });

  if (profileError) {
    return workspaceSetupError(profileError.message);
  }

  const { data: existingWorkspace, error: existingWorkspaceError } = await supabase
    .from("workspaces")
    .select<WorkspaceRow>("id")
    .eq("owner_user_id", userId)
    .limit(1)
    .maybeSingle();

  if (existingWorkspaceError) {
    return workspaceSetupError(existingWorkspaceError.message);
  }

  let workspace = existingWorkspace;

  if (!workspace) {
    const { data: insertedWorkspace, error: workspaceError } = await supabase
      .from("workspaces")
      .insert({
        name: workspaceName || displayName || "FanMind Workspace",
        owner_user_id: userId,
        plan_id: planId,
        commercial_option: commercialTerms.commercialOption,
        setup_fee_cents: commercialTerms.setupFeeCents,
        monthly_fee_cents: commercialTerms.monthlyFeeCents,
        commitment_months: commercialTerms.commitmentMonths,
      })
      .select<WorkspaceRow>("id")
      .single();

    if (workspaceError) {
      return workspaceSetupError(workspaceError.message);
    }

    workspace = insertedWorkspace;
  }

  if (!workspace?.id) {
    return workspaceSetupError(language === "en" ? "Workspace could not be created or loaded." : "Workspace konnte nicht erstellt oder geladen werden.");
  }

  const { data: existingMember, error: existingMemberError } = await supabase
    .from("workspace_members")
    .select<{ id: string }>("id")
    .eq("workspace_id", workspace.id)
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (existingMemberError) {
    return workspaceSetupError(existingMemberError.message);
  }

  if (existingMember) {
    return null;
  }

  const { error: memberError } = await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: userId,
    role: "owner",
  });

  return memberError ? workspaceSetupError(memberError.message) : null;
}

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = use(searchParams);
  const language = getFanMindLanguage(params.lang);
  const rawPlan = firstParamValue(params.plan);
  const hasInvalidPlan = Boolean(rawPlan && !isPlanId(rawPlan));
  const selectedPlanId = resolvePlanId(rawPlan, "starter");
  const isProductiveRegistration = ACTIVE_REGISTER_PLANS.includes(selectedPlanId);
  const copy = fanmindCopy[language].register;
  const loginHref = localizedPath("/login", language);
  const selectedOnboardingHref = selectedPlanId === "pilot" || selectedPlanId === "starter" ? onboardingHref(selectedPlanId, language) : onboardingHref("starter", language);
  const planSelectionCopy = getPlanSelectionCopy(language);
  const starterOptionsCopy = getStarterOptionsCopy(language);
  const [starterOption, setStarterOption] = useState<StarterOfferOptionId>("starter_paid_setup");
  const [success, setSuccess] = useState(false);
  const [awaitingEmailConfirmation, setAwaitingEmailConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const commercialOption = planCommercialOption(selectedPlanId, starterOption);

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
    const selectedCommercialOption: ProductiveCommercialOption | StarterOfferOptionId = selectedPlanId === "starter" && (commercialOptionValue === "starter_paid_setup" || commercialOptionValue === "starter_no_setup_commitment")
      ? commercialOptionValue
      : "pilot_only";

    try {
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
            plan_id: selectedPlanId,
            commercial_option: selectedCommercialOption,
          },
        },
      });

      if (!authError) {
        await syncSupabaseSessionForServer(data.session);
      }

      if (!authError && data.session?.user) {
        const workspaceError = await prepareUserWorkspace(
          supabase,
          data.session.user.id,
          data.session.user.email ?? email,
          name,
          organization,
          selectedPlanId,
          selectedCommercialOption,
          language,
        );

        if (workspaceError) {
          setError(language === "en"
            ? `Registration succeeded, but profile/workspace setup failed: ${workspaceError.message}. Please check the RLS policies from docs/database/fanmind_mvp_schema.sql.`
            : `Registrierung erfolgreich, aber Profil/Workspace konnte noch nicht angelegt werden: ${workspaceError.message}. Bitte prüfe die RLS-Policies aus docs/database/fanmind_mvp_schema.sql.`);
          return;
        }
      }

      if (authError) {
        setError(authError.message);
        return;
      }

      setSuccess(true);
      setAwaitingEmailConfirmation(!data.session);

      if (data.session?.user) {
        router.push(selectedOnboardingHref);
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
          <FanMindLogo className={styles.logo} compact href={language === "en" ? "/landing-v2?lang=en" : "/landing-v2"} ariaLabel={language === "en" ? "Open FanMind landing page" : "FanMind Landingpage öffnen"} />
          <nav className={styles.topLinks} aria-label="Registrierung Navigation">
            <LanguageSwitch language={language} planId={selectedPlanId} />
            <span>{copy.loginPrompt}</span>
            <a href={loginHref}>{copy.loginLink}</a>
          </nav>
        </header>

        <div className={styles.authGrid}>
          <aside className={styles.visualPanel} aria-label={language === "en" ? "Package logic" : "Paketlogik"}>
            <div className={styles.planIntro}>
              <p className={styles.eyebrow}>{language === "en" ? "Setup first" : "Setup zuerst"}</p>
              <h1>{language === "en" ? "Choose your FanMind entry" : "Wähle deinen FanMind-Einstieg"}</h1>
              <p>{language === "en" ? "Starter shows two Produkt entry options: setup fee plus monthly cancellation, or no setup fee with a 12-month commitment." : "Starter zeigt zwei Produkt-Einstiege: Einrichtung plus monatliche Kündbarkeit oder ohne Einrichtung mit 12 Monaten Bindung."}</p>
            </div>

            {hasInvalidPlan && (
              <p className={styles.warning} role="status">
                {language === "en" ? `Unknown package “${rawPlan}”. Starter is shown instead.` : `Unbekanntes Paket „${rawPlan}“. Starter wird stattdessen angezeigt.`}
              </p>
            )}

            <div className={styles.planSelection}>
              {planSelectionCopy.map((plan) => {
                const planId = plan.href.match(/plan=([^&]+)/)?.[1] as RegisterPlanId;
                const isSelected = planId === selectedPlanId;
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
                    {isPreviewPlan(planId) ? <ComingSoonImage size="small" /> : null}
                  </a>
                );
              })}
            </div>
          </aside>

          {isProductiveRegistration ? (
            <form className={styles.formCard} onSubmit={handleRegister}>
              <div className={styles.formHeader}>
                <p className={styles.eyebrow}>{selectedPlanId === "pilot" ? "Pilot / Setup" : "Starter-Abo"}</p>
                <h1>{selectedPlanId === "pilot" ? (language === "en" ? "Start Pilot / Setup" : "Pilot / Setup starten") : (language === "en" ? "Start Starter" : "Starter starten")}</h1>
                <p>{selectedPlanId === "pilot" ? (language === "en" ? "€990 one-time, test for 1 month, no commitment. No automatic renewal; if you do not continue, the pilot ends." : "990 € einmalig · 1 Monat testen · keine Bindung. Keine automatische Verlängerung; wenn du nicht weitermachst, endet der Pilot.") : (language === "en" ? "Pick the Produkt setup access; no payment is collected here." : "Wähle deinen Produkt-Setup-Zugang; hier wird keine Zahlung ausgelöst.")}</p>
              </div>

              {selectedPlanId === "starter" && (
                <fieldset className={styles.commercialOptions}>
                  <legend>{language === "en" ? "Starter package" : "Starter-Paket"}</legend>
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
                          {option.badge && <FeatureStatusLabel variant="active">{option.badge}</FeatureStatusLabel>}
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
                  <input type="password" name="password" placeholder={language === "en" ? "Choose a secure password" : "Wähle ein sicheres Passwort"} autoComplete="new-password" minLength={6} required />
                </div>
              </label>

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

              <label className={styles.field}>
                <span>{copy.message}</span>
                <div className={styles.textareaWrap}>
                  <textarea name="nachricht" placeholder={language === "en" ? "What would you like to improve first with FanMind?" : "Was möchtest du mit FanMind zuerst verbessern?"} rows={2} />
                </div>
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
                    : selectedPlanId === "pilot"
                      ? (language === "en" ? "Pilot / Setup stays a demo/setup month without commitment. You will be forwarded to onboarding." : "Pilot / Setup bleibt ein Demo-/Setupmonat ohne Bindung. Du wirst ins Onboarding weitergeleitet.")
                      : (language === "en" ? "Profile, workspace and Starter option are prepared. You will be forwarded to onboarding." : "Profil, Workspace und Starter-Option werden vorbereitet. Du wirst ins Onboarding weitergeleitet.")} <a href={selectedOnboardingHref}>{language === "en" ? "Open onboarding" : "Onboarding öffnen"}</a>
                </p>
              )}

              <p className={styles.notice}>{language === "en" ? "No payment, checkout or subscription billing is created here. FanMind remains an assistant: replies are prepared, but not sent automatically." : "Hier wird keine Zahlung, kein Checkout und keine Subscription-Abrechnung erstellt. FanMind bleibt ein Assistent: Antworten werden vorbereitet, aber nicht automatisch versendet."}</p>

              <div className={styles.footerLinks}>
                <a href={loginHref}>{copy.loginPrompt} {copy.loginLink}</a>
                <a href={landingPath(language)}>{copy.landing}</a>
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
                <a className={styles.primaryLink} href={registerPlanHref("starter", language)}>{language === "en" ? "Start with Starter" : "Mit Starter starten"}</a>
                <a className={styles.secondaryLink} href="mailto:kontakt@fanmind.de?subject=FanMind%20Demo%20anfragen">{language === "en" ? "Request demo" : "Zugang anfragen"}</a>
              </div>
              {error && <p className={styles.error} role="alert">{error}</p>}
              <p className={styles.notice}>{language === "en" ? "No productive Growth/Agency activation, no payment and no subscription billing are created here." : "Hier wird keine produktive Growth-/Agency-Freischaltung, keine Zahlung und keine Subscription-Abrechnung erstellt."}</p>
              <ComingSoonImage size="medium" />
              <div className={styles.footerLinks}>
                <a href={loginHref}>{copy.loginPrompt} {copy.loginLink}</a>
                <a href={landingPath(language)}>{copy.landing}</a>
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
