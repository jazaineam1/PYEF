-- V2.5 · fair lab scoring, dynamic score config, recent wall events and >4 reusable retos

-- The original engine capped rounds at 4. V2 challenge manifests support up to 12.
alter table public.cw_games drop constraint if exists cw_games_current_round_check;
alter table public.cw_games
  add constraint cw_games_current_round_check check (current_round between 1 and 12);

alter table public.cw_v2_challenge_runtime
  add column if not exists lab_step_ids text[] not null default '{}'::text[];

update public.cw_v2_challenge_runtime set lab_step_ids=
  case profile_round
    when 1 then array['rank','visual']::text[]
    when 2 then array['raw','stratify','overlap']::text[]
    when 3 then array['experiment','segments','money']::text[]
    else '{}'::text[]
  end;

create or replace function public.cw_v2_complete_lab(p_token text,p_round int)
returns jsonb
language plpgsql
security invoker
set search_path=public
as $$
declare
  p public.cw_players; g public.cw_games; cfg public.cw_v2_challenge_runtime;
  humans int; submitted int; required_steps int:=0; completed_steps int:=0;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;
  if g.status<>'round' or g.current_round<>p_round then raise exception 'El reto no está abierto'; end if;
  select * into cfg from public.cw_v2_challenge_runtime where round_number=p_round and enabled;
  if cfg.round_number is null then raise exception 'Reto sin configuración de puntaje'; end if;

  select count(*) into humans from public.cw_players
  where game_id=p.game_id and team_id=p.team_id and active and not is_bot;
  select count(*) into submitted from public.cw_v2_individual_submissions
  where game_id=p.game_id and team_id=p.team_id and round_number=p_round;
  if submitted<humans then raise exception 'El laboratorio se abre cuando todo tu equipo haya tomado una decisión inicial'; end if;

  required_steps:=coalesce(cardinality(cfg.lab_step_ids),0);
  if required_steps>0 then
    select count(distinct e.payload->>'step_id') into completed_steps
    from public.cw_v2_learning_events e
    where e.game_id=p.game_id
      and e.round_number=p_round
      and e.player_id=p.id
      and e.event_type='python_run'
      and e.payload->>'step_id'=any(cfg.lab_step_ids);

    if completed_steps<required_steps then
      raise exception 'Ejecuta todos los bloques del laboratorio antes de terminar (%/%).',completed_steps,required_steps;
    end if;
  end if;

  insert into public.cw_v2_checkpoint_scores(
    game_id,round_number,team_id,player_id,checkpoint,points,max_points,visible,payload
  ) values (
    p.game_id,p_round,p.team_id,p.id,'lab',cfg.lab_points,cfg.lab_points,true,
    jsonb_build_object('steps',completed_steps,'required_steps',required_steps)
  )
  on conflict(game_id,round_number,player_id,checkpoint)
  do update set
    points=excluded.points,max_points=excluded.max_points,visible=true,
    payload=excluded.payload,scored_at=now();

  insert into public.cw_v2_learning_events(game_id,round_number,team_id,player_id,event_type,payload)
  values(p.game_id,p_round,p.team_id,p.id,'lab_complete',
         jsonb_build_object('steps',completed_steps,'required_steps',required_steps));

  return jsonb_build_object(
    'ok',true,'points',cfg.lab_points,'max_points',cfg.lab_points,
    'steps',completed_steps,'required_steps',required_steps
  );
end $$;

