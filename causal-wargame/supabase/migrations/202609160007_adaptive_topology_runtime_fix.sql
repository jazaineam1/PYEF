-- Runtime fixes for adaptive topology.
-- 1) Seeding rehearsal bots closes the roster explicitly so first lesson does not
--    rebalance them away.
-- 2) Offline pruning counts arbitrary numbers of rows safely.

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
  if g.status not in ('lobby','briefing') or g.roster_locked then
    raise exception 'Los bots de ensayo sólo pueden prepararse con la lista abierta';
  end if;

  perform public.cw_rebalance_lobby_roster(p_game_id);
  select * into g from public.cw_games where id=p_game_id;
  select count(*) into human_count
  from public.cw_players where game_id=p_game_id and active and not is_bot;

  target_teams:=greatest(5,g.team_target);
  target:=least(g.max_humans,target_teams*4);
  update public.cw_games set team_target=target_teams where id=p_game_id;

  select count(*) into active_count
  from public.cw_players where game_id=p_game_id and active;

  for slot in
    select t.id team_id,t.position,v.role_code,v.role_pos,t.name team_name
    from public.cw_teams t
    cross join (values ('business',1),('data',2),('context',3),('integrator',4)) v(role_code,role_pos)
    where t.game_id=p_game_id and t.position<=target_teams
      and not exists(
        select 1 from public.cw_players p
        where p.game_id=p_game_id and p.team_id=t.id and p.role_code=v.role_code
      )
    order by v.role_pos,t.position
  loop
    exit when active_count>=target;
    insert into public.cw_players(game_id,team_id,display_name,role_code,is_bot,last_seen_at)
    values(p_game_id,slot.team_id,'BOT · '||slot.team_name||' · '||slot.role_code,slot.role_code,true,now());
    active_count:=active_count+1;
    added:=added+1;
  end loop;

  -- This button is explicitly rehearsal-only. Locking here guarantees the bots
  -- survive the transition into the first lesson and prevents a late human from
  -- silently replacing the rehearsal topology.
  update public.cw_games set roster_locked=true where id=p_game_id;

  insert into public.cw_events(game_id,actor,event_type,payload)
  values(p_game_id,'facilitator','rehearsal_bots_seeded',jsonb_build_object(
    'added',added,'target',target,'teams',target_teams,'core_roles',4,'roster_locked',true
  ));

  return jsonb_build_object(
    'ok',true,'added',added,'players',active_count,'humans',human_count,
    'bots',active_count-human_count,'team_target',target_teams,'target',target,
    'roster_locked',true
  );
