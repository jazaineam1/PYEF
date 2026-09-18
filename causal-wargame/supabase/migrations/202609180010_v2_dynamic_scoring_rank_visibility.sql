-- V2.10 · dynamic scoring metadata and fair public ranking visibility

create or replace function public.cw_v2_player_score_state(p_token text)
returns jsonb
language plpgsql
security invoker
set search_path=public
as $$
declare
  p public.cw_players; g public.cw_games;
  humans int; submitted int; revised int;
  lab_done boolean; check_done boolean;
  team_done boolean; phase text;
  my_total int:=0; my_round int:=0; my_rank int:=1;
  check_points int:=null; top3 jsonb:='[]'::jsonb; round_max int:=100; challenge jsonb:='{}'::jsonb; scoring jsonb:='{}'::jsonb;
  ranking_visible boolean:=false; my_tie_count int:=0; my_public_points int:=0;
  team_lab int:=0; team_check int:=0;
begin
  select * into p from public.cw_validate_player_token(p_token);
  if p.id is null then raise exception 'Sesión inválida'; end if;
  select * into g from public.cw_games where id=p.game_id;
  select (r.lab_points+r.check_points+r.revision_points+r.team_points),
         jsonb_build_object('key',r.challenge_key,'profile_round',r.profile_round,'template',r.template,'lab_key',r.lab_key),
         jsonb_build_object('lab',r.lab_points,'check',r.check_points,'revision',r.revision_points,'team',r.team_points)
  into round_max,challenge,scoring
  from public.cw_v2_challenge_runtime r
  where r.round_number=g.current_round and r.enabled;
  round_max:=coalesce(round_max,100);

  select count(*) into humans from public.cw_players
  where game_id=p.game_id and team_id=p.team_id and active and not is_bot;
  select count(*) into submitted from public.cw_v2_individual_submissions
  where game_id=p.game_id and team_id=p.team_id and round_number=g.current_round;
  select count(*) into revised from public.cw_v2_revisions
  where game_id=p.game_id and team_id=p.team_id and round_number=g.current_round;
  select count(distinct player_id) into team_lab from public.cw_v2_checkpoint_scores
  where game_id=p.game_id and team_id=p.team_id and round_number=g.current_round and checkpoint='lab';
  select count(distinct player_id) into team_check from public.cw_v2_checkpoint_scores
  where game_id=p.game_id and team_id=p.team_id and round_number=g.current_round and checkpoint='check';

  lab_done:=exists(select 1 from public.cw_v2_checkpoint_scores s where s.game_id=p.game_id and s.round_number=g.current_round and s.player_id=p.id and s.checkpoint='lab');
  check_done:=exists(select 1 from public.cw_v2_checkpoint_scores s where s.game_id=p.game_id and s.round_number=g.current_round and s.player_id=p.id and s.checkpoint='check');
  team_done:=exists(select 1 from public.cw_v2_team_decisions d where d.game_id=p.game_id and d.team_id=p.team_id and d.round_number=g.current_round);

  select s.points into check_points from public.cw_v2_checkpoint_scores s
  where s.game_id=p.game_id and s.round_number=g.current_round and s.player_id=p.id and s.checkpoint='check';

  select coalesce(sum(points),0) into my_total from public.cw_v2_checkpoint_scores
  where game_id=p.game_id and player_id=p.id;
  select coalesce(sum(points),0) into my_round from public.cw_v2_checkpoint_scores
  where game_id=p.game_id and player_id=p.id and round_number=g.current_round;

  select exists(
    select 1 from public.cw_v2_checkpoint_scores s
    where s.game_id=p.game_id and s.visible
  ) into ranking_visible;

  with totals as (
    select pl.id,coalesce(sum(s.points) filter(where s.visible),0)::int pts
    from public.cw_players pl
    left join public.cw_v2_checkpoint_scores s on s.game_id=pl.game_id and s.player_id=pl.id
    where pl.game_id=p.game_id and pl.active and not pl.is_bot
    group by pl.id
  ), ranked as (
    select id,pts,rank() over(order by pts desc)::int rk from totals
  )
  select rk,pts into my_rank,my_public_points from ranked where id=p.id;

  select count(*) into my_tie_count
  from (
    select pl.id,coalesce(sum(s.points) filter(where s.visible),0)::int pts
    from public.cw_players pl
    left join public.cw_v2_checkpoint_scores s on s.game_id=pl.game_id and s.player_id=pl.id
    where pl.game_id=p.game_id and pl.active and not pl.is_bot
    group by pl.id
  ) q
  where q.pts=my_public_points;

  with totals as (
    select pl.id,pl.display_name,t.name team,
           coalesce(sum(s.points) filter(where s.visible),0)::int points,
           coalesce(sum(s.points) filter(where s.visible and s.round_number=g.current_round),0)::int round_points
    from public.cw_players pl
    join public.cw_teams t on t.id=pl.team_id
    left join public.cw_v2_checkpoint_scores s on s.game_id=pl.game_id and s.player_id=pl.id
    where pl.game_id=p.game_id and pl.active and not pl.is_bot
    group by pl.id,pl.display_name,t.name
  ), ranked as (
    select *,
      dense_rank() over(order by points desc)::int score_rank,
      row_number() over(order by points desc,display_name,id)::int pos
    from totals
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'rank',score_rank,'player_id',id,'name',display_name,'team',team,'points',points,'round_points',round_points
  ) order by pos),'[]'::jsonb) into top3
  from ranked where pos<=3;

  if g.status in ('reveal','teaching','microcheck','finished') then phase:='reveal';
  elsif not exists(select 1 from public.cw_v2_individual_submissions s where s.game_id=p.game_id and s.round_number=g.current_round and s.player_id=p.id) then phase:='initial';
  elsif submitted<humans then phase:='wait_initial';
  elsif not lab_done then phase:='lab';
  elsif not check_done then phase:='check';
  elsif not exists(select 1 from public.cw_v2_revisions r where r.game_id=p.game_id and r.round_number=g.current_round and r.player_id=p.id) then phase:='revision';
  elsif revised<humans then phase:='wait_revision';
  elsif not team_done then phase:='team';
  else phase:='wait_reveal';
  end if;

  return jsonb_build_object(
    'phase',phase,
    'my',jsonb_build_object(
      'points',my_total,'round_points',my_round,'round_max',round_max,'rank',coalesce(my_rank,1),
      'rank_visible',ranking_visible,'tie_count',my_tie_count,
      'lab_complete',lab_done,'check_answered',check_done,'check_points',check_points
    ),
    'team',jsonb_build_object(
      'humans',humans,'initial',submitted,'lab',team_lab,'check',team_check,'revision',revised,'team_done',team_done
    ),
    'top3',top3,
    'challenge',challenge,
    'scoring',scoring
  );
