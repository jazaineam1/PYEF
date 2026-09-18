import test from'node:test'
import assert from'node:assert/strict'
import{readFileSync}from'node:fs'
import{buildPythonLab}from'../src/v2/python-lab.js'

test('round 1 Python payload never exposes counterfactual ground truth before reveal',()=>{
  const state={team_pool:[{id:'C01',name:'A',segment:'x',score:.8,p0:.2,p1:.7,uplift_pp:50,shap:[{feature:'x',impact:1}]}]}
  const lab=buildPythonLab(1,state,{team_tools:{}})
  const payload=JSON.stringify(lab.context)
  assert.match(payload,/prob_renovacion/)
  assert.doesNotMatch(payload,/p0|p1|uplift|effect/)
})

test('round 2 lab lets students compare crude outcomes and risk strata',()=>{
  const state={team_pool:[
    {id:'A',risk:4,treated:true,outcome:false,score:.8},
    {id:'B',risk:1,treated:false,outcome:true,score:.4}
  ]}
  const lab=buildPythonLab(2,state,{team_tools:{}})
  assert.match(lab.code,/groupby\("tratado"\)/)
  assert.match(lab.code,/groupby\(\["riesgo","tratado"\]\)/)
  assert.deepEqual(Object.keys(lab.context.rows[0]).sort(),['id','prob_renovacion','renovo','riesgo','tratado'].sort())
})

test('round 3 lab uses only unlocked precision curve and business threshold',()=>{
  const lab=buildPythonLab(3,{team_pool:[]},{team_tools:{
    business_threshold_pp:2,
    precision_curve:[{n:1000,mde_pp:4.2,ci_half_pp:2.1},{n:5000,mde_pp:1.8,ci_half_pp:.9}]
  }})
  assert.equal(lab.context.umbral_pp,2)
  assert.equal(lab.context.rows.length,2)
  assert.match(lab.code,/Primer N/)
})

test('round 4 lab exposes CATE estimates and uncertainty, not hidden individual futures',()=>{
  const state={team_pool:[{id:'digital',name:'Digital',audience:7000,effect:13.5,ci_low:8,ci_high:18,risk:'medio',p0:.1,p1:.9}]}
  const lab=buildPythonLab(4,state,{team_tools:{}})
  const payload=JSON.stringify(lab.context)
  assert.match(payload,/efecto_pp/)
  assert.match(payload,/ci_bajo/)
  assert.doesNotMatch(payload,/"p0"|"p1"/)
})

test('browser lab is Pyodide/WebAssembly, editable and wired into the evidence deck',()=>{
  const component=readFileSync('src/v2/PythonEvidenceLab.jsx','utf8')
  const worker=readFileSync('src/v2/pyodide.worker.js','utf8')
  const visual=readFileSync('src/v2/VisualTools.jsx','utf8')
  assert.match(component,/new Worker\(new URL/)
  assert.match(component,/Código Python editable/)
  assert.match(component,/10 segundos/)
  assert.match(worker,/pyodide/)
  assert.match(worker,/loadPackage\(\['pandas'\]\)/)
  assert.match(visual,/PythonEvidenceLab/)
})
