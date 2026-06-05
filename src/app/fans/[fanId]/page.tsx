import SiteNav from "@/components/SiteNav";
import {
  demoCreators,
  demoFans,
  demoFollowups,
  demoMemories,
  demoMessages,
  demoReplySuggestions
} from "@/data/demoAgency";
import { notFound } from "next/navigation";

type FanDetailPageProps = {
  params: Promise<{
    fanId: string;
  }>;
};


const statusLabels: Record<string, string> = {
  buyer: "Käufer",
  do_not_push: "Kein Druck",
  inactive: "Inaktiv",
  new: "Neu",
  open: "Offen",
  vip: "VIP",
  warm: "Warm"
};

const valueLevelLabels: Record<string, string> = {
  high: "Hoch",
  low: "Niedrig",
  medium: "Mittel"
};

const priorityLabels: Record<string, string> = {
  high: "Hoch",
  low: "Niedrig",
  medium: "Mittel"
};

const memoryTypeLabels: Record<string, string> = {
  boundary: "Grenze",
  preference: "Vorliebe",
  purchase_signal: "Kaufsignal"
};

const directionLabels: Record<string, string> = {
  inbound: "Eingehend",
  outbound: "Ausgehend"
};

function getLocalizedLabel(labels: Record<string, string>, value: string) {
  return labels[value] ?? value;
}

export function generateStaticParams() {
  return demoFans.map((fan) => ({
    fanId: fan.id
  }));
}

