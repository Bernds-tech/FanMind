import Image from "next/image";
import type { CSSProperties } from "react";
import type { FeatureKey } from "@/config/plans";
import FeatureStatusLabel from "@/components/FeatureStatusLabel";
import { shouldShowFeature } from "@/lib/plans";
import { createFanMindTranslator, type FanMindLanguage, landingPath, localizeFanMindValue } from "@/lib/fanmindCopy";
import styles from "./ProductShowcaseSection.module.css";

const navItems: Array<{ icon: string; label: string; featureKey: FeatureKey }> = [
  { icon: "⌂", label: "Dashboard", featureKey: "dashboard" },
  { icon: "♙", label: "Kontakte", featureKey: "contacts" },
  { icon: "◌", label: "Segmente", featureKey: "basic_segments" },
  { icon: "◷", label: "Follow-ups", featureKey: "followups" },
  { icon: "📣", label: "Kampagnen (Roadmap)", featureKey: "campaigns" },
  { icon: "⌁", label: "Analytics (Roadmap)", featureKey: "analytics" },
  { icon: "⚙", label: "Einstellungen", featureKey: "dashboard" },
];

const visibleLandingNavItems = navItems.filter((item) =>
  shouldShowFeature("growth", item.featureKey, "landing"),
);

const metrics = [
  { label: "Gesamtfans", value: "10.248", change: "+12 %", accent: "#0b8cff" },
  { label: "Aktive", value: "4.892", change: "+7,8 %", accent: "#00e178" },
  { label: "VIP", value: "182", change: "+1,8 %", accent: "#9b55ff" },
  { label: "Follow-ups heute", value: "128", change: "24 hoch", accent: "#00c9ff" },
];

const contacts = [
  ["SM", "Sandra M.", "Buyer", "Mia Active Club", "buyer · premium", "92", "Heute, 09:42", "Morgen, 10:00", "ND"],
  ["AK", "Alex K.", "VIP", "DJ Nova", "vip · event", "88", "Gestern, 18:21", "Heute, 14:00", "MK"],
  ["EL", "Ella L.", "Inactive", "Team Arena", "reactivation", "45", "12.05.2025", "Überfällig", "ND"],
  ["LS", "Lukas S.", "Warm", "Mia Active Club", "fitness · warm", "76", "Heute, 07:15", "Heute, 16:00", "MK"],
  ["MR", "Mario R.", "New", "Mia Active Club", "new · beginner", "30", "Gestern, 11:03", "18.05.2025", "SD"],
  ["NW", "Nina W.", "Warm", "DJ Nova", "music · merch", "68", "10.05.2025", "19.05.2025", "ND"],
  ["RG", "Rene G.", "Do not push", "Team Arena", "careful", "20", "09.05.2025", "—", "SD"],
  ["TJ", "Tara J.", "Buyer", "Festival Hub", "early bird", "81", "Heute, 08:12", "Freitag, 12:00", "MK"],
];

const benefits = [
  ["♙", "Persönlicher Fan-Kontext", "Interaktionen, Tags und Notizen bleiben sichtbar, bevor dein Team antwortet."],
  ["☆", "Nächste beste Aktion", "Priorisierte Aufgaben zeigen, welcher geprüfte Schritt jetzt Wirkung hat."],
  ["◌", "KI-gestützte Segmentierung", "KI erkennt Muster und schlägt Segmente vor; dein Team prüft und nutzt sie gezielt."],
  ["↗", "Geprüfte nächste Schritte", "Follow-ups und vorbereitete Entwürfe bleiben transparent nachvollziehbar."],
];

const featureCards = [
  ["🧠", "Fan-Gedächtnis", "Merkt sich Kaufhistorie, Interessen, Notizen und Kontaktverlauf pro Fan."],
  ["✦", "KI-Antwortvorschläge", "Liefert passende Entwürfe – Mensch prüft, editiert und gibt frei."],
  ["☑", "Follow-up Queue", "Bündelt fällige Aktionen nach Priorität, Owner und nächstem Schritt."],
  ["📣", "Kampagnen & Analytics", "Als Vorschau sichtbar: Inhalte planen und Roadmap-Auswertungen prüfen."],
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
    <svg className={styles.sparkLine} data-tone={tone} viewBox="0 0 180 54" aria-hidden="true">
      <path d="M6 39 C28 36 33 21 53 26 C73 31 76 15 96 18 C119 21 121 38 143 30 C158 24 165 13 176 15" />
      <circle cx="96" cy="18" r="3.5" />
      <circle cx="176" cy="15" r="3.5" />
    </svg>
  );
}

