#!/usr/bin/env python3
from pathlib import Path

path = Path("src/app/admin/operations/page.tsx")
text = path.read_text(encoding="utf-8")


def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    text = text.replace(old, new, 1)


replace_once(
    'import { BackupJobActions } from "./BackupJobActions";\n',
    'import { BackupJobActions } from "./BackupJobActions";\nimport { ServerErrorGroupsCard } from "./ServerErrorGroupsCard";\n',
    "server error card import",
)

anchor = '''          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <span className={styles.eyebrow}>Audit</span>
'''
replace_once(
    anchor,
    '''          <ServerErrorGroupsCard result={data.serverErrors} />

''' + anchor,
    "server error card placement",
)

path.write_text(text, encoding="utf-8")
print("Server error groups card added to operations page.")
