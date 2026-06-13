import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getOpenFollowupCount,
  ensureUserWorkspace,
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  getWorkspaceContacts,
  getWorkspaceOpenFollowups,
  signOutSupabaseServerSession,
  type ContactRow,
  type FollowupRow,
  type WorkspaceDashboardRow,
} from "@/lib/supabase/server";
import { getCommercialOptionLabel } from "@/lib/dashboardFeatures";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { getWorkspaceNavigation } from "@/lib/workspaceNavigation";
import styles from "./dashboard.module.css";

type WorkspaceDetailsProps = {
  workspace: WorkspaceDashboardRow;
  userDisplayName?: string;
  contacts: ContactRow[];
  contactsError?: string;
  followups: FollowupRow[];
  followupsError?: string;
  openFollowupCount: number;
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
        "1 Monat Test-/Setup-Zugang mit sicheren Workspace-Daten und manuell gepflegten Kontakten.",
      contractNote:
        "990 € einmalig · 1 Monat testen · keine Bindung. Du arbeitest im sicheren Demo-/Setupmodus; es gibt keine automatische Verlängerung und wenn du nicht weitermachst, endet der Pilot.",
    };
  }

  if (workspace.plan_id === "starter") {
    const commercialOption = String(workspace.commercial_option);
    const isCommitmentOption = commercialOption === "starter_no_setup_commitment";

    return {
      packageName: isCommitmentOption ? "Starter Option B" : "Starter Option A",
      commercialOptionName: isCommitmentOption
        ? "299 €/Monat · 12 Monate"
        : "990 € Setup + 299 €/Monat",
      setupFeeLabel: setupFee,
      monthlyFeeLabel: monthlyFee,
      commitmentLabel: isCommitmentOption ? "12 Monate" : "monatlich kündbar",
      planHint: isCommitmentOption
        ? "Starter · ohne Einrichtung · 12 Monate"
        : "Starter · Setup + monatlich kündbar",
      packageSummary:
        "Produktiver MVP-Kern für Kontakte und manuelle Kontaktpflege.",
      contractNote: isCommitmentOption
        ? "299 €/Monat · ohne Einrichtung · 12 Monate Bindung. Hier wird keine Zahlungs- oder Subscription-Logik ausgelöst."
        : "990 € Einrichtung + 299 €/Monat · monatlich kündbar. Wenn du nach dem Pilot weitermachst, wird die bereits bezahlte Setup-Gebühr angerechnet. Du zahlst dann im Starter nur 299 €/Monat.",
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
      commitmentLabel: "noch nicht produktiv gebucht",
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
      commitmentLabel: "Demo / Erstgespräch",
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
    commitmentLabel: "keine",
    planHint: "Workspace geladen · Paket geprüft",
    packageSummary:
      "Workspace geladen; sichtbare Module richten sich nach Paket und Vertrag.",
    contractNote:
      "Workspace-Daten wurden geladen. Die sichtbaren Dashboard-Module werden aus plan_id und commercial_option abgeleitet.",
  };
}

function getContactRows(contacts: ContactRow[]): ContactPreviewRow[] {
  return contacts.map((contact) => ({
    name: contact.display_name,
    status: formatStatus(contact.status),
    profile: contact.handle ?? "—",
    source: formatSource(contact.source_platform),
    tags: contact.tags?.length ? contact.tags : [],
    score: formatLanguage(contact.language),
    lastContact: contact.created_at
      ? `Neu angelegt · ${formatDate(contact.created_at)}`
      : "Neu angelegt",
    nextFollowUp: "—",
  }));
}

function getFollowUps(
  followups: FollowupRow[],
  contacts: ContactRow[],
): TaskPreview[] {
  const contactNames = new Map(
    contacts.map((contact) => [contact.id, contact.display_name]),
  );

  return followups.slice(0, 6).map((followup) => ({
    title: followup.reason,
    person: contactNames.get(followup.contact_id) ?? "Unbekannter Kontakt",
    due: formatDueDate(followup.due_date),
    status: followup.status ?? "open",
  }));
}

