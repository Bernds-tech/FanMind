import { type WorkspaceNavLink } from "@/components/WorkspaceShell";
import type { FanMindLanguage } from "@/lib/fanmindCopy";
import { isPlatformAdminEmail } from "@/lib/admin";
import { wt } from "@/lib/workspaceCopy";

export type WorkspaceRouteKey =
  | "dashboard"
  | "fans"
  | "inbox"
  | "channels"
  | "reach"
  | "onboarding"
  | "settings"
  | "billing"
  | "top-fans"
  | "reactivation"
  | "followups"
  | "admin";

export function getWorkspaceNavigationForUser(
  activeRoute: WorkspaceRouteKey,
  email: string | null | undefined,
  locale: FanMindLanguage = "de",
  dueFollowupCount = 0,
) {
  return getWorkspaceNavigation(
    activeRoute,
    locale,
    dueFollowupCount,
    isPlatformAdminEmail(email),
  );
}

export function getWorkspaceNavigation(
  activeRoute: WorkspaceRouteKey,
  locale: FanMindLanguage = "de",
  dueFollowupCount = 0,
  showAdminArea = false,
): {
  mainNavigation: WorkspaceNavLink[];
  settingsNavigation: WorkspaceNavLink[];
  savedViews: WorkspaceNavLink[];
} {
  return {
    mainNavigation: [
      {
        label: wt(locale, "Dashboard"),
        href: "/dashboard",
        active: activeRoute === "dashboard",
      },
      { label: wt(locale, "Fans"), href: "/fans", active: activeRoute === "fans" },
      {
        label: "Follow-ups",
        href: "/followups",
        active: activeRoute === "followups",
        badge: dueFollowupCount > 0 ? String(dueFollowupCount) : undefined,
      },
      {
        label: wt(locale, "Onboarding"),
        href: "/onboarding",
        active: activeRoute === "onboarding",
      },
      {
        label: wt(locale, "Kanäle"),
        href: "/channels",
        active: activeRoute === "channels",
        badge: "Sync",
      },
    ],
    settingsNavigation: [
      {
        label: wt(locale, "Einstellungen"),
        href: "/settings",
        active: activeRoute === "settings",
      },
      {
        label: "Rechnungen",
        href: "/billing",
        active: activeRoute === "billing",
      },
      ...(showAdminArea
        ? [
            {
              label: "Adminbereich",
              href: "/admin/billing",
              active: activeRoute === "admin",
            },
          ]
        : []),
    ],
    savedViews: [
      {
        label: wt(locale, "Top Fans"),
        href: "/top-fans",
        active: activeRoute === "top-fans",
      },
      {
        label: wt(locale, "Reaktivierung"),
        href: "/reactivation",
        active: activeRoute === "reactivation",
      },
    ],
  };
}
