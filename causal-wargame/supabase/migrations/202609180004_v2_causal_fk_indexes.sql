-- V2 FK support indexes after causal learning tables
create index if not exists cw_v2_individual_team_fk_idx on public.cw_v2_individual_submissions(team_id);
create index if not exists cw_v2_individual_player_fk_idx on public.cw_v2_individual_submissions(player_id);
create index if not exists cw_v2_team_decisions_team_fk_idx on public.cw_v2_team_decisions(team_id);
create index if not exists cw_v2_team_decisions_submitter_fk_idx on public.cw_v2_team_decisions(submitted_by);
create index if not exists cw_v2_revisions_team_fk_idx on public.cw_v2_revisions(team_id);
create index if not exists cw_v2_revisions_player_fk_idx on public.cw_v2_revisions(player_id);
create index if not exists cw_v2_learning_events_team_fk_idx on public.cw_v2_learning_events(team_id);
create index if not exists cw_v2_learning_events_player_fk_idx on public.cw_v2_learning_events(player_id);
