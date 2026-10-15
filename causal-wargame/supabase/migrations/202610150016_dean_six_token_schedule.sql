-- Game-first agenda, isolated to explicitly opted-in canonical tournaments.
-- This changes the feasible action space, NOT canonical scorer/fatigue coefficients.
-- Preservation: prior games with recorded exams remain unchanged, as do V1/FUTUROS.
create table if not exists public.cw_dean_agenda_rules(
 game_id uuid primary key references public.cw_dean_tournaments(game_id) on delete cascade,
 protocol text not null default 'six_relative_tokens_v1'
  check(protocol='six_relative_tokens_v1'),
 activated_at timestamptz not null default clock_timestamp()
);
alter table public.cw_dean_agenda_rules enable row level security;
revoke all on public.cw_dean_agenda_rules from public,anon,authenticated;
grant select,insert on public.cw_dean_agenda_rules to service_role;

create or replace function public.cw_dean_agenda_new_game()
returns trigger language plpgsql security invoker set search_path=public as $f$
begin
 if new.dgp_version='zip_dgp_2026' then
  insert into public.cw_dean_agenda_rules(game_id) values(new.game_id) on conflict do nothing;
 end if;
 return new;
end $f$;
drop trigger if exists cw_dean_agenda_new_game_trg on public.cw_dean_tournaments;
create trigger cw_dean_agenda_new_game_trg after insert on public.cw_dean_tournaments
for each row execute function public.cw_dean_agenda_new_game();

-- User's unfinished training Copa can opt in without erasing its enrollment.
-- NEVER retroactively constrain a Copa where even one exam is already recorded.
insert into public.cw_dean_agenda_rules(game_id)
select g.id from public.cw_games g
join public.cw_dean_tournaments t on t.game_id=g.id
where g.code='COPA-7BD494B411E4'
 and t.phase='lobby' and t.dgp_version='zip_dgp_2026'
 and not exists(select 1 from public.cw_dean_exam_records er where er.game_id=g.id)
on conflict do nothing;

create or replace function public.cw_dean_agenda_status(p_code text)
returns jsonb language sql stable security invoker set search_path=public as $f$
 select jsonb_build_object('enabled',exists(
 select 1 from public.cw_dean_agenda_rules ar
 join public.cw_games g on g.id=ar.game_id
 join public.cw_dean_tournaments t on t.game_id=g.id
 where g.code=upper(btrim(p_code)) and t.dgp_version='zip_dgp_2026'
 ),'cap',6,'protocol','six_relative_tokens_v1')
$f$;

create or replace function public.cw_dean_exam_v3(
 p_token_hash text,p_exam integer,p_study numeric,p_sleep numeric,
 p_wellness numeric,p_auto boolean default false)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare p public.cw_dean_players;version_name text;phase text;exam_subject jsonb;
 previous integer;existing public.cw_dean_exam_records;outcome jsonb;
 b numeric:=p_wellness;h numeric:=p_study;s numeric:=p_sleep;
 lo_h numeric;hi_h numeric;lo_s numeric;hi_s numeric;lo_b numeric;hi_b numeric;
begin
 select * into p from public.cw_dean_players where token_hash=p_token_hash for update;
 if p.id is null then raise exception 'Estudiante inválido';end if;
 select t.dgp_version,t.phase into version_name,phase from public.cw_dean_tournaments t where t.game_id=p.game_id;
 if version_name is distinct from 'zip_dgp_2026' then
   return public.cw_dean_exam(p_token_hash,p_exam,p_study,p_sleep,p_wellness,p_auto);
 end if;
 if phase<>'exams' then raise exception 'Fase de exámenes cerrada';end if;
 if p_exam not between 1 and 15 then raise exception 'Examen fuera de rango';end if;
 select * into existing from public.cw_dean_exam_records where player_id=p.id and exam_no=p_exam;
 if existing.player_id is not null then
  return jsonb_build_object('exam_no',p_exam,'score',existing.exam_score,'subject',existing.subject_name,
    'submitted',true,'already_submitted',true,
    'completed',(select count(*) from public.cw_dean_exam_records where player_id=p.id));
 end if;
 select coalesce(max(exam_no),0) into previous from public.cw_dean_exam_records where player_id=p.id;
 if p_exam<>previous+1 then raise exception 'Rinde el siguiente parcial en orden';end if;
 case p.archetype
  when 'over' then lo_h:=8;hi_h:=14;lo_s:=2;hi_s:=5;lo_b:=0;hi_b:=1.5;
  when 'balanced' then lo_h:=4;hi_h:=8;lo_s:=6.5;hi_s:=8.5;lo_b:=1.5;hi_b:=3.5;
  when 'risk' then lo_h:=2;hi_h:=5.5;lo_s:=4.5;hi_s:=7;lo_b:=1.5;hi_b:=4;
  else lo_h:=0.5;hi_h:=3.5;lo_s:=7;hi_s:=9.5;lo_b:=3.5;hi_b:=6;
 end case;
 if h is null or s is null or b is null or h<lo_h or h>hi_h
 or s<lo_s or s>hi_s or b<lo_b or b>hi_b then
   raise exception 'Decisión fuera del rango del perfil canónico';end if;
 -- Six virtual scheduling tokens: different real-world time reference windows,
 -- thus normalized to the player's allowed range instead of incorrectly summing
 -- hours per exam, sleep per night and wellness per week as clock hours.
 if exists(select 1 from public.cw_dean_agenda_rules r where r.game_id=p.game_id) then
  if (
     (h-lo_h)*4.0/(hi_h-lo_h)
     +(s-lo_s)*4.0/(hi_s-lo_s)
     +(b-lo_b)*4.0/(hi_b-lo_b)
    ) > 6.00001 then
    raise exception 'AGENDA_EXCEDIDA: Libera fichas reduciendo estudio, sueño o bienestar antes de rendir';
  end if;
 end if;
 exam_subject:=public.cw_dean_subject_v3(p_exam);
 outcome:=public.cw_dean_score_v3(p.pga_prior,(exam_subject->>'complexity')::numeric,
 h,s,b,p.game_id::text||':'||p.id::text||':'||p_exam);
 insert into public.cw_dean_exam_records(
 game_id,player_id,exam_no,subject_name,complexity,study_hours,sleep_hours,wellness_hours,
 hidden_fatigue,exam_score,auto_simulated)
 values(p.game_id,p.id,p_exam,exam_subject->>'name',(exam_subject->>'complexity')::numeric,
 h,s,b,(outcome->>'fatiga_latente')::numeric,(outcome->>'nota_final')::numeric,coalesce(p_auto,false));
 return jsonb_build_object('exam_no',p_exam,'subject',exam_subject->>'name','score',outcome->'nota_final',
 'submitted',true,'already_submitted',false,'completed',p_exam,'dgp','zip_dgp_2026');
end $f$;


revoke all on function public.cw_dean_agenda_new_game() from public,anon,authenticated;
revoke all on function public.cw_dean_agenda_status(text) from public,anon,authenticated;
grant execute on function public.cw_dean_agenda_status(text) to service_role;
-- Existing cw_dean_exam_v3 permissions preserved from canonical migration.
