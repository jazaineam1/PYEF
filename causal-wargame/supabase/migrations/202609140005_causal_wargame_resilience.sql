alter table public.cw_games add column if not exists paused_remaining_seconds int;

create or replace function public.cw_auto_close_round(p_game_id uuid)
returns void language plpgsql security invoker set search_path=public as $$
begin
  update public.cw_games
  set status='closed', public_message='Tiempo agotado · decisiones cerradas', closes_at=now()
  where id=p_game_id and status='round' and closes_at is not null and closes_at<=now();
end $$;

create or replace function public.cw_submit_decision(p_token text,p_round int,p_payload jsonb,p_idempotency text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare p public.cw_players; g public.cw_games; existing public.cw_decisions; did uuid; union_count int; invalid_count int; total_count int;
begin
  if p_idempotency is null or length(p_idempotency)<8 then raise exception 'Idempotency key inválida'; end if;
  select * into p from public.cw_validate_player_token(p_token); if p.id is null then raise exception 'Sesión inválida'; end if;
  perform public.cw_auto_close_round(p.game_id);
  select * into g from public.cw_games where id=p.game_id;
  if g.status<>'round' or g.current_round<>p_round or (g.closes_at is not null and g.closes_at<=now()) then raise exception 'La ronda está cerrada'; end if;
  select * into existing from public.cw_decisions where game_id=g.id and team_id=p.team_id and round_number=p_round;
  if existing.id is not null then
    if existing.idempotency_key=p_idempotency then return jsonb_build_object('ok',true,'decision_id',existing.id,'idempotent',true); end if;
    raise exception 'La decisión del equipo ya fue bloqueada';
  end if;
  if p_round=1 then
    if jsonb_typeof(p_payload->'selected')<>'array' or jsonb_array_length(p_payload->'selected')<>10 then raise exception 'Debes seleccionar exactamente 10 clientes'; end if;
    select count(*),count(distinct s.id),count(*) filter(where c.customer_id is null)
      into total_count,union_count,invalid_count
    from jsonb_array_elements_text(p_payload->'selected') s(id)
    left join public.cw_ground_truth_customers c on c.customer_id=s.id;
    if invalid_count>0 or total_count<>10 or union_count<>10 then raise exception 'Selección inválida o duplicada'; end if;
  elsif p_round=2 then
    if coalesce(p_payload->>'recommendation','') not in ('cancel','keep','redesign') then raise exception 'Recomendación inválida'; end if;
    if coalesce(p_payload->>'confounder','') not in ('edad','mora_previa','nombre') then raise exception 'Variable inválida'; end if;
    if length(trim(coalesce(p_payload->>'reason','')))<12 then raise exception 'Explica brevemente la decisión'; end if;
  elsif p_round=3 then
    if coalesce(p_payload->>'assignment','') not in ('advisor','model','random') then raise exception 'Asignación inválida'; end if;
    if coalesce(p_payload->>'outcome','') not in ('pago_30d','click') then raise exception 'Outcome inválido'; end if;
    if coalesce((p_payload->>'horizon')::int,0) not in (1,30,90) then raise exception 'Horizonte inválido'; end if;
  elsif p_round=4 then
    with all_ids as (
      select value id from jsonb_array_elements_text(coalesce(p_payload->'treat','[]'::jsonb))
      union all select value from jsonb_array_elements_text(coalesce(p_payload->'avoid','[]'::jsonb))
      union all select value from jsonb_array_elements_text(coalesce(p_payload->'observe','[]'::jsonb))
    )
    select count(distinct id),count(*),count(*) filter(where id not in ('digital','middle','traditional','wealth','arrears')) into union_count,total_count,invalid_count from all_ids;
    if invalid_count>0 or union_count<>5 or total_count<>5 then raise exception 'Debes clasificar exactamente los cinco segmentos una sola vez'; end if;
  end if;
  insert into public.cw_decisions(game_id,round_number,team_id,submitted_by,payload,idempotency_key)
  values(g.id,p_round,p.team_id,p.id,p_payload,p_idempotency) returning id into did;
  insert into public.cw_events(game_id,actor,event_type,payload) values(g.id,p.id::text,'decision_locked',jsonb_build_object('round',p_round,'team_id',p.team_id));
  return jsonb_build_object('ok',true,'decision_id',did,'idempotent',false);
end $$;

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
  else raise exception 'Acción no soportada'; end if;
  insert into public.cw_events(game_id,actor,event_type,payload) values(gid,'facilitator','transition',jsonb_build_object('action',p_action,'round',g.current_round));
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.cw_game_state(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare p public.cw_players; g public.cw_games; card text; teams_json jsonb; locked boolean:=false; d jsonb; result_json jsonb; customers jsonb; reveal_payload jsonb; segments_json jsonb;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida o expirada'; end if;
  perform public.cw_auto_close_round(p.game_id);
  update public.cw_players set last_seen_at=now() where id=p.id;
  select * into g from public.cw_games where id=p.game_id;
  select content into card from public.cw_role_cards where round_number=g.current_round and role_code=p.role_code;
  select jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'score',jsonb_build_object('impact',t.score_impact,'evidence',t.score_evidence,'design',t.score_design,'risk',t.score_risk,'adaptation',t.score_adaptation),'locked',exists(select 1 from public.cw_decisions x where x.team_id=t.id and x.round_number=g.current_round))) into teams_json from public.cw_teams t where t.game_id=g.id;
  select payload,result,true into d,result_json,locked from public.cw_decisions where game_id=g.id and team_id=p.team_id and round_number=g.current_round;
  if g.current_round=1 then
    select public.cw_public_customers() into customers;
    if g.status in ('reveal','teaching','microcheck','finished') and d is not null then
      select jsonb_agg(jsonb_build_object('id',c.customer_id,'name',c.name,'segment',c.segment,'score',c.predictive_score,'p0',c.p0,'p1',c.p1,'effect',c.p1-c.p0) order by c.predictive_score desc)
      into reveal_payload from public.cw_ground_truth_customers c where c.customer_id in (select jsonb_array_elements_text(d->'selected'));
    end if;
  end if;
  if g.current_round=4 then
    select jsonb_agg(jsonb_build_object('id',segment_id,'name',name,'effect',effect_pp,'risk',risk) order by effect_pp desc) into segments_json from public.cw_ground_truth_segments;
  end if;
  return jsonb_build_object('server_time',now(),'game',jsonb_build_object('id',g.id,'code',g.code,'title',g.title,'phase',g.status,'round',g.current_round,'closes_at',g.closes_at,'public_message',g.public_message),'player',jsonb_build_object('id',p.id,'team_id',p.team_id,'display_name',p.display_name,'role_code',p.role_code),'role_card',card,'teams',coalesce(teams_json,'[]'::jsonb),'decision',d,'result',result_json,'locked',locked,'customers',customers,'reveal_payload',reveal_payload,'segments',segments_json);
