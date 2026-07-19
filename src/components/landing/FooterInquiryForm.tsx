"use client";

import { FormEvent, useState } from "react";
import styles from "@/app/landing-v2/landing-v2.module.css";

type SubmitState = "idle" | "submitting" | "success" | "error";

type FooterInquiryFormCopy = {
  emailLabel: string;
  emailPlaceholder: string;
  nameLabel: string;
  namePlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  submitting: string;
  submit: string;
  note: string;
  success: string;
  error: string;
};

type FooterInquiryFormProps = {
  copy: FooterInquiryFormCopy;
};

export function FooterInquiryForm({ copy }: FooterInquiryFormProps) {
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
        <span>{copy.emailLabel}</span>
        <input type="email" name="email" placeholder={copy.emailPlaceholder} autoComplete="email" required />
      </label>
      <label className={styles.footerInquiryField}>
        <span>{copy.nameLabel}</span>
        <input type="text" name="name" placeholder={copy.namePlaceholder} autoComplete="name" />
      </label>
      <label className={`${styles.footerInquiryField} ${styles.footerInquiryMessage}`}>
        <span>{copy.messageLabel}</span>
        <textarea name="message" placeholder={copy.messagePlaceholder} rows={3} />
      </label>
      <label className={styles.footerInquiryHoneypot} aria-hidden="true">
        Firma
        <input type="text" name="company" tabIndex={-1} autoComplete="off" />
      </label>
      <button className={styles.landingFooterCta} type="submit" disabled={state === "submitting"}>
        {state === "submitting" ? copy.submitting : copy.submit} <span>→</span>
      </button>
      <small>{copy.note}</small>
      {state === "success" ? <p className={styles.footerInquirySuccess}>{copy.success}</p> : null}
      {state === "error" ? <p className={styles.footerInquiryError}>{copy.error}</p> : null}
    </form>
  );
}
