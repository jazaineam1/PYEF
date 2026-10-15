-- Fictional life-score ranking: 80% actual grades, 10% sleep, 10% wellbeing.
-- All measures come from six saved manual rounds; simulated entries never win.
create or replace function public.cw_dean_arcade_recap_v6(p_code text,p_hash text default null)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid;current_phase text;protocol_name text;result jsonb;
begin
 select g.id,t.phase,a.protocol into gid,current_phase,protocol_name
 from public.cw_games g join public.cw_dean_tournaments t on t.game_id=g.id
 join public.cw_dean_agenda_rules a on a.game_id=g.id
 where g.code=upper(trim(p_code));
 if gid is null or protocol_name <> 'real_hours_6_v1' then
  return jsonb_build_object('top3','[]'::jsonb,'eligible_count',0,'finished',false,'my',null);
 end if;
 with people as (
 select p.id,p.alias,p.room_no,p.archetype,p.token_hash,
  count(e.exam_no)::int n,count(e.exam_no) filter(where e.auto_simulated)::int auto_n,
  round(avg(e.exam_score)::numeric,2) grade,
  round(avg(e.study_hours)::numeric,2) study,
  round(avg(e.sleep_hours)::numeric,2) sleep,
  round(avg(e.wellness_hours)::numeric,2) wellness
 from public.cw_dean_players p
 left join public.cw_dean_exam_records e on e.player_id=p.id and e.game_id=p.game_id
 where p.game_id=gid group by p.id
 ), scores as (
 select *,case when n=6 and auto_n=0 then round(
  (grade*.8 + 5*least(1,sleep/8) + 5*least(1,wellness/2))::numeric,1)
 else null end as rating from people
 ), winners as (
 select *,row_number() over (order by rating desc,grade desc,alias,id) as position
 from scores where rating is not null
 )
 select jsonb_build_object(
  'finished',current_phase='finished',
  'eligible_count',(select count(*) from winners),
  'top3',coalesce((select jsonb_agg(jsonb_build_object(
   'place',w.position,'alias',w.alias,'room_no',w.room_no,
   'avatar_no',mod(get_byte(decode(substr(md5(w.id::text),1,2),'hex'),0),12),
   'decision_index',w.rating,'avg_grade',round(w.grade,1)) order by w.position)
    from winners w where w.position<=3),'[]'::jsonb),
  'my',(select jsonb_build_object('alias',m.alias,'room_no',m.room_no,
   'archetype',m.archetype,'exams',m.n,'simulated_exams',m.auto_n,
   'avg_grade',m.grade,'avg_study',m.study,'avg_sleep',m.sleep,
   'avg_wellness',m.wellness,'decision_index',m.rating,
   'place',(select w.position from winners w where w.id=m.id),
   'history',coalesce((select jsonb_agg(jsonb_build_object(
    'exam',e.exam_no,'study',e.study_hours,'sleep',e.sleep_hours,
    'wellness',e.wellness_hours,'grade',e.exam_score,
    'simulated',e.auto_simulated) order by e.exam_no)
    from public.cw_dean_exam_records e where e.player_id=m.id),'[]'::jsonb)
  ) from scores m where p_hash is not null and m.token_hash=p_hash)
 ) into result;
 return result;
end $f$;
revoke all on function public.cw_dean_arcade_recap_v6(text,text) from public,anon,authenticated;
grant execute on function public.cw_dean_arcade_recap_v6(text,text) to service_role;
