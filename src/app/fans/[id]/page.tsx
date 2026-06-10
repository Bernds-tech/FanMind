import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getSupabaseServerUser,
  getUserWorkspaceDashboard,
  getWorkspaceContact,
  getWorkspaceContacts,
  signOutSupabaseServerSession,
  type ContactRow,
  type WorkspaceDashboardRow,
} from "@/lib/supabase/server";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { getWorkspaceNavigation } from "@/lib/workspaceNavigation";
import dashboardStyles from "../../dashboard/dashboard.module.css";
import styles from "../fans.module.css";

type FanDetailPageProps = {
  params: Promise<{ id: string }>;
};

type FanDetailWorkspaceProps = {
  workspace: WorkspaceDashboardRow;
  userDisplayName: string;
  contact: ContactRow | null;
  contactCount: number;
  contactError?: string;
};

const sourceLabels: Record<string, string> = {
  manual: "Manuell",
  instagram: "Instagram (manuell)",
  tiktok: "TikTok (manuell)",
};

const statusLabels: Record<string, string> = {
  new: "Neu",
  active: "Aktiv",
  warm: "Warm",
  follow_up: "Follow-up",
  paused: "Pausiert",
};

async function logout() {
  "use server";

  await signOutSupabaseServerSession();
  redirect("/login");
}

function FanDetailWorkspace({
  workspace,
  userDisplayName,
  contact,
  contactCount,
  contactError,
}: FanDetailWorkspaceProps) {
  const { mainNavigation, settingsNavigation, savedViews } =
    getWorkspaceNavigation("fans");
  const userLabel = userDisplayName || workspace.name || "Nutzer";
  const title = contact?.display_name ?? "Fan-Detail";

  return (
    <WorkspaceShell
      workspaceName={workspace.name}
      userLabel={userLabel}
      planLabel={workspace.plan_id}
      planMeta={workspace.role}
      planStatus="Aktiv"
      mainNavigation={mainNavigation}
      settingsNavigation={settingsNavigation}
      savedViews={savedViews}
      header={{
        title,
        subtitle: "Kontaktdetail mit echten Workspace-Daten",
        searchPlaceholder: "Suche bleibt in dieser MVP-Ansicht unverändert ...",
        primaryActionLabel: "Zur Fanliste",
        primaryActionHref: "/fans#fans-list",
      }}
      contactCount={contactCount}
      logoutAction={logout}
    >
      <div className={styles.detailStack}>
        <Link className={styles.backLink} href="/fans#fans-list">
          ← Zurück zur Fanliste
        </Link>

        {contactError ? (
          <p className={dashboardStyles.error}>
            <strong>Kontakt konnte nicht geladen werden.</strong>
            <span>{contactError}</span>
          </p>
        ) : null}

        {contact ? <FanDetailContent contact={contact} /> : <FanNotFound />}
      </div>
    </WorkspaceShell>
  );
}

