-- Supabase Schema for Zero Human (Tack) Orders
-- Run this in your Supabase SQL Editor to enable persistent database storage

create table if not exists public.orders (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending_payment',
  url text not null,
  niche text not null,
  email text not null,
  company text,
  audience text,
  competitors text[],
  focus text,
  stage text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.orders enable row level security;

-- Allow public inserts (so both authenticated users and guests can create orders)
create policy "Allow public order creation"
  on public.orders for insert
  with check (true);

-- Allow users to view their own orders, and allow public reads by order ID
create policy "Allow order reads by id or owner"
  on public.orders for select
  using (
    auth.uid() = user_id or auth.uid() is null
  );
