#!/usr/bin/env python3
from pathlib import Path

path = Path("scripts/one-off/unify-function-icons.py")
text = path.read_text(encoding="utf-8")
old = '''for file_path, anchor in [
    ("src/components/FanMindFunctionIcon.tsx", '  "src/components/PlatformLogo.module.css",\\n'),
    ("src/components/WorkspaceShell.tsx", '  "src/components/FanMindFunctionIcon.tsx",\\n'),
    ("src/app/dashboard/dashboard.module.css", '  "src/components/WorkspaceShell.tsx",\\n'),
]:
    entry = f'  "{file_path}",\\n'
    if entry not in text:
        text = replace_once(text, anchor, anchor + entry, f"truth runtime {file_path}")
'''
new = '''runtime_anchor = ''' + "'''" + '''  "src/app/opengraph-image.tsx",
  "src/components/PlatformLogo.module.css",
  "src/components/LegalTopHeader.tsx",
''' + "'''" + '''
runtime_replacement = ''' + "'''" + '''  "src/app/opengraph-image.tsx",
  "src/components/PlatformLogo.module.css",
  "src/components/FanMindFunctionIcon.tsx",
  "src/components/WorkspaceShell.tsx",
  "src/app/dashboard/dashboard.module.css",
  "src/components/LegalTopHeader.tsx",
''' + "'''" + '''
if '  "src/components/FanMindFunctionIcon.tsx",\\n' not in text:
    text = replace_once(
        text,
        runtime_anchor,
        runtime_replacement,
        "truth runtime shared function icons",
    )
'''
if old not in text:
    raise SystemExit("original truth insertion block not found")
text = text.replace(old, new, 1)
text = text.replace(
    '    text = text.rstrip() + icon_styles + "\\n"\n',
    '    text = text.rstrip() + icon_styles.rstrip() + "\\n"\n',
    1,
)
path.write_text(text, encoding="utf-8")
print("Prepared unique Product Truth insertion anchor and normalized CSS EOF.")
