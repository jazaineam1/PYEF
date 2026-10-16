-- One reusable game code, configurable 1–2 rooms, 1–6 seats each.
-- Configuration survives reset; every reset archives the outgoing played round.
create table if not exists public.cw_dean_room_config_v7(
 game_id uuid primary key references public.cw_games(id) on delete cascade,
 room_count smallint not null default 2 check(room_count between 1 and 2),
 seats_per_room smallint not null default 6 check(seats_per_room between 1 and 6),
 updated_at timestamptz not null default now()
);
alter table public.cw_dean_room_config_v7 enable row level security;
revoke all on public.cw_dean_room_config_v7 from public,anon,authenticated;
grant select,insert,update on public.cw_dean_room_config_v7 to service_role;

create table if not exists public.cw_dean_round_archive_v7(
 game_id uuid not null references public.cw_games(id) on delete cascade,
 revision integer not null,
 archived_at timestamptz not null default now(),
 old_phase text not null,
 players integer not null,
 exams integer not null,
 report jsonb not null,
 primary key(game_id,revision)
);
alter table public.cw_dean_round_archive_v7 enable row level security;
revoke all on public.cw_dean_round_archive_v7 from public,anon,authenticated;
grant select,insert on public.cw_dean_round_archive_v7 to service_role;

create or replace function public.cw_dean_room_config_status_v7(p_code text)
returns jsonb language sql stable security invoker set search_path=public as $f$
 select coalesce((
 select jsonb_build_object('room_count',
    coalesce(c.room_count,case when exists(
     select 1 from public.cw_dean_players p where p.game_id=g.id and p.room_no>2)
    then 5 else 2 end),
   'seats_per_room',coalesce(c.seats_per_room,6),
   'configurable',t.phase='lobby')
 from public.cw_games g
 join public.cw_dean_tournaments t on t.game_id=g.id
 join public.cw_dean_agenda_rules a on a.game_id=g.id
 left join public.cw_dean_room_config_v7 c on c.game_id=g.id
 where g.code=upper(btrim(p_code)) and a.protocol='real_hours_6_v1'
 ),jsonb_build_object('room_count',5,'seats_per_room',6,'configurable',false))
$f$;
revoke all on function public.cw_dean_room_config_status_v7(text) from public,anon,authenticated;
grant execute on function public.cw_dean_room_config_status_v7(text) to service_role;

create or replace function public.cw_dean_room_config_set_v7(p_token text,p_rooms integer,p_seats integer)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid;code text;stage text;mode text;
begin
 select public.cw_validate_facilitator_token(p_token) into gid;
 if gid is null then raise exception 'Sesión docente inválida';end if;
 if p_rooms not between 1 and 2 or p_seats not between 1 and 6 then
  raise exception 'Solo se permiten 1 o 2 salas con 1 a 6 personas por sala';end if;
 select g.code,t.phase,a.protocol into code,stage,mode
 from public.cw_games g join public.cw_dean_tournaments t on t.game_id=g.id
 join public.cw_dean_agenda_rules a on a.game_id=g.id
 where g.id=gid for update of t;
 if mode is distinct from 'real_hours_6_v1' then
  raise exception 'La configuración de salas solo está disponible para la Copa de 6 exámenes';end if;
 if stage<>'lobby' then raise exception 'Reinicia la Copa para cambiar las salas; el juego ya está en marcha';end if;
 if exists(select 1 from public.cw_dean_players p where p.game_id=gid and p.room_no>p_rooms) then
  raise exception 'Hay personas en una sala que vas a cerrar. Reinicia primero.';end if;
 if exists(select 1 from public.cw_dean_players p where p.game_id=gid
  group by p.room_no having count(*)>p_seats) then
  raise exception 'Hay más participantes inscritos que el cupo solicitado. Reinicia primero.';end if;
 insert into public.cw_dean_room_config_v7(game_id,room_count,seats_per_room,updated_at)
 values(gid,p_rooms,p_seats,now())
 on conflict(game_id) do update set room_count=excluded.room_count,
 seats_per_room=excluded.seats_per_room,updated_at=now();
 return jsonb_build_object('room_count',p_rooms,'seats_per_room',p_seats,
  'game_code',code,'configurable',true);
end $f$;
revoke all on function public.cw_dean_room_config_set_v7(text,integer,integer) from public,anon,authenticated;
grant execute on function public.cw_dean_room_config_set_v7(text,integer,integer) to service_role;

