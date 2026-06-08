import { redirect } from "next/navigation";
import {
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  signOutSupabaseServerSession,
  type WorkspaceDashboardRow,
} from "@/lib/supabase/server";
import type { ProductiveCommercialOption } from "@/lib/plans";
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
      commercialOptionName: "Pilot / Setupmonat",
      setupFeeLabel: setupFee,
      monthlyFeeLabel: monthlyFee,
      commitmentLabel: "keine",
      note: "Demo-/Setupmonat, kein laufendes Monatsabo",
    };
  }

  if (workspace.plan_id === "starter" && workspace.commercial_option === "starter_12m_setup_waived") {
    return {
      packageName: "Starter",
      commercialOptionName: "Starter mit 12 Monaten Bindung",
      setupFeeLabel: `${setupFee} statt ${formatEuro(99000)}`,
      monthlyFeeLabel: monthlyFee,
      commitmentLabel: "12 Monate",
      note: "Einrichtungsgebühr entfällt wegen 12 Monaten Bindung",
    };
  }

  if (workspace.plan_id === "starter" && workspace.commercial_option === "starter_paid_setup") {
    return {
      packageName: "Starter",
      commercialOptionName: "Starter mit bezahlter Einrichtung",
      setupFeeLabel: setupFee,
      monthlyFeeLabel: monthlyFee,
      commitmentLabel: "keine 12-Monatsbindung",
      note: "Einrichtungsgebühr bezahlt, keine feste Bindung",
    };
  }

  return {
    packageName: workspace.plan_id,
    commercialOptionName: getFallbackCommercialOptionName(workspace.commercial_option),
    setupFeeLabel: setupFee,
    monthlyFeeLabel: monthlyFee,
    commitmentLabel: workspace.commitment_months > 0 ? `${workspace.commitment_months} Monate` : "keine",
    note: "Workspace-Daten wurden geladen. Für diese Paketkombination ist noch kein spezieller Hinweis hinterlegt.",
  };
}

function getFallbackCommercialOptionName(commercialOption: ProductiveCommercialOption): string {
  switch (commercialOption) {
    case "pilot_only":
      return "Pilot / Setupmonat";
    case "starter_12m_setup_waived":
      return "Starter mit 12 Monaten Bindung";
    case "starter_paid_setup":
      return "Starter mit bezahlter Einrichtung";
  }
}

function WorkspaceDetails({ workspace, email }: WorkspaceDetailsProps) {
  const display = getWorkspaceDisplay(workspace);

  return (
    <div className={styles.workspacePanel}>
      <div className={styles.summaryGrid} aria-label="Workspace-Status">
        <section>
          <span>Eingeloggt als</span>
          <strong>{email ?? "Nicht in der Supabase-Session enthalten"}</strong>
        </section>
        <section>
          <span>Workspace</span>
          <strong>{workspace.name}</strong>
        </section>
        <section>
          <span>Rolle</span>
          <strong>{workspace.role}</strong>
        </section>
        <section>
          <span>Paket</span>
          <strong>{display.packageName}</strong>
        </section>
      </div>

      <dl className={styles.details}>
        <div>
          <dt>plan_id</dt>
          <dd>{workspace.plan_id}</dd>
        </div>
        <div>
          <dt>Paketname</dt>
          <dd>{display.packageName}</dd>
        </div>
        <div>
          <dt>commercial_option</dt>
          <dd>{workspace.commercial_option}</dd>
        </div>
        <div>
          <dt>Kommerzielle Option</dt>
          <dd>{display.commercialOptionName}</dd>
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

      <p className={styles.notice}>{display.note}</p>
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
        <p className={styles.eyebrow}>FanMind Dashboard</p>
        <h1>{workspace?.name ?? "Workspace-Status"}</h1>
        {workspace ? (
          <p className={styles.status}>Workspace geladen.</p>
        ) : (
          <div className={styles.error} role="alert">
            <strong>Workspace konnte noch nicht geladen werden.</strong>
            <span>{workspaceResult.error?.message ?? userError?.message ?? "Bitte versuche es später erneut oder melde dich neu an."}</span>
          </div>
        )}

        {workspace ? <WorkspaceDetails workspace={workspace} email={data.user.email} /> : <p className={styles.meta}>Session für {data.user.email ?? "diesen Supabase-User"} ist aktiv.</p>}

        <div className={styles.actions}>
          <form action={logout}>
            <button type="submit">Logout</button>
          </form>
        </div>
      </section>
    </main>
  );
}
