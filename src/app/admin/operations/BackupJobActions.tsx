"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../billing/adminBilling.module.css";

const actions = [
  ["backup_server_config", "Server-Konfiguration"],
  ["backup_database", "Datenbank"],
  ["backup_storage", "Storage"],
  ["backup_full", "Vollbackup"],
  ["verify_backup", "Letztes Backup prüfen"],
] as const;

function errorMessage(error: string | undefined) {
  if (error === "backup_job_rate_limited") {
    return "Zu viele manuelle Backup-Aktionen. Bitte warte kurz und versuche es erneut.";
  }
  if (error === "operations_rate_limit_unavailable") {
    return "Die Sicherheitsprüfung ist gerade nicht verfügbar. Es wurde kein Job eingereiht.";
  }
  return error ?? "Job konnte nicht eingereiht werden";
}

export function BackupJobActions() {
  const router = useRouter();
  const [message, setMessage] = useState<string>("");
  const [busy, setBusy] = useState<string>("");
  async function enqueue(jobType: string, label: string) {
    const confirmation = jobType === "verify_backup"
      ? "Das neueste lokale Backup checksum-only prüfen? Der private Entschlüsselungsschlüssel bleibt außerhalb von Production."
      : `${label}-Backup wirklich einreihen? Die Web-App startet keinen Shell-Befehl; nur der externe Worker verarbeitet den Job.`;
    if (!confirm(confirmation)) return;
    setBusy(jobType); setMessage("");
    const idempotencyKey = jobType === "verify_backup"
      ? `manual:${jobType}:${globalThis.crypto.randomUUID()}`
      : `manual:${jobType}:${new Date().toISOString().slice(0,10)}`;
    try {
      const response = await fetch("/api/admin/operations/backup-jobs", { method:"POST", headers:{ "Content-Type":"application/json", "Idempotency-Key": idempotencyKey }, body:JSON.stringify({ jobType }) });
      const body = await response.json().catch(() => ({})) as { message?: string; error?: string };
      setMessage(response.ok ? (body.message ?? "Job wurde eingereiht") : errorMessage(body.error));
      if (response.ok) router.refresh();
    } catch {
      setMessage("Job konnte nicht eingereiht werden");
    } finally {
      setBusy("");
    }
  }
  return <div className={styles.actions}>{actions.map(([jobType, label]) => <button key={jobType} type="button" className={styles.buttonSecondary} disabled={Boolean(busy)} onClick={() => enqueue(jobType, label)}>{busy === jobType ? "Wird eingereiht…" : jobType === "verify_backup" ? label : `${label} anfordern`}</button>)}{message ? <p className={styles.emptyState}>{message}</p> : null}</div>;
}
