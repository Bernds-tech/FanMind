import Link from "next/link";
import styles from "../../dashboard/dashboard.module.css";

export default function BillingSuccessPage() {
  return (
    <main className={styles.page}>
      <section className={styles.fallbackCard}>
        <p className={styles.eyebrow}>Stripe Checkout</p>
        <h1>Zahlung wurde gestartet</h1>
        <p>Zahlung wurde gestartet. Bei SEPA-Lastschrift kann die endgültige Bestätigung einige Geschäftstage dauern. Dein Zugang wird aktualisiert, sobald Stripe die Zahlung bestätigt.</p>
        <div className={styles.emptyActions}>
          <Link className={styles.primaryButton} href="/dashboard">Zum Dashboard</Link>
          <Link className={styles.secondaryButton} href="/billing/start">Zu Paket &amp; Rechnungen</Link>
        </div>
      </section>
    </main>
  );
}
