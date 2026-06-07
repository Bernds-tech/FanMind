"use client";

import { FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

// Aktuell existiert noch kein /dashboard in diesem Repository.
// TODO: Sobald das echte Dashboard bereitsteht, LOGIN_ZIEL auf "/dashboard" ändern.
const LOGIN_ZIEL = "/roadmap";
const DEMO_ZIEL = "/roadmap?demo=1";

export default function LoginPage() {
  const router = useRouter();

  function handleLogin(absenden: FormEvent<HTMLFormElement>) {
    absenden.preventDefault();
    router.push(LOGIN_ZIEL);
  }

  function handleDemoStart() {
    router.push(DEMO_ZIEL);
  }

  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlow} aria-hidden="true" />
      <section className={styles.shell} aria-label="FanMind Login">
        <a className={styles.logo} href="/landing-v2" aria-label="FanMind Startseite">
          <svg viewBox="0 0 52 52" aria-hidden="true" className={styles.logoMark}>
            <path d="M25.7 17.2C22.7 7.8 13.5 4.6 9.2 9.7c-4.4 5.1.4 13.1 10.1 12.2-8.8 4.9-8.6 15.4-1.7 17.1 6.8 1.6 10.2-7.4 8.4-16.4 1.8 9 6.8 16.7 13.1 13.7 6.4-3 4.6-13.3-5-16.1 9.7-.3 12.7-9.4 7.1-13.2-5.6-3.9-13.5 1.5-15.5 10.2Z" />
            <circle cx="17.1" cy="17.5" r="3.4" />
            <circle cx="34.9" cy="17.5" r="3.4" />
            <circle cx="25.9" cy="31.5" r="3.4" />
          </svg>
          <span>FanMind</span>
        </a>

        <div className={styles.grid}>
          <section className={styles.copyCard}>
            <p className={styles.eyebrow}>Demo Workspace</p>
            <h1>Willkommen zurück bei FanMind</h1>
            <p>
              Melde dich an und öffne deinen FanMind Workspace. Diese Demo zeigt
              den Premium-Flow ohne echte Authentifizierung und ohne angebundene
              Social-Media-Kanäle.
            </p>
            <div className={styles.previewStack} aria-hidden="true">
              <span>Kontakt-Kontext</span>
              <span>KI-Entwurf</span>
              <span>Manuelle Freigabe</span>
            </div>
          </section>

          <form className={styles.formCard} onSubmit={handleLogin}>
            <div>
              <p className={styles.eyebrow}>Login</p>
              <h2>Workspace öffnen</h2>
              <p className={styles.subline}>
                Melde dich an und öffne deinen FanMind Workspace.
              </p>
            </div>

            <label className={styles.field}>
              <span>E-Mail</span>
              <input type="email" name="email" placeholder="du@fanmind.io" autoComplete="email" required />
            </label>

            <label className={styles.field}>
              <span>Passwort</span>
              <input type="password" name="password" placeholder="••••••••" autoComplete="current-password" required />
            </label>

            <div className={styles.actions}>
              <button className={styles.primaryButton} type="submit">
                Einloggen
              </button>
              <button className={styles.secondaryButton} type="button" onClick={handleDemoStart}>
                Demo starten
              </button>
            </div>

            <p className={styles.notice}>
              Demo ohne echte Authentifizierung. Keine echten Social-Media-Integrationen,
              kein automatisches Senden.
            </p>

            <div className={styles.links}>
              <a href="/register">Noch keinen Zugang? Early Access anfragen</a>
              <a href="/landing-v2">Zur Landingpage</a>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
