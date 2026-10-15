-- Structured scientific missions. Additive canonical V2 only. Existing 0-100,
-- academic (0-50), and Kahoot (0-120) scores are NOT silently rewritten.
-- Practicum evidence is a separate verified 0-? skill indicator.
create table if not exists public.cw_dean_mission_attempts (
 game_id uuid not null references public.cw_dean_tournaments(game_id) on delete cascade,
 player_id uuid not null references public.cw_dean_players(id) on delete cascade,
 mission_id text not null check(mission_id in ('association','dag','dml','policy')),
 phase text not null check(phase in ('rector','survey','causal')),
 answer jsonb not null,
 submitted_at timestamptz not null default clock_timestamp(),
 primary key(player_id,mission_id),
 check(jsonb_typeof(answer)='object')
);
alter table public.cw_dean_mission_attempts enable row level security;
revoke all on public.cw_dean_mission_attempts from public,anon,authenticated;
grant select,insert on public.cw_dean_mission_attempts to service_role;
create index if not exists cw_dean_mission_game_idx on public.cw_dean_mission_attempts(game_id,phase);

-- Correct answers reside exclusively in SQL. There is no correct-key JSON sent
-- to untrusted client code before teacher's debrief.
create or replace function public.cw_dean_mission_score(mid text, ans jsonb)
returns integer language plpgsql immutable security invoker set search_path=public as $fn$
declare arr text[]; raw jsonb; total int; over_n int; balanced_n int;risk_n int; pragmatic_n int;
begin
 case mid
  when 'association' then
   return case when ans->>'interpretation'='observational_only' then 8 else 0 end;
  when 'dag' then
   select coalesce(array_agg(v order by v),'{}') into arr
   from jsonb_array_elements_text(ans->'nodes') v;
   return (case when 'h'=any(arr) and not ('study'=any(arr) or 'sleep'=any(arr) or 'u'=any(arr)) then 12 else 0 end)
      +(case when ans->>'collider'='avoid' then 8 else 0 end);
  when 'dml' then
   return case when ans->'order'='["folds","models","residuals","effect"]'::jsonb
            and ans->>'limit'='not_unmeasured' then 7 else 0 end;
  when 'policy' then
   over_n:=coalesce((ans->'counts'->>'over')::int,0);
   balanced_n:=coalesce((ans->'counts'->>'balanced')::int,0);
   risk_n:=coalesce((ans->'counts'->>'risk')::int,0);
   pragmatic_n:=coalesce((ans->'counts'->>'pragmatic')::int,0);
   total:=over_n+balanced_n+risk_n+pragmatic_n;
   return (case when total=6 and
       ((ans->>'objective'='efficiency' and over_n=6)
       or(ans->>'objective'='equity' and risk_n>=1 and over_n>=4))
       then 6 else 0 end)
      +(case when ans->>'uncertainty'='estimate_not_guarantee' then 2 else 0 end);
  else return 0;
 end case;
end $fn$;

create or replace function public.cw_dean_mission_submit(
 p_hash text,p_mission text,p_answer jsonb)
returns jsonb language plpgsql security invoker set search_path=public as $fn$
declare player public.cw_dean_players; current_phase text;ver text;stage_step text;stopped boolean;
 needed_phase text; saved jsonb; vals text[]; k text; n integer; ids text[];
