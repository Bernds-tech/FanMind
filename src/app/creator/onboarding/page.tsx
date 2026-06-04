const steps = [
  "Profil und Kategorie festlegen",
  "Fanclub-Beschreibung schreiben",
  "Mitgliedschaftsstufen definieren",
  "Erste exklusiven Inhalte vorbereiten",
  "Einladungslink mit der Community teilen"
];

export default function CreatorOnboardingPage() {
  return (
    <main>
      <div className="page-shell">
        <nav className="nav">
          <a className="logo" href="/">FanMind</a>
          <div className="nav-links">
            <a href="/dashboard">Dashboard</a>
            <a href="/creator/demo">Profil Demo</a>
          </div>
        </nav>

        <section>
          <div className="badge">Creator Onboarding</div>
          <h1>In fünf Schritten zum eigenen Fanclub.</h1>
          <p className="lead">
            Das Onboarding führt Creator später von der Registrierung bis zum ersten veröffentlichten Fanclub.
          </p>
        </section>

        <section className="grid">
          {steps.map((step, index) => (
            <article className="card" key={step}>
              <div className="badge">Schritt {index + 1}</div>
              <h3>{step}</h3>
              <p>Dieser Bereich wird in der Produktversion als geführter Setup-Schritt umgesetzt.</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
