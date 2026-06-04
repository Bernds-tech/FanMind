const posts = [
  {
    type: "FREI",
    title: "Willkommen im Mia Active Club",
    text: "Hier teile ich Motivation, Alltag und kleine Impulse fuer deine Fitnessreise."
  },
  {
    type: "MITGLIEDER",
    title: "7-Tage-Challenge",
    text: "Exklusiver Wochenplan mit taeglichen Aufgaben, Videos und Checkliste."
  },
  {
    type: "PREMIUM",
    title: "Persoenlicher Trainingsimpuls",
    text: "Monatliche Q&A Session mit individuellen Antworten fuer Premium-Fans."
  }
];

export default function CreatorDemoPage() {
  return (
    <main>
      <div className="page-shell">
        <nav className="nav">
          <a className="logo" href="/">FanMind</a>
          <div className="nav-links">
            <a href="/dashboard">Dashboard</a>
            <a href="/admin">Admin</a>
          </div>
        </nav>

        <section className="hero">
          <div>
            <div className="badge">Creator Profil Demo</div>
            <h1>Mia Active Club</h1>
            <p className="lead">
              Fitness, Motivation und persoenliche Challenges fuer Fans, die mehr wollen als kurze Social-Media-Posts.
            </p>
            <div className="actions">
              <a className="button primary" href="#membership">Mitglied werden</a>
              <a className="button" href="/">Zur Startseite</a>
            </div>
          </div>

          <aside className="hero-card" id="membership">
            <div className="profile-head">
              <div className="avatar" />
              <div>
                <div className="profile-title">Fanclub Mitgliedschaft</div>
                <div className="profile-subtitle">9,90 EUR pro Monat Demo-Preis</div>
              </div>
            </div>
            <p className="lead">
              Zugang zu exklusiven Beitraegen, Challenges und persoenlichen Updates.
            </p>
          </aside>
        </section>

        <section className="section">
          <h2>Beitraege</h2>
          <div className="grid">
            {posts.map((post) => (
              <article className="card" key={post.title}>
                <div className="badge">{post.type}</div>
                <h3>{post.title}</h3>
                <p>{post.text}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
