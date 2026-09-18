import test from 'node:test'
import assert from 'node:assert/strict'
import{readFileSync}from'node:fs'

const read=p=>readFileSync(p,'utf8')

test('V2 exposes the four visual evidence families',()=>{
  const src=read('src/v2/VisualTools.jsx')
  for(const name of ['PopulationShapChart','ScoreUpliftChart','TwoFuturesPanel','DagLab','OverlapChart','RawAdjustedPanel','PrecisionSimulator','TreatmentControlCI','CateForestPlot','EconMLCompare','PlaceboPanel','PolicyMeter']){
    assert.match(src,new RegExp('function '+name+'|export function '+name))
  }
})

test('visual evidence is integrated after individual proposals and before team lock',()=>{
  const src=read('src/v2/V2Play.jsx')
  assert.match(src,/ProposalSummary state=\{state\}/)
  assert.match(src,/EvidenceLab round=\{round\}/)
  assert.match(src,/RevealVisuals round=\{state\.game\.round\}/)
  assert.match(src,/PolicyMeter segments=\{segs\}/)
})

test('live reveal data stays server-side',()=>{
  const play=read('src/v2/V2Play.jsx')
  const visuals=read('src/v2/VisualTools.jsx')
  assert.doesNotMatch(play,/p0:\s*0\./)
  assert.doesNotMatch(visuals,/score_uplift:\s*\[/)
  assert.match(read('supabase/migrations/202609180001_v2_visual_causal_evidence.sql'),/cw_v2_analysis/)
})

test('the simulator declares its data are illustrative',()=>{
  const sim=read('src/v2/V2Simulator.jsx')
  assert.match(sim,/ilustrativos y deliberadamente distintos/)
})
