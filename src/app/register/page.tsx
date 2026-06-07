"use client";

import { FormEvent, use, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { resolvePlanId } from "@/lib/plans";
import { fanmindCopy, getFanMindLanguage, landingPath, localizedPath, type FanMindLanguage } from "@/lib/fanmindCopy";
import styles from "./register.module.css";

function LanguageSwitch({ language }: { language: FanMindLanguage }) {
  return (
    <div className={styles.languageSwitch} aria-label={language === "en" ? "Language selection" : "Sprachauswahl"}>
      <a className={language === "de" ? styles.languageActive : undefined} href="/register" aria-current={language === "de" ? "true" : undefined}>DE</a>
      <span>|</span>
      <a className={language === "en" ? styles.languageActive : undefined} href="/register?lang=en" aria-current={language === "en" ? "true" : undefined}>EN</a>
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

type RegisterPageProps = {
  searchParams: Promise<{ lang?: string | string[]; plan?: string | string[] }>;
};

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = use(searchParams);
  const language = getFanMindLanguage(params.lang);
  const selectedPlanId = resolvePlanId(params.plan, "pilot");
  const copy = fanmindCopy[language].register;
  const loginHref = localizedPath("/login", language);
  const onboardingHref = language === "en" ? `/onboarding?plan=${selectedPlanId}&lang=en` : `/onboarding?plan=${selectedPlanId}`;
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess(false);
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const organization = String(formData.get("organisation") ?? "").trim();
    const role = String(formData.get("rolle") ?? "").trim();
    const message = String(formData.get("nachricht") ?? "").trim();
    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name || undefined,
          organization: organization || undefined,
          role: role || undefined,
          message: message || undefined,
        },
      },
    });

    setIsSubmitting(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setSuccess(true);
  }

  return (
    <main className={styles.page}>
      <div className={styles.gridPattern} aria-hidden="true" />
      <section className={styles.shell} aria-label={language === "en" ? "FanMind access" : "FanMind Zugang"}>
        <header className={styles.header}>
          <FanMindLogo language={language} />
          <nav className={styles.topLinks} aria-label="Registrierung Navigation">
            <LanguageSwitch language={language} />
            <span>{copy.loginPrompt}</span>
            <a href={loginHref}>{copy.loginLink}</a>
          </nav>
        </header>

        <div className={styles.authGrid}>
          <aside className={styles.visualPanel} aria-label="Zugangsvorteile">
            <div className={styles.orbit} aria-hidden="true">
              <div className={styles.orbitRing} />
              <div className={styles.orbitRingInner} />
              <div className={styles.planetOne} />
              <div className={styles.planetTwo} />
              <div className={styles.planetThree} />
              <div className={styles.profileIcon}>♙</div>
            </div>

            <div className={styles.benefitList}>
              <article>
                <span className={styles.pinkIcon}>🚀</span>
                <div>
                  <h2>{language === "en" ? "Reserve for free" : "Kostenlos vormerken"}</h2>
                  <p>{language === "en" ? "Request access without obligation for your creator, club or event use case." : "Frage Zugang unverbindlich für deinen Creator-, Club- oder Event-Use-Case an."}</p>
                </div>
              </article>
              <article>
                <span className={styles.blueIcon}>🧠</span>
                <div>
                  <h2>{language === "en" ? "Use AI power" : "KI-Power nutzen"}</h2>
                  <p>{language === "en" ? "Get prepared response drafts without claiming real automatic sending." : "Erhalte vorbereitete Antwortentwürfe, ohne echten automatischen Versand zu behaupten."}</p>
                </div>
              </article>
              <article>
                <span className={styles.greenIcon}>⌁</span>
                <div>
                  <h2>{language === "en" ? "Plan growth" : "Wachstum planen"}</h2>
                  <p>{language === "en" ? "Describe your audience, role and workspace needs for a clear MVP assessment." : "Beschreibe Zielgruppe, Rolle und Workspace-Bedarf für eine klare MVP-Einordnung."}</p>
                </div>
              </article>
            </div>
          </aside>

          <form className={styles.formCard} onSubmit={handleRegister}>
            <div className={styles.formHeader}>
              <p className={styles.eyebrow}>{copy.title}</p>
              <h1>{copy.title}</h1>
              <p>{copy.subtitle}</p>
            </div>

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
                <textarea name="nachricht" placeholder={language === "en" ? "What would you like to improve first with FanMind?" : "Was möchtest du mit FanMind zuerst verbessern?"} rows={4} />
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
                {copy.success} {language === "en" ? "You can now continue to the internal onboarding flow if no email confirmation is required." : "Du kannst nun in den internen Onboarding-Flow wechseln, sofern keine E-Mail-Bestätigung erforderlich ist."} <a href={onboardingHref}>{language === "en" ? "Open onboarding" : "Onboarding öffnen"}</a>
              </p>
            )}

            <p className={styles.notice}>{language === "en" ? "FanMind remains an assistant. Replies are prepared, but not sent automatically." : "FanMind bleibt ein Assistent. Antworten werden vorbereitet, aber nicht automatisch versendet."}</p>

            <div className={styles.footerLinks}>
              <a href={loginHref}>{copy.loginPrompt} {copy.loginLink}</a>
              <a href={landingPath(language)}>{copy.landing}</a>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
