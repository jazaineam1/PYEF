-- SOLO REHEARSAL MODE
-- Lets one facilitator test the full game without 19 colleagues.
-- Bots are server-side only and are clearly marked; production sessions can be reset cleanly.

alter table public.cw_players add column if not exists is_bot boolean not null default false;
create index if not exists cw_players_game_bot_idx on public.cw_players(game_id,is_bot,active);

create or replace function public.cw_generate_bot_decisions(p_game_id uuid,p_round int)
returns int language plpgsql security invoker set search_path=public as $$
declare
  t record; submitter uuid; payload jsonb; inserted_count int:=0;
begin
  for t in
    select tm.id,tm.position
    from public.cw_teams tm
    where tm.game_id=p_game_id
      and exists(select 1 from public.cw_players p where p.team_id=tm.id and p.active and p.is_bot)
      and not exists(select 1 from public.cw_players p where p.team_id=tm.id and p.active and not p.is_bot)
      and not exists(select 1 from public.cw_decisions d where d.game_id=p_game_id and d.team_id=tm.id and d.round_number=p_round)
    order by tm.position
  loop
    select p.id into submitter from public.cw_players p
    where p.team_id=t.id and p.active and p.is_bot
    order by case when p.role_code='integrator' then 0 else 1 end,p.joined_at limit 1;

    if p_round=1 then
      if t.position=1 then
        select jsonb_build_object('selected',jsonb_agg(customer_id order by predictive_score desc)) into payload
        from (select customer_id,predictive_score from public.cw_ground_truth_customers order by predictive_score desc limit 10) q;
      elsif t.position=2 then
        select jsonb_build_object('selected',jsonb_agg(customer_id order by effect desc)) into payload
        from (select customer_id,(p1-p0) effect from public.cw_ground_truth_customers order by (p1-p0) desc limit 10) q;
      elsif t.position=3 then
        select jsonb_build_object('selected',jsonb_agg(customer_id order by blend desc)) into payload
        from (select customer_id,(predictive_score+(p1-p0)) blend from public.cw_ground_truth_customers order by (predictive_score+(p1-p0)) desc limit 10) q;
      else
        select jsonb_build_object('selected',jsonb_agg(customer_id order by predictive_score asc)) into payload
        from (select customer_id,predictive_score from public.cw_ground_truth_customers order by predictive_score asc limit 10) q;
      end if;
    elsif p_round=2 then
      payload:=case t.position
        when 1 then jsonb_build_object('recommendation','cancel','confounder','edad','reason','Los llamados convierten menos; cancelaría la estrategia.')
        when 2 then jsonb_build_object('recommendation','redesign','confounder','mora_previa','reason','Los grupos no son comparables porque la mora previa influye en llamada y pago.')
        when 3 then jsonb_build_object('recommendation','keep','confounder','mora_previa','reason','No compararía directamente los grupos; ajustaría por mora previa antes de decidir.')
        else jsonb_build_object('recommendation','redesign','confounder','nombre','reason','Rediseñaría porque parece existir una diferencia entre grupos.') end;
    elsif p_round=3 then
      payload:=case t.position
        when 1 then jsonb_build_object('assignment','advisor','outcome','click','horizon',1)
        when 2 then jsonb_build_object('assignment','random','outcome','pago_30d','horizon',30)
        when 3 then jsonb_build_object('assignment','model','outcome','pago_30d','horizon',30)
        else jsonb_build_object('assignment','random','outcome','click','horizon',1) end;
    elsif p_round=4 then
      payload:=case t.position
        when 1 then jsonb_build_object('treat',jsonb_build_array('digital','middle'),'avoid',jsonb_build_array('arrears'),'observe',jsonb_build_array('traditional','wealth'))
        when 2 then jsonb_build_object('treat',jsonb_build_array('digital','traditional'),'avoid',jsonb_build_array('arrears'),'observe',jsonb_build_array('middle','wealth'))
        when 3 then jsonb_build_object('treat',jsonb_build_array('middle','wealth'),'avoid',jsonb_build_array('arrears'),'observe',jsonb_build_array('digital','traditional'))
        else jsonb_build_object('treat',jsonb_build_array('digital','middle','arrears'),'avoid',jsonb_build_array('traditional'),'observe',jsonb_build_array('wealth')) end;
    else
      continue;
    end if;

    insert into public.cw_decisions(game_id,round_number,team_id,submitted_by,payload,idempotency_key)
    values(p_game_id,p_round,t.id,submitter,payload,'bot-'||p_game_id::text||'-'||p_round::text||'-'||t.id::text)
    on conflict(game_id,round_number,team_id) do nothing;
    if found then
      inserted_count:=inserted_count+1;
      insert into public.cw_events(game_id,actor,event_type,payload)
      values(p_game_id,'bot','bot_decision_locked',jsonb_build_object('round',p_round,'team_id',t.id));
    end if;
  end loop;
  return inserted_count;
