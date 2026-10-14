import test from'node:test'
import assert from'node:assert/strict'
import{readFileSync}from'node:fs'

const base=readFileSync('supabase/migrations/202609180003_v2_causal_money_modeling.sql','utf8')
const academic=readFileSync('supabase/migrations/202610140001_v2_academic_causal_curriculum.sql','utf8')

test('V2 keeps reusable synthetic data tables while retheming their semantics academically',()=>{
  assert.match(base,/cw_v2_economy/)
  assert.match(base,/cw_v2_experiment/)
  assert.match(academic,/User-facing semantics are academic/)
  assert.match(academic,/PGA previo/)
  assert.match(academic,/Alta fatiga/)
})

test('academic curriculum reuses prediction observational and randomized profiles',()=>{
  assert.match(academic,/profile_round/)
  assert.match(academic,/'prediction-vs-intervention'/)
  assert.match(academic,/'dag-adjustment'/)
  assert.match(academic,/'double-machine-learning'/)
  assert.match(academic,/'heterogeneous-effects'/)
  assert.match(academic,/'causal-model-battle'/)
})

test('team lock still requires initial and revised individual decisions',()=>{
  assert.match(academic,/submitted<humans/)
  assert.match(academic,/revised<humans/)
  assert.match(academic,/Primero deben revisar todos los integrantes/)
})

test('V2 now exposes six enabled missions and facilitator count remains dynamic',()=>{
  assert.match(academic,/(6,'causal-model-battle'/)
  assert.match(academic,/update public.cw_v2_challenge_runtime set enabled=false where round_number>6/)
  assert.match(base,/cw_v2_team_decisions/)
})

test('team impact is an academic synthetic quantity separate from learning score',()=>{
  assert.match(academic,/'impact_students'/)
  assert.match(academic,/'score'/)
  assert.match(academic,/'incremental_value_cop',round(impact,1)/)
  assert.match(academic,/value_per_result=1/)
  assert.match(academic,/unit_cost=0/)
})
