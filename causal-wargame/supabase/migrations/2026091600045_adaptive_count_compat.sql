-- PostgreSQL count(*) returns bigint. Keep an exact overload so migration-time
-- calls and future aggregate-based calls resolve without relying on implicit casts.
create or replace function public.cw_recommended_team_count(p_humans bigint)
returns int language sql immutable set search_path=public as $$
  select case
    when coalesce(p_humans,0)=0 then 4
    else least(7,greatest(1,ceil(coalesce(p_humans,0)/4.0)::int))
  end
$$;

revoke all on function public.cw_recommended_team_count(bigint) from public,anon,authenticated;
grant execute on function public.cw_recommended_team_count(bigint) to service_role;
