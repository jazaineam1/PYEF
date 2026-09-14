import test from 'node:test'
import assert from 'node:assert/strict'
import { CUSTOMERS, SEGMENTS, ANSWERS } from '../src/demo/groundTruth.generated.js'

test('scenario has 24 synthetic customers and five policy segments',()=>{
  assert.equal(CUSTOMERS.length,24)
  assert.equal(SEGMENTS.length,5)
})

test('predictive ranking is intentionally different from causal ranking',()=>{
  const predictive=[...CUSTOMERS].sort((a,b)=>b.score-a.score).slice(0,10).map(x=>x.id)
  const causal=[...CUSTOMERS].sort((a,b)=>(b.p1-b.p0)-(a.p1-a.p0)).slice(0,10).map(x=>x.id)
  assert.notDeepEqual(predictive,causal)
})

test('arrears segment has negative treatment effect',()=>{
  assert.ok(SEGMENTS.find(x=>x.id==='arrears').effect<0)
})

test('four microcheck answer keys exist',()=>{
  assert.deepEqual(Object.keys(ANSWERS).sort(),['1','2','3','4'])
})
