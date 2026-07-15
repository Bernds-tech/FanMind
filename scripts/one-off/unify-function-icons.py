#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, text: str) -> None:
    (ROOT / path).write_text(text, encoding="utf-8")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


# ---------------------------------------------------------------------------
# Workspace shell: one shared semantic icon registry in expanded and compact UI.
# ---------------------------------------------------------------------------
path = "src/components/WorkspaceShell.tsx"
text = read(path)

if 'from "./FanMindFunctionIcon"' not in text:
    text = replace_once(
        text,
        'import { FanMindLogo } from "./FanMindLogo";\n',
        'import { FanMindLogo } from "./FanMindLogo";\nimport {\n  FanMindFunctionIcon,\n  resolveFanMindFunctionIcon,\n  type FanMindFunctionIconKey,\n} from "./FanMindFunctionIcon";\n',
        "WorkspaceShell icon import",
    )

if "  icon?: FanMindFunctionIconKey;\n" not in text:
    text = replace_once(
        text,
        "  href: string;\n",
        "  href: string;\n  icon?: FanMindFunctionIconKey;\n",
        "WorkspaceNavLink icon type",
    )

sidebar_start = text.index("function SidebarItem({")
sidebar_end = text.index("\nfunction CollapsedNavIcon", sidebar_start)
sidebar_function = '''function SidebarItem({
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
'''
text = text[:sidebar_start] + sidebar_function + text[sidebar_end:]

collapsed_icon_start = text.index("function CollapsedNavIcon")
collapsed_icon_end = text.index("\nfunction CollapsedSidebarItem", collapsed_icon_start)
text = text[:collapsed_icon_start] + text[collapsed_icon_end + 1 :]

collapsed_start = text.index("function CollapsedSidebarItem({")
collapsed_end = text.index("\nexport function WorkspaceShell", collapsed_start)
collapsed_function = '''function CollapsedSidebarItem({
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
'''
text = text[:collapsed_start] + collapsed_function + text[collapsed_end:]

saved_old = '''                {visibleSavedViews.map((item) => (
                  <a key={item.label} href={item.href}>
                    {item.label}
                  </a>
                ))}
'''
saved_new = '''                {visibleSavedViews.map((item) => (
                  <a key={item.label} href={item.href}>
                    <span className={styles.savedViewLead}>
                      <FanMindFunctionIcon
                        name={item.icon ?? resolveFanMindFunctionIcon(item.href, item.label)}
                      />
                      <span>{item.label}</span>
                    </span>
                  </a>
                ))}
'''
text = replace_once(text, saved_old, saved_new, "saved-view icons")

if "function CollapsedNavIcon" in text:
    raise SystemExit("legacy heuristic CollapsedNavIcon remains")
if "icon?: FanMindFunctionIconKey" not in text:
    raise SystemExit("WorkspaceNavLink icon key missing")
write(path, text)


# ---------------------------------------------------------------------------
# Workspace navigation styles for the same icon/label unit everywhere.
# ---------------------------------------------------------------------------
path = "src/app/dashboard/dashboard.module.css"
text = read(path)
icon_styles = '''

/* Shared semantic function icons: identical registry on landing and in-product navigation. */
.navItemLead,
.savedViewLead {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 9px;
}

.navItemLead > svg,
.savedViewLead > svg {
  width: 17px;
  height: 17px;
  flex: 0 0 17px;
  color: #67e8f9;
}

.navItemLead > span,
.savedViewLead > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.savedViews a {
  display: flex;
  align-items: center;
}
'''
if ".navItemLead," not in text:
    text = text.rstrip() + icon_styles + "\n"
write(path, text)


# ---------------------------------------------------------------------------
# Landing core function cards use the same SVG registry as the application.
# ---------------------------------------------------------------------------
path = "src/app/landing-v2/page.tsx"
text = read(path)
if 'from "@/components/FanMindFunctionIcon"' not in text:
    text = replace_once(
        text,
        'import { PlatformLogo } from "@/components/PlatformLogo";\n',
        'import { PlatformLogo } from "@/components/PlatformLogo";\nimport { FanMindFunctionIcon, resolveFanMindFunctionIcon } from "@/components/FanMindFunctionIcon";\n',
        "landing icon import",
    )

