import { redirect } from "next/navigation";
import {
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  getWorkspaceContacts,
  signOutSupabaseServerSession,
  type WorkspaceDashboardRow,
} from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { WorkspaceKpiStrip } from "@/components/WorkspaceKpiStrip";
import dashboardStyles from "../dashboard/dashboard.module.css";

type SidebarLink = {
  label: string;
  href: string;
  active?: boolean;
  badge?: string;
  disabled?: boolean;
};

type ChannelsWorkspaceProps = {
  workspace: WorkspaceDashboardRow;
  userDisplayName: string;
  contactCount: number;
};

async function logout() {
  "use server";

  await signOutSupabaseServerSession();
  redirect("/login");
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
      className={
        active ? dashboardStyles.navItemActive : dashboardStyles.navItem
      }
      href={href}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
    >
      <span>{label}</span>
      {badge ? <small>{badge}</small> : null}
    </a>
  );
}

function ChannelsWorkspace({
  workspace,
  userDisplayName,
  contactCount,
}: ChannelsWorkspaceProps) {
  const mainNavigation: SidebarLink[] = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Fans", href: "/fans" },
    { label: "Kanäle", href: "/channels", active: true, badge: "Roadmap" },
  ];
  const settingsNavigation: SidebarLink[] = [
    { label: "Einstellungen", href: "#workspace", disabled: true },
  ];
  const savedViews: SidebarLink[] = [
    { label: "Top Fans", href: "/fans#fans-list" },
    { label: "Reaktivierung", href: "/dashboard#followups" },
  ];
  const userLabel = userDisplayName || workspace.name || "Nutzer";

  return (
    <div className={dashboardStyles.dashboardShell}>
      <aside
        className={dashboardStyles.sidebar}
        aria-label="FanMind Navigation"
      >
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

        <nav
          className={dashboardStyles.navList}
          aria-label="Workspace Navigation"
        >
          <span className={dashboardStyles.navSectionLabel}>Workspace</span>
          {settingsNavigation.map((item) => (
            <SidebarItem key={item.label} {...item} />
          ))}
        </nav>

        <section
          className={dashboardStyles.savedViews}
          aria-label="Gespeicherte Ansichten"
        >
          <span>Gespeicherte Ansichten</span>
          {savedViews.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
        </section>

        <div className={dashboardStyles.sidebarFooter}>
          <section className={dashboardStyles.userMiniCard} aria-label="Nutzer">
            <div className={dashboardStyles.avatarMark}>
              {getInitials(userLabel)}
            </div>
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
            <small>Roadmap</small>
          </section>
          <form action={logout}>
            <button type="submit" className={dashboardStyles.logoutButton}>
              Abmelden
            </button>
          </form>
        </div>
      </aside>

      <div
        className={`${dashboardStyles.dashboardContent} ${dashboardStyles.dashboardContentStart}`}
      >
        <AppHeader
          title="Kanäle"
          subtitle="Willkommen zurück, Pilot Test 👋"
          searchPlaceholder="Suche nach Name, Tag, Kanal, Sprache ..."
          primaryActionLabel="Kanal vormerken"
          primaryActionHref="#channels-preview"
        />

        <WorkspaceKpiStrip contactCount={contactCount} />

        <section
          className={dashboardStyles.moduleCard}
          id="channels-preview"
          aria-labelledby="channels-title"
        >
          <div className={dashboardStyles.moduleHeader}>
            <div>
              <p className={dashboardStyles.eyebrow}>Coming Soon</p>
              <h2 id="channels-title">Kanäle vormerken</h2>
            </div>
            <span>Keine Integration aktiv</span>
          </div>
          <p className={dashboardStyles.moduleText}>
            Diese Seite ist eine MVP-Vorschau. FanMind startet hier keine echte
            Social-Media-Integration, synchronisiert keine Plattformdaten und
            sendet nichts automatisch.
          </p>
          <div className={dashboardStyles.emptyState}>
            <strong>Noch keine Kanäle verbunden.</strong>
            <p>
              Kanäle können aktuell nur als Produktbereich vorgemerkt werden.
              Kontakte auf der Fans-Seite bleiben manuell gepflegte
              Workspace-Daten.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function getInitials(value: string): string {
  const [first = "F", second = "M"] = value.trim().split(/\s+/);

  return `${first[0] ?? "F"}${second[0] ?? "M"}`.toUpperCase();
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

export default async function ChannelsPage() {
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
        <ChannelsWorkspace
          workspace={workspace}
          userDisplayName={getUserDisplayName(
            data.user.user_metadata,
            workspace.name,
          )}
          contactCount={contactsResult?.contacts.length ?? 0}
        />
      ) : (
        <section
          className={dashboardStyles.fallbackCard}
          aria-label="FanMind Kanäle"
        >
          <div>
            <p className={dashboardStyles.eyebrow}>FanMind Kanäle</p>
            <h1>Workspace-Status</h1>
            <p>
              Kanäle ist geschützt: Supabase Auth ist aktiv. Für deinen Account
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