function formatDueDate(value: string | null): string {
  if (!value) {
    return "Ohne Fälligkeitsdatum";
  }

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00Z`));
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

function WorkspaceDetails({
  workspace,
  userDisplayName,
  contacts,
  contactsError,
  followups,
  followupsError,
  openFollowupCount,
}: WorkspaceDetailsProps) {
  const display = getWorkspaceDisplay(workspace);
  const pageTitle = "Dashboard";
  const displayName = userDisplayName ?? workspace.name ?? "Nutzer";
  const pageSubtitle = "Willkommen zurück, Pilot Test 👋";
  const primaryActionLabel = "+ Neuer Kontakt";
  const planStatus = getPlanStatus(workspace);
  const userLabel = displayName;
  const { mainNavigation, settingsNavigation, savedViews } =
    getWorkspaceNavigation("dashboard");
  const contactRows = getContactRows(contacts);
  const followUps = getFollowUps(followups, contacts);
  const firstContact = contacts[0];

  return (
    <WorkspaceShell
      workspaceName={workspace.name}
      userLabel={userLabel}
      planLabel={display.packageName}
      planMeta={display.commercialOptionName}
      planStatus={planStatus}
      mainNavigation={mainNavigation}
      settingsNavigation={settingsNavigation}
      savedViews={savedViews}
      header={{
        title: pageTitle,
        subtitle: pageSubtitle,
        searchPlaceholder: "Suche nach Name, Tag, Kanal, Sprache ...",
        primaryActionLabel,
        primaryActionHref: "/fans",
      }}
      contactCount={contacts.length}
      openFollowupCount={openFollowupCount}
      logoutAction={logout}
    >
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
            Diese Pipeline zeigt echte gespeicherte Kontakte aus dem aktuellen
            Workspace. Vollautomatische Social-Media-Synchronisation ist
            verpflichtender Produktbereich; einzelne Plattformen werden erst
            nach fertiger Anbindung ohne Statushinweis produktiv angezeigt.
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
              <p>
                Lege auf der Fans-Seite den ersten Kontakt an; hier erscheinen
                nur echte Kontakte aus dem Workspace.
              </p>
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
          {followupsError ? (
            <p className={styles.error}>
              <strong>Follow-ups konnten nicht geladen werden.</strong>
              <span>{followupsError}</span>
            </p>
          ) : null}
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
                <p>
                  Speichere einen KI-vorgeschlagenen Follow-up auf einer
                  Kontaktdetailseite; hier erscheinen nur echte offene
                  Follow-ups.
                </p>
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
            <Link href="/fans#new-fan-modal">
              Kontakt anlegen <small>Aktiv</small>
            </Link>
            {firstContact ? (
              <Link href={`/fans/${firstContact.id}`}>
                Fan öffnen <small>Detail</small>
              </Link>
            ) : null}
            <Link href="/fans#fans-list">
              Fanliste öffnen <small>Echte Daten</small>
            </Link>
            {openFollowupCount > 0 ? (
              <a href="#followups">
                Offene Follow-ups <small>{openFollowupCount}</small>
              </a>
            ) : null}
          </div>
        </article>
      </section>

      <div className={styles.safetyNote} role="note">
        <strong>Keine automatische Sendefunktion.</strong>
        <span>
          Social-Media-Synchronisation wird als Pflichtbereich ausgebaut, soweit
          Plattformen es technisch und rechtlich zulassen. Mensch prüft und
          sendet final selbst.
        </span>
      </div>
    </WorkspaceShell>
  );
}

export default async function DashboardPage() {
  const { data, error: userError } = await getSupabaseServerUser();

  if (!data.user) {
    redirect("/login");
  }

  const backfillResult = await ensureUserWorkspace(data.user);
  const workspaceResult = backfillResult.workspace
    ? await getUserWorkspaceDashboard(data.user)
    : { workspace: null, error: backfillResult.error };
  const workspace = workspaceResult.workspace;
  const contactsResult = workspace
    ? await getWorkspaceContacts(workspace.id)
    : null;
  const followupsResult = workspace
    ? await getWorkspaceOpenFollowups(workspace.id)
    : null;
  const openFollowupCountResult = workspace
    ? await getOpenFollowupCount(workspace.id)
    : null;

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
          followups={followupsResult?.followups ?? []}
          followupsError={followupsResult?.error?.message}
          openFollowupCount={openFollowupCountResult?.count ?? 0}
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
