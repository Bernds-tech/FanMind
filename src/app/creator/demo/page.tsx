import SiteNav from "@/components/SiteNav";
import { agencyStats, assistantBenefits, fanMemoryItems, managedProfiles } from "@/data/agencyDemo";

export default function CreatorDemoPage() {
  return (
    <main>
      <div className="page-shell">
        <SiteNav active="Creator" />

        <section className="hero">
          <div>
            <div className="badge">Agentur-Ansicht Demo</div>
            <h1>Betreute Profile besser verwalten.</h1>
            <p className="lead">
              FanMind hilft Agenturen und Teams, Fan-Gespraeche ueber mehrere Profile hinweg strukturierter zu betreuen: mit Fan-Gedaechtnis, Antwortvorschlaegen und Nachfass-Aufgaben.
            </p>
            <div className="actions">
              <a className="button primary" href="/fans/demo">Fan/Kontakt zeigen</a>
              <a className="button" href="/dashboard">Dashboard oeffnen</a>
              <a className="button" href="/pricing">Pakete ansehen</a>
            </div>
          </div>

          <aside className="hero-card">
            <div className="profile-head">
              <div className="avatar" />
              <div>
                <div className="profile-title">Mia Active Club</div>
                <div className="profile-subtitle">betreutes Profil einer Agentur</div>
              </div>
            </div>
            <p className="lead">FanMind zeigt dem Team, was im Gespraech wichtig ist und welcher Kontakt als naechstes nachgefasst werden sollte.</p>
            <ul>
              {assistantBenefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
            <a className="button primary" href="/fans/demo">Kontakt-Detail oeffnen</a>
          </aside>
        </section>

        <section className="section">
          <h2>Agentur-Ueberblick</h2>
          <p className="lead">Diese Demo-Zahlen zeigen, wie FanMind mehrere betreute Profile und Fan-Gespraeche strukturiert.</p>
          <div className="grid">
            {agencyStats.map((stat) => (
              <article className="card" key={stat.label}>
                <p>{stat.label}</p>
                <h2>{stat.value}</h2>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <h2>Betreute Profile</h2>
          <p className="lead">Agenturen koennen mehrere Personen, Marken oder Vereine betreuen und pro Profil den Kommunikationskontext behalten.</p>
          <div className="grid">
            {managedProfiles.map((profile) => (
              <article className="card" key={profile.title}>
                <div className="badge">{profile.type}</div>
                <h3>{profile.title}</h3>
                <p>{profile.text}</p>
                <a className="button" href="/fans/demo">Beispielkontakt oeffnen</a>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <h2>Fan-Gedaechtnis und Nachfass-Aufgaben</h2>
          <p className="lead">FanMind ersetzt nicht den Menschen, sondern bereitet wichtige Informationen so auf, dass Teams schneller und besser reagieren koennen.</p>
          <div className="grid">
            {fanMemoryItems.map((item) => (
              <article className="card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <a className="button" href="/fans/demo">Im Fan-Profil zeigen</a>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
