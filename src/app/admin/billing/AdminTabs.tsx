import Link from "next/link";
import styles from "./adminBilling.module.css";

export type AdminTabKey =
  | "overview"
  | "customers"
  | "packages"
  | "payments"
  | "ai-usage"
  | "referrals"
  | "roadmap"
  | "inquiries";

export function AdminTabs({ activeTab }: { activeTab: AdminTabKey }) {
  return (
    <nav className={styles.dashboardTabs} aria-label="Adminbereiche">
      <Link className={activeTab === "overview" ? styles.activeTab : undefined} href="/admin/billing">Übersicht</Link>
      <Link className={activeTab === "customers" ? styles.activeTab : undefined} href="/admin/billing?tab=customers">Kunden &amp; Nutzer</Link>
      <Link className={activeTab === "packages" ? styles.activeTab : undefined} href="/admin/billing?tab=packages">Pakete &amp; Freigaben</Link>
      <Link className={activeTab === "payments" ? styles.activeTab : undefined} href="/admin/billing?tab=payments">Zahlungen</Link>
      <Link className={activeTab === "ai-usage" ? styles.activeTab : undefined} href="/admin/ai-usage">KI-Verbrauch</Link>
      <Link className={activeTab === "referrals" ? styles.activeTab : undefined} href="/admin/referrals">Referrals</Link>
      <Link className={activeTab === "roadmap" ? styles.activeTab : undefined} href="/admin/roadmap">Roadmap</Link>
      <Link className={activeTab === "inquiries" ? styles.activeTab : undefined} href="/admin/inquiries">Anfragen</Link>
      <span>Abos <small>Später</small></span>
    </nav>
  );
}
