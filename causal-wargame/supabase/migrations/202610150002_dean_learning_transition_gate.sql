-- V2 new canonical teaching arc: server guarantees debrief before the next act.
-- Historical competitions and V1 retain the original transition path.
create or replace function public.cw_dean_learning_next(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid; stage text; version_name text; lesson_stage text;
begin
 select public.cw_validate_facilitator_token(p_token) into gid;
 if gid is null then raise exception 'Sesión docente inválida';end if;
 select phase,dgp_version into stage,version_name
 from public.cw_dean_tournaments where game_id=gid for update;
 if version_name='zip_dgp_2026' and stage in ('lobby','exams','rector','survey','causal') then
   select step into lesson_stage from public.cw_dean_learning_stages
    where game_id=gid and phase=stage;
   if lesson_stage is distinct from 'debrief' then
     raise exception 'Explica y revela la solución causal antes de avanzar a la siguiente fase';
   end if;
 end if;
 return public.cw_dean_teacher_next_v3(p_token);
end $f$;
revoke all on function public.cw_dean_learning_next(text) from public,anon,authenticated;
grant execute on function public.cw_dean_learning_next(text) to service_role;
