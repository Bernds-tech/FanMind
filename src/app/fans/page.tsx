import SiteNav from "@/components/SiteNav";
import { demoCreators, demoFans, demoFollowups, demoMemories } from "@/data/demoAgency";

function getCreatorName(creatorId: string) {
  return demoCreators.find((creator) => creator.id === creatorId)?.displayName ?? "Betreutes Profil";
}

function getFollowupCount(fanId: string) {
  return demoFollowups.filter((followup) => followup.fanId === fanId && followup.status === "open").length;
}

function getMemoryCount(fanId: string) {
  return demoMemories.filter((memory) => memory.fanId === fanId).length;
}

export default function FansPage() {
  return (
    <main>
      <div className="page-shell">
        <SiteNav />

        <section>
          <div className="badge">Fan-/Kontaktliste</div>
          <h1>Fans und Kontakte im Ueberblick.</h1>
          <p className="lead">
            Diese Liste zeigt die Testkontakte der Demo-Agentur. Jeder Kontakt ist einem betreuten Profil zugeordnet und kann Memories, Nachrichten und Follow-ups haben.
          </p>
          <div className="actions">
            <a className="button primary" href="/fans/demo">Beispielkontakt oeffnen</a>
            <a className="button" href="/dashboard">Zurueck zum Dashboard</a>
          </div>
        </section>

        <section className="section">
          <h2>Kontaktliste</h2>
          <p className="lead">Gerhard kann hier zeigen, wie eine Agentur mehrere Fans/Kontakte pro Profil betreut.</p>
          <div className="grid">
            {demoFans.map((fan) => (
              <article className="card" key={fan.id}>
                <div className="badge">{fan.status}</div>
                <h3>{fan.displayName}</h3>
                <p>{fan.summary}</p>
                <p><strong>Profil:</strong> {getCreatorName(fan.creatorId)}</p>
                <p><strong>Sprache:</strong> {fan.language}</p>
                <p><strong>Tags:</strong> {fan.tags.join(", ")}</p>
                <p><strong>Memories:</strong> {getMemoryCount(fan.id)}</p>
                <p><strong>Offene Follow-ups:</strong> {getFollowupCount(fan.id)}</p>
                <a className="button" href={`/fans/${fan.id}`}>Kontakt oeffnen</a>
              </article>
            ))}
          </div>
        </section>

        <section className="section hero-card">
          <div className="badge">Demo-Hinweis</div>
          <h2>Jeder Kontakt oeffnet jetzt seine eigene Detailseite.</h2>
          <p className="lead">
            Die Liste ist wie echte Produktdaten strukturiert: Jeder Fan fuehrt zu einer dynamischen Detailseite mit Nachrichten, Memories, Vorschlaegen und Follow-ups.
          </p>
        </section>
      </div>
    </main>
  );
}
