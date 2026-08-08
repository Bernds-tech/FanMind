import Link from "next/link";
import { redirect } from "next/navigation";
import { getBillingContinuationHref } from "@/lib/preActivation";
import { resolveWorkspaceLocale } from "@/lib/workspaceLocale";
import {
  ensureUserWorkspace,
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  PUBLIC_DAILY_TEST_PLAN_UNAVAILABLE_ERROR,
  PUBLIC_DAILY_TEST_PROVISIONING_UNAVAILABLE_ERROR,
  signOutSupabaseServerSession,
} from "@/lib/supabase/server";
import styles from "../../dashboard/dashboard.module.css";

export const dynamic = "force-dynamic";

async function logout() {
  "use server";
  await signOutSupabaseServerSession();
  redirect("/");
}

export default async function WorkspaceSetupPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string | string[] }>;
}) {
  const params = await searchParams;
  const { data } = await getSupabaseServerUser();
  if (!data.user) {
    const requestedLang = Array.isArray(params?.lang)
      ? params.lang[0]
      : params?.lang;
    const returnTo = requestedLang === "en"
      ? "/workspace/setup?lang=en"
      : "/workspace/setup";
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const locale = await resolveWorkspaceLocale({
    lang: params?.lang,
    user: data.user,
  });

  const existingWorkspaceResult = await getUserWorkspaceDashboard(data.user);
  if (existingWorkspaceResult.error?.message === "TEMPORARY_DEMO_DELETED") redirect("/login?demo_deleted=1");
  if (existingWorkspaceResult.workspace) redirect(getBillingContinuationHref(existingWorkspaceResult.workspace));

  const setupResult = await ensureUserWorkspace(data.user);
  if (setupResult.workspace) redirect("/billing/start");
  const dailyTestUnavailable =
    setupResult.error?.message === PUBLIC_DAILY_TEST_PLAN_UNAVAILABLE_ERROR ||
    setupResult.error?.message ===
      PUBLIC_DAILY_TEST_PROVISIONING_UNAVAILABLE_ERROR;
  const setupErrorMessage = dailyTestUnavailable
    ? locale === "en"
      ? "The public beta window is closed or has not yet passed its secure rollout. No workspace was created. Contact FanMind for a controlled switch to Starter."
      : "Das öffentliche Beta-Fenster ist geschlossen oder noch nicht sicher freigegeben. Es wurde kein Workspace angelegt. Bitte kontaktiere FanMind für den kontrollierten Wechsel zu Starter."
    : setupResult.error
      ? locale === "en"
        ? "Secure workspace provisioning is not available yet. Retry later or contact FanMind."
        : "Die sichere Workspace-Einrichtung ist noch nicht verfügbar. Bitte versuche es erneut oder kontaktiere FanMind."
      : null;
  const retryHref = locale === "en"
    ? "/workspace/setup?lang=en"
    : "/workspace/setup";

  return (
    <main className={styles.page}>
      <section
        className={styles.fallbackCard}
        aria-label={locale === "en" ? "Set up workspace" : "Workspace einrichten"}
      >
        <div>
          <p className={styles.eyebrow}>FanMind Setup</p>
          <h1>{locale === "en" ? "We are setting up your workspace …" : "Wir richten deinen Workspace ein …"}</h1>
          <p>
            {locale === "en"
              ? "Your account has been confirmed. FanMind is preparing your workspace and payment activation."
              : "Dein Konto wurde bestätigt. FanMind bereitet jetzt deinen Workspace und deine Zahlungsfreischaltung vor."}
          </p>
        </div>

        <div className={styles.emptyState}>
          <strong>
            {locale === "en"
              ? "Your workspace could not yet be set up automatically."
              : "Dein Workspace konnte noch nicht automatisch eingerichtet werden."}
          </strong>
          <p>
            {locale === "en"
              ? "Please retry or contact FanMind."
              : "Bitte versuche es erneut oder kontaktiere FanMind."}
          </p>
          {setupErrorMessage ? <p className={styles.error}>{setupErrorMessage}</p> : null}
        </div>

        <div className={styles.emptyActions}>
          <Link className={styles.primaryButton} href={retryHref}>
            {locale === "en" ? "Retry" : "Erneut versuchen"}
          </Link>
          <form action={logout}>
            <button className={styles.secondaryButton} type="submit">
              {locale === "en" ? "Sign out" : "Abmelden"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
