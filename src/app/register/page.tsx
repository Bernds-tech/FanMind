export default function RegisterPage() {
  return (
    <main>
      <div className="page-shell">
        <nav className="nav">
          <a className="logo" href="/">FanMind</a>
          <div className="nav-links">
            <a href="/login">Login</a>
            <a href="/creator/onboarding">Creator Onboarding</a>
          </div>
        </nav>

        <section className="hero">
          <div>
            <div className="badge">Registrierung Demo</div>
            <h1>Starte deinen FanMind Club.</h1>
            <p className="lead">
              Creator können hier später ihr Profil anlegen, Fan-Stufen definieren und ihren digitalen Fanclub starten.
            </p>
          </div>

          <aside className="hero-card">
            <h2>Account anlegen</h2>
            <div className="post">
              <small>ROLLE</small>
              <p>Creator oder Fan</p>
            </div>
            <div className="post">
              <small>PROFIL</small>
              <p>Name, E-Mail, Kategorie und Kurzbeschreibung</p>
            </div>
            <a className="button primary" href="/creator/onboarding">Weiter zum Onboarding</a>
          </aside>
        </section>
      </div>
    </main>
  );
}
