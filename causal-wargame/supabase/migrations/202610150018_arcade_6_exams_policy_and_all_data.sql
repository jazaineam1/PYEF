-- Six-exam arcade protocol. Keep old 10-exam and 15-exam games immutable.
alter table public.cw_dean_agenda_rules drop constraint if exists cw_dean_agenda_rules_protocol_check;
alter table public.cw_dean_agenda_rules add constraint cw_dean_agenda_rules_protocol_check
 check (protocol in ('six_relative_tokens_v1','real_hours_10_v1','real_hours_6_v1'));
alter table public.cw_dean_agenda_rules alter column protocol set default 'real_hours_6_v1';
create table if not exists public.cw_dean_arcade_policy_votes(
 game_id uuid not null references public.cw_dean_tournaments(game_id) on delete cascade,
 player_id uuid primary key references public.cw_dean_players(id) on delete cascade,
 choice text not null check (choice in ('si','no','evidencia_insuficiente')),
 created_at timestamptz not null default clock_timestamp()
);
alter table public.cw_dean_arcade_policy_votes enable row level security;
revoke all on public.cw_dean_arcade_policy_votes from public,anon,authenticated;
grant select,insert on public.cw_dean_arcade_policy_votes to service_role;

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
 max_exams:=case game_protocol when 'real_hours_6_v1' then 6 when 'real_hours_10_v1' then 10 else 15 end;
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
 if game_protocol='real_hours_6_v1' then
  case p.archetype
    when 'over' then lo_h:=2;hi_h:=8;lo_s:=6;hi_s:=8;lo_b:=0;hi_b:=3;
    when 'balanced' then lo_h:=1;hi_h:=6;lo_s:=7;hi_s:=9;lo_b:=0;hi_b:=4;
    when 'risk' then lo_h:=0;hi_h:=5;lo_s:=6;hi_s:=8.5;lo_b:=0;hi_b:=4;
    else lo_h:=0;hi_h:=5;lo_s:=7;hi_s:=9;lo_b:=1;hi_b:=4;
  end case;
 elsif game_protocol='real_hours_10_v1' then
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
 if game_protocol in ('real_hours_6_v1','real_hours_10_v1') then
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
 max_exams:=case game_protocol when 'real_hours_6_v1' then 6 when 'real_hours_10_v1' then 10 else 15 end;
 if game_protocol='real_hours_6_v1' then
   case p.archetype
    when 'over' then h:=6;s:=6.5;b:=1.5;
    when 'balanced' then h:=4;s:=8;b:=2;
    when 'risk' then h:=3;s:=7;b:=2;
    else h:=3;s:=8;b:=3;
   end case;
 elsif game_protocol='real_hours_10_v1' then h:=4;s:=8;b:=2;
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
 max_exams:=case game_protocol when 'real_hours_6_v1' then 6 when 'real_hours_10_v1' then 10 else 15 end;
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
   if game_protocol in ('real_hours_6_v1','real_hours_10_v1') and p_hash is not null and (original->'mine') is not null
     and (original->'mine') <> 'null'::jsonb then
     original:=jsonb_set(original,'{mine}',(original->'mine')||jsonb_build_object(
      'scores',(select coalesce(jsonb_agg(e.exam_score order by e.exam_no),'[]'::jsonb)
        from public.cw_dean_exam_records e join public.cw_dean_players p on p.id=e.player_id
        where p.game_id=gid and p.token_hash=p_hash),
      'average_score',(select round(avg(e.exam_score)::numeric,1)
        from public.cw_dean_exam_records e join public.cw_dean_players p on p.id=e.player_id
        where p.game_id=gid and p.token_hash=p_hash),
       'policy_choice',(select v.choice from public.cw_dean_arcade_policy_votes v
         join public.cw_dean_players p on p.id=v.player_id
         where v.game_id=gid and p.token_hash=p_hash)));
   end if;
 end if;
 return original||jsonb_build_object('exam_count',max_exams,'game_mode',game_protocol,'dgp_version',coalesce(ver,'legacy_v1'),
  'canonical_source','chapter-causalidad-master/config/simulation_parameters.toml',
  'dgp_updated_on','2026-10-14',
 'exam_deadline_at',(select tt.exam_deadline_at from public.cw_dean_tournaments tt where tt.game_id=gid),
 'server_now',clock_timestamp());
end $f$;

