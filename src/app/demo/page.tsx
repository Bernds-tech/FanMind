const links = [
  {
    title: "Startseite",
    href: "/",
    text: "Zurueck zur FanMind Landingpage."
  },
  {
    title: "Login",
    href: "/login",
    text: "Demo-Anmeldung fuer Creator, Fans und Admins."
  },
  {
    title: "Registrierung",
    href: "/register",
    text: "Demo-Registrierung fuer neue Creator und Fans."
  },
  {
    title: "Creator Onboarding",
    href: "/creator/onboarding",
    text: "Gefuehrter Einstieg fuer Creator in fuenf Schritten."
  },
  {
    title: "Creator Profil",
    href: "/creator/demo",
    text: "Beispielprofil eines Creators mit Fanclub-Mitgliedschaft."
  },
  {
    title: "Dashboard",
    href: "/dashboard",
    text: "Demo-Dashboard fuer Creator."
  },
  {
    title: "Pricing",
    href: "/pricing",
    text: "Demo fuer Fan-Stufen und Mitgliedschaften."
  },
  {
    title: "Admin",
    href: "/admin",
    text: "Demo-Adminbereich fuer Plattformverwaltung."
  }
];

export default function DemoPage() {
  return (
    <main>
      <div className="page-shell">
        <nav className="nav">
          <a className="logo" href="/">FanMind</a>
          <div className="nav-links">
            <a href="/login">Login</a>
            <a href="/register">Registrieren</a>
            <a href="/pricing">Pricing</a>
          </div>
        </nav>

        <section>
          <div className="badge">FanMind Demo Navigation</div>
          <h1>Alle Demo-Seiten auf einen Blick.</h1>
          <p className="lead">
            Diese Seite dient als zentrale Navigation fuer den aktuellen FanMind-Prototyp.
          </p>
        </section>

        <section className="grid">
          {links.map((item) => (
            <article className="card" key={item.href}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <a className="button" href={item.href}>Oeffnen</a>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
