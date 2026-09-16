-- Adaptive attendance topology for the four-role architecture.
-- Core invariant: no team has a fifth role. We vary the number of teams instead.
-- 15 -> 4 teams (4,4,4,3)
-- 16 -> 4 teams (4,4,4,4)
-- 17 -> 5 teams (4,4,3,3,3)
-- 18 -> 5 teams (4,4,4,3,3)
-- 19 -> 5 teams (4,4,4,4,3)
-- 20 -> 5 teams (4,4,4,4,4)
-- 21..24 -> 6 teams; 25..28 -> 7 teams. 28 -> 7 x 4.

-- ---------------------------------------------------------------------------
-- 1) Game-level roster controls
-- ---------------------------------------------------------------------------
alter table public.cw_games add column if not exists team_target int not null default 4;
alter table public.cw_games add column if not exists roster_locked boolean not null default false;
alter table public.cw_games add column if not exists max_humans int not null default 28;

alter table public.cw_games drop constraint if exists cw_games_team_target_check;
alter table public.cw_games add constraint cw_games_team_target_check check(team_target between 1 and 7);
alter table public.cw_games drop constraint if exists cw_games_max_humans_check;
alter table public.cw_games add constraint cw_games_max_humans_check check(max_humans between 1 and 28);

-- Seven canonical team slots let the same four roles scale cleanly to 28 people.
alter table public.cw_teams drop constraint if exists cw_teams_position_check;
alter table public.cw_teams add constraint cw_teams_position_check check(position between 1 and 7);

-- Rebalancing can swap team/role seats inside one transaction. Make the seat
-- uniqueness check deferrable so a deterministic remap cannot fail mid-swap.
alter table public.cw_players drop constraint if exists cw_players_game_id_team_id_role_code_key;
alter table public.cw_players
  add constraint cw_players_game_id_team_id_role_code_key
  unique(game_id,team_id,role_code) deferrable initially deferred;

create or replace function public.cw_recommended_team_count(p_humans int)
returns int language sql immutable set search_path=public as $$
  select case
    when coalesce(p_humans,0)=0 then 4
    else least(7,greatest(1,ceil(coalesce(p_humans,0)/4.0)::int))
  end
$$;

create or replace function public.cw_ensure_team_rows(p_game_id uuid)
returns void language plpgsql security invoker set search_path=public as $$
declare
  names text[]:=array['Fisher','Neyman','Rubin','Pearl','Robins','Imbens','Rosenbaum'];
  i int;
begin
  for i in 1..7 loop
    insert into public.cw_teams(game_id,position,name)
    values(p_game_id,i,names[i])
    on conflict(game_id,position) do update set name=excluded.name;
  end loop;
end $$;

-- Ensure current games have all possible rows. Hidden/inactive rows are filtered
-- from participant, wall and facilitator state later in this migration.
do $$ declare r record; begin
  for r in select id from public.cw_games loop
    perform public.cw_ensure_team_rows(r.id);
  end loop;
end $$;

-- Protect an already-running historical 4x5 session. Resetting it later moves it
-- to the adaptive four-role topology.
update public.cw_games g
set team_target=4, roster_locked=true, max_humans=20
where exists(
  select 1 from public.cw_players p
  where p.game_id=g.id and p.active and p.role_code='risk'
);

-- Empty/non-legacy sessions are ready for the adaptive topology.
update public.cw_games g
set team_target=public.cw_recommended_team_count((select count(*) from public.cw_players p where p.game_id=g.id and p.active and not p.is_bot)),
    max_humans=28
where not exists(
  select 1 from public.cw_players p
  where p.game_id=g.id and p.active and p.role_code='risk'
);

-- ---------------------------------------------------------------------------
-- 2) Deterministic lobby rebalance
-- ---------------------------------------------------------------------------
create or replace function public.cw_rebalance_lobby_roster(p_game_id uuid)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare
  g public.cw_games;
  human_count int;
  target_teams int;
  legacy boolean:=false;
