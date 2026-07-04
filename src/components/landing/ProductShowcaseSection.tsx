import Image from "next/image";
import { createFanMindTranslator, type FanMindLanguage, localizeFanMindValue } from "@/lib/fanmindCopy";
import styles from "./ProductShowcaseSection.module.css";

const featureCards = [
  ["🧠", "Fan-Gedächtnis", "Merkt sich Kaufhistorie, Interessen, Notizen und Kontaktverlauf pro Fan."],
  ["✦", "KI-Antwortvorschläge", "Liefert passende Entwürfe – Mensch prüft, editiert und gibt frei."],
  ["☑", "Follow-up Queue", "Bündelt fällige Aktionen nach Priorität, Owner und nächstem Schritt."],
  ["▣", "Roadmap sauber markiert", "Kampagnen, Analytics und externe Kanäle bleiben als Roadmap/Beta getrennt."],
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

export default function ProductShowcaseSection({ language = "de" }: { language?: FanMindLanguage }) {
  const t = createFanMindTranslator(language);
  const localizedFeatureCards = localizeFanMindValue(featureCards, t);

  return (
    <section id="produkt-showcase" className={styles.section} aria-labelledby="product-showcase-title">
      <div className={styles.artboard}>
        <div className={styles.glowOne} aria-hidden="true" />
        <div className={styles.glowTwo} aria-hidden="true" />
        <div className={styles.gridVeil} aria-hidden="true" />

        <header className={styles.header}>
          <span className={styles.eyebrow}>{t("03 · Produkt-Showcase")}</span>
          <h2 id="product-showcase-title">{t("Produktvorschau für dein")} <span>{t("Fan-Management mit Beispieldaten.")}</span></h2>
          <p>{t("FanMind verbindet Kontakte, Fan-Gedächtnis, KI-Vorschläge, Follow-ups und CSV-Import in einer kontrollierten Arbeitsfläche. Kampagnen und Analytics sind aktuell als Vorschau markiert.")}</p>
        </header>

        <div className={styles.stage}>
          <div className={styles.showcaseImageFrame}>
            <Image
              src="/assets/Landingpage-Fans.png"
              alt={t("FanMind Kontakte- und Fan-Management Vorschau")}
              width={2400}
              height={1350}
              sizes="(max-width: 768px) calc(100vw - 44px), (max-width: 1180px) calc(100vw - 72px), 1260px"
              className={styles.showcaseImage}
              priority={false}
            />
          </div>
        </div>

        <div className={styles.featureStrip}>{localizedFeatureCards.map(([icon, title, text]) => {
          const hasComingSoon = title.includes("Kampagnen") || title.includes("Analytics");

          return (
            <article className={hasComingSoon ? styles.cardWithComingSoon : undefined} key={title}>
              <span>{icon}</span>
              <h3>{title}</h3>
              <p>{text}</p>
              {hasComingSoon ? <ComingSoonImage size="small" /> : null}
            </article>
          );
        })}</div>
      </div>
    </section>
  );
}
