#!/usr/bin/env python3
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
PM = ROOT / "project-memory"
policy = json.loads((PM / "EVIDENCE_TTL_POLICY.json").read_text(encoding="utf-8"))["policy"]
register = json.loads((PM / "EVIDENCE_FRESHNESS.json").read_text(encoding="utf-8"))["entries"]
finishline = json.loads((PM / "FINISHLINE_STATE.json").read_text(encoding="utf-8"))

accepted = {"ACCEPTED", "PRODUCTION_CONFIRMED"}
mutable_success = {"VERIFIED", "COUNTERCHECKED", "ACCEPTED", "PRODUCTION_CONFIRMED"}
errors = []
now = datetime.now(timezone.utc)

for entry in register:
    cls = entry.get("class")
    if cls not in policy:
        errors.append(f"unknown-evidence-class:{entry.get('id')}:{cls}")
        continue
    ttl = policy[cls].get("ttl_hours")
    status = entry.get("status")
    observed = entry.get("observed_at")
    if ttl is not None and status in mutable_success and not observed:
        errors.append(f"mutable-evidence-missing-observed-at:{entry.get('id')}")
        continue
    if ttl is not None and observed:
        try:
            instant = datetime.fromisoformat(observed.replace("Z", "+00:00"))
            if instant.tzinfo is None:
                raise ValueError("timezone required")
        except ValueError:
            errors.append(f"invalid-observed-at:{entry.get('id')}")
            continue
        expired = now > instant.astimezone(timezone.utc) + timedelta(hours=ttl)
        if expired:
            gate = entry.get("gate")
            gate_state = finishline.get("gates", {}).get(gate, {}).get("state")
            print(f"EVIDENCE_REVALIDATION_REQUIRED={entry.get('id')} gate={gate} state={gate_state}")
            if gate_state in accepted and status in mutable_success:
                errors.append(f"stale-evidence-supporting-accepted-gate:{entry.get('id')}:{gate}")

if errors:
    print("FANMIND_EVIDENCE_FRESHNESS_RESULT=failed")
    for error in errors:
        print(f"FANMIND_EVIDENCE_FRESHNESS_ERROR={error}")
    sys.exit(1)
print("FANMIND_EVIDENCE_FRESHNESS_RESULT=passed")