text = replace_once(
    text,
    "                <div>{feature.icon}</div>",
    "                <div><FanMindFunctionIcon name={resolveFanMindFunctionIcon(feature.icon, feature.title)} /></div>",
    "hero feature icon",
)
text = replace_once(
    text,
    "                <div className={styles.problemIcon}>{card.icon}</div>",
    "                <div className={styles.problemIcon}><FanMindFunctionIcon name={resolveFanMindFunctionIcon(card.icon, card.title)} /></div>",
    "problem card icon",
)
text = replace_once(
    text,
    "                  <span>{benefit.icon}</span>",
    "                  <span><FanMindFunctionIcon name={resolveFanMindFunctionIcon(benefit.icon, benefit.title)} /></span>",
    "solution benefit icon",
)
text = text.replace(
    "                  <span>{card.icon}</span>",
    "                  <span><FanMindFunctionIcon name={resolveFanMindFunctionIcon(card.icon, card.title)} /></span>",
)
text = replace_once(
    text,
    "                  <span>{step.icon}</span>",
    "                  <span><FanMindFunctionIcon name={resolveFanMindFunctionIcon(step.icon, step.title)} /></span>",
    "six-step icon",
)

for required in [
    "resolveFanMindFunctionIcon(feature.icon, feature.title)",
    "resolveFanMindFunctionIcon(card.icon, card.title)",
    "resolveFanMindFunctionIcon(step.icon, step.title)",
]:
    if required not in text:
        raise SystemExit(f"landing shared icon usage missing: {required}")
write(path, text)


# ---------------------------------------------------------------------------
# Product truth and source of truth keep the decision from drifting.
# ---------------------------------------------------------------------------
path = "scripts/verify-product-truth.mjs"
text = read(path)
for file_path, anchor in [
    ("src/components/FanMindFunctionIcon.tsx", '  "src/components/PlatformLogo.module.css",\n'),
    ("src/components/WorkspaceShell.tsx", '  "src/components/FanMindFunctionIcon.tsx",\n'),
    ("src/app/dashboard/dashboard.module.css", '  "src/components/WorkspaceShell.tsx",\n'),
]:
    entry = f'  "{file_path}",\n'
    if entry not in text:
        text = replace_once(text, anchor, anchor + entry, f"truth runtime {file_path}")

icon_checks = '''requireText(
  "src/components/FanMindFunctionIcon.tsx",
  "export type FanMindFunctionIconKey",
  "Funktionssymbole müssen über eine gemeinsame, typisierte Registry definiert sein.",
);
requireText(
  "src/components/WorkspaceShell.tsx",
  "icon?: FanMindFunctionIconKey",
  "Die Workspace-Navigation muss die gemeinsame Funktionssymbol-Registry verwenden.",
);
requireText(
  "src/app/landing-v2/page.tsx",
  "resolveFanMindFunctionIcon(feature.icon, feature.title)",
  "Die Landingpage muss für Kernfunktionen dieselben Symbole wie die Anwendung verwenden.",
);
requireText(
  "src/lib/workspaceNavigation.ts",
  'icon: "dashboard"',
  "Die zentrale Workspace-Navigation muss semantische Icon-Schlüssel setzen.",
);
requireText(
  "docs/SOURCE_OF_TRUTH.md",
  "Funktionssymbole werden über die gemeinsame `FanMindFunctionIcon`-Registry gerendert",
  "Die Source of Truth muss die gemeinsame Funktionssymbol-Regel dokumentieren.",
);

'''
if "Funktionssymbole müssen über eine gemeinsame" not in text:
    anchor = '''forbidIn(
  "src/app/landing-v2/page.tsx",
'''
    if anchor not in text:
        raise SystemExit("truth icon insertion anchor missing")
    text = text.replace(anchor, icon_checks + anchor, 1)
write(path, text)

path = "docs/SOURCE_OF_TRUTH.md"
text = read(path)
icon_rule = "- Funktionssymbole werden über die gemeinsame `FanMindFunctionIcon`-Registry gerendert; Landingpage und Anwendung verwenden für dieselbe Funktion denselben semantischen Icon-Schlüssel.\n"
if icon_rule not in text:
    anchor = "- Alle Kanal-Logos werden über die gemeinsame `PlatformLogo`-Komponente dargestellt. Assets werden einheitlich skaliert und nicht beschnitten.\n"
    if anchor not in text:
        raise SystemExit("Source of Truth platform-logo anchor missing")
    text = text.replace(anchor, anchor + icon_rule, 1)
write(path, text)

print("Shared FanMind function icons integrated across landing and workspace navigation.")
