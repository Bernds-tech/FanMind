import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/admin";
import { listAdminBillingMembers, listAdminBillingWorkspaces, listWorkspaceContactCounts, type AdminBillingMember, type AdminBillingWorkspace } from "@/lib/adminBilling";
import { getBillingStatusLabel } from "@/lib/billing";
import { getCommercialOptionLabel } from "@/lib/dashboardFeatures";
import { getStripeConfigStatus } from "@/lib/stripeBilling";
import { AdminBillingShell } from "./AdminBillingShell";
import styles from "./adminBilling.module.css";

const suspendedStatuses = new Set(["suspended", "manual_suspended"]);

type AdminBillingPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

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

function customerStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    active: "Aktiv",
    pending_payment_setup: "Offen",
    pending_sepa_mandate: "SEPA offen",
    past_due: "Überfällig",
    payment_failed: "Fehlgeschlagen",
    suspended: "Gesperrt",
    manual_suspended: "Manuell gesperrt",
    cancelled: "Gekündigt",
    expired: "Abgelaufen",
  };
  return status ? labels[status] ?? "Unbekannt" : "Unbekannt";
}

function getWorkspaceDate(workspace: AdminBillingWorkspace) {
  return workspace.created_at ?? workspace.billing_updated_at ?? null;
}

function getLastActivityDate(workspace: AdminBillingWorkspace) {
  return workspace.billing_updated_at ?? workspace.billing_last_payment_at ?? workspace.billing_last_payment_failed_at ?? workspace.created_at ?? null;
}

function sortByDateDesc(left: AdminBillingWorkspace, right: AdminBillingWorkspace) {
  return new Date(getWorkspaceDate(right) ?? 0).getTime() - new Date(getWorkspaceDate(left) ?? 0).getTime();
}

function planLabel(planId?: string | null) {
  if (planId === "pilot") return "Pilot";
  if (planId === "starter") return "Starter";
  if (planId === "growth") return "Growth";
  if (planId === "agency") return "Agency";
  return planId ?? "—";
}

function compactOptionLabel(option?: string | null) {
  if (option === "pilot") return "Pilot / Setup";
  if (option === "starter_flex" || option === "starter_no_setup_commitment") return "Starter Flex";
  if (option === "starter_12m" || option === "starter_paid_setup") return "Starter 12 Monate";
  const label = getCommercialOptionLabel(option ?? "");
  return label.length > 18 ? `${label.slice(0, 15)}…` : label;
}

function readablePlan(workspace: AdminBillingWorkspace) {
  if (workspace.plan_id === "growth") return "Growth";
  if (workspace.plan_id === "agency") return "Agency";
  return compactOptionLabel(workspace.commercial_option) || planLabel(workspace.plan_id);
}

function initials(value?: string | null) {
  const source = value?.trim() || "Workspace";
  const parts = source.split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : source.slice(0, 2)).toUpperCase();
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function StatCard({ icon, label, value, hint, trend, tone }: { icon: string; label: string; value: string | number; hint: string; trend: string; tone: string }) {
  return (
    <article className={styles.crmKpiCard}>
      <span className={`${styles.crmKpiIcon} ${tone}`}>{icon}</span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{hint}</small>
        <em>{trend}</em>
      </div>
    </article>
  );
}

function AdminTabs({ activeTab }: { activeTab: "overview" | "customers" }) {
  return (
    <nav className={styles.dashboardTabs} aria-label="Adminbereiche">
      <Link className={activeTab === "overview" ? styles.activeTab : undefined} href="/admin/billing">Übersicht</Link>
      <Link className={activeTab === "customers" ? styles.activeTab : undefined} href="/admin/billing?tab=customers">Kunden &amp; Nutzer</Link>
      <span>Pakete &amp; Freigaben</span>
      <span>Zahlungen</span>
      <span>Abos <small>Später</small></span>
    </nav>
  );
}

