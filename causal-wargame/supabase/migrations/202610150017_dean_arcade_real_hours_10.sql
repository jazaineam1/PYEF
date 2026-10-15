-- Copa del Decano V3: game-only, ten exams, 14 actual hours per preparation day.
-- Only new games receive this protocol; historical records, scoring functions and V1 stay intact.
-- This arcade data mode deliberately changes the feasible input domain vs the historical DGP.
alter table public.cw_dean_agenda_rules drop constraint if exists cw_dean_agenda_rules_protocol_check;
alter table public.cw_dean_agenda_rules
 add constraint cw_dean_agenda_rules_protocol_check
 check (protocol in ('six_relative_tokens_v1','real_hours_10_v1'));
alter table public.cw_dean_agenda_rules alter column protocol set default 'real_hours_10_v1';
-- Existing INSERT trigger automatically applies the new default only to newly created Cup rows.

create or replace function public.cw_dean_agenda_status(p_code text)
returns jsonb language sql stable security invoker set search_path=public as $f$
 select jsonb_build_object(
  'enabled',coalesce((select true from public.cw_dean_agenda_rules ar
     join public.cw_games g on g.id=ar.game_id
     join public.cw_dean_tournaments t on t.game_id=ar.game_id
     where g.code=upper(btrim(p_code)) and t.dgp_version='zip_dgp_2026'),false),
  'protocol',(select ar.protocol from public.cw_dean_agenda_rules ar
     join public.cw_games g on g.id=ar.game_id where g.code=upper(btrim(p_code))),
  'cap',case when exists(select 1 from public.cw_dean_agenda_rules ar
      join public.cw_games g on g.id=ar.game_id where g.code=upper(btrim(p_code))
      and ar.protocol='real_hours_10_v1') then 14 else 6 end)
$f$;

create or replace function public.cw_dean_exam_v3(
 p_token_hash text,p_exam integer,p_study numeric,p_sleep numeric,
 p_wellness numeric,p_auto boolean default false)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare p public.cw_dean_players;version_name text;phase text;exam_subject jsonb;
 previous integer;existing public.cw_dean_exam_records;outcome jsonb;
 b numeric:=p_wellness;h numeric:=p_study;s numeric:=p_sleep;
 lo_h numeric;hi_h numeric;lo_s numeric;hi_s numeric;lo_b numeric;hi_b numeric;game_protocol text; max_exams integer;
begin
 select * into p from public.cw_dean_players where token_hash=p_token_hash for update;
 if p.id is null then raise exception 'Estudiante inválido';end if;
 select t.dgp_version,t.phase into version_name,phase from public.cw_dean_tournaments t where t.game_id=p.game_id;
 if version_name is distinct from 'zip_dgp_2026' then
   return public.cw_dean_exam(p_token_hash,p_exam,p_study,p_sleep,p_wellness,p_auto);
 end if;
 if phase<>'exams' then raise exception 'Fase de exámenes cerrada';end if;
 select protocol into game_protocol from public.cw_dean_agenda_rules where game_id=p.game_id;
 max_exams:=case when game_protocol='real_hours_10_v1' then 10 else 15 end;
 if not coalesce(p_auto,false) and exists(select 1 from public.cw_dean_tournaments t where t.game_id=p.game_id
    and t.exam_deadline_at<=clock_timestamp()) then raise exception 'Tiempo de juego agotado';end if;
 if p_exam not between 1 and max_exams then raise exception 'Examen fuera de rango';end if;
 select * into existing from public.cw_dean_exam_records where player_id=p.id and exam_no=p_exam;
 if existing.player_id is not null then
  return jsonb_build_object('exam_no',p_exam,'score',existing.exam_score,'subject',existing.subject_name,
    'submitted',true,'already_submitted',true,
    'completed',(select count(*) from public.cw_dean_exam_records where player_id=p.id));
 end if;
 select coalesce(max(exam_no),0) into previous from public.cw_dean_exam_records where player_id=p.id;
 if p_exam<>previous+1 then raise exception 'Rinde el siguiente parcial en orden';end if;
 if game_protocol='real_hours_10_v1' then
  lo_h:=0;hi_h:=8;lo_s:=5.5;hi_s:=9;lo_b:=0;hi_b:=4;
 else
 case p.archetype
  when 'over' then lo_h:=8;hi_h:=14;lo_s:=2;hi_s:=5;lo_b:=0;hi_b:=1.5;
  when 'balanced' then lo_h:=4;hi_h:=8;lo_s:=6.5;hi_s:=8.5;lo_b:=1.5;hi_b:=3.5;
  when 'risk' then lo_h:=2;hi_h:=5.5;lo_s:=4.5;hi_s:=7;lo_b:=1.5;hi_b:=4;
  else lo_h:=0.5;hi_h:=3.5;lo_s:=7;hi_s:=9.5;lo_b:=3.5;hi_b:=6;
 end case;
 end if;
 if h is null or s is null or b is null or h<lo_h or h>hi_h
 or s<lo_s or s>hi_s or b<lo_b or b>hi_b then
   raise exception 'Decisión fuera del rango del perfil canónico';end if;
 -- Historical six-token schedules are preserved when the new protocol is not active.
 -- Six virtual scheduling tokens: different real-world time reference windows,
 -- thus normalized to the player's allowed range instead of incorrectly summing
 -- hours per exam, sleep per night and wellness per week as clock hours.
 if game_protocol='real_hours_10_v1' then
  if h+s+b > 14.00001 then raise exception 'AGENDA_EXCEDIDA: Máximo 14 h. Reduce otra actividad';end if;
  if h*2<>round(h*2) or s*2<>round(s*2) or b*2<>round(b*2) then
    raise exception 'Los cambios de horas deben ser de media hora';end if;
 elsif game_protocol='six_relative_tokens_v1' then
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

