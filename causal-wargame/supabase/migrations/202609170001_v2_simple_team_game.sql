-- DOS FUTUROS V2 · simplified team game
-- Additive migration: V1 tables/functions remain untouched.

create table if not exists public.cw_v2_customers (
  customer_id text primary key,
  name text not null,
  segment text not null,
  usage_score int not null,
  bugs int not null,
  discount_pct int not null,
  tenure_months int not null,
  predictive_score numeric not null check (predictive_score between 0 and 1),
  shap jsonb not null default '[]'::jsonb,
  p0 numeric not null check (p0 between 0 and 1),
  p1 numeric not null check (p1 between 0 and 1),
  baseline_risk int not null check (baseline_risk between 1 and 4),
  historical_treated boolean not null,
  historical_outcome int not null check (historical_outcome in (0,1))
);

create table if not exists public.cw_v2_segments (
  segment_id text primary key,
  name text not null,
  audience int not null,
  effect_pp numeric not null,
  ci_low numeric not null,
  ci_high numeric not null,
  value_per_result numeric not null,
  unit_cost numeric not null,
  risk text not null
);

create table if not exists public.cw_v2_individual_submissions (
  id uuid primary key default extensions.gen_random_uuid(),
  game_id uuid not null references public.cw_games(id) on delete cascade,
  round_number int not null check (round_number between 1 and 4),
  team_id uuid not null references public.cw_teams(id) on delete cascade,
  player_id uuid not null references public.cw_players(id) on delete cascade,
  payload jsonb not null,
  submitted_at timestamptz not null default now(),
  unique(game_id, round_number, player_id)
);

create table if not exists public.cw_v2_team_decisions (
  id uuid primary key default extensions.gen_random_uuid(),
  game_id uuid not null references public.cw_games(id) on delete cascade,
  round_number int not null check (round_number between 1 and 4),
  team_id uuid not null references public.cw_teams(id) on delete cascade,
  submitted_by uuid references public.cw_players(id) on delete set null,
  payload jsonb not null,
  result jsonb not null default '{}'::jsonb,
  locked_at timestamptz not null default now(),
  unique(game_id, round_number, team_id)
);

create index if not exists cw_v2_individual_team_round_idx
  on public.cw_v2_individual_submissions(game_id,team_id,round_number);
create index if not exists cw_v2_team_decision_game_round_idx
  on public.cw_v2_team_decisions(game_id,round_number);

do $$ declare r text; begin
  foreach r in array array['cw_v2_customers','cw_v2_segments','cw_v2_individual_submissions','cw_v2_team_decisions']
  loop
    execute format('alter table public.%I enable row level security',r);
    execute format('revoke all on table public.%I from anon, authenticated',r);
    execute format('grant all on table public.%I to service_role',r);
  end loop;
end $$;

with base as (
  select
    i,
    20 + ((i*13)%76) as usage_score,
    ((i*3)%8) as bugs,
    ((i*7)%31) as discount_pct,
    6 + ((i*5)%48) as tenure_months,
    case
      when i in (3,4,6,7,8,9,11,12,14,15,16,18,19,20,21,22,23,24) then true
      else false
    end as historical_treated
  from generate_series(1,24) i
), scored as (
  select *,
    least(.95::numeric,greatest(.25::numeric,
      (.36 + usage_score*.0045 + bugs*.018 - discount_pct*.0025 + tenure_months*.001)::numeric
    )) as predictive_score,
    least(.82::numeric,greatest(.12::numeric,
      (.22 + usage_score*.004 + tenure_months*.002 - discount_pct*.0015)::numeric
    )) as p0,
    case (i%8)
      when 0 then .01::numeric
      when 1 then .14::numeric
      when 2 then .04::numeric
      when 3 then .20::numeric
      when 4 then -.05::numeric
      when 5 then .09::numeric
      when 6 then .02::numeric
      else .12::numeric
    end as uplift
  from base
)
insert into public.cw_v2_customers(
  customer_id,name,segment,usage_score,bugs,discount_pct,tenure_months,
  predictive_score,shap,p0,p1,baseline_risk,historical_treated,historical_outcome
)
select
  'C'||lpad(i::text,2,'0'),
  'Cliente '||lpad(i::text,2,'0'),
  case (i%4) when 0 then 'Digital' when 1 then 'Mixto' when 2 then 'Tradicional' else 'Premium' end,
  usage_score,bugs,discount_pct,tenure_months,
  round(predictive_score,3),
  jsonb_build_array(
    jsonb_build_object('feature','Uso','value',usage_score,'impact',round(((usage_score-50)*.12)::numeric,1)),
    jsonb_build_object('feature','Bugs reportados','value',bugs,'impact',round(((bugs-3)*.85)::numeric,1)),
    jsonb_build_object('feature','Descuento','value',discount_pct,'impact',round(((15-discount_pct)*.18)::numeric,1))
  ),
  round(p0,3),
  round(least(.95::numeric,greatest(.02::numeric,p0+uplift)),3),
  case when historical_treated then 3 + (i%2) else 1 + (i%2) end,
  historical_treated,
  case
    when historical_treated and i in (4,9,15,20) then 1
    when not historical_treated and i in (1,10) then 1
    else 0
  end
