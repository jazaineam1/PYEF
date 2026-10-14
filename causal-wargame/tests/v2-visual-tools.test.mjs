import test from'node:test'
import assert from'node:assert/strict'
import{readFileSync}from'node:fs'
const read=p=>readFileSync(p,'utf8')

test('V2 retains reusable causal visual evidence families',()=>{
  const src=read('src/v2/VisualTools.jsx')
  for(const name of ['DagLab','OverlapChart','RawAdjustedPanel','TreatmentControlCI','CateForestPlot','EconMLCompare','PolicyMeter'])assert.match(src,new RegExp('function '+name+'|export function '+name))
})

test('evidence is integrated between initial decision, revision and team lock',()=>{
  const src=read('src/v2/V2Play.jsx')
  assert.match(src,/DecisionSummary state=\{state\}/)
  assert.match(src,/EvidenceLab round=\{round\}/)
  assert.match(src,/chooser\(true,false\)/)
  assert.match(src,/chooser\(false,true\)/)
  assert.match(src,/PolicyMeter segments=\{segs\}/)
  assert.match(src,/function Glossary/)
})

test('live causal ground truth stays server-side until reveal',()=>{
  const play=read('src/v2/V2Play.jsx')
  assert.doesNotMatch(play,/p0:\s*0\./)
  assert.doesNotMatch(play,/p1:\s*0\./)
  assert.match(read('supabase/migrations/202610140001_v2_academic_causal_curriculum.sql'),/reveal_tools/)
})

test('simulator uses isolated deterministic academic fixtures',()=>{
  const sim=read('src/v2/V2Simulator.jsx'),fixtures=read('src/v2/simulator-fixtures.js')
  assert.match(sim,/SIM_PATHS/)
  assert.match(sim,/SIN BACKEND|RECORRIDO COMPLETO/)
  assert.match(fixtures,/SIM_ANALYSIS/)
  assert.match(fixtures,/Alta fatiga/)
})
