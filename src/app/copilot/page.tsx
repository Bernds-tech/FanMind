import SiteNav from "@/components/SiteNav";
import { demoCreators, demoFans, demoMessages } from "@/data/demoAgency";
import { getDefaultReplySuggestion, getMockReplySuggestion } from "@/lib/mockReplyService";

const selectedFan = demoFans[0];
const selectedCreator = demoCreators.find((creator) => creator.id === selectedFan.creatorId);
const latestMessage = demoMessages.find((message) => message.fanId === selectedFan.id);
const replySuggestion = getMockReplySuggestion(selectedFan.id) ?? getDefaultReplySuggestion();

export default function CopilotPage() {
  return (
    <main>
      <div className="page-shell">
        <SiteNav />

        <section className="hero">
          <div>
            <div className="badge">Chat-Copilot Demo</div>
            <h1>Antwortvorschlaege vorbereiten, nicht automatisch senden.</h1>
            <p className="lead">
              FanMind nutzt Fan-Kontext, betreutes Profil und bisherige Nachrichten, um 2 bis 3 Antwortvorschlaege vorzubereiten. Der Mensch prueft und sendet final selbst.
            </p>
            <div className="actions">
              <a className="button primary" href={`/fans/${selectedFan.id}`}>Fan-Kontext ansehen</a>
              <a className="button" href="/followups">Follow-ups oeffnen</a>
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
              <small>FAN-NACHRICHT</small>
              <p>{latestMessage?.content ?? "Keine Demo-Nachricht vorhanden."}</p>
            </div>
            <div className="post">
              <small>TONALITAET</small>
              <p>{selectedCreator?.tone ?? "Nicht hinterlegt"}</p>
            </div>
          </aside>
        </section>

        <section className="section">
          <h2>Manuelle Eingabe</h2>
          <p className="lead">In v1 fuegt das Team die Fan-Nachricht manuell ein. Keine Plattform-Integration, kein Scraping, kein automatisches Senden.</p>
          <article className="card">
            <div className="badge">Eingabefeld Demo</div>
            <h3>Fan-Nachricht</h3>
            <p>{latestMessage?.content ?? "Ich wuerde gern starten, aber ich weiss nicht, ob ich das zeitlich schaffe."}</p>
          </article>
        </section>

        <section className="section">
          <h2>2 bis 3 Antwortvorschlaege</h2>
          <p className="lead">Diese Vorschlaege sind vorbereitet. Sie werden nicht automatisch gesendet.</p>
          <div className="grid">
            {replySuggestion.options.map((option) => (
              <article className="card" key={option.label}>
                <div className="badge">{option.label}</div>
                <p>{option.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <h2>Memory- und Follow-up-Empfehlung</h2>
          <div className="grid">
            <article className="card">
              <div className="badge">Memory-Vorschlag</div>
              <p>{replySuggestion.suggestedMemory}</p>
            </article>
            <article className="card">
              <div className="badge">Follow-up-Vorschlag</div>
              <p>{replySuggestion.suggestedFollowup}</p>
            </article>
          </div>
        </section>

        <section className="section hero-card">
          <div className="badge">Human-in-the-loop</div>
          <h2>FanMind ist kein Bot.</h2>
          <p className="lead">
            Die Antwortvorschlaege sind Entscheidungshilfen. Das Team prueft Ton, Kontext und Grenzen und sendet die finale Nachricht bewusst ausserhalb von FanMind.
          </p>
          <div className="actions">
            <a className="button primary" href="/followups">Follow-up Queue zeigen</a>
            <a className="button" href="/fans">Kontaktliste</a>
          </div>
        </section>
      </div>
    </main>
  );
}