function OverviewContent({ workspaces, error }: { workspaces: AdminBillingWorkspace[]; error: string | null }) {
  const stripe = getStripeConfigStatus();
  const active = workspaces.filter((w) => w.billing_status === "active").length;
  const pilotDemos = workspaces.filter((w) => w.plan_id === "pilot" || w.commercial_option === "pilot").length;
  const openPayments = workspaces.filter((w) => w.billing_status?.startsWith("pending") || w.billing_status === "past_due" || w.billing_status === "payment_failed").length;
  const recentlyUpdated = workspaces.filter((w) => w.billing_updated_at || w.billing_admin_note).length;
  const aiConfigured = Boolean(process.env.OPENAI_API_KEY);
  const recentWorkspaces = [...workspaces].sort(sortByDateDesc).slice(0, 5);
  const activityItems = [...workspaces].filter((w) => w.billing_updated_at || w.billing_admin_note).sort((left, right) => new Date(right.billing_updated_at ?? 0).getTime() - new Date(left.billing_updated_at ?? 0).getTime()).slice(0, 5);
  const systemStatus = [["Datenbank", error ? "Eingeschränkt" : "Online", error ? styles.badgeWarn : styles.badgeOk], ["API & Dienste", "Online", styles.badgeOk], ["Dateispeicher", "Unbekannt", styles.badge], ["E-Mail Versand", "Nicht konfiguriert", styles.badgeWarn], ["KI-Verarbeitung", aiConfigured ? "Aktiv" : "Nicht konfiguriert", aiConfigured ? styles.badgeOk : styles.badgeWarn], ["Integrationen", "Teilweise", styles.badgeWarn]] as const;
  const quickActions = [{ icon: "+", label: "Neuen Kunden anlegen", href: "/register?plan=starter", meta: "Starter-Registrierung", enabled: true }, { icon: "◆", label: "Pilot-Demo anlegen", href: "/register?plan=pilot", meta: "Pilot-Onboarding", enabled: true }, { icon: "↗", label: "Paket zuweisen", meta: "In Vorbereitung", enabled: false }, { icon: "@", label: "Nutzer einladen", meta: "In Vorbereitung", enabled: false }, { icon: "€", label: "Rechnung erstellen", meta: stripe.readyForCheckout ? "In Vorbereitung" : "Stripe unvollständig", enabled: false }];
  const roadmapItems = [["KI-gestützte Fan-Segmentierung", "In Entwicklung"], ["Automatisierte Kampagnen", "Roadmap"], ["Abo-Management für Kunden", "Geplant"], ["Erweiterte Reporting-Dashboards", "Roadmap"]] as const;

  return <>
    <section className={styles.crmKpiGrid} aria-label="Admin-Kennzahlen">
      <StatCard icon="👥" label="Kunden gesamt" value={workspaces.length} hint={workspaces.length ? "Echte Workspaces" : "Noch keine Daten"} trend="Live aus Admin-Billing" tone={styles.toneBlue} />
      <StatCard icon="✓" label="Aktive Workspaces" value={active} hint="Billing-Status aktiv" trend="Ohne Demo-Daten" tone={styles.toneGreen} />
      <StatCard icon="◆" label="Pilot-Demos" value={pilotDemos} hint="Plan oder Option Pilot" trend="Aus Workspace-Daten" tone={styles.toneViolet} />
      <StatCard icon="€" label="Offene Zahlungen" value={openPayments} hint="Pending, fehlgeschlagen oder überfällig" trend="Billing-Status" tone={styles.toneAmber} />
      <StatCard icon="AI" label="KI-Status" value={aiConfigured ? "Aktiv" : "Fehlt"} hint={aiConfigured ? "OpenAI-Key vorhanden" : "Nicht konfiguriert"} trend="Konfiguration" tone={aiConfigured ? styles.toneGreen : styles.toneRed} />
      <StatCard icon="↻" label="Letzte Admin-Aktionen" value={recentlyUpdated} hint={recentlyUpdated ? "Billing-Updates/Notizen" : "Noch keine Daten"} trend="Audit-Signal" tone={styles.toneCyan} />
    </section>
    {error ? <p className={styles.badgeWarn}>{error}</p> : null}
    <section className={styles.dashboardMiddleGrid}>
      <article className={`${styles.card} ${styles.recentCard}`}><div className={styles.cardHeader}><div><span className={styles.eyebrow}>CRM-Übersicht</span><h2>Kürzlich hinzugekommene Kunden/Workspaces</h2></div><span className={styles.badge}>{workspaces.length} gesamt</span></div>{recentWorkspaces.length ? <div className={styles.compactTable}><div className={styles.compactTableHead}><span>Kunde / Workspace</span><span>Plan</span><span>Nutzer</span><span>Erstellt am</span><span>Status</span></div>{recentWorkspaces.map((workspace) => <div className={styles.compactTableRow} key={workspace.id}><span><Link className={styles.workspaceLink} href={`/admin/billing/workspaces/${workspace.id}`}>{workspace.name}</Link><small>{workspace.id}</small></span><span>{planLabel(workspace.plan_id)}<small>{compactOptionLabel(workspace.commercial_option)}</small></span><span>—</span><span>{date(getWorkspaceDate(workspace))}</span><span><span className={statusClass(workspace.billing_status)}>{overviewStatusLabel(workspace)}</span></span></div>)}</div> : <div className={styles.emptyState}>Noch keine Workspaces vorhanden.</div>}<Link className={styles.textLink} href="/admin/billing?tab=customers">Alle Kunden anzeigen</Link></article>
      <article className={styles.card}><div className={styles.cardHeader}><div><span className={styles.eyebrow}>Direktzugriff</span><h2>Schnellaktionen</h2></div></div><div className={styles.quickActionList}>{quickActions.map((action) => action.enabled && action.href ? <Link className={styles.quickAction} href={action.href} key={action.label}><span className={styles.actionIcon}>{action.icon}</span><span><strong>{action.label}</strong><small>{action.meta}</small></span><b aria-hidden="true">→</b></Link> : <div className={`${styles.quickAction} ${styles.disabledAction}`} key={action.label}><span className={styles.actionIcon}>{action.icon}</span><span><strong>{action.label}</strong><small>{action.meta}</small></span><b aria-hidden="true">→</b></div>)}</div></article>
      <article className={styles.card}><div className={styles.cardHeader}><div><span className={styles.eyebrow}>Betrieb</span><h2>Systemstatus</h2></div></div><div className={styles.statusList}>{systemStatus.map(([label, status, className]) => <div className={styles.statusItem} key={label}><span className={styles.statusLabel}><span className={styles.statusIcon} aria-hidden="true" />{label}</span><span className={className}>{status}</span></div>)}</div><p className={styles.muted}>Status aus vorhandener Konfiguration; unsichere Dienste bleiben neutral.</p></article>
    </section>
    <section className={styles.dashboardBottomGrid}><article className={styles.card}><div className={styles.cardHeader}><div><span className={styles.eyebrow}>Produkt</span><h2>Feature-Roadmap &amp; Sichtbarkeit</h2></div><Link className={styles.textLink} href="/roadmap">Roadmap ansehen</Link></div><div className={styles.roadmapList}>{roadmapItems.map(([label, status]) => <div className={styles.roadmapItem} key={label}><strong>{label}</strong><span className={status === "In Entwicklung" ? styles.badgeOk : status === "Geplant" ? styles.badgeWarn : styles.badge}>{status}</span></div>)}</div></article><article className={`${styles.card} ${styles.activityCard}`}><div className={styles.cardHeader}><div><span className={styles.eyebrow}>Audit</span><h2>Letzte Aktivitäten (Audit-Log)</h2></div></div>{activityItems.length ? <ul className={styles.timeline}>{activityItems.map((workspace) => <li className={styles.timelineItem} key={workspace.id}><span className={styles.timelineDot} /><div><strong>{workspace.name}</strong><p>{workspace.billing_admin_note ? "Admin-Notiz gespeichert" : "Billing-Daten aktualisiert"}</p></div><time>{date(workspace.billing_updated_at)}</time></li>)}</ul> : <div className={styles.emptyState}>Noch keine Admin-Aktivitäten gespeichert.</div>}</article></section>
  </>;
}

