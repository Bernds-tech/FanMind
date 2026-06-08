import { redirect } from "next/navigation";
import {
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  signOutSupabaseServerSession,
  type WorkspaceDashboardRow,
} from "@/lib/supabase/server";
import {
  getCommercialOptionLabel,
  getDashboardFeatureGroups,
  getDashboardStatusLabel,
  getDashboardStatusText,
  type ResolvedDashboardFeature,
} from "@/lib/dashboardFeatures";
import styles from "./dashboard.module.css";

type WorkspaceDetailsProps = {
  workspace: WorkspaceDashboardRow;
  email?: string;
};

type WorkspaceDisplay = {
  packageName: string;
  commercialOptionName: string;
  setupFeeLabel: string;
  monthlyFeeLabel: string;
  commitmentLabel: string;
  note: string;
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

function getWorkspaceDisplay(workspace: WorkspaceDashboardRow): WorkspaceDisplay {
  const setupFee = formatEuro(workspace.setup_fee_cents);
  const monthlyFee = formatEuro(workspace.monthly_fee_cents);

  if (workspace.plan_id === "pilot" && workspace.commercial_option === "pilot_only") {
    return {
      packageName: "Pilot / Setup",
      commercialOptionName: getCommercialOptionLabel(workspace.commercial_option),
      setupFeeLabel: setupFee,
      monthlyFeeLabel: monthlyFee,
      commitmentLabel: "keine",
      note: "Demo-/Setupmonat mit Demo-Daten, Sandra M., KI-Demo, Memory-Demo, Follow-up-Demo und Roadmap-Hinweisen.",
    };
  }

  if (workspace.plan_id === "starter" && workspace.commercial_option === "starter_12m_setup_waived") {
    return {
      packageName: "Starter",
      commercialOptionName: getCommercialOptionLabel(workspace.commercial_option),
      setupFeeLabel: `${setupFee} statt ${formatEuro(99000)}`,
      monthlyFeeLabel: monthlyFee,
      commitmentLabel: "12 Monate",
      note: "Produktiver Einstieg: Kontakte, CSV-Import, Memory und Follow-ups sind aktiv; KI-Antwortvorschläge bleiben limitiert.",
    };
  }

  if (workspace.plan_id === "starter" && workspace.commercial_option === "starter_paid_setup") {
    return {
      packageName: "Starter",
      commercialOptionName: getCommercialOptionLabel(workspace.commercial_option),
      setupFeeLabel: setupFee,
      monthlyFeeLabel: monthlyFee,
      commitmentLabel: "keine 12-Monatsbindung",
      note: "Produktiver Einstieg ohne feste Bindung: Kontakte, CSV-Import, Memory und Follow-ups sind aktiv; KI-Antwortvorschläge bleiben limitiert.",
    };
  }

  if (workspace.plan_id === "growth") {
    return {
      packageName: "Growth",
      commercialOptionName: getCommercialOptionLabel(workspace.commercial_option),
      setupFeeLabel: setupFee,
      monthlyFeeLabel: monthlyFee,
      commitmentLabel: workspace.commitment_months > 0 ? `${workspace.commitment_months} Monate` : "noch nicht produktiv gebucht",
      note: "Growth ist aktuell als Vorschau vorbereitet: mehrere Profile, Basis-Segmente, höhere KI-Nutzung und erweiterte Follow-ups werden getrennt markiert.",
    };
  }

  if (workspace.plan_id === "agency") {
    return {
      packageName: "Agency",
      commercialOptionName: getCommercialOptionLabel(workspace.commercial_option),
      setupFeeLabel: setupFee,
      monthlyFeeLabel: monthlyFee,
      commitmentLabel: workspace.commitment_months > 0 ? `${workspace.commitment_months} Monate` : "Demo / Erstgespräch",
      note: "Agency ist aktuell Demo/Erstgespräch/Vorschau: Multi-Client, Teamstruktur und Agentur-Workflow werden vorbereitet, aber nicht produktiv freigeschaltet.",
    };
  }

  return {
    packageName: workspace.plan_id,
    commercialOptionName: getCommercialOptionLabel(workspace.commercial_option),
    setupFeeLabel: setupFee,
    monthlyFeeLabel: monthlyFee,
    commitmentLabel: workspace.commitment_months > 0 ? `${workspace.commitment_months} Monate` : "keine",
    note: "Workspace-Daten wurden geladen. Die sichtbaren Dashboard-Module werden aus plan_id und commercial_option abgeleitet.",
  };
}

function FeatureCard({ feature }: { feature: ResolvedDashboardFeature }) {
  return (
    <article className={`${styles.featureCard} ${styles[`status-${feature.status}`]}`}>
      <div className={styles.featureHeader}>
        <h3>{feature.label}</h3>
        <span>{getDashboardStatusLabel(feature.status)}</span>
      </div>
      <p>{feature.description}</p>
      <small>{getDashboardStatusText(feature.status, feature.minPlan)}</small>
      {feature.ctaLabel ? <strong className={styles.featureCta}>{feature.ctaLabel}</strong> : null}
    </article>
  );
}

function CompactFeatureCard({ feature }: { feature: ResolvedDashboardFeature }) {
  return (
    <article className={`${styles.compactFeatureCard} ${styles[`status-${feature.status}`]}`}>
      <div>
        <h3>{feature.label}</h3>
        <p>{getDashboardStatusText(feature.status, feature.minPlan)}</p>
      </div>
      <span>{getDashboardStatusLabel(feature.status)}</span>
    </article>
  );
}

function WorkspaceDetails({ workspace, email }: WorkspaceDetailsProps) {
  const display = getWorkspaceDisplay(workspace);
  const featureGroups = getDashboardFeatureGroups(workspace.plan_id, workspace.commercial_option);

  return (
    <div className={styles.dashboardShell}>
      <aside className={styles.sidebar} aria-label="Aktive Dashboard-Navigation">
        <strong>Module</strong>
        <nav>
          {featureGroups.sidebar.map((feature) => (
            <a key={feature.key} href={feature.route ?? `#${feature.key}`}>
              <span>{feature.label}</span>
              <small>{getDashboardStatusLabel(feature.status)}</small>
            </a>
          ))}
        </nav>
      </aside>

      <div className={styles.workspacePanel}>
        <section className={styles.statusPanel} aria-label="Workspace- und Paketstatus">
          <div>
            <p className={styles.eyebrow}>Workspace / Paket</p>
            <h2>{workspace.name}</h2>
            <p>{display.note}</p>
          </div>
          <div className={styles.summaryGrid} aria-label="Workspace-Status">
            <section>
              <span>Eingeloggt als</span>
              <strong>{email ?? "Nicht in der Supabase-Session enthalten"}</strong>
            </section>
            <section>
              <span>Rolle</span>
              <strong>{workspace.role}</strong>
            </section>
            <section>
              <span>Paket</span>
              <strong>{display.packageName}</strong>
            </section>
            <section>
              <span>Commercial</span>
              <strong>{display.commercialOptionName}</strong>
            </section>
          </div>

          <dl className={styles.details}>
            <div>
              <dt>plan_id</dt>
              <dd>{workspace.plan_id}</dd>
            </div>
            <div>
              <dt>commercial_option</dt>
              <dd>{workspace.commercial_option}</dd>
            </div>
            <div>
              <dt>Einrichtung</dt>
              <dd>{display.setupFeeLabel}</dd>
            </div>
            <div>
              <dt>Monatlich</dt>
              <dd>{display.monthlyFeeLabel}</dd>
            </div>
            <div>
              <dt>Bindung</dt>
              <dd>{display.commitmentLabel}</dd>
            </div>
          </dl>
        </section>

        <p className={styles.noSendingNotice}>Kein automatisches Senden: FanMind bereitet Antworten, Imports und Follow-ups nur manuell vor.</p>

        <section className={styles.featureSection} aria-labelledby="active-features">
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Paketabhängig sichtbar</p>
            <h2 id="active-features">Aktive Funktionen</h2>
          </div>
          <div className={styles.featureGrid}>
            {featureGroups.active.map((feature) => (
              <FeatureCard key={feature.key} feature={feature} />
            ))}
          </div>
        </section>

        <section className={styles.featureSection} aria-labelledby="later-features">
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Klar getrennt</p>
            <h2 id="later-features">Später / Upgrade</h2>
          </div>
          <div className={styles.compactGrid}>
            {featureGroups.later.map((feature) => (
              <CompactFeatureCard key={feature.key} feature={feature} />
            ))}
          </div>
        </section>

        <section className={styles.featureSection} id="roadmap" aria-labelledby="roadmap-features">
          <div className={styles.sectionHeader}>
            <p className={styles.eyebrow}>Roadmap</p>
            <h2 id="roadmap-features">Roadmap / Hinweise</h2>
          </div>
          <div className={styles.compactGrid}>
            {featureGroups.roadmap.map((feature) => (
              <CompactFeatureCard key={feature.key} feature={feature} />
            ))}
          </div>
        </section>
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

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-label="FanMind Workspace">
        <div className={styles.heroHeader}>
          <div>
            <p className={styles.eyebrow}>FanMind Dashboard</p>
            <h1>{workspace?.name ?? "Workspace-Status"}</h1>
          </div>
          <form action={logout}>
            <button type="submit" className={styles.secondaryButton}>Abmelden</button>
          </form>
        </div>

        {workspace ? (
          <p className={styles.status}>Dashboard geschützt: Supabase Auth ist aktiv und echte Workspace-Daten wurden geladen.</p>
        ) : (
          <p className={styles.demoBadge}>Dashboard geschützt: Supabase Auth ist aktiv. Für deinen Account wurde noch kein Workspace gefunden.</p>
        )}

        {userError ? (
          <p className={styles.error}>
            <strong>Supabase-Session konnte nicht vollständig geprüft werden.</strong>
            <span>{userError.message}</span>
          </p>
        ) : null}

        {workspaceResult.error ? (
          <p className={styles.error}>
            <strong>Workspace-Daten konnten nicht geladen werden.</strong>
            <span>{workspaceResult.error.message}</span>
          </p>
        ) : null}

        {workspace ? <WorkspaceDetails workspace={workspace} email={data.user.email} /> : null}
      </section>
    </main>
  );
}
