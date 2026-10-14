import test from'node:test'
import assert from'node:assert/strict'
import{readFileSync}from'node:fs'

const scoreSql=readFileSync('supabase/migrations/202609180005_v2_scored_checkpoints.sql','utf8')
const academic=readFileSync('supabase/migrations/202610140001_v2_academic_causal_curriculum.sql','utf8')
const submit=readFileSync('supabase/functions/v2-submit/index.ts','utf8')
const state=readFileSync('supabase/functions/v2-state/index.ts','utf8')
const wall=readFileSync('supabase/functions/v2-wall-state/index.ts','utf8')
const facilitator=readFileSync('supabase/functions/v2-facilitator/index.ts','utf8')
const immutable=readFileSync('supabase/migrations/202609180009_v2_immutable_check_answer.sql','utf8')

test('every academic mission uses 20 lab + 30 question + 20 revision + 30 team',()=>{
  const rows=[...academic.matchAll(/(\d+,'[^']+','[abc]',20,30,20,30,true/g)]
  assert.equal(rows.length,6)
  assert.match(scoreSql,/checkpoint in \('lab','check','revision','team'\)/)
})

test('correct checkpoint answers stay server-side',()=>{
  const registry=readFileSync('src/v2/challenge-registry.js','utf8')
  assert.match(scoreSql,/correct_answer text not null/)
  assert.match(scoreSql,/answer=cfg.correct_answer/)
  assert.doesNotMatch(registry,/correctAnswer|correct_answer/)
  assert.match(academic,/'randomized-experiment','a'/)
  assert.match(academic,/'dag-adjustment','b'/)
  assert.match(academic,/'causal-model-battle','c'/)
})

test('revision requires lab and check and team points remain hidden until reveal',()=>{
  assert.match(submit,/cw_v2_assert_ready_for_revision/)
  assert.match(scoreSql,/Primero termina el laboratorio/)
  assert.match(scoreSql,/Primero responde la pregunta de cierre/)
  assert.match(academic,/checkpoint,points,max_points,visible/)
  assert.match(academic,/cfg\.team_points\*score\/100\.0/)
  assert.match(academic,/visible=false/)
  assert.match(facilitator,/cw_v2_reveal_team_points/)
})

test('player and wall states merge score rank and top3 data',()=>{
  assert.match(state,/cw_v2_player_score_state/)
  assert.match(state,/progress:score/)
  assert.match(wall,/cw_v2_wall_score_state/)
  assert.match(scoreSql,/'top3',top3/)
})

test('comprehension answer is first-write immutable',()=>{
  assert.match(immutable,/already_answered/)
  assert.match(immutable,/if found then/)
  assert.match(immutable,/on conflict\(game_id,round_number,player_id,checkpoint\) do nothing/)
  assert.doesNotMatch(immutable,/do update set points=excluded.points/)
})
