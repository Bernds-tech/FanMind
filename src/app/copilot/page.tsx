import CopilotForm from "@/components/CopilotForm";
import SiteNav from "@/components/SiteNav";
import { demoCreators, demoFans, demoFollowups, demoMemories, demoMessages } from "@/data/demoAgency";

const selectedFan = demoFans[0];
const selectedCreator = demoCreators.find((creator) => creator.id === selectedFan.creatorId);
const latestMessage = demoMessages.find((message) => message.fanId === selectedFan.id);
const memories = demoMemories.filter((memory) => memory.fanId === selectedFan.id);
const followups = demoFollowups.filter((followup) => followup.fanId === selectedFan.id);

export default function CopilotPage() {
  const initialMessage = latestMessage?.content ?? "Ich würde gern starten, aber ich weiß nicht, ob ich das zeitlich schaffe.";

  return (
    <main>
      <div className="page-shell">
        <SiteNav />

        <section className="hero">
          <div>
            <div className="badge">Chat-Copilot Demo</div>
            <h1>Echte KI-Antwortvorschläge vorbereiten, nicht automatisch senden.</h1>
            <p className="lead">
              FanMind nutzt Fan-Kontext, betreutes Profil und bisherige Nachrichten, um serverseitig 2 bis 3 Antwortvorschläge zu erzeugen. Der Mensch prüft und sendet final selbst.
            </p>
            <div className="actions">
              <a className="button primary" href={`/fans/${selectedFan.id}`}>Fan-Kontext ansehen</a>
              <a className="button" href="/followups">Follow-ups öffnen</a>
              <a className="button" href="/dashboard">Dashboard</a>
            </div>
          </div>

          <aside className="hero-card">
            <div className="profile-head">
              <div className="avatar" />
              <div>
                <div className="profile-title">{selectedFan.displayName}</div>
                <div className="profile-subtitle">{selectedCreator?.displayName ?? "Betreutes Profil"}</div>
              </div>
            </div>
            <div className="post">
              <small>FAN/KONTAKT</small>
              <p>{selectedFan.handle} · Status: {selectedFan.status} · Sprache: {selectedFan.language}</p>
            </div>
            <div className="post">
              <small>LETZTE DEMO-NACHRICHT</small>
              <p>{initialMessage}</p>
            </div>
            <div className="post">
              <small>TONALITAET</small>
              <p>{selectedCreator?.tone ?? "Nicht hinterlegt"}</p>
            </div>
          </aside>
        </section>

        <section className="section">
          <h2>Kontext für den Copilot</h2>
          <p className="lead">Dieser Kontext wird nicht im Browser mit einem API-Key verarbeitet. Der API-Key bleibt ausschließlich serverseitig.</p>
          <div className="grid two-column-grid">
            <article className="card">
              <div className="badge">Fan/Kontakt</div>
              <h3>{selectedFan.displayName}</h3>
              <p><strong>Handle:</strong> {selectedFan.handle}</p>
              <p><strong>Status:</strong> {selectedFan.status}</p>
              <p><strong>Summary:</strong> {selectedFan.summary}</p>
              <p><strong>Tags:</strong> {selectedFan.tags.join(", ")}</p>
            </article>
            <article className="card">
              <div className="badge">Betreutes Profil</div>
              <h3>{selectedCreator?.displayName ?? "Unbekanntes Profil"}</h3>
              <p><strong>Sprache:</strong> {selectedCreator?.language ?? selectedFan.language}</p>
              <p><strong>Tonalität:</strong> {selectedCreator?.tone ?? "Nicht hinterlegt"}</p>
              <p><strong>Persona:</strong> {selectedCreator?.personaNotes ?? "Nicht hinterlegt"}</p>
              <p><strong>Grenzen:</strong> {selectedCreator?.boundaries ?? "Nicht hinterlegt"}</p>
            </article>
          </div>
        </section>

        <section className="section">
          <h2>Fan-Gedächtnis und offene Follow-ups</h2>
          <div className="grid two-column-grid">
            <article className="card">
              <div className="badge">Bestehende Memories</div>
              {memories.length > 0 ? memories.map((memory) => (
                <p key={memory.id}><strong>{memory.memoryType}:</strong> {memory.content}</p>
              )) : <p>Noch keine Memories für diesen Kontakt.</p>}
            </article>
            <article className="card">
              <div className="badge">Follow-ups</div>
              {followups.length > 0 ? followups.map((followup) => (
                <p key={followup.id}><strong>{followup.dueLabel}:</strong> {followup.reason}</p>
              )) : <p>Keine offenen Follow-ups für diesen Kontakt.</p>}
            </article>
          </div>
        </section>

        <CopilotForm fanId={selectedFan.id} initialMessage={initialMessage} />

        <section className="section hero-card">
          <div className="badge">Menschliche Prüfung</div>
          <h2>FanMind ist kein Bot.</h2>
          <p className="lead">
            Die Antwortvorschläge sind Entscheidungshilfen. Das Team prüft Ton, Kontext und Grenzen und sendet die finale Nachricht bewusst außerhalb von FanMind.
          </p>
          <div className="actions">
            <a className="button primary" href="/followups">Nachfass-Warteschlange zeigen</a>
            <a className="button" href="/fans">Kontaktliste</a>
          </div>
        </section>
      </div>
    </main>
  );
}