create or replace function public.cw_dean_game_export_v3(p_hash text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare p public.cw_dean_players;game_protocol text;total integer;data jsonb;
begin
 select * into p from public.cw_dean_players where token_hash=p_hash;
 if p.id is null then raise exception 'Jugador inválido';end if;
 select ar.protocol into game_protocol from public.cw_dean_agenda_rules ar where ar.game_id=p.game_id;
 if game_protocol not in ('real_hours_6_v1','real_hours_10_v1') then raise exception 'Exportación exclusiva del juego arcade';end if;
 select count(*) into total from public.cw_dean_exam_records where player_id=p.id;
 if total < (case when game_protocol='real_hours_6_v1' then 6 else 10 end) then raise exception 'Completa tus exámenes antes de descargar';end if;
 select coalesce(jsonb_agg(jsonb_build_array(q.alias,q.room_no,e.exam_no,e.subject_name,
    e.complexity,q.pga_prior,q.archetype,e.study_hours,e.sleep_hours,e.wellness_hours,
    e.exam_score,e.auto_simulated,
    (select v.choice from public.cw_dean_arcade_policy_votes v where v.player_id=q.id)
    ) order by q.room_no,q.alias,e.exam_no),'[]'::jsonb)
 into data from public.cw_dean_exam_records e
 join public.cw_dean_players q on q.id=e.player_id
 where e.game_id=p.game_id and q.game_id=p.game_id and (game_protocol='real_hours_6_v1' or q.room_no=p.room_no);
 return jsonb_build_object(
  'columns',jsonb_build_array('estudiante_id','sala','examen_nro','asignatura','complejidad',
    'pga_previo','arquetipo','horas_estudio_jornada','horas_sueno_jornada',
    'horas_bienestar_jornada','nota_final','auto_simulado','decision_rector'),
  'rows',data);
end $f$;

create or replace function public.cw_dean_game_start_v3(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid;game_protocol text;stage text;
begin
 select public.cw_validate_facilitator_token(p_token) into gid;
 if gid is null then raise exception 'Sesión docente inválida';end if;
 select t.phase,ar.protocol into stage,game_protocol
 from public.cw_dean_tournaments t join public.cw_dean_agenda_rules ar on ar.game_id=t.game_id
 where t.game_id=gid for update of t;
 if game_protocol not in ('real_hours_10_v1','real_hours_6_v1') or stage<>'lobby' then
  raise exception 'Inicio de juego no autorizado';end if;
 return public.cw_dean_teacher_next_v3(p_token);
end $f$;

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
 if game_protocol not in ('real_hours_10_v1','real_hours_6_v1') then raise exception 'Esta Copa no usa el modo juego';end if;
 if stage='finished' then return public.cw_dean_state_v3(game_code,null);end if;
 if stage<>'exams' then raise exception 'Primero abre los exámenes';end if;
 for p in select token_hash from public.cw_dean_players where game_id=gid loop
  perform public.cw_dean_auto_finish_v3(p.token_hash);
 end loop;
 update public.cw_dean_tournaments set phase='finished',revision=revision+1,
 exam_auto_filled_at=clock_timestamp() where game_id=gid;
 return public.cw_dean_state_v3(game_code,null);
end $f$;

create or replace function public.cw_dean_arcade_policy_submit_v4(p_hash text,p_choice text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare p public.cw_dean_players;protocol_name text;exam_total int;stored text;
begin
 select * into p from public.cw_dean_players where token_hash=p_hash for update;
 if p.id is null then raise exception 'Sesión de jugador inválida';end if;
 select ar.protocol into protocol_name from public.cw_dean_agenda_rules ar where ar.game_id=p.game_id;
 if protocol_name is distinct from 'real_hours_6_v1' then raise exception 'Esta Copa no tiene decisión final';end if;
 select count(*) into exam_total from public.cw_dean_exam_records where player_id=p.id;
 if exam_total<6 then raise exception 'Completa seis exámenes antes de decidir';end if;
 if p_choice not in ('si','no','evidencia_insuficiente') then raise exception 'Decisión inválida';end if;
 insert into public.cw_dean_arcade_policy_votes(game_id,player_id,choice)
 values(p.game_id,p.id,p_choice) on conflict(player_id) do nothing;
 select choice into stored from public.cw_dean_arcade_policy_votes where player_id=p.id;
 return jsonb_build_object('choice',stored,'saved',true);
end $f$;
revoke all on function public.cw_dean_arcade_policy_submit_v4(text,text) from public,anon,authenticated;
grant execute on function public.cw_dean_arcade_policy_submit_v4(text,text) to service_role;

-- Convert ONLY the unused demo Cup. Other Cup data stays unchanged.
update public.cw_dean_agenda_rules ar set protocol='real_hours_6_v1'
 from public.cw_games g join public.cw_dean_tournaments t on t.game_id=g.id
 where ar.game_id=g.id and g.code='COPA-7BD494B411E4'
   and ar.protocol='real_hours_10_v1' and t.phase='lobby'
   and not exists(select 1 from public.cw_dean_players p where p.game_id=g.id)
   and not exists(select 1 from public.cw_dean_exam_records e where e.game_id=g.id);

-- Facilitator may retrieve the entire observed dataset once any player has finished.
-- Unlike a participant, the facilitator needs no player credentials.
create or replace function public.cw_dean_game_export_facilitator_v4(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid;protocol_name text;student_hash text;
begin
 select public.cw_validate_facilitator_token(p_token) into gid;
 if gid is null then raise exception 'Credencial docente inválida';end if;
 select protocol into protocol_name from public.cw_dean_agenda_rules where game_id=gid;
 if protocol_name is distinct from 'real_hours_6_v1' then raise exception 'El exportador de esta Copa no está disponible';end if;
 select p.token_hash into student_hash
 from public.cw_dean_players p
 where p.game_id=gid
 and (select count(*) from public.cw_dean_exam_records e where e.player_id=p.id)>=6
 order by p.joined_at,p.id limit 1;
 if student_hash is null then raise exception 'Esperando a que termine el primer participante';end if;
 return public.cw_dean_game_export_v3(student_hash);
end $f$;
revoke all on function public.cw_dean_game_export_facilitator_v4(text) from public,anon,authenticated;
grant execute on function public.cw_dean_game_export_facilitator_v4(text) to service_role;
