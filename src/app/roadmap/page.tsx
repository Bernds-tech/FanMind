import type { Metadata } from "next";
import Link from "next/link";
import { FEATURE_LABELS, type FeatureKey, type PlanId } from "@/config/plans";
import { shouldShowFeature } from "@/lib/plans";
import FeatureStatusBadge from "@/components/plans/FeatureStatusBadge";
import styles from "./roadmap.module.css";

export const metadata: Metadata = {
  title: "FanMind | Roadmap",
  description: "Transparente Roadmap für aktive, geplante und spätere FanMind Features.",
};

type RoadmapItem = {
  featureKey: FeatureKey;
  note: string;
};

const available: RoadmapItem[] = [
  { featureKey: "login", note: "Login und Registrierung sind Bestandteil der aktuellen Version." },
  { featureKey: "dashboard", note: "Das geschützte Dashboard ist aktiv." },
  { featureKey: "contacts", note: "Kontakte und Follower werden zentral gepflegt." },
  { featureKey: "contact_detail", note: "Kontaktdetails mit Verlauf und Kontext sind aktiv." },
  { featureKey: "ai_replies", note: "Serverseitige KI-Antwortvorschläge sind im Kern verfügbar." },
  { featureKey: "memory", note: "Kontaktwissen ist aktiv." },
  { featureKey: "followups", note: "Follow-ups und nächste manuelle Aktionen sind aktiv." },
  { featureKey: "csv_import", note: "CSV-Import ist ab Starter produktiv verfügbar." },
];

const inProgress: RoadmapItem[] = [
  { featureKey: "basic_segments", note: "Basis-Segmente sind paketabhängig aktiv oder im Upgrade." },
  { featureKey: "multi_client_workspace", note: "Agency-Strukturen sind als Vorschau sichtbar." },
];

const comingSoon: RoadmapItem[] = [
  { featureKey: "campaigns", note: "Kampagnen werden vorbereitet, aber nicht als vollständiger Versand gebaut." },
  { featureKey: "analytics", note: "Analytics ist in der aktuellen Version nicht als vollständige Suite aktiv." },
  { featureKey: "team_roles", note: "Enterprise-Rollen und Rechte sind nicht produktiv aktiv." },
  { featureKey: "integrations", note: "Instagram, TikTok, WhatsApp, Facebook und X/Twitter sind nicht allgemein als produktive Vollintegration freigegeben." },
];

const later: RoadmapItem[] = [];

const roadmapPlanId: PlanId = "agency";

function RoadmapColumn({
  title,
  items,
  status,
}: {
  title: string;
  items: RoadmapItem[];
  status: "active" | "preview" | "coming_soon" | "hidden";
}) {
  return (
    <section className={styles.column}>
      <h2>{title}</h2>
      <div className={styles.items}>
        {items.filter((item) => shouldShowFeature(roadmapPlanId, item.featureKey, "roadmap")).map((item) => (
          <article className={styles.item} key={item.featureKey}>
            <div>
              <h3>{FEATURE_LABELS[item.featureKey]}</h3>
              <p>{item.note}</p>
            </div>
            <FeatureStatusBadge status={status} />
          </article>
        ))}
      </div>
    </section>
  );
}

export default function RoadmapPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/">FanMind</Link>
        <nav aria-label="Roadmap Navigation">
          <a href="/onboarding">Onboarding</a>
          <a href="/roadmap">Roadmap</a>
        </nav>
      </header>

      <div className={styles.contentScroll}>
        <section className={styles.hero}>
          <p>Roadmap</p>
          <h1>Was ist verfügbar, was kommt später?</h1>
          <span>
            FanMind zeigt nicht aktive Funktionen nur als Upgrade, Vorschau, Coming Soon oder später an.
          </span>
        </section>

        <div className={styles.grid}>
          <RoadmapColumn title="Verfügbar / Aktiv" items={available} status="active" />
          <RoadmapColumn title="In Arbeit" items={inProgress} status="preview" />
          <RoadmapColumn title="Coming Soon" items={comingSoon} status="coming_soon" />
          <RoadmapColumn title="Später" items={later} status="hidden" />
        </div>

        <section className={styles.integrationNotice}>
          <h2>Integrationen</h2>
          <p>
            Geplante Integrationen werden erst nach technischer und rechtlicher Prüfung umgesetzt. Aktuell werden keine Nachrichten automatisch aus externen Plattformen gesendet oder synchronisiert.
          </p>
        </section>

        <footer className={styles.siteFooter}>
          <strong>FanMind</strong>
          <p>KI-gestütztes Fan-CRM mit manuellem Copy-&-Open-Workflow · kontakt@fanmind.ch</p>
          <nav aria-label="Footer Navigation">
            <a href="/impressum">Impressum</a>
            <a href="/datenschutz">Datenschutz</a>
            <a href="/agb">AGB</a>
            <a href="/zahlungsbedingungen">Zahlungsbedingungen</a>
            <a href="/roadmap">Roadmap</a>
            <a href="/login">Login</a>
            <a href="/register">Registrieren</a>
          </nav>
        </footer>
      </div>
    </main>
  );
}
