"use client";

import { useState, type ReactNode } from "react";
import styles from "../app/dashboard/dashboard.module.css";
import { FanMindLogo } from "./FanMindLogo";
import { WorkspaceHeader, type WorkspaceHeaderProps } from "./WorkspaceHeader";
import { WorkspaceKpiStrip } from "./WorkspaceKpiStrip";
import { wt } from "@/lib/workspaceCopy";
import type { FanMindLanguage } from "@/lib/fanmindCopy";

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
  locale?: FanMindLanguage;
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

function CollapsedNavIcon({ item }: { item: WorkspaceNavLink }) {
  const href = item.href.toLowerCase();
  const label = item.label.toLowerCase();

  if (href.includes("/dashboard") || label.includes("dashboard")) {
    return <svg viewBox="0 0 24 24"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h4A1.5 1.5 0 0 1 11 5.5v5A1.5 1.5 0 0 1 9.5 12h-4A1.5 1.5 0 0 1 4 10.5v-5Zm9 0A1.5 1.5 0 0 1 14.5 4h4A1.5 1.5 0 0 1 20 5.5v2A1.5 1.5 0 0 1 18.5 9h-4A1.5 1.5 0 0 1 13 7.5v-2ZM13 13.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5h-4a1.5 1.5 0 0 1-1.5-1.5v-5ZM4 16.5A1.5 1.5 0 0 1 5.5 15h4a1.5 1.5 0 0 1 1.5 1.5v2A1.5 1.5 0 0 1 9.5 20h-4A1.5 1.5 0 0 1 4 18.5v-2Z" /></svg>;
  }
  if (href.includes("/fans") || label.includes("fans")) {
    return <svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-7 8a7 7 0 0 1 14 0v.5A1.5 1.5 0 0 1 17.5 22h-11A1.5 1.5 0 0 1 5 20.5V20Zm14.2-8.5a3 3 0 1 0-2.9-4.9 6 6 0 0 1-.6 5.4 5.9 5.9 0 0 1 3.5 2.3 5.7 5.7 0 0 1 2.8 4.9 1.2 1.2 0 0 1-1.2 1.3h-.9V20a8.9 8.9 0 0 0-.7-3.5Z" /></svg>;
  }
  if (href.includes("/channels") || href.includes("/kanaele") || href.includes("/kanäle") || label.includes("kanäle") || label.includes("kanaele")) {
    return <svg viewBox="0 0 24 24"><path d="M7 6.5A3.5 3.5 0 1 1 10.2 11l3.6 2a3.5 3.5 0 1 1-.9 1.8L9.3 12.7a3.5 3.5 0 1 1 0-2.4l3.6-2.1a3.5 3.5 0 1 1 .9 1.8l-3.6 2.1A3.7 3.7 0 0 1 10.2 12l3.6 2.1.2-.3" /></svg>;
  }
  if (href.includes("/admin") || label.includes("adminbereich")) {
    return <svg viewBox="0 0 24 24"><path d="M12 2 4.5 5.2v5.9c0 4.7 3.2 9 7.5 10.4 4.3-1.4 7.5-5.7 7.5-10.4V5.2L12 2Zm0 3.2 4.5 1.9v4c0 3-1.8 5.9-4.5 7.2-2.7-1.3-4.5-4.2-4.5-7.2v-4L12 5.2Zm-1 4.3h2V16h-2V9.5Z" /></svg>;
  }
  if (href.includes("/settings") || href.includes("/einstellungen") || label.includes("einstellungen")) {
    return <svg viewBox="0 0 24 24"><path d="M19.4 13.5a7.8 7.8 0 0 0 .1-1.5 7.8 7.8 0 0 0-.1-1.5l2-1.5-2-3.5-2.4 1a7.7 7.7 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.5A7.7 7.7 0 0 0 7 6.5l-2.4-1-2 3.5 2 1.5a7.8 7.8 0 0 0-.1 1.5 7.8 7.8 0 0 0 .1 1.5l-2 1.5 2 3.5 2.4-1a7.7 7.7 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a7.7 7.7 0 0 0 2.6-1.5l2.4 1 2-3.5-2-1.5ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" /></svg>;
  }
  if (href.includes("/top-fans") || label.includes("top fans")) {
    return <svg viewBox="0 0 24 24"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" /></svg>;
  }
  if (href.includes("/reactivation") || label.includes("reaktivierung")) {
    return <svg viewBox="0 0 24 24"><path d="M12 5a7 7 0 0 1 6.3 4H16l3.5 3.5L23 9h-2.6A9 9 0 1 0 21 15h-2.1A7 7 0 1 1 12 5Zm1 3h-2v5l4 2.4 1-1.7-3-1.7V8Z" /></svg>;
  }

  return <svg viewBox="0 0 24 24"><path d="M5 5h14v14H5V5Zm3 3v8h8V8H8Z" /></svg>;
}

