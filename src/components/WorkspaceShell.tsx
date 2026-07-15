"use client";

import { useState, type ReactNode } from "react";
import styles from "../app/dashboard/dashboard.module.css";
import { FanMindLogo } from "./FanMindLogo";
import {
  FanMindFunctionIcon,
  resolveFanMindFunctionIcon,
  type FanMindFunctionIconKey,
} from "./FanMindFunctionIcon";
import { WorkspaceHeader, type WorkspaceHeaderProps } from "./WorkspaceHeader";
import { WorkspaceKpiStrip } from "./WorkspaceKpiStrip";
import { wt } from "@/lib/workspaceCopy";
import type { FanMindLanguage } from "@/lib/fanmindCopy";

export type WorkspaceNavLink = {
  label: string;
  href: string;
  icon?: FanMindFunctionIconKey;
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
  icon,
  active = false,
  badge,
  disabled = false,
  href,
}: WorkspaceNavLink) {
  const iconName = icon ?? resolveFanMindFunctionIcon(href, label);

  return (
    <a
      aria-disabled={disabled || undefined}
      className={active ? styles.navItemActive : styles.navItem}
      href={href}
      title={label}
      tabIndex={disabled ? -1 : undefined}
    >
      <span className={styles.navItemLead}>
        <FanMindFunctionIcon name={iconName} />
        <span>{label}</span>
      </span>
      {badge ? <small>{badge}</small> : null}
    </a>
  );
}

function CollapsedSidebarItem({
  label,
  icon,
  active = false,
  badge,
  disabled = false,
  href,
}: WorkspaceNavLink) {
  const iconName = icon ?? resolveFanMindFunctionIcon(href, label);

  return (
    <a
      aria-disabled={disabled || undefined}
      aria-label={label}
      className={active ? styles.compactNavItemActive : styles.compactNavItem}
      href={href}
      title={label}
      tabIndex={disabled ? -1 : undefined}
    >
      <span aria-hidden="true" className={styles.compactNavIcon}>
        <FanMindFunctionIcon name={iconName} size={21} />
      </span>
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

            <div className={styles.sidebarScrollArea}>
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
                    <span className={styles.savedViewLead}>
                      <FanMindFunctionIcon
                        name={item.icon ?? resolveFanMindFunctionIcon(item.href, item.label)}
                      />
                      <span>{item.label}</span>
                    </span>
                  </a>
                ))}
              </section>
            </div>

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
        <div className={styles.dashboardScrollArea}>
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
    </div>
  );
}
