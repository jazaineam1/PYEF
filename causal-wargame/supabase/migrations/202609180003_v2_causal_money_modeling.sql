-- DOS FUTUROS V2 · three causal missions, Python modeling, learning revisions and COP value
-- Additive/compatible migration. V1 remains untouched. V2 round 4 is retired by the V2 facilitator.

create table if not exists public.cw_v2_economy (
  config_key text primary key,
  renewal_value_cop bigint not null check (renewal_value_cop > 0),
  intervention_cost_cop bigint not null check (intervention_cost_cop >= 0),
  cohort_size int not null check (cohort_size > 0),
  capacity int not null check (capacity > 0),
  observation_audience int not null check (observation_audience > 0),
  updated_at timestamptz not null default now()
);

insert into public.cw_v2_economy(
  config_key,renewal_value_cop,intervention_cost_cop,cohort_size,capacity,observation_audience
) values ('retention_v1',200000,8000,1000,15000,10000)
on conflict(config_key) do update set
  renewal_value_cop=excluded.renewal_value_cop,
  intervention_cost_cop=excluded.intervention_cost_cop,
  cohort_size=excluded.cohort_size,
  capacity=excluded.capacity,
  observation_audience=excluded.observation_audience,
  updated_at=now();

create table if not exists public.cw_v2_model_training (
  row_id int primary key,
  usage_score int not null,
  bugs int not null,
  discount_pct int not null,
  tenure_months int not null,
  renewed int not null check (renewed in (0,1))
);

truncate table public.cw_v2_model_training;
insert into public.cw_v2_model_training(row_id,usage_score,bugs,discount_pct,tenure_months,renewed)
select
  i,
  usage_score,
  bugs,
  discount_pct,
  tenure_months,
  case when u_y < p then 1 else 0 end
from (
  select *,
    1.0/(1.0+exp(-(-3.4 + .045*usage_score - .16*bugs + .035*discount_pct + .025*tenure_months))) as p,
    (((i*97+31)%991)::numeric/991.0) as u_y
  from (
    select
      i,
      10+((i*37)%86) as usage_score,
      ((i*7)%9) as bugs,
      ((i*11)%31) as discount_pct,
      3+((i*13)%60) as tenure_months
    from generate_series(1,600) i
  ) x
) q;

create table if not exists public.cw_v2_observational (
  row_id int primary key,
  baseline_risk int not null check (baseline_risk between 1 and 4),
  usage_score int not null,
  tenure_months int not null,
  treated boolean not null,
  renewed int not null check (renewed in (0,1))
);

truncate table public.cw_v2_observational;
insert into public.cw_v2_observational(row_id,baseline_risk,usage_score,tenure_months,treated,renewed)
select i,risk,usage_score,tenure_months,treated,
  case when u_y < least(.95,p0 + case when treated then .10 else 0 end) then 1 else 0 end
from (
  select *,
    u_t < case risk when 1 then .18 when 2 then .35 when 3 then .72 else .90 end as treated,
    greatest(.08,least(.82,.68-.12*risk+.0015*usage_score+.001*tenure_months)) as p0
  from (
    select
      i,
      1+((i*7)%4) as risk,
      15+((i*19)%80) as usage_score,
      4+((i*23)%55) as tenure_months,
      (((i*37+17)%997)::numeric/997.0) as u_t,
      (((i*101+53)%991)::numeric/991.0) as u_y
    from generate_series(1,2000) i
  ) a
) b;

create table if not exists public.cw_v2_experiment (
  row_id int primary key,
  segment_id text not null,
  usage_score int not null,
  tenure_months int not null,
  treated boolean not null,
  renewed int not null check (renewed in (0,1))
);

truncate table public.cw_v2_experiment;
insert into public.cw_v2_experiment(row_id,segment_id,usage_score,tenure_months,treated,renewed)
select i,segment_id,usage_score,tenure_months,treated,
  case when u_y < least(.95,greatest(.02,p0 + case when treated then effect else 0 end)) then 1 else 0 end
from (
  select *,
    greatest(.05,least(.90,pbase+.0007*(usage_score-50)+.0005*(tenure_months-25))) as p0,
    u_t < .5 as treated
  from (
    select
      i,
      case
        when ((i%100)::numeric/100)<.28 then 'digital'
        when ((i%100)::numeric/100)<.58 then 'middle'
        when ((i%100)::numeric/100)<.76 then 'traditional'
        when ((i%100)::numeric/100)<.85 then 'wealth'
        else 'arrears'
      end as segment_id,
      case
        when ((i%100)::numeric/100)<.28 then .135
        when ((i%100)::numeric/100)<.58 then .09
        when ((i%100)::numeric/100)<.76 then .03
        when ((i%100)::numeric/100)<.85 then .01
        else -.05
      end as effect,
      case
        when ((i%100)::numeric/100)<.28 then .38
        when ((i%100)::numeric/100)<.58 then .43
        when ((i%100)::numeric/100)<.76 then .49
        when ((i%100)::numeric/100)<.85 then .62
        else .25
      end as pbase,
      15+((i*17)%80) as usage_score,
      4+((i*23)%55) as tenure_months,
      (((i*43+11)%997)::numeric/997.0) as u_t,
      (((i*137+71)%991)::numeric/991.0) as u_y
    from generate_series(1,2000) i
  ) a
) b;

