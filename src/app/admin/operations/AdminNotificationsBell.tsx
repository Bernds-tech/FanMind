"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import styles from "../billing/adminBilling.module.css";

type Notification = { id:string; category:string; severity:string; title:string; message:string; read_at:string|null; acknowledged_at:string|null; created_at:string };

function tone(items: Notification[]) { if (items.some((n) => n.severity === "critical" && !n.acknowledged_at)) return styles.badgeBad; if (items.some((n) => n.severity === "warning" && !n.acknowledged_at)) return styles.badgeWarn; return styles.badgeOk; }

export function AdminNotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const refresh = useCallback(async () => { const response = await fetch("/api/admin/notifications", { cache: "no-store" }); if (response.ok) { const data = await response.json(); setItems(data.notifications ?? []); setUnread(data.unreadCount ?? 0); } }, []);
  async function toggleOpen() { const next = !open; setOpen(next); if (next) await refresh(); }
  async function update(id: string, acknowledge = false) { await fetch(`/api/admin/notifications/${id}/read`, { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify({ acknowledge }) }); await refresh(); }
  return <div className={styles.notificationBell}><button type="button" className={tone(items)} onClick={toggleOpen} aria-label="Admin-Benachrichtigungen öffnen">● Betrieb {unread ? <strong>{unread}</strong> : null}</button>{open ? <div className={styles.notificationMenu}><div className={styles.cardHeader}><div><span className={styles.eyebrow}>Operations</span><h2>Admin-Meldungen</h2></div><Link className={styles.textLink} href="/admin/operations">Center öffnen</Link></div>{items.length ? items.map((item) => <article key={item.id} className={styles.notificationItem}><strong>{item.title}</strong><span>{item.category} · {new Date(item.created_at).toLocaleString("de-DE")}</span><p>{item.message}</p><div className={styles.actions}><button className={styles.buttonSecondary} onClick={() => update(item.id)}>Gelesen</button><button className={styles.buttonPrimary} onClick={() => update(item.id, true)}>Quittieren</button></div></article>) : <p className={styles.muted}>Keine Meldungen vorhanden oder Migration noch nicht angewendet.</p>}</div> : null}</div>;
}
