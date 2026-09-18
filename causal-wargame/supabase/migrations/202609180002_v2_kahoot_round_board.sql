-- DOS FUTUROS V2 · compact Kahoot-like round board and cumulative scoring
-- Current-round points and all-team decisions remain hidden until the round is closed/revealed.

create or replace function public.cw_v2_submit_team_decision(p_token text,p_round int,p_payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path=public
as $$
declare
  p public.cw_players; g public.cw_games; humans int; submitted int; did uuid;
  n int; actual numeric:=0; best numeric:=0; score int:=0; result jsonb:='{}'::jsonb;
  treated_audience int:=0; policy_value numeric:=0;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;
  if g.status<>'round' or g.current_round<>p_round then raise exception 'La ronda no está abierta'; end if;

  select count(*) into humans from public.cw_players
  where game_id=p.game_id and team_id=p.team_id and active and not is_bot;
  select count(*) into submitted from public.cw_v2_individual_submissions
  where game_id=p.game_id and team_id=p.team_id and round_number=p_round;
  if submitted<humans then raise exception 'Primero deben enviar su propuesta todos los integrantes (%/%).',submitted,humans; end if;

  if exists(select 1 from public.cw_v2_team_decisions where game_id=p.game_id and team_id=p.team_id and round_number=p_round)
  then raise exception 'La decisión del equipo ya está bloqueada'; end if;

  if p_round=1 then
    n:=jsonb_array_length(coalesce(p_payload->'selected','[]'::jsonb));
    if n<>10 or (select count(distinct x) from jsonb_array_elements_text(coalesce(p_payload->'selected','[]'::jsonb)) x)<>10
    then raise exception 'El equipo debe seleccionar exactamente 10 clientes distintos'; end if;
    if (select count(*) from jsonb_array_elements_text(p_payload->'selected') x join public.cw_v2_customers c on c.customer_id=x)<>10
    then raise exception 'Hay clientes inválidos'; end if;

    select coalesce(sum((c.p1-c.p0)*100),0) into actual
    from public.cw_v2_customers c
    where c.customer_id in (select jsonb_array_elements_text(p_payload->'selected'));
    select coalesce(sum(uplift),0) into best from (
      select (p1-p0)*100 uplift from public.cw_v2_customers order by uplift desc limit 10
    ) q;
    score:=greatest(0,least(100,round(100*actual/nullif(best,0))::int));
    result:=jsonb_build_object('score',score,'uplift_pp_sum',round(actual,1),'best_possible_pp_sum',round(best,1));
  elsif p_round=2 then
    if coalesce(p_payload->>'recommendation','') not in ('cancel','keep','redesign') then raise exception 'Recomendación inválida'; end if;
    score:=case p_payload->>'recommendation' when 'redesign' then 100 when 'cancel' then 50 else 20 end;
    result:=jsonb_build_object('score',score,'best','redesign');
  elsif p_round=3 then
    if coalesce(p_payload->>'assignment','') not in ('advisor','model','random') then raise exception 'Asignación inválida'; end if;
    if coalesce(p_payload->>'outcome','') not in ('renewal_30d','click_1d') then raise exception 'Outcome inválido'; end if;
    score:=(case when p_payload->>'assignment'='random' then 50 else 0 end)
         +(case when p_payload->>'outcome'='renewal_30d' then 30 else 0 end)
         +(case when coalesce(nullif(p_payload->>'horizon','')::int,0)=30 then 20 else 0 end);
    result:=jsonb_build_object('score',score,'ate_pp',6,'ci',jsonb_build_array(2.2,9.8));
  else
    n:=(select count(*) from (
      select jsonb_array_elements_text(coalesce(p_payload->'treat','[]'::jsonb)) x
      union all select jsonb_array_elements_text(coalesce(p_payload->'avoid','[]'::jsonb))
      union all select jsonb_array_elements_text(coalesce(p_payload->'observe','[]'::jsonb))
    ) z);
    if n<>5 or (select count(distinct x) from (
      select jsonb_array_elements_text(coalesce(p_payload->'treat','[]'::jsonb)) x
      union all select jsonb_array_elements_text(coalesce(p_payload->'avoid','[]'::jsonb))
      union all select jsonb_array_elements_text(coalesce(p_payload->'observe','[]'::jsonb))
    ) z)<>5 then raise exception 'Clasifica exactamente una vez los 5 segmentos'; end if;

    select coalesce(sum(audience),0),coalesce(sum((effect_pp/100.0)*audience*value_per_result - audience*unit_cost),0)
    into treated_audience,policy_value
    from public.cw_v2_segments
    where segment_id in (select jsonb_array_elements_text(coalesce(p_payload->'treat','[]'::jsonb)));
    if treated_audience>15000 then raise exception 'La política supera la capacidad de 15.000 clientes'; end if;
    score:=15
      + case when coalesce(p_payload->'treat','[]'::jsonb) ? 'digital' then 25 else 0 end
      + case when coalesce(p_payload->'treat','[]'::jsonb) ? 'middle' then 20 else 0 end
      + case when coalesce(p_payload->'avoid','[]'::jsonb) ? 'arrears' then 15 else 0 end
      + case when coalesce(p_payload->'observe','[]'::jsonb) ? 'traditional' then 15 else 0 end
      + case when coalesce(p_payload->'observe','[]'::jsonb) ? 'wealth' then 10 else 0 end;
    result:=jsonb_build_object('score',score,'treated_audience',treated_audience,'policy_value',round(policy_value,0),'placebo_pp',4.7);
  end if;

  insert into public.cw_v2_team_decisions(game_id,round_number,team_id,submitted_by,payload,result)
  values(p.game_id,p_round,p.team_id,p.id,p_payload,result) returning id into did;

  insert into public.cw_events(game_id,actor,event_type,payload)
  values(p.game_id,p.id::text,'v2_team_decision_locked',jsonb_build_object('round',p_round,'team_id',p.team_id,'score',score));

  return jsonb_build_object('ok',true,'decision_id',did,'result',result);
end $$;

create or replace function public.cw_v2_wall_state(p_game_code text)
returns jsonb
language plpgsql
security invoker
set search_path=public
as $$
declare g public.cw_games; teams jsonb; players jsonb; decisions jsonb:='[]'::jsonb; reveal_current boolean:=false;
begin
  select * into g from public.cw_games where code=upper(trim(p_game_code));
  if g.id is null then raise exception 'Partida no encontrada'; end if;
  reveal_current:=g.status in ('closed','reveal','teaching','microcheck','finished');

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',t.id,'name',t.name,'position',t.position,
    'humans',(select count(*) from public.cw_players p where p.game_id=g.id and p.team_id=t.id and p.active and not p.is_bot),
    'submitted',(select count(*) from public.cw_v2_individual_submissions s where s.game_id=g.id and s.team_id=t.id and s.round_number=g.current_round),
    'decision',exists(select 1 from public.cw_v2_team_decisions d where d.game_id=g.id and d.team_id=t.id and d.round_number=g.current_round),
    'round_score',case when reveal_current then (select nullif(d.result->>'score','')::int from public.cw_v2_team_decisions d where d.game_id=g.id and d.team_id=t.id and d.round_number=g.current_round limit 1) else null end,
    'total_score',(select coalesce(sum(nullif(d.result->>'score','')::int),0) from public.cw_v2_team_decisions d where d.game_id=g.id and d.team_id=t.id and (d.round_number<g.current_round or (d.round_number=g.current_round and reveal_current))),
    'rounds_scored',(select count(*) from public.cw_v2_team_decisions d where d.game_id=g.id and d.team_id=t.id and (d.round_number<g.current_round or (d.round_number=g.current_round and reveal_current)))
  ) order by t.position),'[]'::jsonb)
  into teams
  from public.cw_teams t
  where t.game_id=g.id and (t.position<=g.team_target or exists(select 1 from public.cw_players p where p.team_id=t.id and p.active and not p.is_bot));

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',p.id,'name',p.display_name,'team_id',p.team_id,'team',t.name,
    'online',p.last_seen_at>now()-interval '35 seconds','joined_at',p.joined_at
  ) order by t.position,p.joined_at,p.id),'[]'::jsonb)
  into players
  from public.cw_players p join public.cw_teams t on t.id=p.team_id
  where p.game_id=g.id and p.active and not p.is_bot;

  if reveal_current then
    select coalesce(jsonb_agg(jsonb_build_object(
      'team_id',d.team_id,'team',t.name,'position',t.position,
      'payload',d.payload,'score',nullif(d.result->>'score','')::int
    ) order by t.position),'[]'::jsonb)
    into decisions
    from public.cw_v2_team_decisions d
    join public.cw_teams t on t.id=d.team_id
    where d.game_id=g.id and d.round_number=g.current_round;
  end if;

  return jsonb_build_object(
    'version','v2',
    'game',jsonb_build_object('code',g.code,'status',g.status,'round',g.current_round,'closes_at',g.closes_at,'team_target',g.team_target,'roster_locked',g.roster_locked),
    'humans',jsonb_array_length(players),
    'teams',teams,
    'players',players,
    'decisions',decisions
  );