create table if not exists public.cw_v2_revisions (
  id uuid primary key default extensions.gen_random_uuid(),
  game_id uuid not null references public.cw_games(id) on delete cascade,
  round_number int not null check (round_number between 1 and 4),
  team_id uuid not null references public.cw_teams(id) on delete cascade,
  player_id uuid not null references public.cw_players(id) on delete cascade,
  payload jsonb not null,
  submitted_at timestamptz not null default now(),
  unique(game_id,round_number,player_id)
);

create table if not exists public.cw_v2_learning_events (
  id bigint generated by default as identity primary key,
  game_id uuid not null references public.cw_games(id) on delete cascade,
  round_number int not null check (round_number between 1 and 4),
  team_id uuid not null references public.cw_teams(id) on delete cascade,
  player_id uuid not null references public.cw_players(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cw_v2_revision_team_round_idx
  on public.cw_v2_revisions(game_id,team_id,round_number);
create index if not exists cw_v2_learning_event_player_idx
  on public.cw_v2_learning_events(game_id,round_number,player_id,created_at);

do $$ declare r text; begin
  foreach r in array array[
    'cw_v2_economy','cw_v2_model_training','cw_v2_observational','cw_v2_experiment',
    'cw_v2_revisions','cw_v2_learning_events'
  ]
  loop
    execute format('alter table public.%I enable row level security',r);
    execute format('revoke all on table public.%I from anon, authenticated',r);
    execute format('grant all on table public.%I to service_role',r);
  end loop;
end $$;

update public.cw_v2_segments
set value_per_result=200000, unit_cost=8000;

create or replace function public.cw_v2_submit_revision(p_token text,p_round int,p_payload jsonb)
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
  if g.status<>'round' or g.current_round<>p_round or p_round not between 1 and 3
  then raise exception 'La misión no está abierta'; end if;
  if jsonb_typeof(coalesce(p_payload,'null'::jsonb))<>'object' or pg_column_size(p_payload)>8192
  then raise exception 'Revisión inválida'; end if;

  if p_round=1 then
    n:=jsonb_array_length(coalesce(p_payload->'selected','[]'::jsonb));
    if n<1 or n>3 then raise exception 'Selecciona entre 1 y 3 candidatos'; end if;
  elsif p_round=2 then
    if coalesce(p_payload->>'recommendation','') not in ('cancel','keep','redesign')
    then raise exception 'Recomendación inválida'; end if;
  else
    if jsonb_typeof(p_payload->'choices')<>'object' then raise exception 'Clasifica tus segmentos'; end if;
  end if;

  insert into public.cw_v2_revisions(game_id,round_number,team_id,player_id,payload)
  values(p.game_id,p_round,p.team_id,p.id,p_payload)
  on conflict(game_id,round_number,player_id)
  do update set payload=excluded.payload,submitted_at=now();

  insert into public.cw_events(game_id,actor,event_type,payload)
  values(p.game_id,p.id::text,'v2_revision_submitted',jsonb_build_object('round',p_round));

  return jsonb_build_object('ok',true);
end $$;

create or replace function public.cw_v2_log_learning_event(
  p_token text,p_round int,p_event_type text,p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path=public
as $$
declare p public.cw_players; g public.cw_games;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;
  if p_round<>g.current_round or p_round not between 1 and 3 then raise exception 'Misión inválida'; end if;
  if p_event_type not in ('python_run','evidence_open','revision_view') then raise exception 'Evento inválido'; end if;
  if pg_column_size(coalesce(p_payload,'{}'::jsonb))>4096 then raise exception 'Evento demasiado grande'; end if;

  insert into public.cw_v2_learning_events(game_id,round_number,team_id,player_id,event_type,payload)
  values(p.game_id,p_round,p.team_id,p.id,p_event_type,coalesce(p_payload,'{}'::jsonb));
  return jsonb_build_object('ok',true);
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
  if g.status<>'round' or g.current_round<>p_round or p_round not between 1 and 3
  then raise exception 'La misión no está abierta'; end if;
  if jsonb_typeof(coalesce(p_payload,'null'::jsonb))<>'object' or pg_column_size(p_payload)>8192
  then raise exception 'Propuesta inválida'; end if;

  if p_round=1 then
    n:=jsonb_array_length(coalesce(p_payload->'selected','[]'::jsonb));
    if n<1 or n>3 then raise exception 'Selecciona entre 1 y 3 candidatos de tu grupo'; end if;
  elsif p_round=2 then
    if coalesce(p_payload->>'recommendation','') not in ('cancel','keep','redesign')
    then raise exception 'Recomendación inválida'; end if;
  else
    if jsonb_typeof(p_payload->'choices')<>'object' then raise exception 'Clasifica tus segmentos'; end if;
  end if;

  insert into public.cw_v2_individual_submissions(game_id,round_number,team_id,player_id,payload)
  values(p.game_id,p_round,p.team_id,p.id,p_payload)
  on conflict(game_id,round_number,player_id)
  do update set payload=excluded.payload,submitted_at=now();

  return jsonb_build_object('ok',true);
end $$;

create or replace function public.cw_v2_submit_team_decision(p_token text,p_round int,p_payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path=public
as $$
declare
  p public.cw_players; g public.cw_games; humans int; submitted int; revised int; did uuid;
  cfg public.cw_v2_economy;
  n int; actual_value numeric:=0; best_value numeric:=0; policy_value numeric:=0; best_policy numeric:=0;
  treated_audience int:=0; score int:=0; result jsonb:='{}'::jsonb;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;
  if g.status<>'round' or g.current_round<>p_round or p_round not between 1 and 3
  then raise exception 'La misión no está abierta'; end if;
  select * into cfg from public.cw_v2_economy where config_key='retention_v1';

  select count(*) into humans from public.cw_players
  where game_id=p.game_id and team_id=p.team_id and active and not is_bot;
  select count(*) into submitted from public.cw_v2_individual_submissions
  where game_id=p.game_id and team_id=p.team_id and round_number=p_round;
  select count(*) into revised from public.cw_v2_revisions
  where game_id=p.game_id and team_id=p.team_id and round_number=p_round;

  if submitted<humans then raise exception 'Primero deben enviar su propuesta todos los integrantes (%/%).',submitted,humans; end if;
  if revised<humans then raise exception 'Primero deben revisar su decisión después de analizar la evidencia (%/%).',revised,humans; end if;
  if exists(select 1 from public.cw_v2_team_decisions where game_id=p.game_id and team_id=p.team_id and round_number=p_round)
  then raise exception 'La decisión del equipo ya está bloqueada'; end if;

  if p_round=1 then
    n:=jsonb_array_length(coalesce(p_payload->'selected','[]'::jsonb));
    if n<>10 or (select count(distinct x) from jsonb_array_elements_text(coalesce(p_payload->'selected','[]'::jsonb)) x)<>10
    then raise exception 'El equipo debe seleccionar exactamente 10 cohortes distintas'; end if;
    if (select count(*) from jsonb_array_elements_text(p_payload->'selected') x
        join public.cw_v2_customers c on c.customer_id=x)<>10
    then raise exception 'Hay cohortes inválidas'; end if;

    select coalesce(sum(((c.p1-c.p0)*cfg.renewal_value_cop-cfg.intervention_cost_cop)*cfg.cohort_size),0)
    into actual_value
    from public.cw_v2_customers c
    where c.customer_id in (select jsonb_array_elements_text(p_payload->'selected'));

    select coalesce(sum(v),0) into best_value from (
      select ((p1-p0)*cfg.renewal_value_cop-cfg.intervention_cost_cop)*cfg.cohort_size as v
      from public.cw_v2_customers order by v desc limit 10
    ) q;

    score:=greatest(0,least(100,round(100*actual_value/nullif(best_value,0))::int));
    result:=jsonb_build_object(
      'score',score,
      'incremental_value_cop',round(actual_value,0),
      'best_possible_value_cop',round(best_value,0),
      'value_gap_cop',round(best_value-actual_value,0),
      'cohort_size',cfg.cohort_size
    );

  elsif p_round=2 then
    if coalesce(p_payload->>'recommendation','') not in ('cancel','keep','redesign')
    then raise exception 'Recomendación inválida'; end if;
    score:=case p_payload->>'recommendation' when 'redesign' then 100 when 'cancel' then 45 else 20 end;
    result:=jsonb_build_object(
      'score',score,
      'incremental_value_cop',0,
      'monetized',false,
      'best','redesign',
      'economic_note','Esta misión evalúa identificación causal. El tablero monetario no premia una decisión no identificada.'
    );

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

    select coalesce(sum(s.audience),0),
           coalesce(sum((s.effect_pp/100.0)*s.audience*cfg.renewal_value_cop-s.audience*cfg.intervention_cost_cop),0)
    into treated_audience,policy_value
    from public.cw_v2_segments s
    where s.segment_id in (select jsonb_array_elements_text(coalesce(p_payload->'treat','[]'::jsonb)));

    if treated_audience>cfg.capacity then raise exception 'La política supera la capacidad de % clientes',cfg.capacity; end if;

    select coalesce(sum(v),0) into best_policy from (
      select ((effect_pp/100.0)*audience*cfg.renewal_value_cop-audience*cfg.intervention_cost_cop) v,audience
      from public.cw_v2_segments
      where segment_id in ('digital','middle')
    ) q;

    score:=greatest(0,least(100,round(100*policy_value/nullif(best_policy,0))::int));
    result:=jsonb_build_object(
      'score',score,
      'incremental_value_cop',round(policy_value,0),
      'best_possible_value_cop',round(best_policy,0),
      'treated_audience',treated_audience,
      'capacity',cfg.capacity
    );
  end if;

  insert into public.cw_v2_team_decisions(game_id,round_number,team_id,submitted_by,payload,result)
  values(p.game_id,p_round,p.team_id,p.id,p_payload,result) returning id into did;

  insert into public.cw_events(game_id,actor,event_type,payload)
  values(p.game_id,p.id::text,'v2_team_decision_locked',
    jsonb_build_object('round',p_round,'team_id',p.team_id,'incremental_value_cop',result->'incremental_value_cop'));

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
    'revised',(select count(*) from public.cw_v2_revisions r where r.game_id=g.id and r.team_id=t.id and r.round_number=g.current_round),
    'decision',exists(select 1 from public.cw_v2_team_decisions d where d.game_id=g.id and d.team_id=t.id and d.round_number=g.current_round),
    'round_value_cop',case when reveal_current then
      (select coalesce(nullif(d.result->>'incremental_value_cop','')::numeric,0) from public.cw_v2_team_decisions d
       where d.game_id=g.id and d.team_id=t.id and d.round_number=g.current_round limit 1)
      else null end,
    'total_value_cop',(select coalesce(sum(coalesce(nullif(d.result->>'incremental_value_cop','')::numeric,0)),0)
      from public.cw_v2_team_decisions d
      where d.game_id=g.id and d.team_id=t.id
        and (d.round_number<g.current_round or (d.round_number=g.current_round and reveal_current))),
    'round_score',case when reveal_current then
      (select nullif(d.result->>'score','')::int from public.cw_v2_team_decisions d
       where d.game_id=g.id and d.team_id=t.id and d.round_number=g.current_round limit 1)
      else null end,
    'total_score',(select coalesce(sum(coalesce(nullif(d.result->>'score','')::int,0)),0)
      from public.cw_v2_team_decisions d
      where d.game_id=g.id and d.team_id=t.id
        and (d.round_number<g.current_round or (d.round_number=g.current_round and reveal_current))),
    'rounds_scored',(select count(*) from public.cw_v2_team_decisions d
      where d.game_id=g.id and d.team_id=t.id
        and (d.round_number<g.current_round or (d.round_number=g.current_round and reveal_current)))
  ) order by t.position),'[]'::jsonb)
  into teams
  from public.cw_teams t
  where t.game_id=g.id and
    (t.position<=g.team_target or exists(select 1 from public.cw_players p where p.team_id=t.id and p.active and not p.is_bot));

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
      'payload',d.payload,
      'value_cop',coalesce(nullif(d.result->>'incremental_value_cop','')::numeric,0),
      'score',nullif(d.result->>'score','')::int
    ) order by t.position),'[]'::jsonb)
    into decisions
    from public.cw_v2_team_decisions d
    join public.cw_teams t on t.id=d.team_id
    where d.game_id=g.id and d.round_number=g.current_round;
  end if;

  return jsonb_build_object(
    'version','v2.1',
    'game',jsonb_build_object('code',g.code,'status',g.status,'round',g.current_round,'max_round',3,
      'closes_at',g.closes_at,'team_target',g.team_target,'roster_locked',g.roster_locked),
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
  p public.cw_players; g public.cw_games; team_name text; cfg public.cw_v2_economy;
  human_count int; seat_idx int; submission_count int; revision_count int;
  all_submitted boolean; all_revised boolean;
  packet jsonb:='[]'::jsonb; roster jsonb:='[]'::jsonb;
  team_submissions jsonb:='[]'::jsonb; team_revisions jsonb:='[]'::jsonb;
  team_decision jsonb:=null; reveal jsonb:=null; team_pool jsonb:=null; public_board jsonb:=null;
  exp_t numeric; exp_c numeric;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  update public.cw_players set last_seen_at=now() where id=p.id;
  select * into g from public.cw_games where id=p.game_id;
  select * into cfg from public.cw_v2_economy where config_key='retention_v1';
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

  select count(*) into submission_count from public.cw_v2_individual_submissions
  where game_id=p.game_id and team_id=p.team_id and round_number=g.current_round;
  select count(*) into revision_count from public.cw_v2_revisions
  where game_id=p.game_id and team_id=p.team_id and round_number=g.current_round;
  all_submitted:=submission_count>=human_count;
  all_revised:=revision_count>=human_count;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',pl.id,'name',pl.display_name,
    'submitted',exists(select 1 from public.cw_v2_individual_submissions s
      where s.game_id=p.game_id and s.round_number=g.current_round and s.player_id=pl.id),
    'revised',exists(select 1 from public.cw_v2_revisions r
      where r.game_id=p.game_id and r.round_number=g.current_round and r.player_id=pl.id)
  ) order by pl.joined_at,pl.id),'[]'::jsonb)
  into roster
  from public.cw_players pl
  where pl.game_id=p.game_id and pl.team_id=p.team_id and pl.active and not pl.is_bot;

  if g.current_round=1 then
    with numbered as (
      select c.*,row_number() over(order by customer_id)::int-1 rn from public.cw_v2_customers c
    )
    select coalesce(jsonb_agg(jsonb_build_object(
      'id',customer_id,'name',name,'segment',segment,'score',predictive_score,
      'usage',usage_score,'bugs',bugs,'discount',discount_pct,'tenure',tenure_months,'shap',shap,
      'cohort_size',cfg.cohort_size
    ) order by customer_id),'[]'::jsonb)
    into packet from numbered where (rn%human_count)=seat_idx;

  elsif g.current_round=2 then
    with numbered as (
      select c.*,row_number() over(order by customer_id)::int-1 rn from public.cw_v2_customers c
    )
    select coalesce(jsonb_agg(jsonb_build_object(
      'id',customer_id,'name',name,'segment',segment,'risk',baseline_risk,
      'treated',historical_treated,'outcome',historical_outcome,
      'usage',usage_score,'tenure',tenure_months,'score',predictive_score
    ) order by customer_id),'[]'::jsonb)
    into packet from numbered where (rn%human_count)=seat_idx;

  else
    with numbered as (
      select s.*,row_number() over(order by segment_id)::int-1 rn from public.cw_v2_segments s
    )
    select coalesce(jsonb_agg(jsonb_build_object(
      'id',segment_id,'name',name,'audience',audience,'risk',risk,
      'value',cfg.renewal_value_cop,'cost',cfg.intervention_cost_cop
    ) order by segment_id),'[]'::jsonb)
    into packet from numbered where (rn%human_count)=seat_idx;
  end if;

  if all_submitted then
    select coalesce(jsonb_agg(jsonb_build_object(
      'player_id',s.player_id,'name',pl.display_name,'payload',s.payload,'submitted_at',s.submitted_at
    ) order by s.submitted_at),'[]'::jsonb)
    into team_submissions
    from public.cw_v2_individual_submissions s join public.cw_players pl on pl.id=s.player_id
    where s.game_id=p.game_id and s.team_id=p.team_id and s.round_number=g.current_round;

    select coalesce(jsonb_agg(jsonb_build_object(
      'player_id',r.player_id,'name',pl.display_name,'payload',r.payload,'submitted_at',r.submitted_at
    ) order by r.submitted_at),'[]'::jsonb)
    into team_revisions
    from public.cw_v2_revisions r join public.cw_players pl on pl.id=r.player_id
    where r.game_id=p.game_id and r.team_id=p.team_id and r.round_number=g.current_round;

    if g.current_round=1 then
      select jsonb_agg(jsonb_build_object(
        'id',customer_id,'name',name,'segment',segment,'score',predictive_score,
        'usage',usage_score,'bugs',bugs,'discount',discount_pct,'tenure',tenure_months,'shap',shap,
        'cohort_size',cfg.cohort_size
      ) order by customer_id) into team_pool from public.cw_v2_customers;
    elsif g.current_round=2 then
      select jsonb_agg(jsonb_build_object(
        'id',customer_id,'name',name,'segment',segment,'risk',baseline_risk,
        'treated',historical_treated,'outcome',historical_outcome,
        'usage',usage_score,'tenure',tenure_months,'score',predictive_score
      ) order by customer_id) into team_pool from public.cw_v2_customers;
    else
      select jsonb_agg(jsonb_build_object(
        'id',segment_id,'name',name,'audience',audience,'risk',risk,
        'value',cfg.renewal_value_cop,'cost',cfg.intervention_cost_cop
      ) order by segment_id) into team_pool from public.cw_v2_segments;
    end if;
  end if;

  select jsonb_build_object('payload',d.payload,'result',d.result,'locked_at',d.locked_at)
  into team_decision
  from public.cw_v2_team_decisions d
  where d.game_id=p.game_id and d.team_id=p.team_id and d.round_number=g.current_round;

  if g.status in ('reveal','teaching','microcheck','finished') then
    if g.current_round=1 then
      select jsonb_build_object(
        'title','Predecir renovación no es predecir respuesta a una intervención.',
        'concept','Predicción ≠ efecto causal · contrafactual',
        'customers',jsonb_agg(jsonb_build_object(
          'id',customer_id,'name',name,'score',predictive_score,'p0',p0,'p1',p1,
          'uplift_pp',round(((p1-p0)*100)::numeric,1),
          'incremental_value_cop',round((((p1-p0)*cfg.renewal_value_cop-cfg.intervention_cost_cop)*cfg.cohort_size),0)
        ) order by customer_id)
      ) into reveal from public.cw_v2_customers;

    elsif g.current_round=2 then
      reveal:=jsonb_build_object(
        'title','La comparación histórica estaba confundida por riesgo basal.',
        'concept','Confusión · comparabilidad · identificación',
        'true_effect_pp',10,
        'campaign_potential_value_cop',
          round((.10*cfg.renewal_value_cop-cfg.intervention_cost_cop)*cfg.observation_audience,0),
        'dag','Riesgo previo → Tratamiento; Riesgo previo → Renovación; Tratamiento → Renovación',
        'lesson','La diferencia observada responde quién recibió tratamiento y qué ocurrió; no identifica por sí sola qué habría ocurrido bajo la alternativa.'
      );

    else
      select avg(renewed::numeric) filter(where treated),avg(renewed::numeric) filter(where not treated)
      into exp_t,exp_c from public.cw_v2_experiment;

      select jsonb_build_object(
        'title','El promedio positivo no convierte a todos en buenos candidatos.',
        'concept','Randomización · ATE · CATE · política económica',
        'treatment_rate',round(exp_t*100,1),
        'control_rate',round(exp_c*100,1),
        'ate_pp',round((exp_t-exp_c)*100,1),
        'segments',jsonb_agg(jsonb_build_object(
          'id',segment_id,'name',name,'audience',audience,'effect_pp',effect_pp,
          'ci_low',ci_low,'ci_high',ci_high,'risk',risk,
          'incremental_value_cop',round((effect_pp/100.0)*audience*cfg.renewal_value_cop-audience*cfg.intervention_cost_cop,0)
        ) order by segment_id)
      ) into reveal from public.cw_v2_segments;
    end if;
  end if;

  public_board:=public.cw_v2_wall_state(g.code);

  return jsonb_build_object(
    'version','v2.1',
    'game',jsonb_build_object('code',g.code,'status',g.status,'round',g.current_round,'max_round',3,
      'closes_at',g.closes_at,'message',g.public_message),
    'economy',jsonb_build_object(
      'renewal_value_cop',cfg.renewal_value_cop,
      'intervention_cost_cop',cfg.intervention_cost_cop,
      'cohort_size',cfg.cohort_size,
      'capacity',cfg.capacity,
      'observation_audience',cfg.observation_audience
    ),
    'player',jsonb_build_object('id',p.id,'name',p.display_name,'team_id',p.team_id,'team',team_name,'seat',seat_idx+1),
    'team',jsonb_build_object(
      'size',human_count,'submitted',submission_count,'all_submitted',all_submitted,
      'revised',revision_count,'all_revised',all_revised,'roster',roster
    ),
    'packet',packet,
    'my_submission',(select payload from public.cw_v2_individual_submissions
      where game_id=p.game_id and round_number=g.current_round and player_id=p.id),
    'my_revision',(select payload from public.cw_v2_revisions
      where game_id=p.game_id and round_number=g.current_round and player_id=p.id),
    'team_submissions',team_submissions,
    'team_revisions',team_revisions,
    'team_pool',team_pool,
    'team_decision',team_decision,
    'reveal',reveal,
    'scoreboard',coalesce(public_board->'teams','[]'::jsonb),
    'all_team_decisions',coalesce(public_board->'decisions','[]'::jsonb),
    'hint',case g.current_round
      when 1 then 'Un modelo puede predecir muy bien Y y aun no responder qué cambia por intervenir.'
      when 2 then 'Pregunta por la regla que decidió quién recibió tratamiento antes de interpretar la diferencia observada.'
      else 'Primero estima el efecto promedio; luego busca heterogeneidad y recién entonces conviértela en valor y política.'
    end
  );
