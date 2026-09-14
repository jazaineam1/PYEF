-- V5 readiness: registro previo por participante, visible sólo al facilitador.
create table if not exists public.cw_readiness_checks (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.cw_games(id) on delete cascade,
  display_name text not null,
  os text not null default 'Otro',
  browser text not null default 'Otro',
  browser_version text not null default '',
  overall_status text not null check (overall_status in ('ok','warn','bad')),
  screen_width integer,
  latency_ms integer,
  details jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(game_id,display_name)
);

alter table public.cw_readiness_checks enable row level security;
create index if not exists cw_readiness_game_idx on public.cw_readiness_checks(game_id,updated_at desc);

create or replace function public.cw_submit_readiness(p_code text,p_display_name text,p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  g public.cw_games;
  nm text:=trim(coalesce(p_display_name,''));
  st text:=coalesce(p_payload->>'overall_status','');
  total_n int; ok_n int; warn_n int; bad_n int;
begin
  select * into g from public.cw_games where upper(code)=upper(trim(p_code)) limit 1;
  if g.id is null then raise exception 'Código de partida inválido'; end if;
  if length(nm)<2 or length(nm)>80 then raise exception 'Nombre inválido'; end if;
  if st not in ('ok','warn','bad') then raise exception 'Estado de readiness inválido'; end if;

  insert into public.cw_readiness_checks(game_id,display_name,os,browser,browser_version,overall_status,screen_width,latency_ms,details,submitted_at,updated_at)
  values(g.id,nm,coalesce(p_payload->>'os','Otro'),coalesce(p_payload->>'browser','Otro'),coalesce(p_payload->>'browser_version',''),st,
    nullif(p_payload->>'screen_width','')::int,nullif(p_payload->>'latency_ms','')::int,coalesce(p_payload->'details','{}'::jsonb),now(),now())
  on conflict(game_id,display_name) do update set
    os=excluded.os,browser=excluded.browser,browser_version=excluded.browser_version,overall_status=excluded.overall_status,
    screen_width=excluded.screen_width,latency_ms=excluded.latency_ms,details=excluded.details,updated_at=now();

  select count(*)::int,count(*) filter(where overall_status='ok')::int,count(*) filter(where overall_status='warn')::int,count(*) filter(where overall_status='bad')::int
  into total_n,ok_n,warn_n,bad_n from public.cw_readiness_checks where game_id=g.id;
  return jsonb_build_object('saved',true,'total',total_n,'ok',ok_n,'warn',warn_n,'bad',bad_n);
end $function$;

create or replace function public.cw_readiness_state(p_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  gid uuid;
  rows jsonb;
  total_n int; ok_n int; warn_n int; bad_n int;
begin
  gid:=public.cw_validate_facilitator_token(p_token);
  if gid is null then raise exception 'Sesión inválida'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'name',display_name,'os',os,'browser',browser,'version',browser_version,'status',overall_status,
    'width',screen_width,'latency_ms',latency_ms,'updated_at',updated_at,'details',details
  ) order by updated_at desc),'[]'::jsonb) into rows from public.cw_readiness_checks where game_id=gid;
  select count(*)::int,count(*) filter(where overall_status='ok')::int,count(*) filter(where overall_status='warn')::int,count(*) filter(where overall_status='bad')::int
  into total_n,ok_n,warn_n,bad_n from public.cw_readiness_checks where game_id=gid;
  return jsonb_build_object('total',total_n,'ok',ok_n,'warn',warn_n,'bad',bad_n,'target',20,'participants',rows);
end $function$;

revoke all on public.cw_readiness_checks from anon,authenticated;
grant execute on function public.cw_submit_readiness(text,text,jsonb) to service_role;
grant execute on function public.cw_readiness_state(text) to service_role;
