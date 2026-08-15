# Tack Pipeline Contract (v2, revised per Codex review of 1c508bf)

Status: PROPOSED, awaiting blocking Codex review. Freezes only after both managers agree and Nihar authorizes. No cross-boundary integration until then.

## 1. Ownership by path

| Owner | Paths |
| --- | --- |
| Vachan (protected) | `app/components/**`, `components/**`, `app/page.tsx`, `app/onboarding/**`, `app/login/**`, `app/signup/**`, `app/auth/**`, `app/sprint/**`, `app/layout.tsx`, `app/globals.css`, `lib/brand.ts`, `lib/types.ts`, `lib/groq-discovery.ts`, `lib/orders.ts`, `lib/workspace*.ts`, `lib/report-generator.ts`, `lib/pay.ts`, `lib/dashboard-ui.ts`, `lib/hydrate-desk.ts`, `lib/order-storage.ts`, `utils/**`, `middleware.ts`, `app/api/scan/**`, `app/api/order/**`, `supabase/**`, Vercel project, Supabase project, env configuration |
| Claude | `lib/agents/**`, `lib/terac/**`, `lib/pipeline-types.ts`, `app/api/run/**`, `fixtures/**`, `evidence/**`, prompt files, pipeline tests |
| Codex | `app/api/stripe/**`, `app/api/drain/**`, `lib/report/**` (React render components), `app/report/**`, watcher script (`scripts/repo-watcher.sh` exists on main), sanitized proof index, security review |
| Nihar (human) | Stripe Payment Link + QR, all secrets, dependency approvals, external-action approvals, Terac org + MCP |

Branches `nihar/<task>`; watcher fetch-and-alert only; merge own paths only after fetch + rebase/merge with origin/main + `npm run build` + own checks; cross-boundary requires both managers.

## 2. Payment verification (Codex-owned, binding spec)

The Stripe webhook must:
1. Verify the signature against the RAW request body (`stripe.webhooks.constructEvent`), never a re-serialized body.
2. Accept only events for the configured Payment Link (`STRIPE_PAYMENT_LINK_ID` match), `amount_total` exactly 1500, `currency` `usd`, `payment_status` `paid`, on `checkout.session.completed`.
3. Record `event.livemode`; test-mode events are stored but NEVER counted as revenue or allowed to trigger delivery of a customer order (guarded by env `ALLOW_TEST_MODE_RUNS` for rehearsals, default off).
4. Handle duplicates and out-of-order delivery: Stripe `event.id` recorded with a unique constraint; replays are acknowledged 200 and ignored.
5. Dependency: official `stripe` npm package. PENDING NIHAR APPROVAL (managers agree it is required).

## 3. Paid transition is one transaction (Vachan-owned DB, spec binding)

A single Postgres transaction (Supabase RPC `mark_order_paid(event_id, order_id, ...)`) performs:
1. Insert into `stripe_events` (unique `event_id`; conflict = duplicate, exit no-op).
2. `orders.status`: compare-and-set `pending_payment -> paid`.
3. Insert exactly one row into `dispatch_jobs` (unique constraint on `order_id`).
No partial states. Failure rolls back all three and returns an error; the webhook then 500s so Stripe retries.

## 4. Durable dispatch and drain

- `dispatch_jobs`: `id`, `order_id` (unique), `status` (`queued|claimed|done|failed`), `attempts`, `claimed_at`, `created_at`.
- `POST /api/run` accepts `{ dispatchId }` (NOT orderId), header `x-run-secret`. First action: atomic claim, `UPDATE dispatch_jobs SET status='claimed', claimed_at=now(), attempts=attempts+1 WHERE id=$1 AND status='queued' RETURNING *`; no row returned = 200 `{skipped:true}`. No agent work before a successful claim.
- Drain owner and mechanism: Codex owns `app/api/drain` (service-role: selects `queued` jobs plus `claimed` jobs stale >10 min which it reverts to `queued`; max 3 attempts then `failed`; POSTs `/api/run` per claimable job). Trigger: Vercel Cron every minute (`vercel.json` entry, Vachan applies it as deploy-config owner) plus one best-effort POST from the webhook AFTER the §3 transaction commits. Everything is idempotent because the claim is atomic.

## 5. Result persistence (revised)

- The pipeline persists validated `SprintResult` JSON (`sprint_results` table or `orders.result_json`, Vachan's schema call), NOT generated HTML.
- Validation before persist (Claude-owned validator, part of pipeline tests): exactly 10 `outreach` items; every competitor claim carries `sources[]` (url + retrievedAt) or `inference: true`; `terac.status` is `"not_run"` unless a real completed study exists (then `studyId`, scores, metric are required together).
- Rendering happens at view time in Codex-owned React components (`lib/report/**`, `app/report/**`): text nodes only, no `dangerouslySetInnerHTML`, no HTML strings from the pipeline.

## 6. Report access (revised)

- Order IDs grant nothing. Two credentials, both >= 32 bytes crypto-random, stored only as SHA-256 hashes:
  - `order_access_token`: returned once in the create-order response; grants status polling and, after completion, retrieval of the report URL. Same-browser delivery (localStorage) is acceptable for v1.
  - `report_token`: minted at completion; the customer-facing URL is `/report/<report_token>`; server compares hashes.
- Status polling returns only `{ orderId, status, reportUrl? }` and requires the order-access token.

## 7. Report route security (Codex-owned, binding)

Invalid, missing, or expired tokens return a generic 404 identical to unknown routes (no existence oracle). Headers on all report responses: `Cache-Control: private, no-store`, `X-Robots-Tag: noindex, nofollow`, `Referrer-Policy: no-referrer`. All customer content rendered as React text.

## 8. Vachan-owned launch blockers (recorded; his files, his fixes; nobody else edits them)

Carried from v1 (all verified in code):
1. RLS select policy exposes every order row to anonymous readers.
2. Silent in-memory fallback on failed order inserts; paid orders must fail closed.
3. Guessable order IDs (`ord_<timestamp>_<5 chars>`).
4. `/api/scan` SSRF gaps: redirects not re-validated per hop (DNS/private ranges), plain HTTP allowed.
5. `GET /api/order` returns full customer row including email.
6. No server-side update path; use service-role client per §3.

New in v2 (verified in code at 552dad6):
7. Retire `app/sprint/[orderId]`: it renders a report for ANY order id with no payment check and no token.
8. Retire `lib/report-generator.ts` as a customer deliverable: it is a string-template generator that invents fallback competitors ("The incumbent they get compared to"); templated content must never be presented as agent research (MVP: NO fake data). Noted precisely: its Terac block IS draft-labeled ("queued", no fabricated preference numbers), which is correct labeling; the fabrication issue is the competitor/persona content and the unpaid direct link.
9. The direct unpaid report link flow (order id in URL) is replaced by §6 tokens.

## 9. Terac evidence rule

`evidence/terac/` stores aggregated scores and sanitized excerpts only. `SprintResult.terac` stays `not_run` until a real study completes. Study spend requires Nihar's approval. Terac API base `https://terac.com/api/external/v2` (verified live), key server-side only.

## 10. Open product question for Nihar (not a manager decision)

PR #7 ships "Tack Desk, founding $20/mo": MVP.md locked identity says no subscriptions and one $15 offer. Managers need Nihar's ruling on which offer is canonical before the report/payment copy freezes.

## 11. Freeze checklist

- [ ] Codex review of v2 complete
- [ ] Both managers agree
- [ ] Nihar authorizes implementation across boundaries
