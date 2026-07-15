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


workspace_path = "src/components/WorkspaceShell.tsx"
workspace = read(workspace_path)
workspace = replace_once(
    workspace,
    'import { FanMindLogo } from "./FanMindLogo";\n',
    'import { FanMindLogo } from "./FanMindLogo";\nimport { FanMindFeatureIcon, getFanMindFeatureIconKey } from "./FanMindFeatureIcon";\n',
    "WorkspaceShell icon import",
)

start = workspace.index("function SidebarItem({")
end = workspace.index("\nfunction CollapsedSidebarItem", start)
workspace_icon_block = '''function SidebarItem({
  label,
  active = false,
  badge,
  disabled = false,
  href,
}: WorkspaceNavLink) {
  const iconKey = getFanMindFeatureIconKey(`${href} ${label}`);

  return (
    <a
      aria-disabled={disabled || undefined}
      className={active ? styles.navItemActive : styles.navItem}
      href={href}
      title={label}
      tabIndex={disabled ? -1 : undefined}
    >
      <span className={styles.navItemContent}>
        <FanMindFeatureIcon feature={iconKey} className={styles.navItemIcon} />
        <span>{label}</span>
      </span>
      {badge ? <small>{badge}</small> : null}
    </a>
  );
}

function CollapsedNavIcon({ item }: { item: WorkspaceNavLink }) {
  return (
    <FanMindFeatureIcon
      feature={getFanMindFeatureIconKey(`${item.href} ${item.label}`)}
    />
  );
}
'''
workspace = workspace[:start] + workspace_icon_block + workspace[end:]
write(workspace_path, workspace)

landing_path = "src/app/landing-v2/page.tsx"
landing = read(landing_path)
landing = replace_once(
    landing,
    'import { FanMindLogo } from "@/components/FanMindLogo";\n',
    'import { FanMindLogo } from "@/components/FanMindLogo";\nimport { FanMindFeatureIcon, getFanMindFeatureIconKey } from "@/components/FanMindFeatureIcon";\n',
    "landing shared icon import",
)
landing = replace_once(
    landing,
    "                <div>{feature.icon}</div>",
    '''                <div>
                  <FanMindFeatureIcon
                    feature={getFanMindFeatureIconKey(feature.title)}
                    className={styles.sharedFeatureIcon}
                  />
                </div>''',
    "hero feature icon",
)
landing = replace_once(
    landing,
    '                <div className={styles.problemIcon}>{card.icon}</div>',
    '''                <div className={styles.problemIcon}>
                  <FanMindFeatureIcon
                    feature={getFanMindFeatureIconKey(card.title)}
                    className={styles.sharedFeatureIcon}
                  />
                </div>''',
    "problem feature icon",
)
landing = replace_once(
    landing,
    '''                  <span>{benefit.icon}</span>
                  <strong>{benefit.title}</strong>''',
    '''                  <span>
                    <FanMindFeatureIcon
                      feature={getFanMindFeatureIconKey(benefit.title)}
                      className={styles.sharedFeatureIcon}
                    />
                  </span>
                  <strong>{benefit.title}</strong>''',
    "solution benefit icon",
)
landing = replace_once(
    landing,
    '''                <div className={styles.functionTitle}>
                  <span>{card.icon}</span>''',
    '''                <div className={styles.functionTitle}>
                  <span>
                    <FanMindFeatureIcon
                      feature={getFanMindFeatureIconKey(card.title)}
                      className={styles.sharedFeatureIcon}
                    />
                  </span>''',
    "function card icon",
)
landing = replace_once(
    landing,
    '''                <div className={styles.stepCardTitle}>
                  <span>{step.icon}</span>''',
    '''                <div className={styles.stepCardTitle}>
                  <span>
                    <FanMindFeatureIcon
                      feature={getFanMindFeatureIconKey(`${step.title} ${step.cardTitle}`)}
                      className={styles.sharedFeatureIcon}
                    />
                  </span>''',
    "six-step card icon",
)
landing = replace_once(
    landing,
    '''            <article data-tone={benefit.tone} key={benefit.title}>
              <span>{benefit.icon}</span>
              <div>''',
    '''            <article data-tone={benefit.tone} key={benefit.title}>
              <span>
                <FanMindFeatureIcon
                  feature={getFanMindFeatureIconKey(benefit.title)}
                  className={styles.sharedFeatureIcon}
                />
              </span>
              <div>''',
    "six-step benefit icon",
)
write(landing_path, landing)

workspace_css_path = "src/app/dashboard/dashboard.module.css"
workspace_css = read(workspace_css_path)
workspace_css_marker = "/* Shared FanMind feature icons */"
if workspace_css_marker not in workspace_css:
    workspace_css += '''

/* Shared FanMind feature icons */
.navItemContent {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 9px;
}

.navItemIcon {
  width: 17px;
  height: 17px;
  flex: 0 0 17px;
  color: #67e8f9;
}

.navItemContent > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
'''
write(workspace_css_path, workspace_css)

landing_css_path = "src/app/landing-v2/landing-v2.module.css"
landing_css = read(landing_css_path)
landing_css_marker = "/* Shared FanMind feature icons */"
if landing_css_marker not in landing_css:
    landing_css += '''

/* Shared FanMind feature icons */
.sharedFeatureIcon {
  display: block;
  width: 1em;
  height: 1em;
  color: currentColor;
  fill: currentColor;
}
'''
write(landing_css_path, landing_css)

truth_path = "scripts/verify-product-truth.mjs"
truth = read(truth_path)
truth = replace_once(
    truth,
    '  "src/components/PlatformLogo.module.css",\n',
    '  "src/components/PlatformLogo.module.css",\n  "src/components/FanMindFeatureIcon.tsx",\n  "src/components/WorkspaceShell.tsx",\n',
    "truth shared icon runtime files",
)
icon_checks = '''requireText(
  "src/components/FanMindFeatureIcon.tsx",
  "getFanMindFeatureIconKey",
  "Zentrale Funktionssymbole müssen über eine gemeinsame Zuordnung aufgelöst werden.",
);
requireText(
  "src/components/WorkspaceShell.tsx",
  "FanMindFeatureIcon",
  "Die Workspace-Navigation muss das gemeinsame Funktionssymbol-System verwenden.",
);
requireText(
  "src/app/landing-v2/page.tsx",
  "FanMindFeatureIcon",
  "Zentrale Landingpage-Funktionskarten müssen das gemeinsame Symbol-System verwenden.",
);
forbidIn(
  "src/app/landing-v2/page.tsx",
  /<div>\{feature\.icon\}<\/div>|<span>\{card\.icon\}<\/span>/u,
  "Zentrale Landingpage-Funktionskarten dürfen nicht wieder auf freie Emoji-/Sonderzeichen-Icons zurückfallen.",
);
'''
anchor = '''warn(
  /TODO:\\s*(OpenAI-Vertrag|DPA|Transfergrundlagen)/iu,
'''
if icon_checks not in truth:
    truth = replace_once(truth, anchor, icon_checks + "\n" + anchor, "truth icon checks")
write(truth_path, truth)

for path, required in [
    (workspace_path, "FanMindFeatureIcon"),
    (landing_path, "styles.sharedFeatureIcon"),
    (workspace_css_path, workspace_css_marker),
    (landing_css_path, landing_css_marker),
]:
    if required not in read(path):
        raise SystemExit(f"{path}: required shared icon marker missing: {required}")

print("Shared FanMind feature icons integrated.")
