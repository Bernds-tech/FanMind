import Link from "next/link";
import { redirect } from "next/navigation";
import { getBillingContinuationHref } from "@/lib/preActivation";
import {
  ensureUserWorkspace,
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  signOutSupabaseServerSession,
} from "@/lib/supabase/server";
import styles from "../../dashboard/dashboard.module.css";

async function logout() {
  "use server";
  await signOutSupabaseServerSession();
  redirect("/login");
}

export default async function WorkspaceSetupPage() {
  const { data } = await getSupabaseServerUser();
  if (!data.user) redirect("/login");

  const existingWorkspaceResult = await getUserWorkspaceDashboard(data.user);
  if (existingWorkspaceResult.error?.message === "TEMPORARY_DEMO_DELETED") redirect("/login?demo_deleted=1");
  if (existingWorkspaceResult.workspace) redirect(getBillingContinuationHref(existingWorkspaceResult.workspace));

  const setupResult = await ensureUserWorkspace(data.user);
  if (setupResult.workspace) redirect("/billing/start");

  return (
    <main className={styles.page}>
      <section className={styles.fallbackCard} aria-label="Workspace einrichten">
        <div>
          <p className={styles.eyebrow}>FanMind Setup</p>
          <h1>Wir richten deinen Workspace ein …</h1>
          <p>Dein Konto wurde bestätigt. FanMind bereitet jetzt deinen Workspace und deine Zahlungsfreischaltung vor.</p>
        </div>

        <div className={styles.emptyState}>
          <strong>Dein Workspace konnte noch nicht automatisch eingerichtet werden.</strong>
          <p>Bitte versuche es erneut oder kontaktiere FanMind.</p>
          {setupResult.error ? <p className={styles.error}>{setupResult.error.message}</p> : null}
        </div>

        <div className={styles.emptyActions}>
          <Link className={styles.primaryButton} href="/workspace/setup">Erneut versuchen</Link>
          <form action={logout}><button className={styles.secondaryButton} type="submit">Abmelden</button></form>
        </div>
      </section>
    </main>
  );
}