export default function ProductShowcaseSection({ language = "de" }: { language?: FanMindLanguage }) {
  const t = createFanMindTranslator(language);
  const localizedNavItems = localizeFanMindValue(visibleLandingNavItems, t);
  const localizedMetrics = localizeFanMindValue(metrics, t);
  const localizedContacts = localizeFanMindValue(contacts, t);
  const localizedBenefits = localizeFanMindValue(benefits, t);
  const localizedFeatureCards = localizeFanMindValue(featureCards, t);
  const segmentChips = localizeFanMindValue(["Alle", "VIP 182", "Warm 2.150", "Buyer 912", "Inactive 1.876", "Do not push 60", "Heute fällig 128"], t);
  const followupItems = localizeFanMindValue(["Sandra M. · 10:00 · Hoch", "Lukas S. · 11:00 · Mittel", "Ella L. · überfällig", "Tara J. · Freitag"], t);

  return (
    <section id="produkt-showcase" className={styles.section} aria-labelledby="product-showcase-title">
      <div className={styles.artboard}>
        <div className={styles.glowOne} aria-hidden="true" />
        <div className={styles.glowTwo} aria-hidden="true" />
        <div className={styles.gridVeil} aria-hidden="true" />

        <header className={styles.header}>
          <span className={styles.eyebrow}>{t("03 · Produkt-Showcase")}</span>
          <h2 id="product-showcase-title">{t("Ein Premium-Workspace für dein gesamtes")} <span>{t("Fan-Management.")}</span></h2>
          <p>{t("FanMind verbindet Kontakte, Fan-Gedächtnis, KI-Vorschläge, Follow-ups und CSV-Import in einer kontrollierten Arbeitsfläche. Kampagnen und Analytics sind aktuell als Vorschau markiert.")}</p>
        </header>

        <div className={styles.stage}>
          <aside className={styles.leftColumn} aria-label="Fan-Gedächtnis, KI-Vorschläge und Kampagnenvorschau">
            <article id="fan-gedaechtnis" className={`${styles.card} ${styles.memoryCard}`}>
              <div className={styles.cardTop}><span className={styles.iconBubble}>🧠</span><strong>{t("Fan-Gedächtnis")}</strong><em>{t("Buyer")}</em></div>
              <div className={styles.profileRow}><span className={styles.avatar}>SM</span><div><b>Sandra M.</b><small>{t("Kontakt seit 12.03.2025")}</small></div></div>
              <div className={styles.tabRow}><span className={styles.activeTab}>{t("Kontext")}</span><span>{t("Käufe")}</span><span>{t("Notizen")}</span></div>
              <div className={styles.tagCloud}><span>buyer</span><span>premium_interessiert</span><span>event</span><span>Mia Active Club</span></div>
            </article>

            <article id="ki" className={`${styles.card} ${styles.aiCard}`}>
              <div className={styles.cardTop}><span className={styles.iconBubble}>✦</span><strong>{t("KI-Antwortvorschläge")}</strong><em>{t("Entwurf")}</em></div>
              <p className={styles.question}>{t("Sandra M.: „Gibt es noch Early-Bird Plätze für Member?“")}</p>
              <div className={styles.answerBubble}>{t("Ja! Als Mia Active Member erhältst du 10 % Rabatt in den ersten 48 Stunden. Bitte vor manueller Nutzung prüfen.")}</div>
              <div className={styles.approvalRow}><span>{t("Freigabe nötig")}</span><button type="button">{t("Vorschlag prüfen")}</button></div>
            </article>

            <article className={`${styles.card} ${styles.campaignCard} ${styles.cardWithComingSoon}`}>
              <div className={styles.cardTop}><span className={styles.iconBubble}>📣</span><strong>{t("Sommer-Event Early Bird")}</strong><FeatureStatusLabel variant="roadmap">{t("Roadmap")}</FeatureStatusLabel></div>
              <div className={styles.campaignStatus}><span>{t("Geplant: VIP + Buyer")}</span><b>1.824 Fans</b></div>
              <div className={styles.rateGrid}><span>{t("Roadmap")}<b>{t("In Kürze")}</b></span><span>{t("Freigabe")}<b>{t("Manuell")}</b></span><span>{t("Versand")}<b>{t("Inaktiv")}</b></span></div>
              <SparkLine tone="green" />
              <ComingSoonImage size="medium" />
            </article>
          </aside>

          <div className={styles.centerColumn}>
            <div className={styles.dashboardShell} aria-label="FanMind Kontakte-Dashboard">
              <aside className={styles.sidebar}>
                <div className={styles.brand}><b>FanMind</b></div>
                <nav>
                  {localizedNavItems.map((item) => <span className={item.featureKey === "contacts" ? styles.activeNav : undefined} key={item.label}><i>{item.icon}</i>{item.label}</span>)}
                </nav>
                <div className={styles.savedViews}><small>{t("Gespeicherte Ansichten")}</small><span>★ Top Fans <b>182</b></span><span>✦ Reaktivierung <b>739</b></span><span>◆ Premium-Käufer <b>312</b></span></div>
              </aside>

              <main id="kontakte" className={styles.mainPanel}>
                <div className={styles.topbar}>
                  <div><h3>{t("Kontakte")}</h3><p>{t("Verwalte alle Fan-Profile, Segmente und Interaktionen.")}</p></div>
                  <button type="button">{t("+ Neuer Kontakt")}</button>
                </div>
                <div className={styles.metricRow}>{localizedMetrics.map((metric) => <div className={styles.metric} style={{ "--accent": metric.accent } as CSSProperties} key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.change}</small></div>)}</div>
                <div className={styles.toolbar}><div className={styles.search}>{t("⌕ Suche nach Name, Tag oder Profil …")}</div><span>{t("Filter: Segment")}</span><span>{t("Sortierung: Fan Score")}</span></div>
                <div className={styles.segmentChips}>{segmentChips.map((chip, index) => <span className={index === 0 ? styles.activeChip : undefined} key={chip}>{chip}</span>)}</div>
                <div className={styles.table}>
                  <div className={styles.tableHead}><span>{t("Name")}</span><span>{t("Status")}</span><span>{t("Profil")}</span><span>{t("Tags")}</span><span>{t("Score")}</span><span>{t("Letzter Kontakt")}</span><span>{t("Nächster Follow-up")}</span><span>{t("Owner")}</span></div>
                  {localizedContacts.map((row) => <div className={styles.tableRow} key={`${row[1]}-${row[6]}`}><span><i>{row[0]}</i>{row[1]}</span><span><b>{row[2]}</b></span><span>{row[3]}</span><span>{row[4]}</span><span className={styles.score}>{row[5]}</span><span>{row[6]}</span><span className={row[7] === t("Überfällig") ? styles.overdue : undefined}>{row[7]}</span><span><i>{row[8]}</i></span></div>)}
                </div>
                <div className={styles.pagination}><span>{t("1–8 von 10.248 Kontakten")}</span><div><button type="button">←</button><button type="button">→</button></div></div>
              </main>
            </div>

            <div className={styles.benefitGrid}>{localizedBenefits.map(([icon, title, text]) => <article key={title}><span>{icon}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
          </div>

          <aside className={styles.rightColumn} aria-label="Follow-ups, Segmente und Roadmap">
            <article id="follow-ups" className={`${styles.card} ${styles.followupCard}`}>
              <div className={styles.cardTop}><span className={styles.iconBubble}>☑</span><strong>{t("Follow-ups")}</strong><em>{t("Heute")}</em></div>
              {followupItems.map((item) => <div className={styles.followupRow} key={item}><span />{item}</div>)}
            </article>

            <article className={`${styles.card} ${styles.segmentCard} ${styles.cardWithComingSoon}`}>
              <div className={styles.cardTop}><span className={styles.iconBubble}>◌</span><strong>{t("Segmente")}</strong><FeatureStatusLabel variant="preview">{t("Vorschau")}</FeatureStatusLabel></div>
              <div className={styles.donutWrap}><div className={styles.donut}><span>10.248<small>{t("Fans")}</small></span></div><div className={styles.segmentLegend}><span><i />VIP 1.824</span><span><i />Warm 2.150</span><span><i />Buyer 1.920</span><span><i />Inactive 2.048</span></div></div>
              <ComingSoonImage size="medium" />
            </article>

            <article className={`${styles.card} ${styles.analyticsCard} ${styles.cardWithComingSoon}`}>
              <div className={styles.cardTop}><span className={styles.iconBubble}>⌁</span><strong>{t("Analytics")}</strong><FeatureStatusLabel variant="roadmap">{t("Roadmap")}</FeatureStatusLabel></div>
              <div className={styles.analyticsTooltip}>{t("Roadmap · keine Vollsuite aktuell")}</div>
              <SparkLine tone="purple" />
              <div className={styles.analyticsLegend}><span><i />{t("Conversion")}</span><span><i />{t("Antwortquote")}</span></div>
              <a href={landingPath(language, "#roadmap")}>{t("Roadmap anzeigen →")}</a>
              <ComingSoonImage size="medium" />
            </article>
          </aside>
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
