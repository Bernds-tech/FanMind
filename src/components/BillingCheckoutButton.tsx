"use client";

import { useState } from "react";
import type { PlanId } from "@/config/plans";

export function BillingCheckoutButton({ planId, commercialOption, label = "Zahlung starten" }: { planId: PlanId; commercialOption: string; label?: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (planId !== "pilot" && planId !== "starter") return null;
  if (!["pilot_only", "starter_paid_setup", "starter_no_setup_commitment"].includes(commercialOption)) return null;

  async function startCheckout() {
    setIsLoading(true);
    setMessage(null);
    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, commercialOption }),
    });
    const payload = await response.json().catch(() => ({})) as { url?: string; error?: string };
    if (payload.url) {
      window.location.href = payload.url;
      return;
    }
    setMessage(payload.error ?? "Zahlung ist noch nicht aktiv konfiguriert. Bitte FanMind kontaktieren.");
    setIsLoading(false);
  }

  return (
    <div style={{ marginTop: 16 }}>
      <button type="button" onClick={startCheckout} disabled={isLoading} style={{ border: 0, borderRadius: 999, padding: "10px 16px", background: "#111827", color: "white", fontWeight: 700, cursor: "pointer" }}>
        {isLoading ? "Zahlung wird vorbereitet ..." : label}
      </button>
      {message ? <p style={{ color: "#b45309", marginTop: 8 }}>{message}</p> : null}
    </div>
  );
}
