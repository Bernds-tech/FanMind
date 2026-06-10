import Image from "next/image";
import { redirect } from "next/navigation";
import {
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  getWorkspaceContacts,
  signOutSupabaseServerSession,
  type ContactRow,
  type WorkspaceDashboardRow,
} from "@/lib/supabase/server";
import { getCommercialOptionLabel } from "@/lib/dashboardFeatures";
import { AppHeader } from "@/components/AppHeader";
import styles from "./dashboard.module.css";

type WorkspaceDetailsProps = {
  workspace: WorkspaceDashboardRow;
  userDisplayName?: string;
  contacts: ContactRow[];
  contactsError?: string;
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

type KpiIconName =
  | "users"
  | "pulse"
  | "check"
  | "megaphone"
  | "refresh"
  | "percent";

type KpiTone = "blue" | "green" | "violet" | "orange" | "cyan";

type KpiCardData = {
  label: string;
  value: string;
  meta: string;
  icon: KpiIconName;
  tone: KpiTone;
  sparklinePoints: string;
  infoLabel: string;
  comingSoon?: boolean;
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

type TaskPreview = {
  title: string;
  person: string;
  due: string;
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
        "Demo-Arbeitsplatz mit sicheren Workspace-Daten und manuell gepflegten Kontakten.",
      contractNote:
        "Du arbeitest im sicheren Demo-/Setupmodus. Kontakte werden manuell gepflegt; produktive Kanalaktionen und Versand bleiben getrennt.",
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
        "Produktiver MVP-Kern für Kontakte und manuelle Kontaktpflege.",
      contractNote:
        "Der produktive MVP-Kern ist aktiv: Kontakte und manuelle Kontaktpflege. Kampagnen, Follow-ups und Kanalaktionen sind nicht als aktive Automationen freigeschaltet.",
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
        "Produktiver MVP-Kern für Kontakte und manuelle Kontaktpflege.",
      contractNote:
        "Produktiver Starter-Einstieg ohne feste Bindung: Kontakte und manuelle Kontaktpflege sind aktiv; Kampagnen, Follow-ups und Kanalaktionen sind nicht als aktive Automationen freigeschaltet.",
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

function getKpiCards(contactCount: number): KpiCardData[] {
  return [
    {
      label: "Gesamtfans",
      value: contactCount.toLocaleString("de-DE"),
      meta: "Echte Kontakte im Workspace",
      icon: "users",
      tone: "blue",
      sparklinePoints:
        "M2 13 C16 12 25 11 38 11.5 S61 12 74 10 S96 8.5 124 5",
      infoLabel: "Gesamtfans zeigt die echte Anzahl der gespeicherten Kontakte im aktuellen Workspace.",
    },
    {
      label: "Aktive Fans",
      value: "0",
      meta: "Aktivitätslogik noch nicht gebaut",
      icon: "pulse",
      tone: "green",
      sparklinePoints:
        "M2 13 C13 12.5 21 11 31 11.5 S47 12.5 56 9.5 S72 6.5 82 7.5 S97 10.5 107 6.5 S118 5 124 4",
      infoLabel: "Aktive Fans bleibt 0, bis echte Aktivitätslogik existiert.",
    },
    {
      label: "Offene Follow-ups",
      value: "0",
      meta: "Follow-ups noch nicht gebaut",
      icon: "check",
      tone: "violet",
      sparklinePoints:
        "M2 12.5 C13 11 21 11.5 31 9.5 S47 7 57 9 S72 12.5 83 9.5 S98 5.5 108 6.5 S118 7.5 124 4.5",
      infoLabel: "Offene Follow-ups bleibt 0, solange keine Follow-up-Logik gebaut ist.",
    },
    {
      label: "Laufende Kampagnen",
      value: "0",
      meta: "Kampagnen noch nicht gebaut",
      icon: "megaphone",
      tone: "blue",
      sparklinePoints:
        "M2 13 C14 12.5 22 10.5 32 11 S48 12.5 58 9.5 S73 7.5 83 9 S98 10.5 108 7 S119 5 124 4.5",
      infoLabel: "Laufende Kampagnen bleibt 0; produktiver Versand ist im MVP nicht aktiv.",
      comingSoon: true,
    },
    {
      label: "Reaktivierung",
      value: "0",
      meta: "Reaktivierung noch nicht gebaut",
      icon: "refresh",
      tone: "orange",
      sparklinePoints:
        "M2 13.5 C12 12.5 20 8 31 9 S47 13 57 8.5 S72 6 82 8 S97 11.5 107 7 S118 5.5 124 4.25",
      infoLabel: "Reaktivierung bleibt 0, solange keine Reaktivierungslogik gebaut ist.",
      comingSoon: true,
    },
    {
      label: "Conversion Rate",
      value: "0 %",
      meta: "Conversion-Logik noch nicht gebaut",
      icon: "percent",
      tone: "cyan",
      sparklinePoints:
        "M2 12.5 C14 12 22 11.5 32 12 S48 13 58 11 S73 9 83 9.5 S98 10 108 7.5 S119 6 124 4.75",
      infoLabel: "Conversion Rate bleibt 0 %, bis echte Conversion-/Analytics-Logik existiert.",
      comingSoon: true,
    },
  ];
}

function getContactRows(contacts: ContactRow[]): ContactPreviewRow[] {
  return contacts.map((contact) => ({
    name: contact.display_name,
    status: formatStatus(contact.status),
    profile: contact.handle ?? "—",
    source: formatSource(contact.source_platform),
    tags: contact.tags?.length ? contact.tags : [],
    score: formatLanguage(contact.language),
    lastContact: contact.created_at ? `Neu angelegt · ${formatDate(contact.created_at)}` : "Neu angelegt",
    nextFollowUp: "—",
  }));
}

function getFollowUps(): TaskPreview[] {
  return [];
}

function formatSource(value: string | null): string {
  const sourceLabels: Record<string, string> = {
    manual: "Manuell",
    instagram: "Instagram (manuell)",
    tiktok: "TikTok (manuell)",
  };

  return sourceLabels[value ?? ""] ?? value ?? "Manuell";
}

function formatStatus(value: string | null): string {
  const statusLabels: Record<string, string> = {
    new: "Neu",
    active: "Aktiv",
    warm: "Warm",
    follow_up: "Follow-up",
    paused: "Pausiert",
  };

  return statusLabels[value ?? ""] ?? value ?? "Neu";
}

function formatLanguage(value: string | null): string {
  if (value === "en") {
    return "Englisch";
  }

  if (value === "fr") {
    return "Französisch";
  }

  return "Deutsch";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function stringMetadataValue(
  metadata: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const value = metadata?.[key];

  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function getUserDisplayName(
  metadata: Record<string, unknown> | undefined,
  workspaceName: string,
): string {
  return (
    stringMetadataValue(metadata, "display_name") ??
    stringMetadataValue(metadata, "name") ??
    stringMetadataValue(metadata, "full_name") ??
    workspaceName ??
    "Nutzer"
  );
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

function ComingSoonImage({ size = "medium" }: { size?: "small" | "medium" | "large" }) {
  return (
    <Image
      src="/assets/coming-soon-badge.png"
      alt="Coming Soon"
      width={1536}
      height={1024}
      className={`${styles.comingSoonImage} ${styles[`comingSoon-${size}`]}`}
    />
  );
}

function KpiIcon({ icon }: { icon: KpiIconName }) {
  const iconPaths: Record<KpiIconName, string[]> = {
    users: [
      "M8.5 11.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z",
      "M3.5 19a5 5 0 0 1 10 0",
      "M16.25 10.5a2.75 2.75 0 1 0 0-5.5",
      "M15.25 14.25A4.5 4.5 0 0 1 20.5 19",
    ],
    pulse: [
      "M3.5 12h3.25l2-5.5 4.25 11 2.25-7H20.5",
      "M4.75 18.75a9 9 0 1 1 14.5-10.5",
    ],
    check: [
      "M8 12.25 10.65 15 16.25 8.75",
      "M12 3.75a8.25 8.25 0 1 0 0 16.5 8.25 8.25 0 0 0 0-16.5Z",
    ],
    megaphone: [
      "M4.25 13.25h3l8.25 4.5V6.25l-8.25 4.5h-3v2.5Z",
      "M7.25 13.25 8.75 19",
      "M17.5 9.25a3.25 3.25 0 0 1 0 5.5",
      "M19.5 6.75a6.75 6.75 0 0 1 0 10.5",
    ],
    refresh: [
      "M5.5 8.5A7 7 0 0 1 17.75 6L20 8.25",
      "M18.5 15.5A7 7 0 0 1 6.25 18L4 15.75",
      "M17.75 6v4.25H13.5",
      "M6.25 18v-4.25H10.5",
    ],
    percent: [
      "M6.75 17.25 17.25 6.75",
      "M7.75 9.25a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Z",
      "M16.25 18.25a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Z",
    ],
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {iconPaths[icon].map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}

function KpiCard({
  label,
  value,
  meta,
  tone,
  icon,
  sparklinePoints,
  infoLabel,
  comingSoon = false,
}: KpiCardData) {
  const toneClass = `tone-${tone}`;

  return (
    <article className={`${styles.kpiCard} ${styles[toneClass]}`}>
      <div className={styles.kpiIcon}>
        <KpiIcon icon={icon} />
      </div>
      <span className={styles.kpiInfo} title={infoLabel} aria-label={infoLabel}>
        i
      </span>
      <div className={styles.kpiTextBlock}>
        <p className={styles.kpiLabel}>{label}</p>
        <p className={styles.kpiValue}>{value}</p>
        <p className={styles.kpiMeta}>{meta}</p>
      </div>
      <svg
        className={styles.kpiSparkline}
        aria-hidden="true"
        viewBox="0 0 126 14"
        preserveAspectRatio="none"
      >
        <path d={sparklinePoints} />
      </svg>
      {comingSoon ? <ComingSoonImage size="small" /> : null}
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

function WorkspaceDetails({
  workspace,
  userDisplayName,
  contacts,
  contactsError,
}: WorkspaceDetailsProps) {
  const display = getWorkspaceDisplay(workspace);
  const pageTitle = "Dashboard";
  const displayName = userDisplayName ?? workspace.name ?? "Nutzer";
  const pageSubtitle = "Willkommen zurück, Pilot Test 👋";
  const primaryActionLabel = "+ Neuer Kontakt";
  const planStatus = getPlanStatus(workspace);
  const userLabel = displayName;
  const mainNavigation: SidebarLink[] = [
    { label: "Dashboard", href: "/dashboard", active: true },
    { label: "Fans", href: "/fans" },
    { label: "Kanäle", href: "/channels", badge: "Roadmap" },
  ];
  const settingsNavigation: SidebarLink[] = [
    { label: "Einstellungen", href: "#contract", disabled: true },
  ];
  const savedViews: SidebarLink[] = [
    { label: "Top Fans", href: "/fans" },
    { label: "Reaktivierung", href: "#followups" },
  ];
  const contactRows = getContactRows(contacts);
  const followUps = getFollowUps();
  const kpiCards = getKpiCards(contacts.length);

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
        <AppHeader
          title={pageTitle}
          subtitle={pageSubtitle}
          searchPlaceholder="Suche nach Name, Tag, Kanal, Sprache ..."
          primaryActionLabel={primaryActionLabel}
          primaryActionHref="/fans"
        />

        <section className={styles.kpiGrid} aria-label="KPI-Karten">
          {kpiCards.map((card) => (
            <KpiCard key={card.label} {...card} />
          ))}
        </section>

        <section className={styles.crmGrid} aria-label="CRM Arbeitsbereich">
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
                  ? "Echte Daten"
                  : workspace.plan_id === "pilot"
                    ? "Echte Daten"
                    : "Vorschau"}
              </span>
            </div>
            <p className={styles.moduleText}>
              Diese Pipeline zeigt echte gespeicherte Kontakte aus dem aktuellen Workspace.
              Es sind keine Social-Media-Kanäle verbunden und keine Aktivitäten werden
              automatisch behauptet.
            </p>
            {contactsError ? (
              <p className={styles.error}>
                <strong>Kontakte konnten nicht geladen werden.</strong>
                <span>{contactsError}</span>
              </p>
            ) : null}
            {contactRows.length ? (
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Handle</th>
                    <th>Kanal/Quelle</th>
                    <th>Tags</th>
                    <th>Sprache</th>
                    <th>Angelegt</th>
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
            ) : (
              <div className={styles.emptyState}>
                <strong>Noch keine Fans angelegt.</strong>
                <p>Lege auf der Fans-Seite den ersten Kontakt an; hier erscheinen nur echte Kontakte aus dem Workspace.</p>
              </div>
            )}
          </section>
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
              {followUps.length ? (
                followUps.map((task) => (
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
                ))
              ) : (
                <div className={styles.emptyState}>
                  <strong>Noch keine Follow-ups angelegt.</strong>
                  <p>Follow-up-Logik ist im MVP noch nicht gebaut; daher werden hier keine Fake-Aufgaben angezeigt.</p>
                </div>
              )}
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
              <a href="/fans#new-fan-modal">
                Kontakt anlegen <small>Aktiv</small>
              </a>
              <a href="#followups">
                Follow-ups noch nicht aktiv <small>Noch 0</small>
              </a>
              <a href="/fans#fans-list">
                Fanliste öffnen <small>Echte Daten</small>
              </a>
              <a href="#followups">
                Follow-ups prüfen <small>Noch 0</small>
              </a>
            </div>
          </article>

        </section>

        <div className={styles.safetyNote} role="note">
          <strong>Kein automatisches Senden</strong>
          <span>
            FanMind zeigt aktuell Kontakte aus deinem Workspace; Kampagnen,
            Kanalaktionen und automatisches Senden sind im MVP nicht aktiv.
          </span>
        </div>
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
  const contactsResult = workspace ? await getWorkspaceContacts(workspace.id) : null;

  return (
    <main className={styles.page}>
      {workspace ? (
        <WorkspaceDetails
          workspace={workspace}
          userDisplayName={getUserDisplayName(
            data.user.user_metadata,
            workspace.name,
          )}
          contacts={contactsResult?.contacts ?? []}
          contactsError={contactsResult?.error?.message}
        />
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
