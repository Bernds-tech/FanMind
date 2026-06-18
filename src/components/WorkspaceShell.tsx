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

  return (
    <div className={`${styles.dashboardShell} ${sidebarCollapsed ? styles.dashboardShellCollapsed : ""}`}>
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : ""}`} aria-label="FanMind Navigation">
        <div className={styles.logoBlock}>
          <div className={styles.logoMark}>FM</div>
          {!sidebarCollapsed ? (
            <div>
              <strong>FanMind</strong>
              <small>Multi-Channel CRM</small>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className={styles.sidebarToggle}
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Sidebar ausklappen" : "Sidebar einklappen"}
          title={sidebarCollapsed ? "Sidebar ausklappen" : "Sidebar einklappen"}
        >
          {sidebarCollapsed ? "→" : "←"}
        </button>

        <nav className={styles.navList} aria-label="Hauptnavigation">
          {!sidebarCollapsed ? <span className={styles.navSectionLabel}>Navigation</span> : null}
          {visibleMainNavigation.map((item) => (
            <SidebarItem key={item.label} {...item} collapsed={sidebarCollapsed} />
          ))}
        </nav>

        <nav className={styles.navList} aria-label="Workspace Navigation">
          {!sidebarCollapsed ? <span className={styles.navSectionLabel}>Workspace</span> : null}
          {visibleSettingsNavigation.map((item) => (
            <SidebarItem key={item.label} {...item} collapsed={sidebarCollapsed} />
          ))}
        </nav>

        <section
          className={styles.savedViews}
          aria-label="Gespeicherte Ansichten"
          hidden={sidebarCollapsed}
        >
          <span>Gespeicherte Ansichten</span>
          {visibleSavedViews.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
        </section>

        <div className={styles.sidebarFooter} hidden={sidebarCollapsed}>
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
