import { redirect } from "next/navigation";
import {
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  signOutSupabaseServerSession,
  type WorkspaceDashboardRow,
} from "@/lib/supabase/server";
import {
  getCommercialOptionLabel,
  getDashboardFeatureGroups,
  getDashboardStatusLabel,
  getDashboardStatusText,
  type ResolvedDashboardFeature,
} from "@/lib/dashboardFeatures";
import styles from "./dashboard.module.css";

type WorkspaceDetailsProps = {
  workspace: WorkspaceDashboardRow;
  email?: string;
};

type WorkspaceDisplay = {
  packageName: string;
  commercialOptionName: string;
  setupFeeLabel: string;
  monthlyFeeLabel: string;
  commitmentLabel: string;
  planHint: string;
  packageSummary: string;
  contractNote: string;
};

type KpiCard = {
  label: string;
  value: string;
  helper: string;
  tone: "blue" | "cyan" | "violet" | "green" | "amber";
};

type ContactPreviewRow = {
  name: string;
  context: string;
  nextStep: string;
  status: string;
};

const euroFormatter = new Intl.NumberFormat("de-DE", {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

async function logout() {
  "use server";

  await signOutSupabaseServerSession();
  redirect("/login");
}

function formatEuro(cents: number): string {
  return `${euroFormatter.format(cents / 100)} €`;
}

function getWorkspaceDisplay(workspace: WorkspaceDashboardRow): WorkspaceDisplay {
  const setupFee = formatEuro(workspace.setup_fee_cents);
  const monthlyFee = formatEuro(workspace.monthly_fee_cents);

  if (workspace.plan_id === "pilot" && workspace.commercial_option === "pilot_only") {
    return {
      packageName: "Pilot / Setup",
      commercialOptionName: getCommercialOptionLabel(workspace.commercial_option),
      setupFeeLabel: setupFee,
      monthlyFeeLabel: monthlyFee,
      commitmentLabel: "keine",
      planHint: "Pilot / Setup · Demo-/Setupmonat",
      packageSummary: "Demo-/Setupmonat mit Sandra M. und sicheren Testdaten.",
      contractNote: "Du arbeitest im sicheren Demo-/Setupmodus. Sandra M., KI-Demo, Memory-Demo und Follow-up-Demo sind vorbereitet; produktive Daten und Versand bleiben getrennt.",
    };
  }

  if (workspace.plan_id === "starter" && workspace.commercial_option === "starter_12m_setup_waived") {
    return {
      packageName: "Starter",
      commercialOptionName: getCommercialOptionLabel(workspace.commercial_option),
      setupFeeLabel: `${setupFee} statt ${formatEuro(99000)}`,
      monthlyFeeLabel: monthlyFee,
      commitmentLabel: "12 Monate",
      planHint: "Starter · produktiver MVP-Kern",
      packageSummary: "Produktiver MVP-Kern mit Kontakten, CSV-Import, Memory und Follow-ups.",
      contractNote: "Der produktive MVP-Kern ist aktiv: Kontakte, CSV-Import, ein Profil, Memory und Follow-ups. KI-Vorschläge bleiben bewusst limitiert und werden manuell geprüft.",
    };
  }

  if (workspace.plan_id === "starter" && workspace.commercial_option === "starter_paid_setup") {
    return {
      packageName: "Starter",
      commercialOptionName: getCommercialOptionLabel(workspace.commercial_option),
      setupFeeLabel: setupFee,
      monthlyFeeLabel: monthlyFee,
      commitmentLabel: "keine 12-Monatsbindung",
      planHint: "Starter · produktiver MVP-Kern",
      packageSummary: "Produktiver MVP-Kern mit Kontakten, CSV-Import, Memory und Follow-ups.",
      contractNote: "Produktiver Starter-Einstieg ohne feste Bindung: Kontakte, CSV-Import, ein Profil, Memory und Follow-ups sind aktiv; KI-Vorschläge bleiben limitiert.",
    };
  }

  if (workspace.plan_id === "growth") {
    return {
      packageName: "Growth",
      commercialOptionName: getCommercialOptionLabel(workspace.commercial_option),
      setupFeeLabel: setupFee,
      monthlyFeeLabel: monthlyFee,
      commitmentLabel: workspace.commitment_months > 0 ? `${workspace.commitment_months} Monate` : "noch nicht produktiv gebucht",
      planHint: "Growth · Vorschau",
      packageSummary: "Growth-Funktionen bleiben Vorschau und werden nicht als aktive Vollversion angezeigt.",
      contractNote: "Growth wird im Dashboard als Vorschau gezeigt. Erweiterte Profile, Segmente und höhere Nutzung werden vorbereitet, aber nicht als produktive Vollversion verkauft.",
    };
  }

  if (workspace.plan_id === "agency") {
    return {
      packageName: "Agency",
      commercialOptionName: getCommercialOptionLabel(workspace.commercial_option),
      setupFeeLabel: setupFee,
      monthlyFeeLabel: monthlyFee,
      commitmentLabel: workspace.commitment_months > 0 ? `${workspace.commitment_months} Monate` : "Demo / Erstgespräch",
      planHint: "Agency · Demo/Erstgespräch/Vorschau",
      packageSummary: "Agency-Funktionen bleiben Demo-/Erstgesprächsmodus und sind nicht produktiv freigeschaltet.",
      contractNote: "Agency ist als Demo- und Erstgesprächsmodus markiert. Multi-Client, Teamstruktur und Agentur-Workflow sind Vorschau und nicht produktiv freigeschaltet.",
    };
  }

  return {
    packageName: workspace.plan_id,
    commercialOptionName: getCommercialOptionLabel(workspace.commercial_option),
    setupFeeLabel: setupFee,
    monthlyFeeLabel: monthlyFee,
    commitmentLabel: workspace.commitment_months > 0 ? `${workspace.commitment_months} Monate` : "keine",
    planHint: "Workspace geladen · Paket geprüft",
    packageSummary: "Workspace geladen; sichtbare Module richten sich nach Paket und Vertrag.",
    contractNote: "Workspace-Daten wurden geladen. Die sichtbaren Dashboard-Module werden aus plan_id und commercial_option abgeleitet.",
  };
}

function findFeature(features: ResolvedDashboardFeature[], key: string): ResolvedDashboardFeature | undefined {
  return features.find((feature) => feature.key === key);
}

function canShowContactAction(feature?: ResolvedDashboardFeature): boolean {
  return feature ? ["active", "demo", "limited"].includes(feature.status) : false;
}

function getKpiCards(workspace: WorkspaceDashboardRow): KpiCard[] {
  if (workspace.plan_id === "pilot") {
    return [
      { label: "Paket", value: "Pilot / Setup", helper: "Demo · Setupmodus", tone: "blue" },
      { label: "Demo-Kontakte", value: "3", helper: "Sandra M., Alex K., Ella L.", tone: "cyan" },
      { label: "Nächster Schritt", value: "KI-Demo testen", helper: "Mensch prüft vor Versand", tone: "violet" },
      { label: "Status", value: "MVP-Kern aktiv", helper: "Demo · Noch keine echten Kontaktdaten", tone: "green" },
    ];
  }

  if (workspace.plan_id === "starter") {
    return [
      { label: "Kontakte", value: "Noch keine", helper: "Produktiv bereit · Demo leer", tone: "blue" },
      { label: "Offene Follow-ups", value: "0", helper: "Bereit für manuelle Aufgaben", tone: "cyan" },
      { label: "KI-Vorschläge", value: "Limitiert", helper: "Mensch prüft und sendet selbst", tone: "violet" },
      { label: "CSV-Import", value: "Aktiv", helper: "Produktiver MVP-Einstieg", tone: "green" },
      { label: "Status", value: "MVP-Kern aktiv", helper: "Kontakt anlegen oder CSV importieren", tone: "amber" },
    ];
  }

  return [
    { label: "Paket", value: workspace.plan_id === "growth" ? "Growth" : "Agency", helper: "Vorschau · Nicht als Vollversion aktiv", tone: "blue" },
    { label: "Kontakte", value: "Vorschau", helper: "Noch keine produktive Engine", tone: "cyan" },
    { label: "KI-Vorschläge", value: "Vorschau", helper: "Keine automatische Aktion", tone: "violet" },
    { label: "Status", value: "Demo/Preview", helper: "Erstgespräch und Roadmap klar getrennt", tone: "green" },
  ];
}

function getNextBestAction(workspace: WorkspaceDashboardRow): { title: string; text: string; cta: string } {
  if (workspace.plan_id === "pilot") {
    return {
      title: "Sandra M. öffnen und KI-Vorschlag testen",
      text: "Nutze den Demo-Kontakt, um Memory, manuelle Antwortvorschläge und Follow-up-Vorbereitung ohne produktive Daten zu prüfen.",
      cta: "Demo-Kontakt ansehen",
    };
  }

  if (workspace.plan_id === "starter") {
    return {
      title: "Ersten Kontakt anlegen oder CSV importieren",
      text: "Starte mit einem einzelnen Kontakt oder bereite eine CSV-Liste vor. FanMind sendet nichts automatisch.",
      cta: "Kontakt anlegen",
    };
  }

  return {
    title: "Vorschau prüfen und MVP-Scope abstimmen",
    text: "Growth/Agency-Module werden als Vorschau gezeigt. Produktive Freischaltung, Integrationen und Kampagnenlogik sind nicht aktiv.",
    cta: "Roadmap ansehen",
  };
}

function getContactRows(workspace: WorkspaceDashboardRow): ContactPreviewRow[] {
  if (workspace.plan_id === "pilot") {
    return [
      { name: "Sandra M.", context: "VIP-Fan · Demo", nextStep: "KI-Vorschlag testen", status: "Demo" },
      { name: "Alex K.", context: "Newsletter · Demo", nextStep: "Follow-up vormerken", status: "Demo" },
      { name: "Ella L.", context: "Event-Lead · Demo", nextStep: "Memory prüfen", status: "Demo" },
    ];
  }

  if (workspace.plan_id === "starter") {
    return [];
  }

  return [
    { name: "Kontaktvorschau", context: "Preview-Datensatz", nextStep: "Scope klären", status: "Vorschau" },
    { name: "Segmentvorschau", context: "Nicht produktiv", nextStep: "Upgrade/Roadmap prüfen", status: "Vorschau" },
  ];
}

function FeaturePill({ feature }: { feature: ResolvedDashboardFeature }) {
  return (
    <article className={`${styles.featurePill} ${styles[`status-${feature.status}`]}`}>
      <div>
        <h3>{feature.label}</h3>
        <p>{getDashboardStatusText(feature.status, feature.minPlan)}</p>
      </div>
      <span>{getDashboardStatusLabel(feature.status)}</span>
    </article>
  );
}

function SidebarItem({ label, meta, active = false, href }: { label: string; meta?: string; active?: boolean; href: string }) {
  return (
    <a className={active ? styles.navItemActive : styles.navItem} href={href}>
      <span>{label}</span>
      {meta ? <small>{meta}</small> : null}
    </a>
  );
}

function WorkspaceDetails({ workspace, email }: WorkspaceDetailsProps) {
  const display = getWorkspaceDisplay(workspace);
  const featureGroups = getDashboardFeatureGroups(workspace.plan_id, workspace.commercial_option);
  const allVisibleFeatures = [
    ...featureGroups.active,
    ...featureGroups.demoLimited,
    ...featureGroups.later,
    ...featureGroups.roadmap,
  ].filter((feature) => feature.key !== "automatic_sending");
  const compactFeatures = allVisibleFeatures
    .filter((feature) => feature.key !== "roadmap")
    .slice(0, 6);
  const csvFeature = findFeature(allVisibleFeatures, "csv_import");
  const contactsFeature = findFeature(allVisibleFeatures, "contacts");
  const nextBestAction = getNextBestAction(workspace);
  const contactRows = getContactRows(workspace);
  const kpiCards = getKpiCards(workspace);

  return (
    <div className={styles.dashboardShell}>
      <aside className={styles.sidebar} aria-label="FanMind Navigation">
        <div className={styles.logoBlock}>
          <div className={styles.logoMark}>FM</div>
          <div>
            <strong>FanMind</strong>
            <small>CRM Workspace</small>
          </div>
        </div>

        <nav className={styles.navList}>
          <SidebarItem label="Dashboard" meta="Aktiv" active href="/dashboard" />
          <SidebarItem label="Kontakte" meta={contactsFeature ? getDashboardStatusLabel(contactsFeature.status) : "Vorschau"} href="#contacts" />
          <SidebarItem label="Follow-ups" href="#followups" />
          <SidebarItem label="KI-Vorschläge" href="#next-action" />
          <SidebarItem label="CSV-Import" meta={csvFeature ? getDashboardStatusLabel(csvFeature.status) : "Vorschau"} href="#csv-import" />
          <SidebarItem label="Roadmap" href="#roadmap" />
          <SidebarItem label="Einstellungen" href="#contract" />
        </nav>

        <section className={styles.workspaceMiniCard} aria-label="Workspace und User">
          <span>Workspace</span>
          <strong>{workspace.name}</strong>
          <p>{workspace.role} · {display.packageName}</p>
        </section>
      </aside>

      <div className={styles.dashboardContent}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.eyebrow}>Dashboard</p>
            <h1>Dashboard</h1>
            <p className={styles.topbarStatus}>Workspace geladen · {display.packageName} · Mensch prüft und sendet selbst</p>
          </div>
          <div className={styles.topbarActions}>
            <div className={styles.languageSwitch} aria-label="Sprachauswahl">
              <strong>DE</strong>
              <span>|</span>
              <span>EN</span>
            </div>
            {canShowContactAction(contactsFeature) ? <a className={styles.primaryButton} href="#contacts">+ Neuer Kontakt</a> : null}
            <form action={logout}>
              <button type="submit" className={styles.secondaryButton}>Abmelden</button>
            </form>
          </div>
        </header>

        <section className={styles.heroPanel} aria-label="Workspace-Status">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Workspace Status</p>
            <h2>{workspace.name}</h2>
            <p className={styles.heroMeta}>Eingeloggt als {email ?? "Nicht in der Supabase-Session enthalten"}</p>
            <div className={styles.badgeRow}>
              <span className={styles.safeBadge}>Kein automatisches Senden</span>
              <span className={styles.planBadge}>{display.planHint}</span>
            </div>
            <p className={styles.planSummary}>{display.packageSummary}</p>
          </div>
          <div className={styles.securityCard}>
            <strong>Human-in-the-loop</strong>
            <p>FanMind kann vorbereiten, priorisieren und Vorschläge anzeigen. Der Mensch prüft jede Nachricht und sendet selbst.</p>
          </div>
        </section>

        <section className={styles.kpiGrid} aria-label="KPI-Karten">
          {kpiCards.map((card) => (
            <article key={card.label} className={`${styles.kpiCard} ${styles[`tone-${card.tone}`]}`}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.helper}</p>
            </article>
          ))}
        </section>

        <div className={styles.mainGrid}>
          <section className={`${styles.moduleCard} ${styles.actionCard}`} id="next-action" aria-labelledby="next-action-title">
              <div className={styles.moduleHeader}>
                <p className={styles.eyebrow}>Nächste beste Aktion</p>
                <span>Manuell</span>
              </div>
              <h2 id="next-action-title">{nextBestAction.title}</h2>
              <p>{nextBestAction.text}</p>
              <a className={styles.inlineButton} href="#contacts">{nextBestAction.cta}</a>
              <p className={styles.safeText}>Nichts wird automatisch versendet.</p>
          </section>

          <section className={`${styles.moduleCard} ${styles.contactCard}`} id="contacts" aria-labelledby="contacts-title">
              <div className={styles.moduleHeader}>
                <p className={styles.eyebrow}>Kontakte / Follower Vorschau</p>
                <span>{workspace.plan_id === "starter" ? "Produktiv leer" : workspace.plan_id === "pilot" ? "Demo" : "Vorschau"}</span>
              </div>
              <h2 id="contacts-title">Kontaktpipeline</h2>
              {contactRows.length > 0 ? (
                <div className={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Kontext</th>
                        <th>Nächster Schritt</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contactRows.map((row) => (
                        <tr key={row.name}>
                          <td>{row.name}</td>
                          <td>{row.context}</td>
                          <td>{row.nextStep}</td>
                          <td><span className={styles.tableBadge}>{row.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <strong>Noch keine echten Daten</strong>
                  <p>Starter ist bereit für produktive Kontakte. Lege den ersten Kontakt an oder starte den CSV-Import.</p>
                  <div className={styles.emptyActions}>
                    <a className={styles.inlineButton} href="#contacts">Kontakt anlegen</a>
                    <a className={styles.ghostButton} href="#contacts">CSV-Import starten</a>
                  </div>
                </div>
              )}
          </section>

          <aside className={styles.contextColumn} aria-label="Paket und Vertrag">
            <section className={styles.contextCard} id="contract" aria-labelledby="contract-title">
              <p className={styles.eyebrow}>Paket & Vertrag</p>
              <h2 id="contract-title">{display.packageName}</h2>
              <dl className={styles.details}>
                <div>
                  <dt>plan_id</dt>
                  <dd>{workspace.plan_id}</dd>
                </div>
                <div>
                  <dt>commercial_option</dt>
                  <dd>{workspace.commercial_option}</dd>
                </div>
                <div>
                  <dt>Einrichtung</dt>
                  <dd>{display.setupFeeLabel}</dd>
                </div>
                <div>
                  <dt>Monatlich</dt>
                  <dd>{display.monthlyFeeLabel}</dd>
                </div>
                <div>
                  <dt>Bindung</dt>
                  <dd>{display.commitmentLabel}</dd>
                </div>
              </dl>
              <p>{display.contractNote}</p>
            </section>
          </aside>
        </div>

        <section className={styles.bottomCards} aria-label="Kompakte Arbeitsmodule">
          <article id="memory">
            <span>Fan-Gedächtnis</span>
            <strong>{workspace.plan_id === "pilot" ? "Memory-Demo aktiv" : "Kontext bereit"}</strong>
            <p>{workspace.plan_id === "starter" ? "Merkt relevante Kontaktinfos, sobald echte Kontakte entstehen." : "Zeigt, wie Kontext für manuelle Antworten genutzt wird."}</p>
          </article>
          <article id="followups">
            <span>Follow-ups</span>
            <strong>{workspace.plan_id === "starter" ? "Produktiver Einstieg" : "Demo/Vorschau"}</strong>
            <p>Manuelle nächste Schritte und Erinnerungen, ohne automatische Nachrichten.</p>
          </article>
          <article id="roadmap">
            <span>Roadmap</span>
            <strong>Upgrade klar getrennt</strong>
            <p>Analytics, Kampagnen und Integrationen bleiben Vorschau oder Roadmap.</p>
          </article>
        </section>

        <section className={styles.featureSection} aria-labelledby="features-title">
          <div>
            <p className={styles.eyebrow}>Paketabhängige Funktionen</p>
            <h2 id="features-title">Kompakt statt Statusseite</h2>
            <p>Feature-Gating nutzt weiterhin plan_id und commercial_option; Upgrade- und Roadmap-Funktionen bleiben getrennt.</p>
          </div>
          <div className={styles.featurePillGrid}>
            {compactFeatures.map((feature) => (
              <FeaturePill key={feature.key} feature={feature} />
            ))}
          </div>
          <div className={styles.featureSplit}>
            <span>Upgrade: {featureGroups.later.filter((feature) => feature.key !== "automatic_sending").length}</span>
            <span>Roadmap/Vorschau: {featureGroups.roadmap.filter((feature) => feature.key !== "automatic_sending").length}</span>
          </div>
        </section>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const { data, error: userError } = await getSupabaseServerUser();

  if (!data.user) {
    redirect("/login");
  }

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  const workspace = workspaceResult.workspace;

  return (
    <main className={styles.page}>
      {workspace ? <WorkspaceDetails workspace={workspace} email={data.user.email} /> : (
        <section className={styles.fallbackCard} aria-label="FanMind Workspace">
          <div>
            <p className={styles.eyebrow}>FanMind Dashboard</p>
            <h1>Workspace-Status</h1>
            <p>Dashboard geschützt: Supabase Auth ist aktiv. Für deinen Account wurde noch kein Workspace gefunden.</p>
          </div>
          {userError ? (
            <p className={styles.error}>
              <strong>Supabase-Session konnte nicht vollständig geprüft werden.</strong>
              <span>{userError.message}</span>
            </p>
          ) : null}
          {workspaceResult.error ? (
            <p className={styles.error}>
              <strong>Workspace-Daten konnten nicht geladen werden.</strong>
              <span>{workspaceResult.error.message}</span>
            </p>
          ) : null}
          <form action={logout}>
            <button type="submit" className={styles.secondaryButton}>Abmelden</button>
          </form>
        </section>
      )}
    </main>
  );
}
