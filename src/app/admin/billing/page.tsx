import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/admin";
import { listAdminBillingWorkspaces, type AdminBillingWorkspace } from "@/lib/adminBilling";
import { getBillingStatusLabel } from "@/lib/billing";
import { getCommercialOptionLabel } from "@/lib/dashboardFeatures";
import { getStripeConfigStatus } from "@/lib/stripeBilling";
import { AdminBillingShell } from "./AdminBillingShell";
import styles from "./adminBilling.module.css";

function date(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("de-DE") : "—";
}

function statusClass(status?: string | null) {
  if (status === "active") return styles.badgeOk;
  if (status === "past_due" || status === "payment_failed" || status?.includes("suspended")) return styles.badgeBad;
  if (status?.startsWith("pending")) return styles.badgeWarn;
  return styles.badge;
}

function overviewStatusLabel(workspace: AdminBillingWorkspace) {
  if (workspace.billing_status?.includes("suspended")) return "Gesperrt";
  if (workspace.billing_status === "active") return "Aktiv";
  if (workspace.plan_id === "pilot" || workspace.commercial_option === "pilot") return "Pilot";
  if (workspace.billing_status?.startsWith("pending") || workspace.billing_status === "past_due" || workspace.billing_status === "payment_failed") return "Offen";
  return workspace.billing_status ? getBillingStatusLabel(workspace.billing_status) : "Unbekannt";
}

function getWorkspaceDate(workspace: AdminBillingWorkspace) {
  return workspace.created_at ?? workspace.billing_updated_at ?? null;
}

function sortByDateDesc(left: AdminBillingWorkspace, right: AdminBillingWorkspace) {
  return new Date(getWorkspaceDate(right) ?? 0).getTime() - new Date(getWorkspaceDate(left) ?? 0).getTime();
}

function planLabel(planId?: string | null) {
  if (planId === "pilot") return "Pilot-Demo";
  if (planId === "starter") return "Starter";
  if (planId === "growth") return "Growth";
  if (planId === "agency") return "Agency";
  return planId ?? "—";
}

function StatCard({ icon, label, value, hint, tone }: { icon: string; label: string; value: string | number; hint: string; tone: string }) {
  return (
    <article className={styles.crmKpiCard}>
      <span className={`${styles.crmKpiIcon} ${tone}`}>{icon}</span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{hint}</small>
      </div>
    </article>
  );
}

