#!/usr/bin/env python3
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
PM = ROOT / "project-memory"
required = [
    "EXECUTION_POLICY.md",
    "QUALITY_CONTROL.md",
    "STARTED_WORK.md",
    "WORK_LOCKS.md",
    "EXECUTION_RECEIPTS.md",
    "RECONCILIATION.md",
    "ASSUMPTIONS.md",
    "CONTRADICTIONS.md",
    "TASK_LEDGER.md",
    "OPEN_LOOPS.md",
    "DEPENDENCIES.md",
    "EVIDENCE.md",
    "FANMIND_FINISHLINE.md",
    "FINISHLINE_STATE.json",
    "RESTORE_STATE_MACHINE.md",
    "EXTERNAL_ACCEPTANCE.md",
    "DEFERRED_OWNER_ACTIONS.md",
    "NEXT_BEST_ACTIONS.json",
    "NEXT_BEST_ACTION.md",
    "BRANCH_PROTECTION_CONTRACT.json",
    "EVIDENCE_TTL_POLICY.json",
    "EVIDENCE_FRESHNESS.json",
    "DRIFT_BASELINE.json",
    "MILESTONE_POLICY.json",
    "FANMIND_DEEP_AUDIT_2026-08-19.md",
]
errors = []
for name in required:
    p = PM / name
    if not p.exists() or not p.read_text(encoding="utf-8").strip():
        errors.append(f"missing-or-empty:{name}")

started = (PM / "STARTED_WORK.md").read_text(encoding="utf-8") if (PM / "STARTED_WORK.md").exists() else ""
active = {"IN_PROGRESS", "PARTIAL", "BLOCKED", "IMPLEMENTED_NOT_VERIFIED", "RECONCILIATION_REQUIRED"}
for block in re.split(r"(?m)^## ", started)[1:]:
    title = block.splitlines()[0].strip()
    if title.startswith("<") or title in {"Rules", "Entry template", "Active work"}:
        continue
    m = re.search(r"(?m)^- Status:\s*([A-Z_]+)", block)
    if m and m.group(1) in active:
        if not re.search(r"(?m)^- Risk:\s*(R[1-4])\s*$", block):
            errors.append(f"active-started-work-missing-risk:{title}")
        if not re.search(r"(?m)^- Exact next step:\s*\S", block):
            errors.append(f"active-started-work-missing-next-step:{title}")

contr = (PM / "CONTRADICTIONS.md").read_text(encoding="utf-8") if (PM / "CONTRADICTIONS.md").exists() else ""
if "RECONCILIATION_REQUIRED" not in contr:
    errors.append("contradiction-register-missing-reconciliation-state")

quality = (PM / "QUALITY_CONTROL.md").read_text(encoding="utf-8") if (PM / "QUALITY_CONTROL.md").exists() else ""
for token in ["R1", "R2", "R3", "R4", "COUNTERCHECKED", "PRODUCTION_CONFIRMED", "What observation would prove our conclusion wrong?"]:
    if token not in quality:
        errors.append(f"quality-contract-missing:{token}")

state_path = PM / "FINISHLINE_STATE.json"
state = {}
if state_path.exists():
    try:
        state = json.loads(state_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        errors.append(f"finishline-json-invalid:{exc.msg}")
    if state.get("repository") != "FanMind/FanMind":
        errors.append("finishline-repository-mismatch")
    if state.get("phase8_started") is not False:
        errors.append("finishline-phase8-must-be-false")
    for gate in ["restore", "mobile", "ai_billing", "meta_security", "phase3_social", "phase7_social", "sales_handoff"]:
        if gate not in state.get("gates", {}):
            errors.append(f"finishline-gate-missing:{gate}")

catalog_path = PM / "NEXT_BEST_ACTIONS.json"
if catalog_path.exists():
    try:
        catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        errors.append(f"next-action-json-invalid:{exc.msg}")
        catalog = {}
    ids = set()
    priorities = set()
    for action in catalog.get("actions", []):
        action_id = action.get("id")
        if not action_id or action_id in ids:
            errors.append(f"next-action-id-invalid-or-duplicate:{action_id}")
        ids.add(action_id)
        priority = action.get("priority")
        if not isinstance(priority, int) or priority in priorities:
            errors.append(f"next-action-priority-invalid-or-duplicate:{priority}")
        priorities.add(priority)
        if action.get("gate") not in state.get("gates", {}):
            errors.append(f"next-action-unknown-gate:{action_id}")
        if action.get("parallel_safe") not in {True, False}:
            errors.append(f"next-action-parallel-safe-missing:{action_id}")
        if action.get("requires_owner") not in {True, False}:
            errors.append(f"next-action-requires-owner-missing:{action_id}")

branch_contract = json.loads((PM / "BRANCH_PROTECTION_CONTRACT.json").read_text(encoding="utf-8"))
if branch_contract.get("branch") != "main" or branch_contract.get("require_pull_request") is not True:
    errors.append("branch-protection-contract-invalid")
if branch_contract.get("owner_activation") != "DEFERRED_OWNER_ACTION":
    errors.append("branch-protection-owner-boundary-not-recorded")
deferred = (PM / "DEFERRED_OWNER_ACTIONS.md").read_text(encoding="utf-8")
if "FM-GOV-OWNER-001" not in deferred:
    errors.append("branch-protection-deferred-owner-action-missing")

for script_name in [
    "fanmind_sales_readiness.py",
    "fanmind_truth_drift_check.py",
    "fanmind_next_best_action.py",
    "fanmind_evidence_freshness.py",
    "fanmind_drift_preflight.py",
    "fanmind_milestone_snapshot_check.py",
]:
    if not (ROOT / "scripts" / script_name).exists():
        errors.append(f"memory-script-missing:{script_name}")

protocol = (PM / "PROTOCOL.md").read_text(encoding="utf-8") if (PM / "PROTOCOL.md").exists() else ""
for token in ["NEXT_BEST_ACTIONS.json", "NEXT_BEST_ACTION.md", "DEFERRED_OWNER_ACTIONS.md", "parallel_safe=true"]:
    if token not in protocol:
        errors.append(f"protocol-next-action-contract-missing:{token}")

if errors:
    print("PROJECT_MEMORY_QUALITY_RESULT=failed")
    for e in errors:
        print(f"PROJECT_MEMORY_QUALITY_ERROR={e}")
    sys.exit(1)
print("PROJECT_MEMORY_QUALITY_RESULT=passed")
