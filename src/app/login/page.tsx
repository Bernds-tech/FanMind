"use client";

import { FormEvent, use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient, syncSupabaseSessionForServer } from "@/lib/supabase/client";
import { FanMindLogo } from "@/components/FanMindLogo";
import { fanmindCopy, getFanMindLanguage, landingPath, localizedPath, type FanMindLanguage } from "@/lib/fanmindCopy";
import styles from "./login.module.css";

type LoginPageProps = {
  searchParams: Promise<{ demo?: string | string[]; lang?: string | string[]; demo_deleted?: string | string[]; returnTo?: string | string[] }>;
};

const LOGIN_TARGET = "/dashboard";
const DEMO_EMAIL = "sandra.m@fanmind.ch";
// Stage 1 uses a public demo login; Stage 2 replaces this with temporary demo workspaces.
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_FANMIND_DEMO_PASSWORD ?? "FanMind-Demo-2026!";

function getSafeReturnTo(returnTo?: string | string[] | null) {
  const value = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) || /[\r\n]/.test(value)) return null;

  try {
    const parsed = new URL(value, "https://fanmind.ch");
    return parsed.origin === "https://fanmind.ch" ? `${parsed.pathname}${parsed.search}${parsed.hash}` : null;
  } catch {
    return null;
  }
}

function withReturnTo(path: string, returnTo: string | null) {
  if (!returnTo) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}returnTo=${encodeURIComponent(returnTo)}`;
}

function LanguageSwitch({ language, returnTo }: { language: FanMindLanguage; returnTo: string | null }) {
  return (
    <div className={styles.languageSwitch} aria-label={language === "en" ? "Language selection" : "Sprachauswahl"}>
      <a className={language === "de" ? styles.languageActive : undefined} href={withReturnTo("/login", returnTo)} aria-current={language === "de" ? "true" : undefined}>DE</a>
      <span>|</span>
      <a className={language === "en" ? styles.languageActive : undefined} href={withReturnTo("/login?lang=en", returnTo)} aria-current={language === "en" ? "true" : undefined}>EN</a>
    </div>
  );
}


export default function LoginPage({ searchParams }: LoginPageProps) {
  const params = use(searchParams);
  const isDemoMode = Array.isArray(params.demo) ? params.demo.includes("1") : params.demo === "1";
  const isDemoDeleted = Array.isArray(params.demo_deleted) ? params.demo_deleted.includes("1") : params.demo_deleted === "1";
  const language = getFanMindLanguage(params.lang);
  const returnTo = getSafeReturnTo(params.returnTo);
  const loginTarget = returnTo ?? LOGIN_TARGET;
  const copy = fanmindCopy[language].login;
  const registerHref = localizedPath("/register", language);
  const forgotPasswordHref = localizedPath("/forgot-password", language);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

    if (emailInputRef.current) {
      emailInputRef.current.value = DEMO_EMAIL;
    }

    if (passwordInputRef.current) {
      passwordInputRef.current.value = DEMO_PASSWORD;
    }
  }, [isDemoMode]);

  async function handleDemoStart() {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/demo/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: language }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string; redirectTo?: string } | null;
      if (!response.ok) {
        setError(`${payload?.error ?? "Die Demo konnte gerade nicht vorbereitet werden."} Du kannst den Sandra-Demo-Fallback über /login?demo=1 nutzen.`);
        return;
      }
      window.location.assign(payload?.redirectTo ?? loginTarget);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Die Demo konnte gerade nicht vorbereitet werden. Bitte nutze /login?demo=1 als Fallback.");
    } finally {
      setIsSubmitting(false);
    }
  }

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
      document.cookie = `fanmind_locale=${language}; path=/; max-age=31536000; samesite=lax`;
      const target = language === "en" && !loginTarget.includes("lang=") ? `${loginTarget}${loginTarget.includes("?") ? "&" : "?"}lang=en` : loginTarget;
      window.location.assign(target);
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
            <LanguageSwitch language={language} returnTo={returnTo} />
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
            {isDemoDeleted && (
              <p className={styles.demoBadge} role="status">
                {"Deine Demo-Zeit ist abgelaufen. Der temporäre Demo-Zugang wurde gelöscht. Bitte starte eine neue Demo oder registriere einen eigenen Workspace."}
              </p>
            )}

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
                <input ref={passwordInputRef} type={showPassword ? "text" : "password"} name="password" placeholder={language === "en" ? "Your password" : "Dein Passwort"} defaultValue={isDemoMode ? DEMO_PASSWORD : ""} autoComplete={isDemoMode ? "off" : "current-password"} readOnly={isDemoMode} required />
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

            <div className={styles.inlineOptions}>
              <label>
                <input type="checkbox" defaultChecked />
                {language === "en" ? "Stay signed in" : "Angemeldet bleiben"}
              </label>
              <a href={forgotPasswordHref}>{language === "en" ? "Forgot password?" : "Passwort vergessen?"}</a>
            </div>

            <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>
              {isSubmitting ? (language === "en" ? "Signing in…" : "Login läuft…") : copy.submit} <span>→</span>
            </button>

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            <button className={styles.secondaryButton} type="button" onClick={handleDemoStart} disabled={isSubmitting}>
              {isSubmitting ? (language === "en" ? "Preparing demo…" : "Demo wird vorbereitet…") : (language === "en" ? "Try for free" : "Kostenlos testen")}
            </button>
            {error && (
              <p className={styles.notice}>
                <button className={styles.secondaryButton} type="button" onClick={() => router.push(withReturnTo(localizedPath("/login", language, "?demo=1"), returnTo))}>Sandra-Demo-Fallback öffnen</button>
              </p>
            )}

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