begin
  select * into g from public.cw_games where id=p_game_id for update;
  if g.id is null then raise exception 'Partida no encontrada'; end if;

  select exists(
    select 1 from public.cw_players p
    where p.game_id=p_game_id and p.active and p.role_code='risk'
  ) into legacy;

  if legacy then
    update public.cw_games set team_target=4,roster_locked=true,max_humans=20 where id=p_game_id;
    return jsonb_build_object('ok',true,'legacy',true,'team_target',4,'humans',(select count(*) from public.cw_players where game_id=p_game_id and active and not is_bot));
  end if;

  if g.roster_locked or g.status not in ('lobby','briefing') then
    return jsonb_build_object('ok',true,'locked',g.roster_locked,'team_target',g.team_target,'humans',(select count(*) from public.cw_players where game_id=p_game_id and active and not is_bot));
  end if;

  perform public.cw_ensure_team_rows(p_game_id);

  -- Humans define the real classroom topology. Rehearsal bots are disposable and
  -- never allowed to force a human into a worse team/role.
  delete from public.cw_players p where p.game_id=p_game_id and p.is_bot;

  select count(*) into human_count
  from public.cw_players p
  where p.game_id=p_game_id and p.active and not p.is_bot;

  if human_count>g.max_humans then
    raise exception 'La partida supera el máximo de % participantes',g.max_humans;
  end if;

  target_teams:=public.cw_recommended_team_count(human_count);

  set constraints cw_players_game_id_team_id_role_code_key deferred;

  -- Role waves guarantee that every 3-person team lacks only Experiments, which
  -- is precisely the responsibility Modelos can cover with its explicit module.
  with ordered as (
    select p.id,row_number() over(order by p.joined_at,p.id) as rn
    from public.cw_players p
    where p.game_id=p_game_id and p.active and not p.is_bot
  ), assigned as (
    select o.id,
      ((o.rn-1)%target_teams)+1 as team_pos,
      case ((o.rn-1)/target_teams)
        when 0 then 'business'
        when 1 then 'data'
        when 2 then 'context'
        else 'integrator'
      end as role_code
    from ordered o
  )
  update public.cw_players p
  set team_id=t.id,role_code=a.role_code
  from assigned a
  join public.cw_teams t on t.game_id=p_game_id and t.position=a.team_pos
  where p.id=a.id;

  update public.cw_games
  set team_target=target_teams,max_humans=28
  where id=p_game_id;

  insert into public.cw_events(game_id,actor,event_type,payload)
  values(p_game_id,'system','roster_rebalanced',jsonb_build_object(
    'humans',human_count,
    'teams',target_teams,
    'sizes',(select jsonb_agg(cnt order by position) from (
      select t.position,count(p.id)::int cnt
      from public.cw_teams t
      left join public.cw_players p on p.team_id=t.id and p.active and not p.is_bot
      where t.game_id=p_game_id and t.position<=target_teams
      group by t.position
    ) s)
  ));

  return jsonb_build_object(
    'ok',true,
    'legacy',false,
    'humans',human_count,
    'team_target',target_teams,
    'sizes',(select jsonb_agg(cnt order by position) from (
      select t.position,count(p.id)::int cnt
      from public.cw_teams t
      left join public.cw_players p on p.team_id=t.id and p.active and not p.is_bot
      where t.game_id=p_game_id and t.position<=target_teams
      group by t.position
    ) s)
  );
end $$;

-- ---------------------------------------------------------------------------
-- 3) New games have seven available team rows but show only the active target.
-- ---------------------------------------------------------------------------
create or replace function public.cw_bootstrap_game(p_code text,p_pin text)
returns uuid language plpgsql set search_path=public as $$
declare
  gid uuid;
begin
  if length(trim(p_code))<4 or length(p_pin)<8 then
    raise exception 'Código mínimo 4 caracteres y PIN mínimo 8 caracteres';
  end if;
  insert into public.cw_games(code,facilitator_pin_hash,team_target,roster_locked,max_humans)
  values(upper(trim(p_code)),extensions.crypt(p_pin,extensions.gen_salt('bf')),4,false,28)
  returning id into gid;
  perform public.cw_ensure_team_rows(gid);
  insert into public.cw_events(game_id,actor,event_type,payload)
  values(gid,'system','game_created',jsonb_build_object('code',upper(trim(p_code)),'core_roles',4,'max_humans',28));
  return gid;
