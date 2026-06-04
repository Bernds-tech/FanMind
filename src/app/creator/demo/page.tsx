import SiteNav from "@/components/SiteNav";

const posts = [
  {
    type: "FREI",
    title: "Willkommen im Mia Active Club",
    text: "Oeffentliche Motivation, Alltagseinblicke und kleine Impulse fuer neue Fans."
  },
  {
    type: "CLUB-MITGLIED",
    title: "7-Tage-Fitness-Challenge",
    text: "Exklusiver Wochenplan mit taeglichen Aufgaben, Videos und Checkliste."
  },
  {
    type: "PREMIUM-FAN",
    title: "Persoenlicher Trainingsimpuls",
    text: "Monatliche Q&A Session mit individuellen Antworten fuer besonders aktive Fans."
  }
];

const benefits = [
  "Exklusive Challenges und Wochenplaene",
  "Mitglieder-Updates und Hintergrundinhalte",
  "Premium-Fragen und persoenlichere Einblicke",
  "Community-Vorteile fuer aktive Fans"
];

const stats = [
  { label: "Fans", value: "1.248" },
  { label: "Club-Mitglieder", value: "186" },
  { label: "Demo-Umsatz", value: "3.420 EUR" }
];

export default function CreatorDemoPage() {
  return (
    <main>
      <div className="page-shell">
        <SiteNav active="Creator" />

        <section className="hero">
          <div>
            <div className="badge">Creator-Profil Demo</div>
            <h1>Mia Active Club</h1>
            <p className="lead">
              Ein Beispiel-Fanclub fuer Fitness, Motivation und persoenliche Challenges. So koennte ein Anbieterprofil auf FanMind aussehen.
            </p>
            <div className="actions">
              <a className="button primary" href="/register">Mitglied werden</a>
              <a className="button" href="/pricing">Pakete ansehen</a>
              <a className="button" href="/dashboard">Dashboard oeffnen</a>
            </div>
          </div>

          <aside className="hero-card" id="membership">
            <div className="profile-head">
              <div className="avatar" />
              <div>
                <div className="profile-title">Fanclub-Mitgliedschaft</div>
                <div className="profile-subtitle">ab 9,90 EUR pro Monat Demo-Preis</div>
              </div>
            </div>
            <p className="lead">
              Zugang zu exklusiven Beitraegen, Challenges, persoenlichen Updates und Premium-Momenten.
            </p>
            <ul>
              {benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="section">
          <h2>Fanclub auf einen Blick</h2>
          <p className="lead">Diese Demo-Zahlen zeigen, welche Kennzahlen ein Anbieter spaeter im Blick behalten kann.</p>
          <div className="grid">
            {stats.map((stat) => (
              <article className="card" key={stat.label}>
                <p>{stat.label}</p>
                <h2>{stat.value}</h2>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <h2>Beitraege und Freischaltungen</h2>
          <p className="lead">FanMind unterscheidet klar zwischen freien Inhalten, Club-Inhalten und Premium-Inhalten.</p>
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

        <section className="section hero-card">
          <div className="badge">Pilotprofil</div>
          <h2>Dieses Profil kann fuer erste Pilotkunden angepasst werden.</h2>
          <p className="lead">
            Fuer Trainer, Musiker, Vereine oder Experten kann FanMind ein eigenes Profil mit Mitgliedschaften, Premium-Inhalten und direkter Fanbindung zeigen.
          </p>
          <div className="actions">
            <a className="button primary" href="/register">Als Anbieter starten</a>
            <a className="button" href="/demo">Alle Demo-Seiten</a>
          </div>
        </section>
      </div>
    </main>
  );
}