end $$;

create or replace function public.cw_v2_wall_score_state(p_game_code text)
returns jsonb
language plpgsql
security invoker
set search_path=public
as $$
declare
  g public.cw_games; top3 jsonb:='[]'::jsonb; player_scores jsonb:='[]'::jsonb;
  humans int:=0; initial_count int:=0; lab_count int:=0; check_count int:=0; revision_count int:=0; team_count int:=0;
  scoring jsonb:='{}'::jsonb; ranking_visible boolean:=false; leader_points int:=0; leader_count int:=0;
begin
  select * into g from public.cw_games where code=upper(trim(p_game_code));
  if g.id is null then raise exception 'Partida no encontrada'; end if;

  select jsonb_build_object(
    'lab',r.lab_points,'check',r.check_points,'revision',r.revision_points,'team',r.team_points,
    'max',r.lab_points+r.check_points+r.revision_points+r.team_points
  ) into scoring
  from public.cw_v2_challenge_runtime r
  where r.round_number=g.current_round and r.enabled;

  select exists(
    select 1 from public.cw_v2_checkpoint_scores s
    where s.game_id=g.id and s.visible
  ) into ranking_visible;

  select count(*) into humans from public.cw_players where game_id=g.id and active and not is_bot;
  select count(*) into initial_count from public.cw_v2_individual_submissions where game_id=g.id and round_number=g.current_round;
  select count(distinct player_id) into lab_count from public.cw_v2_checkpoint_scores where game_id=g.id and round_number=g.current_round and checkpoint='lab';
  select count(distinct player_id) into check_count from public.cw_v2_checkpoint_scores where game_id=g.id and round_number=g.current_round and checkpoint='check';
  select count(*) into revision_count from public.cw_v2_revisions where game_id=g.id and round_number=g.current_round;
  select count(*) into team_count from public.cw_v2_team_decisions where game_id=g.id and round_number=g.current_round;

  with totals as (
    select pl.id,pl.display_name,t.name team,t.position team_position,
           coalesce(sum(s.points) filter(where s.visible),0)::int points,
           coalesce(sum(s.points) filter(where s.visible and s.round_number=g.current_round),0)::int round_points
    from public.cw_players pl
    join public.cw_teams t on t.id=pl.team_id
    left join public.cw_v2_checkpoint_scores s on s.game_id=pl.game_id and s.player_id=pl.id
    where pl.game_id=g.id and pl.active and not pl.is_bot
    group by pl.id,pl.display_name,t.name,t.position
  ), ranked as (
    select *,row_number() over(order by points desc,round_points desc,team_position,id)::int pos from totals
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'rank',pos,'player_id',id,'name',display_name,'team',team,'points',points,'round_points',round_points
  ) order by pos),'[]'::jsonb) into top3
  from ranked where pos<=3;

  with totals as (
    select pl.id,pl.display_name,t.name team,
           coalesce(sum(s.points) filter(where s.visible),0)::int points,
           coalesce(sum(s.points) filter(where s.visible and s.round_number=g.current_round),0)::int round_points
    from public.cw_players pl
    join public.cw_teams t on t.id=pl.team_id
    left join public.cw_v2_checkpoint_scores s on s.game_id=pl.game_id and s.player_id=pl.id
    where pl.game_id=g.id and pl.active and not pl.is_bot
    group by pl.id,pl.display_name,t.name
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'player_id',id,'name',display_name,'team',team,'points',points,'round_points',round_points
  ) order by points desc,display_name),'[]'::jsonb) into player_scores
  from totals;

  return jsonb_build_object(
    'top3',top3,
    'ranking_visible',ranking_visible,
    'leader_points',leader_points,
    'leader_count',leader_count,
    'scoring',scoring,
    'player_scores',player_scores,
    'checkpoint',jsonb_build_object(
      'humans',humans,'initial',initial_count,'lab',lab_count,'check',check_count,'revision',revision_count,'teams_locked',team_count
    )
  );
end $$;

revoke all on function public.cw_v2_player_score_state(text) from public,anon,authenticated;
revoke all on function public.cw_v2_wall_score_state(text) from public,anon,authenticated;
grant execute on function public.cw_v2_player_score_state(text) to service_role;
grant execute on function public.cw_v2_wall_score_state(text) to service_role;
