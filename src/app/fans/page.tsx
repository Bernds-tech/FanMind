import { demoCreators, demoFans, demoFollowups, demoMemories, demoMessages } from "@/data/demoAgency";
import { readSupabaseTable } from "@/lib/supabaseServer";

type FanRow = {
  id: string;
  agency_id: string;
  creator_id: string;
  handle: string;
  display_name: string;
  status: string;
  language: string;
  summary: string | null;
  tags: string[] | null;
  value_level: string;
};

type CreatorRow = {
  id: string;
  display_name: string;
};

type FollowupRow = {
  id: string;
  fan_id: string;
  status: string;
  due_label?: string | null;
  reason?: string | null;
  priority?: string | null;
};

type MemoryRow = {
  id: string;
  fan_id: string;
  content?: string | null;
};

type WorkspaceFan = {
  id: string;
  displayName: string;
  handle: string;
  creatorName: string;
  status: string;
  language: string;
  summary: string;
  tags: string[];
  valueLevel: string;
  memoryCount: number;
  followupCount: number;
  fanScore: number;
  lastContact: string;
  nextFollowup: string;
  owner: string;
  interactions: number;
  email: string;
  phone: string;
  location: string;
  lastNote: string;
  lastMessage: string;
  nextAction: string;
};

const ownerRotation = ["Gerhard", "Mia-Team", "Nova-Team", "Arena-Team"];
const lastContactRotation = ["Heute 09:40", "Gestern 18:15", "Mo, 14:20", "Vor 5 Tagen", "Vor 3 Wochen"];
const locationRotation = ["Zuerich", "Basel", "Berlin", "Hamburg", "Wien", "Remote"];

const statusLabels: Record<string, string> = {
  buyer: "Buyer",
  do_not_push: "Do not push",
  inactive: "Inactive",
  new: "Neu",
  vip: "VIP",
  warm: "Warm"
};

function getSeedCreatorName(creatorId: string) {
  return demoCreators.find((creator) => creator.id === creatorId)?.displayName ?? "Betreutes Profil";
}

function getSeedFollowups(fanId: string) {
  return demoFollowups.filter((followup) => followup.fanId === fanId && followup.status === "open");
}

function getSeedMemories(fanId: string) {
  return demoMemories.filter((memory) => memory.fanId === fanId);
}

function getScore(status: string, valueLevel: string, followupCount: number, memoryCount: number) {
  const statusScore: Record<string, number> = {
    vip: 92,
    buyer: 86,
    warm: 72,
    new: 54,
    inactive: 41,
    do_not_push: 28
  };
  const valueBonus: Record<string, number> = {
    high: 8,
    medium: 4,
    low: 0
  };

  return Math.min(99, (statusScore[status] ?? 50) + (valueBonus[valueLevel] ?? 0) + followupCount + memoryCount);
}

function getStatusLabel(status: string) {
  return statusLabels[status] ?? status;
}

function buildWorkspaceFan(
  fan: {
    id: string;
    displayName: string;
    handle: string;
    creatorName: string;
    status: string;
    language: string;
    summary: string;
    tags: string[];
    valueLevel: string;
    memoryCount: number;
    followupCount: number;
    nextFollowup: string;
    lastNote: string;
    lastMessage: string;
  },
  index: number
): WorkspaceFan {
  return {
    ...fan,
    fanScore: getScore(fan.status, fan.valueLevel, fan.followupCount, fan.memoryCount),
    lastContact: lastContactRotation[index % lastContactRotation.length],
    owner: ownerRotation[index % ownerRotation.length],
    interactions: 8 + index * 3 + fan.memoryCount + fan.followupCount,
    email: index % 3 === 0 ? `${fan.handle}@demo.local` : "Optional nicht gepflegt",
    phone: "Optional nicht gepflegt",
    location: locationRotation[index % locationRotation.length],
    nextAction: fan.followupCount > 0 ? "Follow-up vorbereiten" : "Kontakt beobachten"
  };
}

function getSelectedFan(fans: WorkspaceFan[]) {
  return fans.find((fan) => fan.id === "fan_sandra_02") ?? fans[0];
}

