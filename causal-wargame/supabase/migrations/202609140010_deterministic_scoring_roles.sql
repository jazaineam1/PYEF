-- DOS FUTUROS · deterministic scoring + meaningful cooperative role cards

create or replace function public.cw_submit_decision(p_token text,p_round int,p_payload jsonb,p_idempotency text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare
  p public.cw_players;
  g public.cw_games;
  did uuid;
  n_total int;
  n_distinct int;
  n_valid int;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;
  if g.status<>'round' or g.current_round<>p_round then raise exception 'La ronda no está abierta'; end if;

  if p_round=1 then
    if jsonb_array_length(coalesce(p_payload->'selected','[]'::jsonb))<>10 then
      raise exception 'Debes seleccionar exactamente 10 clientes';
    end if;
  elsif p_round=2 then
    if coalesce(p_payload->>'recommendation','') not in ('cancel','keep','redesign') then raise exception 'Recomendación inválida'; end if;
    if coalesce(p_payload->>'confounder','') not in ('edad','mora_previa','nombre') then raise exception 'Variable inválida'; end if;
    if coalesce(p_payload->>'reason_code','') not in ('baseline_difference','model_quality','sample_size','outcome_timing') then raise exception 'Razón inválida'; end if;
  elsif p_round=3 then
    if coalesce(p_payload->>'assignment','') not in ('advisor','model','random') then raise exception 'Asignación inválida'; end if;
    if coalesce(p_payload->>'outcome','') not in ('pago_30d','click') then raise exception 'Outcome inválido'; end if;
    if coalesce((p_payload->>'horizon')::int,0) not in (1,30,90) then raise exception 'Horizonte inválido'; end if;
  elsif p_round=4 then
    select count(*),count(distinct v),count(*) filter(where v in ('digital','middle','traditional','wealth','arrears'))
      into n_total,n_distinct,n_valid
    from (
      select jsonb_array_elements_text(coalesce(p_payload->'treat','[]'::jsonb)) v
      union all
      select jsonb_array_elements_text(coalesce(p_payload->'avoid','[]'::jsonb)) v
      union all
      select jsonb_array_elements_text(coalesce(p_payload->'observe','[]'::jsonb)) v
    ) x;
    if n_total<>5 or n_distinct<>5 or n_valid<>5 then
      raise exception 'Debes clasificar exactamente una vez los 5 segmentos';
    end if;
  end if;

  insert into public.cw_decisions(game_id,round_number,team_id,submitted_by,payload,idempotency_key)
  values(g.id,p_round,p.team_id,p.id,p_payload,p_idempotency)
  on conflict(game_id,round_number,team_id) do nothing
  returning id into did;

  if did is null then
    select id into did from public.cw_decisions where game_id=g.id and round_number=p_round and team_id=p.team_id;
  else
    insert into public.cw_events(game_id,actor,event_type,payload)
    values(g.id,p.id::text,'decision_locked',jsonb_build_object('round',p_round,'team_id',p.team_id));
  end if;

  return jsonb_build_object('ok',true,'decision_id',did);
end $$;

-- Microchecks are diagnostic/individual only. They never change the competitive score.
create or replace function public.cw_submit_check(p_token text,p_round int,p_answer text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare p public.cw_players; g public.cw_games; expected text; is_ok boolean;
begin
  select * into p from public.cw_validate_player_token(p_token); if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;
  if g.status<>'microcheck' or g.current_round<>p_round then raise exception 'Microcheck no disponible'; end if;
  select correct_answer into expected from public.cw_answer_keys where round_number=p_round;
  is_ok := p_answer=expected;
  insert into public.cw_microchecks(game_id,round_number,player_id,answer,correct)
  values(g.id,p_round,p.id,p_answer,is_ok)
  on conflict(game_id,round_number,player_id) do nothing;
  select correct into is_ok from public.cw_microchecks where game_id=g.id and round_number=p_round and player_id=p.id;
  return jsonb_build_object('ok',true,'correct',is_ok);
end $$;

-- Winner = deterministic sum of five dimensions with fixed maxima: 35+25+20+10+10 = 100.
create or replace function public.cw_score_round(p_game_id uuid,p_round int)
returns void language plpgsql security invoker set search_path=public as $$
declare
  d record;
  impact numeric;
  maximpact numeric;
  pts int;
  evidence_pts int;
  design_pts int;
  risk_pts int;
  adaptation_pts int;
  rec text;
  conf text;
  reason_code text;
  assignm text;
  outc text;
  horizon int;
  treat_arr jsonb;
  avoid_arr jsonb;
  observe_arr jsonb;
  p2 jsonb;
  p3 jsonb;
begin
  for d in select * from public.cw_decisions where game_id=p_game_id and round_number=p_round and scored=false for update loop
    if p_round=1 then
      select coalesce(sum(c.p1-c.p0),0) into impact
      from public.cw_ground_truth_customers c
      where c.customer_id in (select jsonb_array_elements_text(d.payload->'selected'));
      select coalesce(sum(x.p1-x.p0),0) into maximpact
      from (select p1,p0 from public.cw_ground_truth_customers order by (p1-p0) desc limit 10) x;
      pts:=least(35,greatest(0,round(35*impact/nullif(maximpact,0))::int));
      update public.cw_teams set score_impact=pts where id=d.team_id;
      update public.cw_decisions set result=jsonb_build_object('impact',impact,'impact_points',pts),scored=true where id=d.id;

    elsif p_round=2 then
      rec:=d.payload->>'recommendation';
      conf:=d.payload->>'confounder';
      reason_code:=d.payload->>'reason_code';
      evidence_pts:=0;
      if rec='redesign' then evidence_pts:=evidence_pts+8; end if;
      if conf='mora_previa' then evidence_pts:=evidence_pts+8; end if;
      if reason_code='baseline_difference' then evidence_pts:=evidence_pts+9; end if;
      update public.cw_teams set score_evidence=evidence_pts where id=d.team_id;
      select value into p2 from public.cw_scenario_parameters where key='round2';
      update public.cw_decisions set result=coalesce(p2,jsonb_build_object('naive_effect_pp',-15,'causal_effect_pp',5)),scored=true where id=d.id;

    elsif p_round=3 then
      assignm:=d.payload->>'assignment'; outc:=d.payload->>'outcome'; horizon:=coalesce((d.payload->>'horizon')::int,0);
      design_pts:=0;
      if assignm='random' then design_pts:=design_pts+12; end if;
      if outc='pago_30d' then design_pts:=design_pts+4; end if;
      if horizon in (30,90) then design_pts:=design_pts+4; end if;
      update public.cw_teams set score_design=design_pts where id=d.team_id;
      select value into p3 from public.cw_scenario_parameters where key='round3';
      update public.cw_decisions set result=coalesce(p3,jsonb_build_object('treatment',31,'control',25,'ate_pp',6)),scored=true where id=d.id;

    elsif p_round=4 then
      treat_arr:=coalesce(d.payload->'treat','[]'::jsonb);
      avoid_arr:=coalesce(d.payload->'avoid','[]'::jsonb);
      observe_arr:=coalesce(d.payload->'observe','[]'::jsonb);
      risk_pts:=case when avoid_arr ? 'arrears' then 10 else 0 end;
      adaptation_pts:=0;
      if treat_arr ? 'digital' then adaptation_pts:=adaptation_pts+3; end if;
      if treat_arr ? 'middle' then adaptation_pts:=adaptation_pts+3; end if;
      if observe_arr ? 'traditional' then adaptation_pts:=adaptation_pts+1; end if;
      if observe_arr ? 'wealth' then adaptation_pts:=adaptation_pts+1; end if;
      if avoid_arr ? 'arrears' then adaptation_pts:=adaptation_pts+2; end if;
      update public.cw_teams set score_risk=risk_pts,score_adaptation=adaptation_pts where id=d.team_id;
      update public.cw_decisions set result=jsonb_build_object('risk_points',risk_pts,'adaptation_points',adaptation_pts),scored=true where id=d.id;
    end if;
  end loop;
end $$;

-- Roles are cooperative information asymmetry: same goal, different pieces of evidence.
insert into public.cw_role_cards(round_number,role_code,content) values
(2,'business','Cobranza prioriza a los clientes que ya parecen más difíciles. La decisión debe ser cancelar, mantener o rediseñar.'),
(2,'data','Los llamados tenían mucha más mora previa que los no llamados.'),
(2,'context','Antes de esta estrategia, los clientes con mayor mora ya pagaban menos.'),
(2,'risk','Por política operativa, los clientes con más de 90 días de mora casi siempre reciben llamada.'),
(2,'integrator','Para concluir causalidad, el equipo debe decidir si los grupos eran comparables desde antes.'),
(3,'business','La decisión de negocio importa a 30 días: un clic inmediato no es el outcome principal.'),
(3,'data','Seleccionar sólo scores altos vuelve a formar grupos con perfiles diferentes. Una asignación aleatoria evita ese criterio de selección.'),
(3,'context','Los asesores usan información de riesgo al decidir a quién llamar; dejar esa elección manual mantiene diferencias previas entre grupos.'),
(3,'risk','Necesitamos conservar un grupo comparable que no reciba la intervención para medir qué habría ocurrido sin ella.'),
(3,'integrator','La dirección exige una regla única: asesor, modelo o azar; además outcome e horizonte deben quedar definidos antes de ejecutar.'),
(4,'business','La capacidad es limitada: conviene priorizar donde la intervención genera mayor cambio, no donde la conversión base es más alta.'),
(4,'data','Los mayores efectos positivos están en Jóvenes digitales e Ingreso medio. Tradicional y Patrimonio alto tienen efecto pequeño.'),
(4,'context','Patrimonio alto puede tener alta probabilidad de conversión y aun así cambiar muy poco por la intervención.'),
(4,'risk','Mora alta muestra efecto negativo: intervenir ese segmento puede empeorar el resultado.'),
(4,'integrator','La política debe clasificar los cinco segmentos exactamente una vez: intervenir, no intervenir o pedir más evidencia.')
on conflict(round_number,role_code) do update set content=excluded.content;

grant execute on function public.cw_submit_decision(text,int,jsonb,text) to service_role;
grant execute on function public.cw_submit_check(text,int,text) to service_role;
grant execute on function public.cw_score_round(uuid,int) to service_role;
