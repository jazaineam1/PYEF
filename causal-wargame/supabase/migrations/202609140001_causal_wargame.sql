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
  id uuid primary key default gen_random_uuid(), game_id uuid not null references public.cw_games(id) on delete cascade,
  position int not null check (position between 1 and 4), name text not null,
  score_impact int not null default 0, score_evidence int not null default 0, score_design int not null default 0,
  score_risk int not null default 0, score_adaptation int not null default 0,
  unique(game_id,position), unique(game_id,name)
);
create table if not exists public.cw_players (
  id uuid primary key default gen_random_uuid(), game_id uuid not null references public.cw_games(id) on delete cascade,
  team_id uuid not null references public.cw_teams(id) on delete cascade, display_name text not null,
  role_code text not null check (role_code in ('business','data','context','risk','integrator')),
  joined_at timestamptz not null default now(), last_seen_at timestamptz not null default now(), active boolean not null default true,
  unique(game_id,team_id,role_code)
);
create table if not exists public.cw_player_sessions (
  id uuid primary key default gen_random_uuid(), player_id uuid not null references public.cw_players(id) on delete cascade,
  token_hash bytea not null unique, expires_at timestamptz not null, created_at timestamptz not null default now()
);
create table if not exists public.cw_facilitator_sessions (
  id uuid primary key default gen_random_uuid(), game_id uuid not null references public.cw_games(id) on delete cascade,
  token_hash bytea not null unique, expires_at timestamptz not null, created_at timestamptz not null default now()
);
create table if not exists public.cw_role_cards (
  id bigint generated always as identity primary key, round_number int not null check (round_number between 1 and 4),
  role_code text not null, content text not null, unique(round_number,role_code)
);
create table if not exists public.cw_decisions (
  id uuid primary key default gen_random_uuid(), game_id uuid not null references public.cw_games(id) on delete cascade,
  round_number int not null check (round_number between 1 and 4), team_id uuid not null references public.cw_teams(id) on delete cascade,
  submitted_by uuid references public.cw_players(id), payload jsonb not null, result jsonb, idempotency_key text not null,
  locked_at timestamptz not null default now(), scored boolean not null default false,
  unique(game_id,round_number,team_id), unique(idempotency_key)
);
create table if not exists public.cw_microchecks (
  id uuid primary key default gen_random_uuid(), game_id uuid not null references public.cw_games(id) on delete cascade,
  round_number int not null check (round_number between 1 and 4), player_id uuid not null references public.cw_players(id) on delete cascade,
  answer text not null, correct boolean not null, submitted_at timestamptz not null default now(), unique(game_id,round_number,player_id)
);
create table if not exists public.cw_answer_keys (round_number int primary key, correct_answer text not null, concept text not null);
create table if not exists public.cw_ground_truth_customers (
 customer_id text primary key,name text not null,segment text not null,predictive_score numeric not null,p0 numeric not null,p1 numeric not null,cost numeric not null default 1,risk int not null default 1
);
create table if not exists public.cw_ground_truth_segments (segment_id text primary key,name text not null,effect_pp numeric not null,value_score numeric not null,risk int not null);
create table if not exists public.cw_scenario_parameters (key text primary key,value jsonb not null);
create table if not exists public.cw_events (
 id bigint generated always as identity primary key,game_id uuid not null references public.cw_games(id) on delete cascade,
 actor text not null,event_type text not null,payload jsonb not null default '{}'::jsonb,created_at timestamptz not null default now()
);

do $$ declare r record; begin
 for r in select tablename from pg_tables where schemaname='public' and tablename like 'cw_%' loop
  execute format('alter table public.%I enable row level security',r.tablename);
  execute format('revoke all on table public.%I from anon, authenticated',r.tablename);
  execute format('grant all on table public.%I to service_role',r.tablename);
 end loop;
end $$;
grant usage,select on all sequences in schema public to service_role;

create or replace function public.cw_validate_player_token(p_token text) returns public.cw_players language sql security invoker set search_path=public as $$
 select p.* from public.cw_player_sessions s join public.cw_players p on p.id=s.player_id where s.token_hash=digest(p_token,'sha256') and s.expires_at>now() and p.active=true limit 1;
$$;
create or replace function public.cw_validate_facilitator_token(p_token text) returns uuid language sql security invoker set search_path=public as $$
 select game_id from public.cw_facilitator_sessions where token_hash=digest(p_token,'sha256') and expires_at>now() limit 1;
$$;
create or replace function public.cw_bootstrap_game(p_code text,p_pin text) returns uuid language plpgsql security invoker set search_path=public as $$
declare gid uuid; names text[]:=array['Águila','Jaguar','Cóndor','Puma']; i int;
begin
 if length(trim(p_code))<4 or length(p_pin)<4 then raise exception 'Código y PIN deben tener al menos 4 caracteres'; end if;
 insert into public.cw_games(code,facilitator_pin_hash) values(upper(trim(p_code)),crypt(p_pin,gen_salt('bf'))) returning id into gid;
 for i in 1..4 loop insert into public.cw_teams(game_id,position,name) values(gid,i,names[i]); end loop;
 insert into public.cw_events(game_id,actor,event_type,payload) values(gid,'system','game_created',jsonb_build_object('code',upper(trim(p_code)))); return gid;
end $$;

