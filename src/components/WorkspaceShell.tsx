import { type ReactNode } from "react";
import styles from "../app/dashboard/dashboard.module.css";
import { WorkspaceHeader, type WorkspaceHeaderProps } from "./WorkspaceHeader";
import { WorkspaceKpiStrip } from "./WorkspaceKpiStrip";

export type WorkspaceNavLink = {
  label: string;
  href: string;
  active?: boolean;
  badge?: string;
  disabled?: boolean;
};

type WorkspaceShellProps = {
  workspaceName: string;
  userLabel: string;
  planLabel: string;
  planMeta: string;
  planStatus: string;
  mainNavigation: WorkspaceNavLink[];
  settingsNavigation: WorkspaceNavLink[];
  savedViews: WorkspaceNavLink[];
  header: WorkspaceHeaderProps;
  contactCount: number;
  openFollowupCount?: number;
  logoutAction: () => Promise<void>;
  profileHref?: string;
  children: ReactNode;
};

function getInitials(nameOrEmail?: string): string {
  const fallback = "FM";

  if (!nameOrEmail) {
    return fallback;
  }

  const parts = nameOrEmail
    .replace(/@.*/, "")
    .split(/[.\s_-]+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return fallback;
  }

  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || fallback
  );
}

function SidebarItem({
  label,
  active = false,
  badge,
  disabled = false,
  href,
}: WorkspaceNavLink) {
  return (
    <a
      aria-disabled={disabled || undefined}
      className={active ? styles.navItemActive : styles.navItem}
      href={href}
      tabIndex={disabled ? -1 : undefined}
    >
      <span>{label}</span>
      {badge ? <small>{badge}</small> : null}
    </a>
  );
}

export function WorkspaceShell({
  workspaceName,
  userLabel,
  planLabel,
  planMeta,
  planStatus,
  mainNavigation,
  settingsNavigation,
  savedViews,
  header,
  contactCount,
  openFollowupCount = 0,
  logoutAction,
  profileHref = "/settings/profile",
  children,
}: WorkspaceShellProps) {
  return (
    <div className={styles.dashboardShell}>
      <aside className={styles.sidebar} aria-label="FanMind Navigation">
        <div className={styles.logoBlock}>
          <div className={styles.logoMark}>FM</div>
          <div>
            <strong>FanMind</strong>
            <small>Multi-Channel CRM</small>
          </div>
        </div>

        <nav className={styles.navList} aria-label="Hauptnavigation">
          <span className={styles.navSectionLabel}>Navigation</span>
          {mainNavigation.map((item) => (
            <SidebarItem key={item.label} {...item} />
          ))}
        </nav>

        <nav className={styles.navList} aria-label="Workspace Navigation">
          <span className={styles.navSectionLabel}>Workspace</span>
          {settingsNavigation.map((item) => (
            <SidebarItem key={item.label} {...item} />
          ))}
        </nav>

        <section
          className={styles.savedViews}
          aria-label="Gespeicherte Ansichten"
        >
          <span>Gespeicherte Ansichten</span>
          {savedViews.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
        </section>

        <div className={styles.sidebarFooter}>
          <a
            className={styles.userMiniCard}
            aria-label="Nutzerprofil öffnen"
            href={profileHref}
          >
            <div className={styles.avatarMark}>{getInitials(userLabel)}</div>
            <div>
              <span>Nutzer</span>
              <strong>{userLabel}</strong>
              <p>{workspaceName}</p>
            </div>
          </a>
          <section className={styles.planMiniCard} aria-label="Paket">
            <div>
              <span>Paket</span>
              <strong>{planLabel}</strong>
              <p>{planMeta}</p>
            </div>
            <small>{planStatus}</small>
          </section>
          <form action={logoutAction}>
            <button type="submit" className={styles.logoutButton}>
              Abmelden
            </button>
          </form>
        </div>
      </aside>

      <div
        className={`${styles.dashboardContent} ${styles.dashboardContentStart}`}
      >
        <WorkspaceHeader {...header} />
        <WorkspaceKpiStrip
          contactCount={contactCount}
          openFollowupCount={openFollowupCount}
        />
        {children}
      </div>
    </div>
  );
}
