import test from'node:test'
import assert from'node:assert/strict'
import{readFileSync}from'node:fs'

const sql=readFileSync('supabase/migrations/202609180005_v2_scored_checkpoints.sql','utf8')
const submit=readFileSync('supabase/functions/v2-submit/index.ts','utf8')
const state=readFileSync('supabase/functions/v2-state/index.ts','utf8')
const wall=readFileSync('supabase/functions/v2-wall-state/index.ts','utf8')
const facilitator=readFileSync('supabase/functions/v2-facilitator/index.ts','utf8')

test('checkpoint scoring is 20 lab + 30 question + 20 revision + 30 team',()=>{
  assert.match(sql,/\(1,'prediction-vs-effect','b',20,30,20,30,true\)/)
  assert.match(sql,/checkpoint in \('lab','check','revision','team'\)/)
  assert.match(sql,/cfg\.team_points\*raw_score\/100\.0/)
})

test('check answers are scored server-side and correct answers are not bundled in challenge registry',()=>{
  const registry=readFileSync('src/v2/challenge-registry.js','utf8')
  assert.match(sql,/correct_answer text not null/)
  assert.match(sql,/answer=cfg\.correct_answer/)
  assert.doesNotMatch(registry,/correctAnswer|correct_answer/)
})

test('revision requires lab and check, and team points remain hidden until reveal',()=>{
  assert.match(submit,/cw_v2_assert_ready_for_revision/)
  assert.match(sql,/Primero termina el laboratorio/)
  assert.match(sql,/Primero responde la pregunta de cierre/)
  assert.match(sql,/checkpoint,'team',awarded,cfg\.team_points,false/)
  assert.match(facilitator,/cw_v2_reveal_team_points/)
})

test('player and wall states merge score/rank/top3 data',()=>{
  assert.match(state,/cw_v2_player_score_state/)
  assert.match(state,/progress:score/)
  assert.match(wall,/cw_v2_wall_score_state/)
  assert.match(sql,/'top3',top3/)
  assert.match(sql,/'rank',coalesce\(my_rank,1\)/)
})
