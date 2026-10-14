-- V2.5 · Academic causal curriculum: six missions over three reusable data profiles
-- Internal legacy column names are preserved to avoid destructive schema changes.
-- User-facing semantics are academic: prediction, support intervention, grades and academic profiles.

-- ---------------------------------------------------------------------------
-- 1) Six modular challenges. Correct checkpoint answers stay server-side.
-- ---------------------------------------------------------------------------
insert into public.cw_v2_challenge_runtime(
  round_number,challenge_key,correct_answer,lab_points,check_points,revision_points,team_points,
  enabled,profile_round,template,lab_key,lab_step_ids
) values
  (1,'prediction-vs-intervention','b',20,30,20,30,true,1,'cohort-selection','prediction',array['fit','rank']),
  (2,'randomized-experiment','a',20,30,20,30,true,3,'single-choice','ab-test',array['ate','uncertainty','ci']),
  (3,'dag-adjustment','b',20,30,20,30,true,2,'multi-select','dag',array['raw','confounder','bad-control']),
  (4,'double-machine-learning','b',20,30,20,30,true,2,'single-choice','dml',array['nuisance','residuals','effect']),
  (5,'heterogeneous-effects','b',20,30,20,30,true,3,'segment-policy','heterogeneity',array['ate','cate','tlearner']),
  (6,'causal-model-battle','c',20,30,20,30,true,3,'single-choice','model-battle',array['s-vs-t','dr','econml'])
on conflict(round_number) do update set
  challenge_key=excluded.challenge_key,
  correct_answer=excluded.correct_answer,
  lab_points=excluded.lab_points,
  check_points=excluded.check_points,
  revision_points=excluded.revision_points,
  team_points=excluded.team_points,
  enabled=excluded.enabled,
  profile_round=excluded.profile_round,
  template=excluded.template,
  lab_key=excluded.lab_key,
  lab_step_ids=excluded.lab_step_ids;

update public.cw_v2_challenge_runtime set enabled=false where round_number>6;

-- ---------------------------------------------------------------------------
-- 2) Retheme the reusable data tables to academic behavior.
-- ---------------------------------------------------------------------------
with numbered as (
  select customer_id,row_number() over(order by customer_id)::int as rn
  from public.cw_v2_customers
)
update public.cw_v2_customers c
set
  name='Estudiante '||lpad(n.rn::text,2,'0'),
  segment=(array['Sobreexigido','Equilibrado','Sueño insuficiente','Alta fatiga'])[((n.rn-1)%4)+1],
  usage_score=5+((n.rn*7)%10),
  bugs=1+((n.rn*5)%9),
  discount_pct=4+((n.rn*3)%5),
  tenure_months=280+((n.rn*13)%151),
  predictive_score=round((0.45+((n.rn*11)%46)/100.0)::numeric,3),
  p0=round((0.38+((n.rn*7)%35)/100.0)::numeric,3),
  p1=round(least(.97,(0.38+((n.rn*7)%35)/100.0)+
      (array[.02,.18,.05,.11,-.02,.14,.04,.09])[((n.rn-1)%8)+1])::numeric,3),
  baseline_risk=1+((n.rn*3)%4),
  historical_treated=(1+((n.rn*3)%4))>=3,
  historical_outcome=case when ((n.rn*29)%100) <
      round(100*least(.95,(0.38+((n.rn*7)%35)/100.0)+case when (1+((n.rn*3)%4))>=3 then .08 else 0 end)) then 1 else 0 end,
  shap=jsonb_build_array(
    jsonb_build_object('feature','PGA previo','impact',round((((n.rn*3)%8)-2)::numeric,1)),
    jsonb_build_object('feature','Horas de estudio','impact',round((((n.rn*5)%7)-2)::numeric,1)),
    jsonb_build_object('feature','Fatiga','impact',round((2-((n.rn*4)%6))::numeric,1))
  )
from numbered n where c.customer_id=n.customer_id;

