import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px" }}>
      <h1>Zahlung nicht abgeschlossen</h1>
      <p>Zahlung wurde abgebrochen oder nicht abgeschlossen.</p>
      <p><Link href="/dashboard">Zurück zum Dashboard</Link> · <Link href="/register">Zur Registrierung</Link></p>
    </main>
  );
}
