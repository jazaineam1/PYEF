-- Auto-paced eight-question final for NEW canonical Dean tournaments only.
-- V1 and legacy (including FUTUROS) retain previous manual quiz semantics.
-- One authoritative server clock: 30 s voting + 9 s automatic explanation.
alter table public.cw_dean_quiz_sessions
 add column if not exists reveal_until timestamptz;

create or replace function public.cw_dean_quiz_tick_v4(p_code text)
returns text language plpgsql security invoker set search_path=public as $f$
declare gid uuid; ver text; stage text; state public.cw_dean_quiz_sessions; now_at timestamptz:=clock_timestamp();
begin
 select t.game_id,t.dgp_version,t.phase into gid,ver,stage
 from public.cw_dean_tournaments t
 join public.cw_games g on g.id=t.game_id
 where g.code=upper(btrim(p_code));
 if gid is null or ver<>'zip_dgp_2026' or stage<>'final' then return 'legacy';end if;
 select * into state from public.cw_dean_quiz_sessions where game_id=gid for update;
 if state.game_id is null then return 'idle';end if;
 if state.phase='open' and state.deadline_at<=now_at then
   update public.cw_dean_quiz_sessions
   set phase='reveal',deadline_at=null,reveal_until=now_at+interval '9 seconds',version=version+1
   where game_id=gid;
   return 'reveal';
 elsif state.phase='reveal' and state.reveal_until<=now_at then
   if state.question_no>=8 then
     update public.cw_dean_quiz_sessions set phase='podium',reveal_until=null,version=version+1
     where game_id=gid;
     return 'podium';
   end if;
   update public.cw_dean_quiz_sessions set question_no=state.question_no+1,
     phase='open',deadline_at=now_at+interval '30 seconds',
     reveal_until=null,version=version+1 where game_id=gid;
   return 'open';
 end if;
 return state.phase;
end $f$;

-- Teacher starts the whole sequence with ONE click. Additional commands remain manual
-- emergency overrides, never needed for normal question transitions.
create or replace function public.cw_dean_quiz_teacher_v4(p_token text,p_action text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid; ver text; stage text; state public.cw_dean_quiz_sessions;
 now_at timestamptz:=clock_timestamp(); code text;
begin
 select public.cw_validate_facilitator_token(p_token) into gid;
 if gid is null then raise exception 'Credencial docente inválida';end if;
 select dgp_version,phase into ver,stage from public.cw_dean_tournaments where game_id=gid;
 select g.code into code from public.cw_games g where g.id=gid;
 if ver<>'zip_dgp_2026' then return public.cw_dean_quiz_teacher(p_token,p_action);end if;
 if stage<>'final' then raise exception 'La batalla solo puede abrirse en fase final';end if;
 insert into public.cw_dean_quiz_sessions(game_id) values(gid) on conflict do nothing;
 select * into state from public.cw_dean_quiz_sessions where game_id=gid for update;
 if p_action='start' and state.phase='idle' then
   update public.cw_dean_quiz_sessions set question_no=1,phase='open',
      deadline_at=now_at+interval '30 seconds',reveal_until=null,version=version+1
   where game_id=gid;
 elsif p_action='lock' and state.phase='open' then
   update public.cw_dean_quiz_sessions set phase='reveal',
     deadline_at=null,reveal_until=now_at+interval '9 seconds',version=version+1 where game_id=gid;
 elsif p_action='next' and state.phase='reveal' then
   update public.cw_dean_quiz_sessions
     set phase=case when state.question_no=8 then 'podium' else 'open' end,
       question_no=least(8,state.question_no+1),
       deadline_at=case when state.question_no=8 then null else now_at+interval '30 seconds' end,
       reveal_until=null,version=version+1 where game_id=gid;
 elsif p_action='finish' and state.phase='podium' then
   update public.cw_dean_quiz_sessions set phase='finished',
      version=version+1 where game_id=gid;
 else raise exception 'Transición de final no permitida % → %',state.phase,p_action;end if;
 return public.cw_dean_quiz_state_v4(code,null);
end $f$;

-- All 30 participants appear on the ceremony, including people with zero correct votes.
-- Equal scores share the SAME competitive rank; alphabetical aliases only stabilize order.
create or replace function public.cw_dean_quiz_state_v4(p_code text,p_hash text default null)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare original jsonb;gid uuid; rank_rows jsonb:='[]'::jsonb;
 members int:=0; own_rank int:=null; state public.cw_dean_quiz_sessions;
 current_phase text; ver text; answered_shown int;
begin
 original:=public.cw_dean_quiz_state(p_code,p_hash);
 select t.game_id,t.phase,t.dgp_version into gid,current_phase,ver
 from public.cw_dean_tournaments t join public.cw_games g on g.id=t.game_id
 where g.code=upper(btrim(p_code));
 if gid is null then return original;end if;
 select count(*)::integer into members from public.cw_dean_players where game_id=gid;
 select * into state from public.cw_dean_quiz_sessions where game_id=gid;
 if state.game_id is null then
   return original||jsonb_build_object('participants',members,'auto_mode',ver='zip_dgp_2026');
 end if;
 answered_shown:=case when state.phase in ('reveal','podium','finished') then state.question_no
     else greatest(0,state.question_no-1) end;
 select coalesce(jsonb_agg(to_jsonb(rows) order by rows.position,lower(rows.alias)),'[]'::jsonb)
 into rank_rows
 from (
  select z.alias,z.room_no,z.points,
   rank() over(order by z.points desc)::int as position,z.player_id
  from (
   select p.id as player_id,p.alias,p.room_no,
     coalesce(sum(case when a.choice=q.correct_choice then q.points else 0 end),0)::int as points
   from public.cw_dean_players p
   left join public.cw_dean_quiz_answers a on a.player_id=p.id and a.question_no<=answered_shown
   left join public.cw_v2_quiz_questions q on q.question_no=a.question_no
   where p.game_id=gid group by p.id
  ) z
 ) rows;
 if p_hash is not null then
   select (r->>'position')::int into own_rank from jsonb_array_elements(rank_rows) r
   join public.cw_dean_players p on p.id=(r->>'player_id')::uuid
   where p.game_id=gid and p.token_hash=p_hash;
 end if;
 -- Do not expose UUIDs in the public Wall or student responses.
 select coalesce(jsonb_agg((r - 'player_id') order by (r->>'position')::int,lower(r->>'alias')),'[]'::jsonb)
 into rank_rows from jsonb_array_elements(rank_rows) r;
 return original||jsonb_build_object(
  'participants',members,'auto_mode',ver='zip_dgp_2026',
  'reveal_until',state.reveal_until,'leaderboard',rank_rows,
  'my_position',own_rank,
  'my_points',case when p_hash is not null then original->'my_points' else null end);
end $f$;

revoke all on function public.cw_dean_quiz_tick_v4(text) from public,anon,authenticated;
revoke all on function public.cw_dean_quiz_teacher_v4(text,text) from public,anon,authenticated;
revoke all on function public.cw_dean_quiz_state_v4(text,text) from public,anon,authenticated;
grant execute on function public.cw_dean_quiz_tick_v4(text) to service_role;
grant execute on function public.cw_dean_quiz_teacher_v4(text,text) to service_role;
grant execute on function public.cw_dean_quiz_state_v4(text,text) to service_role;
