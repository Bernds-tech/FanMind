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
  | "aiUsage"
  | "referral"
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
        icon: "dashboard",
        active: activeRoute === "dashboard",
      },
      {
        label: wt(locale, "Fans"),
        href: "/fans",
        icon: "contacts",
        active: activeRoute === "fans",
      },
      {
        label: "Follow-ups",
        href: "/followups",
        icon: "followups",
        active: activeRoute === "followups",
        badge: dueFollowupCount > 0 ? String(dueFollowupCount) : undefined,
      },
      {
        label: wt(locale, "Onboarding"),
        href: "/onboarding",
        icon: "roadmap",
        active: activeRoute === "onboarding",
      },
      {
        label: wt(locale, "Kanäle"),
        href: "/channels",
        icon: "channels",
        active: activeRoute === "channels",
        badge: "Sync",
      },
    ],
    settingsNavigation: [
      {
        label: locale === "en" ? "Profile & account" : "Profil & Konto",
        href: "/settings/profile",
        icon: "profile",
        active: activeRoute === "settings",
      },
      {
        label: locale === "en" ? "AI usage" : "KI-Nutzung",
        href: "/settings/ai-usage",
        icon: "usage",
        active: activeRoute === "aiUsage",
      },
      {
        label: locale === "en" ? "Recommendations" : "Empfehlungen",
        href: "/settings/referral",
        icon: "referral",
        active: activeRoute === "referral",
      },
      ...(showAdminArea
        ? [
            {
              label: "Adminbereich",
              href: "/admin/billing",
              icon: "admin" as const,
              active: activeRoute === "admin",
            },
          ]
        : []),
    ],
    savedViews: [
      {
        label: wt(locale, "Top Fans"),
        href: "/top-fans",
        icon: "topFans",
        active: activeRoute === "top-fans",
      },
      {
        label: wt(locale, "Reaktivierung"),
        href: "/reactivation",
        icon: "reactivation",
        active: activeRoute === "reactivation",
      },
    ],
  };
}
