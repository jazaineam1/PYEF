-- Causal Quest V6: stronger policy round, transfer measurement and basic rate limiting

alter table public.cw_ground_truth_segments add column if not exists ci_low_pp numeric;
alter table public.cw_ground_truth_segments add column if not exists ci_high_pp numeric;
alter table public.cw_ground_truth_segments add column if not exists audience int;
alter table public.cw_ground_truth_segments add column if not exists unit_cost numeric;
alter table public.cw_ground_truth_segments add column if not exists value_per_result numeric;

update public.cw_ground_truth_segments set
  ci_low_pp=case segment_id when 'digital' then 9 when 'middle' then 5 when 'traditional' then -2 when 'wealth' then -3 when 'arrears' then -9 else effect_pp-3 end,
  ci_high_pp=case segment_id when 'digital' then 18 when 'middle' then 13 when 'traditional' then 8 when 'wealth' then 4 when 'arrears' then -1 else effect_pp+3 end,
  audience=case segment_id when 'digital' then 7000 when 'middle' then 8000 when 'traditional' then 5000 when 'wealth' then 2500 when 'arrears' then 4000 else 3000 end,
  unit_cost=case segment_id when 'digital' then 4 when 'middle' then 5 when 'traditional' then 6 when 'wealth' then 9 when 'arrears' then 8 else 5 end,
  value_per_result=case segment_id when 'digital' then 120 when 'middle' then 110 when 'traditional' then 90 when 'wealth' then 180 when 'arrears' then 80 else 100 end;

insert into public.cw_scenario_parameters(key,value) values
('round4_policy',jsonb_build_object('capacity',15000,'note','Sólo pueden intervenir hasta 15.000 clientes. La incertidumbre y el costo importan.'))
on conflict(key) do update set value=excluded.value;

create table if not exists public.cw_transfer_checks(
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.cw_games(id) on delete cascade,
  player_id uuid not null references public.cw_players(id) on delete cascade,
  stage text not null check(stage in ('pre','post')),
  answers jsonb not null,
  score int not null check(score between 0 and 4),
  submitted_at timestamptz not null default now(),
  unique(game_id,player_id,stage)
);
alter table public.cw_transfer_checks enable row level security;
revoke all on table public.cw_transfer_checks from public,anon,authenticated;
grant all on table public.cw_transfer_checks to service_role;

create table if not exists public.cw_rate_limits(
  action text not null,
  key_hash bytea not null,
  window_start timestamptz not null,
  hits int not null default 0,
  primary key(action,key_hash)
);
alter table public.cw_rate_limits enable row level security;
revoke all on table public.cw_rate_limits from public,anon,authenticated;
grant all on table public.cw_rate_limits to service_role;

create or replace function public.cw_consume_rate_limit(p_action text,p_key text,p_max int,p_window_seconds int)
returns boolean language plpgsql security invoker set search_path=public,extensions as $$
declare h bytea; r public.cw_rate_limits; now_ts timestamptz:=now();
begin
  h:=extensions.digest(coalesce(p_key,''),'sha256');
  insert into public.cw_rate_limits(action,key_hash,window_start,hits)
  values(p_action,h,now_ts,1)
  on conflict(action,key_hash) do update set
    window_start=case when public.cw_rate_limits.window_start < now_ts-make_interval(secs=>p_window_seconds) then now_ts else public.cw_rate_limits.window_start end,
    hits=case when public.cw_rate_limits.window_start < now_ts-make_interval(secs=>p_window_seconds) then 1 else public.cw_rate_limits.hits+1 end
  returning * into r;
  return r.hits<=p_max;
end $$;