function FanDetailContent({ contact }: { contact: ContactRow }) {
  return (
    <>
      <section className={styles.profileHero} aria-labelledby="fan-profile-title">
        <article className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div className={styles.profileAvatar} aria-hidden="true">
              {getInitials(contact.display_name)}
            </div>
            <div>
              <p className={dashboardStyles.eyebrow}>Profilkarte</p>
              <h2 id="fan-profile-title">{contact.display_name}</h2>
              <p className={styles.profileHandle}>
                {contact.handle || "Kein Handle hinterlegt"}
              </p>
            </div>
          </div>

          <dl className={styles.profileMetaGrid}>
            <div>
              <dt>Quelle/Kanal</dt>
              <dd>{formatSource(contact.source_platform)}</dd>
            </div>
            <div>
              <dt>Sprache</dt>
              <dd>{formatLanguage(contact.language)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{formatStatus(contact.status)}</dd>
            </div>
            <div>
              <dt>Erstellt am</dt>
              <dd>{formatDate(contact.created_at)}</dd>
            </div>
          </dl>

          <div className={styles.detailTags} aria-label="Tags">
            {contact.tags?.length ? (
              contact.tags.map((tag) => <span key={tag}>{tag}</span>)
            ) : (
              <span>Keine Tags hinterlegt</span>
            )}
          </div>
        </article>

        <article className={styles.noticeCard} role="note">
          <p className={dashboardStyles.eyebrow}>Sicherer MVP-Modus</p>
          <strong>Keine automatische Sendefunktion.</strong>
          <span>Mensch prüft und sendet final selbst.</span>
        </article>
      </section>

      <section className={styles.detailGrid} aria-label="Fan-Kontext">
        <article className={dashboardStyles.moduleCard}>
          <div className={dashboardStyles.moduleHeader}>
            <div>
              <p className={dashboardStyles.eyebrow}>Summary / Notiz</p>
              <h2>Manuelle Zusammenfassung</h2>
            </div>
            <span>Echte Daten</span>
          </div>
          {contact.summary ? (
            <p className={styles.longText}>{contact.summary}</p>
          ) : (
            <EmptyState
              title="Noch keine Zusammenfassung hinterlegt."
              body="Für diesen Kontakt wurde noch keine manuelle Summary gespeichert."
            />
          )}
        </article>

        <PlaceholderCard
          eyebrow="Fan-Gedächtnis"
          title="Noch keine Memories"
          badge="Platzhalter"
          body="Es gibt noch keine Memory-Daten für diesen Fan. Eine Memory-Tabelle wird in diesem Schritt nicht angelegt."
        />

        <PlaceholderCard
          eyebrow="Nachrichten / Kontext"
          title="Noch kein Nachrichtenkontext"
          badge="Platzhalter"
          body="Es wurden keine echten Nachrichten importiert oder verknüpft. FanMind zeigt deshalb keine erfundenen Unterhaltungen an."
        />

        <article className={dashboardStyles.moduleCard}>
          <div className={dashboardStyles.moduleHeader}>
            <div>
              <p className={dashboardStyles.eyebrow}>Neue Nachricht</p>
              <h2>Entwurfsfeld</h2>
            </div>
            <span>Manuell</span>
          </div>
          <label className={styles.messageComposer} htmlFor="manual_message">
            <span>Nachricht vorbereiten</span>
            <textarea
              id="manual_message"
              name="manual_message"
              placeholder="Schreibe hier einen manuellen Nachrichtenentwurf. Es wird nichts automatisch gesendet."
            />
          </label>
          <p className={styles.fieldHint}>
            Dieses Textfeld speichert nichts, ruft keine KI auf und sendet keine Nachricht.
          </p>
        </article>

        <PlaceholderCard
          eyebrow="KI-Antwortvorschläge"
          title="Coming Soon / MVP-Vorschau"
          badge="Coming Soon"
          body="Antwortvorschläge sind nur als Produktbereich sichtbar. In diesem Schritt gibt es keine KI-Anbindung und keine automatische Generierung."
        />

        <PlaceholderCard
          eyebrow="Follow-up"
          title="Coming Soon / MVP-Vorschau"
          badge="Coming Soon"
          body="Follow-ups sind noch nicht gebaut. Es gibt keine Follow-up-Tabelle, keine Fälligkeiten und keine automatische Aktion."
        />
      </section>
    </>
  );
}

function PlaceholderCard({
  eyebrow,
  title,
  badge,
  body,
}: {
  eyebrow: string;
  title: string;
  badge: string;
  body: string;
}) {
  return (
    <article className={dashboardStyles.moduleCard}>
      <div className={dashboardStyles.moduleHeader}>
        <div>
          <p className={dashboardStyles.eyebrow}>{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <span>{badge}</span>
      </div>
      <EmptyState title={title} body={body} />
    </article>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className={dashboardStyles.emptyState}>
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

function FanNotFound() {
  return (
    <section className={dashboardStyles.moduleCard}>
      <div className={dashboardStyles.moduleHeader}>
        <div>
          <p className={dashboardStyles.eyebrow}>Kontakt</p>
          <h2>Fan nicht gefunden</h2>
        </div>
        <span>Empty State</span>
      </div>
      <EmptyState
        title="Fan nicht gefunden"
        body="Für diese ID wurde im aktuellen Workspace kein Kontakt gefunden."
      />
    </section>
  );
}

function formatSource(value: string | null): string {
  return sourceLabels[value ?? ""] ?? value ?? "Nicht hinterlegt";
}

function formatStatus(value: string | null): string {
  return statusLabels[value ?? ""] ?? value ?? "Nicht hinterlegt";
}

function formatLanguage(value: string | null): string {
  if (value === "de") {
    return "Deutsch";
  }

  if (value === "en") {
    return "Englisch";
  }

  if (value === "fr") {
    return "Französisch";
  }

  return value ?? "Nicht hinterlegt";
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Kein Datum hinterlegt";
  }

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getInitials(displayName: string): string {
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "FM";
}

function getUserDisplayName(
  metadata: Record<string, unknown> | undefined,
  fallback: string,
): string {
  const displayName = metadata?.display_name ?? metadata?.full_name;

  return typeof displayName === "string" && displayName.trim()
    ? displayName.trim()
    : fallback;
}

export default async function FanDetailPage({ params }: FanDetailPageProps) {
  const { id } = await params;
  const { data, error: userError } = await getSupabaseServerUser();

  if (!data.user) {
    redirect("/login");
  }

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  const workspace = workspaceResult.workspace;
  const contactsResult = workspace
    ? await getWorkspaceContacts(workspace.id)
    : null;
  const contactResult = workspace
    ? await getWorkspaceContact(workspace.id, id)
    : null;

  return (
    <main className={dashboardStyles.page}>
      {workspace ? (
        <FanDetailWorkspace
          workspace={workspace}
          userDisplayName={getUserDisplayName(
            data.user.user_metadata,
            workspace.name,
          )}
          contact={contactResult?.contact ?? null}
          contactCount={contactsResult?.contacts.length ?? 0}
          contactError={contactResult?.error?.message}
        />
      ) : (
        <section
          className={dashboardStyles.fallbackCard}
          aria-label="FanMind Workspace"
        >
          <div>
            <p className={dashboardStyles.eyebrow}>FanMind Fan-Detail</p>
            <h1>Workspace-Status</h1>
            <p>
              Fan-Details sind geschützt: Supabase Auth ist aktiv. Für deinen
              Account wurde noch kein Workspace gefunden.
            </p>
          </div>
          {userError ? (
            <p className={dashboardStyles.error}>
              <strong>
                Supabase-Session konnte nicht vollständig geprüft werden.
              </strong>
              <span>{userError.message}</span>
            </p>
          ) : null}
          {workspaceResult.error ? (
            <p className={dashboardStyles.error}>
              <strong>Workspace-Daten konnten nicht geladen werden.</strong>
              <span>{workspaceResult.error.message}</span>
            </p>
          ) : null}
          <form action={logout}>
            <button type="submit" className={dashboardStyles.secondaryButton}>
              Abmelden
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
