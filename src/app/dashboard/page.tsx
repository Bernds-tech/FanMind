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

type TaskPreview = {
  title: string;
  person: string;
  due: string;
  status: string;
};

type ConversationPreview = {
  person: string;
  message: string;
  context: string;
};

type RecommendationPreview = {
  title: string;
  text: string;
  status: string;
};

type SidebarLink = {
  label: string;
  href: string;
  active?: boolean;
  featureKey?: string;
  fallback: string;
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
      packageSummary: "Demo-Arbeitsplatz mit sicheren Testdaten, Sandra M. und manuell geprüften KI-Vorschlägen.",
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
      packageSummary: "Produktiver MVP-Kern für Kontakte, CSV-Vorbereitung, Memory und manuelle Follow-ups.",
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
      packageSummary: "Produktiver MVP-Kern für Kontakte, CSV-Vorbereitung, Memory und manuelle Follow-ups.",
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
      { label: "Demo-Kontakte", value: "3", helper: "Sandra M., Alex K., Ella L. · Demo", tone: "blue" },
      { label: "Offene Follow-ups", value: "3", helper: "Demo-Aufgaben für manuelle Prüfung", tone: "cyan" },
      { label: "KI-Vorschläge", value: "Demo", helper: "Vorbereitet · kein automatisches Senden", tone: "violet" },
      { label: "CSV-Import", value: "Vorschau", helper: "Importfluss noch nicht produktiv", tone: "amber" },
      { label: "Status", value: "MVP-Kern aktiv", helper: "Setupdaten statt Live-Analytics", tone: "green" },
    ];
  }

  if (workspace.plan_id === "starter") {
    return [
      { label: "Kontakte", value: "Bereit", helper: "Produktiver Einstieg · noch kein Live-Zähler", tone: "blue" },
      { label: "Offene Follow-ups", value: "0", helper: "Bereit für manuelle Aufgaben", tone: "cyan" },
      { label: "KI-Vorschläge", value: "Limitiert", helper: "Mensch prüft und sendet selbst", tone: "violet" },
      { label: "CSV-Import", value: "Aktiv", helper: "MVP-Import vorbereitet", tone: "green" },
      { label: "Status", value: "MVP-Kern aktiv", helper: "Kontakt anlegen oder CSV importieren", tone: "amber" },
    ];
  }

  return [
    { label: "Paket", value: workspace.plan_id === "growth" ? "Growth" : "Agency", helper: "Vorschau · nicht als Vollversion aktiv", tone: "blue" },
    { label: "Kontakte", value: "Vorschau", helper: "Noch keine produktive Engine", tone: "cyan" },
    { label: "KI-Vorschläge", value: "Vorschau", helper: "Keine automatische Aktion", tone: "violet" },
    { label: "CSV-Import", value: "Roadmap", helper: "Scope vor Produktivstart klären", tone: "amber" },
    { label: "Status", value: "Demo/Preview", helper: "Erstgespräch und Roadmap getrennt", tone: "green" },
  ];
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

function getFollowUps(workspace: WorkspaceDashboardRow): TaskPreview[] {
  if (workspace.plan_id === "pilot") {
    return [
      { title: "Antwortidee für Sandra M. prüfen", person: "Sandra M.", due: "Heute", status: "Demo" },
      { title: "Event-Rückfrage vorbereiten", person: "Ella L.", due: "Morgen", status: "Demo" },
      { title: "Newsletter-Interesse markieren", person: "Alex K.", due: "Diese Woche", status: "Demo" },
    ];
  }

  if (workspace.plan_id === "starter") {
    return [
      { title: "Erstes Follow-up anlegen", person: "Noch kein Kontakt", due: "Bereit", status: "MVP" },
      { title: "CSV-Liste prüfen", person: "Import vorbereiten", due: "Optional", status: "MVP" },
    ];
  }

  return [
    { title: "Roadmap-Follow-ups abstimmen", person: "Workspace", due: "Vorschau", status: "Preview" },
  ];
}

function getConversations(workspace: WorkspaceDashboardRow): ConversationPreview[] {
  if (workspace.plan_id === "pilot") {
    return [
      { person: "Sandra M.", message: "Fragt nach dem nächsten Meet & Greet.", context: "Demo-Kontext für manuelle Antwort" },
      { person: "Alex K.", message: "Reagiert auf Newsletter-Thema.", context: "Demo-Memory: Newsletter" },
      { person: "Ella L.", message: "Möchte Eventinfos speichern.", context: "Demo-Follow-up vorbereitet" },
    ];
  }

  if (workspace.plan_id === "starter") {
    return [
      { person: "Noch keine Gespräche", message: "Lege Kontakte an oder bereite einen CSV-Import vor.", context: "Placeholder bis echte Kontakte/Nachrichten existieren" },
    ];
  }

  return [
    { person: "Preview", message: "Gesprächskontext wird im MVP-Scope vorbereitet.", context: "Nicht produktiv freigeschaltet" },
  ];
}

