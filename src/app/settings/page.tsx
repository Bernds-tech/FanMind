import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isWorkspaceBillingSuspended } from "@/lib/billing";
import { getPreActivationRedirect } from "@/lib/preActivation";
import { isPlatformAdminEmail } from "@/lib/admin";
import {
  getOpenFollowupCount,
  getSupabaseServerUser,
  updateSupabaseServerUserMetadata,
  getUserWorkspaceDashboard,
  getWorkspaceContacts,
  signOutSupabaseServerSession,
  type WorkspaceDashboardRow,
} from "@/lib/supabase/server";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { UserPreferenceFallback } from "@/components/UserPreferenceFallback";
import { getCommercialOptionLabel } from "@/lib/dashboardFeatures";
import { getWorkspaceNavigation } from "@/lib/workspaceNavigation";
import { FANMIND_LOCALE_COOKIE, localeCookieOptions, resolveWorkspaceLocale } from "@/lib/workspaceLocale";
import { wt } from "@/lib/workspaceCopy";
import {
  FANMIND_BRIGHTNESS_COOKIE,
  getPreferenceMetadata,
  getUserMetadataBrightness,
  normalizeFanMindBrightness,
  preferenceCookieOptions,
  type FanMindBrightness,
} from "@/lib/userPreferences";
import type { FanMindLanguage } from "@/lib/fanmindCopy";
import { getWorkspaceReferralSummary, type WorkspaceReferralSummary } from "@/lib/referrals";
import { getWorkspaceKpiStatsFromContacts } from "@/lib/workspaceKpiStats";
import dashboardStyles from "../dashboard/dashboard.module.css";
import { ReferralCopyButton } from "./ReferralCopyButton";

type SettingsWorkspaceProps = {
  workspace: WorkspaceDashboardRow;
  userDisplayName: string;
  contactCount: number;
  openFollowupCount: number;
  showAdminArea: boolean;
  referralSummary: WorkspaceReferralSummary | null;
  locale: FanMindLanguage;
  brightness: FanMindBrightness;
  preferencesError?: string | null;
};


async function saveAppearancePreferences(formData: FormData) {
  "use server";

  const { data } = await getSupabaseServerUser();
  if (!data.user) redirect("/login");

  const locale = formData.get("locale") === "en" ? "en" : "de";
  const brightness = normalizeFanMindBrightness(formData.get("brightness"));
  const cookieStore = await cookies();

  cookieStore.set(FANMIND_LOCALE_COOKIE, locale, localeCookieOptions());
  cookieStore.set(FANMIND_BRIGHTNESS_COOKIE, brightness, preferenceCookieOptions());

  const metadata = getPreferenceMetadata({
    currentMetadata: data.user.user_metadata,
    locale,
    brightness,
  });
  const result = await updateSupabaseServerUserMetadata(metadata);

  const search = result.error ? `?preferences_error=${encodeURIComponent(result.error.message)}` : "?preferences_saved=1";
  redirect(`/settings${search}`);
}

