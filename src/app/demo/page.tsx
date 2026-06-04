import SiteNav from "@/components/SiteNav";

const links = [
  {
    title: "Startseite",
    href: "/",
    text: "Zurück zur FanMind Landingpage."
  },
  {
    title: "Login",
    href: "/login",
    text: "Demo-Anmeldung für Creator, Fans und Admins."
  },
  {
    title: "Registrierung",
    href: "/register",
    text: "Demo-Registrierung für neue Creator und Fans."
  },
  {
    title: "Creator Onboarding",
    href: "/creator/onboarding",
    text: "Geführter Einstieg für Creator in fünf Schritten."
  },
  {
    title: "Creator Profil",
    href: "/creator/demo",
    text: "Beispielprofil eines Creators mit Fanclub-Mitgliedschaft."
  },
  {
    title: "Dashboard",
    href: "/dashboard",
    text: "Demo-Dashboard für Creator."
  },
  {
    title: "Pricing",
    href: "/pricing",
    text: "Demo für Fan-Stufen und Mitgliedschaften."
  },
  {
    title: "Admin",
    href: "/admin",
    text: "Demo-Adminbereich für Plattformverwaltung."
  }
];

export default function DemoPage() {
  return (
    <main>
      <div className="page-shell">
        <SiteNav active="Demo" />

        <section>
          <div className="badge">FanMind Demo Navigation</div>
          <h1>Alle Demo-Seiten auf einen Blick.</h1>
          <p className="lead">
            Diese Seite dient als zentrale Navigation für den aktuellen FanMind-Prototyp.
          </p>
        </section>

        <section className="grid">
          {links.map((item) => (
            <article className="card" key={item.href}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <a className="button" href={item.href}>Öffnen</a>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