end $$;

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
  gid:=public.cw_validate_facilitator_token(p_token);
  if gid is null then raise exception 'Sesión de facilitador inválida'; end if;
  perform public.cw_auto_close_round(gid);
  select * into g from public.cw_games where id=gid for update;

  if p_action='seed_bots' then
    bot_result:=public.cw_seed_rehearsal_bots(gid);
    return bot_result;

  elsif p_action='rebalance' then
    if g.roster_locked then raise exception 'La lista ya está cerrada'; end if;
    return public.cw_rebalance_lobby_roster(gid);

  elsif p_action='prune_offline' then
    if g.roster_locked or g.status not in ('lobby','briefing') then
      raise exception 'Sólo puedes depurar ausentes antes de cerrar la lista';
    end if;
    delete from public.cw_players p
    where p.game_id=gid
      and not p.is_bot
      and p.last_seen_at<now()-make_interval(secs=>greatest(60,p_seconds));
    get diagnostics removed = row_count;
    select public.cw_rebalance_lobby_roster(gid) into roster_result;
    insert into public.cw_events(game_id,actor,event_type,payload)
    values(gid,'facilitator','offline_players_pruned',jsonb_build_object(
      'removed',removed,'threshold_seconds',greatest(60,p_seconds)
    ));
    return jsonb_build_object('ok',true,'removed',removed,'roster',roster_result);

  elsif p_action='bot_decisions' then
    if g.status<>'round' then raise exception 'Los bots sólo pueden decidir durante una ronda abierta'; end if;
    bot_decisions:=public.cw_generate_bot_decisions(gid,g.current_round);
    return jsonb_build_object('ok',true,'bot_decisions',bot_decisions);

  elsif p_action='lesson' then
    select count(*) into human_count
    from public.cw_players where game_id=gid and active and not is_bot;
    if human_count=0 then raise exception 'No hay participantes humanos'; end if;
    if g.status not in ('lobby','briefing') then raise exception 'La mini-clase sólo puede comenzar desde briefing/lobby'; end if;
    if g.current_round=1 and not g.roster_locked then
      select public.cw_rebalance_lobby_roster(gid) into roster_result;
      update public.cw_games set roster_locked=true where id=gid;
    end if;
    update public.cw_games
    set status='lesson',started_at=null,closes_at=null,paused_remaining_seconds=null,
        public_message='Mini-clase de la ronda '||current_round||' · equipos y roles confirmados'
    where id=gid;

  elsif p_action='open' then
    select count(*) into human_count
    from public.cw_players where game_id=gid and active and not is_bot;
    if human_count=0 then raise exception 'No hay participantes humanos'; end if;
    if g.status<>'lesson' then raise exception 'Primero debes presentar el concepto de la ronda'; end if;
    update public.cw_games
    set status='round',started_at=now(),closes_at=now()+make_interval(secs=>duration_seconds),
        paused_remaining_seconds=null,public_message='Laboratorio de la ronda '||current_round||' abierto · trabajen por roles'
    where id=gid;
    perform public.cw_generate_bot_decisions(gid,g.current_round);

  elsif p_action='close' then
    if g.status not in ('round','paused') then raise exception 'La ronda no está abierta'; end if;
    update public.cw_games set status='closed',closes_at=now(),paused_remaining_seconds=null,
      public_message='Decisiones cerradas · regresen a sala principal' where id=gid;

  elsif p_action='reveal' then
    if g.status<>'closed' then raise exception 'Primero debes cerrar la ronda'; end if;
    perform public.cw_score_round(gid,g.current_round);
    update public.cw_games set status='reveal',
      public_message=case when current_round=1 then 'VER EL OTRO FUTURO' else 'Reveal ronda '||current_round end
    where id=gid;

  elsif p_action='teach' then
    if g.status<>'reveal' then raise exception 'Primero muestra el reveal'; end if;
    update public.cw_games set status='teaching',public_message='Debrief · conecta lo ocurrido con el concepto formal' where id=gid;

  elsif p_action='microcheck' then
    if g.status<>'teaching' then raise exception 'Primero realiza el debrief'; end if;
    update public.cw_games set status='microcheck',public_message='Microcheck individual · no da puntos al equipo' where id=gid;

  elsif p_action='next' then
    if g.status not in ('microcheck','teaching','reveal') then raise exception 'Completa reveal/debrief antes de continuar'; end if;
    if g.current_round>=4 then
      update public.cw_games set status='finished',closes_at=null,paused_remaining_seconds=null,public_message='Partida finalizada' where id=gid;
    else
      update public.cw_games set current_round=current_round+1,status='briefing',started_at=null,closes_at=null,
        paused_remaining_seconds=null,public_message='Ronda '||(current_round+1)||' lista para mini-clase' where id=gid;
    end if;

  elsif p_action='pause' then
    if g.status<>'round' then raise exception 'Sólo puedes pausar un laboratorio abierto'; end if;
    remaining:=greatest(0,ceil(extract(epoch from (g.closes_at-now())))::int);
    update public.cw_games set status='paused',paused_remaining_seconds=remaining,closes_at=null,public_message='Laboratorio pausado' where id=gid;

  elsif p_action='resume' then
    if g.status<>'paused' then raise exception 'La partida no está pausada'; end if;
    remaining:=greatest(1,coalesce(g.paused_remaining_seconds,g.duration_seconds));
    update public.cw_games set status='round',closes_at=now()+make_interval(secs=>remaining),paused_remaining_seconds=null,public_message='Laboratorio reanudado' where id=gid;

  elsif p_action='add_time' then
    if g.status='paused' then
      update public.cw_games set paused_remaining_seconds=greatest(1,coalesce(paused_remaining_seconds,duration_seconds))+greatest(1,p_seconds) where id=gid;
    elsif g.status='round' then
      update public.cw_games set closes_at=greatest(coalesce(closes_at,now()),now())+make_interval(secs=>greatest(1,p_seconds)) where id=gid;
    else raise exception 'Sólo puedes añadir tiempo al laboratorio'; end if;

  elsif p_action='reset' then
    delete from public.cw_microchecks where game_id=gid;
    delete from public.cw_decisions where game_id=gid;
    delete from public.cw_player_sessions where player_id in (select id from public.cw_players where game_id=gid);
    delete from public.cw_players where game_id=gid;
    update public.cw_teams
      set score_impact=0,score_evidence=0,score_design=0,score_risk=0,score_adaptation=0,
          help_cost=0,investment_balance=60
      where game_id=gid;
    update public.cw_games
      set status='lobby',current_round=1,started_at=null,closes_at=null,paused_remaining_seconds=null,
          public_message='Esperando participantes · nueva sesión',team_target=4,roster_locked=false,max_humans=28
      where id=gid;

  else raise exception 'Acción no soportada'; end if;

  insert into public.cw_events(game_id,actor,event_type,payload)
  values(gid,'facilitator','transition',jsonb_build_object('action',p_action,'round',g.current_round));
  return jsonb_build_object('ok',true);
end $$;

revoke all on function public.cw_seed_rehearsal_bots(uuid) from public,anon,authenticated;
revoke all on function public.cw_facilitator_transition(text,text,int) from public,anon,authenticated;
grant execute on function public.cw_seed_rehearsal_bots(uuid) to service_role;
grant execute on function public.cw_facilitator_transition(text,text,int) to service_role;
