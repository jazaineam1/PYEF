-- Create an entirely NEW canonical Copa from an authenticated existing facilitator
-- (including facilitators currently viewing the historical FUTUROS tournament).
-- Never modifies, resets or deletes the source game, its players, scores or quiz.
create table if not exists public.cw_dean_cup_creation_audit (
 id bigint generated always as identity primary key,
 source_game_id uuid not null references public.cw_games(id) on delete cascade,
 new_game_id uuid not null unique references public.cw_games(id) on delete cascade,
 created_at timestamptz not null default clock_timestamp()
);
alter table public.cw_dean_cup_creation_audit enable row level security;
revoke all on public.cw_dean_cup_creation_audit from public,anon,authenticated;
grant select,insert on public.cw_dean_cup_creation_audit to service_role;

create or replace function public.cw_dean_create_fresh_cup(
 p_facilitator_token text,p_source_code text)
returns jsonb language plpgsql security invoker set search_path=public as $f$
declare
 source_gid uuid;
 source_code text;
 old_hash text;
 new_gid uuid;
 new_code text;
 next_token text;
 attempt integer;
begin
 select public.cw_validate_facilitator_token(p_facilitator_token) into source_gid;
 if source_gid is null then
  raise exception 'La sesión del facilitador expiró. Vuelve a entrar con el PIN';
 end if;
 select code,facilitator_pin_hash into source_code,old_hash
 from public.cw_games where id=source_gid;
 if source_code is null or source_code is distinct from upper(btrim(p_source_code)) then
  raise exception 'La credencial docente no corresponde al código mostrado';
 end if;
 if (select count(*) from public.cw_dean_cup_creation_audit
     where source_game_id=source_gid and created_at>clock_timestamp()-interval '1 hour') >= 5 then
  raise exception 'Límite de cinco Copas nuevas por hora. Espera antes de crear otra';
 end if;
 for attempt in 1..6 loop
  new_code:='COPA-'||upper(encode(extensions.gen_random_bytes(6),'hex'));
  begin
   insert into public.cw_games(code,title,facilitator_pin_hash,team_target,max_humans)
   values(new_code,'La Copa del Decano · DOS FUTUROS V2',old_hash,5,30)
   returning id into new_gid;
   exit;
  exception when unique_violation then
   new_gid:=null;
  end;
 end loop;
 if new_gid is null then raise exception 'No fue posible asignar un código único';end if;
 insert into public.cw_dean_tournaments(game_id,dgp_version,phase)
 values(new_gid,'zip_dgp_2026','lobby');
 insert into public.cw_dean_cup_creation_audit(source_game_id,new_game_id)
 values(source_gid,new_gid);
 -- The browser switches automatically to a fresh facilitator session.
 -- The PIN is reused securely as a hash; it is never exposed by the API.
 next_token:=encode(extensions.gen_random_bytes(32),'hex');
 insert into public.cw_facilitator_sessions(game_id,token_hash,expires_at)
 values(new_gid,extensions.digest(next_token,'sha256'),clock_timestamp()+interval '8 hours');
 return jsonb_build_object('created',true,'game_code',new_code,
  'facilitator_token',next_token,'phase','lobby','max_players',30,
  'source_game_preserved',true);
end $f$;
revoke all on function public.cw_dean_create_fresh_cup(text,text) from public,anon,authenticated;
grant execute on function public.cw_dean_create_fresh_cup(text,text) to service_role;
