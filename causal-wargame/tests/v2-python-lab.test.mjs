import test from'node:test'
import assert from'node:assert/strict'
import{readFileSync}from'node:fs'
import{buildPythonLab}from'../src/v2/python-lab.js'

test('mission 1 runs a real predictive model without leaking counterfactual ground truth',()=>{
  const state={team_pool:[{id:'C01',name:'A',segment:'x',score:.8,usage:70,bugs:2,discount:10,tenure:20,cohort_size:1000,p0:.2,p1:.7,uplift_pp:50}]}
  const analysis={team_tools:{ml_training:[
    {usage:20,bugs:1,discount:5,tenure:10,renewed:0},
    {usage:80,bugs:2,discount:15,tenure:30,renewed:1}
  ]}}
  const lab=buildPythonLab(1,state,analysis)
  const payload=JSON.stringify(lab.context)
  const code=lab.steps.map(s=>s.code).join('\n')
  assert.match(payload,/entrenamiento/)
  assert.match(payload,/cohortes/)
  assert.doesNotMatch(payload,/"p0"|"p1"|uplift|effect/)
  assert.match(code,/LogisticRegression/)
  assert.match(code,/roc_auc_score/)
  assert.match(code,/predict_proba/)
})

test('mission 2 estimates propensity score, IPW and overlap in Python',()=>{
  const lab=buildPythonLab(2,{team_pool:[]},{team_tools:{observational_rows:[
    {risk:4,usage:20,tenure:10,treated:true,renewed:0},
    {risk:1,usage:50,tenure:20,treated:false,renewed:1}
  ]}})
  const code=lab.steps.map(s=>s.code).join('\n')
  assert.equal(lab.steps.length,3)
  assert.match(code,/Diferencia cruda/)
  assert.match(code,/LogisticRegression/)
  assert.match(code,/propensity/)
  assert.match(code,/ATE IPW/)
  assert.match(code,/plt\.hist/)
})

test('mission 3 estimates ATE, uncertainty, T-Learner CATE and COP policy value',()=>{
  const lab=buildPythonLab(3,{team_pool:[],economy:{renewal_value_cop:200000,intervention_cost_cop:8000,capacity:15000}},{team_tools:{
    experiment_rows:[
      {segment:'digital',usage:80,tenure:20,treated:true,renewed:1},
      {segment:'digital',usage:70,tenure:18,treated:false,renewed:0}
    ],
    segments:[{id:'digital',name:'Digitales',audience:7000,risk:'Bajo',value_per_result:200000,unit_cost:8000}],
    economy:{renewal_value_cop:200000,intervention_cost_cop:8000,capacity:15000}
  }})
  const code=lab.steps.map(s=>s.code).join('\n')
  assert.equal(lab.steps.length,3)
  assert.match(code,/scipy/)
  assert.match(code,/IC 95%/)
  assert.match(code,/RandomForestRegressor/)
  assert.match(code,/T-Learner/)
  assert.match(code,/valor_incremental_cop/)
  assert.match(code,/capacity/)
})

test('browser lab loads scientific Python, supports guided/free steps and graphical outputs',()=>{
  const component=readFileSync('src/v2/PythonEvidenceLab.jsx','utf8')
  const worker=readFileSync('src/v2/pyodide.worker.js','utf8')
  const visual=readFileSync('src/v2/VisualTools.jsx','utf8')
  assert.match(component,/new Worker\(new URL/)
  assert.match(component,/Guiado/)
  assert.match(component,/Libre/)
  assert.match(component,/Código Python editable/)
  assert.match(component,/20 segundos/)
  assert.match(component,/learning_event/)
  assert.match(component,/result\.image/)
  assert.match(worker,/scikit-learn/)
  assert.match(worker,/matplotlib/)
  assert.match(worker,/savefig/)
  assert.match(visual,/PythonEvidenceLab/)
})
