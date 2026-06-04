const benefits = [
  {
    title: "Eigener Fanclub",
    text: "Creator bauen eine zahlende Community auf, ohne vollstaendig von Social-Media-Algorithmen abhaengig zu sein."
  },
  {
    title: "Exklusive Inhalte",
    text: "Beitraege, Bilder, Videos, Einblicke und Premium-Updates koennen gezielt fuer Fans freigeschaltet werden."
  },
  {
    title: "Direkte Monetarisierung",
    text: "Mitgliedschaften, Einmalzahlungen und spaeter bezahlte Nachrichten schaffen wiederkehrende Einnahmen."
  }
];

export default function Home() {
  return (
    <main>
      <div className="page-shell">
        <nav className="nav">
          <div className="logo">FanMind</div>
          <div className="nav-links">
            <a href="#creator">Creator</a>
            <a href="#fans">Fans</a>
            <a href="#demo">Demo</a>
          </div>
        </nav>

        <section className="hero">
          <div>
            <div className="badge">Europaeische Direct-to-Fan Plattform</div>
            <h1>Baue deinen eigenen digitalen Fanclub.</h1>
            <p className="lead">
              FanMind hilft Creatorn, Sportlern, Musikern, Coaches und Vereinen dabei,
              exklusive Inhalte zu teilen, echte Fanbindung aufzubauen und direkt mit
              der eigenen Community Geld zu verdienen.
            </p>
            <div className="actions">
              <a className="button primary" href="/dashboard">Demo Dashboard ansehen</a>
              <a className="button" href="/creator/demo">Creator Profil ansehen</a>
            </div>
          </div>

          <aside className="hero-card" id="demo">
            <div className="profile-head">
              <div className="avatar" />
              <div>
                <div className="profile-title">Mia Active Club</div>
                <div className="profile-subtitle">Fitness, Motivation und exklusive Challenges</div>
              </div>
            </div>
            <div className="post">
              <small>FREI</small>
              <p>Willkommen in meinem FanMind Club. Hier bekommst du exklusive Updates und Challenges.</p>
            </div>
            <div className="post">
              <small>NUR MITGLIEDER</small>
              <p>Neue 7-Tage-Fitness-Challenge inklusive Video und Wochenplan.</p>
            </div>
            <div className="post">
              <small>PREMIUM</small>
              <p>Persoenliche Q&A Session und individueller Trainingsimpuls.</p>
            </div>
          </aside>
        </section>

        <section className="section" id="creator">
          <h2>Fuer Creator gemacht.</h2>
          <p className="lead">
            FanMind ist fuer Menschen gedacht, die bereits eine Community haben oder eine aufbauen wollen.
          </p>
          <div className="grid">
            {benefits.map((benefit) => (
              <article className="card" key={benefit.title}>
                <h3>{benefit.title}</h3>
                <p>{benefit.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="fans">
          <h2>Fuer Fans persoenlicher.</h2>
          <p className="lead">
            Fans bekommen einen direkten Zugang zu ihren Lieblings-Creatorn, besondere Inhalte und ein echtes Fanclub-Gefuehl.
          </p>
        </section>
      </div>
    </main>
  );
}
