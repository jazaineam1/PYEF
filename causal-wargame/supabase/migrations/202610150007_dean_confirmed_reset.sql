-- Reset a NEW canonical Dean Cup, never an historic/legacy cup or V1.
-- Reuses the facilitator code/PIN, invalidates every old student token by CASCADE,
-- starts clean in lobby and preserves a non-personal audit record.
create table if not exists public.cw_dean_reset_audit(
 id bigint generated always as identity primary key,
 game_id uuid not null references public.cw_games(id) on delete cascade,
 reset_at timestamptz not null default clock_timestamp(),
 previous_phase text not null,
 previous_players integer not null,
 previous_exams integer not null,
 previous_votes integer not null,
 previous_revision integer not null
);
alter table public.cw_dean_reset_audit enable row level security;
revoke all on public.cw_dean_reset_audit from public,anon,authenticated;
grant select,insert on public.cw_dean_reset_audit to service_role;

create or replace function public.cw_dean_reset_confirmed(p_token text,p_confirmation_code text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare
 gid uuid; code text; old_phase text; version text;
 players_n int; exams_n int; votes_n int; old_revision int;
begin
 select public.cw_validate_facilitator_token(p_token) into gid;
 if gid is null then raise exception 'Solo el docente autenticado puede reiniciar la Copa';end if;

 -- Serialize reset with phase changes and student joins.
 select g.code,t.phase,t.dgp_version,t.revision
 into code,old_phase,version,old_revision
 from public.cw_games g join public.cw_dean_tournaments t on t.game_id=g.id
 where g.id=gid for update of t;
 if code is null then raise exception 'No existe una Copa activa para este código';end if;
 if version is distinct from 'zip_dgp_2026' then
   raise exception 'Reinicio bloqueado: no se pueden borrar torneos históricos';
 end if;
 if p_confirmation_code is distinct from code then
   raise exception 'Para confirmar, escribe exactamente el código de la partida';
 end if;

 select count(*) into players_n from public.cw_dean_players where game_id=gid;
 select count(*) into exams_n from public.cw_dean_exam_records where game_id=gid;
 select count(*) into votes_n from public.cw_dean_quiz_answers where game_id=gid;

 insert into public.cw_dean_reset_audit
   (game_id,previous_phase,previous_players,previous_exams,previous_votes,previous_revision)
 values(gid,old_phase,players_n,exams_n,votes_n,old_revision);

 -- All V2 dependent records (students, exams, learning choices/stages,
 -- quiz votes/session and synthetic A/B) cascade from the tournament.
 -- No cw_games or original V1/cw_players row is deleted.
 delete from public.cw_dean_tournaments where game_id=gid;
 insert into public.cw_dean_tournaments(game_id,phase,revision,dgp_version)
 values(gid,'lobby',old_revision+1,'zip_dgp_2026');

 return jsonb_build_object(
  'reset',true,'game_code',code,'phase','lobby',
  'previous_players',players_n,'previous_exams',exams_n,
  'previous_votes',votes_n,'old_student_sessions_invalidated',true);
end $f$;
revoke all on function public.cw_dean_reset_confirmed(text,text) from public,anon,authenticated;
grant execute on function public.cw_dean_reset_confirmed(text,text) to service_role;