export default async function FanDetailPage({ params }: FanDetailPageProps) {
  const { fanId } = await params;
  const selectedFan = demoFans.find((fan) => fan.id === fanId);

  if (!selectedFan) {
    notFound();
  }

  const selectedCreator = demoCreators.find((creator) => creator.id === selectedFan.creatorId);
  const messages = demoMessages.filter((message) => message.fanId === selectedFan.id);
  const memories = demoMemories.filter((memory) => memory.fanId === selectedFan.id);
  const followups = demoFollowups.filter((followup) => followup.fanId === selectedFan.id);
  const replySuggestion = demoReplySuggestions.find((item) => item.fanId === selectedFan.id);

  return (
    <main>
      <div className="page-shell">
        <SiteNav />

        <section className="hero">
          <div>
            <div className="badge">Fan-/Kontakt-Detail</div>
            <h1>{selectedFan.displayName}</h1>
            <p className="lead">
              Dynamische Kontaktseite für {selectedFan.handle}: FanMind bündelt Kontext, Nachrichten, Memories, Antwortvorschläge und Follow-ups für die menschliche Bearbeitung.
            </p>
            <div className="actions">
              <a className="button primary" href="/copilot">Antwortvorschläge öffnen</a>
              <a className="button" href="/fans">Zurück zur Kontaktliste</a>
              <a className="button" href="/followups">Nachfass-Warteschlange</a>
              <a className="button" href="/dashboard">Dashboard</a>
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
              <p>{getLocalizedLabel(statusLabels, selectedFan.status)}</p>
            </div>
            <div className="post">
              <small>TAGS</small>
              <p>{selectedFan.tags.join(", ")}</p>
            </div>
            <div className="post">
              <small>WERTIGKEIT</small>
              <p>{getLocalizedLabel(valueLevelLabels, selectedFan.valueLevel)}</p>
            </div>
          </aside>
        </section>

        <section className="section">
          <h2>Betreutes Profil</h2>
          <p className="lead">Dieses Profil gibt Tonalität, Sprache und Grenzen für die Vorschläge vor.</p>
          <article className="card">
            <div className="badge">{selectedCreator?.platform ?? "manual_demo"}</div>
            <h3>{selectedCreator?.displayName ?? "Unbekanntes Profil"}</h3>
            <p><strong>Sprache:</strong> {selectedCreator?.language ?? selectedFan.language}</p>
            <p><strong>Tonalität:</strong> {selectedCreator?.tone ?? "Nicht hinterlegt"}</p>
            <p><strong>Persona:</strong> {selectedCreator?.personaNotes ?? "Nicht hinterlegt"}</p>
            <p><strong>Grenzen:</strong> {selectedCreator?.boundaries ?? "Nicht hinterlegt"}</p>
          </article>
        </section>

        <section className="section">
          <h2>Nachrichtenverlauf</h2>
          <p className="lead">Die Fan-Nachrichten werden als Kontext genutzt. FanMind sendet nichts automatisch.</p>
          <div className="grid">
            {messages.length > 0 ? messages.map((message) => (
              <article className="card" key={message.id}>
                <div className="badge">{getLocalizedLabel(directionLabels, message.direction)}</div>
                <h3>Manuelle Demo</h3>
                <p>{message.content}</p>
              </article>
            )) : (
              <article className="card">
                <div className="badge">Keine Nachrichten</div>
                <p>Für diesen Kontakt ist in den Demo-Daten noch kein Nachrichtenverlauf hinterlegt.</p>
              </article>
            )}
          </div>
        </section>

        <section className="section">
          <h2>Fan-Memory</h2>
          <p className="lead">Memories speichern wichtige Erkenntnisse, Grenzen, Interessen und Kaufhinweise pro Fan.</p>
          <div className="grid">
            {memories.length > 0 ? memories.map((memory) => (
              <article className="card" key={memory.id}>
                <div className="badge">{getLocalizedLabel(memoryTypeLabels, memory.memoryType)}</div>
                <h3>Wichtigkeit: {getLocalizedLabel(priorityLabels, memory.importance)}</h3>
                <p>{memory.content}</p>
              </article>
            )) : (
              <article className="card">
                <div className="badge">Keine Memories</div>
                <p>Für diesen Kontakt wurden noch keine dauerhaften Fan-Memories gespeichert.</p>
              </article>
            )}
          </div>
        </section>

        <section className="section">
          <h2>KI-Antwortvorschläge</h2>
          <p className="lead">FanMind macht Vorschläge, der Mensch prüft und sendet final.</p>
          <div className="grid">
            {replySuggestion ? replySuggestion.options.map((option) => (
              <article className="card" key={option.label}>
                <div className="badge">{option.label}</div>
                <p>{option.text}</p>
              </article>
            )) : (
              <article className="card">
                <div className="badge">Kein Vorschlag</div>
                <p>Für diesen Kontakt liegt aktuell kein KI-Antwortvorschlag in den Demo-Daten vor.</p>
              </article>
            )}
          </div>
          <div className="actions">
            <a className="button primary" href="/copilot">Im Copilot bearbeiten</a>
          </div>
          {replySuggestion ? (
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
          ) : null}
        </section>

        <section className="section">
          <h2>Follow-ups</h2>
          <p className="lead">FanMind hilft dem Team, warme Kontakte nicht zu verlieren und Aufgaben sichtbar zu halten.</p>
          <div className="grid">
            {followups.length > 0 ? followups.map((followup) => (
              <article className="card" key={followup.id}>
                <div className="badge">{followup.dueLabel}</div>
                <h3>Priorität: {getLocalizedLabel(priorityLabels, followup.priority)}</h3>
                <p>{followup.reason}</p>
                <p>Status: {getLocalizedLabel(statusLabels, followup.status)}</p>
              </article>
            )) : (
              <article className="card">
                <div className="badge">Keine Follow-ups</div>
                <p>Für diesen Kontakt sind aktuell keine Follow-ups geplant.</p>
              </article>
            )}
          </div>
        </section>

        <section className="section hero-card">
          <div className="badge">Menschliche Prüfung</div>
          <h2>FanMind ist kein Bot.</h2>
          <p className="lead">
            FanMind macht Vorschläge, der Mensch prüft Kontext, Tonalität und Grenzen und sendet die finale Antwort bewusst selbst.
          </p>
          <div className="actions">
            <a className="button primary" href="/copilot">Antwortvorschläge öffnen</a>
            <a className="button" href="/fans">Weitere Kontakte ansehen</a>
            <a className="button" href="/followups">Nachfass-Warteschlange</a>
          </div>
        </section>
      </div>
    </main>
  );
}
