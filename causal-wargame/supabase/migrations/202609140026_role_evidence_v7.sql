-- V7: role tools produce a compact evidence packet that teammates can read.
alter table public.cw_role_contributions
  add column if not exists evidence jsonb not null default '{}'::jsonb;

create or replace function public.cw_submit_role_contribution_v2(
  p_token text,
  p_round integer,
  p_finding_code text,
  p_evidence jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  p public.cw_players;
  g public.cw_games;
  rid uuid;
  ev jsonb:=coalesce(p_evidence,'{}'::jsonb);
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;
  if g.status<>'round' then raise exception 'Los hallazgos se comparten durante el laboratorio'; end if;
  if p_round<>g.current_round then raise exception 'Ronda inválida'; end if;
  if p_finding_code is null or p_finding_code !~ '^[a-z0-9_]{2,60}$' then raise exception 'Hallazgo inválido'; end if;
  if jsonb_typeof(ev)<>'object' then raise exception 'Evidencia inválida'; end if;
  if pg_column_size(ev)>8192 then raise exception 'La evidencia excede el tamaño permitido'; end if;

  insert into public.cw_role_contributions(
    game_id,team_id,player_id,round_number,role_code,finding_code,evidence
  ) values(
    p.game_id,p.team_id,p.id,p_round,p.role_code,p_finding_code,ev
  )
  on conflict(game_id,round_number,player_id) do update
    set finding_code=excluded.finding_code,
        evidence=excluded.evidence,
        created_at=now()
  returning id into rid;

  return jsonb_build_object('ok',true,'id',rid);
end $$;

create or replace function public.cw_role_team_state(p_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  p public.cw_players;
  g public.cw_games;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;

  return jsonb_build_object(
    'round',g.current_round,
    'team_id',p.team_id,
    'count',(
      select count(*)
      from public.cw_role_contributions
      where game_id=p.game_id
        and team_id=p.team_id
        and round_number=g.current_round
    ),
    'rows',coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'player_id',c.player_id,
          'name',pl.display_name,
          'role_code',c.role_code,
          'finding_code',c.finding_code,
          'evidence',c.evidence,
          'at',c.created_at
        ) order by c.created_at
      )
      from public.cw_role_contributions c
      join public.cw_players pl on pl.id=c.player_id
      where c.game_id=p.game_id
        and c.team_id=p.team_id
        and c.round_number=g.current_round
    ),'[]'::jsonb)
  );
end $$;

grant execute on function public.cw_submit_role_contribution_v2(text,integer,text,jsonb) to service_role;
grant execute on function public.cw_role_team_state(text) to service_role;
