"use client";

import { FormEvent, useState } from "react";
import styles from "./register.module.css";

export default function RegisterPage() {
  const [erfolg, setErfolg] = useState(false);

  function handleRegister(absenden: FormEvent<HTMLFormElement>) {
    absenden.preventDefault();
    // Demo-Modus: Die Anfrage bleibt lokal und wird an kein Backend gesendet.
    setErfolg(true);
  }

  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlow} aria-hidden="true" />
      <section className={styles.shell} aria-label="FanMind Early Access">
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
            <p className={styles.eyebrow}>Early Access</p>
            <h1>Early Access für FanMind anfragen</h1>
            <p>
              Sichere dir Zugang zum KI-CRM für Creator, Clubs, Events und
              Fan-Communities. FanMind priorisiert nachvollziehbare Workflows,
              klare Verantwortlichkeit und manuell freigegebene Antworten.
            </p>
            <ul className={styles.benefits}>
              <li>Demo-Workspace mit Beispielkontakten</li>
              <li>KI-Entwürfe statt automatischem Versand</li>
              <li>Roadmap-konforme Integrationshinweise</li>
            </ul>
          </section>

          <form className={styles.formCard} onSubmit={handleRegister}>
            <div>
              <p className={styles.eyebrow}>Anfrage</p>
              <h2>Zugang vormerken</h2>
              <p className={styles.subline}>
                Sichere dir Zugang zum KI-CRM für Creator, Clubs, Events und Fan-Communities.
              </p>
            </div>

            <label className={styles.field}>
              <span>Name</span>
              <input type="text" name="name" placeholder="Dein Name" autoComplete="name" required />
            </label>

            <label className={styles.field}>
              <span>E-Mail</span>
              <input type="email" name="email" placeholder="du@fanmind.io" autoComplete="email" required />
            </label>

            <label className={styles.field}>
              <span>Unternehmen/Club/Creator-Name</span>
              <input type="text" name="organisation" placeholder="z. B. FanMind FC" autoComplete="organization" required />
            </label>

            <label className={styles.field}>
              <span>Rolle/Zielgruppe</span>
              <select name="rolle" defaultValue="" required>
                <option value="" disabled>Bitte auswählen</option>
                <option>Creator</option>
                <option>Club oder Verein</option>
                <option>Event-Team</option>
                <option>Fan-Community</option>
                <option>Agentur</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>Nachricht optional</span>
              <textarea name="nachricht" placeholder="Was möchtest du mit FanMind zuerst verbessern?" rows={4} />
            </label>

            <button className={styles.primaryButton} type="submit">
              Early Access anfragen
            </button>

            {erfolg && (
              <p className={styles.success} role="status">
                Danke. Deine Early-Access-Anfrage wurde im Demo-Modus vorgemerkt.
              </p>
            )}

            <p className={styles.notice}>
              FanMind bleibt ein Assistent. Antworten werden vorbereitet, aber nicht automatisch versendet.
            </p>

            <div className={styles.links}>
              <a href="/login">Schon Zugang? Zum Login</a>
              <a href="/landing-v2">Zur Landingpage</a>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