end $$;

-- ---------------------------------------------------------------------------
-- 4) Join/rejoin: stable identity + automatic rebalance before the roster freezes.
-- ---------------------------------------------------------------------------
create or replace function public.cw_join_game(p_code text,p_display_name text,p_client_key text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare
  g public.cw_games;
  p public.cw_players;
  tid uuid;
  pid uuid;
  provisional_role text;
  tok text;
  c_hash bytea;
  n_humans int;
  normalized_name text;
  rb jsonb;
begin
  select * into g from public.cw_games where code=upper(trim(p_code)) for update;
  if g.id is null then raise exception 'Partida no encontrada'; end if;
  if g.status='finished' then raise exception 'La partida ya terminó'; end if;
  if length(trim(coalesce(p_display_name,'')))<2 then raise exception 'Nombre obligatorio'; end if;
  normalized_name:=lower(regexp_replace(trim(p_display_name),'\s+',' ','g'));
  if length(normalized_name)>80 then raise exception 'El nombre es demasiado largo'; end if;
  if nullif(trim(coalesce(p_client_key,'')),'') is not null then c_hash:=extensions.digest(trim(p_client_key),'sha256'); end if;

  -- Exact browser identity wins over the visible name. This remains valid after
  -- the roster is frozen and therefore restores the exact same seat.
  if c_hash is not null then
    select q.* into p
    from public.cw_player_identities i
    join public.cw_players q on q.id=i.player_id
    where i.game_id=g.id and i.client_key_hash=c_hash
    limit 1;
    if p.id is not null then
      update public.cw_players set active=true,last_seen_at=now() where id=p.id;
      tok:=encode(extensions.gen_random_bytes(32),'hex');
      insert into public.cw_player_sessions(player_id,token_hash,expires_at)
      values(p.id,extensions.digest(tok,'sha256'),now()+interval '6 hours');
      select * into p from public.cw_players where id=p.id;
      insert into public.cw_events(game_id,actor,event_type,payload)
      values(g.id,p.id::text,'player_rejoined',jsonb_build_object('team_id',p.team_id,'role',p.role_code));
      return jsonb_build_object('token',tok,'resumed',true,'roster_locked',g.roster_locked,'player',jsonb_build_object('id',p.id,'team_id',p.team_id,'role_code',p.role_code,'display_name',p.display_name));
    end if;
  end if;

  -- A visible duplicate from a different identity is not allowed to occupy a
  -- second seat accidentally.
  if exists(
    select 1 from public.cw_players q
    where q.game_id=g.id and not q.is_bot
      and lower(regexp_replace(trim(q.display_name),'\s+',' ','g'))=normalized_name
  ) then
    raise exception 'Ese nombre ya está registrado en esta partida. Si eres la misma persona, vuelve desde el dispositivo original; si son dos personas distintas, usa nombre y apellido.';
  end if;

  if g.roster_locked or g.status not in ('lobby','briefing') then
    raise exception 'La lista ya está cerrada. Sólo pueden reingresar participantes ya registrados.';
  end if;

  select count(*) into n_humans from public.cw_players q where q.game_id=g.id and q.active and not q.is_bot;
  if n_humans>=g.max_humans then raise exception 'La partida alcanzó % participantes',g.max_humans; end if;

  perform public.cw_ensure_team_rows(g.id);

  -- If rehearsal bots existed, humans take precedence. Rebalance removes all
  -- rehearsal bots and restores a human-only topology before inserting the new seat.
  if exists(select 1 from public.cw_players q where q.game_id=g.id and q.is_bot) then
    perform public.cw_rebalance_lobby_roster(g.id);
  end if;

  -- Temporary free seat. The deterministic rebalance immediately below assigns
  -- the final team and role while preserving this player id and session identity.
  select t.id,v.role_code into tid,provisional_role
  from public.cw_teams t
  cross join (values ('business',1),('data',2),('context',3),('integrator',4)) v(role_code,role_pos)
  where t.game_id=g.id and t.position between 1 and 7
    and not exists(select 1 from public.cw_players q where q.game_id=g.id and q.team_id=t.id and q.role_code=v.role_code)
  order by v.role_pos,t.position
  limit 1;
  if tid is null then raise exception 'No hay cupos disponibles'; end if;

  insert into public.cw_players(game_id,team_id,display_name,role_code,is_bot)
  values(g.id,tid,left(trim(p_display_name),80),provisional_role,false)
  returning id into pid;

  if c_hash is not null then
    insert into public.cw_player_identities(player_id,game_id,client_key_hash,name_key)
    values(pid,g.id,c_hash,normalized_name);
  end if;

  select public.cw_rebalance_lobby_roster(g.id) into rb;
  select * into p from public.cw_players where id=pid;

  tok:=encode(extensions.gen_random_bytes(32),'hex');
  insert into public.cw_player_sessions(player_id,token_hash,expires_at)
  values(pid,extensions.digest(tok,'sha256'),now()+interval '6 hours');
  insert into public.cw_events(game_id,actor,event_type,payload)
  values(g.id,pid::text,'player_joined',jsonb_build_object('team_id',p.team_id,'role',p.role_code,'human_number',n_humans+1,'team_target',rb->'team_target'));

  return jsonb_build_object('token',tok,'resumed',false,'roster_locked',false,'team_target',rb->'team_target','player',jsonb_build_object('id',p.id,'team_id',p.team_id,'role_code',p.role_code,'display_name',p.display_name));
end $$;

create or replace function public.cw_join_game(p_code text,p_display_name text)
returns jsonb language sql security invoker set search_path=public as $$
  select public.cw_join_game(p_code,p_display_name,null::text)
$$;

revoke all on function public.cw_join_game(text,text,text) from public,anon,authenticated;
revoke all on function public.cw_join_game(text,text) from public,anon,authenticated;
grant execute on function public.cw_join_game(text,text,text) to service_role;
grant execute on function public.cw_join_game(text,text) to service_role;

-- ---------------------------------------------------------------------------
-- 5) Adaptive rehearsal bots: complete the current matrix, never replace humans.
-- ---------------------------------------------------------------------------
create or replace function public.cw_seed_rehearsal_bots(p_game_id uuid)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare
  g public.cw_games;
  human_count int;
  active_count int;
  target_teams int;
  target int;
  slot record;
  added int:=0;
