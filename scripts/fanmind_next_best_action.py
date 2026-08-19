#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PM = ROOT / "project-memory"
STATE_PATH = PM / "FINISHLINE_STATE.json"
CATALOG_PATH = PM / "NEXT_BEST_ACTIONS.json"
DEFERRED_PATH = PM / "DEFERRED_OWNER_ACTIONS.md"
OUTPUT_PATH = PM / "NEXT_BEST_ACTION.md"

ACCEPTED_STATES = {"ACCEPTED", "PRODUCTION_CONFIRMED"}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def deferred_owner_ids(text: str) -> set[str]:
    ids = set()
    for block in re.split(r"(?m)^## ", text)[1:]:
        title = block.splitlines()[0].strip()
        action_id = title.split(" — ", 1)[0].strip()
        status = re.search(r"(?m)^- Status:\s*([A-Z_]+)\.?\s*$", block)
        if status and status.group(1) == "DEFERRED_BY_OWNER":
            ids.add(action_id)
    return ids


def gate_state(state: dict, gate: str) -> str:
    entry = state.get("gates", {}).get(gate)
    return str(entry.get("state")) if isinstance(entry, dict) else "UNKNOWN"


def prerequisites_satisfied(action: dict, state: dict) -> tuple[bool, list[str]]:
    missing = []
    for gate in action.get("prerequisite_gates", []):
        current = gate_state(state, gate)
        if current not in ACCEPTED_STATES:
            missing.append(f"{gate}={current}")
    return not missing, missing


def action_complete(action: dict, state: dict) -> bool:
    if action.get("run_when_gate_done") is True:
        return False
    return gate_state(state, action["gate"]) in set(action.get("done_states", []))


def classify(action: dict, state: dict, deferred: set[str]) -> tuple[str, str]:
    if action_complete(action, state):
        return "DONE", f"gate {action['gate']} is {gate_state(state, action['gate'])}"
    prereq_ok, missing = prerequisites_satisfied(action, state)
    if not prereq_ok:
        return "WAITING_PREREQUISITE", ", ".join(missing)
    deferred_id = action.get("deferred_owner_id")
    if deferred_id and deferred_id in deferred:
        return "DEFERRED_BY_OWNER", deferred_id
    if action.get("requires_owner") is True:
        return "OWNER_ACTION_REQUIRED", "owner/platform action required"
    return "EXECUTABLE", "standing-authorized safe work"


def select(state: dict, catalog: dict, deferred: set[str]):
    classified = []
    for action in sorted(catalog["actions"], key=lambda x: (x["priority"], x["id"])):
        status, reason = classify(action, state, deferred)
        classified.append((action, status, reason))

    for action, status, reason in classified:
        if status == "EXECUTABLE":
            return action, classified

    # If nothing is assistant-executable, surface the earliest unresolved owner action
    # instead of pretending there is safe work to do.
    for action, status, reason in classified:
        if status in {"DEFERRED_BY_OWNER", "OWNER_ACTION_REQUIRED"}:
            return action, classified
    return None, classified


def render(state: dict, catalog: dict, deferred: set[str]) -> str:
    selected, classified = select(state, catalog, deferred)
    lines = [
        "# FanMind Next Best Action",
        "",
        "Generated from `FINISHLINE_STATE.json`, `NEXT_BEST_ACTIONS.json` and `DEFERRED_OWNER_ACTIONS.md`.",
        "",
        f"- Sales ready: `{str(bool(state.get('sales_ready'))).lower()}`",
        f"- Phase 8 started: `{str(bool(state.get('phase8_started'))).lower()}`",
    ]
    if selected is None:
        lines += ["- Selected action: `NONE`", "", "No unresolved action is currently selectable."]
    else:
        status, reason = classify(selected, state, deferred)
        lines += [
            f"- Selected action: `{selected['id']}`",
            f"- Task: `{selected['task']}`",
            f"- Gate: `{selected['gate']}` (`{gate_state(state, selected['gate'])}`)",
            f"- Selection status: `{status}`",
            f"- Title: {selected['title']}",
            "",
            "## Instruction",
            "",
            selected["instruction"],
            "",
            "## Why this action",
            "",
            reason,
        ]

    lines += ["", "## Candidate evaluation", ""]
    for action, status, reason in classified:
        lines.append(
            f"- `{action['id']}` priority {action['priority']}: **{status}** — {reason}"
        )

    lines += [
        "",
        "## Selection safety rules",
        "",
        "- A `DEFERRED_BY_OWNER` action remains open but is skipped for current assistant execution.",
        "- Skipping a deferred action never marks its gate accepted or lowers its priority permanently.",
        "- Only `parallel_safe=true` work may proceed around an earlier deferred finishline action.",
        "- Provider, payment, destructive, legal and protected Production boundaries still require their existing approvals.",
        "- Phase 8 remains outside the current finishline.",
        "",
    ]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    state = load_json(STATE_PATH)
    catalog = load_json(CATALOG_PATH)
    deferred_text = DEFERRED_PATH.read_text(encoding="utf-8") if DEFERRED_PATH.exists() else ""
    deferred = deferred_owner_ids(deferred_text)

    selected, classified = select(state, catalog, deferred)
    if selected:
        status, _ = classify(selected, state, deferred)
        print(f"FANMIND_NEXT_ACTION={selected['id']}")
        print(f"FANMIND_NEXT_ACTION_STATUS={status}")
        print(f"FANMIND_NEXT_ACTION_TASK={selected['task']}")
    else:
        print("FANMIND_NEXT_ACTION=NONE")
        print("FANMIND_NEXT_ACTION_STATUS=NONE")

    rendered = render(state, catalog, deferred)
    if args.write:
        OUTPUT_PATH.write_text(rendered, encoding="utf-8")
    if args.check:
        current = OUTPUT_PATH.read_text(encoding="utf-8") if OUTPUT_PATH.exists() else ""
        if current != rendered:
            print("FANMIND_NEXT_ACTION_RESULT=stale")
            return 1
    print("FANMIND_NEXT_ACTION_RESULT=passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
