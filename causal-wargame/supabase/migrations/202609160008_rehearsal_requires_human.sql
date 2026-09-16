-- Rehearsal mode must keep one real browser/player in the loop.
-- Otherwise a bot-only roster would freeze and the lesson gate (which correctly
-- requires a human) could never start.
create or replace function public.cw_seed_rehearsal_bots(p_game_id uuid)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare
  g public.cw_games;
  human_count int;
  active_count int;
  target_teams int;
  target int;
  slot record;
  added int:=0;
begin
  select * into g from public.cw_games where id=p_game_id for update;
  if g.id is null then raise exception 'Partida no encontrada'; end if;
  if g.status not in ('lobby','briefing') or g.roster_locked then
    raise exception 'Los bots de ensayo sólo pueden prepararse con la lista abierta';
  end if;

  perform public.cw_rebalance_lobby_roster(p_game_id);
  select * into g from public.cw_games where id=p_game_id;
  select count(*) into human_count
  from public.cw_players where game_id=p_game_id and active and not is_bot;

  if human_count=0 then
    raise exception 'Abre primero al menos un participante humano y luego completa el ensayo con bots';
  end if;

  target_teams:=greatest(5,g.team_target);
  target:=least(g.max_humans,target_teams*4);
  update public.cw_games set team_target=target_teams where id=p_game_id;

  select count(*) into active_count
  from public.cw_players where game_id=p_game_id and active;

  for slot in
    select t.id team_id,t.position,v.role_code,v.role_pos,t.name team_name
    from public.cw_teams t
    cross join (values ('business',1),('data',2),('context',3),('integrator',4)) v(role_code,role_pos)
    where t.game_id=p_game_id and t.position<=target_teams
      and not exists(
        select 1 from public.cw_players p
        where p.game_id=p_game_id and p.team_id=t.id and p.role_code=v.role_code
      )
    order by v.role_pos,t.position
  loop
    exit when active_count>=target;
    insert into public.cw_players(game_id,team_id,display_name,role_code,is_bot,last_seen_at)
    values(p_game_id,slot.team_id,'BOT · '||slot.team_name||' · '||slot.role_code,slot.role_code,true,now());
    active_count:=active_count+1;
    added:=added+1;
  end loop;

  update public.cw_games set roster_locked=true where id=p_game_id;

  insert into public.cw_events(game_id,actor,event_type,payload)
  values(p_game_id,'facilitator','rehearsal_bots_seeded',jsonb_build_object(
    'added',added,'target',target,'teams',target_teams,'core_roles',4,'roster_locked',true
  ));

  return jsonb_build_object(
    'ok',true,'added',added,'players',active_count,'humans',human_count,
    'bots',active_count-human_count,'team_target',target_teams,'target',target,
    'roster_locked',true
  );
end $$;

revoke all on function public.cw_seed_rehearsal_bots(uuid) from public,anon,authenticated;
grant execute on function public.cw_seed_rehearsal_bots(uuid) to service_role;