begin
  select * into g from public.cw_games where id=p_game_id for update;
  if g.id is null then raise exception 'Partida no encontrada'; end if;
  if g.status not in ('lobby','briefing') or g.roster_locked then raise exception 'Los bots de ensayo sólo pueden prepararse antes de cerrar la lista'; end if;

  perform public.cw_rebalance_lobby_roster(p_game_id);
  select * into g from public.cw_games where id=p_game_id;
  select count(*) into human_count from public.cw_players where game_id=p_game_id and active and not is_bot;

  -- Keep the traditional 20-seat rehearsal when the real attendance is small;
  -- scale to 24/28 automatically when the human roster already requires it.
  target_teams:=greatest(5,g.team_target);
  target:=least(g.max_humans,target_teams*4);
  update public.cw_games set team_target=target_teams where id=p_game_id;

  select count(*) into active_count from public.cw_players where game_id=p_game_id and active;
  for slot in
    select t.id team_id,t.position,v.role_code,v.role_pos,t.name team_name
    from public.cw_teams t
    cross join (values ('business',1),('data',2),('context',3),('integrator',4)) v(role_code,role_pos)
    where t.game_id=p_game_id and t.position<=target_teams
      and not exists(select 1 from public.cw_players p where p.game_id=p_game_id and p.team_id=t.id and p.role_code=v.role_code)
    order by v.role_pos,t.position
  loop
    exit when active_count>=target;
    insert into public.cw_players(game_id,team_id,display_name,role_code,is_bot,last_seen_at)
    values(p_game_id,slot.team_id,'BOT · '||slot.team_name||' · '||slot.role_code,slot.role_code,true,now());
    active_count:=active_count+1; added:=added+1;
  end loop;

  insert into public.cw_events(game_id,actor,event_type,payload)
  values(p_game_id,'facilitator','rehearsal_bots_seeded',jsonb_build_object('added',added,'target',target,'teams',target_teams,'core_roles',4));
  return jsonb_build_object('ok',true,'added',added,'players',active_count,'humans',human_count,'bots',active_count-human_count,'team_target',target_teams,'target',target);
