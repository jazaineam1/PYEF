-- Preserve already-running 4-team/5-role sessions while new/reset sessions use 5x4.

-- The previous migration may have added an empty fifth team. Remove it only from a
-- game that is demonstrably still using an active historical risk role.
delete from public.cw_teams t
where t.position=5
  and exists(select 1 from public.cw_players p where p.game_id=t.game_id and p.active and p.role_code='risk')
  and not exists(select 1 from public.cw_players p where p.team_id=t.id)
  and not exists(select 1 from public.cw_decisions d where d.team_id=t.id);

create or replace function public.cw_facilitator_state(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare gid uuid; g public.cw_games; teams_json jsonb; events_json jsonb; rank_mode text; total_players int; humans int; bots int; pre_n int; post_n int; pre_avg numeric; post_avg numeric; legacy_topology boolean:=false; core_target int:=4; team_target int:=5;
begin
  gid:=public.cw_validate_facilitator_token(p_token); if gid is null then raise exception 'Sesión inválida'; end if;
  perform public.cw_auto_close_round(gid); select * into g from public.cw_games where id=gid;
  select exists(select 1 from public.cw_players where game_id=gid and active and role_code='risk') into legacy_topology;
  if legacy_topology then core_target:=5; team_target:=4; end if;
  select count(*),count(*) filter(where not is_bot),count(*) filter(where is_bot) into total_players,humans,bots from public.cw_players where game_id=gid and active;
  rank_mode:=case when g.current_round=1 and g.status='closed' then 'observed' else 'causal' end;
  select count(*) filter(where stage='pre'),count(*) filter(where stage='post'),round(avg(score) filter(where stage='pre'),2),round(avg(score) filter(where stage='post'),2)
    into pre_n,post_n,pre_avg,post_avg from public.cw_transfer_checks where game_id=gid;
  select jsonb_agg(jsonb_build_object(
    'id',t.id,'name',t.name,'help_cost',t.help_cost,
    'online',(select count(*) from public.cw_players p where p.team_id=t.id and p.active and not p.is_bot and p.last_seen_at>now()-interval '90 seconds'),
    'humans',(select count(*) from public.cw_players p where p.team_id=t.id and p.active and not p.is_bot),
    'bots',(select count(*) from public.cw_players p where p.team_id=t.id and p.active and p.is_bot),
    'contributions',(select count(*) from public.cw_role_contributions rc where rc.game_id=gid and rc.team_id=t.id and rc.round_number=g.current_round),
    'core_coverage',(
      select count(*) from (
        select distinct rc.role_code as role
        from public.cw_role_contributions rc
        where rc.game_id=gid and rc.team_id=t.id and rc.round_number=g.current_round
          and (rc.role_code in ('business','data','context','integrator') or (legacy_topology and rc.role_code='risk'))
        union
        select 'integrator'
        where not legacy_topology and exists(
          select 1 from public.cw_role_contributions rc
          where rc.game_id=gid and rc.team_id=t.id and rc.round_number=g.current_round and rc.role_code='data'
            and jsonb_typeof(rc.evidence#>'{details,coverage,integrator}')='object'
        )
      ) coverage_roles
    ),
    'legacy_topology',legacy_topology,
    'locked',exists(select 1 from public.cw_decisions d where d.team_id=t.id and d.round_number=g.current_round),
    'observed_conversion',case when g.current_round=1 and g.status in ('closed','reveal','teaching','microcheck','finished') then (select round(100*avg(c.p1),1) from public.cw_decisions d cross join lateral jsonb_array_elements_text(d.payload->'selected') s(customer_id) join public.cw_ground_truth_customers c on c.customer_id=s.customer_id where d.team_id=t.id and d.round_number=1) end,
    'score',jsonb_build_object('impact',t.score_impact,'evidence',t.score_evidence,'design',t.score_design,'risk',t.score_risk,'adaptation',t.score_adaptation),
    'check_correct',(select count(*) from public.cw_microchecks m join public.cw_players p on p.id=m.player_id where p.team_id=t.id and m.round_number=g.current_round and m.correct)
  ) order by t.position) into teams_json from public.cw_teams t where t.game_id=gid;
  select coalesce(jsonb_agg(jsonb_build_object('at',created_at,'type',event_type,'message',payload) order by created_at desc),'[]'::jsonb) into events_json from (select * from public.cw_events where game_id=gid order by created_at desc limit 80) e;
  return jsonb_build_object('server_time',now(),'game',jsonb_build_object('id',g.id,'code',g.code,'phase',g.status,'round',g.current_round,'closes_at',g.closes_at,'paused_remaining_seconds',g.paused_remaining_seconds,'public_message',g.public_message,'rank_mode',rank_mode,'player_count',total_players,'human_count',humans,'bot_count',bots,'core_target',core_target,'team_target',team_target,'legacy_topology',legacy_topology),'teams',coalesce(teams_json,'[]'::jsonb),'transfer',jsonb_build_object('pre_completed',coalesce(pre_n,0),'post_completed',coalesce(post_n,0),'pre_avg',pre_avg,'post_avg',post_avg,'delta',case when pre_avg is null or post_avg is null then null else post_avg-pre_avg end),'audit',events_json);
end $$;

revoke all on function public.cw_facilitator_state(text) from public,anon,authenticated;
grant execute on function public.cw_facilitator_state(text) to service_role;
