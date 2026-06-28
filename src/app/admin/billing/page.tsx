import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/admin";
import { getStripeConfigStatus } from "@/lib/stripeBilling";

function Status({ ok }: { ok: boolean }) {
  return <strong>{ok ? "ja" : "nein"}</strong>;
}

export default async function AdminBillingPage() {
  const user = await requirePlatformAdmin();
  const stripe = getStripeConfigStatus();

  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "48px 20px", fontFamily: "var(--font-geist-sans)" }}>
      <p style={{ color: "#64748b", textTransform: "uppercase", letterSpacing: "0.12em" }}>FanMind Admin</p>
      <h1>Billing-Konfiguration</h1>
      <p>Admin-Status: <strong>aktiv</strong> für {user.email}</p>
      <section style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 24, marginTop: 24 }}>
        <h2>Stripe-Konfiguration</h2>
        <ul>
          <li>Secret Key vorhanden: <Status ok={stripe.hasSecretKey} /></li>
          <li>Webhook Secret vorhanden: <Status ok={stripe.hasWebhookSecret} /></li>
          <li>Pilot Price ID vorhanden: <Status ok={stripe.hasPilotPrice} /></li>
          <li>Starter Setup Price ID vorhanden: <Status ok={stripe.hasStarterSetupPrice} /></li>
          <li>Starter Monatsabo Price ID vorhanden: <Status ok={stripe.hasStarterMonthlyPrice} /></li>
          <li>App-URL vorhanden: <Status ok={stripe.hasAppUrl} /></li>
        </ul>
        <p>{stripe.readyForCheckout ? "Checkout ist technisch konfiguriert." : "Stripe-Testmodus/Live-Konfiguration ist noch unvollständig."}</p>
        <p>Admin-Bereich zeigt nur Konfigurationsstatus. Echte Zahlungsdaten liegen bei Stripe.</p>
      </section>
      <p style={{ marginTop: 24 }}><Link href="/dashboard">Zurück zum Dashboard</Link></p>
    </main>
  );
}
