-- DOS FUTUROS · Causal Wargame MVP
-- PostgreSQL / Supabase. All browser traffic goes through Edge Functions.
-- Public tables are deliberately unavailable to anon/authenticated roles.

create extension if not exists pgcrypto;

create table if not exists public.cw_games (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null default 'DOS FUTUROS · NEXO',
  facilitator_pin_hash text not null,
  status text not null default 'lobby' check (status in ('lobby','briefing','round','closed','reveal','teaching','microcheck','paused','finished')),
  current_round int not null default 1 check (current_round between 1 and 4),
  duration_seconds int not null default 480,
  started_at timestamptz,
  closes_at timestamptz,
  public_message text not null default 'Esperando al facilitador',
  created_at timestamptz not null default now()
);

create table if not exists public.cw_teams (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.cw_games(id) on delete cascade,
  position int not null check (position between 1 and 4),
  name text not null,
  score_impact int not null default 0,
  score_evidence int not null default 0,
  score_design int not null default 0,
  score_risk int not null default 0,
  score_adaptation int not null default 0,
  unique(game_id, position), unique(game_id, name)
);

create table if not exists public.cw_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.cw_games(id) on delete cascade,
  team_id uuid not null references public.cw_teams(id) on delete cascade,
  display_name text not null,
  role_code text not null check (role_code in ('business','data','context','risk','integrator')),
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  active boolean not null default true,
  unique(game_id, team_id, role_code)
);

create table if not exists public.cw_player_sessions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.cw_players(id) on delete cascade,
  token_hash bytea not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cw_facilitator_sessions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.cw_games(id) on delete cascade,
  token_hash bytea not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cw_role_cards (
  id bigint generated always as identity primary key,
  round_number int not null check (round_number between 1 and 4),
  role_code text not null,
  content text not null,
  unique(round_number, role_code)
);

create table if not exists public.cw_decisions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.cw_games(id) on delete cascade,
  round_number int not null check (round_number between 1 and 4),
  team_id uuid not null references public.cw_teams(id) on delete cascade,
  submitted_by uuid references public.cw_players(id),
  payload jsonb not null,
  result jsonb,
  idempotency_key text not null,
  locked_at timestamptz not null default now(),
  scored boolean not null default false,
  unique(game_id, round_number, team_id),
  unique(idempotency_key)
);

create table if not exists public.cw_microchecks (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.cw_games(id) on delete cascade,
  round_number int not null check (round_number between 1 and 4),
  player_id uuid not null references public.cw_players(id) on delete cascade,
  answer text not null,
  correct boolean not null,
  submitted_at timestamptz not null default now(),
  unique(game_id, round_number, player_id)
);

create table if not exists public.cw_answer_keys (
  round_number int primary key,
  correct_answer text not null,
  concept text not null
);

create table if not exists public.cw_ground_truth_customers (
  customer_id text primary key,
  name text not null,
  segment text not null,
  predictive_score numeric not null,
  p0 numeric not null,
  p1 numeric not null,
  cost numeric not null default 1,
  risk int not null default 1
);

create table if not exists public.cw_ground_truth_segments (
  segment_id text primary key,
  name text not null,
  effect_pp numeric not null,
  value_score numeric not null,
  risk int not null
);

create table if not exists public.cw_scenario_parameters (
  key text primary key,
  value jsonb not null
);

create table if not exists public.cw_events (
  id bigint generated always as identity primary key,
  game_id uuid not null references public.cw_games(id) on delete cascade,
  actor text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Defense in depth. Browser roles cannot touch game tables directly.
do $$ declare r record; begin
  for r in select tablename from pg_tables where schemaname='public' and tablename like 'cw_%'
  loop
    execute format('alter table public.%I enable row level security', r.tablename);
    execute format('revoke all on table public.%I from anon, authenticated', r.tablename);
    execute format('grant all on table public.%I to service_role', r.tablename);
  end loop;
end $$;

grant usage, select on all sequences in schema public to service_role;

-- Scenario content and answer keys are intentionally NOT committed.
-- Generate scenario-private.sql with scripts/generate_secure_scenario.py and execute it after this migration.
