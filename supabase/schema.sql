-- ============================================================
-- FuadFX — Complete Supabase Schema
-- Run this in the Supabase SQL editor to set up all tables.
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. PROFILES
-- ──────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid        primary key references auth.users (id) on delete cascade,
  display_name    text        not null default '',
  experience      text        not null default 'beginner'
                              check (experience in ('beginner','intermediate','advanced','professional')),
  preferred_pair  text        not null default '',
  starting_capital numeric    not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────
-- 2. ACCOUNTS
-- ──────────────────────────────────────────────────────────
create table if not exists public.accounts (
  id               text        primary key,                          -- client-generated id
  user_id          uuid        not null references auth.users (id) on delete cascade,
  name             text        not null,
  broker           text        not null default '',
  number           text        not null default '',
  type             text        not null default 'live'
                               check (type in ('live','demo','prop')),
  currency         text        not null default 'USD',
  starting_balance numeric     not null default 0,
  is_archived      boolean     not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists accounts_user_id_idx on public.accounts (user_id);

-- ──────────────────────────────────────────────────────────
-- 3. TRADES
-- ──────────────────────────────────────────────────────────
create table if not exists public.trades (
  id             text        primary key,                            -- client-generated id (MT5-... or uuid)
  user_id        uuid        not null references auth.users (id) on delete cascade,
  account_id     text        not null references public.accounts (id) on delete cascade,
  account        text        not null default '',
  pair           text        not null,
  direction      text        not null check (direction in ('long','short')),
  entry          numeric     not null,
  exit           numeric     not null,
  stop_loss      numeric,
  take_profit    numeric,
  lots           numeric     not null default 0,
  pnl            numeric     not null default 0,
  pips           numeric     not null default 0,
  r_multiple     numeric     not null default 0,
  status         text        not null default 'open'
                             check (status in ('win','loss','breakeven','open')),
  opened_at      timestamptz not null,
  closed_at      timestamptz not null,
  strategy       text,
  session        text,
  timeframe      text,
  emotion        text,
  notes          text,
  mistakes       text,
  lessons        text,
  risk_amount    numeric,
  screenshot_url text,
  tags           text[]      not null default '{}',
  created_at     timestamptz not null default now()
);

create index if not exists trades_user_id_idx     on public.trades (user_id);
create index if not exists trades_account_id_idx  on public.trades (account_id);
create index if not exists trades_opened_at_idx   on public.trades (opened_at desc);
create index if not exists trades_status_idx      on public.trades (status);

-- ──────────────────────────────────────────────────────────
-- 4. updated_at trigger function
-- ──────────────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create or replace trigger accounts_updated_at
  before update on public.accounts
  for each row execute function public.handle_updated_at();

-- ──────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY
-- ──────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.trades   enable row level security;

-- profiles — users only see/edit their own row
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;

create policy "profiles_select" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_insert" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id);

-- accounts — users only see/edit their own rows
drop policy if exists "accounts_select" on public.accounts;
drop policy if exists "accounts_insert" on public.accounts;
drop policy if exists "accounts_update" on public.accounts;
drop policy if exists "accounts_delete" on public.accounts;

create policy "accounts_select" on public.accounts
  for select using (auth.uid() = user_id);

create policy "accounts_insert" on public.accounts
  for insert with check (auth.uid() = user_id);

create policy "accounts_update" on public.accounts
  for update using (auth.uid() = user_id);

create policy "accounts_delete" on public.accounts
  for delete using (auth.uid() = user_id);

-- trades — users only see/edit their own rows
drop policy if exists "trades_select" on public.trades;
drop policy if exists "trades_insert" on public.trades;
drop policy if exists "trades_update" on public.trades;
drop policy if exists "trades_delete" on public.trades;

create policy "trades_select" on public.trades
  for select using (auth.uid() = user_id);

create policy "trades_insert" on public.trades
  for insert with check (auth.uid() = user_id);

create policy "trades_update" on public.trades
  for update using (auth.uid() = user_id);

create policy "trades_delete" on public.trades
  for delete using (auth.uid() = user_id);

-- NOTE: The API routes (accounts, trades) use the service role key which
-- bypasses RLS. The browser client (profiles upsert during onboarding) uses
-- the anon key and is governed by RLS above.

  -- ──────────────────────────────────────────────────────────
  -- 4b. JOURNAL NOTES
  -- ──────────────────────────────────────────────────────────
  create table if not exists public.journal_notes (
    id           text        primary key,                          -- client-generated uuid
    user_id      uuid        not null references auth.users (id) on delete cascade,
    account_id   text        not null references public.accounts (id) on delete cascade,
    title        text        not null default 'New journal entry',
    body         text        not null default '',
    mood         text        not null default 'neutral'
                 check (mood in ('great','good','neutral','frustrated','tilted')),
    tags         text[]      not null default '{}',
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
  );

  create index if not exists journal_notes_user_id_idx    on public.journal_notes (user_id);
  create index if not exists journal_notes_account_id_idx on public.journal_notes (account_id);
  create index if not exists journal_notes_updated_at_idx on public.journal_notes (updated_at desc);

  create or replace trigger journal_notes_updated_at
    before update on public.journal_notes
    for each row execute function public.handle_updated_at();

  alter table public.journal_notes enable row level security;

  drop policy if exists "journal_notes_select" on public.journal_notes;
  drop policy if exists "journal_notes_insert" on public.journal_notes;
  drop policy if exists "journal_notes_update" on public.journal_notes;
  drop policy if exists "journal_notes_delete" on public.journal_notes;

  create policy "journal_notes_select" on public.journal_notes
    for select using (auth.uid() = user_id);
  create policy "journal_notes_insert" on public.journal_notes
    for insert with check (auth.uid() = user_id);
  create policy "journal_notes_update" on public.journal_notes
    for update using (auth.uid() = user_id);
  create policy "journal_notes_delete" on public.journal_notes
    for delete using (auth.uid() = user_id);
  