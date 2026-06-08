"use client";

import { FormEvent, use, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient, syncSupabaseSessionForServer } from "@/lib/supabase/client";
import { isPlanId, resolvePlanId, type CommercialOption } from "@/lib/plans";
import type { PlanId } from "@/config/plans";
import { fanmindCopy, getFanMindLanguage, landingPath, localizedPath, type FanMindLanguage } from "@/lib/fanmindCopy";
import styles from "./register.module.css";

type RegisterPlanId = PlanId;
type StarterCommercialOption = Extract<CommercialOption, "starter_paid_setup" | "starter_12m_setup_waived">;

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

type StarterOptionCopy = {
  id: StarterCommercialOption;
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

function planCommercialOption(planId: RegisterPlanId, starterOption: StarterCommercialOption): CommercialOption {
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

function FanMindLogo({ language }: { language: FanMindLanguage }) {
  return (
    <a className={styles.logo} href={landingPath(language)} aria-label={language === "en" ? "Open FanMind landing page" : "FanMind Landingpage öffnen"}>
      <svg viewBox="0 0 52 52" aria-hidden="true" className={styles.logoMark}>
        <path d="M25.7 17.2C22.7 7.8 13.5 4.6 9.2 9.7c-4.4 5.1.4 13.1 10.1 12.2-8.8 4.9-8.6 15.4-1.7 17.1 6.8 1.6 10.2-7.4 8.4-16.4 1.8 9 6.8 16.7 13.1 13.7 6.4-3 4.6-13.3-5-16.1 9.7-.3 12.7-9.4 7.1-13.2-5.6-3.9-13.5 1.5-15.5 10.2Z" />
        <circle cx="17.1" cy="17.5" r="3.4" />
        <circle cx="34.9" cy="17.5" r="3.4" />
        <circle cx="25.9" cy="31.5" r="3.4" />
      </svg>
      <span>FanMind</span>
    </a>
  );
}

function getPlanSelectionCopy(language: FanMindLanguage): PlanSelectionCopy[] {
  if (language === "en") {
    return [
      {
        label: "1",
        badge: "Active",
        title: "Start Pilot / Setup",
        price: "€990 one-time",
        description: "Required setup entry with a demo/setup workspace and sample data.",
        bullets: ["no commitment", "cancel after the pilot month", "no running subscription required"],
        href: registerPlanHref("pilot", language),
        cta: "Start Pilot / Setup",
      },
      {
        label: "2",
        badge: "Active",
        title: "Start Starter",
        price: "€299 / month",
        description: "Starter subscription with two commercial setup options.",
        bullets: ["€990 one-time setup fee without 12-month commitment", "or setup fee waived with 12-month commitment", "one productive MVP workspace"],
        href: registerPlanHref("starter", language),
        cta: "Choose Starter",
      },
      {
        label: "3",
        badge: "Preview",
        title: "Growth",
        price: "Preview",
        description: "Not directly available yet.",
        bullets: ["later available after Pilot / Setup", "or with a 12-month commitment model", "start with Starter for the MVP"],
        href: registerPlanHref("growth", language),
        cta: "Open preview",
      },
      {
        label: "4",
        badge: "Demo",
        title: "Agency",
        price: "Request demo",
        description: "Demo/intro call; not productively available yet.",
        bullets: ["later available after Pilot / Setup", "or with a 12-month commitment model", "scope agency needs first"],
        href: registerPlanHref("agency", language),
        cta: "Request demo",
      },
    ];
  }

  return [
    {
      label: "1",
      badge: "Aktiv",
      title: "Pilot / Setup starten",
      price: "990 € einmalig",
      description: "Pflicht-Einstieg mit Demo-/Setup-Workspace und Beispieldaten.",
      bullets: ["keine Bindung", "nach dem Pilotmonat jederzeit beendbar", "kein laufendes Monatsabo nötig"],
      href: registerPlanHref("pilot", language),
      cta: "Pilot / Setup starten",
    },
    {
      label: "2",
      badge: "Aktiv",
      title: "Starter starten",
      price: "299 € / Monat",
      description: "Starter-Abo mit zwei kommerziellen Setup-Optionen.",
      bullets: ["990 € Einrichtungsgebühr ohne 12-Monatsbindung", "oder Einrichtungsgebühr entfällt bei 12 Monaten Bindung", "ein produktiver MVP-Workspace"],
      href: registerPlanHref("starter", language),
      cta: "Starter wählen",
    },
    {
      label: "3",
      badge: "Vorschau",
      title: "Growth",
      price: "Vorschau",
      description: "Noch nicht direkt verfügbar.",
      bullets: ["später nach Pilot / Setup verfügbar", "oder mit 12-Monatsbindung möglich", "für den MVP mit Starter starten"],
      href: registerPlanHref("growth", language),
      cta: "Vorschau öffnen",
    },
    {
      label: "4",
      badge: "Demo",
      title: "Agency",
      price: "Demo anfragen",
      description: "Demo/Erstgespräch; noch nicht direkt produktiv verfügbar.",
      bullets: ["später nach Pilot / Setup verfügbar", "oder mit 12-Monatsbindung möglich", "Agenturbedarf zuerst besprechen"],
      href: registerPlanHref("agency", language),
      cta: "Demo anfragen",
    },
  ];
}

function getStarterOptionsCopy(language: FanMindLanguage): StarterOptionCopy[] {
  if (language === "en") {
    return [
      {
        id: "starter_12m_setup_waived",
        title: "Starter with 12 months",
        price: "€0 setup fee + €299 / month",
        description: "Setup fee waived instead of €990 when you accept a 12-month commitment.",
        bullets: ["12-month commitment", "Starter subscription", "best fit when you want to continue directly after setup"],
        badge: "Recommended",
      },
      {
        id: "starter_paid_setup",
        title: "Starter without commitment",
        price: "€990 setup fee + €299 / month",
        description: "Regular setup fee plus Starter subscription without a 12-month commitment.",
        bullets: ["no 12-month commitment", "one-time setup fee", "monthly Starter subscription afterwards"],
      },
    ];
  }

  return [
    {
      id: "starter_12m_setup_waived",
      title: "Starter mit 12 Monaten",
      price: "0 € Einrichtungsgebühr + 299 € / Monat",
      description: "Die Einrichtungsgebühr entfällt statt 990 €, wenn du 12 Monate Bindung akzeptierst.",
      bullets: ["12 Monate Bindung", "Starter-Abo", "ideal, wenn du direkt nach dem Setup weitermachen willst"],
      badge: "Empfohlen",
    },
    {
      id: "starter_paid_setup",
      title: "Starter ohne Bindung",
      price: "990 € Einrichtungsgebühr + 299 € / Monat",
      description: "Reguläre Einrichtungsgebühr plus Starter-Abo ohne 12-Monatsbindung.",
      bullets: ["keine 12-Monatsbindung", "einmalige Einrichtungsgebühr", "danach monatliches Starter-Abo"],
    },
  ];
}

async function prepareUserWorkspace(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  userId: string,
  email: string,
  displayName: string,
  workspaceName: string,
  planId: Extract<RegisterPlanId, "pilot" | "starter">,
): Promise<string | null> {
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    email,
    display_name: displayName || null,
  });

  if (profileError) {
    return profileError.message;
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .insert({
      name: workspaceName || displayName || "FanMind Workspace",
      owner_user_id: userId,
      plan_id: planId,
    })
    .select("id")
    .single();

  if (workspaceError) {
    return workspaceError.message;
  }

  if (!workspace?.id) {
    return "Workspace wurde erstellt, aber keine Workspace-ID zurückgegeben.";
  }

  const { error: memberError } = await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: userId,
    role: "owner",
  });

  return memberError?.message ?? null;
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
  const [starterOption, setStarterOption] = useState<StarterCommercialOption>("starter_12m_setup_waived");
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
    const selectedCommercialOption = selectedPlanId === "starter" ? String(formData.get("commercialOption") ?? starterOption) as StarterCommercialOption : "pilot_only";

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
        );

        if (workspaceError) {
          setError(`Registrierung erfolgreich, aber Workspace/Plan konnte noch nicht angelegt werden: ${workspaceError}. Bitte prüfe die RLS-Policies aus docs/database/fanmind_mvp_schema.sql.`);
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
          <FanMindLogo language={language} />
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
              <p>{language === "en" ? "Every customer starts with Pilot / Setup or uses a Starter option where the setup fee is waived for a 12-month commitment." : "Jeder Kunde startet grundsätzlich mit Pilot / Setup oder nutzt beim Starter die Option, bei der die Einrichtungsgebühr für 12 Monate Bindung entfällt."}</p>
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
                  <a key={plan.title} className={`${styles.planCard} ${isSelected ? styles.planCardSelected : ""}`} href={plan.href} aria-current={isSelected ? "page" : undefined}>
                    <div className={styles.planCardHeader}>
                      <span className={styles.planNumber}>{plan.label}</span>
                      <span className={styles.planBadge}>{plan.badge}</span>
                    </div>
                    <h2>{plan.title}</h2>
                    <strong>{plan.price}</strong>
                    <p>{plan.description}</p>
                    <ul>
                      {plan.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                    </ul>
                    <span className={styles.planCta}>{plan.cta} →</span>
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
                <p>{selectedPlanId === "pilot" ? (language === "en" ? "€990 one-time, no commitment, cancel after the pilot month. You start in a demo/setup workspace with sample data." : "990 € einmalig, keine Bindung, nach dem Pilotmonat jederzeit beendbar. Du startest im Demo-/Setup-Workspace mit Beispieldaten.") : (language === "en" ? "Choose whether you pay the one-time setup fee or waive it with a 12-month commitment. No payment is collected here." : "Wähle, ob du die Einrichtungsgebühr zahlst oder sie mit 12 Monaten Bindung entfällt. Hier wird keine Zahlung ausgelöst.")}</p>
              </div>

              {selectedPlanId === "starter" && (
                <fieldset className={styles.commercialOptions}>
                  <legend>{language === "en" ? "Commercial Starter option" : "Kommerzielle Starter-Option"}</legend>
                  {starterOptionsCopy.map((option) => (
                    <label key={option.id} className={`${styles.optionCard} ${starterOption === option.id ? styles.optionCardSelected : ""}`}>
                      <input
                        type="radio"
                        name="commercialOption"
                        value={option.id}
                        checked={starterOption === option.id}
                        onChange={() => setStarterOption(option.id)}
                      />
                      <span>
                        <span className={styles.optionTitleRow}>
                          <strong>{option.title}</strong>
                          {option.badge && <em>{option.badge}</em>}
                        </span>
                        <b>{option.price}</b>
                        <small>{option.description}</small>
                        <ul>
                          {option.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                        </ul>
                      </span>
                    </label>
                  ))}
                </fieldset>
              )}

              <input type="hidden" name="commercialOption" value={commercialOption} />

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
                    ? (language === "en" ? "Please confirm your email address and log in afterwards." : "Bitte bestätige deine E-Mail-Adresse und logge dich danach ein.")
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
            <section className={styles.previewCard} aria-label={selectedPlanId === "growth" ? "Growth Vorschau" : "Agency Demo"}>
              <p className={styles.eyebrow}>{selectedPlanId === "growth" ? (language === "en" ? "Growth preview" : "Growth Vorschau") : (language === "en" ? "Agency demo" : "Agency Demo/Erstgespräch")}</p>
              <h1>{selectedPlanId === "growth" ? "Growth" : "Agency"}</h1>
              <p>{selectedPlanId === "growth" ? (language === "en" ? "Growth is visible for planning, but it is not directly available as a productive registration in the MVP start." : "Growth ist für die Planung sichtbar, aber zum MVP-Start noch nicht direkt produktiv registrierbar.") : (language === "en" ? "Agency starts with a demo/intro call. It is not directly available as a productive registration in the MVP start." : "Agency startet mit Demo/Erstgespräch. Zum MVP-Start ist es noch nicht direkt produktiv registrierbar.")}</p>
              <div className={styles.previewNotice}>
                {language === "en" ? "Later available after Pilot / Setup or with a 12-month commitment model. Pilot remains the required setup entry unless the setup fee is waived through the commitment model." : "Später verfügbar nach Pilot / Setup oder mit 12-Monatsbindung. Pilot bleibt der Pflicht-Einstieg, sofern die Einrichtungsgebühr nicht über das Bindungsmodell entfällt."}
              </div>
              <div className={styles.previewActions}>
                <a className={styles.primaryLink} href={registerPlanHref("starter", language)}>{language === "en" ? "Start with Starter" : "Mit Starter starten"}</a>
                <a className={styles.secondaryLink} href="mailto:kontakt@fanmind.de?subject=FanMind%20Demo%20anfragen">{language === "en" ? "Request demo" : "Demo anfragen"}</a>
              </div>
              {error && <p className={styles.error} role="alert">{error}</p>}
              <p className={styles.notice}>{language === "en" ? "No productive Growth/Agency activation, no payment and no subscription billing are created here." : "Hier wird keine produktive Growth-/Agency-Freischaltung, keine Zahlung und keine Subscription-Abrechnung erstellt."}</p>
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
