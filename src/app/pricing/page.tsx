const plans = [
  {
    name: "Free Fan",
    price: "0 EUR",
    description: "Öffentliche Beiträge, einfache Updates und Einstieg in die Community."
  },
  {
    name: "Club Member",
    price: "9,90 EUR",
    description: "Exklusive Beiträge, Challenges, Behind-the-Scenes und Mitglieder-Updates."
  },
  {
    name: "Premium Fan",
    price: "29,90 EUR",
    description: "Persönliche Q&A Sessions, priorisierte Antworten und besondere Fan-Erlebnisse."
  }
];

export default function PricingPage() {
  return (
    <main>
      <div className="page-shell">
        <nav className="nav">
          <a className="logo" href="/">FanMind</a>
          <div className="nav-links">
            <a href="/register">Registrieren</a>
            <a href="/dashboard">Dashboard</a>
            <a href="/creator/demo">Creator Demo</a>
          </div>
        </nav>

        <section>
          <div className="badge">Mitgliedschaften Demo</div>
          <h1>Fan-Stufen für wiederkehrende Einnahmen.</h1>
          <p className="lead">
            FanMind soll Creatorn ermöglichen, eigene Mitgliedschaftsstufen und exklusive Vorteile pro Fanclub festzulegen.
          </p>
        </section>

        <section className="grid">
          {plans.map((plan) => (
            <article className="card" key={plan.name}>
              <div className="badge">{plan.name}</div>
              <h2>{plan.price}</h2>
              <p>{plan.description}</p>
              <a className="button" href="/register">Demo auswählen</a>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
