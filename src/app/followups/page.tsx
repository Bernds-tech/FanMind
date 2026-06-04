import SiteNav from "@/components/SiteNav";
import { demoCreators, demoFans, demoFollowups } from "@/data/demoAgency";

const followupSections = [
  {
    title: "Überfällig",
    dueLabel: "Ueberfaellig",
    description: "Diese Kontakte sollten zuerst bearbeitet werden, damit warme Chancen nicht liegen bleiben."
  },
  {
    title: "Heute",
    dueLabel: "Heute",
    description: "Alle Aufgaben, die das Team im heutigen Follow-up-Slot prüfen sollte."
  },
  {
    title: "Diese Woche",
    dueLabel: "Diese Woche",
    description: "Geplante Nachfass-Aufgaben für die laufende Woche."
  }
];

const priorityRank: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2
};

function getFan(fanId: string) {
  return demoFans.find((fan) => fan.id === fanId);
}

function getCreatorName(creatorId: string) {
  return demoCreators.find((creator) => creator.id === creatorId)?.displayName ?? "Betreutes Profil";
}

function getOpenFollowupsByDueLabel(dueLabel: string) {
  return demoFollowups
    .filter((followup) => followup.dueLabel === dueLabel && followup.status === "open")
    .sort((first, second) => {
      const firstRank = priorityRank[first.priority] ?? 99;
      const secondRank = priorityRank[second.priority] ?? 99;

      return firstRank - secondRank;
    });
}

export default function FollowupsPage() {
  const openFollowupCount = demoFollowups.filter((followup) => followup.status === "open").length;

  return (
    <main>
      <div className="page-shell">
        <SiteNav active="Dashboard" />

        <section>
          <div className="badge">Follow-up Queue</div>
          <h1>Alle Nachfass-Aufgaben priorisiert im Blick.</h1>
          <p className="lead">
            Die Queue bündelt offene Follow-ups aus den Demo-Daten nach Dringlichkeit. So sieht das Team sofort, welche Kontakte überfällig sind, heute Aufmerksamkeit brauchen oder noch diese Woche geplant sind.
          </p>
          <div className="actions">
            <a className="button primary" href="/fans">Kontakte ansehen</a>
            <a className="button" href="/dashboard">Zurück zum Dashboard</a>
          </div>
        </section>

        <section className="section hero-card">
          <div className="badge">{openFollowupCount} offene Aufgaben</div>
          <h2>Queue für den manuellen Human-in-the-loop Workflow.</h2>
          <p className="lead">
            Jeder Eintrag zeigt Kontaktname, betreutes Profil, Grund, Priorität und Status. Der Button führt direkt zur passenden Kontaktseite, auf der Nachrichten, Memories und Antwortvorschläge geprüft werden können.
          </p>
        </section>

        {followupSections.map((section) => {
          const followups = getOpenFollowupsByDueLabel(section.dueLabel);

          return (
            <section className="section" key={section.dueLabel}>
              <div className="badge">{followups.length} Aufgaben</div>
              <h2>{section.title}</h2>
              <p className="lead">{section.description}</p>
              <div className="grid">
                {followups.length > 0 ? followups.map((followup) => {
                  const fan = getFan(followup.fanId);
                  const creatorName = getCreatorName(followup.creatorId);

                  return (
                    <article className="card" key={followup.id}>
                      <div className="badge">{followup.dueLabel}</div>
                      <h3>{fan?.displayName ?? "Unbekannter Kontakt"}</h3>
                      <p><strong>Betreutes Profil:</strong> {creatorName}</p>
                      <p><strong>Grund:</strong> {followup.reason}</p>
                      <p><strong>Priorität:</strong> {followup.priority}</p>
                      <p><strong>Status:</strong> {followup.status}</p>
                      <a className="button" href={`/fans/${followup.fanId}`}>Kontakt öffnen</a>
                    </article>
                  );
                }) : (
                  <article className="card">
                    <div className="badge">Keine offenen Aufgaben</div>
                    <h3>Alles erledigt</h3>
                    <p>In dieser Kategorie sind aktuell keine offenen Follow-ups geplant.</p>
                  </article>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
