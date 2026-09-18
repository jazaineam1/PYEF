-- V2.5 · reveal public checkpoint scores only when the checkpoint closes for the class

create or replace function public.cw_v2_close_checkpoint_if_ready(
  p_game_id uuid,p_round int,p_checkpoint text
)
returns boolean
language plpgsql
security invoker
set search_path=public
as $$
declare humans int:=0; completed int:=0;
begin
  if p_checkpoint not in ('lab','check','revision') then return false; end if;

  select count(*) into humans
  from public.cw_players
  where game_id=p_game_id and active and not is_bot;

  select count(distinct player_id) into completed
  from public.cw_v2_checkpoint_scores
  where game_id=p_game_id and round_number=p_round and checkpoint=p_checkpoint;

  if humans>0 and completed>=humans then
    update public.cw_v2_checkpoint_scores
    set visible=true
    where game_id=p_game_id and round_number=p_round and checkpoint=p_checkpoint;
    return true;
  end if;
  return false;
end $$;

create or replace function public.cw_v2_complete_lab(p_token text,p_round int)
returns jsonb
language plpgsql
security invoker
set search_path=public
as $$
declare
  p public.cw_players; g public.cw_games; cfg public.cw_v2_challenge_runtime;
  humans int; submitted int;
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

  insert into public.cw_v2_checkpoint_scores(
    game_id,round_number,team_id,player_id,checkpoint,points,max_points,visible,payload
  ) values (
    p.game_id,p_round,p.team_id,p.id,'lab',cfg.lab_points,cfg.lab_points,false,'{}'::jsonb
  )
  on conflict(game_id,round_number,player_id,checkpoint)
  do update set points=excluded.points,max_points=excluded.max_points,visible=false,scored_at=now();

  perform public.cw_v2_close_checkpoint_if_ready(p.game_id,p_round,'lab');

  insert into public.cw_v2_learning_events(game_id,round_number,team_id,player_id,event_type,payload)
  values(p.game_id,p_round,p.team_id,p.id,'lab_complete','{}'::jsonb);

  return jsonb_build_object('ok',true,'points',cfg.lab_points,'max_points',cfg.lab_points);
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
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;
  if g.status<>'round' or g.current_round<>p_round then raise exception 'El reto no está abierto'; end if;
  select * into cfg from public.cw_v2_challenge_runtime where round_number=p_round and enabled;
  if cfg.round_number is null then raise exception 'Reto sin configuración de puntaje'; end if;
  if answer not in ('a','b','c','d') then raise exception 'Respuesta inválida'; end if;
  if not exists(
    select 1 from public.cw_v2_checkpoint_scores s
    where s.game_id=p.game_id and s.round_number=p_round and s.player_id=p.id and s.checkpoint='lab'
  ) then raise exception 'Primero termina el laboratorio'; end if;

  earned:=case when answer=cfg.correct_answer then cfg.check_points else 0 end;

  insert into public.cw_v2_checkpoint_scores(
    game_id,round_number,team_id,player_id,checkpoint,points,max_points,visible,payload
  ) values (
    p.game_id,p_round,p.team_id,p.id,'check',earned,cfg.check_points,false,jsonb_build_object('answer',answer)
  )
  on conflict(game_id,round_number,player_id,checkpoint)
  do update set points=excluded.points,max_points=excluded.max_points,visible=false,payload=excluded.payload,scored_at=now();

  perform public.cw_v2_close_checkpoint_if_ready(p.game_id,p_round,'check');

  return jsonb_build_object(
    'ok',true,'points',earned,'max_points',cfg.check_points,'correct',answer=cfg.correct_answer
  );
end $$;

