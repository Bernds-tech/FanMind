import type { ReactNode } from "react";

type KpiTone = "blue" | "green" | "violet" | "orange";

type KpiIconName = "fans" | "active" | "vip" | "reactivation" | "followups" | "overdue";

type KpiStripItem = {
  label: string;
  value: number | string;
  icon: KpiIconName;
  tone: KpiTone;
  subtext: string;
};

const iconPaths: Record<KpiIconName, ReactNode> = {
  fans: (
    <>
      <path d="M8.2 11.4a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2Z" />
      <path d="M2.8 18.6c.8-3 2.7-4.5 5.4-4.5s4.6 1.5 5.4 4.5" />
      <path d="M15.4 11.7a2.7 2.7 0 1 0 0-5.1" />
      <path d="M15.9 14.3c1.8.4 3 1.8 3.6 4.1" />
    </>
  ),
  active: (
    <>
      <circle cx="12" cy="12" r="7.8" />
      <path d="m8.2 12.2 2.4 2.4 5.2-5.5" />
    </>
  ),
  vip: <path d="M3.5 8.1 8 12l4-6.2 4 6.2 4.5-3.9-1.5 10.4H5z" />,
  reactivation: (
    <>
      <path d="M18.7 8.1A7.2 7.2 0 0 0 5.3 7" />
      <path d="M18.7 4.4v3.7H15" />
      <path d="M5.3 15.9A7.2 7.2 0 0 0 18.7 17" />
      <path d="M5.3 19.6v-3.7H9" />
    </>
  ),
  followups: (
    <>
      <path d="M6.2 4.2h11.6A1.8 1.8 0 0 1 19.6 6v11.8a1.8 1.8 0 0 1-1.8 1.8H6.2a1.8 1.8 0 0 1-1.8-1.8V6a1.8 1.8 0 0 1 1.8-1.8Z" />
      <path d="M8 2.8v3.4M16 2.8v3.4M4.4 8.4h15.2" />
      <path d="m8.3 13 2.2 2.2 4.9-5" />
    </>
  ),
  overdue: (
    <>
      <path d="M12 5.2v7.2" />
      <path d="M12 16.8h.01" />
      <path d="M10.2 3.7 2.8 17a2 2 0 0 0 1.8 3h14.8a2 2 0 0 0 1.8-3L13.8 3.7a2.1 2.1 0 0 0-3.6 0Z" />
    </>
  )
};

function KpiIcon({ name }: { name: KpiIconName }) {
  return (
    <svg aria-hidden="true" className="kpi-icon-svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      {iconPaths[name]}
    </svg>
  );
}

export function KpiStrip({ items }: { items: KpiStripItem[] }) {
  return (
    <section className="kpi-strip" aria-label="Kontakt-Kennzahlen">
      {items.map((item) => (
        <article className={`kpi-card tone-${item.tone}`} key={item.label}>
          <span className="kpi-icon" aria-hidden="true"><KpiIcon name={item.icon} /></span>
          <div className="kpi-copy">
            <span className="kpi-label">{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.subtext}</small>
          </div>
        </article>
      ))}
    </section>
  );
}
