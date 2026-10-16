-- Lobby-first admissions. Teachers begin only once everyone has logged in.
-- 30 seats in ONE room; three starting archetypes distributed evenly.
-- Two states: queue before teacher starts, one room with assigned profiles afterwards.
-- Existing games and legacy 10/15 protocols keep their registrations unchanged.

create table if not exists public.cw_dean_pending_v9(
 game_id uuid not null references public.cw_games(id) on delete cascade,
 token_hash text not null,
 alias text not null,
 joined_at timestamptz not null default clock_timestamp(),
 primary key(game_id,token_hash),
 constraint cw_dean_pending_token_check check(token_hash ~ '^[a-f0-9]{64}$'),
 constraint cw_dean_pending_alias_check check(
  length(btrim(alias)) between 2 and 30 and alias ~ '^[[:alnum:] _.-]+$')
);
create index if not exists cw_dean_pending_v9_queue_idx
 on public.cw_dean_pending_v9(game_id,joined_at,token_hash);
alter table public.cw_dean_pending_v9 enable row level security;
revoke all on public.cw_dean_pending_v9 from public,anon,authenticated;
grant select,insert,delete on public.cw_dean_pending_v9 to service_role;

create or replace function public.cw_dean_queue_register_v9(
 p_code text,p_alias text,p_hash text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid;phase_name text;protocol_name text;people int; waiting int; code_name text;
begin
 if p_hash !~ '^[a-f0-9]{64}$'
 or length(btrim(p_alias)) not between 2 and 30
 or p_alias !~ '^[[:alnum:] _.-]+$' then
  raise exception 'Alias o sesión inválida';end if;
 select g.id,g.code,t.phase,a.protocol into gid,code_name,phase_name,protocol_name
 from public.cw_games g
 join public.cw_dean_tournaments t on t.game_id=g.id
 left join public.cw_dean_agenda_rules a on a.game_id=g.id
 where g.code=upper(btrim(p_code)) for update of t;
 if gid is null then raise exception 'La Copa no existe';end if;
 if protocol_name is distinct from 'real_hours_6_v1' then
  return public.cw_dean_join_three_profiles_v8(p_code,p_alias,1,p_hash);end if;
 if exists(select 1 from public.cw_dean_players p where p.game_id=gid and p.token_hash=p_hash) then
  return public.cw_dean_state_v3(code_name,p_hash);end if;
 if phase_name<>'lobby' then raise exception 'El registro ya cerró';end if;
 select count(*) into people from public.cw_dean_players where game_id=gid;
 if people>0 then
  -- A pre-existing game with players already assigned keeps those memberships.
  return public.cw_dean_join_three_profiles_v8(p_code,p_alias,
    (select v.room_no from generate_series(1,5) v(room_no)
      left join public.cw_dean_players p on p.game_id=gid and p.room_no=v.room_no
      group by v.room_no having count(p.id)<6 order by count(p.id),v.room_no limit 1),p_hash);
 end if;
 select count(*) into waiting from public.cw_dean_pending_v9 where game_id=gid;
 if waiting>=30 and not exists(select 1 from public.cw_dean_pending_v9
   where game_id=gid and token_hash=p_hash) then
  raise exception 'La Copa alcanzó el máximo de 30 participantes';end if;
 insert into public.cw_dean_pending_v9(game_id,token_hash,alias)
 values(gid,p_hash,btrim(p_alias))
 on conflict(game_id,token_hash) do nothing;
 return jsonb_build_object('queued',true,'available',true,'game_code',code_name,
 'phase','lobby','game_mode','real_hours_6_v1','exam_count',6,
 'waiting_count',(select count(*) from public.cw_dean_pending_v9 where game_id=gid));
end $f$;

create or replace function public.cw_dean_queue_status_v9(p_code text,p_hash text default null)
returns jsonb language plpgsql stable security invoker set search_path=public as $f$
declare gid uuid;
begin
 select g.id into gid from public.cw_games g where g.code=upper(btrim(p_code));
 if gid is null then return jsonb_build_object('waiting_count',0,'mine_queued',false,'waiting_players','[]'::jsonb);end if;
 return jsonb_build_object(
  'waiting_count',(select count(*) from public.cw_dean_pending_v9 where game_id=gid),
  'mine_queued',p_hash is not null and exists(select 1 from public.cw_dean_pending_v9
   where game_id=gid and token_hash=p_hash),
  'waiting_players',coalesce((select jsonb_agg(jsonb_build_object(
     'alias',p.alias,'ready',true) order by p.joined_at,p.token_hash)
   from public.cw_dean_pending_v9 p where p.game_id=gid),'[]'::jsonb));
end $f$;

-- Atomic single-room assignment when teacher starts; no auto-reassignment of active games.
create or replace function public.cw_dean_game_start_v3(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid;protocol_name text;stage text;code_name text;
 row_player record;counter int:=0;new_room int;new_profile text;pga numeric;
begin
 select public.cw_validate_facilitator_token(p_token) into gid;
 if gid is null then raise exception 'Sesión docente inválida';end if;
 select t.phase,a.protocol,g.code into stage,protocol_name,code_name
 from public.cw_dean_tournaments t
 join public.cw_dean_agenda_rules a on a.game_id=t.game_id
 join public.cw_games g on g.id=t.game_id
 where t.game_id=gid for update of t;
 if protocol_name not in ('real_hours_10_v1','real_hours_6_v1') or stage<>'lobby' then
  raise exception 'Inicio de juego no autorizado';end if;
 if protocol_name='real_hours_6_v1' and exists(
  select 1 from public.cw_dean_pending_v9 where game_id=gid) then
  if exists(select 1 from public.cw_dean_players where game_id=gid) then
   raise exception 'La Copa tiene inscripciones de dos versiones. Reinicia antes de asignar salas.';end if;
  for row_player in select token_hash,alias from public.cw_dean_pending_v9
    where game_id=gid order by joined_at,token_hash
  loop
   new_room:=1;
   -- Three profiles assigned evenly among all players (difference at most one).
   new_profile:=(array['over','balanced','risk'])[1+mod(counter,3)];
   pga:=round((case new_profile
     when 'over' then 3.8+random()
     when 'balanced' then 3.4+0.9*random()
     else 2.0+1.0*random() end)::numeric,1);
   insert into public.cw_dean_players(
     game_id,room_no,alias,archetype,pga_prior,latent_resilience,token_hash)
   values(gid,new_room,row_player.alias,new_profile,pga,
    round((-0.55+1.1*random())::numeric,3),row_player.token_hash);
   counter:=counter+1;
  end loop;
  delete from public.cw_dean_pending_v9 where game_id=gid;
 end if;
 return public.cw_dean_teacher_next_v3(p_token);
end $f$;

revoke all on function public.cw_dean_queue_register_v9(text,text,text) from public,anon,authenticated;
revoke all on function public.cw_dean_queue_status_v9(text,text) from public,anon,authenticated;
revoke all on function public.cw_dean_game_start_v3(text) from public,anon,authenticated;
grant execute on function public.cw_dean_queue_register_v9(text,text,text) to service_role;
grant execute on function public.cw_dean_queue_status_v9(text,text) to service_role;
grant execute on function public.cw_dean_game_start_v3(text) to service_role;

-- On reset, waiting registrations are cleared as well; old student tokens can no
-- longer silently rejoin a new session before the facilitator invites them.
create or replace function public.cw_dean_reset_queue_v9(p_token text,p_confirmation_code text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid;actual_code text;
begin
 select public.cw_validate_facilitator_token(p_token) into gid;
 if gid is null then raise exception 'Sesión docente inválida';end if;
 select g.code into actual_code from public.cw_games g where g.id=gid;
 if actual_code is null or p_confirmation_code is distinct from actual_code
   then raise exception 'Confirma el código exacto para reiniciar';end if;
 delete from public.cw_dean_pending_v9 where game_id=gid;
 return public.cw_dean_reset_confirmed(p_token,p_confirmation_code);
end $f$;
revoke all on function public.cw_dean_reset_queue_v9(text,text) from public,anon,authenticated;
grant execute on function public.cw_dean_reset_queue_v9(text,text) to service_role;
