-- Causal Copa V2 only: elapsed clock catch-up across browser disconnects.
-- A complete Q lasts 30 seconds voting + 9 seconds teach/reveal.
-- Phase chronology stays anchored to original server deadlines, never restarts at poll time.
-- Legacy FUTUROS remains on the historic manual protocol.
create or replace function public.cw_dean_quiz_tick_v4(p_code text)
returns text language plpgsql security invoker set search_path=public as $f$
declare gid uuid;ver text;stage text;record public.cw_dean_quiz_sessions;
 now_at timestamptz:=clock_timestamp();elapsed numeric;
 completed_steps integer;next_q integer;next_deadline timestamptz;next_stage text;
begin
 select t.game_id,t.dgp_version,t.phase into gid,ver,stage
 from public.cw_dean_tournaments t join public.cw_games g on g.id=t.game_id
 where g.code=upper(btrim(p_code));
 if gid is null or ver<>'zip_dgp_2026' or stage<>'final' then return 'legacy';end if;
 select * into record from public.cw_dean_quiz_sessions where game_id=gid for update;
 if record.game_id is null then return 'idle';end if;

 if record.phase='open' and record.deadline_at is not null and record.deadline_at<=now_at then
  elapsed:=extract(epoch from (now_at-record.deadline_at));
  if elapsed<9 then
   update public.cw_dean_quiz_sessions
    set phase='reveal',deadline_at=null,
        reveal_until=record.deadline_at+interval '9 seconds',
        version=version+1 where game_id=gid;
   return 'reveal';
  end if;
  completed_steps:=floor((elapsed-9)/39)::int+1;
  next_q:=record.question_no+completed_steps;
  if next_q>8 then
    update public.cw_dean_quiz_sessions set phase='podium',question_no=8,
      deadline_at=null,reveal_until=null,version=version+1 where game_id=gid;
    return 'podium';
  end if;
  next_deadline:=record.deadline_at+make_interval(secs=>39*completed_steps);
  next_stage:=case when now_at<next_deadline then 'open' else 'reveal' end;
  update public.cw_dean_quiz_sessions set question_no=next_q,phase=next_stage,
   deadline_at=case when next_stage='open' then next_deadline else null end,
   reveal_until=case when next_stage='reveal' then next_deadline+interval '9 seconds' else null end,
   version=version+1 where game_id=gid;
  return next_stage;
 end if;

 if record.phase='reveal' and record.reveal_until is not null
  and record.reveal_until<=now_at then
  elapsed:=extract(epoch from (now_at-record.reveal_until));
  completed_steps:=floor(elapsed/39)::int+1;
  next_q:=record.question_no+completed_steps;
  if next_q>8 then
   update public.cw_dean_quiz_sessions set phase='podium',question_no=8,
    deadline_at=null,reveal_until=null,version=version+1 where game_id=gid;
   return 'podium';
  end if;
  next_deadline:=record.reveal_until+interval '30 seconds'
   +make_interval(secs=>39*(completed_steps-1));
  next_stage:=case when now_at<next_deadline then 'open' else 'reveal' end;
  update public.cw_dean_quiz_sessions set question_no=next_q,phase=next_stage,
   deadline_at=case when next_stage='open' then next_deadline else null end,
   reveal_until=case when next_stage='reveal' then next_deadline+interval '9 seconds' else null end,
   version=version+1 where game_id=gid;
  return next_stage;
 end if;
 return record.phase;
end $f$;
revoke all on function public.cw_dean_quiz_tick_v4(text) from public,anon,authenticated;
grant execute on function public.cw_dean_quiz_tick_v4(text) to service_role;
