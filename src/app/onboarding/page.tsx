import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { getWorkspaceNavigation } from "@/lib/workspaceNavigation";
import {
  getOpenFollowupCount,
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  getWorkspaceContacts,
  signOutSupabaseServerSession,
  type ContactRow,
  type WorkspaceDashboardRow,
} from "@/lib/supabase/server";
import { getCommercialOptionLabel } from "@/lib/dashboardFeatures";
import styles from "../dashboard/dashboard.module.css";

export const metadata: Metadata = {
  title: "FanMind | Onboarding",
  description: "Geschützter Onboarding-Grundablauf für den FanMind MVP.",
};

type OnboardingStep = {
  title: string;
  description: string;
  status: "done" | "open";
  statusLabel: string;
  actionLabel?: string;
  actionHref?: string;
};

type OnboardingWorkspaceProps = {
  workspace: WorkspaceDashboardRow;
  contacts: ContactRow[];
  contactsError?: string;
  openFollowupCount: number;
  userDisplayName: string;
};

async function logout() {
  "use server";

  await signOutSupabaseServerSession();
  redirect("/login");
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

function getPlanLabel(workspace: WorkspaceDashboardRow): string {
  const planLabels: Record<string, string> = {
    pilot: "Pilot / Setup",
    starter: "Starter",
    growth: "Growth",
    agency: "Agency",
  };

  return planLabels[workspace.plan_id] ?? workspace.plan_id;
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

function getOnboardingSteps({
  workspace,
  contacts,
}: {
  workspace: WorkspaceDashboardRow;
  contacts: ContactRow[];
}): OnboardingStep[] {
  const workspaceDone = Boolean(workspace.id);
  const packageDone = Boolean(workspace.plan_id && workspace.commercial_option);
  const hasContact = contacts.length > 0;
  const firstContactHref = hasContact ? `/fans/${contacts[0].id}` : "/fans";

  return [
    {
      title: "Workspace prüfen",
      description:
        "Workspace, Rolle und Basiseinstellungen sind geladen und geschützt sichtbar.",
      status: workspaceDone ? "done" : "open",
      statusLabel: workspaceDone ? "Erledigt" : "Offen",
    },
    {
      title: "Paket bestätigen",
      description:
        "Paket und Commercial Option werden aus dem Workspace gelesen.",
      status: packageDone ? "done" : "open",
      statusLabel: packageDone ? "Erledigt" : "Offen",
    },
    {
      title: "Ersten Fan anlegen",
      description:
        "Lege mindestens einen echten Kontakt an, damit Fanliste und Details mit Workspace-Daten arbeiten.",
      status: hasContact ? "done" : "open",
      statusLabel: hasContact ? "Erledigt" : "Offen",
      actionLabel: hasContact ? "Fanliste öffnen" : "Zur Fanliste",
      actionHref: hasContact ? "/fans#fans-list" : "/fans#new-fan-modal",
    },
    {
      title: "Chatverlauf einfügen",
      description:
        "Öffne einen Fan und füge vorhandenen Gesprächskontext manuell in der Detailseite ein.",
      status: "open",
      statusLabel: hasContact ? "Manuell prüfen" : "Fan fehlt noch",
      actionLabel: hasContact ? "Fan öffnen" : "Zur Fanliste",
      actionHref: firstContactHref,
    },
    {
      title: "KI-Vorschläge testen",
      description:
        "Teste Antwortvorschläge auf einer Fan-Detailseite. Es wird nichts automatisch versendet.",
      status: "open",
      statusLabel: hasContact ? "Bereit zum Test" : "Fan fehlt noch",
      actionLabel: hasContact ? "KI im Fan testen" : "Zur Fanliste",
      actionHref: firstContactHref,
    },
    {
      title: "Dashboard prüfen",
      description:
        "Prüfe KPIs, Kontaktpipeline und offene Follow-ups im Dashboard mit echten Workspace-Daten.",
      status: "open",
      statusLabel: "Prüfen",
      actionLabel: "Zum Dashboard",
      actionHref: "/dashboard",
    },
  ];
}

function OnboardingWorkspace({
  workspace,
  contacts,
  contactsError,
  openFollowupCount,
  userDisplayName,
}: OnboardingWorkspaceProps) {
  const { mainNavigation, settingsNavigation, savedViews } =
    getWorkspaceNavigation("onboarding");
  const planLabel = getPlanLabel(workspace);
  const planStatus = getPlanStatus(workspace);
  const steps = getOnboardingSteps({ workspace, contacts });
  const completedCount = steps.filter((step) => step.status === "done").length;

  return (
    <WorkspaceShell
      workspaceName={workspace.name}
      userLabel={userDisplayName}
      planLabel={planLabel}
      planMeta={getCommercialOptionLabel(workspace.commercial_option)}
      planStatus={planStatus}
      mainNavigation={mainNavigation}
      settingsNavigation={settingsNavigation}
      savedViews={savedViews}
      header={{
        title: "Onboarding",
        subtitle: "Prüfe deinen FanMind-MVP-Grundablauf Schritt für Schritt.",
        searchPlaceholder: "Onboarding-Schritte, Fans oder Workspace suchen ...",
        primaryActionLabel: "Zum Dashboard",
        primaryActionHref: "/dashboard",
      }}
      contactCount={contacts.length}
      openFollowupCount={openFollowupCount}
      logoutAction={logout}
    >
      <section className={styles.onboardingHero} aria-labelledby="onboarding-title">
        <div>
          <p className={styles.eyebrow}>MVP Setup</p>
          <h2 id="onboarding-title">Grundablauf für den Verkauf prüfen</h2>
          <p>
            Diese Checkliste nutzt echte Workspace-Daten, Kontakte und Paketinformationen.
            Nicht aktive MVP-Bereiche bleiben als manuelle Prüfschritte markiert.
          </p>
        </div>
        <div className={styles.onboardingProgress} aria-label="Onboarding Fortschritt">
          <strong>
            {completedCount}/{steps.length}
          </strong>
          <span>aus echten Daten erledigt</span>
        </div>
      </section>

      <section className={styles.onboardingGrid} aria-label="Onboarding Checkliste">
        <article className={styles.moduleCard}>
          <div className={styles.moduleHeader}>
            <div>
              <p className={styles.eyebrow}>Checkliste</p>
              <h2>MVP-Schritte</h2>
            </div>
            <span>{contacts.length ? "Echte Daten" : "Kontakt fehlt"}</span>
          </div>
          {contactsError ? (
            <p className={styles.error}>
              <strong>Kontakte konnten nicht geladen werden.</strong>
              <span>{contactsError}</span>
            </p>
          ) : null}
          <ol className={styles.onboardingChecklist}>
            {steps.map((step, index) => (
              <li key={step.title} className={styles[`onboarding-${step.status}`]}>
                <div className={styles.onboardingStepIndex}>{index + 1}</div>
                <div>
                  <div className={styles.onboardingStepHeader}>
                    <h3>{step.title}</h3>
                    <span>{step.statusLabel}</span>
                  </div>
                  <p>{step.description}</p>
                  {step.actionHref && step.actionLabel ? (
                    <Link className={styles.secondaryButton} href={step.actionHref}>
                      {step.actionLabel}
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </article>

        <aside className={styles.moduleCard} aria-label="Workspace Status">
          <div className={styles.moduleHeader}>
            <div>
              <p className={styles.eyebrow}>Workspace</p>
              <h2>Status</h2>
            </div>
            <span>{planStatus}</span>
          </div>
          <dl className={styles.onboardingFacts}>
            <div>
              <dt>Workspace</dt>
              <dd>{workspace.name}</dd>
            </div>
            <div>
              <dt>Paket</dt>
              <dd>{planLabel}</dd>
            </div>
            <div>
              <dt>Commercial Option</dt>
              <dd>{getCommercialOptionLabel(workspace.commercial_option)}</dd>
            </div>
            <div>
              <dt>Gespeicherte Fans</dt>
              <dd>{contacts.length.toLocaleString("de-DE")}</dd>
            </div>
          </dl>
          <div className={styles.emptyActions}>
            <Link className={styles.primaryButton} href="/fans#fans-list">
              Zur Fanliste
            </Link>
            <Link className={styles.secondaryButton} href="/dashboard">
              Zum Dashboard
            </Link>
          </div>
        </aside>
      </section>

      <div className={styles.safetyNote} role="note">
        <strong>MVP-Sicherheit</strong>
        <span>
          Keine Fake-Daten, keine Zahlungslogik, keine Social-Media-Integration und kein automatisches Senden.
        </span>
      </div>
    </WorkspaceShell>
  );
}

export default async function OnboardingPage() {
  const { data } = await getSupabaseServerUser();

  if (!data.user) {
    redirect("/login");
  }

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  const workspace = workspaceResult.workspace;
  const contactsResult = workspace
    ? await getWorkspaceContacts(workspace.id)
    : null;
  const openFollowupCountResult = workspace
    ? await getOpenFollowupCount(workspace.id)
    : null;

  return (
    <main className={styles.page}>
      {workspace ? (
        <OnboardingWorkspace
          workspace={workspace}
          contacts={contactsResult?.contacts ?? []}
          contactsError={contactsResult?.error?.message}
          openFollowupCount={openFollowupCountResult?.count ?? 0}
          userDisplayName={getUserDisplayName(
            data.user.user_metadata,
            workspace.name,
          )}
        />
      ) : (
        <section className={styles.fallbackCard} aria-label="FanMind Onboarding">
          <div>
            <p className={styles.eyebrow}>FanMind Onboarding</p>
            <h1>Workspace-Status</h1>
            <p>
              Onboarding ist geschützt. Für deinen Account wurde noch kein Workspace gefunden.
            </p>
          </div>
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