create or replace function public.cw_dean_auto_finish_v3(p_token_hash text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare p public.cw_dean_players;ver text;next_exam integer;k integer;
 h numeric;s numeric;b numeric;res jsonb;game_protocol text; max_exams integer;
begin
 select * into p from public.cw_dean_players where token_hash=p_token_hash;
 if p.id is null then raise exception 'Sesión inválida';end if;
 select dgp_version into ver from public.cw_dean_tournaments where game_id=p.game_id;
 if ver is distinct from 'zip_dgp_2026' then return public.cw_dean_auto_finish(p_token_hash);end if;
 select coalesce(max(exam_no),0)+1 into next_exam from public.cw_dean_exam_records where player_id=p.id;
 select protocol into game_protocol from public.cw_dean_agenda_rules where game_id=p.game_id;
 max_exams:=case when game_protocol='real_hours_10_v1' then 10 else 15 end;
 if game_protocol='real_hours_10_v1' then h:=4;s:=8;b:=2;
 else
 case p.archetype
 when 'over' then h:=11.5;s:=3.5;b:=0.6;
 when 'balanced' then h:=6;s:=7.5;b:=2.5;
 when 'risk' then h:=3.5;s:=6;b:=2.5;
 else h:=1.5;s:=8.5;b:=4.8;
 end case;
 end if;
 for k in next_exam..max_exams loop
   res:=public.cw_dean_exam_v3(p_token_hash,k,h,s,b,true);
 end loop;
 return jsonb_build_object('completed',(select count(*) from public.cw_dean_exam_records where player_id=p.id),
  'auto_generated_from',next_exam,'dgp',ver);
end $f$;

create or replace function public.cw_dean_state_v3(p_code text,p_hash text default null)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare original jsonb;ver text;gid uuid;groups_current jsonb;game_protocol text;max_exams integer;
begin
 original:=public.cw_dean_state(p_code,p_hash);
 select t.dgp_version,t.game_id into ver,gid from public.cw_dean_tournaments t join public.cw_games g on g.id=t.game_id
 where g.code=upper(trim(p_code));
 select ar.protocol into game_protocol from public.cw_dean_agenda_rules ar where ar.game_id=gid;
 max_exams:=case when game_protocol='real_hours_10_v1' then 10 else 15 end;
 if ver='zip_dgp_2026' then
   -- Completion must use enrolled participants, not six artificial seats.
   select coalesce(jsonb_agg(to_jsonb(t) order by t.room_no),'[]'::jsonb) into groups_current
   from (
     select room.room_no,count(distinct p.id)::int members,
       (count(distinct p.id)*max_exams)::int target_exams,
       count(e.exam_no)::int exams_completed,
       greatest(0,count(distinct p.id)*max_exams-count(e.exam_no))::int pending_exams,
       round(count(e.exam_no)*100.0/nullif(count(distinct p.id)*max_exams,0),1) coverage_pct,
       round(coalesce(sum(e.exam_score),0)::numeric/nullif(count(distinct p.id)*max_exams,0),1) fair_score,
       round(avg(e.exam_score)::numeric,1) average_score,
       (count(distinct p.id)>0 and count(e.exam_no)=max_exams*count(distinct p.id)) is_complete
     from generate_series(1,5) room(room_no)
     left join public.cw_dean_players p on p.room_no=room.room_no and p.game_id=gid
     left join public.cw_dean_exam_records e on e.game_id=gid and e.player_id=p.id
     group by room.room_no
   ) t;
   original:=original||jsonb_build_object('groups',groups_current);
   if game_protocol='real_hours_10_v1' and p_hash is not null and (original->'mine') is not null
     and (original->'mine') <> 'null'::jsonb then
     original:=jsonb_set(original,'{mine}',(original->'mine')||jsonb_build_object(
      'scores',(select coalesce(jsonb_agg(e.exam_score order by e.exam_no),'[]'::jsonb)
        from public.cw_dean_exam_records e join public.cw_dean_players p on p.id=e.player_id
        where p.game_id=gid and p.token_hash=p_hash),
      'average_score',(select round(avg(e.exam_score)::numeric,1)
        from public.cw_dean_exam_records e join public.cw_dean_players p on p.id=e.player_id
        where p.game_id=gid and p.token_hash=p_hash)));
   end if;
 end if;
 return original||jsonb_build_object('exam_count',max_exams,'game_mode',game_protocol,'dgp_version',coalesce(ver,'legacy_v1'),
  'canonical_source','chapter-causalidad-master/config/simulation_parameters.toml',
  'dgp_updated_on','2026-10-14',
 'exam_deadline_at',(select tt.exam_deadline_at from public.cw_dean_tournaments tt where tt.game_id=gid),
 'server_now',clock_timestamp());
end $f$;

-- Explicit arcade exports. Authenticated by the opaque player token hash;
-- cannot cross game or room boundaries and cannot unlock before 10 exams.
create or replace function public.cw_dean_game_export_v3(p_hash text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare p public.cw_dean_players;game_protocol text;total integer;data jsonb;
begin
 select * into p from public.cw_dean_players where token_hash=p_hash;
 if p.id is null then raise exception 'Jugador inválido';end if;
 select ar.protocol into game_protocol from public.cw_dean_agenda_rules ar where ar.game_id=p.game_id;
 if game_protocol is distinct from 'real_hours_10_v1' then raise exception 'Exportación exclusiva del nuevo juego';end if;
 select count(*) into total from public.cw_dean_exam_records where player_id=p.id;
 if total<10 then raise exception 'Termina tus 10 exámenes antes de descargar';end if;
 select coalesce(jsonb_agg(jsonb_build_array(q.alias,q.room_no,e.exam_no,e.subject_name,
    e.complexity,q.pga_prior,q.archetype,e.study_hours,e.sleep_hours,e.wellness_hours,
    e.exam_score,e.auto_simulated) order by q.alias,e.exam_no),'[]'::jsonb)
 into data from public.cw_dean_exam_records e
 join public.cw_dean_players q on q.id=e.player_id
 where e.game_id=p.game_id and q.game_id=p.game_id and q.room_no=p.room_no;
 return jsonb_build_object(
  'columns',jsonb_build_array('estudiante_id','sala','examen_nro','asignatura','complejidad',
    'pga_previo','arquetipo','horas_estudio_jornada','horas_sueno_jornada',
    'horas_bienestar_jornada','nota_final','auto_simulado'),
  'rows',data);
end $f$;

-- The facilitator ends the arcade here; no quiz, learning gate, or forced extra acts.
create or replace function public.cw_dean_game_finish_v3(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid;game_protocol text;stage text;game_code text;p record;
begin
 select public.cw_validate_facilitator_token(p_token) into gid;
 if gid is null then raise exception 'Sesión docente inválida';end if;
 select t.phase,g.code,ar.protocol into stage,game_code,game_protocol
 from public.cw_dean_tournaments t join public.cw_games g on g.id=t.game_id
 left join public.cw_dean_agenda_rules ar on ar.game_id=t.game_id
 where t.game_id=gid for update of t;
 if game_protocol is distinct from 'real_hours_10_v1' then raise exception 'Esta Copa no usa el modo juego';end if;
 if stage='finished' then return public.cw_dean_state_v3(game_code,null);end if;
 if stage<>'exams' then raise exception 'Primero abre los exámenes';end if;
 for p in select token_hash from public.cw_dean_players where game_id=gid loop
  perform public.cw_dean_auto_finish_v3(p.token_hash);
 end loop;
 update public.cw_dean_tournaments set phase='finished',revision=revision+1,
 exam_auto_filled_at=clock_timestamp() where game_id=gid;
 return public.cw_dean_state_v3(game_code,null);
end $f$;

revoke all on function public.cw_dean_game_export_v3(text) from public,anon,authenticated;
revoke all on function public.cw_dean_game_finish_v3(text) from public,anon,authenticated;
grant execute on function public.cw_dean_game_export_v3(text) to service_role;
grant execute on function public.cw_dean_game_finish_v3(text) to service_role;