begin
 select * into player from public.cw_dean_players where token_hash=p_hash for update;
 if player.id is null then raise exception 'Sesión estudiantil inválida';end if;
 needed_phase:=case p_mission when 'association' then 'rector' when 'dag' then 'survey'
   when 'dml' then 'causal' when 'policy' then 'causal' else null end;
 if needed_phase is null then raise exception 'Misión no reconocida';end if;
 select phase,dgp_version into current_phase,ver from public.cw_dean_tournaments
 where game_id=player.game_id;
 if ver is distinct from 'zip_dgp_2026' or current_phase<>needed_phase
 then raise exception 'Esta misión no está habilitada en el torneo actual';end if;
 select step,paused into stage_step,stopped from public.cw_dean_learning_stages
 where game_id=player.game_id and phase=needed_phase for update;
 if stopped or stage_step is distinct from 'evidence'
 then raise exception 'El facilitador debe abrir la evidencia para esta misión';end if;
 select answer into saved from public.cw_dean_mission_attempts
 where player_id=player.id and mission_id=p_mission;
 if saved is not null then return jsonb_build_object('accepted',true,'duplicate',true,'saved',true);end if;
 if p_answer is null or jsonb_typeof(p_answer)<>'object' or length(p_answer::text)>1200
 then raise exception 'Formato de misión incorrecto';end if;
 if p_mission='association' and p_answer->>'interpretation' not in
  ('observational_only','negative_effect','predictive_proof')
 then raise exception 'Interpretación no válida';end if;
 if p_mission='dag' then
  if jsonb_typeof(p_answer->'nodes') is distinct from 'array'
   or jsonb_array_length(p_answer->'nodes')>5 or p_answer->>'collider' not in ('avoid','condition')
  then raise exception 'Selección de DAG inválida';end if;
  select array_agg(distinct node) into vals from jsonb_array_elements_text(p_answer->'nodes') node;
  if vals is not null and not (vals <@ array['h','z','study','sleep','u']) then
    raise exception 'Variables no permitidas';end if;
 end if;
 if p_mission='dml' then
  if jsonb_typeof(p_answer->'order') is distinct from 'array'
    or jsonb_array_length(p_answer->'order')<>4
    or p_answer->>'limit' not in ('not_unmeasured','always_eliminates')
   then raise exception 'Secuencia DML inválida';end if;
  select array_agg(distinct step) into vals from jsonb_array_elements_text(p_answer->'order') step;
  if vals is distinct from array['effect','folds','models','residuals'] then
    raise exception 'Tarjetas DML inválidas';end if;
 end if;
 if p_mission='policy' then
  if jsonb_typeof(p_answer->'counts') is distinct from 'object'
     or p_answer->>'objective' not in ('efficiency','equity')
     or p_answer->>'uncertainty' not in ('estimate_not_guarantee','certain')
  then raise exception 'Política inválida';end if;
  foreach k in array array['over','balanced','risk','pragmatic'] loop
   if coalesce(p_answer->'counts'->>k,'0') !~ '^[0-8]$' then
     raise exception 'Número de cupos inválido';end if;
  end loop;
  if (select sum((p_answer->'counts'->>v)::int) from unnest(array['over','balanced','risk','pragmatic']) v)>6
  then raise exception 'Solo hay 6 cupos por asignar';end if;
 end if;
 insert into public.cw_dean_mission_attempts(game_id,player_id,mission_id,phase,answer)
 values(player.game_id,player.id,p_mission,needed_phase,p_answer) on conflict do nothing;
 return jsonb_build_object('accepted',true,'duplicate',false,'saved',true);
end $fn$;

create or replace function public.cw_dean_mission_state(
 p_code text,p_hash text default null)
returns jsonb language plpgsql security invoker set search_path=public as $fn$
declare gid uuid;phase_name text;ver text;pid uuid;stage_name text;
 mission text; my_answer jsonb; rooms jsonb; tally jsonb; total_registered int;
begin
 select t.game_id,t.phase,t.dgp_version into gid,phase_name,ver
 from public.cw_dean_tournaments t join public.cw_games g on g.id=t.game_id
 where g.code=upper(btrim(p_code));
 if gid is null or ver is distinct from 'zip_dgp_2026' then
  return jsonb_build_object('available',false);end if;
 mission:=case phase_name when 'rector' then 'association'
  when 'survey' then 'dag' when 'causal' then 'dml' else null end;
 select step into stage_name from public.cw_dean_learning_stages
 where game_id=gid and phase=phase_name;
 if p_hash is not null then
  select id into pid from public.cw_dean_players where game_id=gid and token_hash=p_hash;
  if pid is null then raise exception 'Sesión inválida';end if;
 end if;
 select coalesce(jsonb_object_agg(mission_id,answer),'{}'::jsonb) into my_answer
 from public.cw_dean_mission_attempts where player_id=pid;
 select count(*) into total_registered from public.cw_dean_players where game_id=gid;
 select coalesce(jsonb_object_agg(mission_id,n),'{}'::jsonb) into tally
 from (select mission_id,count(*)::int n from public.cw_dean_mission_attempts
       where game_id=gid group by mission_id) x;
 select coalesce(jsonb_agg(to_jsonb(x) order by room_no),'[]'::jsonb) into rooms
 from (
  select r.room_no,count(distinct p.id)::int participants,
    count(distinct a.player_id) filter(where a.phase=phase_name)::int verified_people,
    coalesce(sum(case when d.step='debrief' then public.cw_dean_mission_score(a.mission_id,a.answer)
       else 0 end),0)::int skill_points
  from generate_series(1,5) r(room_no)
  left join public.cw_dean_players p on p.game_id=gid and p.room_no=r.room_no
  left join public.cw_dean_mission_attempts a on a.player_id=p.id
  left join public.cw_dean_learning_stages d on d.game_id=gid and d.phase=a.phase
  group by r.room_no
 ) x;
 return jsonb_build_object('available',true,'phase',phase_name,'step',stage_name,
  'mine',my_answer,'completed',tally,'registered',total_registered,'rooms',rooms,
  'skill_max',43,'skill_label','PRÁCTICA CAUSAL VERIFICADA · NO la nota 0–50 ni la maestría ABC 0–100',
  'points_after_debrief_only',true);
end $fn$;
revoke all on function public.cw_dean_mission_score(text,jsonb) from public,anon,authenticated;
revoke all on function public.cw_dean_mission_submit(text,text,jsonb) from public,anon,authenticated;
revoke all on function public.cw_dean_mission_state(text,text) from public,anon,authenticated;
grant execute on function public.cw_dean_mission_score(text,jsonb) to service_role;
grant execute on function public.cw_dean_mission_submit(text,text,jsonb) to service_role;
grant execute on function public.cw_dean_mission_state(text,text) to service_role;
