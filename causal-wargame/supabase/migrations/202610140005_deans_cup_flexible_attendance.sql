-- V2 ONLY. Max 30 is capacity; not attendance requirement. No V1 writes.
-- Only recompute dynamic team targets, coverage, fair ranking score and quiz participation.
create or replace function public.cw_dean_state(p_code text,p_token_hash text default null)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid;phase text;groups jsonb;own jsonb:=null;quiz_state jsonb:=null;pid uuid;
begin
 select g.id into gid from public.cw_games g where g.code=upper(btrim(p_code));
 if gid is null then raise exception 'Partida inexistente';end if;
 select t.phase into phase from public.cw_dean_tournaments t where t.game_id=gid;
 if phase is null then return jsonb_build_object('available',false);end if;
 select coalesce(jsonb_agg(to_jsonb(r) order by r.room_no),'[]'::jsonb) into groups
 from (select n.room_no,s.members,s.exams_completed,
    (s.members*15)::integer as target_exams,
    greatest(0,s.members*15-s.exams_completed)::integer as pending_exams,
    round(s.exams_completed*100.0/nullif(s.members*15,0),1) as coverage_pct,
    round(s.total_points/nullif(s.members*15,0),1) as fair_score,
    round(s.total_points/nullif(s.exams_completed,0),1) as average_score,
    (s.members>0 and s.exams_completed=s.members*15) as is_complete
  from generate_series(1,5) n(room_no)
  cross join lateral (
    select count(distinct p.id)::integer members,
      count(e.exam_no)::integer exams_completed,
      coalesce(sum(e.exam_score),0)::numeric total_points
    from public.cw_dean_players p
    left join public.cw_dean_exam_records e on e.player_id=p.id and e.game_id=gid
    where p.game_id=gid and p.room_no=n.room_no
  ) s) r;
 if p_token_hash is not null then
  select p.id into pid from public.cw_dean_players p where p.game_id=gid and p.token_hash=p_token_hash;
  if pid is null then raise exception 'Sesión inválida';end if;
  select jsonb_build_object('id',p.id,'room',p.room_no,'alias',p.alias,'archetype',p.archetype,
  'pga',p.pga_prior,'completed',count(e.exam_no),
  'latest_score',max(e.exam_score) filter(where e.exam_no=(select max(exam_no) from public.cw_dean_exam_records where player_id=p.id)))
  into own from public.cw_dean_players p left join public.cw_dean_exam_records e on e.player_id=p.id
  where p.id=pid group by p.id;
 end if;
 return jsonb_build_object('available',true,'game_code',upper(btrim(p_code)),'phase',phase,
  'max_players',30,'registered_players',(select count(*) from public.cw_dean_players where game_id=gid),
  'group_size',6,'exam_count',15,'groups',groups,'mine',own);
end $f$;

create or replace function public.cw_dean_quiz_state(p_code text,p_hash text default null)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid;s public.cw_dean_quiz_sessions;task public.cw_v2_quiz_questions;
 effective text;shown integer;answered int;detail jsonb:=null;counts jsonb:=null;
 rank jsonb:='[]'::jsonb;mine text:=null;mine_points integer:=null;pid uuid;
begin
 select id into gid from public.cw_games where code=upper(btrim(p_code));
 if gid is null then raise exception 'Partida desconocida';end if;
 select * into s from public.cw_dean_quiz_sessions where game_id=gid;
 if s.game_id is null then return jsonb_build_object('phase','idle','question_no',0,'server_now',clock_timestamp(),
 'participants',(select count(*) from public.cw_dean_players where game_id=gid));end if;
 effective:=case when s.phase='open' and s.deadline_at<=clock_timestamp() then 'locked' else s.phase end;
 shown:=case when effective in ('reveal','podium','finished') then s.question_no else greatest(0,s.question_no-1) end;
 if s.question_no>0 then
 select * into task from public.cw_v2_quiz_questions where question_no=s.question_no;
 detail:=jsonb_build_object('text',task.question,'options',task.options,'concept',task.concept);
 if effective in ('reveal','podium','finished') then
 detail:=detail||jsonb_build_object('correct',task.correct_choice,'explanation',task.explanation);
 select jsonb_build_object('a',count(*) filter(where choice='a'),'b',count(*) filter(where choice='b'),
  'c',count(*) filter(where choice='c'),'d',count(*) filter(where choice='d')) into counts
 from public.cw_dean_quiz_answers where game_id=gid and question_no=s.question_no;
 end if;
 end if;
 select count(*) into answered from public.cw_dean_quiz_answers where game_id=gid and question_no=s.question_no;
 select coalesce(jsonb_agg(to_jsonb(t) order by t.points desc,t.alias),'[]'::jsonb) into rank from (
 select p.alias,p.room_no,coalesce(sum(case when a.choice=q.correct_choice then 15 else 0 end),0)::int points
 from public.cw_dean_players p
 left join public.cw_dean_quiz_answers a on a.player_id=p.id and a.question_no<=shown
 left join public.cw_v2_quiz_questions q on q.question_no=a.question_no
 where p.game_id=gid group by p.id order by points desc,p.alias limit 30
 ) t;
 if p_hash is not null then
 select id into pid from public.cw_dean_players where game_id=gid and token_hash=p_hash;
 if pid is null then raise exception 'Sesión inválida';end if;
 select choice into mine from public.cw_dean_quiz_answers where player_id=pid and question_no=s.question_no;
 select coalesce(sum(q.points),0) into mine_points from public.cw_dean_quiz_answers a
 join public.cw_v2_quiz_questions q on q.question_no=a.question_no and q.correct_choice=a.choice
 where a.player_id=pid and a.question_no<=shown;
 end if;
 return jsonb_build_object('phase',effective,'question_no',s.question_no,'question',detail,
 'deadline_at',s.deadline_at,'server_now',clock_timestamp(),'received',answered,
 'counts',counts,'leaderboard',rank,'mine',mine,'my_points',mine_points,
 'participants',(select count(*) from public.cw_dean_players where game_id=gid));
end $f$;
