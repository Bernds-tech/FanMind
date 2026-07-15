#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def update(path: str, old: str, new: str, label: str) -> None:
    target = ROOT / path
    text = target.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    target.write_text(text.replace(old, new, 1), encoding="utf-8")


update(
    "scripts/one-off/shared-feature-icons.py",
    '''truth = replace_once(
    truth,
    '  "src/components/PlatformLogo.module.css",\\n',
    '  "src/components/PlatformLogo.module.css",\\n  "src/components/FanMindFeatureIcon.tsx",\\n  "src/components/WorkspaceShell.tsx",\\n',
    "truth shared icon runtime files",
)''',
    '''truth = replace_once(
    truth,
    '  "src/app/opengraph-image.tsx",\\n  "src/components/PlatformLogo.module.css",\\n  "src/components/LegalTopHeader.tsx",\\n',
    '  "src/app/opengraph-image.tsx",\\n  "src/components/PlatformLogo.module.css",\\n  "src/components/FanMindFeatureIcon.tsx",\\n  "src/components/WorkspaceShell.tsx",\\n  "src/components/LegalTopHeader.tsx",\\n',
    "truth shared icon runtime files",
)''',
    "unique truth runtime anchor",
)

update(
    "src/components/FanMindFeatureIcon.tsx",
    '''  if (normalized.includes("dashboard")) return "dashboard";
  if (
    normalized.includes("kontakt") ||
    normalized.includes("contact") ||
    normalized.includes("fans")
  )
    return "contacts";
  if (
    normalized.includes("kanäl") ||
    normalized.includes("kanael") ||
    normalized.includes("channel") ||
    normalized.includes("integration")
  )
    return "channels";
  if (normalized.includes("follow")) return "followups";
  if (
    normalized.includes("kontaktwissen") ||
    normalized.includes("knowledge") ||
    normalized.includes("memory") ||
    normalized.includes("gedächtnis")
  )
    return "knowledge";''',
    '''  if (normalized.includes("dashboard")) return "dashboard";
  if (
    normalized === "topfans" ||
    normalized.includes("top-fans") ||
    normalized.includes("top fans")
  )
    return "topFans";
  if (
    normalized.includes("kontaktwissen") ||
    normalized.includes("knowledge") ||
    normalized.includes("memory") ||
    normalized.includes("gedächtnis")
  )
    return "knowledge";
  if (
    normalized.includes("kontakt") ||
    normalized.includes("contact") ||
    normalized.includes("fans")
  )
    return "contacts";
  if (
    normalized.includes("kanäl") ||
    normalized.includes("kanael") ||
    normalized.includes("channel") ||
    normalized.includes("integration")
  )
    return "channels";
  if (normalized.includes("follow") || normalized.includes("timing")) return "followups";''',
    "specific icon mappings before generic contacts",
)

update(
    "src/components/FanMindFeatureIcon.tsx",
    '  if (normalized.includes("top fan")) return "topFans";\n',
    "",
    "remove unreachable duplicate top-fans mapping",
)

print("Prepared shared icon codemod anchors and specific mappings.")