update public.cw_v2_segments
set
  name=case segment_id
    when 'digital' then 'Alta fatiga'
    when 'middle' then 'Equilibrado'
    when 'traditional' then 'Sueño insuficiente'
    when 'wealth' then 'Sobreexigido'
    else 'Sin señal clara' end,
  audience=case segment_id
    when 'digital' then 700
    when 'middle' then 800
    when 'traditional' then 600
    when 'wealth' then 400
    else 500 end,
  effect_pp=case segment_id
    when 'digital' then 10.4
    when 'middle' then 7.8
    when 'traditional' then 3.1
    when 'wealth' then 1.2
    else -1.5 end,
  ci_low=case segment_id
    when 'digital' then 7.2
    when 'middle' then 5.0
    when 'traditional' then .4
    when 'wealth' then -1.1
    else -4.3 end,
  ci_high=case segment_id
    when 'digital' then 13.6
    when 'middle' then 10.6
    when 'traditional' then 5.8
    when 'wealth' then 3.5
    else 1.3 end,
  value_per_result=1,
  unit_cost=0,
  risk=case segment_id
    when 'digital' then 'Alto'
    when 'middle' then 'Medio'
    when 'traditional' then 'Medio'
    when 'wealth' then 'Bajo'
    else 'Alto' end;

update public.cw_v2_economy
set renewal_value_cop=1,intervention_cost_cop=0,cohort_size=100,capacity=1500,observation_audience=3000,updated_at=now()
where config_key='retention_v1';

with z as (
  select row_id,
    case
      when (row_id%100)<28 then 'digital'
      when (row_id%100)<58 then 'middle'
      when (row_id%100)<76 then 'traditional'
      when (row_id%100)<86 then 'wealth'
      else 'arrears' end as seg,
    (((row_id*43+11)%997)/997.0)<.5 as tr
  from public.cw_v2_experiment
)
update public.cw_v2_experiment e
set
  segment_id=z.seg,
  usage_score=5+((e.row_id*7)%10),
  tenure_months=280+((e.row_id*13)%151),
  treated=z.tr,
  renewed=case when (((e.row_id*137+71)%991)/991.0) <
    least(.95,greatest(.05,
      (case z.seg when 'digital' then .38 when 'middle' then .43 when 'traditional' then .49 when 'wealth' then .62 else .27 end)
      + case when z.tr then (case z.seg when 'digital' then .104 when 'middle' then .078 when 'traditional' then .031 when 'wealth' then .012 else -.015 end) else 0 end
    )) then 1 else 0 end
from z where e.row_id=z.row_id;

