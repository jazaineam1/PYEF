-- V2 academic causal truth: computed from the exact experimental outcome generator.
create or replace function public.cw_v2_academic_truth(p_round integer)
returns jsonb language plpgsql stable set search_path=public as $campus$
declare answer jsonb;
begin
  if p_round in (3,4) then return jsonb_build_object('kind','observational',
    'true_effect_points',4.8,'source','synthetic_observational_dgp'); end if;
  if p_round not in (2,5,6) then return jsonb_build_object('kind','none'); end if;
  with raw as (
    select e.row_id,e.segment_id,e.treated,
      (15+4*(e.tenure_months/100.0)+.75*e.usage_score
      +.45*(4+((e.row_id*3)%5))-.65*(1+((e.row_id*5)%8))
      -.45*(4+((e.row_id*7)%6))+(((e.row_id*17)%7)-3))::numeric baseline,
      (case e.segment_id when 'digital' then 10.4 when 'middle' then 7.8
        when 'traditional' then 3.1 when 'wealth' then 1.2 else -1.5 end)::numeric tau
    from public.cw_v2_experiment e
  ), pot as (
    select *,round(least(50::numeric,greatest(0::numeric,baseline)),1) y0,
      round(least(50::numeric,greatest(0::numeric,baseline+tau)),1) y1 from raw
  ), facts as (
    select *,case when treated then y1 else y0 end y from pot
  ), result as (
    select count(*) n,avg(y1-y0) true_ate,
      avg(y) filter(where treated)-avg(y) filter(where not treated) observed_ate,
      sqrt((var_samp(y) filter(where treated))/(count(*) filter(where treated))
        +(var_samp(y) filter(where not treated))/(count(*) filter(where not treated))) se
    from facts
  ), seg as (
    select segment_id,count(*) n,round(avg(y1-y0),3) cate from facts group by segment_id
  )
  select jsonb_build_object('kind','randomized',
    'source','synthetic_potential_outcomes_v2','n',result.n,
    'true_effect_points',round(result.true_ate,3),
    'estimated_effect_points',round(result.observed_ate,3),
    'ci95_low',round((result.observed_ate-1.96*result.se)::numeric,3),
    'ci95_high',round((result.observed_ate+1.96*result.se)::numeric,3),
    'segments',(select jsonb_agg(jsonb_build_object('segment',segment_id,'n',n,'cate',cate) order by segment_id) from seg)
  ) into answer from result;
  return answer;
end $campus$;
revoke all on function public.cw_v2_academic_truth(integer) from public,anon,authenticated;
grant execute on function public.cw_v2_academic_truth(integer) to service_role;
