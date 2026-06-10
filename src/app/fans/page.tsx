import { redirect } from "next/navigation";
import {
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  getWorkspaceContacts,
  signOutSupabaseServerSession,
  type ContactRow,
  type WorkspaceDashboardRow,
} from "@/lib/supabase/server";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { getWorkspaceNavigation } from "@/lib/workspaceNavigation";
import dashboardStyles from "../dashboard/dashboard.module.css";
import { createFan } from "./actions";
import styles from "./fans.module.css";

type FansWorkspaceProps = {
  workspace: WorkspaceDashboardRow;
  userDisplayName: string;
  contacts: ContactRow[];
  contactsError?: string;
};

const sourceLabels: Record<string, string> = {
  manual: "Manuell",
  instagram: "Instagram (manuell)",
  tiktok: "TikTok (manuell)",
};

const statusLabels: Record<string, string> = {
  new: "Neu",
  active: "Aktiv",
  warm: "Warm",
  follow_up: "Follow-up",
  paused: "Pausiert",
};

async function logout() {
  "use server";

  await signOutSupabaseServerSession();
  redirect("/login");
}

function FansWorkspace({
  workspace,
  userDisplayName,
  contacts,
  contactsError,
}: FansWorkspaceProps) {
  const { mainNavigation, settingsNavigation, savedViews } =
    getWorkspaceNavigation("fans");
  const userLabel = userDisplayName || workspace.name || "Nutzer";

  return (
    <WorkspaceShell
      workspaceName={workspace.name}
      userLabel={userLabel}
      planLabel={workspace.plan_id}
      planMeta={workspace.role}
      planStatus="Aktiv"
      mainNavigation={mainNavigation}
      settingsNavigation={settingsNavigation}
      savedViews={savedViews}
      header={{
        title: "Fans",
        subtitle: "Willkommen zurück, Pilot Test 👋",
        searchPlaceholder: "Suche nach Name, Tag, Kanal, Sprache ...",
        primaryActionLabel: "+ Neuer Fan",
        primaryActionHref: "#new-fan-modal",
      }}
      contactCount={contacts.length}
      logoutAction={logout}
    >
      <div className={styles.fansStack}>
          <section
            className={dashboardStyles.moduleCard}
            id="fans-list"
            aria-labelledby="fans-list-title"
          >
            <div className={dashboardStyles.moduleHeader}>
              <div>
                <p className={dashboardStyles.eyebrow}>Workspace-Liste</p>
                <h2 id="fans-list-title">Fans</h2>
              </div>
              <span>{contacts.length ? "Echte Daten" : "Empty State"}</span>
            </div>
            {contactsError ? (
              <p className={dashboardStyles.error}>
                <strong>Kontakte konnten nicht geladen werden.</strong>
                <span>{contactsError}</span>
              </p>
            ) : null}
            {contacts.length ? (
              <FansTable contacts={contacts} />
            ) : (
              <FansEmptyState />
            )}
          </section>

          <section
            className={styles.modalOverlay}
            id="new-fan-modal"
            aria-labelledby="new-fan-title"
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.modalCard}>
              <div className={styles.modalHeader}>
                <div>
                  <p className={dashboardStyles.eyebrow}>Manuell anlegen</p>
                  <h2 id="new-fan-title">+ Neuer Fan</h2>
                </div>
                <a
                  className={styles.modalClose}
                  href="#fans-list"
                  aria-label="Modal schließen"
                >
                  ×
                </a>
              </div>
              <form className={styles.formGrid} action={createFan}>
                <div className={styles.fieldWide}>
                  <label htmlFor="display_name">Name</label>
                  <input
                    id="display_name"
                    name="display_name"
                    required
                    placeholder="z. B. Gerhard Müller"
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="handle">Handle optional</label>
                  <input id="handle" name="handle" placeholder="@gerhard" />
                </div>
                <div className={styles.field}>
                  <label htmlFor="source_platform">Plattform/Quelle</label>
                  <select
                    id="source_platform"
                    name="source_platform"
                    defaultValue="manual"
                  >
                    <option value="manual">Manuell</option>
                    <option value="instagram">Instagram (manuell)</option>
                    <option value="tiktok">TikTok (manuell)</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="language">Sprache</label>
                  <select id="language" name="language" defaultValue="de">
                    <option value="de">Deutsch</option>
                    <option value="en">Englisch</option>
                    <option value="fr">Französisch</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="status">Status</label>
                  <select id="status" name="status" defaultValue="new">
                    <option value="new">Neu</option>
                    <option value="active">Aktiv</option>
                    <option value="warm">Warm</option>
                    <option value="follow_up">Follow-up</option>
                    <option value="paused">Pausiert</option>
                  </select>
                </div>
                <div className={styles.fieldFull}>
                  <label htmlFor="tags">Tags</label>
                  <input
                    id="tags"
                    name="tags"
                    placeholder="Kommagetrennt, z. B. VIP, Newsletter, Berlin"
                  />
                </div>
                <div className={styles.fieldFull}>
                  <label htmlFor="summary">Summary/Notiz</label>
                  <textarea
                    id="summary"
                    name="summary"
                    placeholder="Kurze manuelle Notiz zum Fan."
                  />
                  <p className={styles.fieldHint}>
                    Wird nur im aktuellen Workspace gespeichert und löst keinen
                    Versand aus.
                  </p>
                </div>
                <div className={styles.formActions}>
                  <a
                    className={dashboardStyles.secondaryButton}
                    href="#fans-list"
                  >
                    Abbrechen
                  </a>
                  <button
                    type="submit"
                    className={dashboardStyles.primaryButton}
                  >
                    Kontakt speichern
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
    </WorkspaceShell>
  );
}

