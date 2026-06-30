"use client";

import { FormEvent, use, useEffect, useMemo, useState } from "react";
import { FanMindLogo } from "@/components/FanMindLogo";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { fanmindCopy, getFanMindLanguage, landingPath, localizedPath } from "@/lib/fanmindCopy";
import styles from "../login/login.module.css";

type ResetPasswordPageProps = { searchParams: Promise<{ lang?: string | string[] }> };

function readRecoverySessionFromUrl() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const queryParams = new URLSearchParams(window.location.search);
  const error = hashParams.get("error") ?? queryParams.get("error");
  const errorCode = hashParams.get("error_code") ?? queryParams.get("error_code");
  const errorDescription = hashParams.get("error_description") ?? queryParams.get("error_description");

  if (error || errorCode || errorDescription) {
    return { session: null, hasRecoveryError: true };
  }

  const accessToken = hashParams.get("access_token") ?? queryParams.get("access_token");
  if (!accessToken) return { session: null, hasRecoveryError: false };

  return {
    session: {
      access_token: accessToken,
      refresh_token: hashParams.get("refresh_token") ?? queryParams.get("refresh_token") ?? undefined,
      expires_in: Number(hashParams.get("expires_in") ?? queryParams.get("expires_in") ?? undefined) || undefined,
      expires_at: Number(hashParams.get("expires_at") ?? queryParams.get("expires_at") ?? undefined) || undefined,
    },
    hasRecoveryError: false,
  };
}

function getPasswordUpdateErrorMessage(updateError: Error, language: "de" | "en") {
  const normalizedMessage = updateError.message.toLowerCase();

  if (normalizedMessage.includes("same") || normalizedMessage.includes("different") || normalizedMessage.includes("old password") || normalizedMessage.includes("new password should be different")) {
    return language === "en" ? "Please choose a different password than your current password." : "Bitte wähle ein anderes Passwort als dein bisheriges Passwort.";
  }

  if (normalizedMessage.includes("weak") || normalizedMessage.includes("short") || normalizedMessage.includes("password") && normalizedMessage.includes("characters")) {
    return language === "en" ? "Your new password is too weak or too short." : "Dein neues Passwort ist zu schwach oder zu kurz.";
  }

  if (normalizedMessage.includes("token") || normalizedMessage.includes("jwt") || normalizedMessage.includes("expired") || normalizedMessage.includes("invalid") || normalizedMessage.includes("unauthorized") || normalizedMessage.includes("session")) {
    return language === "en" ? "The link is invalid or expired. Please request a new link." : "Der Link ist ungültig oder abgelaufen. Bitte fordere einen neuen Link an.";
  }

  return language === "en" ? "The password could not be saved right now. Please try again." : "Das Passwort konnte gerade nicht gespeichert werden. Bitte versuche es erneut.";
}

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = use(searchParams);
  const language = getFanMindLanguage(params.lang);
  const copy = fanmindCopy[language].login;
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [recoveryAccessToken, setRecoveryAccessToken] = useState<string | null>(null);
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
      const { session, hasRecoveryError } = readRecoverySessionFromUrl();
      if (!session || hasRecoveryError) {
        await Promise.resolve();
        if (!isMounted) return;
        setIsValidRecoverySession(false);
        setIsCheckingSession(false);
        return;
      }

      const { error: userError } = await supabase.auth.getUser(session.access_token);
      if (!isMounted) return;

      if (userError) {
        setRecoveryAccessToken(null);
        setIsValidRecoverySession(false);
        setIsCheckingSession(false);
        window.history.replaceState(null, "", localizedPath("/reset-password", language));
        return;
      }

      setRecoveryAccessToken(session.access_token);
      setIsValidRecoverySession(true);
      setIsCheckingSession(false);
      window.history.replaceState(null, "", localizedPath("/reset-password", language));
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

    if (!recoveryAccessToken) {
      setError(language === "en" ? "The link is invalid or expired. Please request a new link." : "Der Link ist ungültig oder abgelaufen. Bitte fordere einen neuen Link an.");
      setIsValidRecoverySession(false);
      return;
    }

    setIsSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUserWithAccessToken({ password }, recoveryAccessToken);
    setIsSubmitting(false);

    if (updateError) {
      const errorMessage = getPasswordUpdateErrorMessage(updateError, language);
      setError(errorMessage);
      if (errorMessage.includes("ungültig") || errorMessage.includes("invalid")) {
        setRecoveryAccessToken(null);
        setIsValidRecoverySession(false);
      }
      return;
    }

    setRecoveryAccessToken(null);
    setSuccess(true);
    await supabase.auth.signOut();
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