create or replace function public.cw_join_game(p_code text,p_display_name text) returns jsonb language plpgsql security invoker set search_path=public as $$
declare g public.cw_games; n int; team_pos int; role_pos int; roles text[]:=array['business','data','context','risk','integrator']; tid uuid; pid uuid; tok text;
begin
 select * into g from public.cw_games where code=upper(trim(p_code)); if g.id is null then raise exception 'Partida no encontrada'; end if;
 select count(*) into n from public.cw_players where game_id=g.id and active; if n>=20 then raise exception 'La partida ya tiene 20 participantes'; end if;
 team_pos=(n/5)+1; role_pos=mod(n,5)+1; select id into tid from public.cw_teams where game_id=g.id and position=team_pos;
 insert into public.cw_players(game_id,team_id,display_name,role_code) values(g.id,tid,left(trim(p_display_name),80),roles[role_pos]) returning id into pid;
 tok=encode(gen_random_bytes(32),'hex'); insert into public.cw_player_sessions(player_id,token_hash,expires_at) values(pid,digest(tok,'sha256'),now()+interval '6 hours');
 insert into public.cw_events(game_id,actor,event_type,payload) values(g.id,pid::text,'player_joined',jsonb_build_object('team_id',tid,'role',roles[role_pos]));
 return jsonb_build_object('token',tok,'player_id',pid,'team_id',tid,'role_code',roles[role_pos]);
end $$;

create or replace function public.cw_facilitator_login(p_code text,p_pin text) returns text language plpgsql security invoker set search_path=public as $$
declare g public.cw_games; tok text; begin select * into g from public.cw_games where code=upper(trim(p_code)); if g.id is null or crypt(p_pin,g.facilitator_pin_hash)<>g.facilitator_pin_hash then raise exception 'Credenciales inválidas'; end if; tok=encode(gen_random_bytes(32),'hex'); insert into public.cw_facilitator_sessions(game_id,token_hash,expires_at) values(g.id,digest(tok,'sha256'),now()+interval '8 hours'); return tok; end $$;

create or replace function public.cw_submit_decision(p_token text,p_round int,p_payload jsonb,p_idempotency text) returns jsonb language plpgsql security invoker set search_path=public as $$
declare p public.cw_players; g public.cw_games; existing public.cw_decisions; did uuid; union_count int; invalid_count int;
begin
 if p_idempotency is null or length(p_idempotency)<8 then raise exception 'Idempotency key inválida'; end if;
 select * into p from public.cw_validate_player_token(p_token); if p.id is null then raise exception 'Sesión inválida'; end if;
 select * into g from public.cw_games where id=p.game_id; if g.status<>'round' or g.current_round<>p_round then raise exception 'La ronda no está abierta'; end if;
 select * into existing from public.cw_decisions where game_id=g.id and team_id=p.team_id and round_number=p_round;
 if existing.id is not null then if existing.idempotency_key=p_idempotency then return jsonb_build_object('ok',true,'decision_id',existing.id,'idempotent',true); end if; raise exception 'La decisión del equipo ya fue bloqueada'; end if;
 if p_round=1 then
  if jsonb_typeof(p_payload->'selected')<>'array' or jsonb_array_length(p_payload->'selected')<>10 then raise exception 'Debes seleccionar exactamente 10 clientes'; end if;
  select count(*) into invalid_count from jsonb_array_elements_text(p_payload->'selected') s(id) left join public.cw_ground_truth_customers c on c.customer_id=s.id where c.customer_id is null; if invalid_count>0 then raise exception 'Selección contiene clientes inválidos'; end if;
 elsif p_round=2 then
  if coalesce(p_payload->>'recommendation','') not in ('cancel','keep','redesign') then raise exception 'Recomendación inválida'; end if;
  if coalesce(p_payload->>'confounder','') not in ('edad','mora_previa','nombre') then raise exception 'Variable inválida'; end if;
  if length(trim(coalesce(p_payload->>'reason','')))<12 then raise exception 'Explica brevemente la decisión'; end if;
 elsif p_round=3 then
  if coalesce(p_payload->>'assignment','') not in ('advisor','model','random') then raise exception 'Asignación inválida'; end if;
  if coalesce(p_payload->>'outcome','') not in ('pago_30d','click') then raise exception 'Outcome inválido'; end if;
  if coalesce((p_payload->>'horizon')::int,0) not in (1,30,90) then raise exception 'Horizonte inválido'; end if;
 elsif p_round=4 then
  with all_ids as (select value id from jsonb_array_elements_text(coalesce(p_payload->'treat','[]'::jsonb)) union all select value from jsonb_array_elements_text(coalesce(p_payload->'avoid','[]'::jsonb)) union all select value from jsonb_array_elements_text(coalesce(p_payload->'observe','[]'::jsonb))) select count(distinct id),count(*) filter(where id not in ('digital','middle','traditional','wealth','arrears')) into union_count,invalid_count from all_ids;
  if invalid_count>0 or union_count<>5 then raise exception 'Debes clasificar exactamente los cinco segmentos una sola vez'; end if;
 end if;
 insert into public.cw_decisions(game_id,round_number,team_id,submitted_by,payload,idempotency_key) values(g.id,p_round,p.team_id,p.id,p_payload,p_idempotency) returning id into did;
 insert into public.cw_events(game_id,actor,event_type,payload) values(g.id,p.id::text,'decision_locked',jsonb_build_object('round',p_round,'team_id',p.team_id)); return jsonb_build_object('ok',true,'decision_id',did,'idempotent',false);
end $$;

-- Additional state/scoring RPCs are intentionally kept server-side and only service_role receives EXECUTE.
-- They expose predictive scores before reveal, potential outcomes only after reveal, and team scores without secret answer keys.

revoke all on all functions in schema public from public, anon, authenticated;
grant execute on all functions in schema public to service_role;
