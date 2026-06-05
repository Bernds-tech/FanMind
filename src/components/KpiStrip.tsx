type KpiStripItem = {
  label: string;
  value: number | string;
  icon: string;
};

export function KpiStrip({ items }: { items: KpiStripItem[] }) {
  return (
    <section className="kpi-strip" aria-label="Kontakt-Kennzahlen">
      {items.map((item) => (
        <article key={item.label}>
          <span className="kpi-icon" aria-hidden="true">{item.icon}</span>
          <div>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        </article>
      ))}
    </section>
  );
}
