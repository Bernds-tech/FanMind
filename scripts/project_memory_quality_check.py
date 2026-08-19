#!/usr/bin/env python3
from pathlib import Path
import re
import sys
ROOT=Path(__file__).resolve().parents[1]
PM=ROOT/"project-memory"
required=["EXECUTION_POLICY.md","QUALITY_CONTROL.md","STARTED_WORK.md","WORK_LOCKS.md","EXECUTION_RECEIPTS.md","RECONCILIATION.md","ASSUMPTIONS.md","CONTRADICTIONS.md","TASK_LEDGER.md","OPEN_LOOPS.md","DEPENDENCIES.md","EVIDENCE.md"]
errors=[]
for name in required:
    p=PM/name
    if not p.exists() or not p.read_text(encoding="utf-8").strip(): errors.append(f"missing-or-empty:{name}")
started=(PM/"STARTED_WORK.md").read_text(encoding="utf-8") if (PM/"STARTED_WORK.md").exists() else ""
active={"IN_PROGRESS","PARTIAL","BLOCKED","IMPLEMENTED_NOT_VERIFIED","RECONCILIATION_REQUIRED"}
for block in re.split(r"(?m)^## ",started)[1:]:
    title=block.splitlines()[0].strip()
    if title.startswith("<") or title in {"Rules","Entry template","Active work"}: continue
    m=re.search(r"(?m)^- Status:\s*([A-Z_]+)",block)
    if m and m.group(1) in active:
        if not re.search(r"(?m)^- Risk:\s*(R[1-4])\s*$",block): errors.append(f"active-started-work-missing-risk:{title}")
        if not re.search(r"(?m)^- Exact next step:\s*\S",block): errors.append(f"active-started-work-missing-next-step:{title}")
contr=(PM/"CONTRADICTIONS.md").read_text(encoding="utf-8") if (PM/"CONTRADICTIONS.md").exists() else ""
if "RECONCILIATION_REQUIRED" not in contr: errors.append("contradiction-register-missing-reconciliation-state")
quality=(PM/"QUALITY_CONTROL.md").read_text(encoding="utf-8") if (PM/"QUALITY_CONTROL.md").exists() else ""
for token in ["R1","R2","R3","R4","COUNTERCHECKED","PRODUCTION_CONFIRMED","What observation would prove our conclusion wrong?"]:
    if token not in quality: errors.append(f"quality-contract-missing:{token}")
if errors:
    print("PROJECT_MEMORY_QUALITY_RESULT=failed")
    for e in errors: print(f"PROJECT_MEMORY_QUALITY_ERROR={e}")
    sys.exit(1)
print("PROJECT_MEMORY_QUALITY_RESULT=passed")
