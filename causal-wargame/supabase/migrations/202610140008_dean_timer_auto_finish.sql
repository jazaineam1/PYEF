-- Dean V2 canonical only. Server-side 15-minute round deadline and non-destructive auto-completion.
alter table public.cw_dean_tournaments add column if not exists exam_started_at timestamptz;
alter table public.cw_dean_tournaments add column if not exists exam_deadline_at timestamptz;
alter table public.cw_dean_tournaments add column if not exists exam_auto_filled_at timestamptz;
create or replace function public.cw_dean_teacher_next_v3(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid;stage text;version_name text;code text;ignored jsonb;p record;
begin
 select public.cw_validate_facilitator_token(p_token) into gid;
 if gid is null then raise exception 'Sesión docente inválida';end if;
 select t.phase,t.dgp_version into stage,version_name from public.cw_dean_tournaments t where t.game_id=gid for update;
 select g.code into code from public.cw_games g where g.id=gid;
 if stage='exams' and version_name='zip_dgp_2026' then
   -- Instructor can close early; never leave students with incomplete 15-exam transcripts.
   for p in select token_hash from public.cw_dean_players where game_id=gid loop
     perform public.cw_dean_auto_finish_v3(p.token_hash);
   end loop;
   update public.cw_dean_tournaments set exam_auto_filled_at=clock_timestamp()
   where game_id=gid;
 end if;
 ignored:=public.cw_dean_teacher(p_token,'next');
 if stage='lobby' and version_name='zip_dgp_2026' then
   update public.cw_dean_tournaments set exam_started_at=clock_timestamp(),
    exam_deadline_at=clock_timestamp()+interval '15 minutes',
    exam_auto_filled_at=null where game_id=gid;
 end if;
 return public.cw_dean_state_v3(code,null);
end $f$;

create or replace function public.cw_dean_tick_v3(p_game_code text)
returns integer language plpgsql security invoker set search_path=public as $f$
declare t public.cw_dean_tournaments;p record;total integer:=0;
begin
 select tt.* into t from public.cw_dean_tournaments tt
 join public.cw_games g on g.id=tt.game_id where g.code=upper(trim(p_game_code)) for update of tt;
 if t.game_id is null or t.dgp_version<>'zip_dgp_2026' or t.phase<>'exams'
 or t.exam_deadline_at is null or t.exam_auto_filled_at is not null
 or clock_timestamp()<t.exam_deadline_at then return 0;end if;
 for p in select token_hash from public.cw_dean_players where game_id=t.game_id loop
   perform public.cw_dean_auto_finish_v3(p.token_hash);
   total:=total+1;
 end loop;
 update public.cw_dean_tournaments set exam_auto_filled_at=clock_timestamp() where game_id=t.game_id;
 return total;
end $f$;


create or replace function public.cw_dean_state_v3(p_code text,p_hash text default null)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare original jsonb;ver text;gid uuid;groups_current jsonb;
begin
 original:=public.cw_dean_state(p_code,p_hash);
 select t.dgp_version,t.game_id into ver,gid from public.cw_dean_tournaments t join public.cw_games g on g.id=t.game_id
 where g.code=upper(trim(p_code));
 if ver='zip_dgp_2026' then
   -- Completion must use enrolled participants, not six artificial seats.
   select coalesce(jsonb_agg(to_jsonb(t) order by t.room_no),'[]'::jsonb) into groups_current
   from (
     select room.room_no,count(distinct p.id)::int members,
       (count(distinct p.id)*15)::int target_exams,
       count(e.exam_no)::int exams_completed,
       round(avg(e.exam_score)::numeric,1) average_score,
       (count(distinct p.id)>0 and count(e.exam_no)=15*count(distinct p.id)) is_complete
     from generate_series(1,5) room(room_no)
     left join public.cw_dean_players p on p.room_no=room.room_no and p.game_id=gid
     left join public.cw_dean_exam_records e on e.game_id=gid and e.player_id=p.id
     group by room.room_no
   ) t;
   original:=original||jsonb_build_object('groups',groups_current);
 end if;
 return original||jsonb_build_object('dgp_version',coalesce(ver,'legacy_v1'),
  'canonical_source','chapter-causalidad-master/config/simulation_parameters.toml',
  'dgp_updated_on','2026-10-14',
 'exam_deadline_at',(select tt.exam_deadline_at from public.cw_dean_tournaments tt where tt.game_id=gid),
 'server_now',clock_timestamp());
end $f$;


create or replace function public.cw_dean_join_v3(p_code text,p_alias text,p_room integer,p_token_hash text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare prior_id uuid;data jsonb;new_id uuid;new_type text;version_name text;
begin
 select id into prior_id from public.cw_dean_players where token_hash=p_token_hash;
 if exists(select 1 from public.cw_dean_tournaments t join public.cw_games g on g.id=t.game_id
 where g.code=upper(trim(p_code)) and t.dgp_version='zip_dgp_2026' and t.phase='exams'
 and t.exam_deadline_at<=clock_timestamp()) then raise exception 'El tiempo de exámenes ya terminó';end if;
 data:=public.cw_dean_join(p_code,p_alias,p_room,p_token_hash);
 select dgp_version into version_name from public.cw_dean_tournaments t
 join public.cw_games g on g.id=t.game_id where g.code=upper(trim(p_code));
 if prior_id is null and version_name='zip_dgp_2026' then
  select id,archetype into new_id,new_type from public.cw_dean_players
   where token_hash=p_token_hash;
  update public.cw_dean_players set pga_prior=
   round((case new_type when 'over' then 3.8+random()
    when 'balanced' then 3.4+0.9*random()
    when 'risk' then 2.0+1.0*random()
    else 3.0+0.6*random() end)::numeric,1)
   where id=new_id and not exists(select 1 from public.cw_dean_exam_records where player_id=new_id);
 end if;
 return public.cw_dean_state_v3(p_code,p_token_hash);
end $f$;


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
 if not p_auto and exists(select 1 from public.cw_dean_tournaments t where t.game_id=p.game_id
 and t.exam_deadline_at<=clock_timestamp()) then raise exception 'Tiempo agotado: espera la simulación automática';end if;
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



revoke all on function public.cw_dean_teacher_next_v3(text) from public,anon,authenticated;
revoke all on function public.cw_dean_tick_v3(text) from public,anon,authenticated;
grant execute on function public.cw_dean_teacher_next_v3(text) to service_role;
grant execute on function public.cw_dean_tick_v3(text) to service_role;
