-- A lightweight, fully server-backed waiting lobby for six and ten-exam arcade games.
-- Only public chosen aliases, room numbers, assigned emoji indices and ready flags are visible.
create table if not exists public.cw_dean_arcade_lobby_ready(
 player_id uuid primary key references public.cw_dean_players(id) on delete cascade,
 ready boolean not null default false,
 ready_at timestamptz
);
alter table public.cw_dean_arcade_lobby_ready enable row level security;
revoke all on public.cw_dean_arcade_lobby_ready from public,anon,authenticated;
grant select,insert,update on public.cw_dean_arcade_lobby_ready to service_role;

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
 return original||jsonb_build_object(
  'lobby_players',case when game_protocol in ('real_hours_6_v1','real_hours_10_v1') then
    (select coalesce(jsonb_agg(jsonb_build_object(
      'alias',p.alias,
      'room_no',p.room_no,
      'avatar_no',mod(get_byte(decode(substr(md5(p.id::text),1,2),'hex'),0),12),
      'ready',coalesce(rd.ready,false)
    ) order by p.room_no,p.joined_at,p.id),'[]'::jsonb)
     from public.cw_dean_players p
     left join public.cw_dean_arcade_lobby_ready rd on rd.player_id=p.id
     where p.game_id=gid)
    else '[]'::jsonb end,
  'my_avatar_no',case when p_hash is not null then
    (select mod(get_byte(decode(substr(md5(p.id::text),1,2),'hex'),0),12)
     from public.cw_dean_players p where p.game_id=gid and p.token_hash=p_hash)
    else null end,
  'my_lobby_ready',case when p_hash is not null then
    (select coalesce(rd.ready,false)
     from public.cw_dean_players p
     left join public.cw_dean_arcade_lobby_ready rd on rd.player_id=p.id
     where p.game_id=gid and p.token_hash=p_hash)
    else false end,
  'exam_count',max_exams,'game_mode',game_protocol,'dgp_version',coalesce(ver,'legacy_v1'),
  'canonical_source','chapter-causalidad-master/config/simulation_parameters.toml',
  'dgp_updated_on','2026-10-14',
 'exam_deadline_at',(select tt.exam_deadline_at from public.cw_dean_tournaments tt where tt.game_id=gid),
 'server_now',clock_timestamp());
end $f$;

create or replace function public.cw_dean_arcade_ready_v4(p_hash text,p_ready boolean)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare p public.cw_dean_players;protocol_name text;phase_name text;game_code text;
begin
 select * into p from public.cw_dean_players where token_hash=p_hash for update;
 if p.id is null then raise exception 'Sesión de jugador inválida';end if;
 select ar.protocol,t.phase,g.code into protocol_name,phase_name,game_code
 from public.cw_dean_agenda_rules ar
 join public.cw_dean_tournaments t on t.game_id=ar.game_id
 join public.cw_games g on g.id=ar.game_id
 where ar.game_id=p.game_id;
 if protocol_name not in ('real_hours_6_v1','real_hours_10_v1') or phase_name<>'lobby'
   then raise exception 'La sala de espera está cerrada';end if;
 insert into public.cw_dean_arcade_lobby_ready(player_id,ready,ready_at)
 values(p.id,coalesce(p_ready,false),case when p_ready then clock_timestamp() else null end)
 on conflict(player_id) do update set ready=excluded.ready,ready_at=excluded.ready_at;
 return public.cw_dean_state_v3(game_code,p_hash);
end $f$;
revoke all on function public.cw_dean_arcade_ready_v4(text,boolean) from public,anon,authenticated;
grant execute on function public.cw_dean_arcade_ready_v4(text,boolean) to service_role;
