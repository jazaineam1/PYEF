-- Do not claim a class learned causal concepts when zero people voted.
-- Explicit demo-only path remains available for empty or non-responsive classrooms.
create or replace function public.cw_dean_learning_teacher(p_token text,p_action text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid; code text; active_phase text; current_step text; paused_now boolean;
 initial_n int; revision_n int; version_name text;
begin
 select public.cw_validate_facilitator_token(p_token) into gid;
 if gid is null then raise exception 'Credencial docente inválida';end if;
 select g.code,t.phase,t.dgp_version into code,active_phase,version_name
 from public.cw_games g join public.cw_dean_tournaments t on t.game_id=g.id where g.id=gid;
 if version_name is distinct from 'zip_dgp_2026'
 then raise exception 'La enseñanza guiada solo está habilitada para Copas canónicas nuevas';end if;
 if active_phase not in ('lobby','exams','rector','survey','causal')
 then raise exception 'La escena pedagógica no está activa';end if;
 insert into public.cw_dean_learning_stages(game_id,phase) values(gid,active_phase)
 on conflict do nothing;
 select step,paused into current_step,paused_now from public.cw_dean_learning_stages
 where game_id=gid and phase=active_phase for update;
 select count(*) filter(where kind='initial'),count(*) filter(where kind='revision')
 into initial_n,revision_n from public.cw_dean_learning_choices
 where game_id=gid and phase=active_phase;
 if p_action='pause' and not paused_now then
  update public.cw_dean_learning_stages set paused=true,updated_at=clock_timestamp()
   where game_id=gid and phase=active_phase;
 elsif p_action='resume' and paused_now then
  update public.cw_dean_learning_stages set paused=false,updated_at=clock_timestamp()
   where game_id=gid and phase=active_phase;
 elsif p_action='evidence' and current_step='challenge' then
  if initial_n=0 then raise exception
   'No hay decisiones iniciales. Usa DEMOSTRACIÓN SIN PUNTOS o espera al primer participante';end if;
  update public.cw_dean_learning_stages set step='evidence',paused=false,updated_at=clock_timestamp()
   where game_id=gid and phase=active_phase;
 elsif p_action='debrief' and current_step='evidence' then
  if revision_n=0 then raise exception
   'Nadie revisó su decisión. Espera evidencias o usa DEMOSTRACIÓN SIN PUNTOS';end if;
  update public.cw_dean_learning_stages set step='debrief',paused=false,updated_at=clock_timestamp()
   where game_id=gid and phase=active_phase;
 elsif p_action='demo' and current_step in ('challenge','evidence') then
  if (current_step='challenge' and initial_n>0)
     or(current_step='evidence' and revision_n>0)
  then raise exception 'Hay decisiones válidas: sigue el flujo pedagógico normal';end if;
  update public.cw_dean_learning_stages set step='debrief',paused=false,updated_at=clock_timestamp()
   where game_id=gid and phase=active_phase;
 else raise exception 'Transición pedagógica no permitida';end if;
 return public.cw_dean_learning_state(code,null)
  ||jsonb_build_object('teacher_notice',case when p_action='demo'
    then 'Demostración docente sin evidencias verificadas; NO se asignaron puntos'
    else 'Transición confirmada por el servidor' end);
end $f$;
revoke all on function public.cw_dean_learning_teacher(text,text) from public,anon,authenticated;
grant execute on function public.cw_dean_learning_teacher(text,text) to service_role;