function CustomersContent({ workspaces, members, contactCounts, selectedWorkspaceId, error, memberError }: { workspaces: AdminBillingWorkspace[]; members: AdminBillingMember[]; contactCounts: Map<string, number>; selectedWorkspaceId?: string; error: string | null; memberError: string | null }) {
  const selectedWorkspace = workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? workspaces[0] ?? null;
  const workspaceRows = [...workspaces].sort(sortByDateDesc).slice(0, 10);
  const selectedMembers = selectedWorkspace ? members.filter((member) => member.workspace_id === selectedWorkspace.id) : [];
  const newestCreatedAt = Math.max(0, ...workspaces.map((workspace) => new Date(workspace.created_at ?? 0).getTime()).filter(Number.isFinite));
  const newRegistrations = workspaces.filter((workspace) => {
    if (!workspace.created_at || !newestCreatedAt) return false;
    const createdAt = new Date(workspace.created_at).getTime();
    return Number.isFinite(createdAt) && newestCreatedAt - createdAt <= 30 * 24 * 60 * 60 * 1000;
  }).length;
  const suspended = workspaces.filter((workspace) => suspendedStatuses.has(workspace.billing_status ?? "")).length;

  return <>
    <section className={styles.crmKpiGrid} aria-label="Kunden- und Nutzer-Kennzahlen">
      <StatCard icon="◎" label="Kunden gesamt" value={workspaces.length} hint={workspaces.length ? "Echte Workspaces" : "Noch keine Daten"} trend="Aus Admin-Billing" tone={styles.toneBlue} />
      <StatCard icon="👤" label="Aktive Nutzer" value={members.length} hint={members.length ? "Workspace-Mitglieder" : "Keine Mitglieder geladen"} trend="Echte Mitgliedschaften" tone={styles.toneGreen} />
      <StatCard icon="↗" label="Neue Registrierungen" value={newRegistrations} hint="Workspaces der letzten 30 Tage" trend="Nach created_at" tone={styles.toneCyan} />
      <StatCard icon="⛔" label="Gesperrte Zugänge" value={suspended} hint="Suspended oder manuell gesperrt" trend="Billing-Status" tone={styles.toneRed} />
      <StatCard icon="✉" label="Offene Einladungen" value={0} hint="Keine Einladungsquelle vorhanden" trend="Sauberer Fallback" tone={styles.toneAmber} />
    </section>
    {error ? <p className={styles.badgeWarn}>{error}</p> : null}
    {memberError ? <p className={styles.badgeWarn}>{memberError}</p> : null}
    <section className={styles.customerWorkspaceGrid}>
      <article className={`${styles.card} ${styles.customerTableCard}`}>
        <div className={styles.cardHeader}><div><span className={styles.eyebrow}>CRM-Verzeichnis</span><h2>Kunden / Workspaces</h2></div><span className={styles.badge}>{workspaces.length} Einträge</span></div>
        <div className={styles.filterBar}><input className={styles.input} placeholder="Suchen nach Kunde oder Workspace..." disabled /><select className={styles.select} disabled><option>Alle Pakete</option></select><select className={styles.select} disabled><option>Alle Status</option></select><button className={styles.buttonSecondary} disabled>Filter</button></div>
        {workspaceRows.length ? <div className={styles.customerTable}><div className={styles.customerTableHead}><span>Kunde</span><span>Workspace</span><span>Paket</span><span>Nutzer</span><span>Status</span><span>Letzte Aktivität</span><span>Aktion</span></div>{workspaceRows.map((workspace) => { const count = members.filter((member) => member.workspace_id === workspace.id).length; return <div className={styles.customerTableRow} key={workspace.id}><span className={styles.identityCell}><span className={styles.avatar}>{initials(workspace.name)}</span><span><strong>{workspace.name}</strong><small>{workspace.owner_user_id ? `Owner ${workspace.owner_user_id.slice(0, 8)}…` : "Owner nicht hinterlegt"}</small></span></span><span><Link className={styles.workspaceLink} href={`/admin/billing?tab=customers&workspace=${workspace.id}`}>{workspace.name}</Link><small>{workspace.id}</small></span><span>{readablePlan(workspace)}</span><span>{count || "—"}</span><span><span className={statusClass(workspace.billing_status)}>{customerStatusLabel(workspace.billing_status)}</span></span><span>{date(getLastActivityDate(workspace))}</span><span><Link className={styles.buttonSecondary} href={`/admin/billing/workspaces/${workspace.id}`}>Details ansehen</Link></span></div>; })}</div> : <div className={styles.emptyState}>Noch keine echten Workspaces vorhanden.</div>}
      </article>
      <aside className={`${styles.card} ${styles.customerDetailPanel}`}>
        <div className={styles.cardHeader}><div><span className={styles.eyebrow}>Auswahl</span><h2>Kundendetails</h2></div>{selectedWorkspace ? <span className={statusClass(selectedWorkspace.billing_status)}>{customerStatusLabel(selectedWorkspace.billing_status)}</span> : null}</div>
        {selectedWorkspace ? <><div className={styles.detailHero}><span className={styles.avatarLarge}>{initials(selectedWorkspace.name)}</span><div><strong>{selectedWorkspace.name}</strong><small>{selectedWorkspace.id}</small></div></div><dl className={styles.customerDetailList}><div><dt>Owner</dt><dd>{selectedWorkspace.owner_user_id ?? "Nicht hinterlegt"}</dd></div><div><dt>Paket</dt><dd>{readablePlan(selectedWorkspace)} · {selectedWorkspace.commitment_months ? `${selectedWorkspace.commitment_months} Monate` : "Laufzeit offen"}</dd></div><div><dt>Kontakte/Fans</dt><dd>{contactCounts.get(selectedWorkspace.id) ?? "—"}</dd></div><div><dt>Notizen</dt><dd>{selectedWorkspace.billing_admin_note || "Noch keine Notiz."}</dd></div><div><dt>Zuletzt bearbeitet</dt><dd>{date(selectedWorkspace.billing_updated_at ?? selectedWorkspace.created_at)}</dd></div></dl><div className={styles.panelActions}><Link className={styles.buttonPrimary} href={`/admin/billing/workspaces/${selectedWorkspace.id}`}>Workspace öffnen</Link><button className={styles.buttonSecondary} disabled>Paket ändern · in Vorbereitung</button><form action={`/api/admin/billing/workspaces/${selectedWorkspace.id}/suspend`} method="post"><button className={styles.buttonDanger}>Zugang sperren</button></form><button className={styles.buttonSecondary} disabled>Einladung senden · in Vorbereitung</button></div>{selectedMembers.length ? <div className={styles.memberMiniList}><strong>Teammitglieder</strong>{selectedMembers.slice(0, 4).map((member) => <span key={member.id}>{member.display_name ?? member.email ?? member.user_id}<small>{member.role ?? "Mitglied"}</small></span>)}</div> : <p className={styles.muted}>Keine Teammitglieder für diesen Workspace geladen.</p>}</> : <div className={styles.emptyState}>Wähle einen Workspace aus, sobald echte Daten vorhanden sind.</div>}
      </aside>
    </section>
    <article className={`${styles.card} ${styles.teamCard}`}><div className={styles.cardHeader}><div><span className={styles.eyebrow}>Nutzerverwaltung</span><h2>Eingeladene Nutzer / Teammitglieder</h2></div><span className={styles.badge}>{members.length} aktive Mitglieder</span></div><div className={styles.filterBar}><input className={styles.input} placeholder="Namen oder E-Mail suchen..." disabled /><select className={styles.select} disabled><option>Alle Rollen</option></select><select className={styles.select} disabled><option>Alle Status</option></select></div>{members.length ? <div className={styles.teamTable}><div className={styles.teamTableHead}><span>Name</span><span>E-Mail</span><span>Rolle</span><span>Kunde / Workspace</span><span>Status</span><span>Eingeladen am</span><span>Aktion</span></div>{members.slice(0, 10).map((member) => { const workspace = workspaces.find((item) => item.id === member.workspace_id); return <div className={styles.teamTableRow} key={member.id}><span>{member.display_name ?? "—"}</span><span>{member.email ?? "—"}</span><span>{member.role ?? "Mitglied"}</span><span>{workspace?.name ?? member.workspace_id}</span><span><span className={styles.badgeOk}>Aktiv</span></span><span>{date(member.created_at)}</span><span>{workspace ? <Link className={styles.buttonSecondary} href={`/admin/billing/workspaces/${workspace.id}`}>Workspace</Link> : "—"}</span></div>; })}</div> : <div className={styles.emptyState}>Noch keine offenen Einladungen vorhanden.</div>}<div className={styles.footerActions}><button className={styles.buttonSecondary} disabled>Alle Einladungen anzeigen · in Vorbereitung</button><button className={styles.buttonSecondary} disabled>Nutzerverwaltung öffnen · in Vorbereitung</button></div></article>
  </>;
}

export default async function AdminBillingPage({ searchParams }: AdminBillingPageProps) {
  const user = await requirePlatformAdmin();
  const params = await searchParams;
  const activeTab = getSingleParam(params.tab) === "customers" ? "customers" : "overview";
  const selectedWorkspaceId = getSingleParam(params.workspace);
  const [{ workspaces, error }, { members, error: memberError }, { counts: contactCounts }] = await Promise.all([listAdminBillingWorkspaces(), listAdminBillingMembers(), listWorkspaceContactCounts()]);

  return (
    <AdminBillingShell user={user} title="Adminbereich" subtitle="Verwalte Kunden, Workspaces, Pakete und Systemeinstellungen.">
      <div className={styles.adminStack}>
        <AdminTabs activeTab={activeTab} />
        {activeTab === "customers" ? <CustomersContent workspaces={workspaces} members={members} contactCounts={contactCounts} selectedWorkspaceId={selectedWorkspaceId} error={error} memberError={memberError} /> : <OverviewContent workspaces={workspaces} error={error} />}
      </div>
    </AdminBillingShell>
  );
}
