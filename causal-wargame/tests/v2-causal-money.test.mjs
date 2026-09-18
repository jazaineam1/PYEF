import test from'node:test'
import assert from'node:assert/strict'
import{readFileSync}from'node:fs'

const sql=readFileSync('supabase/migrations/202609180003_v2_causal_money_modeling.sql','utf8')

test('V2 economy is centralized in COP with explicit capacity',()=>{
  assert.match(sql,/create table if not exists public\.cw_v2_economy/)
  assert.match(sql,/200000,8000,1000,15000,10000/)
  assert.match(sql,/incremental_value_cop/)
  assert.match(sql,/best_possible_value_cop/)
})

test('V2 has reproducible datasets for prediction, observational causal analysis and experiment',()=>{
  assert.match(sql,/cw_v2_model_training/)
  assert.match(sql,/generate_series\(1,600\)/)
  assert.match(sql,/cw_v2_observational/)
  assert.match(sql,/generate_series\(1,2000\)/)
  assert.match(sql,/cw_v2_experiment/)
})

test('team lock requires both initial and revised individual decisions',()=>{
  assert.match(sql,/cw_v2_revisions/)
  assert.match(sql,/submitted<humans/)
  assert.match(sql,/revised<humans/)
  assert.match(sql,/Primero deben revisar su decisión/)
})

test('V2 ends after mission 3 and retains custom-auth least privilege',()=>{
  assert.match(sql,/'max_round',3/)
  assert.match(sql,/if g\.current_round>=3 then/)
  assert.match(sql,/revoke all on function public\.cw_v2_submit_revision/)
  assert.match(sql,/grant execute on function public\.cw_v2_submit_revision.*service_role/)
})

test('identification mission is not falsely monetized',()=>{
  assert.match(sql,/'monetized',false/)
  assert.match(sql,/identificación causal/)
  assert.match(sql,/'incremental_value_cop',0/)
})
