create or replace function public.cw_facilitator_transition(p_token text,p_action text,p_seconds int default 60)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare gid uuid; g public.cw_games; remaining int;
begin
  gid:=public.cw_validate_facilitator_token(p_token); if gid is null then raise exception 'Sesión de facilitador inválida'; end if;
  perform public.cw_auto_close_round(gid);
  select * into g from public.cw_games where id=gid for update;
  if p_action='open' then
    if g.status not in ('lobby','briefing','closed') then raise exception 'No se puede abrir desde el estado %',g.status; end if;
    update public.cw_games set status='round',started_at=now(),closes_at=now()+make_interval(secs=>duration_seconds),paused_remaining_seconds=null,public_message='Ronda '||current_round||' abierta' where id=gid;
  elsif p_action='close' then
    if g.status not in ('round','paused') then raise exception 'La ronda no está abierta'; end if;
    update public.cw_games set status='closed',closes_at=now(),paused_remaining_seconds=null,public_message='Decisiones cerradas' where id=gid;
  elsif p_action='reveal' then
    if g.status<>'closed' then raise exception 'Primero debes cerrar la ronda'; end if;
    perform public.cw_score_round(gid,g.current_round);
    update public.cw_games set status='reveal',public_message=case when current_round=1 then 'VER EL OTRO FUTURO' else 'Reveal ronda '||current_round end where id=gid;
  elsif p_action='teach' then
    if g.status<>'reveal' then raise exception 'Primero muestra el reveal'; end if;
    update public.cw_games set status='teaching',public_message='Concepto desbloqueado' where id=gid;
  elsif p_action='microcheck' then
    if g.status<>'teaching' then raise exception 'Primero realiza la explicación'; end if;
    update public.cw_games set status='microcheck',public_message='Microcheck individual' where id=gid;
  elsif p_action='next' then
    if g.status not in ('microcheck','teaching','reveal') then raise exception 'Completa la secuencia de la ronda antes de continuar'; end if;
    if g.current_round>=4 then update public.cw_games set status='finished',closes_at=null,paused_remaining_seconds=null,public_message='Partida finalizada' where id=gid;
    else update public.cw_games set current_round=current_round+1,status='briefing',started_at=null,closes_at=null,paused_remaining_seconds=null,public_message='Preparando ronda '||(current_round+1) where id=gid; end if;
  elsif p_action='pause' then
    if g.status<>'round' then raise exception 'Sólo puedes pausar una ronda abierta'; end if;
    remaining:=greatest(0,ceil(extract(epoch from (g.closes_at-now())))::int);
    update public.cw_games set status='paused',paused_remaining_seconds=remaining,closes_at=null,public_message='Partida pausada' where id=gid;
  elsif p_action='resume' then
    if g.status<>'paused' then raise exception 'La partida no está pausada'; end if;
    remaining:=greatest(1,coalesce(g.paused_remaining_seconds,g.duration_seconds));
    update public.cw_games set status='round',closes_at=now()+make_interval(secs=>remaining),paused_remaining_seconds=null,public_message='Ronda '||current_round||' reanudada' where id=gid;
  elsif p_action='add_time' then
    if g.status='paused' then update public.cw_games set paused_remaining_seconds=greatest(1,coalesce(paused_remaining_seconds,duration_seconds))+greatest(1,p_seconds) where id=gid;
    elsif g.status='round' then update public.cw_games set closes_at=greatest(coalesce(closes_at,now()),now())+make_interval(secs=>greatest(1,p_seconds)) where id=gid;
    else raise exception 'Sólo puedes añadir tiempo con una ronda abierta o pausada'; end if;
  elsif p_action='reset' then
    delete from public.cw_microchecks where game_id=gid;
    delete from public.cw_decisions where game_id=gid;
    delete from public.cw_player_sessions where player_id in (select id from public.cw_players where game_id=gid);
    delete from public.cw_players where game_id=gid;
    update public.cw_teams set score_impact=0,score_evidence=0,score_design=0,score_risk=0,score_adaptation=0 where game_id=gid;
    update public.cw_games set status='lobby',current_round=1,started_at=null,closes_at=null,paused_remaining_seconds=null,public_message='Esperando participantes · nueva sesión' where id=gid;
  else raise exception 'Acción no soportada'; end if;
  insert into public.cw_events(game_id,actor,event_type,payload) values(gid,'facilitator','transition',jsonb_build_object('action',p_action,'round',g.current_round));
  return jsonb_build_object('ok',true);
end $$;

revoke all on function public.cw_facilitator_transition(text,text,int) from public,anon,authenticated;
grant execute on function public.cw_facilitator_transition(text,text,int) to service_role;