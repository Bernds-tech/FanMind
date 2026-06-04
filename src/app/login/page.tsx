import SiteNav from "@/components/SiteNav";

export default function LoginPage() {
  return (
    <main>
      <div className="page-shell">
        <SiteNav active="Login" />

        <section className="hero">
          <div>
            <div className="badge">Login Demo</div>
            <h1>Zurück in deinen Fanclub.</h1>
            <p className="lead">
              Diese Seite ist der erste Login-Mockup für Creator, Fans und Admins.
            </p>
          </div>

          <aside className="hero-card">
            <h2>Anmelden</h2>
            <div className="post">
              <small>E-MAIL</small>
              <p>creator@fanmind.at</p>
            </div>
            <div className="post">
              <small>PASSWORT</small>
              <p>••••••••••••</p>
            </div>
            <a className="button primary" href="/dashboard">Demo Login</a>
          </aside>
        </section>
      </div>
    </main>
  );
}