-- ---------------------------------------------------------------------------
-- 3) Template-driven validation. Data profile no longer dictates interaction.
-- ---------------------------------------------------------------------------
create or replace function public.cw_v2_submit_individual(p_token text,p_round int,p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare p public.cw_players; g public.cw_games; cfg public.cw_v2_challenge_runtime; n int; choice text;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;
  select * into cfg from public.cw_v2_challenge_runtime where round_number=p_round and enabled;
  if cfg.round_number is null then raise exception 'Reto no configurado'; end if;
  if g.status<>'round' or g.current_round<>p_round then raise exception 'El reto no está abierto'; end if;
  if jsonb_typeof(coalesce(p_payload,'null'::jsonb))<>'object' or pg_column_size(p_payload)>8192 then raise exception 'Propuesta inválida'; end if;

  if cfg.template='cohort-selection' then
    n:=jsonb_array_length(coalesce(p_payload->'selected','[]'::jsonb));
    if n<1 or n>3 then raise exception 'Selecciona entre 1 y 3 perfiles'; end if;
  elsif cfg.template='single-choice' then
    choice:=coalesce(p_payload->>'choice','');
    if (p_round=2 and choice not in ('randomized','prediction','raw-correlation'))
      or (p_round=4 and choice not in ('predict-y','dml','raw'))
      or (p_round=6 and choice not in ('t-learner','dr-learner','causal-forest','depends'))
    then raise exception 'Opción inválida'; end if;
  elsif cfg.template='multi-select' then
    n:=jsonb_array_length(coalesce(p_payload->'selected','[]'::jsonb));
    if n<1 or n>4 then raise exception 'Selecciona entre 1 y 4 variables'; end if;
  elsif cfg.template='segment-policy' then
    if jsonb_typeof(p_payload->'choices')<>'object' then raise exception 'Clasifica los perfiles académicos'; end if;
  else raise exception 'Template no soportado';
  end if;

  insert into public.cw_v2_individual_submissions(game_id,round_number,team_id,player_id,payload)
  values(p.game_id,p_round,p.team_id,p.id,p_payload)
  on conflict(game_id,round_number,player_id)
  do update set payload=excluded.payload,submitted_at=now();
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.cw_v2_submit_revision(p_token text,p_round int,p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare p public.cw_players; g public.cw_games; cfg public.cw_v2_challenge_runtime; n int; choice text;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;
  select * into cfg from public.cw_v2_challenge_runtime where round_number=p_round and enabled;
  if cfg.round_number is null then raise exception 'Reto no configurado'; end if;
  if g.status<>'round' or g.current_round<>p_round then raise exception 'El reto no está abierto'; end if;
  if jsonb_typeof(coalesce(p_payload,'null'::jsonb))<>'object' or pg_column_size(p_payload)>8192 then raise exception 'Revisión inválida'; end if;

  if cfg.template='cohort-selection' then
    n:=jsonb_array_length(coalesce(p_payload->'selected','[]'::jsonb));
    if n<1 or n>3 then raise exception 'Selecciona entre 1 y 3 perfiles'; end if;
  elsif cfg.template='single-choice' then
    choice:=coalesce(p_payload->>'choice','');
    if (p_round=2 and choice not in ('randomized','prediction','raw-correlation'))
      or (p_round=4 and choice not in ('predict-y','dml','raw'))
      or (p_round=6 and choice not in ('t-learner','dr-learner','causal-forest','depends'))
    then raise exception 'Opción inválida'; end if;
  elsif cfg.template='multi-select' then
    n:=jsonb_array_length(coalesce(p_payload->'selected','[]'::jsonb));
    if n<1 or n>4 then raise exception 'Selecciona entre 1 y 4 variables'; end if;
  elsif cfg.template='segment-policy' then
    if jsonb_typeof(p_payload->'choices')<>'object' then raise exception 'Clasifica los perfiles académicos'; end if;
  else raise exception 'Template no soportado';
  end if;

  insert into public.cw_v2_revisions(game_id,round_number,team_id,player_id,payload)
  values(p.game_id,p_round,p.team_id,p.id,p_payload)
  on conflict(game_id,round_number,player_id)
  do update set payload=excluded.payload,submitted_at=now();

  insert into public.cw_events(game_id,actor,event_type,payload)
  values(p.game_id,p.id::text,'v2_revision_submitted',jsonb_build_object('round',p_round));
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.cw_v2_submit_team_decision(p_token text,p_round int,p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare
  p public.cw_players; g public.cw_games; cfg public.cw_v2_challenge_runtime;
  humans int; submitted int; revised int; did uuid; n int; choice text;
  impact numeric:=0; best numeric:=0; treated_audience int:=0; score int:=0; result jsonb:='{}'::jsonb;
  selected_text text[];
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;
  select * into cfg from public.cw_v2_challenge_runtime where round_number=p_round and enabled;
  if cfg.round_number is null then raise exception 'Reto no configurado'; end if;
  if g.status<>'round' or g.current_round<>p_round then raise exception 'El reto no está abierto'; end if;

  select count(*) into humans from public.cw_players where game_id=p.game_id and team_id=p.team_id and active and not is_bot;
  select count(*) into submitted from public.cw_v2_individual_submissions where game_id=p.game_id and team_id=p.team_id and round_number=p_round;
  select count(*) into revised from public.cw_v2_revisions where game_id=p.game_id and team_id=p.team_id and round_number=p_round;
  if submitted<humans then raise exception 'Primero deben responder todos los integrantes (%/%).',submitted,humans; end if;
  if revised<humans then raise exception 'Primero deben revisar todos los integrantes (%/%).',revised,humans; end if;
  if exists(select 1 from public.cw_v2_team_decisions where game_id=p.game_id and team_id=p.team_id and round_number=p_round) then raise exception 'La decisión del equipo ya está bloqueada'; end if;

  if cfg.template='cohort-selection' then
    n:=jsonb_array_length(coalesce(p_payload->'selected','[]'::jsonb));
    if n<>10 or (select count(distinct x) from jsonb_array_elements_text(coalesce(p_payload->'selected','[]'::jsonb)) x)<>10 then raise exception 'El equipo debe seleccionar exactamente 10 perfiles'; end if;
    select coalesce(sum((c.p1-c.p0)*100),0) into impact
    from public.cw_v2_customers c where c.customer_id in (select jsonb_array_elements_text(p_payload->'selected'));
    select coalesce(sum(v),0) into best from (
      select (p1-p0)*100 as v from public.cw_v2_customers order by v desc limit 10
    ) q;
    score:=greatest(0,least(100,round(100*impact/nullif(best,0))::int));
    result:=jsonb_build_object('score',score,'impact_students',round(impact,1),'best_impact_students',round(best,1),'incremental_value_cop',round(impact,1));

  elsif cfg.template='single-choice' then
    choice:=coalesce(p_payload->>'choice','');
    score:=case p_round
      when 2 then case choice when 'randomized' then 100 when 'prediction' then 25 else 15 end
      when 4 then case choice when 'dml' then 100 when 'predict-y' then 20 else 10 end
      when 6 then case choice when 'depends' then 100 when 'dr-learner' then 75 when 'causal-forest' then 70 else 55 end
      else 0 end;
    result:=jsonb_build_object('score',score,'impact_students',0,'incremental_value_cop',0,'choice',choice);

  elsif cfg.template='multi-select' then
    select array_agg(x order by x) into selected_text from jsonb_array_elements_text(coalesce(p_payload->'selected','[]'::jsonb)) x;
    if selected_text=array['complejidad','pga_previo']::text[] then score:=100;
    elsif selected_text @> array['pga_previo']::text[] and not (selected_text && array['horas_estudio_post','tutorias_post']::text[]) then score:=75;
    elsif selected_text && array['horas_estudio_post','tutorias_post']::text[] then score:=25;
    else score:=45; end if;
    result:=jsonb_build_object('score',score,'impact_students',0,'incremental_value_cop',0,'adjustment_set',selected_text);

  elsif cfg.template='segment-policy' then
    n:=(select count(*) from (
      select jsonb_array_elements_text(coalesce(p_payload->'treat','[]'::jsonb)) x
      union all select jsonb_array_elements_text(coalesce(p_payload->'avoid','[]'::jsonb))
      union all select jsonb_array_elements_text(coalesce(p_payload->'observe','[]'::jsonb))
    ) z);
    if n<>5 or (select count(distinct x) from (
      select jsonb_array_elements_text(coalesce(p_payload->'treat','[]'::jsonb)) x
      union all select jsonb_array_elements_text(coalesce(p_payload->'avoid','[]'::jsonb))
      union all select jsonb_array_elements_text(coalesce(p_payload->'observe','[]'::jsonb))
    ) z)<>5 then raise exception 'Clasifica exactamente una vez los 5 arquetipos'; end if;

    select coalesce(sum(s.audience),0),coalesce(sum((s.effect_pp/100.0)*s.audience),0)
    into treated_audience,impact
    from public.cw_v2_segments s
    where s.segment_id in (select jsonb_array_elements_text(coalesce(p_payload->'treat','[]'::jsonb)));

    if treated_audience>(select capacity from public.cw_v2_economy where config_key='retention_v1') then raise exception 'La política supera los cupos disponibles'; end if;

    select coalesce(sum((effect_pp/100.0)*audience),0) into best
    from public.cw_v2_segments where segment_id in ('digital','middle');

    score:=greatest(0,least(100,round(100*impact/nullif(best,0))::int));
    result:=jsonb_build_object('score',score,'impact_students',round(impact,1),'best_impact_students',round(best,1),'treated_audience',treated_audience,'incremental_value_cop',round(impact,1));
  else
    raise exception 'Template no soportado';
  end if;

  insert into public.cw_v2_team_decisions(game_id,round_number,team_id,submitted_by,payload,result)
  values(p.game_id,p_round,p.team_id,p.id,p_payload,result) returning id into did;

  -- Team learning points are stored immediately but remain hidden until reveal.
  insert into public.cw_v2_checkpoint_scores(
    game_id,round_number,team_id,player_id,checkpoint,points,max_points,visible,payload
  )
  select p.game_id,p_round,p.team_id,pl.id,'team',
         round(cfg.team_points*score/100.0)::int,cfg.team_points,false,
         jsonb_build_object('team_score_pct',score,'decision_id',did)
  from public.cw_players pl
  where pl.game_id=p.game_id and pl.team_id=p.team_id and pl.active and not pl.is_bot
  on conflict(game_id,round_number,player_id,checkpoint)
  do update set
    points=excluded.points,max_points=excluded.max_points,visible=false,
    payload=excluded.payload,scored_at=now();

  insert into public.cw_events(game_id,actor,event_type,payload)
  values(p.game_id,p.id::text,'v2_team_decision_locked',jsonb_build_object('round',p_round,'team_id',p.team_id,'impact_students',result->'impact_students'));

  return jsonb_build_object('ok',true,'decision_id',did,'result',result);
end $$;

-- ---------------------------------------------------------------------------
-- 4) Academic analysis payloads. Same three backend profiles, six labs.
-- ---------------------------------------------------------------------------
create or replace function public.cw_v2_analysis(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare
  p public.cw_players; g public.cw_games; cfg public.cw_v2_challenge_runtime;
  humans int; submitted int; team_tools jsonb:=null; reveal_tools jsonb:=null;
  rows jsonb; segments jsonb; exp_t numeric; exp_c numeric;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;
  select * into cfg from public.cw_v2_challenge_runtime where round_number=g.current_round and enabled;
  if cfg.round_number is null then raise exception 'Reto sin configuración'; end if;

  select count(*) into humans from public.cw_players where game_id=p.game_id and team_id=p.team_id and active and not is_bot;
  select count(*) into submitted from public.cw_v2_individual_submissions where game_id=p.game_id and team_id=p.team_id and round_number=g.current_round;
  if submitted<humans then
    return jsonb_build_object('round',g.current_round,'status',g.status,'team_ready',false,'team_tools',null,'reveal_tools',null);
  end if;

  if cfg.profile_round=1 then
    select coalesce(jsonb_agg(jsonb_build_object(
      'usage',e.usage_score,
      'bugs',1+((e.row_id*5)%9),
      'discount',4+((e.row_id*3)%5),
      'tenure',e.tenure_months,
      'renewed',e.renewed,
      'grade',round(least(50,greatest(0,
        15+4*(e.tenure_months/100.0)+.75*e.usage_score+.45*(4+((e.row_id*3)%5))
        -.65*(1+((e.row_id*5)%9))-.45*(4+((e.row_id*7)%6))+6*e.renewed+(((e.row_id*17)%7)-3)
      ))::numeric,1)
    ) order by e.row_id),'[]'::jsonb)
    into rows from (select * from public.cw_v2_experiment order by row_id limit 650) e;

    team_tools:=jsonb_build_object(
      'ml_training',rows,
      'model_note','El desempeño predictivo de la nota no identifica el efecto de una intervención.'
    );

  elsif cfg.profile_round=2 then
    select coalesce(jsonb_agg(jsonb_build_object(
      'tenure',round((2.70+((i*13)%150)/100.0)*100)::int,
      'usage',5+((i*7)%10),
      'sleep',4+((i*3)%5),
      'fatigue',1+((i*5)%8),
      'complexity',4+((i*11)%6),
      'risk',1+((i*3)%4),
      'treated',(((i*37+17)%100) < case
        when (2.70+((i*13)%150)/100.0)<3.20 then 78
        when (1+((i*5)%8))>=6 then 65 else 28 end),
      'grade',round(least(50,greatest(0,
        15+4*(2.70+((i*13)%150)/100.0)+.70*(5+((i*7)%10))+.45*(4+((i*3)%5))
        -.70*(1+((i*5)%8))-.55*(4+((i*11)%6))
        + case when (((i*37+17)%100) < case when (2.70+((i*13)%150)/100.0)<3.20 then 78 when (1+((i*5)%8))>=6 then 65 else 28 end) then 4.8 else 0 end
        +(((i*19)%7)-3)
      ))::numeric,1),
      'renewed',case when
        15+4*(2.70+((i*13)%150)/100.0)+.70*(5+((i*7)%10))+.45*(4+((i*3)%5))
        -.70*(1+((i*5)%8))-.55*(4+((i*11)%6))
        + case when (((i*37+17)%100) < case when (2.70+((i*13)%150)/100.0)<3.20 then 78 when (1+((i*5)%8))>=6 then 65 else 28 end) then 4.8 else 0 end
        +(((i*19)%7)-3) >=30 then 1 else 0 end
    ) order by i),'[]'::jsonb)
    into rows from generate_series(1,800) i;

    team_tools:=jsonb_build_object(
      'observational_rows',rows,
      'dag',jsonb_build_object(
        'nodes',jsonb_build_array(
          jsonb_build_object('id','risk','label','PGA previo'),
          jsonb_build_object('id','treat','label','Apoyo académico'),
          jsonb_build_object('id','outcome','label','Nota final'),
          jsonb_build_object('id','mediator','label','Estudio posterior'),
          jsonb_build_object('id','collider','label','Tutorías posteriores')
        ),
        'edges',jsonb_build_array(
          jsonb_build_object('from','risk','to','treat','kind','confounding'),
          jsonb_build_object('from','risk','to','outcome','kind','confounding'),
          jsonb_build_object('from','treat','to','outcome','kind','causal'),
          jsonb_build_object('from','treat','to','mediator','kind','causal'),
          jsonb_build_object('from','mediator','to','outcome','kind','causal'),
          jsonb_build_object('from','treat','to','collider','kind','warning')
        ),
        'adjust_options',jsonb_build_array(
          jsonb_build_object('id','none','label','No ajustar','good',false,'highlights','[]'::jsonb,'explanation','La comparación conserva confusión por variables previas.'),
          jsonb_build_object('id','risk','label','Ajustar PGA previo y complejidad','good',true,'highlights',jsonb_build_array('risk'),'explanation','Bloquea causas previas sin controlar mecanismos posteriores.'),
          jsonb_build_object('id','post','label','Controlar variables posteriores','good',false,'highlights',jsonb_build_array('mediator','collider'),'explanation','Puede borrar parte del efecto o introducir sesgo.')
        )
      )
    );

  else
    select coalesce(jsonb_agg(jsonb_build_object(
      'segment',case e.segment_id
        when 'digital' then 'Alta fatiga'
        when 'middle' then 'Equilibrado'
        when 'traditional' then 'Sueño insuficiente'
        when 'wealth' then 'Sobreexigido'
        else 'Sin señal clara' end,
      'usage',e.usage_score,
      'tenure',e.tenure_months,
      'sleep',4+((e.row_id*3)%5),
      'fatigue',1+((e.row_id*5)%8),
      'complexity',4+((e.row_id*7)%6),
      'treated',e.treated,
      'renewed',e.renewed,
      'grade',round(least(50,greatest(0,
        15+4*(e.tenure_months/100.0)+.75*e.usage_score+.45*(4+((e.row_id*3)%5))
        -.65*(1+((e.row_id*5)%8))-.45*(4+((e.row_id*7)%6))
        + case when e.treated then case e.segment_id when 'digital' then 10.4 when 'middle' then 7.8 when 'traditional' then 3.1 when 'wealth' then 1.2 else -1.5 end else 0 end
        +(((e.row_id*17)%7)-3)
      ))::numeric,1)
    ) order by e.row_id),'[]'::jsonb)
    into rows from public.cw_v2_experiment e;

    select coalesce(jsonb_agg(jsonb_build_object(
      'id',s.segment_id,'name',s.name,'audience',s.audience,'risk',s.risk,
      'effect_pp',s.effect_pp,'ci_low',s.ci_low,'ci_high',s.ci_high
    ) order by s.segment_id),'[]'::jsonb) into segments from public.cw_v2_segments s;

    team_tools:=jsonb_build_object(
      'experiment_rows',rows,
      'segments',segments,
      'economy',jsonb_build_object('capacity',(select capacity from public.cw_v2_economy where config_key='retention_v1')),
      'econml',jsonb_build_array(
        jsonb_build_object('segment','digital','name','Alta fatiga','t_learner',9.6,'dr_learner',10.1,'causal_forest',10.5),
        jsonb_build_object('segment','middle','name','Equilibrado','t_learner',7.0,'dr_learner',7.7,'causal_forest',7.9),
        jsonb_build_object('segment','traditional','name','Sueño insuficiente','t_learner',2.4,'dr_learner',3.0,'causal_forest',3.3),
        jsonb_build_object('segment','wealth','name','Sobreexigido','t_learner',.8,'dr_learner',1.1,'causal_forest',1.4),
        jsonb_build_object('segment','arrears','name','Sin señal clara','t_learner',-1.0,'dr_learner',-1.4,'causal_forest',-1.6)
      )
    );
  end if;

  if g.status in ('reveal','teaching','microcheck','finished') then
    reveal_tools:=jsonb_build_object(
      'true_effect_points',4.8,
      'note','El mundo sintético conserva ground truth sólo para el reveal y la discusión docente.'
    );
  end if;

  return jsonb_build_object(
    'round',g.current_round,'status',g.status,'team_ready',true,
    'team_tools',team_tools,'reveal_tools',reveal_tools
  );
end $$;

comment on column public.cw_v2_challenge_runtime.profile_round is
  'Reusable data profile only: 1 predictive student profiles, 2 observational confounding, 3 randomized experiment. Interaction is controlled by template/lab_key.';
