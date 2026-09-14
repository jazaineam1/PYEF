create or replace function public.cw_submit_decision(p_token text,p_round int,p_payload jsonb,p_idempotency text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare p public.cw_players; g public.cw_games; did uuid;
begin
  select * into p from public.cw_validate_player_token(p_token); if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;
  if g.status<>'round' or g.current_round<>p_round then raise exception 'La ronda no está abierta'; end if;
  if p_round=1 and jsonb_array_length(coalesce(p_payload->'selected','[]'::jsonb))<>10 then raise exception 'Debes seleccionar exactamente 10 clientes'; end if;
  insert into public.cw_decisions(game_id,round_number,team_id,submitted_by,payload,idempotency_key)
  values(g.id,p_round,p.team_id,p.id,p_payload,p_idempotency)
  on conflict(game_id,round_number,team_id) do update set payload=excluded.payload,submitted_by=excluded.submitted_by,locked_at=now()
  returning id into did;
  insert into public.cw_events(game_id,actor,event_type,payload) values(g.id,p.id::text,'decision_locked',jsonb_build_object('round',p_round,'team_id',p.team_id));
  return jsonb_build_object('ok',true,'decision_id',did);
end $$;

create or replace function public.cw_submit_check(p_token text,p_round int,p_answer text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare p public.cw_players; g public.cw_games; expected text; is_ok boolean; inserted boolean:=false;
begin
  select * into p from public.cw_validate_player_token(p_token); if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;
  if g.status<>'microcheck' or g.current_round<>p_round then raise exception 'Microcheck no disponible'; end if;
  select correct_answer into expected from public.cw_answer_keys where round_number=p_round;
  is_ok := p_answer=expected;
  begin
    insert into public.cw_microchecks(game_id,round_number,player_id,answer,correct) values(g.id,p_round,p.id,p_answer,is_ok); inserted:=true;
  exception when unique_violation then
    select correct into is_ok from public.cw_microchecks where game_id=g.id and round_number=p_round and player_id=p.id;
  end;
  if inserted and is_ok then update public.cw_teams set score_evidence=least(25,score_evidence+1) where id=p.team_id; end if;
  return jsonb_build_object('ok',true,'correct',is_ok);
end $$;

create or replace function public.cw_score_round(p_game_id uuid,p_round int)
returns void language plpgsql security invoker set search_path=public as $$
declare d record; impact numeric; maximpact numeric; pts int; rec text; conf text; reason text; assignm text; outc text; horizon int; matched int; avoids boolean; p2 jsonb; p3 jsonb;
begin
  for d in select * from public.cw_decisions where game_id=p_game_id and round_number=p_round and scored=false for update loop
    if p_round=1 then
      select coalesce(sum(c.p1-c.p0),0), coalesce(avg(c.p1),0) into impact, maximpact from public.cw_ground_truth_customers c where c.customer_id in (select jsonb_array_elements_text(d.payload->'selected'));
      select sum(x.p1-x.p0) into maximpact from (select p1,p0 from public.cw_ground_truth_customers order by (p1-p0) desc limit 10) x;
      pts:=least(35,greatest(0,round(35*impact/nullif(maximpact,0))::int));
      update public.cw_teams set score_impact=greatest(score_impact,pts) where id=d.team_id;
      update public.cw_decisions set result=jsonb_build_object('impact',impact,'impact_points',pts),scored=true where id=d.id;
    elsif p_round=2 then
      rec:=d.payload->>'recommendation'; conf:=d.payload->>'confounder'; reason:=lower(coalesce(d.payload->>'reason','')); pts:=0;
      if rec='redesign' then pts:=pts+7; end if; if conf='mora_previa' then pts:=pts+8; end if; if position('compar' in reason)>0 then pts:=pts+3; end if;
      update public.cw_teams set score_evidence=least(25,score_evidence+pts),score_adaptation=least(10,score_adaptation+case when conf='mora_previa' then 2 else 0 end) where id=d.team_id;
      select value into p2 from public.cw_scenario_parameters where key='round2';
      update public.cw_decisions set result=coalesce(p2,jsonb_build_object('naive_effect_pp',-15,'causal_effect_pp',5)),scored=true where id=d.id;
    elsif p_round=3 then
      assignm:=d.payload->>'assignment';outc:=d.payload->>'outcome';horizon:=coalesce((d.payload->>'horizon')::int,0);pts:=0;
      if assignm='random' then pts:=pts+14; end if; if outc='pago_30d' then pts:=pts+3; end if; if horizon>=30 then pts:=pts+3; end if;
      update public.cw_teams set score_design=least(20,score_design+pts),score_evidence=least(25,score_evidence+case when assignm='random' then 2 else 0 end) where id=d.team_id;
      select value into p3 from public.cw_scenario_parameters where key='round3';
      update public.cw_decisions set result=coalesce(p3,jsonb_build_object('treatment',31,'control',25,'ate_pp',6)),scored=true where id=d.id;
    elsif p_round=4 then
      select count(*) into matched from jsonb_array_elements_text(coalesce(d.payload->'treat','[]'::jsonb)) x where x in ('digital','middle');
      select exists(select 1 from jsonb_array_elements_text(coalesce(d.payload->'avoid','[]'::jsonb)) x where x='arrears') into avoids;
      update public.cw_teams set score_risk=least(10,(case when avoids then 10 else 3 end)),score_adaptation=least(10,score_adaptation+matched*2),score_impact=least(35,score_impact+matched) where id=d.team_id;
      update public.cw_decisions set result=jsonb_build_object('matched_positive_segments',matched,'avoided_harm',avoids),scored=true where id=d.id;
    end if;
  end loop;
end $$;

create or replace function public.cw_facilitator_transition(p_token text,p_action text,p_seconds int default 60)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare gid uuid; g public.cw_games;
begin
  gid:=public.cw_validate_facilitator_token(p_token); if gid is null then raise exception 'Sesión de facilitador inválida'; end if;
  select * into g from public.cw_games where id=gid for update;
  if p_action='open' then update public.cw_games set status='round',started_at=now(),closes_at=now()+make_interval(secs=>duration_seconds),public_message='Ronda '||current_round||' abierta' where id=gid;
  elsif p_action='close' then update public.cw_games set status='closed',closes_at=now(),public_message='Decisiones cerradas' where id=gid;
  elsif p_action='reveal' then perform public.cw_score_round(gid,g.current_round); update public.cw_games set status='reveal',public_message=case when current_round=1 then 'VER EL OTRO FUTURO' else 'Reveal ronda '||current_round end where id=gid;
  elsif p_action='teach' then update public.cw_games set status='teaching',public_message='Concepto desbloqueado' where id=gid;
  elsif p_action='microcheck' then update public.cw_games set status='microcheck',public_message='Microcheck individual' where id=gid;
  elsif p_action='next' then if g.current_round>=4 then update public.cw_games set status='finished',public_message='Partida finalizada' where id=gid; else update public.cw_games set current_round=current_round+1,status='briefing',started_at=null,closes_at=null,public_message='Preparando ronda '||(current_round+1) where id=gid; end if;
  elsif p_action='pause' then update public.cw_games set status='paused',public_message='Partida pausada' where id=gid;
  elsif p_action='add_time' then update public.cw_games set closes_at=coalesce(closes_at,now())+make_interval(secs=>p_seconds) where id=gid;
  else raise exception 'Acción no soportada'; end if;
  insert into public.cw_events(game_id,actor,event_type,payload) values(gid,'facilitator','transition',jsonb_build_object('action',p_action,'round',g.current_round));
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.cw_facilitator_state(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare gid uuid; g public.cw_games; teams_json jsonb; events_json jsonb;
begin
  gid:=public.cw_validate_facilitator_token(p_token); if gid is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=gid;
  select jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'online',(select count(*) from public.cw_players p where p.team_id=t.id and p.active and p.last_seen_at>now()-interval '90 seconds'),'locked',exists(select 1 from public.cw_decisions d where d.team_id=t.id and d.round_number=g.current_round),'score',jsonb_build_object('impact',t.score_impact,'evidence',t.score_evidence,'design',t.score_design,'risk',t.score_risk,'adaptation',t.score_adaptation),'check_correct',(select count(*) from public.cw_microchecks m join public.cw_players p on p.id=m.player_id where p.team_id=t.id and m.round_number=g.current_round and m.correct))) into teams_json from public.cw_teams t where t.game_id=gid;
  select coalesce(jsonb_agg(jsonb_build_object('at',created_at,'type',event_type,'message',payload) order by created_at desc),'[]'::jsonb) into events_json from (select * from public.cw_events where game_id=gid order by created_at desc limit 50) e;
  return jsonb_build_object('game',jsonb_build_object('id',g.id,'code',g.code,'phase',g.status,'round',g.current_round,'closes_at',g.closes_at,'public_message',g.public_message),'teams',teams_json,'audit',events_json);
end $$;

create or replace function public.cw_wall_state(p_code text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare g public.cw_games; teams_json jsonb;
begin
  select * into g from public.cw_games where code=upper(trim(p_code)); if g.id is null then raise exception 'Partida no encontrada'; end if;
  select jsonb_agg(jsonb_build_object('id',id,'name',name,'score',jsonb_build_object('impact',score_impact,'evidence',score_evidence,'design',score_design,'risk',score_risk,'adaptation',score_adaptation))) into teams_json from public.cw_teams where game_id=g.id;
  return jsonb_build_object('game',jsonb_build_object('code',g.code,'phase',g.status,'round',g.current_round,'closes_at',g.closes_at,'public_message',g.public_message),'teams',teams_json);
end $$;

-- Lock down privileged RPCs. Edge Functions invoke them with the service role.
do $$ declare f text; begin
  foreach f in array array['cw_validate_player_token','cw_validate_facilitator_token','cw_bootstrap_game','cw_join_game','cw_facilitator_login','cw_public_customers','cw_game_state','cw_submit_decision','cw_submit_check','cw_score_round','cw_facilitator_transition','cw_facilitator_state','cw_wall_state']
  loop
    execute format('revoke all on function public.%I from public, anon, authenticated',f);
  end loop;
end $$;

-- Overloaded function signatures require explicit grants.
grant execute on function public.cw_join_game(text,text) to service_role;
grant execute on function public.cw_facilitator_login(text,text) to service_role;
grant execute on function public.cw_game_state(text) to service_role;
grant execute on function public.cw_submit_decision(text,int,jsonb,text) to service_role;
grant execute on function public.cw_submit_check(text,int,text) to service_role;
grant execute on function public.cw_facilitator_transition(text,text,int) to service_role;
grant execute on function public.cw_facilitator_state(text) to service_role;
grant execute on function public.cw_wall_state(text) to service_role;
grant execute on function public.cw_bootstrap_game(text,text) to service_role;
grant execute on function public.cw_score_round(uuid,int) to service_role;
grant execute on function public.cw_validate_player_token(text) to service_role;
grant execute on function public.cw_validate_facilitator_token(text) to service_role;
grant execute on function public.cw_public_customers() to service_role;
