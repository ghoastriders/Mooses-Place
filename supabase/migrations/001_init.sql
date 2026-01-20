-- Mooses Place: core schema
-- Run in Supabase SQL editor or via Supabase CLI migrations.

create extension if not exists "pgcrypto";

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  region text not null,
  game_type text not null check (game_type in ('national','ak_charitable')),
  rules jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.draws (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  draw_date date not null,
  numbers jsonb not null,
  source text,
  created_at timestamptz not null default now(),
  unique (game_id, draw_date)
);

create index if not exists draws_game_date_idx on public.draws (game_id, draw_date desc);

create table if not exists public.saved_picks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  game_id uuid not null references public.games(id) on delete cascade,
  label text,
  numbers jsonb not null,
  strategy text,
  created_at timestamptz not null default now()
);

create index if not exists saved_picks_user_idx on public.saved_picks (user_id, created_at desc);

create table if not exists public.game_sources (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  source_type text not null, -- official_csv, official_json, manual, scraped
  source_url text,
  notes text,
  last_import_at timestamptz,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.games enable row level security;
alter table public.draws enable row level security;
alter table public.saved_picks enable row level security;
alter table public.game_sources enable row level security;

-- Public read access for games + draws
create policy "public read games" on public.games for select using (is_active = true);
create policy "public read draws" on public.draws for select using (true);

-- Saved picks: user can manage their own
create policy "user select saved" on public.saved_picks for select using (auth.uid() = user_id);
create policy "user insert saved" on public.saved_picks for insert with check (auth.uid() = user_id);
create policy "user update saved" on public.saved_picks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user delete saved" on public.saved_picks for delete using (auth.uid() = user_id);

-- Game sources: restrict (admin-only); for MVP, disallow all from client
create policy "deny all sources" on public.game_sources for all using (false) with check (false);
