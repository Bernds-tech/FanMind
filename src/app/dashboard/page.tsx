const stats = [
  { label: "Fans", value: "1.248" },
  { label: "Mitglieder", value: "186" },
  { label: "Monatsumsatz", value: "3.420 EUR" },
  { label: "Neue Nachrichten", value: "27" }
];

export default function DashboardPage() {
  return (
    <main>
      <div className="page-shell">
        <nav className="nav">
          <a className="logo" href="/">FanMind</a>
          <div className="nav-links">
            <a href="/creator/demo">Creator Profil</a>
            <a href="/admin">Admin</a>
          </div>
        </nav>

        <section>
          <div className="badge">Creator Dashboard Demo</div>
          <h1>Willkommen zurueck.</h1>
          <p className="lead">
            Hier sieht ein Creator spaeter Fans, Mitgliedschaften, Einnahmen, Inhalte und Community-Aktivitaet.
          </p>
        </section>

        <section className="grid">
          {stats.map((stat) => (
            <article className="card" key={stat.label}>
              <p>{stat.label}</p>
              <h2>{stat.value}</h2>
            </article>
          ))}
        </section>

        <section className="section">
          <h2>Naechste Schritte</h2>
          <div className="grid">
            <article className="card">
              <h3>Beitrag erstellen</h3>
              <p>Text, Bild oder Video fuer freie Fans, Mitglieder oder Premium-Fans vorbereiten.</p>
            </article>
            <article className="card">
              <h3>Mitgliedschaft pruefen</h3>
              <p>Preis, Vorteile und Fanclub-Beschreibung fuer zahlende Mitglieder definieren.</p>
            </article>
            <article className="card">
              <h3>Fans aktivieren</h3>
              <p>Community-Fragen, exklusive Updates und persoenliche Inhalte planen.</p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
