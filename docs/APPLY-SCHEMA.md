# Applying supabase/schema-v2.sql

For Nihar/Vachan. This is the durable order layer's migration on top of
`supabase/schema.sql` (v1). It is idempotent — safe to re-run — but it does
assume `schema.sql` has already been applied at least once (it `ALTER`s the
existing `orders` table).

## 1. Run the migration

1. Open the Supabase dashboard for the project (`svuqhdjwyxfwuldxfipt`, per
   `NEXT_PUBLIC_SUPABASE_URL` in `.env.example`).
2. Left sidebar: **SQL Editor** -> **New query**.
3. Open `supabase/schema-v2.sql` from this repo, copy the entire file.
4. Paste into the SQL editor and click **Run**.
5. Confirm no errors. You should see `orders` gain four new columns
   (`result_json`, `order_access_token_hash`, `report_token_hash`,
   `updated_at`), two new tables (`dispatch_jobs`, `stripe_events`), two new
   functions (`mark_order_paid`, `claim_dispatch`), and the `orders` select
   policy replaced with an owner-only one.
6. Sanity check under **Table Editor**: `dispatch_jobs` and `stripe_events`
   exist and show a padlock (RLS enabled, 0 policies). Under
   **Database > Policies > orders**, only "Allow public order creation"
   (insert) and "Allow authenticated owners to read their orders" (select)
   should remain.

## 2. Find the service-role key

1. Supabase dashboard -> **Project Settings** (gear icon) -> **API**.
2. Under **Project API keys**, copy the **service_role** **secret** key
   (NOT the `anon`/publishable key already in `.env.example` — this one
   bypasses Row Level Security, so treat it like a production database
   password: never commit it, never send it to the browser, never put it in
   a `NEXT_PUBLIC_*` variable).

## 3. Set environment variables

Local development (`.env.local`, not committed):

```
SUPABASE_SECRET_KEY=<the service_role secret key from step 2>
RUN_SHARED_SECRET=<any long random string, shared with whatever calls POST /api/run>
```

Vercel (Project Settings -> Environment Variables), for each relevant
environment (Production/Preview/Development as appropriate):

- `SUPABASE_SECRET_KEY` — the service_role secret key from step 2.
- `RUN_SHARED_SECRET` — same value used to call `POST /api/run` with the
  `x-run-secret` header (e.g. from the drain cron / webhook).
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  should already be set from the v1 Supabase integration; leave as-is.

Without `SUPABASE_SECRET_KEY` set, `getOrdersServer()`
(`lib/orders-factory.ts`) falls back to the in-memory stub — fine for local
dev without Supabase, but any paid/production traffic must have it set, or
order state will not survive a process restart.

## 4. What this migration deliberately does not do

- It does not touch `supabase/schema.sql` — that file stays exactly as
  Vachan wrote it; this migration only adds to what it created.
- It does not change the "Allow public order creation" insert policy on
  `orders`. CONTRACT.md v2 tracks moving order creation server-side
  (service-role only) as a separate follow-up; until that lands, anyone can
  still insert an order row directly. Not this change's scope.
- It does not add a failure-reason column. `SupabaseOrdersServer.failOrder`
  currently only sets `orders.status = 'failed'` and logs the reason to
  stdout/stderr; persisting the reason would need an additional column
  (e.g. `orders.failure_reason text`) — flagged as a TODO, not done here.
