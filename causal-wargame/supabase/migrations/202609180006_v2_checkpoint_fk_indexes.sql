-- V2.3 · covering indexes for checkpoint-score foreign keys
create index if not exists cw_v2_checkpoint_player_fk_idx
  on public.cw_v2_checkpoint_scores(player_id);

create index if not exists cw_v2_checkpoint_team_fk_idx
  on public.cw_v2_checkpoint_scores(team_id);
