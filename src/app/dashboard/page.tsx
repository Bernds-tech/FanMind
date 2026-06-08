import { redirect } from "next/navigation";
import { ensureUserWorkspace, getSupabaseServerUser, signOutSupabaseServerSession, type WorkspaceBackfillRow } from "@/lib/supabase/server";
import styles from "./dashboard.module.css";

type DashboardPageProps = {
  searchParams: Promise<{ demo?: string | string[] }>;
};

type WorkspaceDetailsProps = {
  workspace: WorkspaceBackfillRow;
  email?: string;
};

async function logout() {
  "use server";

  await signOutSupabaseServerSession();
  redirect("/login");
}

function WorkspaceDetails({ workspace, email }: WorkspaceDetailsProps) {
  return (
    <dl className={styles.details}>
      <div>
        <dt>Workspace-Name</dt>
        <dd>{workspace.name}</dd>
      </div>
      <div>
        <dt>E-Mail</dt>
        <dd>{email ?? "Nicht in der Supabase-Session enthalten"}</dd>
      </div>
      <div>
        <dt>plan_id</dt>
        <dd>{workspace.plan_id}</dd>
      </div>
      <div>
        <dt>commercial_option</dt>
        <dd>{workspace.commercial_option}</dd>
      </div>
      <div>
        <dt>setup_fee_cents</dt>
        <dd>{workspace.setup_fee_cents}</dd>
      </div>
      <div>
        <dt>monthly_fee_cents</dt>
        <dd>{workspace.monthly_fee_cents}</dd>
      </div>
      <div>
        <dt>commitment_months</dt>
        <dd>{workspace.commitment_months}</dd>
      </div>
    </dl>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const isDemoMode = Array.isArray(params.demo) ? params.demo.includes("1") : params.demo === "1";
  const { data, error: userError } = await getSupabaseServerUser();

  if (!isDemoMode && !data.user) {
    redirect("/login");
  }

  const workspaceResult = data.user ? await ensureUserWorkspace(data.user) : null;
  const workspace = workspaceResult?.workspace ?? null;
  const workspaceError = workspaceResult?.error ?? userError;

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-label="FanMind Workspace">
        <p className={styles.eyebrow}>FanMind MVP</p>
        <h1>{workspace?.name ?? "FanMind Workspace"}</h1>
        {isDemoMode ? (
          <p className={styles.demoBadge}>Demo-Modus aktiv · ohne echte Authentifizierung</p>
        ) : workspace ? (
          <p className={styles.status}>{workspaceResult?.created ? "Workspace wurde beim ersten Zugriff automatisch vorbereitet." : "Workspace geladen."}</p>
        ) : (
          <p className={styles.error} role="alert">
            Workspace konnte nicht vorbereitet werden: {workspaceError?.message ?? "Unbekannter Supabase-Fehler."}
          </p>
        )}
        {workspace ? (
          <WorkspaceDetails workspace={workspace} email={data.user?.email} />
        ) : data.user?.email ? (
          <p className={styles.meta}>Session für {data.user.email}</p>
        ) : null}
        <p className={styles.notice}>
          Dieser Workspace zeigt Auth, Session und die echten Workspace-Grunddaten. Kontakte, Memories, Follow-ups und KI-Logik bleiben bewusst außerhalb dieses Dashboards.
        </p>
        <div className={styles.actions}>
          <a href="/landing-v2">Zur Landingpage</a>
          {isDemoMode ? (
            <a href="/login">Zum Login</a>
          ) : (
            <form action={logout}>
              <button type="submit">Logout</button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
