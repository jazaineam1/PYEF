create extension if not exists pgcrypto;

create table if not exists public.cg_games(
  id uuid primary key default gen_random_uuid(), code text unique not null, title text not null default 'DOS FUTUROS', status text not null default 'lobby', current_round int not null default 1 check(current_round between 1 and 4), phase text not null default 'lobby', closes_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.cg_teams(
  id uuid primary key default gen_random_uuid(), game_id uuid not null references public.cg_games(id) on delete cascade, name text not null, ordinal int not null, unique(game_id,name), unique(game_id,ordinal)
);
create table if not exists public.cg_players(
  id uuid primary key default gen_random_uuid(), game_id uuid not null references public.cg_games(id) on delete cascade, team_id uuid not null references public.cg_teams(id) on delete cascade, display_name text not null, role_code text not null, token_hash text unique not null, joined_at timestamptz not null default now(), last_seen_at timestamptz not null default now(), unique(game_id,team_id,role_code)
);
create table if not exists public.cg_decisions(
  id uuid primary key default gen_random_uuid(), game_id uuid not null references public.cg_games(id) on delete cascade, team_id uuid not null references public.cg_teams(id) on delete cascade, round_no int not null check(round_no between 1 and 4), payload jsonb not null, submitted_by uuid references public.cg_players(id), locked_at timestamptz not null default now(), idempotency_key text unique not null, unique(game_id,team_id,round_no)
);
create table if not exists public.cg_checks(
  id uuid primary key default gen_random_uuid(), game_id uuid not null references public.cg_games(id) on delete cascade, player_id uuid not null references public.cg_players(id) on delete cascade, round_no int not null, answer text not null, correct boolean, submitted_at timestamptz not null default now(), unique(game_id,player_id,round_no)
);
create table if not exists public.cg_scores(
  game_id uuid not null references public.cg_games(id) on delete cascade, team_id uuid not null references public.cg_teams(id) on delete cascade, impact int not null default 0, evidence int not null default 0, design int not null default 0, risk int not null default 0, adaptation int not null default 0, primary key(game_id,team_id)
);
create table if not exists public.cg_role_cards(
  id bigserial primary key, game_id uuid not null references public.cg_games(id) on delete cascade, round_no int not null, role_code text not null, content text not null, unique(game_id,round_no,role_code)
);
create table if not exists public.cg_ground_truth(
  game_id uuid not null references public.cg_games(id) on delete cascade, customer_id text not null, p0 numeric not null check(p0 between 0 and 1), p1 numeric not null check(p1 between 0 and 1), effect numeric generated always as (p1-p0) stored, risk numeric not null default 0, primary key(game_id,customer_id)
);
create table if not exists public.cg_segment_truth(
  game_id uuid not null references public.cg_games(id) on delete cascade, segment_id text not null, effect numeric not null, primary key(game_id,segment_id)
);
create table if not exists public.cg_events(
  id bigserial primary key, game_id uuid not null references public.cg_games(id) on delete cascade, actor text not null, event_type text not null, payload jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

alter table public.cg_games enable row level security;
alter table public.cg_teams enable row level security;
alter table public.cg_players enable row level security;
alter table public.cg_decisions enable row level security;
alter table public.cg_checks enable row level security;
alter table public.cg_scores enable row level security;
alter table public.cg_role_cards enable row level security;
alter table public.cg_ground_truth enable row level security;
alter table public.cg_segment_truth enable row level security;
alter table public.cg_events enable row level security;
revoke all on public.cg_games,public.cg_teams,public.cg_players,public.cg_decisions,public.cg_checks,public.cg_scores,public.cg_role_cards,public.cg_ground_truth,public.cg_segment_truth,public.cg_events from anon,authenticated;

create or replace function public.cg_claim_player_slot(p_game_id uuid, p_display_name text, p_token_hash text)
returns table(player_id uuid, team_id uuid, role_code text)
language plpgsql
security invoker
set search_path = public
as $$
declare
  n int;
  team_ordinal int;
  role_idx int;
  picked_team uuid;
  picked_role text;
begin
  perform pg_advisory_xact_lock(hashtext(p_game_id::text));
  select count(*) into n from public.cg_players where game_id=p_game_id;
  if n >= 20 then raise exception 'GAME_FULL'; end if;
  team_ordinal := floor(n/5.0)::int;
  role_idx := mod(n,5)+1;
  select id into picked_team from public.cg_teams where game_id=p_game_id and ordinal=team_ordinal;
  picked_role := (array['negocio','datos','contexto','riesgo','integrador'])[role_idx];
  insert into public.cg_players(game_id,team_id,display_name,role_code,token_hash)
  values(p_game_id,picked_team,left(p_display_name,50),picked_role,p_token_hash)
  returning id, cg_players.team_id, cg_players.role_code into player_id, team_id, role_code;
  return next;
end $$;
revoke all on function public.cg_claim_player_slot(uuid,text,text) from public,anon,authenticated;
grant execute on function public.cg_claim_player_slot(uuid,text,text) to service_role;
