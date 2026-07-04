import Image from "next/image";
import FeatureStatusLabel from "@/components/FeatureStatusLabel";
import {
  createFanMindTranslator,
  type FanMindLanguage,
  localizeFanMindValue,
} from "@/lib/fanmindCopy";
import styles from "./ProductShowcaseSection.module.css";

const benefits = [
  [
    "♙",
    "Persönlicher Fan-Kontext",
    "Interaktionen, Tags und Notizen bleiben sichtbar, bevor dein Team antwortet.",
  ],
  [
    "☆",
    "Geprüfte Aufgaben",
    "Priorisierte Aufgaben zeigen, welcher manuelle Schritt als Nächstes geprüft werden sollte.",
  ],
  [
    "▤",
    "CSV-Import & Notizen",
    "Bestehende Fans können in den MVP-Workflow übernommen und ergänzt werden.",
  ],
  [
    "↗",
    "Geprüfte nächste Schritte",
    "Follow-ups und vorbereitete Entwürfe bleiben transparent nachvollziehbar.",
  ],
];

const featureCards = [
  [
    "🧠",
    "Fan-Gedächtnis",
    "Merkt sich Kaufhistorie, Interessen, Notizen und Interaktionsverlauf pro Fan.",
  ],
  [
    "✦",
    "KI-Antwortvorschläge",
    "Liefert passende Entwürfe – Mensch prüft, editiert und gibt frei.",
  ],
  [
    "☑",
    "Follow-up Queue",
    "Bündelt fällige Aktionen nach Priorität, Owner und nächstem Schritt.",
  ],
  [
    "▣",
    "Roadmap sauber markiert",
    "Kampagnen, Analytics und externe Kanäle bleiben als Roadmap/Beta getrennt.",
  ],
];

function ComingSoonImage({ size = "medium" }: { size?: "small" | "medium" }) {
  return (
    <Image
      src="/assets/coming-soon-badge.png"
      alt="Coming Soon"
      width={1536}
      height={1024}
      className={`${styles.comingSoonImage} ${styles[`comingSoon-${size}`]}`}
    />
  );
}
function SparkLine({ tone = "blue" }: { tone?: "blue" | "green" | "purple" }) {
  return (
    <svg
      className={styles.sparkLine}
      data-tone={tone}
      viewBox="0 0 180 54"
      aria-hidden="true"
    >
      <path d="M6 39 C28 36 33 21 53 26 C73 31 76 15 96 18 C119 21 121 38 143 30 C158 24 165 13 176 15" />
      <circle cx="96" cy="18" r="3.5" />
      <circle cx="176" cy="15" r="3.5" />
    </svg>
  );
}

