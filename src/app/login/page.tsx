"use client";

import { FormEvent, use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient, syncSupabaseSessionForServer } from "@/lib/supabase/client";
import { FanMindLogo } from "@/components/FanMindLogo";
import { fanmindCopy, getFanMindLanguage, landingPath, localizedPath, type FanMindLanguage } from "@/lib/fanmindCopy";
import styles from "./login.module.css";

type LoginPageProps = {
  searchParams: Promise<{ demo?: string | string[]; lang?: string | string[] }>;
};

const LOGIN_TARGET = "/dashboard";
const DEMO_EMAIL = "sandra.m@fanmind.ch";
// Stage 1 uses a public demo login; Stage 2 replaces this with temporary demo workspaces.
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_FANMIND_DEMO_PASSWORD ?? "FanMind-Demo-2026!";

function LanguageSwitch({ language }: { language: FanMindLanguage }) {
  return (
    <div className={styles.languageSwitch} aria-label={language === "en" ? "Language selection" : "Sprachauswahl"}>
      <a className={language === "de" ? styles.languageActive : undefined} href="/login" aria-current={language === "de" ? "true" : undefined}>DE</a>
      <span>|</span>
      <a className={language === "en" ? styles.languageActive : undefined} href="/login?lang=en" aria-current={language === "en" ? "true" : undefined}>EN</a>
    </div>
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
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const invalidCredentialsMessage =
    language === "en"
      ? "Login failed. Please check your email, password, and whether your browser inserted old saved credentials. Delete saved credentials for fanmind.ch or type your email and password manually once."
      : "Login nicht möglich. Bitte prüfe E-Mail, Passwort und ob dein Browser alte gespeicherte Zugangsdaten eingefügt hat. Lösche gespeicherte Zugangsdaten für fanmind.ch oder tippe E-Mail und Passwort einmal manuell ein.";

  function normalizeLoginError(message: string) {
    return message.toLowerCase().includes("invalid login credentials") ? invalidCredentialsMessage : message;
  }

  useEffect(() => {
    if (!isDemoMode) return;

    setError(null);

    if (emailInputRef.current) {
      emailInputRef.current.value = DEMO_EMAIL;
    }

    if (passwordInputRef.current) {
      passwordInputRef.current.value = DEMO_PASSWORD;
    }
  }, [isDemoMode]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const formEmail = String(formData.get("email") ?? "");
    const formPassword = String(formData.get("password") ?? "");
    const currentEmailValue = emailInputRef.current?.value;
    const currentPasswordValue = passwordInputRef.current?.value;
    const email = isDemoMode ? DEMO_EMAIL : (currentEmailValue || formEmail).trim();
    const password = isDemoMode ? DEMO_PASSWORD : currentPasswordValue ?? formPassword;

    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError(normalizeLoginError(authError.message));
        return;
      }

      if (!data.session?.access_token) {
        setError(language === "en" ? "Login failed: no valid session was returned. Please try again." : "Login fehlgeschlagen: Es wurde keine gültige Sitzung zurückgegeben. Bitte versuche es erneut.");
        return;
      }

      await syncSupabaseSessionForServer(data.session);
      window.location.assign(LOGIN_TARGET);
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : language === "en" ? "Unknown Supabase error." : "Unbekannter Supabase-Fehler.";
      setError(normalizeLoginError(message));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.gridPattern} aria-hidden="true" />
      <section className={styles.shell} aria-label="FanMind Login">
        <header className={styles.header}>
          <FanMindLogo className={styles.logo} compact href={language === "en" ? "/landing-v2?lang=en" : "/landing-v2"} ariaLabel={language === "en" ? "Open FanMind landing page" : "FanMind Landingpage öffnen"} />
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
                  <p>{language === "en" ? "Open your workspace with contacts, connected Messenger inbox and prepared workflows." : "Öffne deinen Workspace mit Kontakten, verbundener Messenger-Inbox und vorbereiteten Workflows."}</p>
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
                {language === "en" ? "Public demo access. Please do not enter real data. Other demo users can see demo content. Real account connections are disabled in demo mode." : "Öffentlicher Demo-Zugang. Bitte keine echten Daten eingeben. Andere Demo-Nutzer können Demo-Inhalte sehen. Echte Account-Verbindungen sind im Demo-Modus deaktiviert."}
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
                <input ref={emailInputRef} type="email" name="email" placeholder={language === "en" ? "Your email address" : "Deine E-Mail-Adresse"} defaultValue={isDemoMode ? DEMO_EMAIL : ""} autoComplete={isDemoMode ? "off" : "username"} inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} readOnly={isDemoMode} required />
              </div>
            </label>

            <label className={styles.field}>
              <span>{copy.password}</span>
              <div className={styles.inputWrap}>
                <span aria-hidden="true">▣</span>
                <input ref={passwordInputRef} type="password" name="password" placeholder={language === "en" ? "Your password" : "Dein Passwort"} defaultValue={isDemoMode ? DEMO_PASSWORD : ""} autoComplete={isDemoMode ? "off" : "current-password"} readOnly={isDemoMode} required />
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
            <button className={styles.secondaryButton} type="button" onClick={() => router.push(localizedPath("/login", language, "?demo=1"))}>
              {language === "en" ? "Try for free" : "Kostenlos testen"}
            </button>

            <p className={styles.notice}>{copy.notice}</p>

            <div className={styles.safetyCard}>
              <span aria-hidden="true">🛡</span>
              <div>
                <strong>{language === "en" ? "Secure manual workflow" : "Sicherer manueller Workflow"}</strong>
                <p>{language === "en" ? "FanMind is a multi-channel CRM and copy-&-open assistant. Facebook Messenger can be connected; replies are reviewed manually and sent externally." : "FanMind ist ein Multi-Channel CRM und Copy-&-Open-Assistent. Facebook Messenger kann angebunden werden; Antworten werden manuell geprüft und extern gesendet."}</p>
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