from scored
on conflict(customer_id) do update set
  name=excluded.name,segment=excluded.segment,usage_score=excluded.usage_score,
  bugs=excluded.bugs,discount_pct=excluded.discount_pct,tenure_months=excluded.tenure_months,
  predictive_score=excluded.predictive_score,shap=excluded.shap,p0=excluded.p0,p1=excluded.p1,
  baseline_risk=excluded.baseline_risk,historical_treated=excluded.historical_treated,
  historical_outcome=excluded.historical_outcome;

insert into public.cw_v2_segments(segment_id,name,audience,effect_pp,ci_low,ci_high,value_per_result,unit_cost,risk) values
('digital','Digitales',7000,13.5,9,18,120,4,'Bajo'),
('middle','Ingreso medio',8000,9,5,13,110,5,'Medio'),
('traditional','Tradicionales',5000,3,-2,8,90,6,'Medio'),
('wealth','Patrimonio alto',2500,1,-3,4,180,9,'Bajo'),
('arrears','Mora alta',4000,-5,-9,-1,80,8,'Alto')
on conflict(segment_id) do update set
  name=excluded.name,audience=excluded.audience,effect_pp=excluded.effect_pp,
  ci_low=excluded.ci_low,ci_high=excluded.ci_high,value_per_result=excluded.value_per_result,
  unit_cost=excluded.unit_cost,risk=excluded.risk;

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
  team_decision jsonb:=null; reveal jsonb:=null; team_pool jsonb:=null;
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
    'hint',case g.current_round
      when 1 then 'SHAP explica por qué el modelo predice. Pregunta aparte: ¿qué variable te dice qué cambiaría si intervienes?'
      when 2 then 'Mira qué características existían antes del tratamiento y si aparecen en ambos grupos.'
      when 3 then 'Pregunta qué regla de asignación hace comparables tratamiento y control antes de mirar el resultado.'
      else 'No mires sólo el efecto puntual: combina signo, intervalo, capacidad y una prueba que pueda contradecir tu historia.'
    end
  );
end $$;

