import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/admin";
import { roadmapPhases } from "@/config/roadmap";
import { AdminBillingShell } from "../billing/AdminBillingShell";
import styles from "./adminRoadmap.module.css";

const statusLabels: Record<string, string> = {
  done: "Erledigt",
  progress: "In Arbeit",
  partial: "Vorbereitet",
  planned: "Coming Soon / Roadmap",
  later: "Später",
};

function phaseStatusLabel(availability: string, status: string) {
  if (availability === "done") return "Erledigt";
  if (status.includes("Vorbereitung") || status.includes("Beta") || status.includes("Arbeit")) return "In Arbeit / vorbereitet";
  if (status.includes("Kürze")) return "Coming Soon";
  return "Später / Roadmap";
}

export default async function AdminRoadmapPage() {
  const user = await requirePlatformAdmin();

  return (
    <AdminBillingShell
      user={user}
      title="Admin-Roadmap"
      subtitle="Interne Roadmap aus derselben Datenquelle wie die Landingpage – ohne falsche Live-Versprechen."
    >
      <div className={styles.adminRoadmapStack}>
        <nav className={styles.adminRoadmapTabs} aria-label="Adminbereiche">
          <Link href="/admin/billing">Billing</Link>
          <Link className={styles.activeTab} href="/admin/roadmap">Roadmap</Link>
        </nav>

        <section className={styles.heroCard}>
          <div>
            <span className={styles.eyebrow}>Produktplanung</span>
            <h1>Roadmap-Phasen intern verfolgen</h1>
            <p>
              Die Reihenfolge entspricht der öffentlichen Landingpage: Phase 6 bis 9 werden vor Phase 3 angezeigt, die sichtbaren Phasennummern bleiben unverändert.
            </p>
          </div>
          <Link className={styles.primaryLink} href="/landing-v2#roadmap">Öffentliche Roadmap prüfen</Link>
        </section>

        <div className={styles.phaseGrid}>
          {roadmapPhases.map((phase) => (
            <article className={styles.phaseCard} data-done={phase.availability === "done" ? "true" : undefined} key={phase.number}>
              <div className={styles.phaseHeader}>
                <span className={styles.phaseNumber}>{phase.phase}</span>
                <span className={phase.availability === "done" ? styles.doneBadge : styles.openBadge}>
                  {phase.availability === "done" ? "✓ " : ""}{phaseStatusLabel(phase.availability, phase.status)}
                </span>
              </div>
              <h2>{phase.title}</h2>
              <p className={styles.phaseStatus}>{phase.statusIcon} {phase.status}</p>
              <ul>
                {phase.items.map((item) => (
                  <li data-state={item.state} key={item.label}>
                    <span aria-hidden="true">{item.state === "done" ? "✓" : "○"}</span>
                    <strong>{item.label}</strong>
                    <em>{item.status ?? statusLabels[item.state] ?? "Offen"}</em>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </AdminBillingShell>
  );
}
