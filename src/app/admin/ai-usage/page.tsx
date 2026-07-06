import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/admin";
import { getAdminAiUsageSummary } from "@/lib/adminAiUsage";
import styles from "../billing/adminBilling.module.css";

type Props = { searchParams: Promise<{ days?: string }> };

function money(cents: number, currency: string) { return `${(cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} ${currency}`; }
function date(value: string) { return new Date(value).toLocaleString("de-DE"); }

export default async function AdminAiUsagePage({ searchParams }: Props) {
  await requirePlatformAdmin();
  const params = await searchParams;
  const days = Number(params.days ?? 30) || 30;
  const { summary, error } = await getAdminAiUsageSummary(days);

  return <div className={styles.adminStack}>
    <nav className={styles.dashboardTabs} aria-label="Adminbereiche"><Link href="/admin/billing">Billing</Link><Link className={styles.activeTab} href="/admin/ai-usage">KI-Verbrauch</Link><Link href="/admin/roadmap">Roadmap</Link><Link href="/admin/inquiries">Anfragen</Link></nav>
    <section className={styles.hero}><span className={styles.eyebrow}>Admin · geschätzt</span><h1>KI-Verbrauch</h1><p>Workspace-, Feature- und Zeitraum-Auswertung. Alle Token- und Kostenwerte sind geschätzt, basieren auf Zeichenlänge und sind nicht abrechnungsgenau.</p></section>
    {error ? <div className={styles.emptyState}>{error}</div> : null}
    {summary ? <>
      <section className={styles.kpiGrid}><div className={styles.kpiCard}><span>Anfragen</span><strong>{summary.totalRequests}</strong><small>letzte {days} Tage</small></div><div className={styles.kpiCard}><span>Kosten geschätzt</span><strong>{money(summary.totalEstimatedCostCents, summary.currency)}</strong><small>serverseitig berechnet</small></div><div className={styles.kpiCard}><span>Tokens geschätzt</span><strong>{(summary.totalInputTokens + summary.totalOutputTokens).toLocaleString("de-DE")}</strong><small>Input + Output</small></div><div className={styles.kpiCard}><span>Fehler</span><strong>{summary.errorRequests}</strong><small>Status error</small></div></section>
      <section className={styles.dashboardBottomGrid}><article className={styles.card}><div className={styles.cardHeader}><div><span className={styles.eyebrow}>Workspaces</span><h2>Verbrauch pro Workspace</h2></div></div><div className={styles.compactTable}><div className={styles.compactTableHead}><span>Workspace</span><span>Anfragen</span><span>Kosten geschätzt</span><span>Tokens</span><span>Ø Kosten</span></div>{summary.byWorkspace.map((row) => <div className={styles.compactTableRow} key={row.workspaceId}><span><strong>{row.workspaceName}</strong><small>{row.workspaceId}</small></span><span>{row.requests}</span><span>{money(row.estimatedCostCents, summary.currency)}</span><span>{(row.inputTokens + row.outputTokens).toLocaleString("de-DE")}</span><span>{money(row.requests ? row.estimatedCostCents / row.requests : 0, summary.currency)}</span></div>)}</div></article>
      <article className={styles.card}><div className={styles.cardHeader}><div><span className={styles.eyebrow}>Features</span><h2>Verbrauch pro Feature</h2></div></div><div className={styles.compactTable}><div className={styles.compactTableHead}><span>Feature</span><span>Anfragen</span><span>Kosten geschätzt</span><span>Fehler</span></div>{summary.byFeature.map((row) => <div className={styles.compactTableRow} key={row.feature}><span>{row.feature}</span><span>{row.requests}</span><span>{money(row.estimatedCostCents, summary.currency)}</span><span>{row.errorRequests}</span></div>)}</div></article></section>
      <article className={styles.card}><div className={styles.cardHeader}><div><span className={styles.eyebrow}>Letzte Events</span><h2>Keine Prompt- oder Antwortvolltexte gespeichert</h2></div></div><div className={styles.compactTable}><div className={styles.compactTableHead}><span>Zeit</span><span>Workspace</span><span>Feature</span><span>Status</span><span>Latenz</span></div>{summary.recentEvents.map((event) => <div className={styles.compactTableRow} key={event.id}><span>{date(event.created_at)}</span><span>{event.workspace_id}</span><span>{event.feature}<small>{event.model}</small></span><span>{event.status}{event.error_code ? ` · ${event.error_code}` : ""}</span><span>{event.latency_ms ?? "—"} ms</span></div>)}</div></article>
    </> : null}
  </div>;
}
