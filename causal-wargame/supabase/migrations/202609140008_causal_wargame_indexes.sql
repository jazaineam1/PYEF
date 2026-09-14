create index if not exists cw_players_team_idx on public.cw_players(team_id);
create index if not exists cw_players_game_seen_idx on public.cw_players(game_id,active,last_seen_at desc);
create index if not exists cw_player_sessions_player_idx on public.cw_player_sessions(player_id);
create index if not exists cw_facilitator_sessions_game_idx on public.cw_facilitator_sessions(game_id);
create index if not exists cw_decisions_team_idx on public.cw_decisions(team_id);
create index if not exists cw_decisions_submitted_by_idx on public.cw_decisions(submitted_by);
create index if not exists cw_microchecks_player_idx on public.cw_microchecks(player_id);
create index if not exists cw_events_game_created_idx on public.cw_events(game_id,created_at desc);
