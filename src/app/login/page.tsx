"use client";

import { FormEvent, use, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient, syncSupabaseSessionForServer } from "@/lib/supabase/client";
import { fanmindCopy, getFanMindLanguage, landingPath, localizedPath, type FanMindLanguage } from "@/lib/fanmindCopy";
import styles from "./login.module.css";

type LoginPageProps = {
  searchParams: Promise<{ demo?: string | string[]; lang?: string | string[] }>;
};

const LOGIN_TARGET = "/dashboard";
const DEMO_TARGET = "/onboarding?plan=pilot";

function LanguageSwitch({ language }: { language: FanMindLanguage }) {
  return (
    <div className={styles.languageSwitch} aria-label={language === "en" ? "Language selection" : "Sprachauswahl"}>
      <a className={language === "de" ? styles.languageActive : undefined} href="/login" aria-current={language === "de" ? "true" : undefined}>DE</a>
      <span>|</span>
      <a className={language === "en" ? styles.languageActive : undefined} href="/login?lang=en" aria-current={language === "en" ? "true" : undefined}>EN</a>
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

export default function LoginPage({ searchParams }: LoginPageProps) {
  const params = use(searchParams);
  const isDemoMode = Array.isArray(params.demo) ? params.demo.includes("1") : params.demo === "1";
  const language = getFanMindLanguage(params.lang);
  const copy = fanmindCopy[language].login;
  const registerHref = localizedPath("/register", language);
  const loginHref = localizedPath("/login", language);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (!authError) {
        await syncSupabaseSessionForServer(data.session);
      }

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push(LOGIN_TARGET);
      router.refresh();
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Unbekannter Supabase-Fehler.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDemoStart() {
    try {
      await createSupabaseBrowserClient().auth.signOut();
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Demo muss auch ohne gesetzte Supabase-ENV möglich bleiben.
    }

    router.push(DEMO_TARGET);
  }

  return (
    <main className={styles.page}>
      <div className={styles.gridPattern} aria-hidden="true" />
      <section className={styles.shell} aria-label="FanMind Login">
        <header className={styles.header}>
          <FanMindLogo language={language} />
          <nav className={styles.topLinks} aria-label="Login Navigation">
            <LanguageSwitch language={language} />
            <span>{copy.registerPrompt}</span>
            <a href={registerHref}>{copy.registerLink}</a>
          </nav>
        </header>

        <div className={styles.authGrid}>
          <aside className={styles.visualPanel} aria-label="Login Vorteile">
            <div className={styles.orbit} aria-hidden="true">
              <div className={styles.orbitRing} />
              <div className={styles.orbitRingInner} />
              <div className={styles.planetOne} />
              <div className={styles.planetTwo} />
              <div className={styles.planetThree} />
              <div className={styles.lockShield}>▣</div>
            </div>

            <div className={styles.benefitList}>
              <article>
                <span className={styles.pinkIcon}>⚡</span>
                <div>
                  <h2>{language === "en" ? "Fast access" : "Schneller Zugriff"}</h2>
                  <p>{language === "en" ? "Instantly access demo data, contacts and prepared workflows." : "Greife sofort auf Demo-Daten, Kontakte und vorbereitete Workflows zu."}</p>
                </div>
              </article>
              <article>
                <span className={styles.blueIcon}>♙</span>
                <div>
                  <h2>{language === "en" ? "Team & roles" : "Team & Rollen"}</h2>
                  <p>{language === "en" ? "Work transparently with clear responsibilities and manual approval." : "Arbeite nachvollziehbar mit klaren Zuständigkeiten und manueller Freigabe."}</p>
                </div>
              </article>
              <article>
                <span className={styles.greenIcon}>⌁</span>
                <div>
                  <h2>{language === "en" ? "Real control" : "Echte Kontrolle"}</h2>
                  <p>{language === "en" ? "AI prepares replies but never sends automatically." : "KI bereitet Antworten vor, versendet aber nichts automatisch."}</p>
                </div>
              </article>
            </div>
          </aside>

          <form className={styles.formCard} onSubmit={handleLogin}>
            {isDemoMode && (
              <p className={styles.demoBadge} role="status">
                {language === "en" ? "Demo mode active · forwarding to a safe preview" : "Demo-Modus aktiv · Weiterleitung in eine sichere Vorschau"}
              </p>
            )}

            <div className={styles.formHeader}>
              <h1>{copy.title}</h1>
              <p>{copy.subtitle}</p>
            </div>

            <label className={styles.field}>
              <span>{copy.email}</span>
              <div className={styles.inputWrap}>
                <span aria-hidden="true">✉</span>
                <input type="email" name="email" placeholder={language === "en" ? "Your email address" : "Deine E-Mail-Adresse"} autoComplete="email" required />
              </div>
            </label>

            <label className={styles.field}>
              <span>{copy.password}</span>
              <div className={styles.inputWrap}>
                <span aria-hidden="true">▣</span>
                <input type="password" name="password" placeholder={language === "en" ? "Your password" : "Dein Passwort"} autoComplete="current-password" required />
              </div>
            </label>

            <div className={styles.inlineOptions}>
              <label>
                <input type="checkbox" defaultChecked />
                {language === "en" ? "Stay signed in" : "Angemeldet bleiben"}
              </label>
              <a href={loginHref}>{language === "en" ? "Forgot password?" : "Passwort vergessen?"}</a>
            </div>

            <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>
              {isSubmitting ? (language === "en" ? "Signing in…" : "Login läuft…") : copy.submit} <span>→</span>
            </button>

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            <button className={styles.secondaryButton} type="button" onClick={handleDemoStart}>
              {copy.demo}
            </button>

            <p className={styles.notice}>{copy.notice}</p>

            <div className={styles.safetyCard}>
              <span aria-hidden="true">🛡</span>
              <div>
                <strong>{language === "en" ? "Safe MVP scope" : "Sicherer MVP-Rahmen"}</strong>
                <p>{language === "en" ? "Login leitet in das interne Onboarding; der Demo-Flow bleibt ohne Login verfügbar." : "Login leitet in das interne Onboarding; der Demo-Flow bleibt ohne Login verfügbar."}</p>
              </div>
            </div>

            <div className={styles.footerLinks}>
              <a href={registerHref}>{copy.registerPrompt} {copy.registerLink}</a>
              <a href={landingPath(language)}>{copy.landing}</a>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