create or replace function public.cw_v2_submit_individual(p_token text,p_round int,p_payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path=public
as $$
declare p public.cw_players; g public.cw_games; n int;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;
  if g.status<>'round' or g.current_round<>p_round then raise exception 'La ronda no está abierta'; end if;
  if jsonb_typeof(coalesce(p_payload,'null'::jsonb))<>'object' or pg_column_size(p_payload)>8192 then raise exception 'Propuesta inválida'; end if;

  if p_round=1 then
    n:=jsonb_array_length(coalesce(p_payload->'selected','[]'::jsonb));
    if n<1 or n>3 then raise exception 'Selecciona entre 1 y 3 candidatos de tu grupo'; end if;
  elsif p_round=2 then
    if coalesce(p_payload->>'recommendation','') not in ('cancel','keep','redesign') then raise exception 'Recomendación inválida'; end if;
  elsif p_round=3 then
    if coalesce(p_payload->>'assignment','') not in ('advisor','model','random') then raise exception 'Asignación inválida'; end if;
    if coalesce(p_payload->>'outcome','') not in ('renewal_30d','click_1d') then raise exception 'Outcome inválido'; end if;
    if coalesce(nullif(p_payload->>'horizon','')::int,0) not in (1,30,90) then raise exception 'Horizonte inválido'; end if;
  elsif p_round=4 then
    if jsonb_typeof(p_payload->'choices')<>'object' then raise exception 'Clasifica tus segmentos'; end if;
  end if;

  insert into public.cw_v2_individual_submissions(game_id,round_number,team_id,player_id,payload)
  values(p.game_id,p_round,p.team_id,p.id,p_payload)
  on conflict(game_id,round_number,player_id) do update set payload=excluded.payload,submitted_at=now();

  return jsonb_build_object('ok',true);
end $$;

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
    score:=case p_payload->>'recommendation' when 'redesign' then 100 when 'keep' then 45 else 10 end;
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
    score:=case
      when coalesce(p_payload->'treat','[]'::jsonb) ? 'digital'
       and coalesce(p_payload->'treat','[]'::jsonb) ? 'middle'
       and coalesce(p_payload->'avoid','[]'::jsonb) ? 'arrears' then 100
      else 60 end;
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
declare g public.cw_games; teams jsonb; players jsonb;
begin
  select * into g from public.cw_games where code=upper(trim(p_game_code));
  if g.id is null then raise exception 'Partida no encontrada'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',t.id,'name',t.name,'position',t.position,
    'humans',(select count(*) from public.cw_players p where p.game_id=g.id and p.team_id=t.id and p.active and not p.is_bot),
    'submitted',(select count(*) from public.cw_v2_individual_submissions s where s.game_id=g.id and s.team_id=t.id and s.round_number=g.current_round),
    'decision',exists(select 1 from public.cw_v2_team_decisions d where d.game_id=g.id and d.team_id=t.id and d.round_number=g.current_round)
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

  return jsonb_build_object(
    'version','v2',
    'game',jsonb_build_object('code',g.code,'status',g.status,'round',g.current_round,'closes_at',g.closes_at,'team_target',g.team_target,'roster_locked',g.roster_locked),
    'humans',jsonb_array_length(players),
    'teams',teams,
    'players',players
  );
end $$;

create or replace function public.cw_v2_facilitator_state(p_token text)
returns jsonb
language plpgsql
security invoker
set search_path=public
as $$
declare gid uuid; code text; wall jsonb;
begin
  gid:=public.cw_validate_facilitator_token(p_token);
  if gid is null then raise exception 'Sesión de facilitador inválida'; end if;
  select g.code into code from public.cw_games g where g.id=gid;
  wall:=public.cw_v2_wall_state(code);
  return wall || jsonb_build_object(
    'decisions',(select coalesce(jsonb_agg(jsonb_build_object(
      'round',d.round_number,'team_id',d.team_id,'payload',d.payload,'result',d.result,'locked_at',d.locked_at
    ) order by d.round_number,d.locked_at),'[]'::jsonb) from public.cw_v2_team_decisions d where d.game_id=gid)
  );
end $$;

create or replace function public.cw_v2_facilitator_action(p_token text,p_action text,p_seconds int default 60)
returns jsonb
language plpgsql
security invoker
set search_path=public
as $$
declare gid uuid; g public.cw_games;
begin
  gid:=public.cw_validate_facilitator_token(p_token);
  if gid is null then raise exception 'Sesión de facilitador inválida'; end if;
  select * into g from public.cw_games where id=gid;

  if p_action='start' then
    if g.status not in ('lobby','briefing') then raise exception 'La ronda no está lista para iniciar'; end if;
    perform public.cw_facilitator_transition(p_token,'lesson',p_seconds);
    perform public.cw_facilitator_transition(p_token,'open',p_seconds);
  elsif p_action='reveal' then
    if g.status='round' or g.status='paused' then perform public.cw_facilitator_transition(p_token,'close',p_seconds); end if;
    select * into g from public.cw_games where id=gid;
    if g.status<>'closed' then raise exception 'La ronda debe estar abierta o cerrada'; end if;
    perform public.cw_facilitator_transition(p_token,'reveal',p_seconds);
  elsif p_action='next' then
    if g.status='reveal' then perform public.cw_facilitator_transition(p_token,'teach',p_seconds);
    elsif g.status<>'teaching' then raise exception 'Primero muestra el reveal'; end if;
    perform public.cw_facilitator_transition(p_token,'next',p_seconds);
  elsif p_action='reset' then
    delete from public.cw_v2_individual_submissions where game_id=gid;
    delete from public.cw_v2_team_decisions where game_id=gid;
    perform public.cw_facilitator_transition(p_token,'reset',p_seconds);
  elsif p_action in ('pause','resume','add_time','rebalance','prune_offline') then
    perform public.cw_facilitator_transition(p_token,p_action,p_seconds);
  else
    raise exception 'Acción V2 no soportada';
  end if;
  return jsonb_build_object('ok',true);
end $$;

revoke all on function public.cw_v2_state(text) from public,anon,authenticated;
revoke all on function public.cw_v2_submit_individual(text,int,jsonb) from public,anon,authenticated;
revoke all on function public.cw_v2_submit_team_decision(text,int,jsonb) from public,anon,authenticated;
revoke all on function public.cw_v2_wall_state(text) from public,anon,authenticated;
revoke all on function public.cw_v2_facilitator_state(text) from public,anon,authenticated;
revoke all on function public.cw_v2_facilitator_action(text,text,int) from public,anon,authenticated;

grant execute on function public.cw_v2_state(text) to service_role;
grant execute on function public.cw_v2_submit_individual(text,int,jsonb) to service_role;
grant execute on function public.cw_v2_submit_team_decision(text,int,jsonb) to service_role;
grant execute on function public.cw_v2_wall_state(text) to service_role;
grant execute on function public.cw_v2_facilitator_state(text) to service_role;
grant execute on function public.cw_v2_facilitator_action(text,text,int) to service_role;
