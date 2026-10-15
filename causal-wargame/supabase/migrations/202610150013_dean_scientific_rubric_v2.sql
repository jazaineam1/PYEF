-- Scientific integrity: include upstream archetype in DAG; no reward for
-- assigning a welfare intervention to a profile with negative estimated CATE.
-- Old canonical attempts are not rewritten: untagged attempts keep prior scoring.
-- Newly recorded attempts get server-stamped rubric 20261015_v2.
-- Never updates ZIP scorer, canonical coefficients, FUTUROS or previous scores.
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
   return (case when (ans->>'rubric'='20261015_v2' and 'h'=any(arr) and 'archetype'=any(arr)
       and not ('study'=any(arr) or 'sleep'=any(arr) or 'u'=any(arr))) 
       or (coalesce(ans->>'rubric','')<>'20261015_v2' and 'h'=any(arr)
       and not ('study'=any(arr) or 'sleep'=any(arr) or 'u'=any(arr)))
       then 12 else 0 end)
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
       ((ans->>'rubric'='20261015_v2' and over_n=6 and balanced_n=0 and risk_n=0 and pragmatic_n=0
             and ((ans->>'objective'='efficiency' and ans->>'harm'='recognize_negative')
              or (ans->>'objective'='equity' and ans->>'harm'='refer_to_alternative')))
         or (coalesce(ans->>'rubric','')<>'20261015_v2'
             and ((ans->>'objective'='efficiency' and over_n=6)
              or (ans->>'objective'='equity' and risk_n>=1 and over_n>=4))))
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
   or jsonb_array_length(p_answer->'nodes')>6 or p_answer->>'collider' not in ('avoid','condition')
  then raise exception 'Selección de DAG inválida';end if;
  select array_agg(distinct node) into vals from jsonb_array_elements_text(p_answer->'nodes') node;
  if vals is not null and not (vals <@ array['h','z','archetype','study','sleep','u']) then
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
     or p_answer->>'harm' not in ('recognize_negative','refer_to_alternative','ignore_negative')
  then raise exception 'Política inválida';end if;
  foreach k in array array['over','balanced','risk','pragmatic'] loop
   if coalesce(p_answer->'counts'->>k,'0') !~ '^[0-8]$' then
     raise exception 'Número de cupos inválido';end if;
  end loop;
  if (select sum((p_answer->'counts'->>v)::int) from unnest(array['over','balanced','risk','pragmatic']) v)>6
  then raise exception 'Solo hay 6 cupos por asignar';end if;
 end if;
 -- The server, NEVER the browser, decides which rubric governs newly recorded evidence.
 p_answer:=p_answer||jsonb_build_object('rubric','20261015_v2');
 insert into public.cw_dean_mission_attempts(game_id,player_id,mission_id,phase,answer)
 values(player.game_id,player.id,p_mission,needed_phase,p_answer) on conflict do nothing;
 return jsonb_build_object('accepted',true,'duplicate',false,'saved',true);
end $fn$;


