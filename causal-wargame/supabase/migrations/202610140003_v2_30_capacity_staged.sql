-- V2-only capacity expansion to 30 while V1 retains its existing default of 28.
-- Requires original adaptive attendance schema, applied after 202610140002.
-- Rollout gate: apply only to isolated QA first; do not alter running FUTUROS.
ALTER TABLE public.cw_games DROP CONSTRAINT IF EXISTS cw_games_max_humans_check;
ALTER TABLE public.cw_games ADD CONSTRAINT cw_games_max_humans_check CHECK (max_humans BETWEEN 1 AND 30);
ALTER TABLE public.cw_games DROP CONSTRAINT IF EXISTS cw_games_team_target_check;
ALTER TABLE public.cw_games ADD CONSTRAINT cw_games_team_target_check CHECK (team_target BETWEEN 1 AND 8);
ALTER TABLE public.cw_teams DROP CONSTRAINT IF EXISTS cw_teams_position_check;
ALTER TABLE public.cw_teams ADD CONSTRAINT cw_teams_position_check CHECK (position BETWEEN 1 AND 8);
-- Keep DEFAULT max_humans=28 for V1; V2 facilitator must explicitly enable 30.
DO $v2_capacity$
DECLARE definition text; rewritten text; target regprocedure;
BEGIN
  FOREACH target IN ARRAY ARRAY[
    'public.cw_recommended_team_count(integer)'::regprocedure,
    'public.cw_recommended_team_count(bigint)'::regprocedure
  ] LOOP
    definition:=pg_get_functiondef(target);
    rewritten:=replace(definition,'least(7','least(8');
    IF rewritten=definition THEN RAISE EXCEPTION 'Missing 7-team guard in %',target; END IF;
    EXECUTE rewritten;
  END LOOP;

  target:='public.cw_ensure_team_rows(uuid)'::regprocedure;
  definition:=pg_get_functiondef(target);
  rewritten:=replace(definition,'''Rosenbaum''','''Rosenbaum'',''Hernán''');
  rewritten:=replace(rewritten,'for i in 1..7 loop',
    'for i in 1..(case when (select max_humans from public.cw_games where id=p_game_id)>28 then 8 else 7 end) loop');
  IF rewritten=definition OR position('for i in 1..7 loop' in rewritten)>0
    THEN RAISE EXCEPTION 'Could not safely extend eight team rows'; END IF;
  EXECUTE rewritten;

  target:='public.cw_rebalance_lobby_roster(uuid)'::regprocedure;
  definition:=pg_get_functiondef(target);
  rewritten:=replace(definition,'max_humans=28','max_humans=g.max_humans');
  IF rewritten=definition THEN RAISE EXCEPTION 'Could not preserve roster capacity'; END IF;
  EXECUTE rewritten;

  target:='public.cw_join_game(text,text,text)'::regprocedure;
  definition:=pg_get_functiondef(target);
  rewritten:=replace(definition,'t.position between 1 and 7',
    't.position between 1 and (case when g.max_humans>28 then 8 else 7 end)');
  IF rewritten=definition THEN RAISE EXCEPTION 'Could not extend seat allocator'; END IF;
  EXECUTE rewritten;

  target:='public.cw_facilitator_transition(text,text,integer)'::regprocedure;
  definition:=pg_get_functiondef(target);
  rewritten:=replace(definition,'max_humans=28','max_humans=g.max_humans');
  IF rewritten=definition THEN RAISE EXCEPTION 'Could not preserve capacity on reset'; END IF;
  EXECUTE rewritten;

  target:='public.cw_v2_facilitator_action(text,text,integer)'::regprocedure;
  definition:=pg_get_functiondef(target);
  rewritten:=replace(definition,
    'if p_action=''start'' then',
    'if p_action=''capacity_30'' then
       if g.status not in (''lobby'',''briefing'') or g.roster_locked then
         raise exception ''Solo es posible preparar 30 participantes antes de iniciar'';
       end if;
       update public.cw_games set max_humans=30 where id=gid;
       perform public.cw_ensure_team_rows(gid);
       return public.cw_rebalance_lobby_roster(gid);
     elsif p_action=''start'' then');
  IF rewritten=definition THEN RAISE EXCEPTION 'Could not add V2 capacity action'; END IF;
  EXECUTE rewritten;
END $v2_capacity$;
-- QA acceptance: 30 humans => eight teams 4-4-4-4-4-4-3-3; 31st join rejected.
-- Current V1/legacy sessions retain max_humans=28, existing teams and logic.
