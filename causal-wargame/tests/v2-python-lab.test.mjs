import test from'node:test'
import assert from'node:assert/strict'
import{readFileSync}from'node:fs'
import{buildPythonLab}from'../src/v2/python-lab.js'

const obs=[
  {pga_prev:3.1,study_hours:8,sleep_hours:6,fatigue:6,complexity:8,treated:true,grade:34,passed:1,segment:'Alta fatiga'},
  {pga_prev:3.7,study_hours:10,sleep_hours:7,fatigue:3,complexity:6,treated:false,grade:39,passed:1,segment:'Equilibrado'}
]
const exp=[...obs,{...obs[0],treated:false},{...obs[1],treated:true}]

test('prediction lab teaches performance metrics before causal interpretation',()=>{
  const lab=buildPythonLab(1,{team_pool:[{id:'E01',name:'A',segment:'x',score:.8,usage:8,bugs:2,discount:7,tenure:360}]},{team_tools:{ml_training:obs}},'prediction')
  const guided=lab.steps.map(s=>s.guidedCode).join('\n')
  assert.match(guided,/MAE/)
  assert.match(guided,/R²/)
  assert.match(guided,/NO responde/)
  assert.doesNotMatch(JSON.stringify(lab.context),/"p0"|"p1"|uplift/)
})

test('A/B lab defines ATE and uncertainty in executable steps',()=>{
  const lab=buildPythonLab(2,{}, {team_tools:{experiment_rows:exp}},'ab-test')
  const guided=lab.steps.map(s=>s.guidedCode).join('\n')
  assert.match(guided,/Average Treatment Effect/)
  assert.match(guided,/Intervalo de Confianza/)
  assert.match(guided,/azar muestral/)
})

test('DAG lab contains confounder, mediator and collider sequence',()=>{
  const lab=buildPythonLab(3,{}, {team_tools:{observational_rows:obs}},'dag')
  const guided=lab.steps.map(s=>s.guidedCode).join('\n')
  for(const term of ['Confusor','MEDIADOR','COLLIDER','Directed Acyclic Graph'])assert.match(guided,new RegExp(term))
})

test('DML lab constructs nuisance models, residuals and causal effect',()=>{
  const lab=buildPythonLab(4,{}, {team_tools:{observational_rows:obs}},'dml')
  const guided=lab.steps.map(s=>s.guidedCode).join('\n')
  for(const term of ['nuisance','t_res','y_res','Double Machine Learning'])assert.match(guided,new RegExp(term,'i'))
})

test('heterogeneity and model battle execute real sklearn estimators',()=>{
  const h=buildPythonLab(5,{}, {team_tools:{experiment_rows:exp,segments:[]}},'heterogeneity')
  assert.match(h.steps.map(s=>s.guidedCode).join('\n'),/T-Learner/)
  assert.match(h.steps.map(s=>s.guidedCode).join('\n'),/CATE/)
  const b=buildPythonLab(6,{}, {team_tools:{experiment_rows:exp,econml:[]}},'model-battle')
  const code=b.steps.map(s=>s.guidedCode).join('\n')
  assert.match(code,/S-Learner/)
  assert.match(code,/DR-Learner/)
  assert.match(code,/EconML/)
  assert.match(code,/no se ejecuta dentro de este navegador/i)
})

test('browser lab requires every successful block and uses Pyodide packages',()=>{
  const component=readFileSync('src/v2/PythonEvidenceLab.jsx','utf8'),worker=readFileSync('src/v2/pyodide.worker.js','utf8')
  for(const x of ['v2-python-all-steps','lab_complete','labPoints=20','Terminar laboratorio','stepErrors','Este bloque todavía no cuenta como completado'])assert.match(component,new RegExp(x))
  assert.match(worker,/scikit-learn/)
  assert.match(worker,/matplotlib/)
  assert.match(worker,/execution_error/)
})
