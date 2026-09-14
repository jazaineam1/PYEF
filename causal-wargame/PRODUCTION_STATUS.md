# DOS FUTUROS — Production status

Backend project: `nedsrnqwvxtelddmtvtv` (Supabase, `sa-east-1`).

## Production guarantees

- Browser-only client; no local installs.
- Secure build never bundles scenario ground truth.
- All game state and scoring are server-side.
- 20-player cap with 4 teams × 5 distinct roles.
- Server-side round deadlines and automatic close.
- Pause/resume preserves remaining time.
- Team decision is irreversible after lock; duplicate retries are idempotent.
- Player token survives browser refresh/reopen on the same browser profile.
- Facilitator reset clears players, decisions, microchecks and scores without deleting the scenario.
- Polling works without WebSockets.
- CI includes unit/build checks plus a live Supabase smoke test with 20 concurrent joins and a 50-client burst.

## Last production validation

GitHub Actions run `34803056209` completed successfully on 2026-09-14. It verified unit tests, demo and secure builds, absence of private ground truth in the secure bundle, 20 concurrent participant joins, the 20-player cap, team/role allocation, round opening, decision locking/idempotency, reveal/leaderboard, reset cleanup, and a 50-client HTTP burst. The burst completed 50/50 successful requests with `p95 = 752 ms` from the GitHub-hosted runner.

## Public pages

- `dos-futuros/index.html`
- `dos-futuros/play.html`
- `dos-futuros/facilitator.html`
- `dos-futuros/wall.html`
- `dos-futuros/system-check.html`

Production credentials are deliberately not committed.
