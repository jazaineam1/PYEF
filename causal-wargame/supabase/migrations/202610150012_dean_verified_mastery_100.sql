-- Rebalance EXISTING 100-point causal mastery with server-verified scientific
-- missions. MAX: exams ABC 10 + Rector ABC 17 + association 8 +
-- DAG ABC 10 + DAG activity 20 + causal ABC 20 + DML 7 + policy 8 = 100.
-- No individual grade, quiz grade or historical FUTUROS tournament is rewritten.
create or replace function public.cw_dean_learning_weight(p_phase text)
returns integer language sql immutable security invoker set search_path=public as $f$
 select case p_phase
  when 'lobby' then 0 when 'exams' then 10
  when 'rector' then 17 when 'survey' then 10 when 'causal' then 20 else 0 end
$f$;

create or replace function public.cw_dean_learning_state_v5(p_code text,p_hash text default null)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare result jsonb;skills jsonb;rooms jsonb;
begin
 result:=public.cw_dean_learning_state(p_code,p_hash);
 if result->>'available' is distinct from 'true' then return result;end if;
 skills:=public.cw_dean_mission_state(p_code,p_hash);
 select coalesce(jsonb_agg(
    jsonb_set(a.value,'{learning_points}',
       to_jsonb(coalesce((a.value->>'learning_points')::int,0)+coalesce((
        select (b.value->>'skill_points')::int
        from jsonb_array_elements(skills->'rooms') b
        where (b.value->>'room_no')::int=(a.value->>'room_no')::int
       ),0)),true)
       order by (a.value->>'room_no')::int
    ),'[]'::jsonb) into rooms from jsonb_array_elements(result->'rooms') a;
 return result||jsonb_build_object('rooms',rooms,
  'mastery_scoring','57 puntos: decisiones ABC; 43 puntos: prácticas verificadas',
  'mastery_max',100,'evidence_completed',skills->'completed',
  'evidence_registered',skills->'registered');
end $f$;
revoke all on function public.cw_dean_learning_weight(text) from public,anon,authenticated;
revoke all on function public.cw_dean_learning_state_v5(text,text) from public,anon,authenticated;
grant execute on function public.cw_dean_learning_weight(text) to service_role;
grant execute on function public.cw_dean_learning_state_v5(text,text) to service_role;