end $$;

create or replace function public.cw_v2_state(p_token text)
returns jsonb
language plpgsql
security invoker
set search_path=public
as $$
declare
  p public.cw_players; g public.cw_games; team_name text;
  human_count int; seat_idx int; submission_count int; all_submitted boolean;
  packet jsonb:='[]'::jsonb; roster jsonb:='[]'::jsonb; team_submissions jsonb:='[]'::jsonb;
  team_decision jsonb:=null; reveal jsonb:=null; team_pool jsonb:=null; public_board jsonb:=null;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  update public.cw_players set last_seen_at=now() where id=p.id;
  select * into g from public.cw_games where id=p.game_id;
  select name into team_name from public.cw_teams where id=p.team_id;

  select count(*) into human_count
  from public.cw_players
  where game_id=p.game_id and team_id=p.team_id and active and not is_bot;

  select rn-1 into seat_idx from (
    select id,row_number() over(order by joined_at,id)::int rn
    from public.cw_players
    where game_id=p.game_id and team_id=p.team_id and active and not is_bot
  ) s where id=p.id;
  seat_idx:=coalesce(seat_idx,0);
  human_count:=greatest(human_count,1);

  select count(*) into submission_count
  from public.cw_v2_individual_submissions
  where game_id=p.game_id and team_id=p.team_id and round_number=g.current_round;
  all_submitted:=submission_count>=human_count;

  select coalesce(jsonb_agg(jsonb_build_object(
      'id',pl.id,'name',pl.display_name,
      'submitted',exists(select 1 from public.cw_v2_individual_submissions s where s.game_id=p.game_id and s.round_number=g.current_round and s.player_id=pl.id)
    ) order by pl.joined_at,pl.id),'[]'::jsonb)
  into roster
  from public.cw_players pl
  where pl.game_id=p.game_id and pl.team_id=p.team_id and pl.active and not pl.is_bot;

  if g.current_round in (1,2,3) then
    with numbered as (
      select c.*,row_number() over(order by customer_id)::int-1 as rn
      from public.cw_v2_customers c
    )
    select coalesce(jsonb_agg(
      case g.current_round
        when 1 then jsonb_build_object(
          'id',customer_id,'name',name,'segment',segment,'score',predictive_score,
          'usage',usage_score,'bugs',bugs,'discount',discount_pct,'tenure',tenure_months,'shap',shap)
        when 2 then jsonb_build_object(
          'id',customer_id,'name',name,'segment',segment,'risk',baseline_risk,
          'treated',historical_treated,'outcome',historical_outcome,'score',predictive_score)
        else jsonb_build_object(
          'id',customer_id,'name',name,'segment',segment,'risk',baseline_risk,'score',predictive_score)
      end order by customer_id
    ),'[]'::jsonb)
    into packet
    from numbered
    where (rn % human_count)=seat_idx;
  else
    with numbered as (
      select s.*,row_number() over(order by segment_id)::int-1 as rn from public.cw_v2_segments s
    )
    select coalesce(jsonb_agg(jsonb_build_object(
      'id',segment_id,'name',name,'audience',audience,'effect',effect_pp,
      'ci_low',ci_low,'ci_high',ci_high,'value',value_per_result,'cost',unit_cost,'risk',risk
    ) order by segment_id),'[]'::jsonb)
    into packet
    from numbered
    where (rn % human_count)=seat_idx;
  end if;

  if all_submitted then
    select coalesce(jsonb_agg(jsonb_build_object(
      'player_id',s.player_id,'name',pl.display_name,'payload',s.payload,'submitted_at',s.submitted_at
    ) order by s.submitted_at),'[]'::jsonb)
    into team_submissions
    from public.cw_v2_individual_submissions s
    join public.cw_players pl on pl.id=s.player_id
    where s.game_id=p.game_id and s.team_id=p.team_id and s.round_number=g.current_round;

    if g.current_round in (1,2,3) then
      select jsonb_agg(jsonb_build_object(
        'id',customer_id,'name',name,'segment',segment,'score',predictive_score,
        'usage',usage_score,'bugs',bugs,'discount',discount_pct,'tenure',tenure_months,'shap',shap,
        'risk',baseline_risk,'treated',historical_treated,'outcome',historical_outcome
      ) order by customer_id)
      into team_pool from public.cw_v2_customers;
    else
      select jsonb_agg(jsonb_build_object(
        'id',segment_id,'name',name,'audience',audience,'effect',effect_pp,'ci_low',ci_low,'ci_high',ci_high,
        'value',value_per_result,'cost',unit_cost,'risk',risk
      ) order by segment_id)
      into team_pool from public.cw_v2_segments;
    end if;
  end if;

  select jsonb_build_object('payload',d.payload,'result',d.result,'locked_at',d.locked_at)
  into team_decision
  from public.cw_v2_team_decisions d
  where d.game_id=p.game_id and d.team_id=p.team_id and d.round_number=g.current_round;

  if g.status in ('reveal','teaching','microcheck','finished') then
    if g.current_round=1 then
      select jsonb_build_object(
        'title','El modelo predijo bien. La política necesitaba otra pregunta.',
        'concept','Predicción ≠ efecto causal · contrafactual',
        'customers',jsonb_agg(jsonb_build_object(
          'id',customer_id,'name',name,'score',predictive_score,'p0',p0,'p1',p1,
          'uplift_pp',round(((p1-p0)*100)::numeric,1)
        ) order by customer_id)
      ) into reveal from public.cw_v2_customers;
    elsif g.current_round=2 then
      reveal:=jsonb_build_object(
        'title','Los grupos ya eran diferentes antes de la intervención.',
        'concept','Confusión · comparabilidad · overlap',
        'crude_pp',-13,'adjusted_pp',4.1,
        'dag','Riesgo previo → Intervención; Riesgo previo → Resultado; Intervención → Resultado',
        'overlap','En riesgo alto casi todos fueron tratados: el contrafactual tiene poco soporte.'
      );
    elsif g.current_round=3 then
      reveal:=jsonb_build_object(
        'title','El azar construye una comparación más creíble.',
        'concept','Randomización · ATE · incertidumbre',
        'treatment_rate',31,'control_rate',25,'ate_pp',6,'ci_low',2.2,'ci_high',9.8,
        'lesson','Más N reduce incertidumbre; no corrige una asignación sesgada.'
      );
    else
      select jsonb_build_object(
        'title','Un promedio positivo no significa tratar a todos.',
        'concept','CATE · incertidumbre · robustez · política',
        'placebo_pp',4.7,
        'segments',jsonb_agg(jsonb_build_object(
          'id',segment_id,'name',name,'audience',audience,'effect_pp',effect_pp,
          'ci_low',ci_low,'ci_high',ci_high,'risk',risk
        ) order by segment_id)
      ) into reveal from public.cw_v2_segments;
    end if;
  end if;

  public_board:=public.cw_v2_wall_state(g.code);

  return jsonb_build_object(
    'version','v2',
    'game',jsonb_build_object('code',g.code,'status',g.status,'round',g.current_round,'closes_at',g.closes_at,'message',g.public_message),
    'player',jsonb_build_object('id',p.id,'name',p.display_name,'team_id',p.team_id,'team',team_name,'seat',seat_idx+1),
    'team',jsonb_build_object('size',human_count,'submitted',submission_count,'all_submitted',all_submitted,'roster',roster),
    'packet',packet,
    'my_submission',(select payload from public.cw_v2_individual_submissions where game_id=p.game_id and round_number=g.current_round and player_id=p.id),
    'team_submissions',team_submissions,
    'team_pool',team_pool,
    'team_decision',team_decision,
    'reveal',reveal,
    'scoreboard',coalesce(public_board->'teams','[]'::jsonb),
    'all_team_decisions',coalesce(public_board->'decisions','[]'::jsonb),
    'hint',case g.current_round
      when 1 then 'SHAP explica por qué el modelo predice. Pregunta aparte: ¿qué variable te dice qué cambiaría si intervienes?'
      when 2 then 'Mira qué características existían antes del tratamiento y si aparecen en ambos grupos.'
      when 3 then 'Pregunta qué regla de asignación hace comparables tratamiento y control antes de mirar el resultado.'
      else 'No mires sólo el efecto puntual: combina signo, intervalo, capacidad y una prueba que pueda contradecir tu historia.'
    end
  );
end $$;

revoke all on function public.cw_v2_submit_team_decision(text,int,jsonb) from public,anon,authenticated;
revoke all on function public.cw_v2_wall_state(text) from public,anon,authenticated;
revoke all on function public.cw_v2_state(text) from public,anon,authenticated;
grant execute on function public.cw_v2_submit_team_decision(text,int,jsonb) to service_role;
grant execute on function public.cw_v2_wall_state(text) to service_role;
grant execute on function public.cw_v2_state(text) to service_role;
