-- Additive correction to versioned canonical V2 room scoring; applied after existing 008 migration.
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



revoke all on function public.cw_dean_state_v3(text,text) from public,anon,authenticated;
grant execute on function public.cw_dean_state_v3(text,text) to service_role;
