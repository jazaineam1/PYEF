create table if not exists public.cw_admin_config (
  singleton boolean primary key default true check(singleton),
  creator_secret_hash text not null,
  updated_at timestamptz not null default now()
);

alter table public.cw_admin_config enable row level security;
revoke all on table public.cw_admin_config from public,anon,authenticated;
grant all on table public.cw_admin_config to service_role;

create or replace function public.cw_bootstrap_game_authorized(p_admin_secret text,p_code text,p_pin text)
returns uuid language plpgsql security invoker set search_path=public as $$
declare stored text; gid uuid;
begin
  select creator_secret_hash into stored from public.cw_admin_config where singleton=true;
  if stored is null or extensions.crypt(coalesce(p_admin_secret,''),stored)<>stored then raise exception 'Clave maestra inválida'; end if;
  gid:=public.cw_bootstrap_game(p_code,p_pin);
  insert into public.cw_events(game_id,actor,event_type,payload) values(gid,'creator','game_bootstrapped',jsonb_build_object('code',upper(trim(p_code))));
  return gid;
end $$;

revoke all on function public.cw_bootstrap_game_authorized(text,text,text) from public,anon,authenticated;
grant execute on function public.cw_bootstrap_game_authorized(text,text,text) to service_role;
