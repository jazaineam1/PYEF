-- State payloads for adaptive 4-role topology.
-- Hidden pre-created team rows (positions above team_target) never reach the UI.

create or replace function public.cw_game_state(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare
  p public.cw_players;
  g public.cw_games;
  card text;
  teams_json jsonb;
  locked boolean:=false;
  d jsonb;
  result_json jsonb;
  customers jsonb;
  reveal_payload jsonb;
  segments_json jsonb;
  policy_json jsonb;
  transfer_json jsonb;
  roster_json jsonb;
  legacy_topology boolean:=false;
  effective_teams int;
  effective_core int;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida o expirada'; end if;
  perform public.cw_auto_close_round(p.game_id);
  update public.cw_players set last_seen_at=now() where id=p.id;
  select * into g from public.cw_games where id=p.game_id;

  select exists(select 1 from public.cw_players x where x.game_id=g.id and x.active and x.role_code='risk') into legacy_topology;
  effective_teams:=case when legacy_topology then 4 else g.team_target end;
  effective_core:=case when legacy_topology then 5 else 4 end;

  select content into card from public.cw_role_cards where round_number=g.current_round and role_code=p.role_code;

  select jsonb_agg(jsonb_build_object(
    'id',t.id,'name',t.name,'help_cost',t.help_cost,
    'score',jsonb_build_object('impact',t.score_impact,'evidence',t.score_evidence,'design',t.score_design,'risk',t.score_risk,'adaptation',t.score_adaptation),
    'locked',exists(select 1 from public.cw_decisions x where x.team_id=t.id and x.round_number=g.current_round)
  ) order by t.position)
  into teams_json
  from public.cw_teams t
  where t.game_id=g.id and t.position<=effective_teams;

  select jsonb_agg(jsonb_build_object('id',q.id,'display_name',q.display_name,'role_code',q.role_code,'is_bot',q.is_bot)
    order by case q.role_code when 'business' then 1 when 'data' then 2 when 'context' then 3 when 'integrator' then 4 when 'risk' then 5 else 9 end,q.display_name)
  into roster_json
  from public.cw_players q
  where q.game_id=p.game_id and q.team_id=p.team_id and q.active=true;

  select payload,result,true into d,result_json,locked
  from public.cw_decisions
  where game_id=g.id and team_id=p.team_id and round_number=g.current_round;

  if g.current_round=1 then
    select public.cw_public_customers() into customers;
    if g.status in ('reveal','teaching','microcheck','finished') and d is not null then
      select jsonb_agg(jsonb_build_object(
        'id',c.customer_id,'name',c.name,'segment',c.segment,'score',c.predictive_score,
        'p0',c.p0,'p1',c.p1,'effect',c.p1-c.p0
      ) order by c.predictive_score desc)
      into reveal_payload
      from public.cw_ground_truth_customers c
      where c.customer_id in (select jsonb_array_elements_text(d->'selected'));
    end if;
  end if;

  if g.current_round=4 then
    select jsonb_agg(jsonb_build_object(
      'id',segment_id,'name',name,'effect',effect_pp,'ci_low',ci_low_pp,'ci_high',ci_high_pp,
      'risk',risk,'audience',audience,'unit_cost',unit_cost,'value_per_result',value_per_result
    ) order by effect_pp desc)
    into segments_json from public.cw_ground_truth_segments;
    select value into policy_json from public.cw_scenario_parameters where key='round4_policy';
  end if;

  select public.cw_transfer_status(p_token) into transfer_json;

  return jsonb_build_object(
    'server_time',now(),
    'game',jsonb_build_object(
      'id',g.id,'code',g.code,'title',g.title,'phase',g.status,'round',g.current_round,
      'closes_at',g.closes_at,'public_message',g.public_message,
      'team_target',effective_teams,'core_target',effective_core,
      'roster_locked',case when legacy_topology then true else g.roster_locked end,
      'max_humans',case when legacy_topology then 20 else g.max_humans end,
      'legacy_topology',legacy_topology
    ),
    'player',jsonb_build_object('id',p.id,'team_id',p.team_id,'display_name',p.display_name,'role_code',p.role_code),
    'team_roster',coalesce(roster_json,'[]'::jsonb),
    'role_card',card,
    'teams',coalesce(teams_json,'[]'::jsonb),
    'decision',d,'result',result_json,'locked',locked,
    'customers',customers,'reveal_payload',reveal_payload,'segments',segments_json,'policy',policy_json,'transfer',transfer_json
  );
end $$;

create or replace function public.cw_facilitator_state(p_token text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare
  gid uuid;
  g public.cw_games;
  teams_json jsonb;
  events_json jsonb;
  rank_mode text;
  total_players int;
  humans int;
  bots int;
  online_humans int;
  pre_n int;
  post_n int;
  pre_avg numeric;
  post_avg numeric;
  legacy_topology boolean:=false;
  effective_teams int;
  effective_core int;
begin
  gid:=public.cw_validate_facilitator_token(p_token);
  if gid is null then raise exception 'Sesión inválida'; end if;
  perform public.cw_auto_close_round(gid);
  select * into g from public.cw_games where id=gid;

  select exists(select 1 from public.cw_players where game_id=gid and active and role_code='risk') into legacy_topology;
  effective_teams:=case when legacy_topology then 4 else g.team_target end;
  effective_core:=case when legacy_topology then 5 else 4 end;

  select count(*),
         count(*) filter(where not is_bot),
         count(*) filter(where is_bot),
         count(*) filter(where not is_bot and last_seen_at>now()-interval '90 seconds')
  into total_players,humans,bots,online_humans
  from public.cw_players where game_id=gid and active;

  rank_mode:=case when g.current_round=1 and g.status='closed' then 'observed' else 'causal' end;

  select count(*) filter(where stage='pre'),count(*) filter(where stage='post'),
         round(avg(score) filter(where stage='pre'),2),round(avg(score) filter(where stage='post'),2)
  into pre_n,post_n,pre_avg,post_avg
  from public.cw_transfer_checks where game_id=gid;

  select jsonb_agg(jsonb_build_object(
    'id',t.id,'name',t.name,'position',t.position,'help_cost',t.help_cost,
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
    'locked',exists(select 1 from public.cw_decisions d where d.team_id=t.id and d.round_number=g.current_round),
    'observed_conversion',case
      when g.current_round=1 and g.status in ('closed','reveal','teaching','microcheck','finished') then
        (select round(100*avg(c.p1),1)
         from public.cw_decisions d
         cross join lateral jsonb_array_elements_text(d.payload->'selected') s(customer_id)
         join public.cw_ground_truth_customers c on c.customer_id=s.customer_id
         where d.team_id=t.id and d.round_number=1)
      end,
    'score',jsonb_build_object('impact',t.score_impact,'evidence',t.score_evidence,'design',t.score_design,'risk',t.score_risk,'adaptation',t.score_adaptation),
    'check_correct',(select count(*) from public.cw_microchecks m join public.cw_players p on p.id=m.player_id where p.team_id=t.id and m.round_number=g.current_round and m.correct)
  ) order by t.position)
  into teams_json
  from public.cw_teams t
  where t.game_id=gid and t.position<=effective_teams;

  select coalesce(jsonb_agg(jsonb_build_object('at',created_at,'type',event_type,'message',payload) order by created_at desc),'[]'::jsonb)
  into events_json
  from (select * from public.cw_events where game_id=gid order by created_at desc limit 80) e;

  return jsonb_build_object(
    'server_time',now(),
    'game',jsonb_build_object(
      'id',g.id,'code',g.code,'phase',g.status,'round',g.current_round,'closes_at',g.closes_at,
      'paused_remaining_seconds',g.paused_remaining_seconds,'public_message',g.public_message,'rank_mode',rank_mode,
      'player_count',total_players,'human_count',humans,'bot_count',bots,'online_humans',online_humans,
      'core_target',effective_core,'team_target',effective_teams,
      'roster_locked',case when legacy_topology then true else g.roster_locked end,
      'max_humans',case when legacy_topology then 20 else g.max_humans end,
      'legacy_topology',legacy_topology
    ),
    'teams',coalesce(teams_json,'[]'::jsonb),
    'transfer',jsonb_build_object(
      'pre_completed',coalesce(pre_n,0),'post_completed',coalesce(post_n,0),
      'pre_avg',pre_avg,'post_avg',post_avg,
      'delta',case when pre_avg is null or post_avg is null then null else post_avg-pre_avg end
    ),
    'audit',events_json
  );
end $$;

create or replace function public.cw_wall_state(p_code text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare
  g public.cw_games;
  teams_json jsonb;
  rank_mode text;
  pre_n int;
  post_n int;
  pre_avg numeric;
  post_avg numeric;
  legacy_topology boolean:=false;
  effective_teams int;
  effective_core int;
begin
  select * into g from public.cw_games where code=upper(trim(p_code));
  if g.id is null then raise exception 'Partida no encontrada'; end if;
  perform public.cw_auto_close_round(g.id);
  select * into g from public.cw_games where id=g.id;

  select exists(select 1 from public.cw_players where game_id=g.id and active and role_code='risk') into legacy_topology;
  effective_teams:=case when legacy_topology then 4 else g.team_target end;
  effective_core:=case when legacy_topology then 5 else 4 end;
  rank_mode:=case when g.current_round=1 and g.status='closed' then 'observed' else 'causal' end;

  select count(*) filter(where stage='pre'),count(*) filter(where stage='post'),
         round(avg(score) filter(where stage='pre'),2),round(avg(score) filter(where stage='post'),2)
  into pre_n,post_n,pre_avg,post_avg
  from public.cw_transfer_checks where game_id=g.id;

  select jsonb_agg(jsonb_build_object(
    'id',t.id,'name',t.name,'position',t.position,'help_cost',t.help_cost,
    'observed_conversion',case
      when g.current_round=1 and g.status in ('closed','reveal','teaching','microcheck','finished') then
        (select round(100*avg(c.p1),1)
         from public.cw_decisions d
         cross join lateral jsonb_array_elements_text(d.payload->'selected') s(customer_id)
         join public.cw_ground_truth_customers c on c.customer_id=s.customer_id
         where d.team_id=t.id and d.round_number=1)
      end,
    'score',jsonb_build_object('impact',t.score_impact,'evidence',t.score_evidence,'design',t.score_design,'risk',t.score_risk,'adaptation',t.score_adaptation)
  ) order by t.position)
  into teams_json
  from public.cw_teams t
  where t.game_id=g.id and t.position<=effective_teams;

  return jsonb_build_object(
    'server_time',now(),
    'game',jsonb_build_object(
      'code',g.code,'phase',g.status,'round',g.current_round,'closes_at',g.closes_at,
      'public_message',g.public_message,'rank_mode',rank_mode,
      'team_target',effective_teams,'core_target',effective_core,
      'roster_locked',case when legacy_topology then true else g.roster_locked end,
      'max_humans',case when legacy_topology then 20 else g.max_humans end,
      'legacy_topology',legacy_topology
    ),
    'teams',coalesce(teams_json,'[]'::jsonb),
    'transfer',jsonb_build_object(
      'pre_completed',coalesce(pre_n,0),'post_completed',coalesce(post_n,0),
      'pre_avg',pre_avg,'post_avg',post_avg,
      'delta',case when pre_avg is null or post_avg is null then null else post_avg-pre_avg end
    )
  );
end $$;

revoke all on function public.cw_game_state(text) from public,anon,authenticated;
revoke all on function public.cw_facilitator_state(text) from public,anon,authenticated;
revoke all on function public.cw_wall_state(text) from public,anon,authenticated;
grant execute on function public.cw_game_state(text) to service_role;
grant execute on function public.cw_facilitator_state(text) to service_role;
grant execute on function public.cw_wall_state(text) to service_role;
