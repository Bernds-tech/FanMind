"use client";

import { useState } from "react";
import type { PlanId } from "@/config/plans";
import styles from "./BillingCheckoutButton.module.css";

export function BillingCheckoutButton({ planId, commercialOption, label = "Zahlung starten", showHint = true }: { planId: PlanId; commercialOption: string; label?: string; showHint?: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (planId !== "pilot" && planId !== "starter") return null;
  if (!["pilot_only", "starter_paid_setup", "starter_no_setup_commitment"].includes(commercialOption)) return null;

  async function startCheckout() {
    setIsLoading(true);
    setMessage(null);
    try {
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
      setMessage(payload.error ?? (response.status === 503 ? "Zahlung ist noch nicht aktiv konfiguriert. Bitte FanMind kontaktieren." : "Checkout konnte nicht gestartet werden."));
    } catch {
      setMessage("Checkout konnte nicht gestartet werden.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <button className={styles.button} type="button" onClick={startCheckout} disabled={isLoading}>
        {isLoading ? "Zahlung wird vorbereitet …" : label}
      </button>
      {showHint ? <p className={styles.hint}>Du wirst zu Stripe weitergeleitet. FanMind speichert keine Bankdaten.</p> : null}
      {message ? <p className={styles.error} role="alert">{message}</p> : null}
    </div>
  );
}
