-- Keep solo-rehearsal bots on the same deterministic payload schema as human teams.
create or replace function public.cw_generate_bot_decisions(p_game_id uuid,p_round int)
returns int language plpgsql security invoker set search_path=public as $$
declare
  t record; submitter uuid; payload jsonb; inserted_count int:=0;
begin
  for t in
    select tm.id,tm.position
    from public.cw_teams tm
    where tm.game_id=p_game_id
      and exists(select 1 from public.cw_players p where p.team_id=tm.id and p.active and p.is_bot)
      and not exists(select 1 from public.cw_players p where p.team_id=tm.id and p.active and not p.is_bot)
      and not exists(select 1 from public.cw_decisions d where d.game_id=p_game_id and d.team_id=tm.id and d.round_number=p_round)
    order by tm.position
  loop
    select p.id into submitter from public.cw_players p
    where p.team_id=t.id and p.active and p.is_bot
    order by case when p.role_code='integrator' then 0 else 1 end,p.joined_at limit 1;

    if p_round=1 then
      if t.position=1 then
        select jsonb_build_object('selected',jsonb_agg(customer_id order by predictive_score desc)) into payload
        from (select customer_id,predictive_score from public.cw_ground_truth_customers order by predictive_score desc limit 10) q;
      elsif t.position=2 then
        select jsonb_build_object('selected',jsonb_agg(customer_id order by effect desc)) into payload
        from (select customer_id,(p1-p0) effect from public.cw_ground_truth_customers order by (p1-p0) desc limit 10) q;
      elsif t.position=3 then
        select jsonb_build_object('selected',jsonb_agg(customer_id order by blend desc)) into payload
        from (select customer_id,(predictive_score+(p1-p0)) blend from public.cw_ground_truth_customers order by (predictive_score+(p1-p0)) desc limit 10) q;
      else
        select jsonb_build_object('selected',jsonb_agg(customer_id order by predictive_score asc)) into payload
        from (select customer_id,predictive_score from public.cw_ground_truth_customers order by predictive_score asc limit 10) q;
      end if;
    elsif p_round=2 then
      payload:=case t.position
        when 1 then jsonb_build_object('recommendation','cancel','confounder','edad','reason_code','model_quality')
        when 2 then jsonb_build_object('recommendation','redesign','confounder','mora_previa','reason_code','baseline_difference')
        when 3 then jsonb_build_object('recommendation','keep','confounder','mora_previa','reason_code','baseline_difference')
        else jsonb_build_object('recommendation','redesign','confounder','nombre','reason_code','baseline_difference') end;
    elsif p_round=3 then
      payload:=case t.position
        when 1 then jsonb_build_object('assignment','advisor','outcome','click','horizon',1)
        when 2 then jsonb_build_object('assignment','random','outcome','pago_30d','horizon',30)
        when 3 then jsonb_build_object('assignment','model','outcome','pago_30d','horizon',30)
        else jsonb_build_object('assignment','random','outcome','click','horizon',1) end;
    elsif p_round=4 then
      payload:=case t.position
        when 1 then jsonb_build_object('treat',jsonb_build_array('digital','middle'),'avoid',jsonb_build_array('arrears'),'observe',jsonb_build_array('traditional','wealth'))
        when 2 then jsonb_build_object('treat',jsonb_build_array('digital','traditional'),'avoid',jsonb_build_array('arrears'),'observe',jsonb_build_array('middle','wealth'))
        when 3 then jsonb_build_object('treat',jsonb_build_array('middle','wealth'),'avoid',jsonb_build_array('arrears'),'observe',jsonb_build_array('digital','traditional'))
        else jsonb_build_object('treat',jsonb_build_array('digital','middle','arrears'),'avoid',jsonb_build_array('traditional'),'observe',jsonb_build_array('wealth')) end;
    else
      continue;
    end if;

    insert into public.cw_decisions(game_id,round_number,team_id,submitted_by,payload,idempotency_key)
    values(p_game_id,p_round,t.id,submitter,payload,'bot-'||p_game_id::text||'-'||p_round::text||'-'||t.id::text)
    on conflict(game_id,round_number,team_id) do nothing;
    if found then
      inserted_count:=inserted_count+1;
      insert into public.cw_events(game_id,actor,event_type,payload)
      values(p_game_id,'bot','bot_decision_locked',jsonb_build_object('round',p_round,'team_id',t.id));
    end if;
  end loop;
  return inserted_count;
end $$;

grant execute on function public.cw_generate_bot_decisions(uuid,int) to service_role;
