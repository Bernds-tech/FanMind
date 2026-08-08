import { requirePlatformAdmin } from "@/lib/admin";
import { getPublicDailyTestPlanEnabled } from "@/lib/runtimeProductSettings";
import { AdminBillingShell } from "@/app/admin/billing/AdminBillingShell";
import { AdminTabs } from "@/app/admin/billing/AdminTabs";
import styles from "@/app/admin/billing/adminBilling.module.css";

type AdminSettingsPageProps = {
  searchParams: Promise<{ daily_test_plan?: string | string[] }>;
};

export default async function AdminSettingsPage({ searchParams }: AdminSettingsPageProps) {
  const user = await requirePlatformAdmin();
  const enabled = await getPublicDailyTestPlanEnabled();
  const params = await searchParams;
  const result = Array.isArray(params.daily_test_plan)
    ? params.daily_test_plan[0]
    : params.daily_test_plan;

  return (
    <AdminBillingShell
      user={user}
      title="Produktfreigaben"
      subtitle="Öffentliche Beta- und Verkaufsfreigaben sicher steuern"
    >
      <main className={styles.adminStack}>
        <AdminTabs activeTab="settings" />
        {result ? (
          <p className={result === "enabled" ? styles.badgeOk : styles.badgeWarn}>
            1-€/Tag-Beta-Abo wurde {result === "enabled" ? "aktiviert" : "deaktiviert"}.
          </p>
        ) : null}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <span className={styles.eyebrow}>Beta-Freigabe</span>
              <h2>1-€/Tag-Beta-Abo</h2>
              <p className={styles.cardSubtitle}>
                Öffnet ausschließlich ein zeitlich begrenztes 24-Stunden-Fenster für neue Beta-Testnutzer.
              </p>
            </div>
            <span className={enabled ? styles.badgeOk : styles.badgeWarn}>
              {enabled ? "Aktiv" : "Aus"}
            </span>
          </div>
          <div className={styles.statusList}>
            <div className={styles.statusItem}>
              <span>Preis</span><strong>1 € pro Tag</strong>
            </div>
            <div className={styles.statusItem}>
              <span>Kündigung</span><strong>Täglich möglich</strong>
            </div>
            <div className={styles.statusItem}>
              <span>Referral</span><strong>Ausgeschlossen</strong>
            </div>
          </div>
          <p className={styles.muted}>
            Ausschalten entfernt nur die Auswahl für neue Registrierungen. Bestehende Stripe-Abos,
            Workspaces und Zahlungen werden nicht gekündigt oder verändert. Eine Aktivierung läuft
            automatisch nach spätestens 24 Stunden ab und wird nie zum dauerhaften öffentlichen Paket.
          </p>
          <form action="/api/admin/settings/daily-test-plan" method="post">
            <input type="hidden" name="enabled" value={enabled ? "false" : "true"} />
            <button className={enabled ? styles.buttonDanger : styles.buttonPrimary} type="submit">
              {enabled ? "1-€/Tag-Abo ausschalten" : "1-€/Tag-Abo einschalten"}
            </button>
          </form>
        </section>
      </main>
    </AdminBillingShell>
  );
}
