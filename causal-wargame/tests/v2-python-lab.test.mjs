import test from'node:test'
import assert from'node:assert/strict'
import{readFileSync}from'node:fs'
import{buildPythonLab}from'../src/v2/python-lab.js'

test('reto 1 guided lab stays simple and never leaks causal ground truth',()=>{
  const state={team_pool:[{id:'C01',name:'A',segment:'x',score:.8,usage:70,bugs:2,discount:10,tenure:20,cohort_size:1000,p0:.2,p1:.7,uplift_pp:50}]}
  const analysis={team_tools:{ml_training:[
    {usage:20,bugs:1,discount:5,tenure:10,renewed:0},
    {usage:80,bugs:2,discount:15,tenure:30,renewed:1}
  ]}}
  const lab=buildPythonLab(1,state,analysis)
  const payload=JSON.stringify(lab.context)
  const guided=lab.steps.map(s=>s.guidedCode).join('\n')
  assert.doesNotMatch(payload,/"p0"|"p1"|uplift|effect/)
  assert.match(guided,/sort_values/)
  assert.match(guided,/CAMBIAR/)
})

test('reto 2 guided lab teaches comparison before advanced vocabulary',()=>{
  const lab=buildPythonLab(2,{team_pool:[]},{team_tools:{observational_rows:[
    {risk:4,usage:20,tenure:10,treated:true,renewed:0},
    {risk:1,usage:50,tenure:20,treated:false,renewed:1}
  ]}})
  const guided=lab.steps.map(s=>s.guidedCode).join('\n')
  assert.match(guided,/groupby/)
  assert.match(guided,/grupos ya eran distintos/)
})

test('reto 3 guided lab uses experiment, groups and COP',()=>{
  const lab=buildPythonLab(3,{team_pool:[],economy:{renewal_value_cop:200000,intervention_cost_cop:8000,capacity:15000}},{team_tools:{
    experiment_rows:[
      {segment:'digital',usage:80,tenure:20,treated:true,renewed:1},
      {segment:'digital',usage:70,tenure:18,treated:false,renewed:0}
    ],
    segments:[{id:'digital',name:'Digitales',audience:7000,risk:'Bajo',value_per_result:200000,unit_cost:8000}],
    economy:{renewal_value_cop:200000,intervention_cost_cop:8000,capacity:15000}
  }})
  const guided=lab.steps.map(s=>s.guidedCode).join('\n')
  assert.match(guided,/Cambio promedio/)
  assert.match(guided,/valor_incremental_cop/)
})

test('browser lab renders every step on one page and displays configurable completion points',()=>{
  const component=readFileSync('src/v2/PythonEvidenceLab.jsx','utf8')
  const worker=readFileSync('src/v2/pyodide.worker.js','utf8')
  assert.match(component,/v2-python-all-steps/)
  assert.match(component,/steps\.map/)
  assert.match(component,/lab_complete/)
  assert.match(component,/labPoints=20/)
  assert.match(component,/Terminar laboratorio/)
  assert.doesNotMatch(component,/Profundizar/)
  assert.doesNotMatch(component,/v2-python-step-tabs/)
  assert.match(worker,/scikit-learn/)
  assert.match(worker,/matplotlib/)
  assert.match(worker,/execution_error/)
  assert.match(worker,/_ok = False/)
  assert.match(component,/stepErrors/)
  assert.match(component,/Este bloque todavía no cuenta como completado/)
})