function getRecommendations(workspace: WorkspaceDashboardRow): RecommendationPreview[] {
  if (workspace.plan_id === "pilot") {
    return [
      { title: "Sandra persönlich antworten", text: "Kurzen Vorschlag prüfen, Meet-&-Greet-Kontext erwähnen und selbst senden.", status: "Demo" },
      { title: "Follow-up vormerken", text: "Ella L. nächste Woche manuell erinnern; FanMind erstellt nur die Aufgabe.", status: "Demo" },
    ];
  }

  if (workspace.plan_id === "starter") {
    return [
      { title: "Kontaktbasis aufbauen", text: "Ersten Kontakt anlegen oder CSV-Import vorbereiten, danach Vorschläge manuell prüfen.", status: "Limitiert" },
      { title: "Keine Auto-Aktionen", text: "KI dient als Arbeitsvorbereitung; jede Nachricht bleibt eine menschliche Entscheidung.", status: "Sicher" },
    ];
  }

  return [
    { title: "Preview sauber trennen", text: "Segmente, Kampagnen und Analytics bleiben Roadmap beziehungsweise Upgrade-Hinweis.", status: "Vorschau" },
  ];
}

function getFeatureMeta(feature?: ResolvedDashboardFeature, fallback = "Roadmap"): string {
  return feature ? getDashboardStatusLabel(feature.status) : fallback;
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
  const featureByKey = (key: string) => findFeature(allVisibleFeatures, key);
  const compactFeatures = allVisibleFeatures
    .filter((feature) => !["roadmap", "automatic_sending"].includes(feature.key))
    .slice(0, 6);
  const contactsFeature = featureByKey("contacts");
  const sidebarLinks: SidebarLink[] = [
    { label: "Dashboard", href: "/dashboard", active: true, fallback: "Aktiv" },
    { label: "Kontakte", href: "#contacts", featureKey: "contacts", fallback: "Vorschau" },
    { label: "Segmente", href: "#roadmap", featureKey: "segments", fallback: "Roadmap" },
    { label: "Follow-ups", href: "#followups", featureKey: "followups", fallback: "Vorschau" },
    { label: "Kampagnen", href: "#roadmap", featureKey: "campaigns", fallback: "Roadmap" },
    { label: "Analytics", href: "#roadmap", featureKey: "analytics", fallback: "Roadmap" },
    { label: "Einstellungen", href: "#contract", fallback: "Workspace" },
  ];
  const contactRows = getContactRows(workspace);
  const followUps = getFollowUps(workspace);
  const conversations = getConversations(workspace);
  const recommendations = getRecommendations(workspace);
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
          {sidebarLinks.map((item) => (
            <SidebarItem
              key={item.label}
              label={item.label}
              href={item.href}
              active={item.active}
              meta={item.active ? item.fallback : getFeatureMeta(item.featureKey ? featureByKey(item.featureKey) : undefined, item.fallback)}
            />
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <section className={styles.workspaceMiniCard} aria-label="Workspace und User">
            <span>Workspace</span>
            <strong>{workspace.name}</strong>
            <p>{workspace.role} · {email ?? "Supabase User"}</p>
          </section>
          <section className={styles.planMiniCard} aria-label="Paket Überblick">
            <span>Paket</span>
            <strong>{display.packageName}</strong>
            <p>{display.commercialOptionName}</p>
            <a href="#contract">Paket & Vertrag</a>
          </section>
        </div>
      </aside>

      <div className={styles.dashboardContent}>
        <header className={styles.topbar}>
          <div className={styles.titleCluster}>
            <p className={styles.eyebrow}>Willkommen zurück</p>
            <h1>Dashboard</h1>
            <p className={styles.topbarStatus}>Kein automatisches Senden – Mensch prüft und sendet selbst.</p>
          </div>
          <div className={styles.topbarActions}>
            <label className={styles.searchBox}>
              <span>Suche</span>
              <input type="search" placeholder="Kontakte, Follow-ups, Kontext" />
            </label>
            <button type="button" className={styles.filterChip}>Letzte 30 Tage</button>
            <button type="button" className={styles.filterChip}>Filter</button>
            {canShowContactAction(contactsFeature) ? (
              <a className={styles.primaryButton} href="#contacts">+ Neuer Kontakt</a>
            ) : null}
            <form action={logout}>
              <button type="submit" className={styles.secondaryButton}>Abmelden</button>
            </form>
          </div>
        </header>

        <section className={styles.workspaceStrip} aria-label="Workspace Status">
          <div>
            <p className={styles.eyebrow}>FanMind Arbeitsplatz</p>
            <h2>{workspace.name}</h2>
            <p>{display.packageSummary}</p>
          </div>
          <div className={styles.badgeRow}>
            <span className={styles.safeBadge}>Human-in-the-loop</span>
            <span className={styles.planBadge}>{display.planHint}</span>
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
          <section className={`${styles.moduleCard} ${styles.contactCard}`} id="contacts" aria-labelledby="contacts-title">
            <div className={styles.moduleHeader}>
              <div>
                <p className={styles.eyebrow}>Kontakte / Follower</p>
                <h2 id="contacts-title">Kontaktpipeline</h2>
              </div>
              <span>{workspace.plan_id === "starter" ? "Produktiver Einstieg" : workspace.plan_id === "pilot" ? "Demo-Daten" : "Vorschau"}</span>
            </div>
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
                <strong>Bereit für produktive Kontakte</strong>
                <p>Starter ist vorbereitet. Lege den ersten Kontakt an oder starte später den CSV-Import, sobald echte Daten vorhanden sind.</p>
                <div className={styles.emptyActions}>
                  <a className={styles.inlineButton} href="#contacts">Kontakt anlegen</a>
                  <a className={styles.ghostButton} href="#csv-import">CSV-Import starten</a>
                </div>
              </div>
            )}
          </section>

          <aside className={styles.sideStack} aria-label="Schnellaktionen und Vertrag">
            <section className={styles.quickActions} aria-labelledby="quick-actions-title">
              <div className={styles.moduleHeader}>
                <div>
                  <p className={styles.eyebrow}>Schnellaktionen</p>
                  <h2 id="quick-actions-title">Heute starten</h2>
                </div>
              </div>
              <div className={styles.actionList}>
                <a href="#contacts">Kontakt anlegen</a>
                <a href="#csv-import">CSV-Import starten</a>
                <a href="#followups">Follow-up erstellen</a>
                <a href="#contacts">Sandra M. öffnen</a>
                <a href="#roadmap">Roadmap öffnen</a>
              </div>
            </section>

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

        <section className={styles.panelGrid} aria-label="Arbeitsbereiche">
          <article className={styles.moduleCard} id="followups">
            <div className={styles.moduleHeader}>
              <div>
                <p className={styles.eyebrow}>Fällige Follow-ups</p>
                <h2>Manuelle nächste Schritte</h2>
              </div>
              <span>{workspace.plan_id === "starter" ? "MVP" : "Demo/Vorschau"}</span>
            </div>
            <div className={styles.taskList}>
              {followUps.map((task) => (
                <div key={`${task.title}-${task.person}`} className={styles.taskItem}>
                  <div>
                    <strong>{task.title}</strong>
                    <p>{task.person}</p>
                  </div>
                  <span>{task.due} · {task.status}</span>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.moduleCard}>
            <div className={styles.moduleHeader}>
              <div>
                <p className={styles.eyebrow}>Neueste Gespräche</p>
                <h2>Nachrichtenkontext</h2>
              </div>
              <span>Kein Versand</span>
            </div>
            <div className={styles.conversationList}>
              {conversations.map((conversation) => (
                <div key={`${conversation.person}-${conversation.message}`}>
                  <strong>{conversation.person}</strong>
                  <p>{conversation.message}</p>
                  <small>{conversation.context}</small>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.moduleCard} id="ai-suggestions">
            <div className={styles.moduleHeader}>
              <div>
                <p className={styles.eyebrow}>KI-Empfehlungen</p>
                <h2>Vorbereitet, nicht gesendet</h2>
              </div>
              <span>Manuell</span>
            </div>
            <div className={styles.recommendationList}>
              {recommendations.map((recommendation) => (
                <div key={recommendation.title}>
                  <span>{recommendation.status}</span>
                  <strong>{recommendation.title}</strong>
                  <p>{recommendation.text}</p>
                </div>
              ))}
            </div>
          </article>

          <article className={styles.moduleCard} id="csv-import">
            <div className={styles.moduleHeader}>
              <div>
                <p className={styles.eyebrow}>Import & Roadmap</p>
                <h2>CSV, Kampagnen, Analytics</h2>
              </div>
              <span>Roadmap</span>
            </div>
            <p className={styles.moduleText}>CSV ist im Starter-MVP vorbereitet. Kampagnen, Analytics und Integrationen werden nur als Vorschau gezeigt und nicht als aktive Vollversion verkauft.</p>
          </article>
        </section>

        <section className={styles.featureSection} id="roadmap" aria-labelledby="features-title">
          <div>
            <p className={styles.eyebrow}>Paketabhängige Funktionen</p>
            <h2 id="features-title">Dezente Statuslogik</h2>
            <p>Feature-Gating nutzt weiterhin plan_id und commercial_option; aktive, Demo-, limitierte und Roadmap-Funktionen bleiben kompakt getrennt.</p>
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
