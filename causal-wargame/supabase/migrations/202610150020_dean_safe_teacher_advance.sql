-- Server-authoritative teacher advance for arcade Cups.
-- Fixes the error "Inicio de juego no autorizado" when stale teacher clients
-- send the old 'next' command after all six exams have finished.
-- Never depends on a client supplied game code, phase or protocol.
create or replace function public.cw_dean_arcade_advance_v5(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid; stage text; game_protocol text; game_code text;
begin
 select public.cw_validate_facilitator_token(p_token) into gid;
 if gid is null then raise exception 'Sesión docente inválida'; end if;

 select t.phase, ar.protocol, g.code into stage, game_protocol, game_code
 from public.cw_dean_tournaments t
 join public.cw_dean_agenda_rules ar on ar.game_id=t.game_id
 join public.cw_games g on g.id=t.game_id
 where t.game_id=gid for update of t;
 if stage is null or game_protocol not in ('real_hours_6_v1','real_hours_10_v1') then
   raise exception 'Acción docente no disponible para esta partida';
 end if;

 if stage='lobby' then
   return public.cw_dean_game_start_v3(p_token);
 elsif stage='exams' then
   return public.cw_dean_game_finish_v3(p_token);
 elsif stage='finished' then
   return public.cw_dean_state_v3(game_code,null);
 end if;
 raise exception 'La partida no está en una fase válida para avanzar';
end $f$;

revoke all on function public.cw_dean_arcade_advance_v5(text) from public,anon,authenticated;
grant execute on function public.cw_dean_arcade_advance_v5(text) to service_role;
