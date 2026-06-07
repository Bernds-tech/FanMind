"use client";

import { FormEvent, useState } from "react";
import styles from "./register.module.css";

function LanguageSwitch() {
  return (
    <div className={styles.languageSwitch} aria-label="Sprachauswahl">
      <a className={styles.languageActive} href="/register" aria-current="true">DE</a>
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

export default function RegisterPage() {
  const [success, setSuccess] = useState(false);

  function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Demo-Modus: Die Anfrage wird nur lokal bestätigt und nicht an ein Backend gesendet.
    setSuccess(true);
  }

  return (
    <main className={styles.page}>
      <div className={styles.gridPattern} aria-hidden="true" />
      <section className={styles.shell} aria-label="FanMind Early Access">
        <header className={styles.header}>
          <FanMindLogo />
          <nav className={styles.topLinks} aria-label="Registrierung Navigation">
            <LanguageSwitch />
            <span>Bereits Zugang?</span>
            <a href="/login">Zum Login</a>
          </nav>
        </header>

        <div className={styles.authGrid}>
          <aside className={styles.visualPanel} aria-label="Early-Access Vorteile">
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
                  <h2>Kostenlos vormerken</h2>
                  <p>Frage Early Access unverbindlich für deinen Creator-, Club- oder Event-Use-Case an.</p>
                </div>
              </article>
              <article>
                <span className={styles.blueIcon}>🧠</span>
                <div>
                  <h2>KI-Power nutzen</h2>
                  <p>Erhalte vorbereitete Antwortentwürfe, ohne echten automatischen Versand zu behaupten.</p>
                </div>
              </article>
              <article>
                <span className={styles.greenIcon}>⌁</span>
                <div>
                  <h2>Wachstum planen</h2>
                  <p>Beschreibe Zielgruppe, Rolle und Workspace-Bedarf für eine klare MVP-Einordnung.</p>
                </div>
              </article>
            </div>
          </aside>

          <form className={styles.formCard} onSubmit={handleRegister}>
            <div className={styles.formHeader}>
              <p className={styles.eyebrow}>Early Access</p>
              <h1>Early Access für FanMind anfragen</h1>
              <p>Sichere dir Zugang zum KI-CRM für Creator, Clubs, Events und Fan-Communities.</p>
            </div>

            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Name</span>
                <div className={styles.inputWrap}>
                  <span aria-hidden="true">♙</span>
                  <input type="text" name="name" placeholder="Dein Name" autoComplete="name" required />
                </div>
              </label>

              <label className={styles.field}>
                <span>E-Mail</span>
                <div className={styles.inputWrap}>
                  <span aria-hidden="true">✉</span>
                  <input type="email" name="email" placeholder="Deine E-Mail-Adresse" autoComplete="email" required />
                </div>
              </label>
            </div>

            <label className={styles.field}>
              <span>Unternehmen / Club / Creator-Name</span>
              <div className={styles.inputWrap}>
                <span aria-hidden="true">▤</span>
                <input type="text" name="organisation" placeholder="z. B. Team Arena, Club oder Creator-Name" autoComplete="organization" required />
              </div>
            </label>

            <label className={styles.field}>
              <span>Rolle / Zielgruppe</span>
              <div className={styles.inputWrap}>
                <span aria-hidden="true">◇</span>
                <select name="rolle" defaultValue="" required>
                  <option value="" disabled>Bitte auswählen</option>
                  <option>Creator</option>
                  <option>Club oder Verein</option>
                  <option>Event-Team</option>
                  <option>Fan-Community</option>
                  <option>Agentur</option>
                </select>
              </div>
            </label>

            <label className={styles.field}>
              <span>Nachricht optional</span>
              <div className={styles.textareaWrap}>
                <textarea name="nachricht" placeholder="Was möchtest du mit FanMind zuerst verbessern?" rows={4} />
              </div>
            </label>

            <button className={styles.primaryButton} type="submit">
              Early Access anfragen <span>→</span>
            </button>

            {success && (
              <p className={styles.success} role="status">
                Danke. Deine Early-Access-Anfrage wurde im Demo-Modus vorgemerkt.
              </p>
            )}

            <p className={styles.notice}>
              FanMind bleibt ein Assistent. Antworten werden vorbereitet, aber nicht automatisch versendet.
            </p>

            <div className={styles.footerLinks}>
              <a href="/login">Schon Zugang? Zum Login</a>
              <a href="/landing-v2">Zur Landingpage</a>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