create or replace function public.cw_v2_submit_check(p_token text,p_round int,p_answer text)
returns jsonb
language plpgsql
security invoker
set search_path=public
as $$
declare
  p public.cw_players; g public.cw_games; cfg public.cw_v2_challenge_runtime;
  earned int; answer text:=lower(trim(coalesce(p_answer,'')));
  existing public.cw_v2_checkpoint_scores; stored_answer text;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;
  if g.status<>'round' or g.current_round<>p_round then raise exception 'El reto no está abierto'; end if;
  select * into cfg from public.cw_v2_challenge_runtime where round_number=p_round and enabled;
  if cfg.round_number is null then raise exception 'Reto sin configuración de puntaje'; end if;
  if answer not in ('a','b','c','d') then raise exception 'Respuesta inválida'; end if;

  select * into existing
  from public.cw_v2_checkpoint_scores s
  where s.game_id=p.game_id and s.round_number=p_round and s.player_id=p.id and s.checkpoint='check';

  if existing.id is not null then
    stored_answer:=existing.payload->>'answer';
    return jsonb_build_object(
      'ok',true,'already_answered',true,
      'points',existing.points,'max_points',existing.max_points,
      'correct',stored_answer=cfg.correct_answer
    );
  end if;

  if not exists(
    select 1 from public.cw_v2_checkpoint_scores s
    where s.game_id=p.game_id and s.round_number=p_round and s.player_id=p.id and s.checkpoint='lab'
  ) then raise exception 'Primero termina el laboratorio'; end if;

  earned:=case when answer=cfg.correct_answer then cfg.check_points else 0 end;

  insert into public.cw_v2_checkpoint_scores(
    game_id,round_number,team_id,player_id,checkpoint,points,max_points,visible,payload
  ) values (
    p.game_id,p_round,p.team_id,p.id,'check',earned,cfg.check_points,true,jsonb_build_object('answer',answer)
  );

  return jsonb_build_object(
    'ok',true,'already_answered',false,
    'points',earned,'max_points',cfg.check_points,'correct',answer=cfg.correct_answer
  );
end $$;

create or replace function public.cw_v2_player_score_state(p_token text)
returns jsonb
language plpgsql
security invoker
set search_path=public
as $$
declare
  p public.cw_players; g public.cw_games; cfg public.cw_v2_challenge_runtime;
  humans int; submitted int; revised int;
  lab_done boolean; check_done boolean;
  team_done boolean; phase text;
  my_total int:=0; my_round int:=0; my_rank int:=1;
  check_points_earned int:=null; top3 jsonb:='[]'::jsonb;
  team_lab int:=0; team_check int:=0; round_max int:=100;
  challenge jsonb:='{}'::jsonb;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;
  select * into cfg from public.cw_v2_challenge_runtime
  where round_number=g.current_round and enabled;
  if cfg.round_number is null then raise exception 'Reto % no configurado',g.current_round; end if;

  round_max:=cfg.lab_points+cfg.check_points+cfg.revision_points+cfg.team_points;
  challenge:=jsonb_build_object(
    'key',cfg.challenge_key,
    'profile_round',cfg.profile_round,
    'template',cfg.template,
    'lab_key',cfg.lab_key,
    'lab_points',cfg.lab_points,
    'check_points',cfg.check_points,
    'revision_points',cfg.revision_points,
    'team_points',cfg.team_points,
    'lab_steps',cfg.lab_step_ids
  );

  select count(*) into humans from public.cw_players
  where game_id=p.game_id and team_id=p.team_id and active and not is_bot;
  select count(*) into submitted from public.cw_v2_individual_submissions
  where game_id=p.game_id and team_id=p.team_id and round_number=g.current_round;
  select count(*) into revised from public.cw_v2_revisions
  where game_id=p.game_id and team_id=p.team_id and round_number=g.current_round;
  select count(distinct player_id) into team_lab from public.cw_v2_checkpoint_scores
  where game_id=p.game_id and team_id=p.team_id and round_number=g.current_round and checkpoint='lab';
  select count(distinct player_id) into team_check from public.cw_v2_checkpoint_scores
  where game_id=p.game_id and team_id=p.team_id and round_number=g.current_round and checkpoint='check';

  lab_done:=exists(select 1 from public.cw_v2_checkpoint_scores s where s.game_id=p.game_id and s.round_number=g.current_round and s.player_id=p.id and s.checkpoint='lab');
  check_done:=exists(select 1 from public.cw_v2_checkpoint_scores s where s.game_id=p.game_id and s.round_number=g.current_round and s.player_id=p.id and s.checkpoint='check');
  team_done:=exists(select 1 from public.cw_v2_team_decisions d where d.game_id=p.game_id and d.team_id=p.team_id and d.round_number=g.current_round);

  select s.points into check_points_earned from public.cw_v2_checkpoint_scores s
  where s.game_id=p.game_id and s.round_number=g.current_round and s.player_id=p.id and s.checkpoint='check';

  select coalesce(sum(points),0) into my_total from public.cw_v2_checkpoint_scores
  where game_id=p.game_id and player_id=p.id and visible;
  select coalesce(sum(points),0) into my_round from public.cw_v2_checkpoint_scores
  where game_id=p.game_id and player_id=p.id and round_number=g.current_round and visible;

  with totals as (
    select pl.id,coalesce(sum(s.points) filter(where s.visible),0)::int pts,
           coalesce(sum(s.points) filter(where s.visible and s.round_number=g.current_round),0)::int round_pts
    from public.cw_players pl
    left join public.cw_v2_checkpoint_scores s on s.game_id=pl.game_id and s.player_id=pl.id
    where pl.game_id=p.game_id and pl.active and not pl.is_bot
    group by pl.id
  ), ranked as (
    select id,row_number() over(order by pts desc,round_pts desc,id)::int rk from totals
  )
  select rk into my_rank from ranked where id=p.id;

  with totals as (
    select pl.id,pl.display_name,t.name team,
           coalesce(sum(s.points) filter(where s.visible),0)::int points,
           coalesce(sum(s.points) filter(where s.visible and s.round_number=g.current_round),0)::int round_points
    from public.cw_players pl
    join public.cw_teams t on t.id=pl.team_id
    left join public.cw_v2_checkpoint_scores s on s.game_id=pl.game_id and s.player_id=pl.id
    where pl.game_id=p.game_id and pl.active and not pl.is_bot
    group by pl.id,pl.display_name,t.name
  ), ranked as (
    select *,row_number() over(order by points desc,round_points desc,id)::int pos from totals
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'rank',pos,'player_id',id,'name',display_name,'team',team,'points',points,'round_points',round_points
  ) order by pos),'[]'::jsonb) into top3
  from ranked where pos<=3;

  if g.status in ('reveal','teaching','microcheck','finished') then phase:='reveal';
  elsif not exists(select 1 from public.cw_v2_individual_submissions s where s.game_id=p.game_id and s.round_number=g.current_round and s.player_id=p.id) then phase:='initial';
  elsif submitted<humans then phase:='wait_initial';
  elsif not lab_done then phase:='lab';
  elsif not check_done then phase:='check';
  elsif not exists(select 1 from public.cw_v2_revisions r where r.game_id=p.game_id and r.round_number=g.current_round and r.player_id=p.id) then phase:='revision';
  elsif revised<humans then phase:='wait_revision';
  elsif not team_done then phase:='team';
  else phase:='wait_reveal';
  end if;

  return jsonb_build_object(
    'phase',phase,
    'my',jsonb_build_object(
      'points',my_total,'round_points',my_round,'round_max',round_max,'rank',coalesce(my_rank,1),
      'lab_complete',lab_done,'check_answered',check_done,'check_points',check_points_earned
    ),
    'team',jsonb_build_object(
      'humans',humans,'initial',submitted,'lab',team_lab,'check',team_check,'revision',revised,'team_done',team_done
    ),
    'top3',top3,
    'challenge',challenge
  );