create or replace function public.cw_v2_award_revision_points(p_token text,p_round int)
returns jsonb
language plpgsql
security invoker
set search_path=public
as $$
declare p public.cw_players; cfg public.cw_v2_challenge_runtime;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  if not exists(
    select 1 from public.cw_v2_revisions r
    where r.game_id=p.game_id and r.round_number=p_round and r.player_id=p.id
  ) then raise exception 'No existe una revisión para puntuar'; end if;
  select * into cfg from public.cw_v2_challenge_runtime where round_number=p_round and enabled;

  insert into public.cw_v2_checkpoint_scores(
    game_id,round_number,team_id,player_id,checkpoint,points,max_points,visible,payload
  ) values (
    p.game_id,p_round,p.team_id,p.id,'revision',cfg.revision_points,cfg.revision_points,false,'{}'::jsonb
  )
  on conflict(game_id,round_number,player_id,checkpoint)
  do update set points=excluded.points,max_points=excluded.max_points,visible=false,scored_at=now();

  perform public.cw_v2_close_checkpoint_if_ready(p.game_id,p_round,'revision');
  return jsonb_build_object('ok',true,'points',cfg.revision_points,'max_points',cfg.revision_points);
end $$;

create or replace function public.cw_v2_player_score_state(p_token text)
returns jsonb
language plpgsql
security invoker
set search_path=public
as $$
declare
  p public.cw_players; g public.cw_games;
  humans int; submitted int; revised int;
  lab_done boolean; check_done boolean;
  team_done boolean; phase text;
  my_total int:=0; my_round int:=0; my_rank int:=1;
  check_points int:=null; top3 jsonb:='[]'::jsonb; round_max int:=100; challenge jsonb:='{}'::jsonb;
  team_lab int:=0; team_check int:=0;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;
  select (lab_points+check_points+revision_points+team_points),
         jsonb_build_object('key',challenge_key,'profile_round',profile_round,'template',template,'lab_key',lab_key)
  into round_max,challenge
  from public.cw_v2_challenge_runtime
  where round_number=g.current_round and enabled;
  round_max:=coalesce(round_max,100);

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

  select s.points into check_points from public.cw_v2_checkpoint_scores s
  where s.game_id=p.game_id and s.round_number=g.current_round and s.player_id=p.id and s.checkpoint='check';

  select coalesce(sum(points),0) into my_total from public.cw_v2_checkpoint_scores
  where game_id=p.game_id and player_id=p.id;
  select coalesce(sum(points),0) into my_round from public.cw_v2_checkpoint_scores
  where game_id=p.game_id and player_id=p.id and round_number=g.current_round;

  with totals as (
    select pl.id,coalesce(sum(s.points) filter(where s.visible),0)::int pts
    from public.cw_players pl
    left join public.cw_v2_checkpoint_scores s on s.game_id=pl.game_id and s.player_id=pl.id
    where pl.game_id=p.game_id and pl.active and not pl.is_bot
    group by pl.id
  ), ranked as (
    select id,rank() over(order by pts desc,id)::int rk from totals
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
      'lab_complete',lab_done,'check_answered',check_done,'check_points',check_points
    ),
    'team',jsonb_build_object(
      'humans',humans,'initial',submitted,'lab',team_lab,'check',team_check,'revision',revised,'team_done',team_done
    ),
    'top3',top3,
    'challenge',challenge
  );
end $$;


revoke all on function public.cw_v2_close_checkpoint_if_ready(uuid,int,text) from public,anon,authenticated;
revoke all on function public.cw_v2_complete_lab(text,int) from public,anon,authenticated;
revoke all on function public.cw_v2_submit_check(text,int,text) from public,anon,authenticated;
revoke all on function public.cw_v2_award_revision_points(text,int) from public,anon,authenticated;
revoke all on function public.cw_v2_player_score_state(text) from public,anon,authenticated;
grant execute on function public.cw_v2_close_checkpoint_if_ready(uuid,int,text) to service_role;
grant execute on function public.cw_v2_complete_lab(text,int) to service_role;
grant execute on function public.cw_v2_submit_check(text,int,text) to service_role;
grant execute on function public.cw_v2_award_revision_points(text,int) to service_role;
grant execute on function public.cw_v2_player_score_state(text) to service_role;