create or replace function public.cw_submit_transfer(p_token text,p_stage text,p_answers jsonb)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare p public.cw_players; g public.cw_games; s int:=0; existing int;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;
  if p_stage not in ('pre','post') then raise exception 'Etapa inválida'; end if;
  if p_stage='pre' and g.status not in ('lobby','briefing','lesson') then raise exception 'La medición inicial ya cerró'; end if;
  if p_stage='post' and g.status<>'finished' then raise exception 'La medición final se habilita al terminar'; end if;
  if jsonb_typeof(p_answers)<>'object' then raise exception 'Respuestas inválidas'; end if;
  if p_answers->>'q1'='b' then s:=s+1; end if;
  if p_answers->>'q2'='c' then s:=s+1; end if;
  if p_answers->>'q3'='b' then s:=s+1; end if;
  if p_answers->>'q4'='c' then s:=s+1; end if;
  insert into public.cw_transfer_checks(game_id,player_id,stage,answers,score)
  values(g.id,p.id,p_stage,p_answers,s)
  on conflict(game_id,player_id,stage) do nothing;
  select score into existing from public.cw_transfer_checks where game_id=g.id and player_id=p.id and stage=p_stage;
  return jsonb_build_object('ok',true,'stage',p_stage,'score',existing,'max_score',4);
end $$;