end $$;

create or replace function public.cw_v2_wall_score_state(p_game_code text)
returns jsonb
language plpgsql
security invoker
set search_path=public
as $$
declare
  g public.cw_games; cfg public.cw_v2_challenge_runtime;
  top3 jsonb:='[]'::jsonb; player_scores jsonb:='[]'::jsonb; recent_scores jsonb:='[]'::jsonb;
  humans int:=0; initial_count int:=0; lab_count int:=0; check_count int:=0; revision_count int:=0; team_count int:=0;
begin
  select * into g from public.cw_games where code=upper(trim(p_game_code));
  if g.id is null then raise exception 'Partida no encontrada'; end if;
  select * into cfg from public.cw_v2_challenge_runtime where round_number=g.current_round and enabled;

  select count(*) into humans from public.cw_players where game_id=g.id and active and not is_bot;
  select count(*) into initial_count from public.cw_v2_individual_submissions where game_id=g.id and round_number=g.current_round;
  select count(distinct player_id) into lab_count from public.cw_v2_checkpoint_scores where game_id=g.id and round_number=g.current_round and checkpoint='lab';
  select count(distinct player_id) into check_count from public.cw_v2_checkpoint_scores where game_id=g.id and round_number=g.current_round and checkpoint='check';
  select count(*) into revision_count from public.cw_v2_revisions where game_id=g.id and round_number=g.current_round;
  select count(*) into team_count from public.cw_v2_team_decisions where game_id=g.id and round_number=g.current_round;

  with totals as (
    select pl.id,pl.display_name,t.name team,t.position team_position,
           coalesce(sum(s.points) filter(where s.visible),0)::int points,
           coalesce(sum(s.points) filter(where s.visible and s.round_number=g.current_round),0)::int round_points
    from public.cw_players pl
    join public.cw_teams t on t.id=pl.team_id
    left join public.cw_v2_checkpoint_scores s on s.game_id=pl.game_id and s.player_id=pl.id
    where pl.game_id=g.id and pl.active and not pl.is_bot
    group by pl.id,pl.display_name,t.name,t.position
  ), ranked as (
    select *,row_number() over(order by points desc,round_points desc,team_position,id)::int pos from totals
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'rank',pos,'player_id',id,'name',display_name,'team',team,'points',points,'round_points',round_points
  ) order by pos),'[]'::jsonb) into top3
  from ranked where pos<=3;

  with totals as (
    select pl.id,pl.display_name,t.name team,
           coalesce(sum(s.points) filter(where s.visible),0)::int points,
           coalesce(sum(s.points) filter(where s.visible and s.round_number=g.current_round),0)::int round_points
    from public.cw_players pl
    join public.cw_teams t on t.id=pl.team_id
    left join public.cw_v2_checkpoint_scores s on s.game_id=pl.game_id and s.player_id=pl.id
    where pl.game_id=g.id and pl.active and not pl.is_bot
    group by pl.id,pl.display_name,t.name
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'player_id',id,'name',display_name,'team',team,'points',points,'round_points',round_points
  ) order by points desc,display_name),'[]'::jsonb) into player_scores
  from totals;

  select coalesce(jsonb_agg(x.obj order by x.scored_at desc),'[]'::jsonb) into recent_scores
  from (
    select s.scored_at,
           jsonb_build_object(
             'name',p.display_name,'team',t.name,'checkpoint',s.checkpoint,
             'points',s.points,'max_points',s.max_points,'scored_at',s.scored_at
           ) obj
    from public.cw_v2_checkpoint_scores s
    join public.cw_players p on p.id=s.player_id
    join public.cw_teams t on t.id=s.team_id
    where s.game_id=g.id and s.round_number=g.current_round and s.visible
    order by s.scored_at desc
    limit 6
  ) x;

  return jsonb_build_object(
    'top3',top3,
    'player_scores',player_scores,
    'recent_scores',recent_scores,
    'scoring',jsonb_build_object(
      'lab',coalesce(cfg.lab_points,0),
      'check',coalesce(cfg.check_points,0),
      'revision',coalesce(cfg.revision_points,0),
      'team',coalesce(cfg.team_points,0),
      'max',coalesce(cfg.lab_points+cfg.check_points+cfg.revision_points+cfg.team_points,0)
    ),
    'checkpoint',jsonb_build_object(
      'humans',humans,'initial',initial_count,'lab',lab_count,'check',check_count,'revision',revision_count,'teams_locked',team_count
    )
  );
