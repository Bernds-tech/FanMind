# FanMind Finishline Board

Machine source: `FINISHLINE_STATE.json`. Human-readable closeout board for the current finishline through Phase 7.

| Gate | Task | Current state | What is already proven | What still closes the gate |
|---|---|---|---|---|
| Project Memory V6 | FM-MEM-005 | IMPLEMENTED_NOT_VERIFIED | V1-V6 governance, deep audit, controls and reconciliation are in PR #975 | exact-head full CI, merge to `main`, close receipt/lock |
| Production/Ops | FM-OPS-001 | VERIFIED | production deploy, health/version, audit, monitoring, encrypted backups and checksum verification | maintain; optional/destructive follow-ups remain separate |
| Isolated Staging | FM-STG-001 | ACCEPTED | separate Supabase/Web Staging, DNS/TLS, synthetic workspaces, test resources and primary acceptance | reuse; feature-specific acceptance stays in its own gate |
| Restore | FM-RST-001 | PARTIAL | ACL/Owner recovery contract, PG17 roundtrip, Schema-2 Full Backup, checksum, isolated host foundation | policy/host revalidation -> readiness -> compatibility -> DB -> postcheck -> Storage -> config -> cleanup -> final evidence |
| Mobile | FM-MOB-001 | IMPLEMENTED_NOT_VERIFIED | native app and repository/CI foundation | redirect/EAS/signing -> signed Android/device -> iOS/TestFlight/device -> Push/Store evidence |
| AI/Billing | FM-AI-001 | PARTIAL | Standard active; Plus/Ultra fail-closed policy, test/storage/lifecycle foundations | written tier decisions, quality/cost, complete Staging lifecycle, legal/tax, explicit activation |
| Meta/Security | FM-META-001 | PARTIAL | PageView-only Pixel production path; advanced Meta foundation | Events Manager/no-PII, App Review/real E2E, final security/legal evidence |
| Phase 3 Social | FM-SOC3-001 | PARTIAL | Facebook/Instagram advanced foundations; dormant WhatsApp inbound foundation | real E2E Facebook + Instagram + WhatsApp including auth/revocation/reconnect/tenant/idempotency |
| Phase 7 Social | FM-SOC7-001 | PARTIAL | feasibility notes | official-scope validation and real TikTok/X/Discord acceptance; OnlyFans official/contractual feasibility or explicit unavailable result |
| Sales Handoff | FM-SALES-001 | BLOCKED | sales material exists and roadmap truth is aligned | all required sales gates accepted + exact-release 5-minute Production demo + final reader sync |
| Legal/Tax/AVV | FM-LEGAL-001 | BLOCKED | technical reader/evidence framework and confirmed operator facts | genuine advisor/register/provider/customer evidence; no guessing |

## Hard finishline rules

- `SALES_READY=true` is never set manually. It is derived by `scripts/fanmind_sales_readiness.py`.
- Phase 4 is the completed Production/Billing base, not sales handoff.
- Phase 3 is Facebook + Instagram + WhatsApp.
- Phase 7 is TikTok + X/Twitter + Discord + conditional OnlyFans.
- Phase 8 is not started and must not be counted or implemented in this finishline.
- A gate with code/CI only is not automatically `ACCEPTED`.
- External acceptance cannot be inferred from a repository artifact.
- Restore remains R4 and never targets Production or Supabase Staging.
- No real payment, destructive offsite retention, platform bypass or protected Production mutation is authorized by this board.

## Closeout order

1. Project Memory V6 accepted on `main`.
2. Restore accepted end-to-end.
3. Mobile signed/device/store acceptance.
4. AI/Billing tier decisions and lifecycle acceptance.
5. Meta Events/Security external acceptance.
6. Phase 3 real Social acceptance.
7. Phase 7 real Social acceptance / OnlyFans feasibility resolution.
8. Final Production demo and technical Sales Handoff.