end $$;

-- ---------------------------------------------------------------------------
-- 6) Facilitator state machine: rebalance while waiting, freeze at first lesson.
-- ---------------------------------------------------------------------------
create or replace function public.cw_facilitator_transition(p_token text,p_action text,p_seconds int default 60)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare
  gid uuid;
  g public.cw_games;
  remaining int;
  human_count int;
  bot_result jsonb;
  bot_decisions int;
  roster_result jsonb;
  removed int:=0;
begin
  gid:=public.cw_validate_facilitator_token(p_token); if gid is null then raise exception 'Sesión de facilitador inválida'; end if;
  perform public.cw_auto_close_round(gid);
  select * into g from public.cw_games where id=gid for update;

  if p_action='seed_bots' then
    bot_result:=public.cw_seed_rehearsal_bots(gid); return bot_result;
  elsif p_action='rebalance' then
    if g.roster_locked then raise exception 'La lista ya está cerrada'; end if;
    return public.cw_rebalance_lobby_roster(gid);
  elsif p_action='prune_offline' then
    if g.roster_locked or g.status not in ('lobby','briefing') then raise exception 'Sólo puedes depurar ausentes antes de cerrar la lista'; end if;
    delete from public.cw_players p
    where p.game_id=gid and not p.is_bot and p.last_seen_at<now()-make_interval(secs=>greatest(60,p_seconds))
    returning 1 into removed;
    get diagnostics removed = row_count;
    select public.cw_rebalance_lobby_roster(gid) into roster_result;
    insert into public.cw_events(game_id,actor,event_type,payload)
    values(gid,'facilitator','offline_players_pruned',jsonb_build_object('removed',removed,'threshold_seconds',greatest(60,p_seconds)));
    return jsonb_build_object('ok',true,'removed',removed,'roster',roster_result);
  elsif p_action='bot_decisions' then
    if g.status<>'round' then raise exception 'Los bots sólo pueden decidir durante una ronda abierta'; end if;
    bot_decisions:=public.cw_generate_bot_decisions(gid,g.current_round); return jsonb_build_object('ok',true,'bot_decisions',bot_decisions);
  elsif p_action='lesson' then
    select count(*) into human_count from public.cw_players where game_id=gid and active and not is_bot;
    if human_count=0 then raise exception 'No hay participantes humanos'; end if;
    if g.status not in ('lobby','briefing') then raise exception 'La mini-clase sólo puede comenzar desde briefing/lobby'; end if;
    if g.current_round=1 and not g.roster_locked then
      select public.cw_rebalance_lobby_roster(gid) into roster_result;
      update public.cw_games set roster_locked=true where id=gid;
    end if;
    update public.cw_games set status='lesson',started_at=null,closes_at=null,paused_remaining_seconds=null,public_message='Mini-clase de la ronda '||current_round||' · equipos y roles confirmados' where id=gid;
  elsif p_action='open' then
    select count(*) into human_count from public.cw_players where game_id=gid and active and not is_bot;
    if human_count=0 then raise exception 'No hay participantes humanos'; end if;
    if g.status<>'lesson' then raise exception 'Primero debes presentar el concepto de la ronda'; end if;
    update public.cw_games set status='round',started_at=now(),closes_at=now()+make_interval(secs=>duration_seconds),paused_remaining_seconds=null,public_message='Laboratorio de la ronda '||current_round||' abierto · trabajen por roles' where id=gid;
    perform public.cw_generate_bot_decisions(gid,g.current_round);
  elsif p_action='close' then
    if g.status not in ('round','paused') then raise exception 'La ronda no está abierta'; end if;
    update public.cw_games set status='closed',closes_at=now(),paused_remaining_seconds=null,public_message='Decisiones cerradas · regresen a sala principal' where id=gid;
  elsif p_action='reveal' then
    if g.status<>'closed' then raise exception 'Primero debes cerrar la ronda'; end if;
    perform public.cw_score_round(gid,g.current_round);
    update public.cw_games set status='reveal',public_message=case when current_round=1 then 'VER EL OTRO FUTURO' else 'Reveal ronda '||current_round end where id=gid;
  elsif p_action='teach' then
    if g.status<>'reveal' then raise exception 'Primero muestra el reveal'; end if;
    update public.cw_games set status='teaching',public_message='Debrief · conecta lo ocurrido con el concepto formal' where id=gid;
  elsif p_action='microcheck' then
    if g.status<>'teaching' then raise exception 'Primero realiza el debrief'; end if;
    update public.cw_games set status='microcheck',public_message='Microcheck individual · no da puntos al equipo' where id=gid;
  elsif p_action='next' then
    if g.status not in ('microcheck','teaching','reveal') then raise exception 'Completa reveal/debrief antes de continuar'; end if;
    if g.current_round>=4 then update public.cw_games set status='finished',closes_at=null,paused_remaining_seconds=null,public_message='Partida finalizada' where id=gid;
    else update public.cw_games set current_round=current_round+1,status='briefing',started_at=null,closes_at=null,paused_remaining_seconds=null,public_message='Ronda '||(current_round+1)||' lista para mini-clase' where id=gid; end if;
  elsif p_action='pause' then
    if g.status<>'round' then raise exception 'Sólo puedes pausar un laboratorio abierto'; end if;
    remaining:=greatest(0,ceil(extract(epoch from (g.closes_at-now())))::int);
    update public.cw_games set status='paused',paused_remaining_seconds=remaining,closes_at=null,public_message='Laboratorio pausado' where id=gid;
  elsif p_action='resume' then
    if g.status<>'paused' then raise exception 'La partida no está pausada'; end if;
    remaining:=greatest(1,coalesce(g.paused_remaining_seconds,g.duration_seconds));
    update public.cw_games set status='round',closes_at=now()+make_interval(secs=>remaining),paused_remaining_seconds=null,public_message='Laboratorio reanudado' where id=gid;
  elsif p_action='add_time' then
    if g.status='paused' then update public.cw_games set paused_remaining_seconds=greatest(1,coalesce(paused_remaining_seconds,duration_seconds))+greatest(1,p_seconds) where id=gid;
    elsif g.status='round' then update public.cw_games set closes_at=greatest(coalesce(closes_at,now()),now())+make_interval(secs=>greatest(1,p_seconds)) where id=gid;
    else raise exception 'Sólo puedes añadir tiempo al laboratorio'; end if;
  elsif p_action='reset' then
    delete from public.cw_microchecks where game_id=gid;
    delete from public.cw_decisions where game_id=gid;
    delete from public.cw_player_sessions where player_id in (select id from public.cw_players where game_id=gid);
    delete from public.cw_players where game_id=gid;
    update public.cw_teams set score_impact=0,score_evidence=0,score_design=0,score_risk=0,score_adaptation=0 where game_id=gid;
    update public.cw_games set status='lobby',current_round=1,started_at=null,closes_at=null,paused_remaining_seconds=null,public_message='Esperando participantes · nueva sesión',team_target=4,roster_locked=false,max_humans=28 where id=gid;
  else raise exception 'Acción no soportada'; end if;

  insert into public.cw_events(game_id,actor,event_type,payload)
  values(gid,'facilitator','transition',jsonb_build_object('action',p_action,'round',g.current_round));
  return jsonb_build_object('ok',true);
end $$;

revoke all on function public.cw_recommended_team_count(int) from public,anon,authenticated;
revoke all on function public.cw_ensure_team_rows(uuid) from public,anon,authenticated;
revoke all on function public.cw_rebalance_lobby_roster(uuid) from public,anon,authenticated;
revoke all on function public.cw_seed_rehearsal_bots(uuid) from public,anon,authenticated;
revoke all on function public.cw_facilitator_transition(text,text,int) from public,anon,authenticated;
grant execute on function public.cw_recommended_team_count(int) to service_role;
grant execute on function public.cw_ensure_team_rows(uuid) to service_role;
grant execute on function public.cw_rebalance_lobby_roster(uuid) to service_role;
grant execute on function public.cw_seed_rehearsal_bots(uuid) to service_role;
grant execute on function public.cw_facilitator_transition(text,text,int) to service_role;
