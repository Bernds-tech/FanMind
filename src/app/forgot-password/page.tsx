"use client";

import { FormEvent, use, useState } from "react";
import { FanMindLogo } from "@/components/FanMindLogo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { fanmindCopy, getFanMindLanguage, landingPath, localizedPath } from "@/lib/fanmindCopy";
import styles from "../login/login.module.css";

type ForgotPasswordPageProps = {
  searchParams: Promise<{ lang?: string | string[] }>;
};

function getPasswordResetRedirectTo(language: ReturnType<typeof getFanMindLanguage>) {
  const resetPasswordPath = localizedPath("/reset-password", language);
  const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const origin = isLocalhost ? window.location.origin : "https://fanmind.ch";

  // Supabase muss diese Redirect-URL unter Authentication → URL Configuration erlauben:
  // https://fanmind.ch/reset-password (optional zusätzlich https://fanmind.ch/reset-password?lang=en)
  return `${origin}${resetPasswordPath}`;
}

export default function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = use(searchParams);
  const language = getFanMindLanguage(params.lang);
  const copy = fanmindCopy[language].login;
  const loginHref = localizedPath("/login", language);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const redirectTo = getPasswordResetRedirectTo(language);
      const supabase = createSupabaseBrowserClient();
      const { error: recoveryError } = await supabase.auth.resetPasswordForEmail({ email: email.trim(), options: { redirectTo } });

      if (recoveryError) {
        setError(language === "en" ? "The reset link could not be sent right now. Please try again later." : "Der Link konnte gerade nicht gesendet werden. Bitte versuche es später erneut.");
        return;
      }

      setSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.gridPattern} aria-hidden="true" />
      <section className={styles.shell} aria-label={language === "en" ? "Reset password" : "Passwort zurücksetzen"}>
        <header className={styles.header}>
          <FanMindLogo className={styles.logo} compact href={landingPath(language)} ariaLabel={language === "en" ? "Open FanMind landing page" : "FanMind Landingpage öffnen"} />
          <nav className={styles.topLinks} aria-label="Login Navigation">
            <span>{copy.registerPrompt}</span>
            <a href={localizedPath("/register", language)}>{copy.registerLink}</a>
          </nav>
        </header>

        <div className={styles.authGrid}>
          <aside className={styles.visualPanel} aria-label={language === "en" ? "Security note" : "Sicherheitshinweis"}>
            <div className={styles.orbit} aria-hidden="true"><div className={styles.orbitRing} /><div className={styles.orbitRingInner} /><div className={styles.planetOne} /><div className={styles.planetTwo} /><div className={styles.planetThree} /><div className={styles.lockShield}>▣</div></div>
          </aside>

          <form className={styles.formCard} onSubmit={handleSubmit}>
            <div className={styles.formHeader}>
              <h1>{language === "en" ? "Reset password" : "Passwort zurücksetzen"}</h1>
              <p>{language === "en" ? "Enter your email address. We will send you a secure link to reset your password." : "Gib deine E-Mail-Adresse ein. Wir senden dir einen sicheren Link zum Zurücksetzen deines Passworts."}</p>
            </div>
            <label className={styles.field}>
              <span>{copy.email}</span>
              <div className={styles.inputWrap}><span aria-hidden="true">✉</span><input type="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={language === "en" ? "Your email address" : "Deine E-Mail-Adresse"} autoComplete="email" required /></div>
            </label>
            <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>{isSubmitting ? (language === "en" ? "Sending…" : "Link wird gesendet…") : (language === "en" ? "Send link" : "Link senden")} <span>→</span></button>
            {success && <p className={styles.success} role="status">{language === "en" ? "If an account with this email exists, a reset link has been sent." : "Falls ein Konto mit dieser E-Mail existiert, wurde ein Link zum Zurücksetzen gesendet."}</p>}
            {error && <p className={styles.error} role="alert">{error}</p>}
            <div className={styles.footerLinks}><a href={loginHref}>{language === "en" ? "Back to login" : "Zurück zum Login"}</a></div>
          </form>
        </div>
      </section>
    </main>
  );
}