export default async function FansPage() {
  let sourceLabel = "Seed-Daten";
  let fans = demoFans.map((fan, index) => {
    const followups = getSeedFollowups(fan.id);
    const memories = getSeedMemories(fan.id);
    const lastMessage = demoMessages.find((message) => message.fanId === fan.id)?.content ?? "Noch keine aktuelle Nachricht im Demo-Verlauf.";

    return buildWorkspaceFan(
      {
        id: fan.id,
        displayName: fan.displayName,
        handle: fan.handle,
        creatorName: getSeedCreatorName(fan.creatorId),
        status: fan.status,
        language: fan.language,
        summary: fan.summary,
        tags: fan.tags,
        valueLevel: fan.valueLevel,
        memoryCount: memories.length,
        followupCount: followups.length,
        nextFollowup: followups[0]?.dueLabel ?? "Kein Follow-up geplant",
        lastNote: memories[0]?.content ?? fan.summary,
        lastMessage
      },
      index
    );
  });

  try {
    const [dbFans, dbCreators, dbFollowups, dbMemories] = await Promise.all([
      readSupabaseTable<FanRow>("fans", { order: "display_name.asc" }),
      readSupabaseTable<CreatorRow>("creators"),
      readSupabaseTable<FollowupRow>("followups"),
      readSupabaseTable<MemoryRow>("memories")
    ]);

    if (dbFans && dbCreators && dbFollowups && dbMemories) {
      sourceLabel = "Supabase-Datenbank";
      fans = dbFans.map((fan, index) => {
        const followups = dbFollowups.filter((followup) => followup.fan_id === fan.id && followup.status === "open");
        const memories = dbMemories.filter((memory) => memory.fan_id === fan.id);

        return buildWorkspaceFan(
          {
            id: fan.id,
            displayName: fan.display_name,
            handle: fan.handle,
            creatorName: dbCreators.find((creator) => creator.id === fan.creator_id)?.display_name ?? "Betreutes Profil",
            status: fan.status,
            language: fan.language,
            summary: fan.summary ?? "Keine Zusammenfassung vorhanden.",
            tags: fan.tags ?? [],
            valueLevel: fan.value_level,
            memoryCount: memories.length,
            followupCount: followups.length,
            nextFollowup: followups[0]?.due_label ?? followups[0]?.reason ?? "Kein Follow-up geplant",
            lastNote: memories[0]?.content ?? fan.summary ?? "Noch keine Notiz gespeichert.",
            lastMessage: "Letzte Nachricht wird in Phase 3 aus dem Kommunikationsverlauf geladen."
          },
          index
        );
      });
    }
  } catch {
    sourceLabel = "Seed-Daten Fallback";
  }

  const selectedFan = getSelectedFan(fans);
  const activeCount = fans.filter((fan) => !["inactive", "do_not_push"].includes(fan.status)).length;
  const vipCount = fans.filter((fan) => fan.status === "vip").length;
  const reactivationCount = fans.filter((fan) => fan.status === "inactive").length;
  const followupsToday = fans.filter((fan) => fan.nextFollowup === "Heute").length;
  const overdueCount = fans.filter((fan) => fan.nextFollowup === "Ueberfaellig").length;
  const segments = ["Alle", "VIP", "Warm", "Buyer", "Inactive", "Do not push", "Heute faellig", "Deutsch", "English", "Hoher Fan Score"];
  const savedViews = ["Top Fans", "Reaktivierung", "Event-Interessenten", "Premium-Kaeufer", "Neue Kontakte", "Heute faellige Follow-ups"];
  const detailTabs = ["Ueberblick", "Verlauf", "Notizen", "Dateien"];
  const aiSuggestions = [
    `Rueckfrage zu ${selectedFan?.creatorName ?? "dem Profil"} beantworten`,
    "Premium-Interesse menschlich pruefen lassen",
    "Naechstes Follow-up mit Kontext vorbereiten"
  ];

  return (
    <main className="workspace-app">
      <aside className="workspace-sidebar" aria-label="Workspace Navigation">
        <a className="sidebar-brand" href="/">
          <span className="brand-mark">FM</span>
          <span>
            <strong>FanMind</strong>
            <small>Agency Console</small>
          </span>
        </a>
        <nav className="sidebar-nav" aria-label="Workspace Navigation">
          <a href="/dashboard">Dashboard</a>
          <a className="active" href="/fans">Kontakte</a>
          <a href="/fans">Segmente</a>
          <a href="/followups">Follow-ups</a>
          <a href="/copilot">Kampagnen</a>
          <a href="/dashboard">Analytics</a>
          <a href="/pricing">Settings</a>
        </nav>
        <div className="saved-views">
          <span>Gespeicherte Ansichten</span>
          {savedViews.map((view) => (
            <a href="/fans" key={view}>{view}</a>
          ))}
        </div>
      </aside>

      <section className="workspace-console" aria-label="Kontaktverwaltung">
        <header className="workspace-topbar">
          <div>
            <p className="eyebrow">Agentur-Kontaktzentrale</p>
            <h1>Kontakte</h1>
            <p>{fans.length} Demo-Kontakte · Quelle: {sourceLabel}</p>
          </div>
          <label className="search-field topbar-search" htmlFor="contact-search">
            <span>Suche</span>
            <input id="contact-search" type="search" placeholder="Name, Handle, Tag, Profil oder Sprache suchen" />
          </label>
          <div className="toolbar-actions" aria-label="Kontaktaktionen">
            <button type="button" className="button compact">Filter</button>
            <button type="button" className="button compact">Sortierung</button>
            <button type="button" className="button compact">Ansichten</button>
            <button type="button" className="button compact primary">Neuer Kontakt</button>
          </div>
        </header>

        <section className="kpi-strip" aria-label="Kontakt-Kennzahlen">
          <article><span>Gesamtfans</span><strong>{fans.length}</strong></article>
          <article><span>Aktive</span><strong>{activeCount}</strong></article>
          <article><span>VIP</span><strong>{vipCount}</strong></article>
          <article><span>Reaktivierung</span><strong>{reactivationCount}</strong></article>
          <article><span>Follow-ups heute</span><strong>{followupsToday}</strong></article>
          <article><span>Ueberfaellig</span><strong>{overdueCount}</strong></article>
        </section>

        <div className="segment-tabs" aria-label="Kontaktsegmente">
          {segments.map((segment) => (
            <button className={segment === "Alle" ? "active" : ""} type="button" key={segment}>{segment}</button>
          ))}
        </div>

        <div className="workspace-grid">
          <div className="contacts-table-wrap">
            <table className="contacts-table">
              <thead>
                <tr>
                  <th aria-label="Auswahl"><input type="checkbox" /></th>
                  <th>Name + Handle</th>
                  <th>Status</th>
                  <th>Profil</th>
                  <th>Tags</th>
                  <th>Fan Score</th>
                  <th>Letzter Kontakt</th>
                  <th>Naechster Follow-up</th>
                  <th>Owner</th>
                </tr>
              </thead>
              <tbody>
                {fans.map((fan) => (
                  <tr className={fan.id === selectedFan?.id ? "selected" : ""} key={fan.id}>
                    <td><input type="checkbox" /></td>
                    <td>
                      <a className="contact-name" href={`/fans/${fan.id}`}>
                        <strong>{fan.displayName}</strong>
                        <span>@{fan.handle}</span>
                      </a>
                    </td>
                    <td><span className={`status-pill status-${fan.status}`}>{getStatusLabel(fan.status)}</span></td>
                    <td>{fan.creatorName}</td>
                    <td>
                      <div className="tag-list">
                        {fan.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}
                      </div>
                    </td>
                    <td><strong>{fan.fanScore}</strong></td>
                    <td>{fan.lastContact}</td>
                    <td>{fan.nextFollowup}</td>
                    <td>{fan.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedFan && (
            <aside className="detail-panel" aria-label="Kontakt-Detailansicht">
              <div className="detail-head">
                <div className="avatar">{selectedFan.displayName.slice(0, 1)}</div>
                <div>
                  <div className="profile-title">{selectedFan.displayName}</div>
                  <div className="profile-subtitle">@{selectedFan.handle} · {selectedFan.creatorName}</div>
                </div>
                <span className={`status-pill status-${selectedFan.status}`}>{getStatusLabel(selectedFan.status)}</span>
              </div>

              <div className="detail-tabs" aria-label="Detailbereiche">
                {detailTabs.map((tab) => (
                  <button className={tab === "Ueberblick" ? "active" : ""} type="button" key={tab}>{tab}</button>
                ))}
              </div>

              <p className="detail-summary">{selectedFan.summary}</p>

              <div className="tag-list detail-tags">
                {selectedFan.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>

              <div className="detail-metrics">
                <article><span>Fan Score</span><strong>{selectedFan.fanScore}</strong></article>
                <article><span>Interaktionen</span><strong>{selectedFan.interactions}</strong></article>
                <article><span>Follow-ups</span><strong>{selectedFan.followupCount}</strong></article>
                <article><span>Sprache</span><strong>{selectedFan.language}</strong></article>
              </div>

              <div className="detail-list">
                <p><span>Letzter Kontakt</span>{selectedFan.lastContact}</p>
                <p><span>Naechster Follow-up</span>{selectedFan.nextFollowup}</p>
                <p><span>Kontaktinfos</span>{selectedFan.email} · {selectedFan.phone}</p>
                <p><span>Owner</span>{selectedFan.owner}</p>
                <p><span>Letzte Notiz</span>{selectedFan.lastNote}</p>
                <p><span>Letzte Nachricht</span>{selectedFan.lastMessage}</p>
                <p><span>Naechste Aktion</span>{selectedFan.nextAction}</p>
              </div>

              <div className="ai-panel">
                <span>KI-Antwortvorschlaege</span>
                {aiSuggestions.map((suggestion) => (
                  <p key={suggestion}>{suggestion}</p>
                ))}
              </div>

              <div className="workspace-note compact-note">
                <strong>Human-in-the-loop</strong>
                <span>FanMind bereitet vor. Ein Mensch prueft und sendet manuell.</span>
              </div>

              <div className="detail-actions">
                <a className="button primary" href={`/copilot?fan=${selectedFan.id}`}>Nachricht vorbereiten</a>
                <button type="button" className="button">Follow-up planen</button>
                <button type="button" className="button">Notiz hinzufuegen</button>
                <button type="button" className="button">Mehr</button>
              </div>
            </aside>
          )}
        </div>
      </section>
    </main>
  );
}
