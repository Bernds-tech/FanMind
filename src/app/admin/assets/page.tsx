import { requirePlatformAdmin } from "@/lib/admin";
import { AdminBillingShell } from "../billing/AdminBillingShell";
import { AdminTabs } from "../billing/AdminTabs";
import styles from "../billing/adminBilling.module.css";
import { AssetCard, type SystemAsset } from "./AssetCard";

const SYSTEM_ASSETS: SystemAsset[] = [
  {
    name: "Open Graph Image",
    type: "Social Preview",
    url: "https://fanmind.ch/opengraph-image",
    description: "Vorschau-Bild für Link-Sharing in Meta, LinkedIn und weiteren Open-Graph-Clients.",
  },
  {
    name: "Twitter Image",
    type: "Social Preview",
    url: "https://fanmind.ch/twitter-image",
    description: "X/Twitter-Card-Bild für geteilte FanMind-Links.",
  },
  {
    name: "Icon",
    type: "App Icon",
    url: "https://fanmind.ch/icon",
    description: "System-Icon der Web-App für Browser, PWA-Kontexte und Favicons.",
  },
  {
    name: "Apple Icon",
    type: "Touch Icon",
    url: "https://fanmind.ch/apple-icon",
    description: "Apple-Touch-Icon für iOS-Startbildschirm und Safari-Kontexte.",
  },
];

export default async function AdminAssetsPage() {
  const user = await requirePlatformAdmin();

  return (
    <AdminBillingShell user={user} title="Bilder & Assets" subtitle="Admin-only Übersicht der öffentlichen FanMind System-Assets.">
      <div className={styles.adminStack}>
        <AdminTabs activeTab="assets" />
        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>Admin · Assets</span>
            <h1>Bilder &amp; Assets</h1>
            <p>Öffentliche System-Assets zentral prüfen, öffnen und kopieren. WhatsApp-, Meta- und LinkedIn-Caches können verzögert aktualisieren.</p>
          </div>
          <span className={styles.badgeOk}>Nur Admins</span>
        </section>

        <section className={styles.assetGrid} aria-label="System-Assets">
          {SYSTEM_ASSETS.map((asset) => <AssetCard asset={asset} key={asset.url} />)}
        </section>

        <section className={`${styles.card} ${styles.uploadComingSoon}`}>
          <div className={styles.cardHeader}>
            <div>
              <span className={styles.eyebrow}>Upload</span>
              <h2>Admin-Upload vorbereitet</h2>
            </div>
            <span className={styles.badgeWarn}>Nächster Schritt</span>
          </div>
          <p className={styles.muted}>Ein sicherer Upload in den Supabase Storage Bucket <strong>fanmind-assets</strong> wird als separater Schritt umgesetzt. Bis dahin bleibt Upload deaktiviert, ist nur im Adminbereich sichtbar und steht normalen Nutzern nicht zur Verfügung.</p>
          <div className={styles.emptyState}>Upload deaktiviert: keine Secrets im Browser, keine Binärdateien im Repository, keine Freigabe für normale Nutzer.</div>
        </section>
      </div>
    </AdminBillingShell>
  );
}
