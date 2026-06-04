import SiteNav from "@/components/SiteNav";
import {
  demoAgency,
  demoCreators,
  demoFans,
  demoFollowups,
  demoMemories,
  demoUsers
} from "@/data/demoAgency";

const openFollowups = demoFollowups.filter((followup) => followup.status === "open");
const warmContacts = demoFans.filter((fan) => ["warm", "buyer", "vip"].includes(fan.status));

const stats = [
  { label: "Agentur", value: demoAgency.name },
  { label: "Betreute Profile", value: String(demoCreators.length) },
  { label: "Fans / Kontakte", value: String(demoFans.length) },
  { label: "Offene Follow-ups", value: String(openFollowups.length) },
  { label: "Warme Kontakte", value: String(warmContacts.length) },
  { label: "Memories", value: String(demoMemories.length) }
];

export default function DashboardPage() {
  const demoUser = demoUsers[0];

  return (
    <main>
      <div className="page-shell">
        <SiteNav active="Dashboard" />

        <section>
          <div className="badge">FanMind Agentur-Dashboard</div>
          <h1>Willkommen, {demoUser.name}.</h1>
          <p className="lead">
            Dieses Dashboard zeigt den echten Demo-Account mit Testdaten: Agentur, betreute Profile, Fans, Memories und Follow-ups.
          </p>
        </section>

        <section className="grid">
          {stats.map((stat) => (
            <article className="card" key={stat.label}>
              <p>{stat.label}</p>
              <h2>{stat.value}</h2>
            </article>
          ))}
        </section>

        <section className="section">
          <h2>Betreute Profile</h2>
          <p className="lead">Diese Profile gehoeren zur Demo-Agentur und zeigen spaeter den Einstieg in den Workflow.</p>
          <div className="grid">
            {demoCreators.map((creator) => (
              <article className="card" key={creator.id}>
                <div className="badge">{creator.platform}</div>
                <h3>{creator.displayName}</h3>
                <p>{creator.personaNotes}</p>
                <p><strong>Sprache:</strong> {creator.language}</p>
                <p><strong>Tonalitaet:</strong> {creator.tone}</p>
                <a className="button" href="/creator/demo">Profil oeffnen</a>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <h2>Offene Follow-ups</h2>
          <p className="lead">Gerhard kann hier zeigen, wie FanMind offene Nachfass-Aufgaben priorisiert.</p>
          <div className="grid">
            {openFollowups.map((followup) => {
              const fan = demoFans.find((item) => item.id === followup.fanId);
              return (
                <article className="card" key={followup.id}>
                  <div className="badge">{followup.dueLabel}</div>
                  <h3>{fan?.displayName ?? "Fan"}</h3>
                  <p>{followup.reason}</p>
                  <p><strong>Prioritaet:</strong> {followup.priority}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="section hero-card">
          <div className="badge">Demo-Flow</div>
          <h2>Naechster Schritt: Fan-/Kontakt-Detailseite.</h2>
          <p className="lead">
            Der naechste Baustein ist die Seite, auf der Gerhard einen Fan oeffnet und Memory, Nachrichten, Antwortvorschlaege und Follow-ups zeigt.
          </p>
          <div className="actions">
            <a className="button primary" href="/creator/demo">Betreutes Profil ansehen</a>
            <a className="button" href="/pricing">Pakete pruefen</a>
          </div>
        </section>
      </div>
    </main>
  );
}
