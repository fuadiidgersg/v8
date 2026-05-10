-- Run this in your Supabase SQL Editor
-- (Re-run safely — all statements use IF NOT EXISTS / OR REPLACE)

-- ──────────────────────────────────────────────────────────────
-- Profiles table (linked to Supabase auth.users)
-- ──────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  display_name text not null,
  experience text not null default 'beginner',
  preferred_pair text not null default '',
  starting_capital numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy if not exists "Users can view their own profile"
  on public.profiles for select using (auth.uid() = id);
create policy if not exists "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy if not exists "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);


-- ──────────────────────────────────────────────────────────────
-- Trading accounts table
-- ──────────────────────────────────────────────────────────────
create table if not exists public.accounts (
  id text not null,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  broker text not null default '',
  number text not null default '',
  type text not null default 'live',
  currency text not null default 'USD',
  starting_balance numeric not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (id, user_id)
);

alter table public.accounts enable row level security;

create policy if not exists "Users can manage their own accounts"
  on public.accounts for all using (auth.uid() = user_id);


-- ──────────────────────────────────────────────────────────────
-- Trades table
-- ──────────────────────────────────────────────────────────────
create table if not exists public.trades (
  id text not null,
  user_id uuid references auth.users on delete cascade not null,
  account_id text not null,
  account text not null default '',
  pair text not null,
  direction text not null,
  entry numeric not null,
  exit numeric not null,
  stop_loss numeric,
  take_profit numeric,
  lots numeric not null default 0,
  pnl numeric not null default 0,
  pips numeric not null default 0,
  r_multiple numeric not null default 0,
  status text not null default 'open',
  opened_at timestamptz not null,
  closed_at timestamptz not null,
  strategy text,
  session text,
  timeframe text,
  emotion text,
  notes text,
  mistakes text,
  lessons text,
  risk_amount numeric,
  screenshot_url text,
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  primary key (id, user_id)
);

alter table public.trades enable row level security;

create policy if not exists "Users can manage their own trades"
  on public.trades for all using (auth.uid() = user_id);


-- ──────────────────────────────────────────────────────────────
-- Auto-update updated_at on profiles
-- ──────────────────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();