function FansTable({ contacts }: { contacts: ContactRow[] }) {
  return (
    <div className={dashboardStyles.tableWrap}>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Quelle/Kanal</th>
            <th>Sprache</th>
            <th>Tags</th>
            <th>Summary</th>
            <th>Erstellt am</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id}>
              <td>
                <span className={styles.nameCell}>
                  <strong>{contact.display_name}</strong>
                  {contact.handle ? <span>{contact.handle}</span> : null}
                </span>
              </td>
              <td>{formatStatus(contact.status)}</td>
              <td>{formatSource(contact.source_platform)}</td>
              <td>{formatLanguage(contact.language)}</td>
              <td>
                {contact.tags?.length ? (
                  <span className={dashboardStyles.tagList}>
                    {contact.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </span>
                ) : (
                  <span className={styles.mutedText}>Keine Tags</span>
                )}
              </td>
              <td>
                <span className={styles.summaryCell}>
                  {contact.summary || "Keine Summary"}
                </span>
              </td>
              <td>{formatDate(contact.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FansEmptyState() {
  return (
    <div className={dashboardStyles.emptyState}>
      <strong>Noch keine echten Fans gespeichert</strong>
      <p>
        Lege den ersten Fan manuell an. FanMind behauptet hier keine aktive
        Instagram-, TikTok- oder CSV-Synchronisation.
      </p>
    </div>
  );
}

function formatSource(value: string | null): string {
  return sourceLabels[value ?? ""] ?? value ?? "Manuell";
}

function formatStatus(value: string | null): string {
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

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getUserDisplayName(
  metadata: Record<string, unknown> | undefined,
  fallback: string,
): string {
  const displayName = metadata?.display_name ?? metadata?.full_name;

  return typeof displayName === "string" && displayName.trim()
    ? displayName.trim()
    : fallback;
}

export default async function FansPage() {
  const { data, error: userError } = await getSupabaseServerUser();

  if (!data.user) {
    redirect("/login");
  }

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  const workspace = workspaceResult.workspace;
  const contactsResult = workspace
    ? await getWorkspaceContacts(workspace.id)
    : null;

  return (
    <main className={dashboardStyles.page}>
      {workspace ? (
        <FansWorkspace
          workspace={workspace}
          userDisplayName={getUserDisplayName(
            data.user.user_metadata,
            workspace.name,
          )}
          contacts={contactsResult?.contacts ?? []}
          contactsError={contactsResult?.error?.message}
        />
      ) : (
        <section
          className={dashboardStyles.fallbackCard}
          aria-label="FanMind Workspace"
        >
          <div>
            <p className={dashboardStyles.eyebrow}>FanMind Fans</p>
            <h1>Workspace-Status</h1>
            <p>
              Fans ist geschützt: Supabase Auth ist aktiv. Für deinen Account
              wurde noch kein Workspace gefunden.
            </p>
          </div>
          {userError ? (
            <p className={dashboardStyles.error}>
              <strong>
                Supabase-Session konnte nicht vollständig geprüft werden.
              </strong>
              <span>{userError.message}</span>
            </p>
          ) : null}
          {workspaceResult.error ? (
            <p className={dashboardStyles.error}>
              <strong>Workspace-Daten konnten nicht geladen werden.</strong>
              <span>{workspaceResult.error.message}</span>
            </p>
          ) : null}
          <form action={logout}>
            <button type="submit" className={dashboardStyles.secondaryButton}>
              Abmelden
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
