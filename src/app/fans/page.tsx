import { AppShell } from "@/components/AppShell";
import { AppTopbar } from "@/components/AppTopbar";
import { KpiStrip } from "@/components/KpiStrip";
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
const locationRotation = ["Zürich", "Basel", "Berlin", "Hamburg", "Wien", "Remote"];

const statusLabels: Record<string, string> = {
  buyer: "Käufer",
  do_not_push: "Kein Druck",
  inactive: "Inaktiv",
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
  const overdueCount = fans.filter((fan) => fan.nextFollowup === "Überfällig").length;
  const activeShare = fans.length ? Math.round((activeCount / fans.length) * 1000) / 10 : 0;
  const kpiItems = [
    { label: "Gesamtfans", value: fans.length, icon: "fans" as const, tone: "blue" as const, subtext: "+12% vs. letzten Monat" },
    { label: "Aktive", value: activeCount, icon: "active" as const, tone: "green" as const, subtext: `${activeShare.toString().replace(".", ",")}% der Gesamtfans` },
    { label: "VIP", value: vipCount, icon: "vip" as const, tone: "violet" as const, subtext: "Priorität hoch" },
    { label: "Reaktivierung", value: reactivationCount, icon: "reactivation" as const, tone: "orange" as const, subtext: "Überfällig: 24" },
    { label: "Follow-ups heute", value: followupsToday, icon: "followups" as const, tone: "blue" as const, subtext: "Heute fällig" },
    { label: "Überfällig", value: overdueCount, icon: "overdue" as const, tone: "orange" as const, subtext: "Menschlich prüfen" }
  ];
  const segments = ["Alle", "VIP", "Warm", "Käufer", "Inaktiv", "Kein Druck", "Heute fällig", "Deutsch", "Englisch", "Hoher Fan-Score"];
  const detailTabs = ["Überblick", "Verlauf", "Notizen", "Dateien"];
  const aiSuggestions = [
    `Rückfrage zu ${selectedFan?.creatorName ?? "dem Profil"} beantworten`,
    "Premium-Interesse menschlich prüfen lassen",
    "Nächstes Follow-up mit Kontext vorbereiten"
  ];

  return (
    <AppShell>
      <section className="workspace-console" aria-label="Kontaktverwaltung">
        <AppTopbar
          title="Kontakte"
          subtitle={`${fans.length} Demo-Kontakte · Quelle: ${sourceLabel}`}
          searchId="contact-search"
          searchPlaceholder="Name, Handle, Tag, Profil oder Sprache suchen"
        />

        <KpiStrip items={kpiItems} />

        <div className="segment-tabs" aria-label="Kontaktsegmente">
          {segments.map((segment) => (
            <button className={segment === "Alle" ? "active" : ""} type="button" key={segment}>{segment}</button>
          ))}
        </div>

        <div className="workspace-grid">
          <div className="contacts-table-wrap">
            <table className="contacts-table">
              <colgroup>
                <col className="select-col" />
                <col className="name-col" />
                <col className="status-col" />
                <col className="profile-col" />
                <col className="tags-col" />
                <col className="score-col" />
                <col className="last-contact-col" />
                <col className="followup-col" />
                <col className="owner-col" />
              </colgroup>
              <thead>
                <tr>
                  <th aria-label="Auswahl"><input type="checkbox" /></th>
                  <th>Name + Handle</th>
                  <th>Status</th>
                  <th>Profil</th>
                  <th>Tags</th>
                  <th>Fan-Score</th>
                  <th>Letzter Kontakt</th>
                  <th>Nächster Follow-up</th>
                  <th>Verantwortlich</th>
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
                  <button className={tab === "Überblick" ? "active" : ""} type="button" key={tab}>{tab}</button>
                ))}
              </div>

              <p className="detail-summary">{selectedFan.summary}</p>

              <div className="tag-list detail-tags">
                {selectedFan.tags.map((tag) => <span key={tag}>{tag}</span>)}
              </div>

              <div className="detail-metrics">
                <article><span>Fan-Score</span><strong>{selectedFan.fanScore}</strong></article>
                <article><span>Interaktionen</span><strong>{selectedFan.interactions}</strong></article>
                <article><span>Follow-ups</span><strong>{selectedFan.followupCount}</strong></article>
                <article><span>Sprache</span><strong>{selectedFan.language}</strong></article>
              </div>

              <div className="detail-list">
                <p><span>Letzter Kontakt</span>{selectedFan.lastContact}</p>
                <p><span>Nächster Follow-up</span>{selectedFan.nextFollowup}</p>
                <p><span>Kontaktinfos</span>{selectedFan.email} · {selectedFan.phone}</p>
                <p><span>Verantwortlich</span>{selectedFan.owner}</p>
                <p><span>Letzte Notiz</span>{selectedFan.lastNote}</p>
                <p><span>Letzte Nachricht</span>{selectedFan.lastMessage}</p>
                <p><span>Nächste Aktion</span>{selectedFan.nextAction}</p>
              </div>

              <div className="ai-panel">
                <span>KI-Antwortvorschläge</span>
                {aiSuggestions.map((suggestion) => (
                  <p key={suggestion}>{suggestion}</p>
                ))}
              </div>

              <div className="workspace-note compact-note">
                <strong>Menschliche Prüfung</strong>
                <span>FanMind bereitet vor. Ein Mensch prüft und sendet manuell.</span>
              </div>

              <div className="detail-actions">
                <a className="button primary" href={`/copilot?fan=${selectedFan.id}`}>Nachricht vorbereiten</a>
                <button type="button" className="button">Follow-up planen</button>
                <button type="button" className="button">Notiz hinzufügen</button>
                <button type="button" className="button">Mehr</button>
              </div>
            </aside>
          )}
        </div>
      </section>
    </AppShell>
  );
}
