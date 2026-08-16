-- Zero Human (Tack) — Orders durability layer v2
-- Claude-owned per CONTRACT.md v2 sections 3, 4, 5, 6, 8.1.
--
-- Do NOT edit supabase/schema.sql (Vachan-owned v1) — this file only adds to
-- and repairs what it created. Paste this whole file into the Supabase SQL
-- editor and run it. It is idempotent: safe to run multiple times against
-- the same project (uses IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS
-- throughout), and safe to run even if schema.sql has not been applied yet
-- other than the `orders` ALTERs below, which require the `orders` table
-- from schema.sql to already exist.

-- =====================================================================
-- 1. orders: new columns (CONTRACT.md v2 section 5, 6)
-- =====================================================================

alter table public.orders
  add column if not exists result_json jsonb,
  add column if not exists order_access_token_hash text,
  add column if not exists report_token_hash text,
  add column if not exists updated_at timestamptz not null default now();

-- =====================================================================
-- 2. dispatch_jobs (CONTRACT.md v2 section 4)
-- =====================================================================

create table if not exists public.dispatch_jobs (
  id text primary key,
  order_id text not null unique references public.orders(id),
  status text not null default 'queued'
    check (status in ('queued', 'claimed', 'done', 'failed')),
  attempts int not null default 0,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.dispatch_jobs enable row level security;
-- No policies: only the service role (which bypasses RLS) may touch this
-- table. Anon/authenticated get nothing.

-- =====================================================================
-- 3. stripe_events (CONTRACT.md v2 sections 2, 3)
-- =====================================================================

create table if not exists public.stripe_events (
  event_id text primary key,
  type text,
  livemode boolean,
  payload jsonb,
  created_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;
-- No policies: service-role only, same rationale as dispatch_jobs.

-- =====================================================================
-- 4. RPC: mark_order_paid (CONTRACT.md v2 section 3)
--
-- One transaction (the whole function body runs as a single implicit
-- transaction): record the Stripe event, compare-and-set the order to
-- paid, and enqueue exactly one dispatch job. Returns a status string
-- rather than raising, so the webhook can branch on it:
--   'duplicate'     — event_id already recorded; ignore and ack 200.
--   'invalid_state' — order missing, or not pending_payment and not
--                     already paid+dispatched; webhook should treat this
--                     as an error (do not silently succeed).
--   'ok'            — order is now paid (or already was, idempotently)
--                     and a dispatch job exists for it.
-- =====================================================================

create or replace function public.mark_order_paid(
  p_event_id text,
  p_event_type text,
  p_livemode boolean,
  p_payload jsonb,
  p_order_id text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row_count int;
  v_current_status text;
  v_has_dispatch boolean;
begin
  -- 4a. Record the event; a unique-constraint conflict means this exact
  -- Stripe event was already processed (retry/replay) — no-op.
  insert into public.stripe_events (event_id, type, livemode, payload)
  values (p_event_id, p_event_type, p_livemode, p_payload)
  on conflict (event_id) do nothing;

  get diagnostics v_row_count = row_count;
  if v_row_count = 0 then
    return 'duplicate';
  end if;

  -- 4b. Compare-and-set pending_payment -> paid.
  update public.orders
     set status = 'paid',
         updated_at = now()
   where id = p_order_id
     and status = 'pending_payment';

  get diagnostics v_row_count = row_count;

  if v_row_count = 0 then
    -- Either the order doesn't exist, or it wasn't pending_payment. The
    -- only non-error case is an order that's already paid-or-further and
    -- already has a dispatch job — treat that as an idempotent success
    -- (e.g. a duplicate webhook delivery for a different, later event_id
    -- on the same order). Anything else is invalid_state.
    select o.status into v_current_status
      from public.orders o
     where o.id = p_order_id;

    if v_current_status is null then
      return 'invalid_state';
    end if;

    select exists(
      select 1 from public.dispatch_jobs d where d.order_id = p_order_id
    ) into v_has_dispatch;

    if v_current_status in ('paid', 'processing', 'completed') and v_has_dispatch then
      return 'ok';
    end if;

    return 'invalid_state';
  end if;

  -- 4c. Enqueue exactly one dispatch job for this order.
  insert into public.dispatch_jobs (id, order_id, status)
  values ('disp_' || replace(gen_random_uuid()::text, '-', ''), p_order_id, 'queued')
  on conflict (order_id) do nothing;

  return 'ok';
end;
$$;

revoke execute on function public.mark_order_paid(text, text, boolean, jsonb, text) from public;
grant execute on function public.mark_order_paid(text, text, boolean, jsonb, text) to service_role;

-- =====================================================================
-- 5. RPC: claim_dispatch (CONTRACT.md v2 section 4)
--
-- Atomic queued -> claimed transition. Returns zero rows when the job
-- doesn't exist or wasn't queued (already claimed/done/failed) — callers
-- must treat an empty result as "skip, do no agent work".
-- =====================================================================

create or replace function public.claim_dispatch(p_dispatch_id text)
returns table (order_id text)
language plpgsql
set search_path = public
as $$
begin
  return query
    update public.dispatch_jobs
       set status = 'claimed',
           claimed_at = now(),
           attempts = attempts + 1
     where id = p_dispatch_id
       and status = 'queued'
    returning dispatch_jobs.order_id;
end;
$$;

revoke execute on function public.claim_dispatch(text) from public;
grant execute on function public.claim_dispatch(text) to service_role;

-- =====================================================================
-- 6. RLS fix (CONTRACT.md v2 section 8.1, launch blocker #1)
--
-- schema.sql's "Allow order reads by id or owner" policy reads
-- `auth.uid() = user_id or auth.uid() is null`, which exposes every order
-- row (including email) to any anonymous reader, since `auth.uid() is
-- null` is true for every unauthenticated request. Replace it with an
-- owner-only policy. Anonymous callers get nothing back from `select` —
-- the server (this app's API routes) uses the service-role key, which
-- bypasses RLS entirely, so it is unaffected by this tightening.
-- =====================================================================

drop policy if exists "Allow order reads by id or owner" on public.orders;
drop policy if exists "Allow authenticated owners to read their orders" on public.orders;

create policy "Allow authenticated owners to read their orders"
  on public.orders for select
  to authenticated
  using (auth.uid() = user_id);

-- "Allow public order creation" (insert, with check (true)) is left as-is
-- from schema.sql: CONTRACT.md v2 launch blocker #2/#6 tracks moving order
-- creation server-side (service role only) as a separate follow-up: once
-- that lands, this public insert policy should be dropped and inserts
-- should go through the service-role client exclusively. Not done here —
-- app/api/order/route.ts is Vachan-owned and out of scope for this change.
