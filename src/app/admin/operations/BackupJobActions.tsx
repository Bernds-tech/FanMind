"use client";

import { useState } from "react";
import styles from "../billing/adminBilling.module.css";

const actions = [
  ["backup_server_config", "Server-Konfiguration"],
  ["backup_database", "Datenbank"],
  ["backup_storage", "Storage"],
  ["backup_full", "Vollbackup"],
] as const;

export function BackupJobActions() {
  const [message, setMessage] = useState<string>("");
  const [busy, setBusy] = useState<string>("");
  async function enqueue(jobType: string, label: string) {
    if (!confirm(`${label}-Backup wirklich einreihen? Die Web-App startet keinen Shell-Befehl; nur der externe Worker verarbeitet den Job.`)) return;
    setBusy(jobType); setMessage("");
    const response = await fetch("/api/admin/operations/backup-jobs", { method:"POST", headers:{ "Content-Type":"application/json", "Idempotency-Key": `manual:${jobType}:${new Date().toISOString().slice(0,10)}` }, body:JSON.stringify({ jobType }) });
    const body = await response.json().catch(() => ({}));
    setMessage(response.ok ? (body.message ?? "Job wurde eingereiht") : (body.error ?? "Job konnte nicht eingereiht werden"));
    setBusy("");
  }
  return <div className={styles.actions}>{actions.map(([jobType, label]) => <button key={jobType} type="button" className={styles.buttonSecondary} disabled={Boolean(busy)} onClick={() => enqueue(jobType, label)}>{busy === jobType ? "Wird eingereiht…" : `${label} anfordern`}</button>)}{message ? <p className={styles.emptyState}>{message}</p> : null}</div>;
}