create or replace function public.cw_dean_join_configured_v7(p_code text,p_alias text,p_room integer,p_token_hash text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid;mode text;stage text;room_limit integer;seat_limit integer;
begin
 select g.id,t.phase,a.protocol into gid,stage,mode
 from public.cw_games g join public.cw_dean_tournaments t on t.game_id=g.id
 left join public.cw_dean_agenda_rules a on a.game_id=g.id
 where g.code=upper(btrim(p_code)) for update of t;
 if gid is null then raise exception 'No se encontró esa Copa';end if;
 if mode='real_hours_6_v1' then
  select coalesce(c.room_count,2),coalesce(c.seats_per_room,6)
  into room_limit,seat_limit
  from public.cw_games g
  left join public.cw_dean_room_config_v7 c on c.game_id=g.id where g.id=gid;
  if not p_room between 1 and room_limit then
   raise exception 'Solo están habilitadas % salas',room_limit;end if;
  if not exists(select 1 from public.cw_dean_players p where p.game_id=gid and p.token_hash=p_token_hash)
    and (select count(*) from public.cw_dean_players p where p.game_id=gid and p.room_no=p_room)>=seat_limit then
   raise exception 'Esta sala ya completó sus % cupos',seat_limit;end if;
 end if;
 return public.cw_dean_join_v3(p_code,p_alias,p_room,p_token_hash);
end $f$;
revoke all on function public.cw_dean_join_configured_v7(text,text,integer,text) from public,anon,authenticated;
grant execute on function public.cw_dean_join_configured_v7(text,text,integer,text) to service_role;

create or replace function public.cw_dean_reset_reusable_v7(p_token text,p_confirmation_code text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid;code text;stage text;rev integer;protocol_name text;
 nplayers integer;nexams integer;rows_data jsonb;ret jsonb;
begin
 select public.cw_validate_facilitator_token(p_token) into gid;
 if gid is null then raise exception 'Sesión docente inválida';end if;
 select g.code,t.phase,t.revision,a.protocol into code,stage,rev,protocol_name
 from public.cw_games g join public.cw_dean_tournaments t on t.game_id=g.id
 left join public.cw_dean_agenda_rules a on a.game_id=g.id
 where g.id=gid for update of t;
 if code is null or p_confirmation_code is distinct from code then
  raise exception 'Confirmación incorrecta del código de la Copa';end if;
 if protocol_name is distinct from 'real_hours_6_v1' then
  raise exception 'Este reinicio con archivo es solo para Copas de 6 exámenes';end if;
 select count(*) into nplayers from public.cw_dean_players where game_id=gid;
 select count(*) into nexams from public.cw_dean_exam_records where game_id=gid;
 if nplayers>0 or nexams>0 then
  select coalesce(jsonb_agg(jsonb_build_array(p.alias,p.room_no,e.exam_no,e.subject_name,
    e.complexity,p.pga_prior,p.archetype,e.study_hours,e.sleep_hours,e.wellness_hours,
    e.exam_score,e.auto_simulated,(select v.choice from public.cw_dean_arcade_policy_votes v
     where v.player_id=p.id)) order by p.room_no,p.alias,e.exam_no),'[]'::jsonb)
   into rows_data from public.cw_dean_exam_records e
   join public.cw_dean_players p on p.id=e.player_id where e.game_id=gid;
  insert into public.cw_dean_round_archive_v7(game_id,revision,old_phase,players,exams,report)
  values(gid,rev,stage,nplayers,nexams,jsonb_build_object(
   'columns',jsonb_build_array('estudiante_id','sala','examen_nro','asignatura',
    'complejidad','pga_previo','arquetipo','horas_estudio_jornada',
    'horas_sueno_jornada','horas_bienestar_jornada','nota_final','auto_simulado','decision_rector'),
   'rows',rows_data)) on conflict(game_id,revision) do nothing;
 end if;
 ret:=public.cw_dean_reset_confirmed(p_token,p_confirmation_code);
 return ret||jsonb_build_object('same_game_code',true,'archived',nplayers>0 or nexams>0,
  'archived_revision',case when nplayers>0 or nexams>0 then rev else null end);
end $f$;
revoke all on function public.cw_dean_reset_reusable_v7(text,text) from public,anon,authenticated;
grant execute on function public.cw_dean_reset_reusable_v7(text,text) to service_role;

create or replace function public.cw_dean_archives_list_v7(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid;
begin
 select public.cw_validate_facilitator_token(p_token) into gid;
 if gid is null then raise exception 'Sesión docente inválida';end if;
 return coalesce((select jsonb_agg(jsonb_build_object(
 'revision',a.revision,'archived_at',a.archived_at,
 'players',a.players,'exams',a.exams,'phase',a.old_phase)
 order by a.archived_at desc) from public.cw_dean_round_archive_v7 a
 where a.game_id=gid),'[]'::jsonb);
end $f$;
revoke all on function public.cw_dean_archives_list_v7(text) from public,anon,authenticated;
grant execute on function public.cw_dean_archives_list_v7(text) to service_role;

create or replace function public.cw_dean_archives_export_v7(p_token text,p_revision integer)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare gid uuid;result jsonb;
begin
 select public.cw_validate_facilitator_token(p_token) into gid;
 if gid is null then raise exception 'Sesión docente inválida';end if;
 select a.report into result from public.cw_dean_round_archive_v7 a
 where a.game_id=gid and a.revision=p_revision;
 if result is null then raise exception 'La ronda archivada no existe';end if;
 return result;
end $f$;
revoke all on function public.cw_dean_archives_export_v7(text,integer) from public,anon,authenticated;
grant execute on function public.cw_dean_archives_export_v7(text,integer) to service_role;
