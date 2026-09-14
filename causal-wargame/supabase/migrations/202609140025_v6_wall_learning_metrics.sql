create or replace function public.cw_wall_state(p_code text)
returns jsonb language plpgsql security invoker set search_path=public as $$
declare g public.cw_games; teams_json jsonb; rank_mode text; pre_n int; post_n int; pre_avg numeric; post_avg numeric;
begin
  select * into g from public.cw_games where code=upper(trim(p_code)); if g.id is null then raise exception 'Partida no encontrada'; end if;
  perform public.cw_auto_close_round(g.id); select * into g from public.cw_games where id=g.id;
  rank_mode:=case when g.current_round=1 and g.status='closed' then 'observed' else 'causal' end;
  select count(*) filter(where stage='pre'),count(*) filter(where stage='post'),round(avg(score) filter(where stage='pre'),2),round(avg(score) filter(where stage='post'),2)
    into pre_n,post_n,pre_avg,post_avg from public.cw_transfer_checks where game_id=g.id;
  select jsonb_agg(jsonb_build_object('id',t.id,'name',t.name,'help_cost',t.help_cost,'observed_conversion',case when g.current_round=1 and g.status in ('closed','reveal','teaching','microcheck','finished') then (select round(100*avg(c.p1),1) from public.cw_decisions d cross join lateral jsonb_array_elements_text(d.payload->'selected') s(customer_id) join public.cw_ground_truth_customers c on c.customer_id=s.customer_id where d.team_id=t.id and d.round_number=1) end,'score',jsonb_build_object('impact',t.score_impact,'evidence',t.score_evidence,'design',t.score_design,'risk',t.score_risk,'adaptation',t.score_adaptation))) into teams_json from public.cw_teams t where t.game_id=g.id;
  return jsonb_build_object('server_time',now(),'game',jsonb_build_object('code',g.code,'phase',g.status,'round',g.current_round,'closes_at',g.closes_at,'public_message',g.public_message,'rank_mode',rank_mode),'teams',coalesce(teams_json,'[]'::jsonb),'transfer',jsonb_build_object('pre_completed',coalesce(pre_n,0),'post_completed',coalesce(post_n,0),'pre_avg',pre_avg,'post_avg',post_avg,'delta',case when pre_avg is null or post_avg is null then null else post_avg-pre_avg end));
end $$;
grant execute on function public.cw_wall_state(text) to service_role;