end $$;

create or replace function public.cw_seed_rehearsal_bots(p_game_id uuid)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare
  g public.cw_games; human_count int; active_count int; target int; slot record; roles text[]:=array['business','data','context','risk','integrator']; added int:=0;
begin
  select * into g from public.cw_games where id=p_game_id for update;
  if g.id is null then raise exception 'Partida no encontrada'; end if;
  if g.status not in ('lobby','briefing') then raise exception 'Los bots de ensayo sólo pueden prepararse antes de abrir una ronda'; end if;
  select count(*) filter(where not is_bot),count(*) into human_count,active_count from public.cw_players where game_id=p_game_id and active;
  target:=case when human_count=0 then 19 else 20 end;
  if active_count>=target then return jsonb_build_object('ok',true,'added',0,'players',active_count,'humans',human_count,'bots',active_count-human_count); end if;

  for slot in
    select t.id team_id,t.position,v.role_code,v.role_pos,t.name team_name
    from public.cw_teams t
    cross join (values ('business',1),('data',2),('context',3),('risk',4),('integrator',5)) v(role_code,role_pos)
    where t.game_id=p_game_id
      and not exists(select 1 from public.cw_players p where p.game_id=p_game_id and p.team_id=t.id and p.role_code=v.role_code and p.active)
    order by v.role_pos,t.position
  loop
    exit when active_count>=target;
    insert into public.cw_players(game_id,team_id,display_name,role_code,is_bot,last_seen_at)
    values(p_game_id,slot.team_id,'BOT · '||slot.team_name||' · '||slot.role_code,slot.role_code,true,now());
    active_count:=active_count+1; added:=added+1;
  end loop;
  insert into public.cw_events(game_id,actor,event_type,payload)
  values(p_game_id,'facilitator','rehearsal_bots_seeded',jsonb_build_object('added',added,'target',target));
  return jsonb_build_object('ok',true,'added',added,'players',active_count,'humans',human_count,'bots',active_count-human_count);
end $$;

create or replace function public.cw_facilitator_transition(p_token text,p_action text,p_seconds int default 60)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare gid uuid; g public.cw_games; remaining int; human_count int; bot_result jsonb; bot_decisions int;
begin
  gid:=public.cw_validate_facilitator_token(p_token); if gid is null then raise exception 'Sesión de facilitador inválida'; end if;
  perform public.cw_auto_close_round(gid);
  select * into g from public.cw_games where id=gid for update;
  if p_action='seed_bots' then
    bot_result:=public.cw_seed_rehearsal_bots(gid);
    return bot_result;
  elsif p_action='bot_decisions' then
    if g.status<>'round' then raise exception 'Los bots sólo pueden decidir durante una ronda abierta'; end if;
    bot_decisions:=public.cw_generate_bot_decisions(gid,g.current_round);
    return jsonb_build_object('ok',true,'bot_decisions',bot_decisions);
  elsif p_action='open' then
    select count(*) into human_count from public.cw_players where game_id=gid and active and not is_bot;
    if human_count=0 then raise exception 'No hay participantes humanos. Entra primero desde play.html antes de abrir la ronda.'; end if;
    if g.status not in ('lobby','briefing','closed') then raise exception 'No se puede abrir desde el estado %',g.status; end if;
    update public.cw_games set status='round',started_at=now(),closes_at=now()+make_interval(secs=>duration_seconds),paused_remaining_seconds=null,public_message='Ronda '||current_round||' abierta' where id=gid;
    perform public.cw_generate_bot_decisions(gid,g.current_round);
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

