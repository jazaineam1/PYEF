import test from'node:test'
import assert from'node:assert/strict'
import{readFileSync}from'node:fs'
import{buildPythonLab}from'../src/v2/python-lab.js'

test('reto 1 guided mode is simple while advanced mode can train a predictive model without causal leakage',()=>{
  const state={team_pool:[{id:'C01',name:'A',segment:'x',score:.8,usage:70,bugs:2,discount:10,tenure:20,cohort_size:1000,p0:.2,p1:.7,uplift_pp:50}]}
  const analysis={team_tools:{ml_training:[
    {usage:20,bugs:1,discount:5,tenure:10,renewed:0},
    {usage:80,bugs:2,discount:15,tenure:30,renewed:1}
  ]}}
  const lab=buildPythonLab(1,state,analysis)
  const payload=JSON.stringify(lab.context)
  const guided=lab.steps.map(s=>s.guidedCode).join('\n')
  const advanced=lab.steps.map(s=>s.advancedCode).join('\n')
  assert.doesNotMatch(payload,/"p0"|"p1"|uplift|effect/)
  assert.match(guided,/sort_values/)
  assert.match(guided,/CAMBIAR/)
  assert.doesNotMatch(guided,/roc_auc_score/)
  assert.match(advanced,/LogisticRegression/)
  assert.match(advanced,/roc_auc_score/)
})

test('reto 2 guided mode teaches fair comparison before naming propensity and IPW',()=>{
  const lab=buildPythonLab(2,{team_pool:[]},{team_tools:{observational_rows:[
    {risk:4,usage:20,tenure:10,treated:true,renewed:0},
    {risk:1,usage:50,tenure:20,treated:false,renewed:1}
  ]}})
  const guided=lab.steps.map(s=>s.guidedCode).join('\n')
  const advanced=lab.steps.map(s=>s.advancedCode).join('\n')
  assert.equal(lab.steps.length,3)
  assert.match(guided,/groupby/)
  assert.match(guided,/grupos ya eran distintos/)
  assert.doesNotMatch(guided,/propensity score \+ IPW/)
  assert.match(advanced,/propensity/)
  assert.match(advanced,/IPW/)
  assert.match(advanced,/overlap/)
})

test('reto 3 guided mode uses experiment, segments and COP; advanced mode adds uncertainty and T-Learner',()=>{
  const lab=buildPythonLab(3,{team_pool:[],economy:{renewal_value_cop:200000,intervention_cost_cop:8000,capacity:15000}},{team_tools:{
    experiment_rows:[
      {segment:'digital',usage:80,tenure:20,treated:true,renewed:1},
      {segment:'digital',usage:70,tenure:18,treated:false,renewed:0}
    ],
    segments:[{id:'digital',name:'Digitales',audience:7000,risk:'Bajo',value_per_result:200000,unit_cost:8000}],
    economy:{renewal_value_cop:200000,intervention_cost_cop:8000,capacity:15000}
  }})
  const guided=lab.steps.map(s=>s.guidedCode).join('\n')
  const advanced=lab.steps.map(s=>s.advancedCode).join('\n')
  assert.match(guided,/Cambio promedio/)
  assert.match(guided,/valor_incremental_cop/)
  assert.doesNotMatch(guided,/T-Learner/)
  assert.match(advanced,/IC 95%/)
  assert.match(advanced,/RandomForestRegressor/)
  assert.match(advanced,/T-Learner/)
})

test('browser lab presents guided and optional deeper analysis with graphical outputs',()=>{
  const component=readFileSync('src/v2/PythonEvidenceLab.jsx','utf8')
  const worker=readFileSync('src/v2/pyodide.worker.js','utf8')
  assert.match(component,/Guiado/)
  assert.match(component,/Profundizar/)
  assert.match(component,/Código corto para entender la idea/)
  assert.match(component,/advancedCode/)
  assert.match(component,/Código Python editable/)
  assert.match(component,/20 segundos/)
  assert.match(component,/learning_event/)
  assert.match(component,/result\.image/)
  assert.match(worker,/scikit-learn/)
  assert.match(worker,/matplotlib/)
})
