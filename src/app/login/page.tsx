"use client";

import { FormEvent, use } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

type LoginPageProps = {
  searchParams: Promise<{ demo?: string | string[] }>;
};

// Aktuell existiert noch kein /dashboard in diesem Repository.
// TODO: Sobald das echte Dashboard bereitsteht, LOGIN_TARGET und DEMO_TARGET auf /dashboard umstellen.
const LOGIN_TARGET = "/roadmap";
const DEMO_TARGET = "/roadmap?demo=1";

function LanguageSwitch() {
  return (
    <div className={styles.languageSwitch} aria-label="Sprachauswahl">
      <a className={styles.languageActive} href="/login" aria-current="true">DE</a>
      <span>|</span>
      <a href="?lang=en">EN</a>
    </div>
  );
}

function FanMindLogo() {
  return (
    <a className={styles.logo} href="/landing-v2" aria-label="FanMind Landingpage öffnen">
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
  const router = useRouter();

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(LOGIN_TARGET);
  }

  function handleDemoStart() {
    router.push(DEMO_TARGET);
  }

  return (
    <main className={styles.page}>
      <div className={styles.gridPattern} aria-hidden="true" />
      <section className={styles.shell} aria-label="FanMind Login">
        <header className={styles.header}>
          <FanMindLogo />
          <nav className={styles.topLinks} aria-label="Login Navigation">
            <LanguageSwitch />
            <span>Noch keinen Zugang?</span>
            <a href="/register">Early Access anfragen</a>
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
                  <h2>Schneller Zugriff</h2>
                  <p>Greife sofort auf Demo-Daten, Kontakte und vorbereitete Workflows zu.</p>
                </div>
              </article>
              <article>
                <span className={styles.blueIcon}>♙</span>
                <div>
                  <h2>Team & Rollen</h2>
                  <p>Arbeite nachvollziehbar mit klaren Zuständigkeiten und manueller Freigabe.</p>
                </div>
              </article>
              <article>
                <span className={styles.greenIcon}>⌁</span>
                <div>
                  <h2>Echte Kontrolle</h2>
                  <p>KI bereitet Antworten vor, versendet aber nichts automatisch.</p>
                </div>
              </article>
            </div>
          </aside>

          <form className={styles.formCard} onSubmit={handleLogin}>
            {isDemoMode && (
              <p className={styles.demoBadge} role="status">
                Demo-Modus aktiv · Weiterleitung in eine sichere Vorschau
              </p>
            )}

            <div className={styles.formHeader}>
              <h1>Willkommen zurück bei FanMind</h1>
              <p>Melde dich an und öffne deinen FanMind Workspace.</p>
            </div>

            <label className={styles.field}>
              <span>E-Mail</span>
              <div className={styles.inputWrap}>
                <span aria-hidden="true">✉</span>
                <input type="email" name="email" placeholder="Deine E-Mail-Adresse" autoComplete="email" required />
              </div>
            </label>

            <label className={styles.field}>
              <span>Passwort</span>
              <div className={styles.inputWrap}>
                <span aria-hidden="true">▣</span>
                <input type="password" name="password" placeholder="Dein Passwort" autoComplete="current-password" required />
              </div>
            </label>

            <div className={styles.inlineOptions}>
              <label>
                <input type="checkbox" defaultChecked />
                Angemeldet bleiben
              </label>
              <a href="/login">Passwort vergessen?</a>
            </div>

            <button className={styles.primaryButton} type="submit">
              Einloggen <span>→</span>
            </button>
            <button className={styles.secondaryButton} type="button" onClick={handleDemoStart}>
              Demo starten
            </button>

            <p className={styles.notice}>
              Demo-Modus: Keine echte Authentifizierung, keine Social-Media-Integration,
              kein automatisches Senden.
            </p>

            <div className={styles.safetyCard}>
              <span aria-hidden="true">🛡</span>
              <div>
                <strong>Sicherer MVP-Rahmen</strong>
                <p>Keine API, keine Datenbank und keine echte Authentifizierung in diesem Demo-Flow.</p>
              </div>
            </div>

            <div className={styles.footerLinks}>
              <a href="/register">Noch keinen Zugang? Early Access anfragen</a>
              <a href="/landing-v2">Zur Landingpage</a>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
