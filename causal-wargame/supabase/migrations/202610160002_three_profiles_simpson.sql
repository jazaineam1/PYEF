-- Three representative starting conditions for NEW SIX-EXAM ENROLLMENTS.
-- Existing historical players and 10/15-exam Cups remain unchanged.
-- Secure wrapper relies on the original join's tournament row lock to serialize registrations.
create or replace function public.cw_dean_join_three_profiles_v8(
 p_code text,p_alias text,p_room integer,p_token_hash text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid;existing uuid;created uuid;protocol_name text;
 chosen text;record_count integer;previous text;
begin
 select g.id,a.protocol into gid,protocol_name
 from public.cw_games g left join public.cw_dean_agenda_rules a on a.game_id=g.id
 where g.code=upper(btrim(p_code));
 if gid is null then raise exception 'Copa inexistente';end if;
 select p.id into existing from public.cw_dean_players p
 where p.game_id=gid and p.token_hash=p_token_hash;
 if protocol_name is distinct from 'real_hours_6_v1' or existing is not null then
   return public.cw_dean_join_v3(p_code,p_alias,p_room,p_token_hash);
 end if;
 -- New six-exam registrations use only Alpha and Beta; historical 10/15 Cups
 -- retain all five rooms and previously enrolled players are not moved.
 if p_room not between 1 and 2 then
   raise exception 'Este simulador admite únicamente las salas Alpha y Beta';end if;
 -- cw_dean_join_v3 validates registration and locks tournament; never bypass controls.
 perform public.cw_dean_join_v3(p_code,p_alias,p_room,p_token_hash);
 select p.id into created from public.cw_dean_players p
 where p.game_id=gid and p.token_hash=p_token_hash;
 if created is null then raise exception 'No se pudo confirmar el ingreso';end if;
 -- Choose least represented profile (global first, within-room second); deterministic ties.
 -- Concurrency is serialized by cw_dean_join's tournament FOR UPDATE lock.
 select v.archetype into chosen from (values('over',1),('balanced',2),('risk',3)) v(archetype,ord)
 order by (select count(*) from public.cw_dean_players p
           where p.game_id=gid and p.id<>created and p.archetype=v.archetype),
          (select count(*) from public.cw_dean_players p
           where p.game_id=gid and p.id<>created and p.room_no=p_room and p.archetype=v.archetype),
          mod(v.ord+p_room-2,3)
 limit 1;
 update public.cw_dean_players p set archetype=chosen,
  pga_prior=round((case chosen
    when 'over' then 3.8+random()
    when 'balanced' then 3.4+0.9*random()
    else 2.0+1.0*random() end)::numeric,1)
 where p.id=created and not exists(
  select 1 from public.cw_dean_exam_records e where e.player_id=created);
 return public.cw_dean_state_v3(p_code,p_token_hash);
end $f$;
revoke all on function public.cw_dean_join_three_profiles_v8(text,text,integer,text)
 from public,anon,authenticated;
grant execute on function public.cw_dean_join_three_profiles_v8(text,text,integer,text)
 to service_role;