end $$;

create or replace function public.cw_facilitator_state(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare gid uuid; g public.cw_games; teams_json jsonb; events_json jsonb; rank_mode text;
begin
  gid:=public.cw_validate_facilitator_token(p_token); if gid is null then raise exception 'Sesión inválida'; end if;
  perform public.cw_auto_close_round(gid);
  select * into g from public.cw_games where id=gid;
  rank_mode:=case when g.current_round=1 and g.status='closed' then 'observed' else 'causal' end;
  select jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'online',(select count(*) from public.cw_players p where p.team_id=t.id and p.active and p.last_seen_at>now()-interval '90 seconds'),'locked',exists(select 1 from public.cw_decisions d where d.team_id=t.id and d.round_number=g.current_round),'observed_conversion',case when g.current_round=1 and g.status in ('closed','reveal','teaching','microcheck','finished') then (select round(100*avg(c.p1),1) from public.cw_decisions d cross join lateral jsonb_array_elements_text(d.payload->'selected') s(customer_id) join public.cw_ground_truth_customers c on c.customer_id=s.customer_id where d.team_id=t.id and d.round_number=1) end,'score',jsonb_build_object('impact',t.score_impact,'evidence',t.score_evidence,'design',t.score_design,'risk',t.score_risk,'adaptation',t.score_adaptation),'check_correct',(select count(*) from public.cw_microchecks m join public.cw_players p on p.id=m.player_id where p.team_id=t.id and m.round_number=g.current_round and m.correct))) into teams_json from public.cw_teams t where t.game_id=gid;
  select coalesce(jsonb_agg(jsonb_build_object('at',created_at,'type',event_type,'message',payload) order by created_at desc),'[]'::jsonb) into events_json from (select * from public.cw_events where game_id=gid order by created_at desc limit 50) e;
  return jsonb_build_object('server_time',now(),'game',jsonb_build_object('id',g.id,'code',g.code,'phase',g.status,'round',g.current_round,'closes_at',g.closes_at,'paused_remaining_seconds',g.paused_remaining_seconds,'public_message',g.public_message,'rank_mode',rank_mode),'teams',coalesce(teams_json,'[]'::jsonb),'audit',events_json);
end $$;

create or replace function public.cw_wall_state(p_code text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare g public.cw_games; teams_json jsonb; rank_mode text;
begin
  select * into g from public.cw_games where code=upper(trim(p_code)); if g.id is null then raise exception 'Partida no encontrada'; end if;
  perform public.cw_auto_close_round(g.id);
  select * into g from public.cw_games where id=g.id;
  rank_mode:=case when g.current_round=1 and g.status='closed' then 'observed' else 'causal' end;
  select jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'observed_conversion',case when g.current_round=1 and g.status in ('closed','reveal','teaching','microcheck','finished') then (select round(100*avg(c.p1),1) from public.cw_decisions d cross join lateral jsonb_array_elements_text(d.payload->'selected') s(customer_id) join public.cw_ground_truth_customers c on c.customer_id=s.customer_id where d.team_id=t.id and d.round_number=1) end,'score',jsonb_build_object('impact',t.score_impact,'evidence',t.score_evidence,'design',t.score_design,'risk',t.score_risk,'adaptation',t.score_adaptation))) into teams_json from public.cw_teams t where t.game_id=g.id;
  return jsonb_build_object('server_time',now(),'game',jsonb_build_object('code',g.code,'phase',g.status,'round',g.current_round,'closes_at',g.closes_at,'public_message',g.public_message,'rank_mode',rank_mode),'teams',coalesce(teams_json,'[]'::jsonb));
end $$;

revoke all on function public.cw_auto_close_round(uuid) from public,anon,authenticated;
revoke all on function public.cw_submit_decision(text,int,jsonb,text) from public,anon,authenticated;
revoke all on function public.cw_facilitator_transition(text,text,int) from public,anon,authenticated;
revoke all on function public.cw_game_state(text) from public,anon,authenticated;
revoke all on function public.cw_facilitator_state(text) from public,anon,authenticated;
revoke all on function public.cw_wall_state(text) from public,anon,authenticated;
grant execute on function public.cw_auto_close_round(uuid) to service_role;
grant execute on function public.cw_submit_decision(text,int,jsonb,text) to service_role;
grant execute on function public.cw_facilitator_transition(text,text,int) to service_role;
grant execute on function public.cw_game_state(text) to service_role;
grant execute on function public.cw_facilitator_state(text) to service_role;
grant execute on function public.cw_wall_state(text) to service_role;
