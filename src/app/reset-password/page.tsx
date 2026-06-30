"use client";

import { FormEvent, use, useEffect, useMemo, useState } from "react";
import { FanMindLogo } from "@/components/FanMindLogo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { fanmindCopy, getFanMindLanguage, landingPath, localizedPath } from "@/lib/fanmindCopy";
import styles from "../login/login.module.css";

type ResetPasswordPageProps = { searchParams: Promise<{ lang?: string | string[] }> };

function readRecoverySessionFromUrl() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  const accessToken = params.get("access_token") ?? query.get("access_token");
  if (!accessToken) return null;
  return {
    access_token: accessToken,
    refresh_token: params.get("refresh_token") ?? query.get("refresh_token") ?? undefined,
    expires_in: Number(params.get("expires_in") ?? query.get("expires_in") ?? undefined) || undefined,
    expires_at: Number(params.get("expires_at") ?? query.get("expires_at") ?? undefined) || undefined,
  };
}

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = use(searchParams);
  const language = getFanMindLanguage(params.lang);
  const copy = fanmindCopy[language].login;
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [isValidRecoverySession, setIsValidRecoverySession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRepeat, setShowPasswordRepeat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function prepareRecoverySession() {
      const session = readRecoverySessionFromUrl();
      if (!session) {
        await Promise.resolve();
        if (!isMounted) return;
        setIsValidRecoverySession(false);
        setIsCheckingSession(false);
        return;
      }

      const { error: sessionError } = await supabase.auth.setSession(session);
      if (!isMounted) return;
      setIsValidRecoverySession(!sessionError);
      setIsCheckingSession(false);
      if (!sessionError) window.history.replaceState(null, "", localizedPath("/reset-password", language));
    }

    void prepareRecoverySession();

    return () => {
      isMounted = false;
    };
  }, [language, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(language === "en" ? "Your new password must be at least 8 characters long." : "Dein neues Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }
    if (password !== passwordRepeat) {
      setError(language === "en" ? "Both passwords must match." : "Beide Passwörter müssen übereinstimmen.");
      return;
    }

    setIsSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (updateError) {
      setError(language === "en" ? "The link is invalid or expired. Please request a new link." : "Der Link ist ungültig oder abgelaufen. Bitte fordere einen neuen Link an.");
      setIsValidRecoverySession(false);
      return;
    }

    setSuccess(true);
  }

  const invalidLink = !isCheckingSession && !isValidRecoverySession && !success;

  return (
    <main className={styles.page}>
      <div className={styles.gridPattern} aria-hidden="true" />
      <section className={styles.shell} aria-label={language === "en" ? "Set new password" : "Neues Passwort setzen"}>
        <header className={styles.header}>
          <FanMindLogo className={styles.logo} compact href={landingPath(language)} ariaLabel={language === "en" ? "Open FanMind landing page" : "FanMind Landingpage öffnen"} />
          <nav className={styles.topLinks} aria-label="Login Navigation"><a href={localizedPath("/login", language)}>{copy.submit}</a></nav>
        </header>
        <div className={styles.authGrid}>
          <aside className={styles.visualPanel} aria-label={language === "en" ? "Security note" : "Sicherheitshinweis"}><div className={styles.orbit} aria-hidden="true"><div className={styles.orbitRing} /><div className={styles.orbitRingInner} /><div className={styles.planetOne} /><div className={styles.planetTwo} /><div className={styles.planetThree} /><div className={styles.lockShield}>▣</div></div></aside>
          <form className={styles.formCard} onSubmit={handleSubmit}>
            <div className={styles.formHeader}><h1>{language === "en" ? "Set new password" : "Neues Passwort setzen"}</h1><p>{language === "en" ? "Choose a new secure password for your FanMind account." : "Wähle ein neues sicheres Passwort für dein FanMind-Konto."}</p></div>
            {invalidLink ? <p className={styles.error} role="alert">{language === "en" ? "The link is invalid or expired. Please request a new link." : "Der Link ist ungültig oder abgelaufen. Bitte fordere einen neuen Link an."} <a href={localizedPath("/forgot-password", language)}>{language === "en" ? "Request new link" : "Neuen Link anfordern"}</a></p> : null}
            {isValidRecoverySession && !success ? <>
              <label className={styles.field}><span>{language === "en" ? "New password" : "Neues Passwort"}</span><div className={styles.inputWrap}><span aria-hidden="true">▣</span><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required /><button className={styles.passwordToggle} type="button" aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"} onClick={() => setShowPassword((current) => !current)}>{showPassword ? "◉" : "◌"}</button></div></label>
              <label className={styles.field}><span>{language === "en" ? "Repeat password" : "Passwort wiederholen"}</span><div className={styles.inputWrap}><span aria-hidden="true">▣</span><input type={showPasswordRepeat ? "text" : "password"} value={passwordRepeat} onChange={(event) => setPasswordRepeat(event.target.value)} autoComplete="new-password" minLength={8} required /><button className={styles.passwordToggle} type="button" aria-label={showPasswordRepeat ? "Passwort verbergen" : "Passwort anzeigen"} onClick={() => setShowPasswordRepeat((current) => !current)}>{showPasswordRepeat ? "◉" : "◌"}</button></div></label>
              <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>{isSubmitting ? (language === "en" ? "Saving…" : "Passwort wird gespeichert…") : (language === "en" ? "Save password" : "Passwort speichern")} <span>→</span></button>
            </> : null}
            {success && <p className={styles.success} role="status">{language === "en" ? "Your password has been changed. Please sign in again." : "Dein Passwort wurde geändert. Bitte melde dich erneut an."} <a href={localizedPath("/login", language)}>{language === "en" ? "Go to login" : "Zum Login"}</a></p>}
            {error && isValidRecoverySession && <p className={styles.error} role="alert">{error}</p>}
          </form>
        </div>
      </section>
    </main>
  );
}