create or replace function public.cw_transfer_status(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare p public.cw_players; pre_s int; post_s int;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select score into pre_s from public.cw_transfer_checks where game_id=p.game_id and player_id=p.id and stage='pre';
  select score into post_s from public.cw_transfer_checks where game_id=p.game_id and player_id=p.id and stage='post';
  return jsonb_build_object('pre_done',pre_s is not null,'pre_score',pre_s,'post_done',post_s is not null,'post_score',post_s);
end $$;

create or replace function public.cw_submit_decision(p_token text,p_round int,p_payload jsonb,p_idempotency text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare
  p public.cw_players; g public.cw_games; did uuid; existing_key text;
  n_total int; n_distinct int; n_valid int; treated_audience int; capacity_limit int:=15000;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;
  if g.status<>'round' or g.current_round<>p_round then raise exception 'La ronda no está abierta'; end if;
  if p_round=1 then
    if jsonb_array_length(coalesce(p_payload->'selected','[]'::jsonb))<>10 then raise exception 'Debes seleccionar exactamente 10 clientes'; end if;
  elsif p_round=2 then
    if coalesce(p_payload->>'recommendation','') not in ('cancel','keep','redesign') then raise exception 'Recomendación inválida'; end if;
    if coalesce(p_payload->>'confounder','') not in ('edad','mora_previa','nombre') then raise exception 'Variable inválida'; end if;
    if coalesce(p_payload->>'reason_code','') not in ('baseline_difference','model_quality','sample_size','outcome_timing') then raise exception 'Razón inválida'; end if;
  elsif p_round=3 then
    if coalesce(p_payload->>'assignment','') not in ('advisor','model','random') then raise exception 'Asignación inválida'; end if;
    if coalesce(p_payload->>'outcome','') not in ('pago_30d','click') then raise exception 'Debes elegir el resultado'; end if;
    if coalesce(nullif(p_payload->>'horizon','')::int,0) not in (1,30,90) then raise exception 'Debes elegir el horizonte'; end if;
  elsif p_round=4 then
    select count(*),count(distinct v),count(*) filter(where v in ('digital','middle','traditional','wealth','arrears'))
      into n_total,n_distinct,n_valid
    from (
      select jsonb_array_elements_text(coalesce(p_payload->'treat','[]'::jsonb)) v
      union all select jsonb_array_elements_text(coalesce(p_payload->'avoid','[]'::jsonb)) v
      union all select jsonb_array_elements_text(coalesce(p_payload->'observe','[]'::jsonb)) v
    ) x;
    if n_total<>5 or n_distinct<>5 or n_valid<>5 then raise exception 'Debes clasificar exactamente una vez los 5 segmentos'; end if;
    select coalesce(sum(audience),0)::int into treated_audience from public.cw_ground_truth_segments where segment_id in (select jsonb_array_elements_text(coalesce(p_payload->'treat','[]'::jsonb)));
    select coalesce((value->>'capacity')::int,15000) into capacity_limit from public.cw_scenario_parameters where key='round4_policy';
    if treated_audience>capacity_limit then raise exception 'La política supera la capacidad disponible de % clientes',capacity_limit; end if;
  end if;
  select id,idempotency_key into did,existing_key from public.cw_decisions where game_id=g.id and round_number=p_round and team_id=p.team_id;
  if did is not null then
    if existing_key=p_idempotency then return jsonb_build_object('ok',true,'decision_id',did,'idempotent',true); end if;
    raise exception 'La decisión del equipo ya fue bloqueada y no puede modificarse';
  end if;
  insert into public.cw_decisions(game_id,round_number,team_id,submitted_by,payload,idempotency_key)
  values(g.id,p_round,p.team_id,p.id,p_payload,p_idempotency) returning id into did;
  insert into public.cw_events(game_id,actor,event_type,payload) values(g.id,p.id::text,'decision_locked',jsonb_build_object('round',p_round,'team_id',p.team_id));
  return jsonb_build_object('ok',true,'decision_id',did,'idempotent',false);
end $$;

create or replace function public.cw_game_state(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare p public.cw_players; g public.cw_games; card text; teams_json jsonb; locked boolean:=false; d jsonb; result_json jsonb; customers jsonb; reveal_payload jsonb; segments_json jsonb; policy_json jsonb; transfer_json jsonb;
begin
  select * into p from public.cw_validate_player_token(p_token); if p.id is null then raise exception 'Sesión inválida o expirada'; end if;
  perform public.cw_auto_close_round(p.game_id); update public.cw_players set last_seen_at=now() where id=p.id;
  select * into g from public.cw_games where id=p.game_id;
  select content into card from public.cw_role_cards where round_number=g.current_round and role_code=p.role_code;
  select jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'help_cost',t.help_cost,'score',jsonb_build_object('impact',t.score_impact,'evidence',t.score_evidence,'design',t.score_design,'risk',t.score_risk,'adaptation',t.score_adaptation),'locked',exists(select 1 from public.cw_decisions x where x.team_id=t.id and x.round_number=g.current_round))) into teams_json from public.cw_teams t where t.game_id=g.id;
  select payload,result,true into d,result_json,locked from public.cw_decisions where game_id=g.id and team_id=p.team_id and round_number=g.current_round;
  if g.current_round=1 then
    select public.cw_public_customers() into customers;
    if g.status in ('reveal','teaching','microcheck','finished') and d is not null then
      select jsonb_agg(jsonb_build_object('id',c.customer_id,'name',c.name,'segment',c.segment,'score',c.predictive_score,'p0',c.p0,'p1',c.p1,'effect',c.p1-c.p0) order by c.predictive_score desc)
      into reveal_payload from public.cw_ground_truth_customers c where c.customer_id in (select jsonb_array_elements_text(d->'selected'));
    end if;
  end if;
  if g.current_round=4 then
    select jsonb_agg(jsonb_build_object('id',segment_id,'name',name,'effect',effect_pp,'ci_low',ci_low_pp,'ci_high',ci_high_pp,'risk',risk,'audience',audience,'unit_cost',unit_cost,'value_per_result',value_per_result) order by effect_pp desc) into segments_json from public.cw_ground_truth_segments;
    select value into policy_json from public.cw_scenario_parameters where key='round4_policy';
  end if;
  select public.cw_transfer_status(p_token) into transfer_json;
  return jsonb_build_object('server_time',now(),'game',jsonb_build_object('id',g.id,'code',g.code,'title',g.title,'phase',g.status,'round',g.current_round,'closes_at',g.closes_at,'public_message',g.public_message),'player',jsonb_build_object('id',p.id,'team_id',p.team_id,'display_name',p.display_name,'role_code',p.role_code),'role_card',card,'teams',coalesce(teams_json,'[]'::jsonb),'decision',d,'result',result_json,'locked',locked,'customers',customers,'reveal_payload',reveal_payload,'segments',segments_json,'policy',policy_json,'transfer',transfer_json);
end $$;

grant execute on function public.cw_consume_rate_limit(text,text,int,int) to service_role;
grant execute on function public.cw_submit_transfer(text,text,jsonb) to service_role;
grant execute on function public.cw_transfer_status(text) to service_role;
grant execute on function public.cw_submit_decision(text,int,jsonb,text) to service_role;
grant execute on function public.cw_game_state(text) to service_role;
