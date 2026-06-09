import { redirect } from "next/navigation";
import {
  createWorkspaceContact,
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  getWorkspaceContacts,
  signOutSupabaseServerSession,
  type ContactRow,
  type WorkspaceDashboardRow,
} from "@/lib/supabase/server";
import dashboardStyles from "../dashboard/dashboard.module.css";
import styles from "./fans.module.css";

type SidebarLink = {
  label: string;
  href: string;
  active?: boolean;
  badge?: string;
  disabled?: boolean;
};

type FansWorkspaceProps = {
  workspace: WorkspaceDashboardRow;
  userDisplayName: string;
  contacts: ContactRow[];
  contactsError?: string;
};

const sourceLabels: Record<string, string> = {
  manual: "Manuell",
  csv: "CSV (nicht importiert)",
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

async function createFan(formData: FormData) {
  "use server";

  const { data } = await getSupabaseServerUser();

  if (!data.user) {
    redirect("/login");
  }

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  const workspace = workspaceResult.workspace;

  if (!workspace) {
    throw new Error(workspaceResult.error?.message ?? "Workspace konnte nicht geladen werden.");
  }

  const result = await createWorkspaceContact({
    workspaceId: workspace.id,
    displayName: formValue(formData, "display_name"),
    handle: formValue(formData, "handle"),
    sourcePlatform: formValue(formData, "source_platform"),
    language: formValue(formData, "language"),
    status: formValue(formData, "status"),
    tags: parseTags(formValue(formData, "tags")),
    summary: formValue(formData, "summary"),
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  redirect("/fans");
}

function SidebarItem({
  label,
  href,
  active = false,
  badge,
  disabled = false,
}: SidebarLink) {
  return (
    <a
      className={active ? dashboardStyles.navItemActive : dashboardStyles.navItem}
      href={href}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
    >
      <span>{label}</span>
      {badge ? <small>{badge}</small> : null}
    </a>
  );
}

function FansWorkspace({
  workspace,
  userDisplayName,
  contacts,
  contactsError,
}: FansWorkspaceProps) {
  const mainNavigation: SidebarLink[] = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Fans", href: "/fans", active: true },
    { label: "Kanäle", href: "#channels", badge: "Roadmap" },
  ];
  const settingsNavigation: SidebarLink[] = [
    { label: "Einstellungen", href: "#workspace", disabled: true },
  ];
  const savedViews: SidebarLink[] = [
    { label: "Top Fans", href: "#fans-list" },
    { label: "Reaktivierung", href: "#fans-list" },
  ];
  const userLabel = userDisplayName || workspace.name || "Nutzer";

  return (
    <div className={dashboardStyles.dashboardShell}>
      <aside className={dashboardStyles.sidebar} aria-label="FanMind Navigation">
        <div className={dashboardStyles.logoBlock}>
          <div className={dashboardStyles.logoMark}>FM</div>
          <div>
            <strong>FanMind</strong>
            <small>Multi-Channel CRM</small>
          </div>
        </div>

        <nav className={dashboardStyles.navList} aria-label="Hauptnavigation">
          <span className={dashboardStyles.navSectionLabel}>Navigation</span>
          {mainNavigation.map((item) => (
            <SidebarItem key={item.label} {...item} />
          ))}
        </nav>

        <nav className={dashboardStyles.navList} aria-label="Workspace Navigation">
          <span className={dashboardStyles.navSectionLabel}>Workspace</span>
          {settingsNavigation.map((item) => (
            <SidebarItem key={item.label} {...item} />
          ))}
        </nav>

        <section className={dashboardStyles.savedViews} aria-label="Gespeicherte Ansichten">
          <span>Gespeicherte Ansichten</span>
          {savedViews.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
        </section>

        <div className={dashboardStyles.sidebarFooter}>
          <section className={dashboardStyles.userMiniCard} aria-label="Nutzer">
            <div className={dashboardStyles.avatarMark}>{getInitials(userLabel)}</div>
            <div>
              <span>Nutzer</span>
              <strong>{userLabel}</strong>
              <p>{workspace.name}</p>
            </div>
          </section>
          <section className={dashboardStyles.planMiniCard} aria-label="Paket">
            <div>
              <span>Paket</span>
              <strong>{workspace.plan_id}</strong>
              <p>{workspace.role}</p>
            </div>
            <small>Aktiv</small>
          </section>
          <form action={logout}>
            <button type="submit" className={dashboardStyles.logoutButton}>
              Abmelden
            </button>
          </form>
        </div>
      </aside>

      <div className={dashboardStyles.dashboardContent}>
        <header className={dashboardStyles.topbar}>
          <div className={dashboardStyles.titleCluster}>
            <h1>Fans</h1>
            <p>Workspace-bezogene Kontakte für {workspace.name}</p>
          </div>
          <div className={dashboardStyles.topbarActions}>
            <a className={dashboardStyles.primaryButton} href="#new-fan">
              + Neuer Fan
            </a>
          </div>
        </header>

        <div className={styles.fansStack}>
          <section className={dashboardStyles.moduleCard} id="workspace" aria-labelledby="workspace-title">
            <div className={dashboardStyles.moduleHeader}>
              <div>
                <p className={dashboardStyles.eyebrow}>Fans / Kontakte</p>
                <h2 id="workspace-title">Kontakt-CRM</h2>
              </div>
              <span>{contacts.length} echte Kontakte</span>
            </div>
            <p className={dashboardStyles.moduleText}>
              Diese Seite liest und speichert Fans ausschließlich für den aktuell geladenen Workspace. Social-Media-Kanäle sind nicht synchronisiert; Kanalwerte sind manuelle Kontaktquellen.
            </p>
            {contactsError ? (
              <p className={dashboardStyles.error}>
                <strong>Kontakte konnten nicht geladen werden.</strong>
                <span>{contactsError}</span>
              </p>
            ) : null}
          </section>

          <section className={dashboardStyles.moduleCard} id="new-fan" aria-labelledby="new-fan-title">
            <div className={dashboardStyles.moduleHeader}>
              <div>
                <p className={dashboardStyles.eyebrow}>Manuell anlegen</p>
                <h2 id="new-fan-title">+ Neuer Fan</h2>
              </div>
              <span>Kein Auto-Sync</span>
            </div>
            <form className={styles.formGrid} action={createFan}>
              <div className={styles.fieldWide}>
                <label htmlFor="display_name">Name</label>
                <input id="display_name" name="display_name" required placeholder="z. B. Sandra Müller" />
              </div>
              <div className={styles.field}>
                <label htmlFor="handle">Handle</label>
                <input id="handle" name="handle" placeholder="@sandra" />
              </div>
              <div className={styles.field}>
                <label htmlFor="source_platform">Quelle/Kanal</label>
                <select id="source_platform" name="source_platform" defaultValue="manual">
                  <option value="manual">Manuell</option>
                  <option value="csv">CSV (manuell)</option>
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
                <input id="tags" name="tags" placeholder="Kommagetrennt, z. B. VIP, Newsletter, Berlin" />
              </div>
              <div className={styles.fieldFull}>
                <label htmlFor="summary">Summary</label>
                <textarea
                  id="summary"
                  name="summary"
                  placeholder="Kurze manuelle Notiz zum Fan – keine KI-Zusammenfassung."
                />
                <p className={styles.fieldHint}>
                  Wird nur im aktuellen Workspace gespeichert und löst keinen Versand aus.
                </p>
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={dashboardStyles.primaryButton}>
                  Kontakt speichern
                </button>
              </div>
            </form>
          </section>

          <section className={dashboardStyles.moduleCard} id="fans-list" aria-labelledby="fans-list-title">
            <div className={dashboardStyles.moduleHeader}>
              <div>
                <p className={dashboardStyles.eyebrow}>Workspace-Liste</p>
                <h2 id="fans-list-title">Fans</h2>
              </div>
              <span>{contacts.length ? "Echte Daten" : "Empty State"}</span>
            </div>
            {contacts.length ? <FansTable contacts={contacts} /> : <FansEmptyState />}
          </section>
        </div>
      </div>
    </div>
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
                <span className={styles.summaryCell}>{contact.summary || "Keine Summary"}</span>
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
        Lege den ersten Fan manuell an. FanMind behauptet hier keine aktive Instagram-, TikTok- oder CSV-Synchronisation.
      </p>
      <div className={dashboardStyles.emptyActions}>
        <a className={dashboardStyles.primaryButton} href="#new-fan">
          + Neuer Fan
        </a>
      </div>
    </div>
  );
}

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
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

function getInitials(value: string): string {
  const [first = "F", second = "M"] = value.trim().split(/\s+/);

  return `${first[0] ?? "F"}${second[0] ?? "M"}`.toUpperCase();
}

function getUserDisplayName(metadata: Record<string, unknown> | undefined, fallback: string): string {
  const displayName = metadata?.display_name ?? metadata?.full_name;

  return typeof displayName === "string" && displayName.trim() ? displayName.trim() : fallback;
}

export default async function FansPage() {
  const { data, error: userError } = await getSupabaseServerUser();

  if (!data.user) {
    redirect("/login");
  }

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  const workspace = workspaceResult.workspace;
  const contactsResult = workspace ? await getWorkspaceContacts(workspace.id) : null;

  return (
    <main className={dashboardStyles.page}>
      {workspace ? (
        <FansWorkspace
          workspace={workspace}
          userDisplayName={getUserDisplayName(data.user.user_metadata, workspace.name)}
          contacts={contactsResult?.contacts ?? []}
          contactsError={contactsResult?.error?.message}
        />
      ) : (
        <section className={dashboardStyles.fallbackCard} aria-label="FanMind Workspace">
          <div>
            <p className={dashboardStyles.eyebrow}>FanMind Fans</p>
            <h1>Workspace-Status</h1>
            <p>
              Fans ist geschützt: Supabase Auth ist aktiv. Für deinen Account wurde noch kein Workspace gefunden.
            </p>
          </div>
          {userError ? (
            <p className={dashboardStyles.error}>
              <strong>Supabase-Session konnte nicht vollständig geprüft werden.</strong>
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
