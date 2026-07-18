#!/usr/bin/env python3
from pathlib import Path

# Referral runbook: require the shared boundary before referral write mode.
path = Path("docs/operations/referral-stripe-sandbox-runbook.md")
text = path.read_text(encoding="utf-8")
old = '''Nur in einer nicht-produktiven Umgebung:

```bash
export FANMIND_ENABLE_REFERRAL_BILLING=true
export FANMIND_REFERRAL_SANDBOX_ACK=I_UNDERSTAND_TEST_MODE_ONLY
npm run referral:sandbox:preflight -- --allow-write
```
'''
new = '''Nur in einer vollständig getrennten Staging-/Testumgebung. Ziel- und Production-Projektreferenz durch die tatsächlichen Supabase-Projektreferenzen ersetzen, aber nicht in Tickets oder Chat kopieren:

```bash
export FANMIND_RUNTIME_ENVIRONMENT=staging
export FANMIND_ENABLE_NON_PRODUCTION_WRITES=true
export FANMIND_NON_PRODUCTION_WRITE_ACK=I_UNDERSTAND_NON_PRODUCTION_ONLY
export FANMIND_TARGET_SUPABASE_PROJECT_REF=<STAGING_PROJECT_REF>
export FANMIND_PRODUCTION_SUPABASE_PROJECT_REF=<PRODUCTION_PROJECT_REF>

npm run environment:preflight:write

export FANMIND_ENABLE_REFERRAL_BILLING=true
export FANMIND_REFERRAL_SANDBOX_ACK=I_UNDERSTAND_TEST_MODE_ONLY
npm run referral:sandbox:preflight -- --allow-write
```
'''
if text.count(old) != 1:
    raise SystemExit("referral write preflight anchor mismatch")
text = text.replace(old, new, 1)
text = text.replace(
    '''TARGET=non-production
SECRETS_WURDEN_NICHT_AUSGEGEBEN=true
''',
    '''TARGET=non-production
ENVIRONMENT_BOUNDARY=ok
SECRETS_WURDEN_NICHT_AUSGEGEBEN=true
''',
    1,
)
text = text.replace(
    '''- Production-Ziel `fanmind.ch`;
- fehlendem Webhook-, Service-Role- oder Reconcile-Secret;
''',
    '''- Production-Ziel `fanmind.ch`;
- Production-Supabase-Projekt oder nicht eindeutig identifizierbarem Zielprojekt;
- fehlender allgemeiner Staging-/Test-Schreibfreigabe;
- fehlendem Webhook-, Service-Role- oder Reconcile-Secret;
''',
    1,
)
path.write_text(text, encoding="utf-8")

# Restore drill: make the shared preflight a hard precondition.
path = Path("docs/operations/RESTORE_DRILL.md")
text = path.read_text(encoding="utf-8")
anchor = '''- Do not point a restored test application at `fanmind.ch` or Production webhooks.

## 1. Production checksum-only verification
'''
replacement = '''- Do not point a restored test application at `fanmind.ch` or Production webhooks.
- Before any write or restore, the shared environment boundary must pass with a distinct Staging/Test Supabase project.

### Mandatory environment boundary before restore writes

Load only the isolated target configuration and run:

```bash
npm run environment:preflight:write
```

Required gates:

```text
FANMIND_RUNTIME_ENVIRONMENT=staging or test
FANMIND_ENABLE_NON_PRODUCTION_WRITES=true
FANMIND_NON_PRODUCTION_WRITE_ACK=I_UNDERSTAND_NON_PRODUCTION_ONLY
FANMIND_TARGET_SUPABASE_PROJECT_REF=<isolated target>
FANMIND_PRODUCTION_SUPABASE_PROJECT_REF=<comparison only>
```

The restore drill stops unless `ENVIRONMENT_BOUNDARY=OK`. This preflight does not replace the separate database-host confirmation immediately before `pg_restore`.

## 1. Production checksum-only verification
'''
if text.count(anchor) != 1:
    raise SystemExit("restore boundary anchor mismatch")
path.write_text(text.replace(anchor, replacement, 1), encoding="utf-8")

print("Environment separation runbooks updated.")
