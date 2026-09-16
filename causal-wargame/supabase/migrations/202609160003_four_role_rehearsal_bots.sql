-- Rehearsal bots must follow the same 5 teams x 4 role matrix as humans.
create or replace function public.cw_seed_rehearsal_bots(p_game_id uuid)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare
  g public.cw_games; human_count int; active_count int; target int; slot record; added int:=0;
begin
  select * into g from public.cw_games where id=p_game_id for update;
  if g.id is null then raise exception 'Partida no encontrada'; end if;
  if g.status not in ('lobby','briefing') then raise exception 'Los bots de ensayo sólo pueden prepararse antes de abrir una ronda'; end if;
  select count(*) filter(where not is_bot),count(*) into human_count,active_count from public.cw_players where game_id=p_game_id and active;
  target:=case when human_count=0 then 19 else 20 end;
  if active_count>=target then return jsonb_build_object('ok',true,'added',0,'players',active_count,'humans',human_count,'bots',active_count-human_count); end if;

  for slot in
    select t.id team_id,t.position,v.role_code,v.role_pos,t.name team_name
    from public.cw_teams t
    cross join (values ('business',1),('data',2),('context',3),('integrator',4)) v(role_code,role_pos)
    where t.game_id=p_game_id and t.position between 1 and 5
      and not exists(select 1 from public.cw_players p where p.game_id=p_game_id and p.team_id=t.id and p.role_code=v.role_code)
    order by v.role_pos,t.position
  loop
    exit when active_count>=target;
    insert into public.cw_players(game_id,team_id,display_name,role_code,is_bot,last_seen_at)
    values(p_game_id,slot.team_id,'BOT · '||slot.team_name||' · '||slot.role_code,slot.role_code,true,now());
    active_count:=active_count+1; added:=added+1;
  end loop;
  insert into public.cw_events(game_id,actor,event_type,payload)
  values(p_game_id,'facilitator','rehearsal_bots_seeded',jsonb_build_object('added',added,'target',target,'teams',5,'core_roles',4));
  return jsonb_build_object('ok',true,'added',added,'players',active_count,'humans',human_count,'bots',active_count-human_count);
end $$;

revoke all on function public.cw_seed_rehearsal_bots(uuid) from public,anon,authenticated;
grant execute on function public.cw_seed_rehearsal_bots(uuid) to service_role;
