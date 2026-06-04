const rows = [
  { area: "Creator", status: "3 Demo-Profile vorbereitet" },
  { area: "Fans", status: "1.248 Demo-Fans" },
  { area: "Content", status: "12 Demo-Beitraege" },
  { area: "Zahlung", status: "Noch nicht aktiv" }
];

export default function AdminPage() {
  return (
    <main>
      <div className="page-shell">
        <nav className="nav">
          <a className="logo" href="/">FanMind</a>
          <div className="nav-links">
            <a href="/dashboard">Dashboard</a>
            <a href="/creator/demo">Creator Profil</a>
          </div>
        </nav>

        <section>
          <div className="badge">Admin Demo</div>
          <h1>Plattformuebersicht.</h1>
          <p className="lead">
            Dieser Bereich wird spaeter fuer Nutzer, Creator, Inhalte, Meldungen und Plattformstatus genutzt.
          </p>
        </section>

        <section className="grid">
          {rows.map((row) => (
            <article className="card" key={row.area}>
              <h3>{row.area}</h3>
              <p>{row.status}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