export default function ProductShowcaseSection({
  language = "de",
}: {
  language?: FanMindLanguage;
}) {
  const t = createFanMindTranslator(language);
  const localizedBenefits = localizeFanMindValue(benefits, t);
  const localizedFeatureCards = localizeFanMindValue(featureCards, t);

  return (
    <section
      id="produkt-showcase"
      className={styles.section}
      aria-labelledby="product-showcase-title"
    >
      <div className={styles.artboard}>
        <div className={styles.glowOne} aria-hidden="true" />
        <div className={styles.glowTwo} aria-hidden="true" />
        <div className={styles.gridVeil} aria-hidden="true" />

        <header className={styles.header}>
          <span className={styles.eyebrow}>{t("03 · Produkt-Showcase")}</span>
          <h2 id="product-showcase-title">
            {t("Produktvorschau für dein")}{" "}
            <span>{t("Fan-Management mit Beispieldaten.")}</span>
          </h2>
          <p>
            {t(
              "FanMind verbindet Fans, Fan-Gedächtnis, KI-Vorschläge, Follow-ups und CSV-Import in einer kontrollierten Arbeitsfläche. Kampagnen und Analytics sind aktuell als Vorschau markiert.",
            )}
          </p>
        </header>

        <div className={styles.stage}>
          <aside
            className={styles.leftColumn}
            aria-label="Fan-Gedächtnis, KI-Vorschläge und Kampagnenvorschau"
          >
            <article
              id="fan-gedaechtnis"
              className={`${styles.card} ${styles.memoryCard}`}
            >
              <div className={styles.cardTop}>
                <span className={styles.iconBubble}>🧠</span>
                <strong>{t("Fan-Gedächtnis")}</strong>
                <em>{t("Buyer")}</em>
              </div>
              <div className={styles.profileRow}>
                <span className={styles.avatar}>SM</span>
                <div>
                  <b>Sandra M.</b>
                  <small>{t("Fan seit 12.03.2025")}</small>
                </div>
              </div>
              <div className={styles.tabRow}>
                <span className={styles.activeTab}>{t("Kontext")}</span>
                <span>{t("Käufe")}</span>
                <span>{t("Notizen")}</span>
              </div>
              <div className={styles.tagCloud}>
                <span>buyer</span>
                <span>premium_interessiert</span>
                <span>event</span>
                <span>Mia Active Club</span>
              </div>
            </article>

            <article id="ki" className={`${styles.card} ${styles.aiCard}`}>
              <div className={styles.cardTop}>
                <span className={styles.iconBubble}>✦</span>
                <strong>{t("KI-Antwortvorschläge")}</strong>
                <em>{t("Entwurf")}</em>
              </div>
              <p className={styles.question}>
                {t("Sandra M.: „Gibt es noch Early-Bird Plätze für Member?“")}
              </p>
              <div className={styles.answerBubble}>
                {t(
                  "Ja! Als Mia Active Member erhältst du 10 % Rabatt in den ersten 48 Stunden. Bitte vor manueller Nutzung prüfen.",
                )}
              </div>
              <div className={styles.approvalRow}>
                <span>{t("Freigabe nötig")}</span>
                <button type="button">{t("Vorschlag prüfen")}</button>
              </div>
            </article>

            <article
              className={`${styles.card} ${styles.campaignCard} ${styles.cardWithComingSoon}`}
            >
              <div className={styles.cardTop}>
                <span className={styles.iconBubble}>📣</span>
                <strong>{t("Sommer-Event Early Bird")}</strong>
                <FeatureStatusLabel variant="roadmap">
                  {t("Roadmap")}
                </FeatureStatusLabel>
              </div>
              <div className={styles.campaignStatus}>
                <span>{t("Geplant: VIP + Buyer")}</span>
                <b>{t("Beispieldaten")}</b>
              </div>
              <div className={styles.rateGrid}>
                <span>
                  {t("Roadmap")}
                  <b>{t("In Kürze")}</b>
                </span>
                <span>
                  {t("Freigabe")}
                  <b>{t("Manuell")}</b>
                </span>
                <span>
                  {t("Versand")}
                  <b>{t("Inaktiv")}</b>
                </span>
              </div>
              <SparkLine tone="green" />
              <ComingSoonImage size="medium" />
            </article>
          </aside>

          <div id="follow-ups" className={styles.centerColumn}>
            <div
              className={styles.dashboardShell}
              aria-label={t("FanMind Fan-Dashboard mit Beispieldaten")}
            >
              <Image
                src="/assets/Landingpage-Fans.png"
                alt={t(
                  "FanMind Fan-Management Vorschau mit Fans, Kanälen und Follow-ups",
                )}
                width={2400}
                height={1350}
                sizes="(max-width: 768px) calc(100vw - 64px), (max-width: 1180px) calc(100vw - 64px), 880px"
                className={styles.dashboardImage}
              />
            </div>

            <div className={styles.benefitGrid}>
              {localizedBenefits.map(([icon, title, text]) => (
                <article key={title}>
                  <span>{icon}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.featureStrip}>
          {localizedFeatureCards.map(([icon, title, text]) => {
            const hasComingSoon =
              title.includes("Kampagnen") || title.includes("Analytics");

            return (
              <article
                className={
                  hasComingSoon ? styles.cardWithComingSoon : undefined
                }
                key={title}
              >
                <span>{icon}</span>
                <h3>{title}</h3>
                <p>{text}</p>
                {hasComingSoon ? <ComingSoonImage size="small" /> : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
