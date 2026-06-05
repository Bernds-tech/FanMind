import SiteNav from "@/components/SiteNav";
import { demoCreators, demoFans, demoFollowups, demoMemories } from "@/data/demoAgency";
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
  tags: string[];
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
};

type MemoryRow = {
  id: string;
  fan_id: string;
};

function getSeedCreatorName(creatorId: string) {
  return demoCreators.find((creator) => creator.id === creatorId)?.displayName ?? "Betreutes Profil";
}

function getSeedFollowupCount(fanId: string) {
  return demoFollowups.filter((followup) => followup.fanId === fanId && followup.status === "open").length;
}

function getSeedMemoryCount(fanId: string) {
  return demoMemories.filter((memory) => memory.fanId === fanId).length;
}

export default async function FansPage() {
  let sourceLabel = "Seed-Daten";
  let fans = demoFans.map((fan) => ({
    id: fan.id,
    displayName: fan.displayName,
    creatorName: getSeedCreatorName(fan.creatorId),
    status: fan.status,
    language: fan.language,
    summary: fan.summary,
    tags: fan.tags,
    memoryCount: getSeedMemoryCount(fan.id),
    followupCount: getSeedFollowupCount(fan.id)
  }));

  try {
    const [dbFans, dbCreators, dbFollowups, dbMemories] = await Promise.all([
      readSupabaseTable<FanRow>("fans", { order: "display_name.asc" }),
      readSupabaseTable<CreatorRow>("creators"),
      readSupabaseTable<FollowupRow>("followups"),
      readSupabaseTable<MemoryRow>("memories")
    ]);

    if (dbFans && dbCreators && dbFollowups && dbMemories) {
      sourceLabel = "Supabase-Datenbank";
      fans = dbFans.map((fan) => ({
        id: fan.id,
        displayName: fan.display_name,
        creatorName: dbCreators.find((creator) => creator.id === fan.creator_id)?.display_name ?? "Betreutes Profil",
        status: fan.status,
        language: fan.language,
        summary: fan.summary ?? "Keine Zusammenfassung vorhanden.",
        tags: fan.tags ?? [],
        memoryCount: dbMemories.filter((memory) => memory.fan_id === fan.id).length,
        followupCount: dbFollowups.filter((followup) => followup.fan_id === fan.id && followup.status === "open").length
      }));
    }
  } catch {
    sourceLabel = "Seed-Daten Fallback";
  }

  return (
    <main>
      <div className="page-shell">
        <SiteNav />

        <section>
          <div className="badge">Fan-/Kontaktliste</div>
          <div className="badge">Quelle: {sourceLabel}</div>
          <h1>Fans und Kontakte im Ueberblick.</h1>
          <p className="lead">
            Diese Liste zeigt Kontakte der Demo-Agentur. Jeder Kontakt ist einem betreuten Profil zugeordnet und kann Memories, Nachrichten und Follow-ups haben.
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
            {fans.map((fan) => (
              <article className="card" key={fan.id}>
                <div className="badge">{fan.status}</div>
                <h3>{fan.displayName}</h3>
                <p>{fan.summary}</p>
                <p><strong>Profil:</strong> {fan.creatorName}</p>
                <p><strong>Sprache:</strong> {fan.language}</p>
                <p><strong>Tags:</strong> {fan.tags.join(", ")}</p>
                <p><strong>Memories:</strong> {fan.memoryCount}</p>
                <p><strong>Offene Follow-ups:</strong> {fan.followupCount}</p>
                <a className="button" href={`/fans/${fan.id}`}>Kontakt oeffnen</a>
              </article>
            ))}
          </div>
        </section>

        <section className="section hero-card">
          <div className="badge">Datenbank-Migration gestartet</div>
          <h2>Diese Seite kann jetzt Supabase nutzen.</h2>
          <p className="lead">
            Wenn Supabase-Umgebungsvariablen gesetzt sind, liest die Kontaktliste aus der Datenbank. Sonst bleibt der Seed-Daten-Fallback aktiv.
          </p>
        </section>
      </div>
    </main>
  );
}
