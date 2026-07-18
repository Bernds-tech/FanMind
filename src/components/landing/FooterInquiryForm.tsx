"use client";

import { FormEvent, useState } from "react";
import styles from "@/app/landing-v2/landing-v2.module.css";

type SubmitState = "idle" | "submitting" | "success" | "error";

export function FooterInquiryForm() {
  const [state, setState] = useState<SubmitState>("idle");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setState("error");
      return;
    }

    setState("submitting");
    const response = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name: String(formData.get("name") ?? "").trim(),
        message: String(formData.get("message") ?? "").trim(),
        company: String(formData.get("company") ?? "").trim(),
        source: "landing_footer",
      }),
    }).catch(() => null);

    if (!response?.ok) {
      setState("error");
      return;
    }

    form.reset();
    setState("success");
  }

  return (
    <form className={styles.footerInquiryForm} onSubmit={onSubmit} noValidate>
      <label className={styles.footerInquiryField}>
        <span>E-Mail-Adresse</span>
        <input type="email" name="email" placeholder="deine@email.ch" autoComplete="email" required />
      </label>
      <label className={styles.footerInquiryField}>
        <span>Name optional</span>
        <input type="text" name="name" placeholder="Dein Name" autoComplete="name" />
      </label>
      <label className={`${styles.footerInquiryField} ${styles.footerInquiryMessage}`}>
        <span>Kurze Nachricht / Use Case optional</span>
        <textarea name="message" placeholder="Wobei soll FanMind euch unterstützen?" rows={3} />
      </label>
      <label className={styles.footerInquiryHoneypot} aria-hidden="true">
        Firma
        <input type="text" name="company" tabIndex={-1} autoComplete="off" />
      </label>
      <button className={styles.landingFooterCta} type="submit" disabled={state === "submitting"}>
        {state === "submitting" ? "Wird gesendet ..." : "Beratung anfragen"} <span>→</span>
      </button>
      <small>Persönliche Anfrage statt automatischem Newsletter.</small>
      {state === "success" ? <p className={styles.footerInquirySuccess}>Danke, wir melden uns bei dir.</p> : null}
      {state === "error" ? <p className={styles.footerInquiryError}>Anfrage konnte gerade nicht gesendet werden. Bitte schreibe direkt an kontakt@fanmind.ch.</p> : null}
    </form>
  );
}