create or replace function public.cw_facilitator_state(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare gid uuid; g public.cw_games; teams_json jsonb; events_json jsonb; rank_mode text; total_players int; humans int; bots int;
begin
  gid:=public.cw_validate_facilitator_token(p_token); if gid is null then raise exception 'Sesión inválida'; end if;
  perform public.cw_auto_close_round(gid);
  select * into g from public.cw_games where id=gid;
  select count(*),count(*) filter(where not is_bot),count(*) filter(where is_bot) into total_players,humans,bots from public.cw_players where game_id=gid and active;
  rank_mode:=case when g.current_round=1 and g.status='closed' then 'observed' else 'causal' end;
  select jsonb_agg(jsonb_build_object(
    'id',t.id,'name',t.name,
    'online',(select count(*) from public.cw_players p where p.team_id=t.id and p.active and not p.is_bot and p.last_seen_at>now()-interval '90 seconds'),
    'humans',(select count(*) from public.cw_players p where p.team_id=t.id and p.active and not p.is_bot),
    'bots',(select count(*) from public.cw_players p where p.team_id=t.id and p.active and p.is_bot),
    'locked',exists(select 1 from public.cw_decisions d where d.team_id=t.id and d.round_number=g.current_round),
    'observed_conversion',case when g.current_round=1 and g.status in ('closed','reveal','teaching','microcheck','finished') then (select round(100*avg(c.p1),1) from public.cw_decisions d cross join lateral jsonb_array_elements_text(d.payload->'selected') s(customer_id) join public.cw_ground_truth_customers c on c.customer_id=s.customer_id where d.team_id=t.id and d.round_number=1) end,
    'score',jsonb_build_object('impact',t.score_impact,'evidence',t.score_evidence,'design',t.score_design,'risk',t.score_risk,'adaptation',t.score_adaptation),
    'check_correct',(select count(*) from public.cw_microchecks m join public.cw_players p on p.id=m.player_id where p.team_id=t.id and m.round_number=g.current_round and m.correct)
  )) into teams_json from public.cw_teams t where t.game_id=gid;
  select coalesce(jsonb_agg(jsonb_build_object('at',created_at,'type',event_type,'message',payload) order by created_at desc),'[]'::jsonb) into events_json from (select * from public.cw_events where game_id=gid order by created_at desc limit 50) e;
  return jsonb_build_object('server_time',now(),'game',jsonb_build_object('id',g.id,'code',g.code,'phase',g.status,'round',g.current_round,'closes_at',g.closes_at,'paused_remaining_seconds',g.paused_remaining_seconds,'public_message',g.public_message,'rank_mode',rank_mode,'player_count',total_players,'human_count',humans,'bot_count',bots),'teams',coalesce(teams_json,'[]'::jsonb),'audit',events_json);
end $$;

revoke all on function public.cw_generate_bot_decisions(uuid,int) from public,anon,authenticated;
revoke all on function public.cw_seed_rehearsal_bots(uuid) from public,anon,authenticated;
revoke all on function public.cw_facilitator_transition(text,text,int) from public,anon,authenticated;
revoke all on function public.cw_facilitator_state(text) from public,anon,authenticated;
grant execute on function public.cw_generate_bot_decisions(uuid,int) to service_role;
grant execute on function public.cw_seed_rehearsal_bots(uuid) to service_role;
grant execute on function public.cw_facilitator_transition(text,text,int) to service_role;
grant execute on function public.cw_facilitator_state(text) to service_role;