function CollapsedSidebarItem({
  label,
  active = false,
  badge,
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
      <span aria-hidden="true" className={styles.compactNavIcon}><CollapsedNavIcon item={{ label, active, badge, disabled, href }} /></span>
      {badge ? <small className={styles.compactNavBadge}>{badge}</small> : null}
    </a>
  );
}

export function WorkspaceShell({
  workspaceName,
  userLabel,
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
  locale = "de",
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
              <div className={styles.compactBrand} aria-label="FanMind" title="FanMind">
                <span className={styles.compactBrandFan}>F</span>
                <span className={styles.compactBrandMind}>M</span>
              </div>
              <button
                type="button"
                className={`${styles.sidebarToggle} ${styles.sidebarToggleCompact}`}
                onClick={toggleSidebar}
                aria-label={wt(locale, "Sidebar ausklappen")}
                title={wt(locale, "Sidebar ausklappen")}
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
            </div>
          </>
        ) : (
          <>
            <div className={styles.logoBlock}>
              <FanMindLogo subtitle="Multi-Channel CRM" />
            </div>
            <button
              type="button"
              className={styles.sidebarToggle}
              onClick={toggleSidebar}
              aria-label={wt(locale, "Sidebar einklappen")}
              title={wt(locale, "Sidebar einklappen")}
            >
              ←
            </button>

            <nav className={styles.navList} aria-label={wt(locale, "Hauptnavigation")}>
              <span className={styles.navSectionLabel}>{wt(locale, "Navigation")}</span>
              {visibleMainNavigation.map((item) => (
                <SidebarItem key={item.label} {...item} />
              ))}
            </nav>

            <nav className={styles.navList} aria-label="Workspace Navigation">
              <span className={styles.navSectionLabel}>{wt(locale, "Workspace")}</span>
              {visibleSettingsNavigation.map((item) => (
                <SidebarItem key={item.label} {...item} />
              ))}
            </nav>

            <section
              className={styles.savedViews}
              aria-label={wt(locale, "Gespeicherte Ansichten")}
            >
              <span>{wt(locale, "Gespeicherte Ansichten")}</span>
              {visibleSavedViews.map((item) => (
                <a key={item.label} href={item.href}>
                  {item.label}
                </a>
              ))}
            </section>

            <div className={styles.sidebarFooter}>
              <a
                className={styles.userMiniCard}
                aria-label={wt(locale, "Nutzerprofil öffnen")}
                href={profileHref}
              >
                <div className={styles.avatarMark}>{getInitials(userLabel)}</div>
                <div>
                  <span>{wt(locale, "Nutzerkarte")}</span>
                  <strong>{userLabel}</strong>
                  <p>{workspaceName}</p>
                </div>
              </a>
              <form action={logoutAction}>
                <button type="submit" className={styles.logoutButton}>
                  {wt(locale, "Abmelden")}
                </button>
              </form>
            </div>
          </>
        )}
      </aside>

      <div
        className={`${styles.dashboardContent} ${styles.dashboardContentStart}`}
      >
        <WorkspaceHeader {...header} locale={locale} />
        {showStats ? (
          <WorkspaceKpiStrip
            contactCount={contactCount}
            openFollowupCount={openFollowupCount}
            locale={locale}
          />
        ) : null}
        {children}
      </div>
    </div>
  );
}