end $$;

create or replace function public.cw_v2_facilitator_action(p_token text,p_action text,p_seconds int default 60)
returns jsonb
language plpgsql
security invoker
set search_path=public
as $$
declare gid uuid; g public.cw_games; max_round int; remaining int; human_count int; roster_result jsonb;
begin
  gid:=public.cw_validate_facilitator_token(p_token);
  if gid is null then raise exception 'Sesión de facilitador inválida'; end if;
  select * into g from public.cw_games where id=gid for update;
  select count(*) into max_round from public.cw_v2_challenge_runtime where enabled;
  if max_round<1 then raise exception 'No hay retos V2 habilitados'; end if;

  if p_action='start' then
    select count(*) into human_count from public.cw_players where game_id=gid and active and not is_bot;
    if human_count=0 then raise exception 'No hay participantes humanos'; end if;
    if g.status not in ('lobby','briefing') then raise exception 'El reto no está listo para iniciar'; end if;
    if g.current_round=1 and not g.roster_locked then
      select public.cw_rebalance_lobby_roster(gid) into roster_result;
      update public.cw_games set roster_locked=true where id=gid;
    end if;
    update public.cw_games
    set status='round',started_at=now(),
        closes_at=now()+make_interval(secs=>duration_seconds),
        paused_remaining_seconds=null,
        public_message='Reto '||current_round||' abierto'
    where id=gid;

  elsif p_action='reveal' then
    if g.status not in ('round','paused','closed') then raise exception 'El reto no está abierto o cerrado'; end if;
    update public.cw_games
    set status='reveal',closes_at=now(),paused_remaining_seconds=null,
        public_message='Resultado del reto '||current_round
    where id=gid;

  elsif p_action='next' then
    if g.status not in ('reveal','teaching') then raise exception 'Primero muestra el resultado'; end if;
    if g.current_round>=max_round then
      update public.cw_games
      set status='finished',closes_at=null,paused_remaining_seconds=null,
          public_message='Experiencia finalizada'
      where id=gid;
    else
      update public.cw_games
      set current_round=current_round+1,status='briefing',
          started_at=null,closes_at=null,paused_remaining_seconds=null,
          public_message='Siguiente reto listo'
      where id=gid;
    end if;

  elsif p_action='pause' then
    if g.status<>'round' then raise exception 'Sólo puedes pausar un reto abierto'; end if;
    remaining:=greatest(0,ceil(extract(epoch from (g.closes_at-now())))::int);
    update public.cw_games
    set status='paused',paused_remaining_seconds=remaining,closes_at=null,public_message='Reto pausado'
    where id=gid;

  elsif p_action='resume' then
    if g.status<>'paused' then raise exception 'El reto no está pausado'; end if;
    remaining:=greatest(1,coalesce(g.paused_remaining_seconds,g.duration_seconds));
    update public.cw_games
    set status='round',closes_at=now()+make_interval(secs=>remaining),
        paused_remaining_seconds=null,public_message='Reto reanudado'
    where id=gid;

  elsif p_action='add_time' then
    if g.status='paused' then
      update public.cw_games
      set paused_remaining_seconds=greatest(1,coalesce(paused_remaining_seconds,duration_seconds))+greatest(1,p_seconds)
      where id=gid;
    elsif g.status='round' then
      update public.cw_games
      set closes_at=greatest(coalesce(closes_at,now()),now())+make_interval(secs=>greatest(1,p_seconds))
      where id=gid;
    else raise exception 'Sólo puedes añadir tiempo a un reto abierto o pausado';
    end if;

  elsif p_action='rebalance' then
    if g.roster_locked then raise exception 'La lista ya está cerrada'; end if;
    return public.cw_rebalance_lobby_roster(gid);

  elsif p_action='prune_offline' then
    if g.roster_locked or g.status not in ('lobby','briefing') then raise exception 'Sólo puedes depurar ausentes antes de cerrar la lista'; end if;
    delete from public.cw_players
    where game_id=gid and not is_bot and last_seen_at<now()-make_interval(secs=>greatest(60,p_seconds));
    return public.cw_rebalance_lobby_roster(gid);

  elsif p_action='reset' then
    delete from public.cw_v2_checkpoint_scores where game_id=gid;
    delete from public.cw_v2_learning_events where game_id=gid;
    delete from public.cw_v2_revisions where game_id=gid;
    delete from public.cw_v2_individual_submissions where game_id=gid;
    delete from public.cw_v2_team_decisions where game_id=gid;
    perform public.cw_facilitator_transition(p_token,'reset',p_seconds);

  else
    raise exception 'Acción V2 no soportada';
  end if;

  insert into public.cw_events(game_id,actor,event_type,payload)
  values(gid,'facilitator','v2_transition',jsonb_build_object('action',p_action,'round',g.current_round));

  return jsonb_build_object('ok',true,'max_round',max_round);
end $$;

revoke all on function public.cw_v2_complete_lab(text,int) from public,anon,authenticated;
revoke all on function public.cw_v2_submit_check(text,int,text) from public,anon,authenticated;
revoke all on function public.cw_v2_player_score_state(text) from public,anon,authenticated;
revoke all on function public.cw_v2_wall_score_state(text) from public,anon,authenticated;
revoke all on function public.cw_v2_facilitator_action(text,text,int) from public,anon,authenticated;

grant execute on function public.cw_v2_complete_lab(text,int) to service_role;
grant execute on function public.cw_v2_submit_check(text,int,text) to service_role;
grant execute on function public.cw_v2_player_score_state(text) to service_role;
grant execute on function public.cw_v2_wall_score_state(text) to service_role;
grant execute on function public.cw_v2_facilitator_action(text,text,int) to service_role;
