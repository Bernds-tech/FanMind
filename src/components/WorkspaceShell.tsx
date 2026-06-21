"use client";

import { useState, type ReactNode } from "react";
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
  showStats?: boolean;
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

function isHiddenProductNavigationItem(item: WorkspaceNavLink): boolean {
  const normalizedLabel = item.label.toLowerCase();
  const normalizedHref = item.href.toLowerCase();

  return (
    normalizedLabel.includes("onboarding") ||
    normalizedHref.includes("/onboarding") ||
    normalizedLabel.includes("admin") ||
    normalizedHref.includes("/admin") ||
    normalizedLabel.includes("agent") ||
    normalizedHref.includes("/agent")
  );
}

function SidebarItem({
  label,
  active = false,
  badge,
  disabled = false,
  href,
  collapsed = false,
}: WorkspaceNavLink & { collapsed?: boolean }) {
  const shortLabel = label
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <a
      aria-disabled={disabled || undefined}
      className={active ? styles.navItemActive : styles.navItem}
      href={href}
      title={label}
      tabIndex={disabled ? -1 : undefined}
    >
      <span aria-hidden={collapsed ? "true" : undefined} className={collapsed ? styles.navIconLabel : undefined}>
        {collapsed ? shortLabel : label}
      </span>
      {badge && !collapsed ? <small>{badge}</small> : null}
    </a>
  );
}

function getCollapsedNavToken(item: WorkspaceNavLink): string {
  const href = item.href.toLowerCase();
  const label = item.label.toLowerCase();

  if (href.includes("/dashboard") || label.includes("dashboard")) return "D";
  if (href.includes("/fans") || label.includes("fans")) return "F";
  if (href.includes("/inbox") || label.includes("inbox")) return "I";
  if (href.includes("/channels") || label.includes("kanäle") || label.includes("kanaele")) return "K";
  if (href.includes("/settings") || label.includes("einstellungen")) return "E";
  if (href.includes("/top-fans") || label.includes("top fans")) return "T";
  if (href.includes("/reactivation") || label.includes("reaktivierung")) return "R";

  return (
    item.label
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "FM"
  );
}

function CollapsedSidebarItem({
  label,
  active = false,
  disabled = false,
  href,
}: WorkspaceNavLink) {
  return (
    <a
      aria-disabled={disabled || undefined}
      aria-label={label}
      className={active ? styles.compactNavItemActive : styles.compactNavItem}
      href={href}
      title={label}
      tabIndex={disabled ? -1 : undefined}
    >
      <span aria-hidden="true">{getCollapsedNavToken({ label, active, disabled, href })}</span>
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
  showStats = true,
  logoutAction,
  profileHref = "/settings/profile",
  children,
}: WorkspaceShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    typeof window === "undefined"
      ? false
      : localStorage.getItem("fanmind_sidebar_collapsed") === "true",
  );

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const next = !current;
      localStorage.setItem("fanmind_sidebar_collapsed", String(next));
      return next;
    });
  }

  const visibleMainNavigation = mainNavigation.filter(
    (item) => !isHiddenProductNavigationItem(item),
  );
  const visibleSettingsNavigation = settingsNavigation.filter(
    (item) => !isHiddenProductNavigationItem(item),
  );
  const visibleSavedViews = savedViews.filter(
    (item) => !isHiddenProductNavigationItem(item),
  );
  const compactNavigation = [...visibleMainNavigation, ...visibleSettingsNavigation, ...visibleSavedViews];

  return (
    <div className={`${styles.dashboardShell} ${sidebarCollapsed ? styles.dashboardShellCollapsed : ""}`}>
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : ""}`} aria-label="FanMind Navigation">
        {sidebarCollapsed ? (
          <>
            <div className={styles.sidebarRailTop}>
              <div className={styles.logoMark} aria-label="FanMind" title="FanMind">
                <span className={styles.logoMarkFan} aria-hidden="true">F</span>
                <span className={styles.logoMarkMind} aria-hidden="true">M</span>
              </div>
              <button
                type="button"
                className={`${styles.sidebarToggle} ${styles.sidebarToggleCompact}`}
                onClick={toggleSidebar}
                aria-label="Sidebar ausklappen"
                title="Sidebar ausklappen"
              >
                →
              </button>
            </div>

            <nav className={styles.compactNavList} aria-label="Workspace Navigation kompakt">
              {compactNavigation.map((item) => (
                <CollapsedSidebarItem key={item.label} {...item} />
              ))}
            </nav>

            <div className={styles.compactSidebarFooter}>
              <a
                className={styles.compactCircleAction}
                aria-label={`Profil von ${userLabel} öffnen`}
                href={profileHref}
                title={`${userLabel} (${workspaceName})`}
              >
                <span aria-hidden="true">{getInitials(userLabel)}</span>
              </a>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className={styles.compactCircleAction}
                  aria-label="Abmelden"
                  title="Abmelden"
                >
                  <span aria-hidden="true">AB</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <>
            <div className={styles.logoBlock}>
              <div className={styles.logoWordmark} aria-label="FanMind">
                <span className={styles.logoWordFan}>Fan</span>
                <span className={styles.logoWordMind}>Mind</span>
              </div>
              <small>Multi-Channel CRM</small>
            </div>
            <button
              type="button"
              className={styles.sidebarToggle}
              onClick={toggleSidebar}
              aria-label="Sidebar einklappen"
              title="Sidebar einklappen"
            >
              ←
            </button>

            <nav className={styles.navList} aria-label="Hauptnavigation">
              <span className={styles.navSectionLabel}>Navigation</span>
              {visibleMainNavigation.map((item) => (
                <SidebarItem key={item.label} {...item} />
              ))}
            </nav>

            <nav className={styles.navList} aria-label="Workspace Navigation">
              <span className={styles.navSectionLabel}>Workspace</span>
              {visibleSettingsNavigation.map((item) => (
                <SidebarItem key={item.label} {...item} />
              ))}
            </nav>

            <section
              className={styles.savedViews}
              aria-label="Gespeicherte Ansichten"
            >
              <span>Gespeicherte Ansichten</span>
              {visibleSavedViews.map((item) => (
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
                  <span>Nutzerkarte</span>
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
          </>
        )}
      </aside>

      <div
        className={`${styles.dashboardContent} ${styles.dashboardContentStart}`}
      >
        <WorkspaceHeader {...header} />
        {showStats ? (
          <WorkspaceKpiStrip
            contactCount={contactCount}
            openFollowupCount={openFollowupCount}
          />
        ) : null}
        {children}
      </div>
    </div>
  );
}
