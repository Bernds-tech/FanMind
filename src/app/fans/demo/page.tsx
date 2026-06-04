import SiteNav from "@/components/SiteNav";
import {
  demoCreators,
  demoFans,
  demoFollowups,
  demoMemories,
  demoMessages,
  demoReplySuggestions
} from "@/data/demoAgency";

const selectedFan = demoFans[0];
const selectedCreator = demoCreators.find((creator) => creator.id === selectedFan.creatorId);
const messages = demoMessages.filter((message) => message.fanId === selectedFan.id);
const memories = demoMemories.filter((memory) => memory.fanId === selectedFan.id);
const followups = demoFollowups.filter((followup) => followup.fanId === selectedFan.id);
const replySuggestion = demoReplySuggestions.find((item) => item.fanId === selectedFan.id);

export default function FanDemoPage() {
  return (
    <main>
      <div className="page-shell">
        <SiteNav />

        <section className="hero">
          <div>
            <div className="badge">Fan-/Kontakt-Detail Demo</div>
            <h1>{selectedFan.displayName}</h1>
            <p className="lead">
              Dieses Kontaktprofil zeigt, wie FanMind Fan-Kontext, Nachrichten, Memories, Antwortvorschlaege und Follow-ups an einem Ort zusammenfuehrt.
            </p>
            <div className="actions">
              <a className="button primary" href="/dashboard">Zurueck zum Dashboard</a>
              <a className="button" href="/creator/demo">Betreutes Profil</a>
              <a className="button" href="/pricing">Pakete</a>
            </div>
          </div>

          <aside className="hero-card">
            <div className="profile-head">
              <div className="avatar" />
              <div>
                <div className="profile-title">{selectedFan.handle}</div>
                <div className="profile-subtitle">{selectedCreator?.displayName ?? "Betreutes Profil"}</div>
              </div>
            </div>
            <p className="lead">{selectedFan.summary}</p>
            <div className="post">
              <small>STATUS</small>
              <p>{selectedFan.status}</p>
            </div>
            <div className="post">
              <small>TAGS</small>
              <p>{selectedFan.tags.join(", ")}</p>
            </div>
            <div className="post">
              <small>WERTIGKEIT</small>
              <p>{selectedFan.valueLevel}</p>
            </div>
          </aside>
        </section>

        <section className="section">
          <h2>Nachrichtenverlauf</h2>
          <p className="lead">Die Fan-Nachricht wird manuell eingefuegt. FanMind sendet nichts automatisch.</p>
          <div className="grid">
            {messages.map((message) => (
              <article className="card" key={message.id}>
                <div className="badge">{message.direction}</div>
                <h3>{message.source}</h3>
                <p>{message.content}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <h2>Fan-Memory</h2>
          <p className="lead">Memories speichern wichtige Erkenntnisse, Grenzen, Interessen und Kaufhinweise pro Fan.</p>
          <div className="grid">
            {memories.map((memory) => (
              <article className="card" key={memory.id}>
                <div className="badge">{memory.memoryType}</div>
                <h3>Wichtigkeit: {memory.importance}</h3>
                <p>{memory.content}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <h2>KI-Antwortvorschlaege</h2>
          <p className="lead">Antworten sind Vorschlaege. Die finale Nachricht wird vom Menschen geprueft und ausserhalb von FanMind gesendet.</p>
          <div className="grid">
            {replySuggestion?.options.map((option) => (
              <article className="card" key={option.label}>
                <div className="badge">{option.label}</div>
                <p>{option.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <h2>Follow-up</h2>
          <p className="lead">FanMind hilft dem Team, warme Kontakte nicht zu verlieren.</p>
          <div className="grid">
            {followups.map((followup) => (
              <article className="card" key={followup.id}>
                <div className="badge">{followup.dueLabel}</div>
                <h3>Prioritaet: {followup.priority}</h3>
                <p>{followup.reason}</p>
                <p>Status: {followup.status}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section hero-card">
          <div className="badge">Human-in-the-loop</div>
          <h2>FanMind ist kein Bot.</h2>
          <p className="lead">
            Diese Seite zeigt den Kernnutzen: Kontext behalten, Antwortvorschlaege erhalten und Follow-ups setzen. Gesendet wird erst nach menschlicher Pruefung.
          </p>
          <div className="actions">
            <a className="button primary" href="/dashboard">Demo-Flow fortsetzen</a>
            <a className="button" href="/demo">Alle Demo-Seiten</a>
          </div>
        </section>
      </div>
    </main>
  );
}
