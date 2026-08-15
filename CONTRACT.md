# Tack Pipeline Contract (v1 proposal, for Codex review)

Status: PROPOSED. Freezes only after Codex review, both managers agree, and Nihar authorizes.
Scope: interfaces and boundaries between Vachan's infrastructure, the Codex-owned payment rails, and the Claude-owned agent pipeline. Nobody implements another party's side.

## 1. Ownership by path

| Owner | Paths |
| --- | --- |
| Vachan (protected) | `app/components/**`, `components/**`, `app/page.tsx`, `app/onboarding/**`, `app/login/**`, `app/signup/**`, `app/auth/**`, `app/layout.tsx`, `app/globals.css`, `lib/brand.ts`, `lib/types.ts`, `lib/groq-discovery.ts`, `utils/**`, `middleware.ts`, `app/api/scan/**`, `app/api/order/**`, `supabase/**`, Vercel project, Supabase project, env configuration |
| Claude | `lib/agents/**`, `lib/terac/**`, `lib/pipeline-types.ts`, `app/api/run/**`, `fixtures/**`, `evidence/**`, prompt files, pipeline tests |
| Codex | `app/api/stripe/**`, `lib/report/render.ts`, `app/report/**`, watcher script, sanitized proof index, security review |
| Nihar (human) | Stripe Payment Link + QR, all secrets, approvals for external actions, Terac MCP connection |

Cross-boundary changes require the other manager's approval relayed through Nihar. Branches are `nihar/<task>`. Watchers fetch and alert only. Merges: fetch, rebase on origin/main, `npm run build` + own checks, merge own-path PRs only, push immediately.

## 2. Order status model (existing `lib/types.ts`, unchanged)

`pending_payment -> paid -> processing -> completed | failed`

## 3. Interfaces Vachan's infrastructure must provide (file suggestion: `lib/orders-server.ts`, Vachan-owned)

All server-only, using a Supabase service-role client (never the publishable key; RLS stays strict for anon).

```ts
getOrder(orderId: string): Promise<OrderResponse | null>

// Atomic compare-and-set: paid -> processing. Returns false if the order is
// not in 'paid' (already claimed, completed, or unpaid). Safe under retries.
claimOrderForProcessing(orderId: string): Promise<boolean>

// Stores the rendered report, generates reportToken (>= 32 bytes, crypto-random,
// base64url), sets status 'completed'. Report is retrievable ONLY by token.
completeOrder(orderId: string, reportHtml: string): Promise<{ reportToken: string }>

failOrder(orderId: string, reason: string): Promise<void>

// Durable dispatch of a paid order to the pipeline. At-least-once delivery,
// retries with backoff. NOT an unawaited fetch inside the webhook response.
dispatchPaidOrder(orderId: string): Promise<void>
```

Failure semantics: for a PAID order, storage failure must fail closed (surface an error, never silently fall back to process-local memory).

## 4. Pipeline boundary (Claude-owned)

`POST /api/run` with JSON `{ orderId }` and header `x-run-secret: RUN_SHARED_SECRET`.
Behavior: reject bad secret (401); `claimOrderForProcessing` (exit 200 no-op if false: idempotent, retry-safe); scan via Vachan's existing `/api/scan` logic (homepage + up to 3 competitor URLs); Analyst; Copywriter (Variants A and B); render via Codex `renderReport(SprintResult)`; `completeOrder`; on unrecoverable error `failOrder`. Route config: `maxDuration 300`.

## 5. Report data shape (Claude-owned `lib/pipeline-types.ts`; Codex renderer consumes)

```ts
interface SourceRef { url: string; retrievedAt: string }        // ISO timestamp
interface CompetitorEntry {
  name: string; positioning: string; weakness: string;
  sources: SourceRef[];            // empty only if inference === true
  inference?: boolean;             // true when not tied to a retrieved source
}
interface SprintResult {
  orderId: string; company: string; generatedAt: string;
  execSummary: string;
  competitors: CompetitorEntry[];
  personas: { name: string; pain: string; trigger: string }[];
  outreach: { angle: string; subject?: string; body: string }[];
  nextMove: string;
  variantUsed: "A" | "B";
  terac?: { aScore: number; bScore: number; metric: string; studyId: string };
  sources: SourceRef[];            // everything retrieved during the run
}
```

Factual sourcing rule: competitor claims are tied to retrieved sources (URL + retrieval time) or explicitly labeled inference. No fabricated citations.

## 6. Report access (Codex-owned `app/report/**`)

Customer receives `/report/<reportToken>` only. Order IDs never grant report access. `GET /api/order?id=` (status polling) must return only `{ orderId, status, reportUrl? }`; no email, no customer fields. Guest flow (no account) must work end to end; auth stays optional.

## 7. Env vars (frozen names; values only in Vachan's Vercel project and local .env, never committed)

`ANTHROPIC_API_KEY`, `RUN_SHARED_SECRET`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PAYMENT_LINK_URL`,
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (service role, server-only),
`GROQ_API_KEY` (existing), `TERAC_API_KEY` (Claude session only, never deployed).

## 8. Vachan-owned launch blockers (recorded per agreement; Vachan implements and verifies; nobody else edits his files)

1. RLS select policy `auth.uid() = user_id or auth.uid() is null` lets every anonymous request read every order row (emails included). Must become: owner reads own rows; anon reads nothing; server uses service role.
2. `app/api/order` silently falls back to in-memory storage when the Supabase insert fails, and returns success. Paid orders must fail closed.
3. Order IDs (`ord_<timestamp>_<5 chars>`) are guessable and must not protect anything; report access moves to high-entropy tokens (§6).
4. `app/api/scan` follows redirects without re-validating each hop (DNS/private ranges) and allows plain HTTP. Not yet SSRF-safe.
5. `GET /api/order` returns the full order including email; must be reduced per §6.
6. No RLS update path exists for status transitions; server-side updates require the service-role client (§3).

## 9. Terac evidence rule

Git stores aggregated scores and sanitized excerpts only (`evidence/terac/`). Raw or identifying participant responses never enter the repository. Study spend requires Nihar's approval.

## 10. Freeze checklist

- [ ] Codex review complete
- [ ] Both managers agree
- [ ] Nihar authorizes implementation start
