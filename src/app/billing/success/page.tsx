import Link from "next/link";

export default function BillingSuccessPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px" }}>
      <h1>Zahlung wurde gestartet</h1>
      <p>Zahlung wurde gestartet. Bei SEPA-Lastschrift kann die Bestätigung einige Tage dauern.</p>
      <p>Bitte verlasse dich erst auf den endgültigen Billing-Status, nachdem Stripe die Zahlung per Webhook bestätigt hat.</p>
      <Link href="/dashboard">Zum Dashboard</Link>
    </main>
  );
}
