-- V2.7 · make the scored comprehension answer immutable

create or replace function public.cw_v2_submit_check(p_token text,p_round int,p_answer text)
returns jsonb
language plpgsql
security invoker
set search_path=public
as $$
declare
  p public.cw_players; g public.cw_games; cfg public.cw_v2_challenge_runtime;
  earned int; answer text:=lower(trim(coalesce(p_answer,'')));
  stored_answer text; stored_points int; stored_max int;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;
  if g.status<>'round' or g.current_round<>p_round then raise exception 'El reto no está abierto'; end if;

  select * into cfg
  from public.cw_v2_challenge_runtime
  where round_number=p_round and enabled;
  if cfg.round_number is null then raise exception 'Reto sin configuración de puntaje'; end if;
  if answer not in ('a','b','c','d') then raise exception 'Respuesta inválida'; end if;

  if not exists(
    select 1 from public.cw_v2_checkpoint_scores s
    where s.game_id=p.game_id and s.round_number=p_round
      and s.player_id=p.id and s.checkpoint='lab'
  ) then raise exception 'Primero termina el laboratorio'; end if;

  select s.payload->>'answer',s.points,s.max_points
  into stored_answer,stored_points,stored_max
  from public.cw_v2_checkpoint_scores s
  where s.game_id=p.game_id and s.round_number=p_round
    and s.player_id=p.id and s.checkpoint='check';

  if found then
    return jsonb_build_object(
      'ok',true,'already_answered',true,
      'points',stored_points,'max_points',stored_max,
      'correct',stored_answer=cfg.correct_answer
    );
  end if;

  earned:=case when answer=cfg.correct_answer then cfg.check_points else 0 end;

  insert into public.cw_v2_checkpoint_scores(
    game_id,round_number,team_id,player_id,checkpoint,points,max_points,visible,payload
  ) values (
    p.game_id,p_round,p.team_id,p.id,'check',earned,cfg.check_points,false,
    jsonb_build_object('answer',answer)
  )
  on conflict(game_id,round_number,player_id,checkpoint) do nothing;

  select s.payload->>'answer',s.points,s.max_points
  into stored_answer,stored_points,stored_max
  from public.cw_v2_checkpoint_scores s
  where s.game_id=p.game_id and s.round_number=p_round
    and s.player_id=p.id and s.checkpoint='check';

  perform public.cw_v2_close_checkpoint_if_ready(p.game_id,p_round,'check');

  return jsonb_build_object(
    'ok',true,'already_answered',stored_answer<>answer,
    'points',stored_points,'max_points',stored_max,
    'correct',stored_answer=cfg.correct_answer
  );
end $$;

revoke all on function public.cw_v2_submit_check(text,int,text) from public,anon,authenticated;
grant execute on function public.cw_v2_submit_check(text,int,text) to service_role;
