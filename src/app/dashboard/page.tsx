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
  status: string;
  profile: string;
  source: string;
  tags: string[];
  score: number | string;
  lastContact: string;
  nextFollowUp: string;
};

type ChannelStatusCard = {
  channel: string;
  status: string;
  note: string;
  tone: "active" | "preview" | "roadmap";
};

type TaskPreview = {
  title: string;
  person: string;
  due: string;
  status: string;
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
  badge?: string;
  disabled?: boolean;
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

function getWorkspaceDisplay(
  workspace: WorkspaceDashboardRow,
): WorkspaceDisplay {
  const setupFee = formatEuro(workspace.setup_fee_cents);
  const monthlyFee = formatEuro(workspace.monthly_fee_cents);

  if (
    workspace.plan_id === "pilot" &&
    workspace.commercial_option === "pilot_only"
  ) {
    return {
      packageName: "Pilot / Setup",
      commercialOptionName: getCommercialOptionLabel(
        workspace.commercial_option,
      ),
      setupFeeLabel: setupFee,
      monthlyFeeLabel: monthlyFee,
      commitmentLabel: "keine",
      planHint: "Pilot / Setup · Demo-/Setupmonat",
      packageSummary:
        "Demo-Arbeitsplatz mit sicheren Testdaten, Sandra M. und manuell geprüften KI-Vorschlägen.",
      contractNote:
        "Du arbeitest im sicheren Demo-/Setupmodus. Sandra M., KI-Demo, Memory-Demo und Follow-up-Demo sind vorbereitet; produktive Daten und Versand bleiben getrennt.",
    };
  }

  if (
    workspace.plan_id === "starter" &&
    workspace.commercial_option === "starter_12m_setup_waived"
  ) {
    return {
      packageName: "Starter",
      commercialOptionName: getCommercialOptionLabel(
        workspace.commercial_option,
      ),
      setupFeeLabel: `${setupFee} statt ${formatEuro(99000)}`,
      monthlyFeeLabel: monthlyFee,
      commitmentLabel: "12 Monate",
      planHint: "Starter · produktiver MVP-Kern",
      packageSummary:
        "Produktiver MVP-Kern für Kontakte, CSV-Vorbereitung, Memory und manuelle Follow-ups.",
      contractNote:
        "Der produktive MVP-Kern ist aktiv: Kontakte, CSV-Import, ein Profil, Memory und Follow-ups. KI-Vorschläge bleiben bewusst limitiert und werden manuell geprüft.",
    };
  }

  if (
    workspace.plan_id === "starter" &&
    workspace.commercial_option === "starter_paid_setup"
  ) {
    return {
      packageName: "Starter",
      commercialOptionName: getCommercialOptionLabel(
        workspace.commercial_option,
      ),
      setupFeeLabel: setupFee,
      monthlyFeeLabel: monthlyFee,
      commitmentLabel: "keine 12-Monatsbindung",
      planHint: "Starter · produktiver MVP-Kern",
      packageSummary:
        "Produktiver MVP-Kern für Kontakte, CSV-Vorbereitung, Memory und manuelle Follow-ups.",
      contractNote:
        "Produktiver Starter-Einstieg ohne feste Bindung: Kontakte, CSV-Import, ein Profil, Memory und Follow-ups sind aktiv; KI-Vorschläge bleiben limitiert.",
    };
  }

  if (workspace.plan_id === "growth") {
    return {
      packageName: "Growth",
      commercialOptionName: getCommercialOptionLabel(
        workspace.commercial_option,
      ),
      setupFeeLabel: setupFee,
      monthlyFeeLabel: monthlyFee,
      commitmentLabel:
        workspace.commitment_months > 0
          ? `${workspace.commitment_months} Monate`
          : "noch nicht produktiv gebucht",
      planHint: "Growth · Vorschau",
      packageSummary:
        "Growth-Funktionen bleiben Vorschau und werden nicht als aktive Vollversion angezeigt.",
      contractNote:
        "Growth wird im Dashboard als Vorschau gezeigt. Erweiterte Profile, Segmente und höhere Nutzung werden vorbereitet, aber nicht als produktive Vollversion verkauft.",
    };
  }

  if (workspace.plan_id === "agency") {
    return {
      packageName: "Agency",
      commercialOptionName: getCommercialOptionLabel(
        workspace.commercial_option,
      ),
      setupFeeLabel: setupFee,
      monthlyFeeLabel: monthlyFee,
      commitmentLabel:
        workspace.commitment_months > 0
          ? `${workspace.commitment_months} Monate`
          : "Demo / Erstgespräch",
      planHint: "Agency · Demo/Erstgespräch/Vorschau",
      packageSummary:
        "Agency-Funktionen bleiben Demo-/Erstgesprächsmodus und sind nicht produktiv freigeschaltet.",
      contractNote:
        "Agency ist als Demo- und Erstgesprächsmodus markiert. Multi-Client, Teamstruktur und Agentur-Workflow sind Vorschau und nicht produktiv freigeschaltet.",
    };
  }

  return {
    packageName: workspace.plan_id,
    commercialOptionName: getCommercialOptionLabel(workspace.commercial_option),
    setupFeeLabel: setupFee,
    monthlyFeeLabel: monthlyFee,
    commitmentLabel:
      workspace.commitment_months > 0
        ? `${workspace.commitment_months} Monate`
        : "keine",
    planHint: "Workspace geladen · Paket geprüft",
    packageSummary:
      "Workspace geladen; sichtbare Module richten sich nach Paket und Vertrag.",
    contractNote:
      "Workspace-Daten wurden geladen. Die sichtbaren Dashboard-Module werden aus plan_id und commercial_option abgeleitet.",
  };
}

function getKpiCards(workspace: WorkspaceDashboardRow): KpiCard[] {
  const isPilot = workspace.plan_id === "pilot";
  const isStarter = workspace.plan_id === "starter";

  return [
    {
      label: "Demo-Kontakte",
      value: "3",
      helper: isStarter
        ? "Starter-Vorbereitung mit Sandra M., Alex K. und Ella L."
        : "Sandra M., Alex K., Ella L. · Demo/Preview",
      tone: "blue",
    },
    {
      label: "Kanäle verbunden",
      value: "0",
      helper: "Keine Social-Media-Integration verbunden",
      tone: "cyan",
    },
    {
      label: "Offene Follow-ups",
      value: "3",
      helper: isPilot ? "Demo-Aufgaben" : "Manuelle Aufgaben vorbereitet",
      tone: "cyan",
    },
    {
      label: "KI-Vorschläge",
      value: isStarter ? "Limitiert" : "Vorbereitet",
      helper: "Mensch prüft und sendet selbst",
      tone: "violet",
    },
    {
      label: "Import",
      value: isStarter ? "CSV aktiv" : "CSV Vorschau",
      helper: isStarter
        ? "CSV-Import im MVP nutzbar"
        : "CSV-Import paketabhängig vorbereitet",
      tone: isStarter ? "green" : "amber",
    },
    {
      label: "MVP-Kern aktiv",
      value: isPilot || isStarter ? "Ja" : "Vorschau",
      helper: "Login/Workspace, Kontakte, Follow-ups und Roadmap sichtbar",
      tone: "green",
    },
  ];
}

function getContactRows(workspace: WorkspaceDashboardRow): ContactPreviewRow[] {
  const suffix =
    workspace.plan_id === "starter" ? "Starter-Vorbereitung" : "Demo/Manuell";

  return [
    {
      name: "Sandra M.",
      status: workspace.plan_id === "starter" ? "Starter-Demo" : "Buyer",
      profile: "Mia Active Club",
      source: suffix,
      tags: ["buyer", "premium_interest"],
      score: 92,
      lastContact: "Heute, 09:42",
      nextFollowUp: "Morgen, 10:00",
    },
    {
      name: "Alex K.",
      status: workspace.plan_id === "starter" ? "Starter-Demo" : "VIP",
      profile: "DJ Nova",
      source: suffix,
      tags: ["vip", "event_interest"],
      score: 88,
      lastContact: "Gestern, 18:21",
      nextFollowUp: "Heute, 14:00",
    },
    {
      name: "Ella L.",
      status: workspace.plan_id === "starter" ? "Starter-Demo" : "Inactive",
      profile: "Team Arena",
      source: suffix,
      tags: ["reactivation"],
      score: 45,
      lastContact: "12.05.2025",
      nextFollowUp: "Überfällig",
    },
  ];
}

function getFollowUps(workspace: WorkspaceDashboardRow): TaskPreview[] {
  const status = workspace.plan_id === "starter" ? "MVP" : "Demo";

  return [
    {
      title: "KI-Vorschlag prüfen",
      person: "Sandra M.",
      due: "Morgen 10:00",
      status,
    },
    {
      title: "VIP-Info nachfassen",
      person: "Alex K.",
      due: "Heute 14:00",
      status,
    },
    {
      title: "Reaktivierung prüfen",
      person: "Ella L.",
      due: "Überfällig",
      status,
    },
  ];
}

function getRecommendations(
  workspace: WorkspaceDashboardRow,
): RecommendationPreview[] {
  if (workspace.plan_id === "pilot") {
    return [
      {
        title: "Sandra M. Early-Bird Antwort vorbereiten",
        text: "Vorschlag vorbereiten, Early-Bird-Kontext prüfen und anschließend selbst senden.",
        status: "Demo",
      },
      {
        title: "Ella L. Reaktivierungsansprache prüfen",
        text: "Reaktivierungsansprache vorbereiten; FanMind erstellt keinen automatischen Versand.",
        status: "Demo",
      },
    ];
  }

  if (workspace.plan_id === "starter") {
    return [
      {
        title: "Kontaktbasis aufbauen",
        text: "Ersten Kontakt anlegen oder CSV-Import vorbereiten, danach Vorschläge manuell prüfen.",
        status: "Limitiert",
      },
      {
        title: "Keine Auto-Aktionen",
        text: "KI dient als Arbeitsvorbereitung; jede Nachricht bleibt eine menschliche Entscheidung.",
        status: "Sicher",
      },
    ];
  }

  return [
    {
      title: "Preview sauber trennen",
      text: "Segmente, Kampagnen und Analytics bleiben Roadmap beziehungsweise Upgrade-Hinweis.",
      status: "Vorschau",
    },
  ];
}

function getChannelStatuses(
  workspace: WorkspaceDashboardRow,
): ChannelStatusCard[] {
  const csvStatus = workspace.plan_id === "starter" ? "Aktiv" : "Vorschau";
  const csvNote =
    workspace.plan_id === "starter"
      ? "CSV-Import im MVP aktiv"
      : "CSV-Import als Paketvorschau";

  return [
    {
      channel: "Manuell",
      status: "Aktiv",
      note: "Kontakte und Follow-ups werden manuell gepflegt",
      tone: "active",
    },
    {
      channel: "CSV",
      status: csvStatus,
      note: csvNote,
      tone: workspace.plan_id === "starter" ? "active" : "preview",
    },
    {
      channel: "E-Mail",
      status: "Geplant",
      note: "Noch keine Versandfunktion",
      tone: "roadmap",
    },
    {
      channel: "Instagram",
      status: "Roadmap",
      note: "0 verbunden · Integration auf Roadmap",
      tone: "roadmap",
    },
    {
      channel: "TikTok",
      status: "Roadmap",
      note: "0 verbunden · Integration auf Roadmap",
      tone: "roadmap",
    },
    {
      channel: "WhatsApp",
      status: "Roadmap",
      note: "0 verbunden · Integration auf Roadmap",
      tone: "roadmap",
    },
    {
      channel: "Facebook",
      status: "Roadmap",
      note: "0 verbunden · Integration auf Roadmap",
      tone: "roadmap",
    },
    {
      channel: "X/Twitter",
      status: "Roadmap",
      note: "0 verbunden · Integration auf Roadmap",
      tone: "roadmap",
    },
    {
      channel: "Discord",
      status: "Roadmap",
      note: "0 verbunden · Integration auf Roadmap",
      tone: "roadmap",
    },
  ];
}

function getInitials(nameOrEmail?: string): string {
  const fallback = "FM";

  if (!nameOrEmail) {
    return fallback;
  }

  const parts = nameOrEmail
    .replace(/@.*/, "")
    .split(/[.\s_-]+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return fallback;
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || fallback;
}

function getPlanStatus(
  workspace: WorkspaceDashboardRow,
): "Aktiv" | "Demo" | "Vorschau" {
  if (workspace.plan_id === "pilot") {
    return "Demo";
  }

  if (workspace.plan_id === "starter") {
    return "Aktiv";
  }

  return "Vorschau";
}

function FeaturePill({ feature }: { feature: ResolvedDashboardFeature }) {
  return (
    <article
      className={`${styles.featurePill} ${styles[`status-${feature.status}`]}`}
    >
      <div>
        <h3>{feature.label}</h3>
        <p>{getDashboardStatusText(feature.status, feature.minPlan)}</p>
      </div>
      <span>{getDashboardStatusLabel(feature.status)}</span>
    </article>
  );
}

function SidebarItem({
  label,
  active = false,
  badge,
  disabled = false,
  href,
}: SidebarLink) {
  return (
    <a
      aria-disabled={disabled || undefined}
      className={active ? styles.navItemActive : styles.navItem}
      href={href}
    >
      <span>{label}</span>
      {badge ? <small>{badge}</small> : null}
    </a>
  );
}

function WorkspaceDetails({ workspace, email }: WorkspaceDetailsProps) {
  const display = getWorkspaceDisplay(workspace);
  const featureGroups = getDashboardFeatureGroups(
    workspace.plan_id,
    workspace.commercial_option,
  );
  const allVisibleFeatures = [
    ...featureGroups.active,
    ...featureGroups.demoLimited,
    ...featureGroups.later,
    ...featureGroups.roadmap,
  ].filter((feature) => feature.key !== "automatic_sending");
  const compactFeatures = allVisibleFeatures
    .filter(
      (feature) => !["roadmap", "automatic_sending"].includes(feature.key),
    )
    .slice(0, 6);
  const pageTitle = "Dashboard";
  const pageSubtitle = "Willkommen zurück. Hier ist dein FanMind Überblick.";
  const primaryActionLabel = "+ Neuer Kontakt";
  const planStatus = getPlanStatus(workspace);
  const userLabel = email ?? workspace.name;
  const mainNavigation: SidebarLink[] = [
    { label: "Dashboard", href: "/dashboard", active: true },
    { label: "Fans", href: "#contacts" },
    { label: "Kanäle", href: "#channels", badge: "Roadmap" },
  ];
  const settingsNavigation: SidebarLink[] = [
    { label: "Einstellungen", href: "#contract", disabled: true },
  ];
  const savedViews: SidebarLink[] = [
    { label: "Top Fans", href: "#contacts" },
    { label: "Reaktivierung", href: "#followups" },
  ];
  const contactRows = getContactRows(workspace);
  const followUps = getFollowUps(workspace);
  const recommendations = getRecommendations(workspace);
  const kpiCards = getKpiCards(workspace);
  const channelStatuses = getChannelStatuses(workspace);

  return (
    <div className={styles.dashboardShell}>
      <aside className={styles.sidebar} aria-label="FanMind Navigation">
        <div className={styles.logoBlock}>
          <div className={styles.logoMark}>FM</div>
          <div>
            <strong>FanMind</strong>
            <small>Multi-Channel CRM</small>
          </div>
        </div>

        <nav className={styles.navList} aria-label="Hauptnavigation">
          <span className={styles.navSectionLabel}>Navigation</span>
          {mainNavigation.map((item) => (
            <SidebarItem key={item.label} {...item} />
          ))}
        </nav>

        <nav className={styles.navList} aria-label="Workspace Navigation">
          <span className={styles.navSectionLabel}>Workspace</span>
          {settingsNavigation.map((item) => (
            <SidebarItem key={item.label} {...item} />
          ))}
        </nav>

        <section className={styles.savedViews} aria-label="Gespeicherte Ansichten">
          <span>Gespeicherte Ansichten</span>
          {savedViews.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
        </section>

        <div className={styles.sidebarFooter}>
          <section
            className={styles.userMiniCard}
            aria-label="Nutzer"
          >
            <div className={styles.avatarMark}>{getInitials(userLabel)}</div>
            <div>
              <span>Nutzer</span>
              <strong>{userLabel}</strong>
              <p>{workspace.name}</p>
            </div>
          </section>
          <section className={styles.planMiniCard} aria-label="Paket">
            <div>
              <span>Paket</span>
              <strong>{display.packageName}</strong>
              <p>{display.commercialOptionName}</p>
            </div>
            <small>{planStatus}</small>
          </section>
          <form action={logout}>
            <button type="submit" className={styles.logoutButton}>
              Abmelden
            </button>
          </form>
        </div>
      </aside>

      <div className={styles.dashboardContent}>
        <header className={styles.topbar}>
          <div className={styles.titleCluster}>
            <p className={styles.eyebrow}>Multi-Channel CRM Workspace</p>
            <h1>{pageTitle}</h1>
            <p>{pageSubtitle}</p>
            <span>Kein automatisches Senden – Mensch prüft und sendet selbst.</span>
          </div>
          <div className={styles.topbarActions}>
            <label className={styles.searchBox}>
              <span>Suche</span>
              <input
                type="search"
                placeholder="Suche nach Name, Tag, Kanal, Sprache ..."
              />
            </label>
            <button type="button" className={styles.filterChip}>
              Letzte 30 Tage
            </button>
            <button type="button" className={styles.filterChip}>
              Filter
            </button>
            <a className={styles.primaryButton} href="#contacts">
              {primaryActionLabel}
            </a>
          </div>
        </header>

        <section className={styles.kpiGrid} aria-label="KPI-Karten">
          {kpiCards.map((card) => (
            <article
              key={card.label}
              className={`${styles.kpiCard} ${styles[`tone-${card.tone}`]}`}
            >
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.helper}</p>
            </article>
          ))}
        </section>

        <section className={styles.crmGrid} aria-label="CRM Arbeitsbereich">
          <article
            className={`${styles.moduleCard} ${styles.activityCard}`}
            id="channels"
            aria-labelledby="channels-title"
          >
            <div className={styles.moduleHeader}>
              <div>
                <p className={styles.eyebrow}>Kanalstatus / Channel Hub</p>
                <h2 id="channels-title">0 Kanäle verbunden</h2>
              </div>
              <span>Integrationen auf Roadmap</span>
            </div>
            <div className={styles.channelGrid}>
              {channelStatuses.map((channel) => (
                <div
                  key={channel.channel}
                  className={`${styles.channelCard} ${styles[`channel-${channel.tone}`]}`}
                >
                  <strong>{channel.channel}</strong>
                  <span>{channel.status}</span>
                  <p>{channel.note}</p>
                </div>
              ))}
            </div>
            <p className={styles.moduleText}>
              Social-Media-Kanäle sind noch nicht verbunden. Manuell und CSV
              bilden den MVP-Workspace; Instagram, TikTok, WhatsApp und Discord
              bleiben Roadmap.
            </p>
          </article>

          <section
            className={`${styles.moduleCard} ${styles.contactCard}`}
            id="contacts"
            aria-labelledby="contacts-title"
          >
            <div className={styles.moduleHeader}>
              <div>
                <p className={styles.eyebrow}>Kontakte / Follower</p>
                <h2 id="contacts-title">Kontaktpipeline</h2>
              </div>
              <span>
                {workspace.plan_id === "starter"
                  ? "Starter-Vorbereitung"
                  : workspace.plan_id === "pilot"
                    ? "Demo-Daten"
                    : "Vorschau"}
              </span>
            </div>
            <p className={styles.moduleText}>
              Demo-/Starter-Daten zeigen die spätere Kontaktlogik. Es sind keine
              echten Social-Media-Kanäle verbunden und keine Nachrichten werden
              automatisch versendet.
            </p>
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Profil</th>
                    <th>Kanal/Quelle</th>
                    <th>Tags</th>
                    <th>Score</th>
                    <th>Letzter Kontakt</th>
                    <th>Nächster Follow-up</th>
                  </tr>
                </thead>
                <tbody>
                  {contactRows.map((row) => (
                    <tr key={row.name}>
                      <td>
                        <strong className={styles.contactName}>
                          {row.name}
                        </strong>
                      </td>
                      <td>
                        <span className={styles.tableBadge}>{row.status}</span>
                      </td>
                      <td>{row.profile}</td>
                      <td>{row.source}</td>
                      <td>
                        <div className={styles.tagList}>
                          {row.tags.map((tag) => (
                            <span key={`${row.name}-${tag}`}>{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <strong className={styles.scoreValue}>
                          {row.score}
                        </strong>
                      </td>
                      <td>{row.lastContact}</td>
                      <td>{row.nextFollowUp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className={styles.rightRail} aria-label="Status und Paket">
            <section
              className={styles.contextCard}
              aria-labelledby="segments-title"
            >
              <div className={styles.moduleHeader}>
                <div>
                  <p className={styles.eyebrow}>Segmentstatus</p>
                  <h2 id="segments-title">Verteilung</h2>
                </div>
                <span>
                  {workspace.plan_id === "pilot" ? "Demo" : "Kompakt"}
                </span>
              </div>
              <div className={styles.segmentList}>
                <div>
                  <span>Buyer / Premium</span>
                  <strong>{workspace.plan_id === "pilot" ? "1" : "—"}</strong>
                </div>
                <div>
                  <span>VIP / Event</span>
                  <strong>{workspace.plan_id === "pilot" ? "1" : "—"}</strong>
                </div>
                <div>
                  <span>Reaktivierung</span>
                  <strong>{workspace.plan_id === "pilot" ? "1" : "—"}</strong>
                </div>
              </div>
            </section>

            <section
              className={styles.contextCard}
              id="contract"
              aria-labelledby="contract-title"
            >
              <p className={styles.eyebrow}>Paket & Vertrag</p>
              <h2 id="contract-title">{display.packageName}</h2>
              <dl className={styles.details}>
                <div>
                  <dt>plan_id</dt>
                  <dd>{workspace.plan_id}</dd>
                </div>
                <div>
                  <dt>commercial_option</dt>
                  <dd>{display.commercialOptionName}</dd>
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
                <div>
                  <dt>Status</dt>
                  <dd>
                    {workspace.plan_id === "pilot"
                      ? "Demo aktiv"
                      : display.commercialOptionName}
                  </dd>
                </div>
              </dl>
              <p>{display.contractNote}</p>
            </section>
          </aside>
        </section>

        <section className={styles.panelGrid} aria-label="Arbeitsbereiche">
          <article className={styles.moduleCard} id="followups">
            <div className={styles.moduleHeader}>
              <div>
                <p className={styles.eyebrow}>Fällige Follow-ups</p>
                <h2>Manuelle nächste Schritte</h2>
              </div>
              <span>
                {workspace.plan_id === "starter" ? "MVP" : "Demo/Vorschau"}
              </span>
            </div>
            <div className={styles.taskList}>
              {followUps.map((task) => (
                <div
                  key={`${task.title}-${task.person}`}
                  className={styles.taskItem}
                >
                  <div>
                    <strong>{task.title}</strong>
                    <p>{task.person}</p>
                  </div>
                  <span>
                    {task.due} · {task.status}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className={`${styles.moduleCard} ${styles.guardrailCard}`}>
            <div className={styles.moduleHeader}>
              <div>
                <p className={styles.eyebrow}>Kein automatisches Senden</p>
                <h2>Versand bleibt menschlich</h2>
              </div>
              <span>Immer sichtbar</span>
            </div>
            <p className={styles.moduleText}>
              FanMind bereitet Kontaktkontext, Follow-ups und KI-Vorschläge vor.
              Der Workspace sendet keine Nachrichten automatisch; jede Antwort,
              Kampagne oder Kanalaktion muss manuell geprüft und selbst
              ausgelöst werden.
            </p>
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

          <article
            className={`${styles.quickActions} ${styles.compactActions}`}
            aria-labelledby="quick-actions-title"
          >
            <div className={styles.moduleHeader}>
              <div>
                <p className={styles.eyebrow}>Schnellaktionen</p>
                <h2 id="quick-actions-title">Kompakt</h2>
              </div>
              <span>
                {workspace.plan_id === "pilot"
                  ? "Demo/Vorschau"
                  : "Aktiv/Limitiert"}
              </span>
            </div>
            <div className={styles.actionList}>
              <a href="#contacts">
                Kontakt anlegen{" "}
                <small>
                  {workspace.plan_id === "pilot" ? "Demo" : "Aktiv"}
                </small>
              </a>
              <a href="#csv-import">
                CSV-Import starten{" "}
                <small>
                  {workspace.plan_id === "starter" ? "Aktiv" : "Vorschau"}
                </small>
              </a>
              <a href="#followups">
                Follow-up erstellen{" "}
                <small>
                  {workspace.plan_id === "pilot" ? "Demo" : "Aktiv"}
                </small>
              </a>
              <a href="#contacts">
                Sandra M. öffnen{" "}
                <small>
                  {workspace.plan_id === "pilot" ? "Demo" : "Limitiert"}
                </small>
              </a>
              <a href="#roadmap">
                Roadmap öffnen <small>Vorschau</small>
              </a>
              <a href="#channels">
                Kanal-Roadmap ansehen <small>Roadmap</small>
              </a>
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
            <p className={styles.moduleText}>
              CSV ist im Starter-MVP aktiv und im Pilot als Vorschau markiert.
              Kampagnen, Analytics, echte Social-Media-Integrationen und
              automatisches Senden sind nicht aktiv.
            </p>
            <div className={styles.roadmapStack}>
              <span>Instagram · Roadmap</span>
              <span>TikTok · Roadmap</span>
              <span>WhatsApp · Roadmap</span>
              <span>Facebook · Roadmap</span>
              <span>X/Twitter · Roadmap</span>
              <span>Discord · Roadmap</span>
              <span>Echte Kampagnen & Analytics · Roadmap</span>
            </div>
          </article>
        </section>

        <section
          className={styles.featureSection}
          id="roadmap"
          aria-labelledby="features-title"
        >
          <div>
            <p className={styles.eyebrow}>Paketabhängige Funktionen</p>
            <h2 id="features-title">Dezente Statuslogik</h2>
            <p>
              Feature-Gating nutzt weiterhin plan_id und commercial_option;
              aktive, Demo-, limitierte und Roadmap-Funktionen bleiben kompakt
              getrennt.
            </p>
          </div>
          <div className={styles.featurePillGrid}>
            {compactFeatures.map((feature) => (
              <FeaturePill key={feature.key} feature={feature} />
            ))}
          </div>
          <div className={styles.featureSplit}>
            <span>
              Upgrade:{" "}
              {
                featureGroups.later.filter(
                  (feature) => feature.key !== "automatic_sending",
                ).length
              }
            </span>
            <span>
              Roadmap/Vorschau:{" "}
              {
                featureGroups.roadmap.filter(
                  (feature) => feature.key !== "automatic_sending",
                ).length
              }
            </span>
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
      {workspace ? (
        <WorkspaceDetails workspace={workspace} email={data.user.email} />
      ) : (
        <section className={styles.fallbackCard} aria-label="FanMind Workspace">
          <div>
            <p className={styles.eyebrow}>FanMind Dashboard</p>
            <h1>Workspace-Status</h1>
            <p>
              Dashboard geschützt: Supabase Auth ist aktiv. Für deinen Account
              wurde noch kein Workspace gefunden.
            </p>
          </div>
          {userError ? (
            <p className={styles.error}>
              <strong>
                Supabase-Session konnte nicht vollständig geprüft werden.
              </strong>
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
            <button type="submit" className={styles.secondaryButton}>
              Abmelden
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
