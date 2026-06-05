import type { ReactNode } from "react";

type IconName =
  | "home"
  | "user"
  | "target"
  | "clock"
  | "megaphone"
  | "chart"
  | "gear"
  | "star"
  | "refresh"
  | "activity"
  | "crown"
  | "spark"
  | "calendar"
  | "team"
  | "plus";

type NavItem = {
  label: string;
  href: string;
  icon: IconName;
  active?: boolean;
  badge?: string;
};

const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "home" },
  { label: "Kontakte", href: "/fans", icon: "user", active: true },
  { label: "Segmente", href: "/fans", icon: "target" },
  { label: "Follow-ups", href: "/followups", icon: "clock", badge: "128" },
  { label: "Kampagnen", href: "/copilot", icon: "megaphone" },
  { label: "Auswertungen", href: "/dashboard", icon: "chart" },
  { label: "Einstellungen", href: "/pricing", icon: "gear" }
];

const savedViewItems: NavItem[] = [
  { label: "Top Fans", href: "/fans", icon: "star" },
  { label: "Reaktivierung", href: "/fans", icon: "refresh" },
  { label: "Event-Interessenten", href: "/fans", icon: "activity" },
  { label: "Premium-Käufer", href: "/fans", icon: "crown" },
  { label: "Neue Kontakte", href: "/fans", icon: "spark" },
  { label: "Heute fällige Follow-ups", href: "/fans", icon: "calendar" },
  { label: "Meine Kontakte", href: "/fans", icon: "user" },
  { label: "Team Arena", href: "/fans", icon: "team" },
  { label: "Ansicht speichern", href: "/fans", icon: "plus" }
];

function AppIcon({ name }: { name: IconName }) {
  const commonProps = {
    "aria-hidden": true,
    className: "app-icon",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24"
  };

  const paths: Record<IconName, ReactNode> = {
    home: <path d="m3.5 11 8.5-7 8.5 7v8a1.5 1.5 0 0 1-1.5 1.5h-4.2v-5.8H9.7v5.8H5A1.5 1.5 0 0 1 3.5 19z" />,
    user: <><path d="M12 12.2a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /><path d="M4.5 20.2c1.2-3.8 4-5.7 7.5-5.7s6.3 1.9 7.5 5.7" /></>,
    target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.3" /><path d="M12 2.5v3M21.5 12h-3M12 21.5v-3M2.5 12h3" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.2v5.2l3.4 2" /></>,
    megaphone: <><path d="M5 14.2H3.8A1.8 1.8 0 0 1 2 12.4v-1.8a1.8 1.8 0 0 1 1.8-1.8H5l10-4.2v13.8z" /><path d="M8 14.2 9.8 20H7.3L5 14.2M18 9.2a3.2 3.2 0 0 1 0 4.6" /></>,
    chart: <><path d="M4 19.5h17" /><path d="M7 16V9M12 16V5M17 16v-7" /></>,
    gear: <><circle cx="12" cy="12" r="3" /><path d="M19 13.5a7.5 7.5 0 0 0 .1-3l2-1.5-2-3.5-2.4 1a7.5 7.5 0 0 0-2.6-1.5L13.7 2h-4l-.4 3a7.5 7.5 0 0 0-2.6 1.5l-2.4-1-2 3.5 2 1.5a7.5 7.5 0 0 0 .1 3l-2 1.5 2 3.5 2.4-1a7.5 7.5 0 0 0 2.6 1.5l.4 3h4l.4-3a7.5 7.5 0 0 0 2.6-1.5l2.4 1 2-3.5z" /></>,
    star: <path d="m12 3.2 2.6 5.2 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />,
    refresh: <><path d="M19 7.8A7.5 7.5 0 0 0 5.2 7" /><path d="M19 3.8v4h-4M5 16.2A7.5 7.5 0 0 0 18.8 17" /><path d="M5 20.2v-4h4" /></>,
    activity: <path d="M3 12h4l2-6 4 12 2-6h6" />,
    crown: <path d="M3.5 8.2 8 12l4-6 4 6 4.5-3.8-1.6 11.3H5.1z" />,
    spark: <><path d="M12 3.5 13.7 9 19 11l-5.3 2L12 18.5 10.3 13 5 11l5.3-2z" /><path d="M19.5 3.5v4M17.5 5.5h4" /></>,
    calendar: <><path d="M5.5 4.5h13A1.5 1.5 0 0 1 20 6v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19V6a1.5 1.5 0 0 1 1.5-1.5Z" /><path d="M8 2.5v4M16 2.5v4M4 9h16" /></>,
    team: <><path d="M9.5 11a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM3.5 19c.9-3.4 3-5.1 6-5.1s5.1 1.7 6 5.1" /><path d="M16.4 11.3a2.8 2.8 0 0 0 0-5.3M16.8 14.2c2 .4 3.4 1.8 4.2 4.3" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>
  };

  return <svg {...commonProps}>{paths[name]}</svg>;
}

function SidebarLink({ item }: { item: NavItem }) {
  return (
    <a className={item.active ? "active" : ""} href={item.href}>
      <span className="sidebar-link-main"><AppIcon name={item.icon} />{item.label}</span>
      {item.badge && <span className="sidebar-badge">{item.badge}</span>}
    </a>
  );
}

export function AppSidebar() {
  return (
    <aside className="workspace-sidebar" aria-label="Arbeitsbereich Navigation">
      <a className="sidebar-brand" href="/">
        <span className="brand-mark">FM</span>
        <span>
          <strong>FanMind</strong>
          <small>Agentur-Konsole</small>
        </span>
      </a>

      <nav className="sidebar-nav" aria-label="Hauptbereiche">
        {mainNavItems.map((item) => <SidebarLink item={item} key={item.label} />)}
      </nav>

      <div className="saved-views" aria-label="Gespeicherte Ansichten">
        <span className="sidebar-section-title">Gespeicherte Ansichten</span>
        {savedViewItems.map((item) => <SidebarLink item={item} key={item.label} />)}
      </div>

      <div className="sidebar-team-card" aria-label="Aktueller Arbeitsbereich">
        <span className="team-avatar">ND</span>
        <span>
          <strong>Nina D.</strong>
          <small>Team Arena</small>
        </span>
      </div>
    </aside>
  );
}
