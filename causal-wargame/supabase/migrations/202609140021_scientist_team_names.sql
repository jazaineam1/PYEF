-- V5.1: distinguish team identity from participant roles.
-- The four teams use scientist surnames; all teams still receive the same five roles.

update public.cw_teams
set name = case position
  when 1 then 'Fisher'
  when 2 then 'Neyman'
  when 3 then 'Rubin'
  when 4 then 'Pearl'
  else name
end
where position between 1 and 4;

create or replace function public.cw_bootstrap_game(p_code text, p_pin text)
returns uuid
language plpgsql
set search_path to 'public'
as $$
declare
  gid uuid;
  names text[] := array['Fisher','Neyman','Rubin','Pearl'];
  i int;
begin
  if length(trim(p_code)) < 4 or length(p_pin) < 8 then
    raise exception 'Código mínimo 4 caracteres y PIN mínimo 8 caracteres';
  end if;

  insert into public.cw_games(code,facilitator_pin_hash)
  values(upper(trim(p_code)),extensions.crypt(p_pin,extensions.gen_salt('bf')))
  returning id into gid;

  for i in 1..4 loop
    insert into public.cw_teams(game_id,position,name)
    values(gid,i,names[i]);
  end loop;

  insert into public.cw_events(game_id,actor,event_type,payload)
  values(gid,'system','game_created',jsonb_build_object('code',upper(trim(p_code))));

  return gid;
end
$$;
