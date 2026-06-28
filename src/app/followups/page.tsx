import Link from "next/link";
import { redirect } from "next/navigation";
import { getPreActivationRedirect } from "@/lib/preActivation";
import {
  getOpenFollowupCount,
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  getWorkspaceContacts,
  getWorkspaceFollowups,
  getWorkspaceOpenFollowups,
  signOutSupabaseServerSession,
  type ContactRow,
  type FollowupRow,
  type WorkspaceDashboardRow,
} from "@/lib/supabase/server";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { getWorkspaceNavigationForUser } from "@/lib/workspaceNavigation";
import { resolveWorkspaceLocale } from "@/lib/workspaceLocale";
import { wt } from "@/lib/workspaceCopy";
import type { FanMindLanguage } from "@/lib/fanmindCopy";
import { getWorkspaceKpiStatsFromContacts } from "@/lib/workspaceKpiStats";
import dashboardStyles from "../dashboard/dashboard.module.css";

type FollowupsPageProps = {
  searchParams?: Promise<{ status?: string | string[]; lang?: string | string[] }>;
};

async function logout() {
  "use server";
  await signOutSupabaseServerSession();
  redirect("/login");
}

export default async function FollowupsPage({ searchParams }: FollowupsPageProps) {
  const params = await searchParams;
  const requestedStatus = getSingleParam(params?.status);
  const status = requestedStatus === "done" ? "done" : "open";
  const { data } = await getSupabaseServerUser();

  if (!data.user) redirect("/login");

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  if (workspaceResult.error?.message === "TEMPORARY_DEMO_DELETED") {
    redirect("/login?demo_deleted=1");
  }

  const workspace = workspaceResult.workspace;
  const preActivationRedirect = getPreActivationRedirect(workspace);
  if (preActivationRedirect) redirect(preActivationRedirect);
  if (!workspace) redirect("/login");

  const locale = await resolveWorkspaceLocale({ lang: getSingleParam(params?.lang), user: data.user });
  const [
    contactsResult,
    followupsResult,
    openFollowupsResult,
    openFollowupCountResult,
  ] = await Promise.all([
    getWorkspaceContacts(workspace.id),
    getWorkspaceFollowups(workspace.id, status),
    getWorkspaceOpenFollowups(workspace.id),
    getOpenFollowupCount(workspace.id),
  ]);

  return (
    <main className={dashboardStyles.page}>
      <FollowupsWorkspace
        workspace={workspace}
        locale={locale}
        userDisplayName={getUserDisplayName(data.user.user_metadata, workspace.name)}
        contacts={contactsResult.contacts}
        contactsError={contactsResult.error?.message}
        followups={followupsResult.followups}
        followupsError={followupsResult.error?.message}
        openFollowupCount={openFollowupCountResult.count}
        dueFollowupCount={countDueOrOverdueOpenFollowups(openFollowupsResult.followups)}
        activeStatus={status}
        userEmail={data.user.email}
      />
    </main>
  );
}

function countDueOrOverdueOpenFollowups(followups: FollowupRow[]): number {
  const today = new Date().toISOString().slice(0, 10);

  return followups.filter(
    (followup) => followup.status === "open" && followup.due_date && followup.due_date <= today,
  ).length;
}

function FollowupsWorkspace({
  workspace,
  locale,
  userDisplayName,
  contacts,
  contactsError,
  followups,
  followupsError,
  openFollowupCount,
  dueFollowupCount,
  activeStatus,
  userEmail,
}: {
  workspace: WorkspaceDashboardRow;
  locale: FanMindLanguage;
  userDisplayName: string;
  contacts: ContactRow[];
  contactsError?: string;
  followups: FollowupRow[];
  followupsError?: string;
  openFollowupCount: number;
  dueFollowupCount: number;
  activeStatus: "open" | "done";
  userEmail: string | null | undefined;
}) {
  const { mainNavigation, settingsNavigation, savedViews } = getWorkspaceNavigationForUser("followups", userEmail, locale, dueFollowupCount);
  const contactsById = new Map(contacts.map((contact) => [contact.id, contact]));

  return (
    <WorkspaceShell
      workspaceName={workspace.name}
      userLabel={userDisplayName || workspace.name || (locale === "en" ? "User" : "Nutzer")}
      planLabel={workspace.plan_id}
      planMeta={workspace.role}
      planStatus={wt(locale, "Aktiv")}
      mainNavigation={mainNavigation}
      settingsNavigation={settingsNavigation}
      savedViews={savedViews}
      header={{
        title: "Follow-ups",
        subtitle: locale === "en" ? "Manual tasks and replies that are still open." : "Manuelle Aufgaben und Rückmeldungen, die noch offen sind.",
        searchPlaceholder: locale === "en" ? "Search follow-ups ..." : "Follow-ups suchen ...",
        primaryActionLabel: wt(locale, "Zur Fanliste"),
        primaryActionHref: "/fans#fans-list",
      }}
      contactCount={getWorkspaceKpiStatsFromContacts(contacts).totalFans}
      openFollowupCount={openFollowupCount}
      logoutAction={logout}
      locale={locale}
    >
      <section className={dashboardStyles.moduleCard}>
        <div className={dashboardStyles.moduleHeader}>
          <div>
            <p className={dashboardStyles.eyebrow}>{locale === "en" ? "Manual tasks" : "Manuelle Aufgaben"}</p>
            <h2>{activeStatus === "done" ? (locale === "en" ? "Done" : "Erledigt") : (locale === "en" ? "Open" : "Offen")}</h2>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link className={dashboardStyles.secondaryButton} href="/followups?status=open">{locale === "en" ? "Open" : "Offen"}</Link>
            <Link className={dashboardStyles.secondaryButton} href="/followups?status=done">{locale === "en" ? "Done" : "Erledigt"}</Link>
          </div>
        </div>
        {contactsError ? <p className={dashboardStyles.error}><strong>{contactsError}</strong></p> : null}
        {followupsError ? <p className={dashboardStyles.error}><strong>{followupsError}</strong></p> : null}
        {followups.length ? (
          <div style={{ overflowX: "auto" }}>
            <table className={dashboardStyles.simpleTable}>
              <thead>
                <tr>
                  <th>{locale === "en" ? "Contact" : "Kontakt"}</th>
                  <th>{locale === "en" ? "Task" : "Aufgabe"}</th>
                  <th>{locale === "en" ? "Due" : "Fällig"}</th>
                  <th>{locale === "en" ? "Priority" : "Priorität"}</th>
                  <th>Status</th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody>
                {followups.map((followup) => {
                  const contact = contactsById.get(followup.contact_id);
                  return (
                    <tr key={followup.id}>
                      <td>{contact?.display_name || contact?.handle || followup.contact_id}</td>
                      <td>{followup.reason}</td>
                      <td>{followup.due_date ?? "—"}</td>
                      <td>{followup.priority ?? "normal"}</td>
                      <td>{followup.status ?? "open"}</td>
                      <td><Link href={`/fans/${followup.contact_id}`}>{locale === "en" ? "Open fan" : "Fan öffnen"}</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={dashboardStyles.emptyState}>
            <strong>{locale === "en" ? "No follow-ups found." : "Keine Follow-ups gefunden."}</strong>
          </div>
        )}
      </section>
    </WorkspaceShell>
  );
}

function getSingleParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getUserDisplayName(metadata: Record<string, unknown> | undefined, fallback: string): string {
  const displayName = metadata?.display_name ?? metadata?.full_name;
  return typeof displayName === "string" && displayName.trim() ? displayName.trim() : fallback;
}
