# End-to-end rehearsal record (TEAM REHEARSAL, not customer revenue)

Date: 2026-08-16 ~01:26 UTC. Clearly labeled per MVP rule: no fake data presented as real; this order is excluded from all revenue and customer counts.

- Order: `ord_1786843047703_jqv2c` created via live `POST /api/order` (input: terac.com, AI research niche)
- Paid state: set via `mark_order_paid` RPC with rehearsal event `evt_rehearsal_20260816_0117`, `livemode: false`, payload notes it is a team rehearsal. No money moved.
- Dispatch: exactly one `dispatch_jobs` row created; claimed atomically; `done` after 1 attempt.
- Pipeline: ran the production code path (scan -> analyst -> copywriter -> validate -> persist) with `PIPELINE_VARIANT=A`, the Terac-validated winner. Result: 10 outreach items, 4 competitors (sourced + labeled inference), source `https://terac.com/` retrieved `2026-08-16T01:26:38.642Z`, terac field carries real study `k3n1qdhhgaj4n0kvxlimoual` (A 4, B 2, preference).
- Persistence: `orders.status=completed`, `result_json` validated, `report_token_hash` stored (sha256; raw token shown once at runtime only).
- Caveat recorded honestly: this run was triggered against the same production database through a local dev server because the deployed `/api/run` returned 500 due to Vercel env var misconfiguration (empty values from the initial paste). Production trigger to be re-verified after env fix; all data operations above executed against the live production Supabase.
