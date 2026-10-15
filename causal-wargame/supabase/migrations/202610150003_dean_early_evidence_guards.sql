-- Causal evidence may not be downloaded during the student's initial blind vote.
-- V1/historical tournament behavior unchanged. service_role-only RPC functions.
create or replace function public.cw_dean_learning_export(p_hash text,p_layer text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid; stage text; ver text; step_name text;
begin
 select p.game_id,t.phase,t.dgp_version into gid,stage,ver
 from public.cw_dean_players p join public.cw_dean_tournaments t on t.game_id=p.game_id
 where p.token_hash=p_hash;
 if gid is null then raise exception 'Sesión estudiantil inválida';end if;
 if ver='zip_dgp_2026' and
   ((stage='rector' and p_layer='rector') or (stage='survey' and p_layer='survey')) then
   select step into step_name from public.cw_dean_learning_stages where game_id=gid and phase=stage;
   if step_name is distinct from 'evidence' and step_name is distinct from 'debrief' then
    raise exception 'El docente aún no ha liberado la evidencia de esta fase';
   end if;
 end if;
 return public.cw_dean_export(p_hash,p_layer);
end $f$;

create or replace function public.cw_dean_learning_ab_observed(p_hash text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid; stage text; ver text; step_name text;
begin
 select p.game_id,t.phase,t.dgp_version into gid,stage,ver
 from public.cw_dean_players p join public.cw_dean_tournaments t on t.game_id=p.game_id
 where p.token_hash=p_hash;
 if gid is null then raise exception 'Sesión inválida';end if;
 if ver='zip_dgp_2026' and stage='causal' then
  select step into step_name from public.cw_dean_learning_stages where game_id=gid and phase=stage;
  if step_name is distinct from 'evidence' and step_name is distinct from 'debrief' then
   raise exception 'El experimento A/B se revelará cuando el docente libere la evidencia';
  end if;
 end if;
 return public.cw_dean_ab_observed_v3(p_hash);
end $f$;
revoke all on function public.cw_dean_learning_export(text,text) from public,anon,authenticated;
revoke all on function public.cw_dean_learning_ab_observed(text) from public,anon,authenticated;
grant execute on function public.cw_dean_learning_export(text,text) to service_role;
grant execute on function public.cw_dean_learning_ab_observed(text) to service_role;
