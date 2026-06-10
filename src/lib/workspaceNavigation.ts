import { type WorkspaceNavLink } from "@/components/WorkspaceShell";

export type WorkspaceRouteKey =
  | "dashboard"
  | "fans"
  | "channels"
  | "onboarding"
  | "settings"
  | "top-fans"
  | "reactivation";

export function getWorkspaceNavigation(activeRoute: WorkspaceRouteKey): {
  mainNavigation: WorkspaceNavLink[];
  settingsNavigation: WorkspaceNavLink[];
  savedViews: WorkspaceNavLink[];
} {
  return {
    mainNavigation: [
      {
        label: "Dashboard",
        href: "/dashboard",
        active: activeRoute === "dashboard",
      },
      { label: "Fans", href: "/fans", active: activeRoute === "fans" },
      {
        label: "Onboarding",
        href: "/onboarding",
        active: activeRoute === "onboarding",
      },
      {
        label: "Kanäle",
        href: "/channels",
        active: activeRoute === "channels",
        badge: "Roadmap",
      },
    ],
    settingsNavigation: [
      {
        label: "Einstellungen",
        href: "/settings",
        active: activeRoute === "settings",
      },
    ],
    savedViews: [
      {
        label: "Top Fans",
        href: "/top-fans",
        active: activeRoute === "top-fans",
      },
      {
        label: "Reaktivierung",
        href: "/reactivation",
        active: activeRoute === "reactivation",
      },
    ],
  };
}