end $$;

create or replace function public.cw_v2_analysis(p_token text)
returns jsonb
language plpgsql
security invoker
set search_path=public
as $$
declare
  p public.cw_players; g public.cw_games; cfg public.cw_v2_economy;
  humans int:=0; submitted int:=0; all_submitted boolean:=false;
  team_tools jsonb:=null; reveal_tools jsonb:=null;
  feature_summary jsonb:='[]'::jsonb; training_rows jsonb:='[]'::jsonb;
  observational_rows jsonb:='[]'::jsonb; experiment_rows jsonb:='[]'::jsonb;
  segment_rows jsonb:='[]'::jsonb; exp_t numeric; exp_c numeric;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;
  select * into cfg from public.cw_v2_economy where config_key='retention_v1';

  select count(*) into humans from public.cw_players
  where game_id=p.game_id and team_id=p.team_id and active and not is_bot;
  select count(*) into submitted from public.cw_v2_individual_submissions
  where game_id=p.game_id and team_id=p.team_id and round_number=g.current_round;
  all_submitted:=humans>0 and submitted>=humans;

  if all_submitted then
    if g.current_round=1 then
      select coalesce(jsonb_agg(jsonb_build_object(
        'feature',feature,'mean_abs',mean_abs,'mean',mean_value
      ) order by mean_abs desc),'[]'::jsonb)
      into feature_summary
      from (
        select e->>'feature' feature,
          round(avg(abs((e->>'impact')::numeric)),2) mean_abs,
          round(avg((e->>'impact')::numeric),2) mean_value
        from public.cw_v2_customers c cross join lateral jsonb_array_elements(c.shap) e
        group by e->>'feature'
      ) q;

      select coalesce(jsonb_agg(jsonb_build_object(
        'usage',usage_score,'bugs',bugs,'discount',discount_pct,'tenure',tenure_months,'renewed',renewed
      ) order by row_id),'[]'::jsonb)
      into training_rows from public.cw_v2_model_training;

      team_tools:=jsonb_build_object(
        'feature_summary',feature_summary,
        'ml_training',training_rows,
        'model_note','El modelo predictivo estima P(Y|X). Su desempeño no identifica respuesta al tratamiento.'
      );

    elsif g.current_round=2 then
      select coalesce(jsonb_agg(jsonb_build_object(
        'risk',baseline_risk,'usage',usage_score,'tenure',tenure_months,
        'treated',treated,'renewed',renewed
      ) order by row_id),'[]'::jsonb)
      into observational_rows from public.cw_v2_observational;

      team_tools:=jsonb_build_object(
        'observational_rows',observational_rows,
        'dag',jsonb_build_object(
          'nodes',jsonb_build_array(
            jsonb_build_object('id','risk','label','Riesgo previo'),
            jsonb_build_object('id','treat','label','Intervención'),
            jsonb_build_object('id','outcome','label','Renovación'),
            jsonb_build_object('id','mediator','label','Uso posterior'),
            jsonb_build_object('id','collider','label','Ticket resuelto')
          ),
          'edges',jsonb_build_array(
            jsonb_build_object('from','risk','to','treat','kind','confounding'),
            jsonb_build_object('from','risk','to','outcome','kind','confounding'),
            jsonb_build_object('from','treat','to','outcome','kind','causal'),
            jsonb_build_object('from','treat','to','mediator','kind','causal'),
            jsonb_build_object('from','mediator','to','outcome','kind','causal'),
            jsonb_build_object('from','treat','to','collider','kind','warning'),
            jsonb_build_object('from','risk','to','collider','kind','warning')
          ),
          'adjust_options',jsonb_build_array(
            jsonb_build_object('id','none','label','No ajustar','good',false,'highlights',jsonb_build_array(),'explanation','El camino de confusión permanece abierto.'),
            jsonb_build_object('id','risk','label','Ajustar por riesgo previo','good',true,'highlights',jsonb_build_array('risk'),'explanation','Riesgo previo antecede tratamiento y outcome; es el confusor principal del escenario.'),
            jsonb_build_object('id','mediator','label','Ajustar por uso posterior','good',false,'highlights',jsonb_build_array('mediator'),'explanation','Es posterior al tratamiento y puede bloquear parte del efecto.'),
            jsonb_build_object('id','collider','label','Ajustar por ticket resuelto','good',false,'highlights',jsonb_build_array('collider'),'explanation','Condicionar en un collider puede abrir asociación espuria.')
          )
        )
      );

    else
      select coalesce(jsonb_agg(jsonb_build_object(
        'segment',segment_id,'usage',usage_score,'tenure',tenure_months,
        'treated',treated,'renewed',renewed
      ) order by row_id),'[]'::jsonb)
      into experiment_rows from public.cw_v2_experiment;

      select coalesce(jsonb_agg(jsonb_build_object(
        'id',segment_id,'name',name,'audience',audience,'risk',risk,
        'value_per_result',cfg.renewal_value_cop,'unit_cost',cfg.intervention_cost_cop
      ) order by segment_id),'[]'::jsonb)
      into segment_rows from public.cw_v2_segments;

      team_tools:=jsonb_build_object(
        'experiment_rows',experiment_rows,
        'segments',segment_rows,
        'precision_curve',jsonb_build_array(
          jsonb_build_object('n',200,'mde_pp',12.2,'ci_half_pp',8.6),
          jsonb_build_object('n',500,'mde_pp',7.7,'ci_half_pp',5.5),
          jsonb_build_object('n',1000,'mde_pp',5.5,'ci_half_pp',3.9),
          jsonb_build_object('n',2000,'mde_pp',3.9,'ci_half_pp',2.8),
          jsonb_build_object('n',5000,'mde_pp',2.5,'ci_half_pp',1.8)
        ),
        'econml',jsonb_build_array(
          jsonb_build_object('segment','digital','name','Digitales','t_learner',12.8,'dr_learner',13.4,'causal_forest',13.7),
          jsonb_build_object('segment','middle','name','Ingreso medio','t_learner',8.4,'dr_learner',9.1,'causal_forest',9.5),
          jsonb_build_object('segment','traditional','name','Tradicionales','t_learner',2.1,'dr_learner',3.2,'causal_forest',4.0),
          jsonb_build_object('segment','wealth','name','Patrimonio alto','t_learner',.5,'dr_learner',1.2,'causal_forest',1.5),
          jsonb_build_object('segment','arrears','name','Mora alta','t_learner',-4.2,'dr_learner',-5.1,'causal_forest',-5.6)
        ),
        'placebo',jsonb_build_object(
          'effect_pp',4.7,'ci_low',1.5,'ci_high',7.9,
          'message','El outcome placebo fue medido antes de la campaña. La señal obliga a cuestionar el pipeline.'
        ),
        'economy',jsonb_build_object(
          'renewal_value_cop',cfg.renewal_value_cop,'intervention_cost_cop',cfg.intervention_cost_cop,
          'capacity',cfg.capacity
        )
      );
    end if;
  end if;

  if g.status in ('reveal','teaching','microcheck','finished') then
    if g.current_round=1 then
      select coalesce(jsonb_agg(jsonb_build_object(
        'id',customer_id,'name',name,'segment',segment,'score',predictive_score,
        'p0',p0,'p1',p1,'uplift_pp',round(((p1-p0)*100)::numeric,1),
        'incremental_value_cop',round((((p1-p0)*cfg.renewal_value_cop-cfg.intervention_cost_cop)*cfg.cohort_size),0)
      ) order by customer_id),'[]'::jsonb)
      into reveal_tools from public.cw_v2_customers;
      reveal_tools:=jsonb_build_object('score_uplift',reveal_tools);

    elsif g.current_round=2 then
      reveal_tools:=jsonb_build_object(
        'ground_truth',jsonb_build_object(
          'true_effect_pp',10,
          'assignment','Tratamiento dependía fuertemente del riesgo basal'
        )
      );

    else
      select avg(renewed::numeric) filter(where treated),avg(renewed::numeric) filter(where not treated)
      into exp_t,exp_c from public.cw_v2_experiment;

      select coalesce(jsonb_agg(jsonb_build_object(
        'id',segment_id,'name',name,'audience',audience,'effect_pp',effect_pp,
        'ci_low',ci_low,'ci_high',ci_high,'risk',risk,
        'value_per_result',cfg.renewal_value_cop,'unit_cost',cfg.intervention_cost_cop,
        'incremental_value_cop',round((effect_pp/100.0)*audience*cfg.renewal_value_cop-audience*cfg.intervention_cost_cop,0)
      ) order by segment_id),'[]'::jsonb)
      into segment_rows from public.cw_v2_segments;

      reveal_tools:=jsonb_build_object(
        'experiment',jsonb_build_object(
          'treatment_rate',round(exp_t*100,1),'control_rate',round(exp_c*100,1),
          'ate_pp',round((exp_t-exp_c)*100,1)
        ),
        'segments',segment_rows,
        'placebo',jsonb_build_object(
          'effect_pp',4.7,'ci_low',1.5,'ci_high',7.9,
          'message','Una señal placebo positiva reduce la confianza causal y debe discutirse antes de escalar.'
        )
      );
    end if;
  end if;

  return jsonb_build_object(
    'round',g.current_round,'status',g.status,'team_ready',all_submitted,
    'team_tools',team_tools,'reveal_tools',reveal_tools
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
    if g.status not in ('lobby','briefing') then raise exception 'La misión no está lista para iniciar'; end if;
    perform public.cw_facilitator_transition(p_token,'lesson',p_seconds);
    perform public.cw_facilitator_transition(p_token,'open',p_seconds);

  elsif p_action='reveal' then
    if g.status in ('round','paused') then perform public.cw_facilitator_transition(p_token,'close',p_seconds); end if;
    select * into g from public.cw_games where id=gid;
    if g.status<>'closed' then raise exception 'La misión debe estar abierta o cerrada'; end if;
    perform public.cw_facilitator_transition(p_token,'reveal',p_seconds);

  elsif p_action='next' then
    if g.status='reveal' then perform public.cw_facilitator_transition(p_token,'teach',p_seconds);
    elsif g.status<>'teaching' then raise exception 'Primero muestra el reveal'; end if;
    select * into g from public.cw_games where id=gid;
    if g.current_round>=3 then
      update public.cw_games
      set status='finished',closes_at=null,paused_remaining_seconds=null,
          public_message='Experiencia causal finalizada'
      where id=gid;
    else
      perform public.cw_facilitator_transition(p_token,'next',p_seconds);
    end if;

  elsif p_action='reset' then
    delete from public.cw_v2_learning_events where game_id=gid;
    delete from public.cw_v2_revisions where game_id=gid;
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

revoke all on function public.cw_v2_submit_revision(text,int,jsonb) from public,anon,authenticated;
revoke all on function public.cw_v2_log_learning_event(text,int,text,jsonb) from public,anon,authenticated;
revoke all on function public.cw_v2_submit_individual(text,int,jsonb) from public,anon,authenticated;
revoke all on function public.cw_v2_submit_team_decision(text,int,jsonb) from public,anon,authenticated;
revoke all on function public.cw_v2_wall_state(text) from public,anon,authenticated;
revoke all on function public.cw_v2_state(text) from public,anon,authenticated;
revoke all on function public.cw_v2_analysis(text) from public,anon,authenticated;
revoke all on function public.cw_v2_facilitator_action(text,text,int) from public,anon,authenticated;

grant execute on function public.cw_v2_submit_revision(text,int,jsonb) to service_role;
grant execute on function public.cw_v2_log_learning_event(text,int,text,jsonb) to service_role;
grant execute on function public.cw_v2_submit_individual(text,int,jsonb) to service_role;
grant execute on function public.cw_v2_submit_team_decision(text,int,jsonb) to service_role;
grant execute on function public.cw_v2_wall_state(text) to service_role;
grant execute on function public.cw_v2_state(text) to service_role;
grant execute on function public.cw_v2_analysis(text) to service_role;
grant execute on function public.cw_v2_facilitator_action(text,text,int) to service_role;