async function logout() {
  "use server";

  await signOutSupabaseServerSession();
  redirect("/");
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

function SettingsWorkspace({
  workspace,
  userDisplayName,
  contactCount,
  openFollowupCount,
  showAdminArea,
  referralSummary,
  locale,
  brightness,
  preferencesError,
}: SettingsWorkspaceProps) {
  const { mainNavigation, settingsNavigation, savedViews } =
    getWorkspaceNavigation("settings", locale, 0, showAdminArea);
  const userLabel = userDisplayName || workspace.name || "Nutzer";
  const planLabel = workspace.plan_id === "pilot" ? "Pilot / Setup" : workspace.plan_id === "starter" ? "Starter" : workspace.plan_id === "growth" ? "Growth" : "Agency";

  return (
    <>
    <UserPreferenceFallback locale={locale} brightness={brightness} />
    <WorkspaceShell
      workspaceName={workspace.name}
      userLabel={userLabel}
      planLabel={planLabel}
      planMeta={getCommercialOptionLabel(workspace.commercial_option)}
      planStatus={workspace.plan_id === "starter" ? wt(locale, "Aktiv") : workspace.plan_id === "pilot" ? "Demo" : wt(locale, "Vorschau")}
      mainNavigation={mainNavigation}
      settingsNavigation={settingsNavigation}
      savedViews={savedViews}
      header={{
        title: wt(locale, "Einstellungen"),
        subtitle: wt(locale, "Willkommen zurück, Pilot Test 👋"),
        searchPlaceholder: wt(locale, "Suche nach Workspace, Profil, Paket ..."),
        primaryActionLabel: wt(locale, "Einstellungen speichern"),
        primaryActionHref: "#workspace-settings",
      }}
      contactCount={contactCount}
      openFollowupCount={openFollowupCount}
      logoutAction={logout}
      locale={locale}
    >

      <section
        className={dashboardStyles.moduleCard}
        id="appearance-language"
        aria-labelledby="appearance-language-title"
      >
        <div className={dashboardStyles.moduleHeader}>
          <div>
            <p className={dashboardStyles.eyebrow}>{wt(locale, "Nutzerpräferenzen")}</p>
            <h2 id="appearance-language-title">{wt(locale, "Darstellung & Sprache")}</h2>
          </div>
          <span>{wt(locale, "Gespeichert pro Nutzer")}</span>
        </div>
        <p className={dashboardStyles.moduleText}>
          {wt(locale, "Wähle die Workspace-Sprache und eine dezente Helligkeit. Die Auswahl wird in deinem Nutzerprofil und als Cookie-Fallback gespeichert.")}
        </p>
        {preferencesError ? <p className={dashboardStyles.error}>{preferencesError}</p> : null}
        <form action={saveAppearancePreferences} className={dashboardStyles.preferenceForm}>
          <fieldset className={dashboardStyles.preferenceGroup}>
            <legend>{wt(locale, "Sprache")}</legend>
            {[
              { value: "de", label: "Deutsch" },
              { value: "en", label: "English" },
            ].map((option) => (
              <label key={option.value} className={dashboardStyles.preferenceOption}>
                <input type="radio" name="locale" value={option.value} defaultChecked={locale === option.value} />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
          <fieldset className={dashboardStyles.preferenceGroup}>
            <legend>{wt(locale, "Helligkeit")}</legend>
            {[
              { value: "standard", label: wt(locale, "Standard") },
              { value: "brighter", label: wt(locale, "Heller") },
              { value: "light", label: wt(locale, "Hell") },
            ].map((option) => (
              <label key={option.value} className={dashboardStyles.preferenceOption}>
                <input type="radio" name="brightness" value={option.value} defaultChecked={brightness === option.value} />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
          <button type="submit" className={dashboardStyles.primaryButton}>{wt(locale, "Einstellungen speichern")}</button>
        </form>
      </section>

      <section
        className={`${dashboardStyles.moduleCard} ${dashboardStyles.referralPanel}`}
        id="referral-growth-window"
        aria-labelledby="referral-growth-window-title"
      >
        <div className={dashboardStyles.referralHeader}>
          <div>
            <p className={dashboardStyles.eyebrow}>Referral Growth Window</p>
            <h2 id="referral-growth-window-title">Referral-Link &amp; Status</h2>
            <p>Link teilen, Attribution erfassen, Billing-Verrechnung bleibt geprüft und manuell.</p>
          </div>
          <span className={dashboardStyles.referralBadge}>{referralSummary?.state?.status ?? "Vorbereitet"}</span>
        </div>
        {referralSummary?.error ? <p className={dashboardStyles.error}>{referralSummary.error}</p> : null}
        <div className={dashboardStyles.referralGrid}>
          <article className={`${dashboardStyles.referralCard} ${dashboardStyles.referralPrimaryCard}`}>
            <span>Referral-Code</span>
            <strong>{referralSummary?.member?.referral_code ?? "Noch nicht verfügbar"}</strong>
            <div className={dashboardStyles.referralMetaRow}>
              <span className={dashboardStyles.referralBadge}>{referralSummary?.member?.status ?? "wird vorbereitet"}</span>
              <ReferralCopyButton value={referralSummary?.member?.referral_code} label="Code kopieren" />
            </div>
          </article>
          <article className={`${dashboardStyles.referralCard} ${dashboardStyles.referralLinkCard}`}>
            <span>Persönlicher Link</span>
            <strong>{referralSummary?.referralUrl ?? "Migration/Service Role prüfen"}</strong>
            <div className={dashboardStyles.referralMetaRow}>
              <small>Füllt den Code bei der Registrierung vor.</small>
              <ReferralCopyButton value={referralSummary?.referralUrl} label="Link kopieren" />
            </div>
          </article>
          <article className={dashboardStyles.referralCard}>
            <span>Aktive Referrals</span>
            <strong>{referralSummary?.activeReferralCount ?? 0} / 20</strong>
            <small>{referralSummary?.discountPercent ?? 0} % Rabatt vorbereitet · nicht automatisch verrechnet.</small>
          </article>
          <article className={dashboardStyles.referralCard}>
            <span>Growth-Window-Cap</span>
            <strong>{referralSummary?.state?.active_paid_workspace_count ?? 0} / {referralSummary?.state?.active_paid_workspace_cap ?? 2000}</strong>
            <small>Neue rabattwirksame Referrals nur solange das Window offen ist.</small>
          </article>
        </div>
      </section>

      <section
        className={dashboardStyles.moduleCard}
        id="workspace-settings"
        aria-labelledby="workspace-settings-title"
      >
        <div className={dashboardStyles.moduleHeader}>
          <div>
            <p className={dashboardStyles.eyebrow}>MVP-Vorschau</p>
            <h2 id="workspace-settings-title">Workspace-Einstellungen</h2>
          </div>
          <span>MVP-Vorschau</span>
        </div>
        <p className={dashboardStyles.moduleText}>
          Einstellungen für Workspace, Nutzerprofil und Paketlogik werden hier
          vorbereitet. Im aktuellen MVP werden noch keine komplexen
          Rollen/Rechte oder Zahlungsfunktionen gebaut.
        </p>
        <div className={dashboardStyles.emptyState}>
          <strong>Noch keine bearbeitbaren Einstellungen aktiv.</strong>
          <p>
            Diese Seite hält den geschützten Workspace-Rahmen bereit, ohne echte
            Rollenverwaltung, Zahlungslogik oder Datenbankänderungen
            einzuführen.
          </p>
        </div>
      </section>
    </WorkspaceShell>
    </>
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ preferences_error?: string }>;
}) {
  const { data, error: userError } = await getSupabaseServerUser();

  if (!data.user) {
    redirect("/login");
  }

  const locale = await resolveWorkspaceLocale({ user: data.user });
  const cookieStore = await cookies();
  const brightness = getUserMetadataBrightness(data.user) ?? normalizeFanMindBrightness(cookieStore.get(FANMIND_BRIGHTNESS_COOKIE)?.value);
  const resolvedSearchParams = await searchParams;
  const preferencesError = resolvedSearchParams?.preferences_error ?? null;

  const workspaceResult = await getUserWorkspaceDashboard(data.user);
  if (workspaceResult.error?.message === "TEMPORARY_DEMO_DELETED") {
    redirect("/login?demo_deleted=1");
  }

  const workspace = workspaceResult.workspace;
  const preActivationRedirect = getPreActivationRedirect(workspace, data.user.email);
  if (preActivationRedirect) redirect(preActivationRedirect);
  if (isWorkspaceBillingSuspended(workspace)) redirect("/billing/suspended");
  const contactsResult = workspace
    ? await getWorkspaceContacts(workspace.id)
    : null;
  const openFollowupCountResult = workspace
    ? await getOpenFollowupCount(workspace.id)
    : null;
  const referralSummary = workspace
    ? await getWorkspaceReferralSummary(workspace.id, data.user.id)
    : null;

  return (
    <main className={dashboardStyles.page}>
      {workspace ? (
        <SettingsWorkspace
          workspace={workspace}
          userDisplayName={getUserDisplayName(
            data.user.user_metadata,
            workspace.name,
          )}
          contactCount={getWorkspaceKpiStatsFromContacts(contactsResult?.contacts ?? []).totalFans}
          openFollowupCount={openFollowupCountResult?.count ?? 0}
          showAdminArea={isPlatformAdminEmail(data.user.email)}
          referralSummary={referralSummary}
          locale={locale}
          brightness={brightness}
          preferencesError={preferencesError}
        />
      ) : (
        <section
          className={dashboardStyles.fallbackCard}
          aria-label="FanMind Einstellungen"
        >
          <div>
            <p className={dashboardStyles.eyebrow}>FanMind Einstellungen</p>
            <h1>Workspace-Status</h1>
            <p>
              Einstellungen ist geschützt: Supabase Auth ist aktiv. Für deinen
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