export default async function AdminBillingPage() {
  const user = await requirePlatformAdmin();
  const stripe = getStripeConfigStatus();
  const { workspaces, error } = await listAdminBillingWorkspaces();

  const active = workspaces.filter((w) => w.billing_status === "active").length;
  const pilotDemos = workspaces.filter((w) => w.plan_id === "pilot" || w.commercial_option === "pilot").length;
  const openPayments = workspaces.filter((w) => w.billing_status?.startsWith("pending") || w.billing_status === "past_due" || w.billing_status === "payment_failed").length;
  const recentlyUpdated = workspaces.filter((w) => w.billing_updated_at || w.billing_admin_note).length;
  const aiConfigured = Boolean(process.env.OPENAI_API_KEY);
  const recentWorkspaces = [...workspaces].sort(sortByDateDesc).slice(0, 5);
  const activityItems = [...workspaces]
    .filter((w) => w.billing_updated_at || w.billing_admin_note)
    .sort((left, right) => new Date(right.billing_updated_at ?? 0).getTime() - new Date(left.billing_updated_at ?? 0).getTime())
    .slice(0, 5);

  const systemStatus = [
    ["Datenbank", error ? "Eingeschränkt" : "Online", error ? styles.badgeWarn : styles.badgeOk],
    ["API & Dienste", "Online", styles.badgeOk],
    ["Dateispeicher", "Unbekannt", styles.badge],
    ["E-Mail Versand", "Nicht konfiguriert", styles.badgeWarn],
    ["KI-Verarbeitung", aiConfigured ? "Aktiv" : "Nicht konfiguriert", aiConfigured ? styles.badgeOk : styles.badgeWarn],
    ["Integrationen", "Teilweise", styles.badgeWarn],
  ] as const;

  const quickActions = [
    { icon: "+", label: "Neuen Kunden anlegen", href: "/register?plan=starter", meta: "Starter-Registrierung", enabled: true },
    { icon: "◆", label: "Pilot-Demo anlegen", href: "/register?plan=pilot", meta: "Pilot-Onboarding", enabled: true },
    { icon: "↗", label: "Paket zuweisen", meta: "In Vorbereitung", enabled: false },
    { icon: "@", label: "Nutzer einladen", meta: "In Vorbereitung", enabled: false },
    { icon: "€", label: "Rechnung erstellen", meta: stripe.readyForCheckout ? "In Vorbereitung" : "Stripe unvollständig", enabled: false },
  ];

  const roadmapItems = [
    ["KI-gestützte Fan-Segmentierung", "In Entwicklung"],
    ["Automatisierte Kampagnen", "Roadmap"],
    ["Abo-Management für Kunden", "Geplant"],
    ["Erweiterte Reporting-Dashboards", "Roadmap"],
  ] as const;

  return (
    <AdminBillingShell user={user} title="Adminbereich" subtitle="Verwalte Kunden, Workspaces, Pakete und Systemeinstellungen.">
      <div className={styles.adminStack}>
        <nav className={styles.dashboardTabs} aria-label="Adminbereiche">
          <span className={styles.activeTab}>Übersicht</span>
          <span>Kunden &amp; Nutzer</span>
          <span>Pakete &amp; Freigaben</span>
          <span>Zahlungen</span>
          <span>Abos <small>Später</small></span>
        </nav>

        <section className={styles.crmKpiGrid} aria-label="Admin-Kennzahlen">
          <StatCard icon="👥" label="Kunden gesamt" value={workspaces.length} hint={workspaces.length ? "Echte Workspaces" : "Noch keine Daten"} tone={styles.toneBlue} />
          <StatCard icon="✓" label="Aktive Workspaces" value={active} hint="Billing-Status aktiv" tone={styles.toneGreen} />
          <StatCard icon="◆" label="Pilot-Demos" value={pilotDemos} hint="Plan oder Option Pilot" tone={styles.toneViolet} />
          <StatCard icon="€" label="Offene Zahlungen" value={openPayments} hint="Pending, fehlgeschlagen oder überfällig" tone={styles.toneAmber} />
          <StatCard icon="AI" label="KI-Status" value={aiConfigured ? "Aktiv" : "Fehlt"} hint={aiConfigured ? "OpenAI-Key vorhanden" : "Nicht konfiguriert"} tone={aiConfigured ? styles.toneGreen : styles.toneRed} />
          <StatCard icon="↻" label="Letzte Admin-Aktionen" value={recentlyUpdated} hint={recentlyUpdated ? "Billing-Updates/Notizen" : "Noch keine Daten"} tone={styles.toneCyan} />
        </section>

        {error ? <p className={styles.badgeWarn}>{error}</p> : null}

        <section className={styles.dashboardMiddleGrid}>
          <article className={`${styles.card} ${styles.recentCard}`}>
            <div className={styles.cardHeader}><div><span className={styles.eyebrow}>CRM-Übersicht</span><h2>Kürzlich hinzugekommene Kunden/Workspaces</h2></div><span className={styles.badge}>{workspaces.length} gesamt</span></div>
            {recentWorkspaces.length ? (
              <div className={styles.compactTable}>
                <div className={styles.compactTableHead}><span>Kunde / Workspace</span><span>Plan</span><span>Nutzer</span><span>Erstellt am</span><span>Status</span></div>
                {recentWorkspaces.map((workspace) => (
                  <div className={styles.compactTableRow} key={workspace.id}>
                    <span><Link className={styles.workspaceLink} href={`/admin/billing/workspaces/${workspace.id}`}>{workspace.name}</Link><small>{workspace.id}</small></span>
                    <span>{planLabel(workspace.plan_id)}<small>{getCommercialOptionLabel(workspace.commercial_option ?? "")}</small></span>
                    <span>—</span>
                    <span>{date(getWorkspaceDate(workspace))}</span>
                    <span><span className={statusClass(workspace.billing_status)}>{overviewStatusLabel(workspace)}</span></span>
                  </div>
                ))}
              </div>
            ) : <div className={styles.emptyState}>Noch keine Workspaces vorhanden.</div>}
            <Link className={styles.textLink} href="#workspace-verzeichnis">Alle Kunden anzeigen</Link>
          </article>

          <article className={styles.card}>
            <div className={styles.cardHeader}><div><span className={styles.eyebrow}>Direktzugriff</span><h2>Schnellaktionen</h2></div></div>
            <div className={styles.quickActionList}>{quickActions.map((action) => action.enabled && action.href ? <Link className={styles.quickAction} href={action.href} key={action.label}><span className={styles.actionIcon}>{action.icon}</span><span><strong>{action.label}</strong><small>{action.meta}</small></span><b aria-hidden="true">→</b></Link> : <div className={`${styles.quickAction} ${styles.disabledAction}`} key={action.label}><span className={styles.actionIcon}>{action.icon}</span><span><strong>{action.label}</strong><small>{action.meta}</small></span><b aria-hidden="true">→</b></div>)}</div>
          </article>

          <article className={styles.card}>
            <div className={styles.cardHeader}><div><span className={styles.eyebrow}>Betrieb</span><h2>Systemstatus</h2></div></div>
            <div className={styles.statusList}>{systemStatus.map(([label, status, className]) => <div className={styles.statusItem} key={label}><span className={styles.statusLabel}><span className={styles.statusIcon} aria-hidden="true" />{label}</span><span className={className}>{status}</span></div>)}</div>
            <p className={styles.muted}>Systemstatus geprüft · externe Dienste nur angezeigt, wenn sicher ableitbar.</p>
          </article>
        </section>

        <section className={styles.dashboardBottomGrid}>
          <article className={styles.card}>
            <div className={styles.cardHeader}><div><span className={styles.eyebrow}>Produkt</span><h2>Feature-Roadmap &amp; Sichtbarkeit</h2></div><Link className={styles.textLink} href="/roadmap">Roadmap ansehen</Link></div>
            <div className={styles.roadmapList}>{roadmapItems.map(([label, status]) => <div className={styles.roadmapItem} key={label}><strong>{label}</strong><span className={status === "In Entwicklung" ? styles.badgeOk : status === "Geplant" ? styles.badgeWarn : styles.badge}>{status}</span></div>)}</div>
          </article>

          <article className={`${styles.card} ${styles.activityCard}`}>
            <div className={styles.cardHeader}><div><span className={styles.eyebrow}>Audit</span><h2>Letzte Aktivitäten (Audit-Log)</h2></div></div>
            {activityItems.length ? <ul className={styles.timeline}>{activityItems.map((workspace) => <li className={styles.timelineItem} key={workspace.id}><span className={styles.timelineDot} /><div><strong>{workspace.name}</strong><p>{workspace.billing_admin_note ? "Admin-Notiz gespeichert" : "Billing-Daten aktualisiert"}</p></div><time>{date(workspace.billing_updated_at)}</time></li>)}</ul> : <div className={styles.emptyState}>Noch keine Admin-Aktivitäten gespeichert.</div>}
          </article>
        </section>

        <section className={styles.card} id="workspace-verzeichnis">
          <div className={styles.cardHeader}><div><span className={styles.eyebrow}>Verzeichnis</span><h2>Alle Workspaces</h2></div><span className={styles.badge}>{workspaces.length} Einträge</span></div>
          {workspaces.length ? <div className={styles.workspaceDirectory}>{workspaces.map((workspace) => <Link className={styles.directoryItem} href={`/admin/billing/workspaces/${workspace.id}`} key={workspace.id}><strong>{workspace.name}</strong><span>{planLabel(workspace.plan_id)} · {getBillingStatusLabel(workspace.billing_status)}</span></Link>)}</div> : <div className={styles.emptyState}>Noch keine Kunden vorhanden.</div>}
        </section>
      </div>
    </AdminBillingShell>
  );
}
