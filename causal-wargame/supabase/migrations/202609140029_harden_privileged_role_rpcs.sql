-- Security hardening discovered during V8 advisor review.
-- Browser traffic reaches these RPCs through authenticated Edge Functions using service_role.
-- Do not expose SECURITY DEFINER functions directly to anon/authenticated.

revoke all on function public.cw_readiness_report(text) from public,anon,authenticated;
grant execute on function public.cw_readiness_report(text) to service_role;

revoke all on function public.cw_role_team_state(text) from public,anon,authenticated;
grant execute on function public.cw_role_team_state(text) to service_role;

revoke all on function public.cw_submit_readiness(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.cw_submit_readiness(text,text,jsonb) to service_role;

revoke all on function public.cw_submit_role_contribution(text,integer,text) from public,anon,authenticated;
grant execute on function public.cw_submit_role_contribution(text,integer,text) to service_role;

revoke all on function public.cw_submit_role_contribution_v2(text,integer,text,jsonb) from public,anon,authenticated;
grant execute on function public.cw_submit_role_contribution_v2(text,integer,text,jsonb) to service_role;
