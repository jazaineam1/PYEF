import test from'node:test'
import assert from'node:assert/strict'
import{readFileSync}from'node:fs'

const base=readFileSync('supabase/migrations/202609180003_v2_causal_money_modeling.sql','utf8')
const academic=readFileSync('supabase/migrations/202610140001_v2_academic_causal_curriculum.sql','utf8')

test('V2 keeps reusable synthetic tables but rethemes their semantics academically',()=>{
  assert.match(base,/cw_v2_economy/)
  assert.match(base,/cw_v2_experiment/)
  assert.match(academic,/User-facing semantics are academic/)
  assert.match(academic,/PGA previo/)
  assert.match(academic,/Alta fatiga/)
})

test('academic curriculum reuses prediction observational and randomized profiles',()=>{
  assert.match(academic,/profile_round/)
  for(const key of ['prediction-vs-intervention','randomized-experiment','dag-adjustment','double-machine-learning','heterogeneous-effects','causal-model-battle'])assert.ok(academic.includes(key))
})

test('team lock still requires initial and revised individual decisions',()=>{
  assert.match(academic,/submitted<humans/)
  assert.match(academic,/revised<humans/)
  assert.match(academic,/Primero deben revisar todos los integrantes/)
})

test('runtime exposes six enabled missions and disables higher placeholders',()=>{
  assert.ok(academic.includes("(6,'causal-model-battle'"))
  assert.match(academic,/round_number>6/)
})

test('team impact is an academic synthetic quantity separate from learning score',()=>{
  assert.match(academic,/'impact_students'/)
  assert.match(academic,/'score'/)
  assert.match(academic,/value_per_result=1/)
  assert.match(academic,/unit_cost=0/)
  assert.match(academic,/checkpoint,points,max_points,visible/)
})
