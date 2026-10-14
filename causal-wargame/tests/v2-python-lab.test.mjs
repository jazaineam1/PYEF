import test from'node:test'
import assert from'node:assert/strict'
import{readFileSync}from'node:fs'
import{buildPythonLab}from'../src/v2/python-lab.js'

const obs=[
  {pga_prev:3.1,study_hours:8,sleep_hours:6,fatigue:6,complexity:8,treated:true,grade:34,passed:1,segment:'Alta fatiga'},
  {pga_prev:3.7,study_hours:10,sleep_hours:7,fatigue:3,complexity:6,treated:false,grade:39,passed:1,segment:'Equilibrado'},
  {pga_prev:3.5,study_hours:9,sleep_hours:5,fatigue:5,complexity:7,treated:false,grade:31,passed:1,segment:'Sueño insuficiente'},
  {pga_prev:3.2,study_hours:11,sleep_hours:7,fatigue:4,complexity:5,treated:true,grade:42,passed:1,segment:'Equilibrado'}
]

test('prediction lab teaches predictive quality before causal interpretation',()=>{
  const lab=buildPythonLab(1,{team_pool:[{id:'E01',name:'A',segment:'x',score:.8,usage:8,bugs:2,discount:7,tenure:360}]},{team_tools:{ml_training:obs}},'prediction')
  const guided=lab.steps.map(s=>s.guidedCode).join('\n')
  assert.match(guided,/MAE/)
  assert.match(guided,/R²/)
  assert.match(guided,/NO responde/)
  assert.doesNotMatch(JSON.stringify(lab.context),/"p0"|"p1"|uplift/)
})

test('A/B lab defines ATE and uncertainty',()=>{
  const lab=buildPythonLab(2,{}, {team_tools:{experiment_rows:obs}},'ab-test')
  const guided=lab.steps.map(s=>s.guidedCode).join('\n')
  assert.match(guided,/Average Treatment Effect/)
  assert.match(guided,/Intervalo de Confianza/)
  assert.match(guided,/azar muestral/)
})

test('DAG lab teaches confounder mediator and collider',()=>{
  const lab=buildPythonLab(3,{}, {team_tools:{observational_rows:obs}},'dag')
  const guided=lab.steps.map(s=>s.guidedCode).join('\n')
  for(const term of ['Confusor','mediador','collider','Directed Acyclic Graph'])assert.match(guided,new RegExp(term,'i'))
  assert.match(guided,/np\.linalg\.lstsq/)
})

test('DML lab constructs nuisance models residuals and effect',()=>{
  const lab=buildPythonLab(4,{}, {team_tools:{observational_rows:obs}},'dml')
  const guided=lab.steps.map(s=>s.guidedCode).join('\n')
  for(const term of ['nuisance','t_res','y_res','Double Machine Learning'])assert.match(guided,new RegExp(term,'i'))
})

test('heterogeneity and model battle use real sklearn estimators',()=>{
  const h=buildPythonLab(5,{}, {team_tools:{experiment_rows:obs,segments:[]}},'heterogeneity')
  const hcode=h.steps.map(s=>s.guidedCode).join('\n')
  assert.match(hcode,/T-Learner/)
  assert.match(hcode,/CATE/)
  const b=buildPythonLab(6,{}, {team_tools:{experiment_rows:obs,econml:[]}},'model-battle')
  const bcode=b.steps.map(s=>s.guidedCode).join('\n')
  assert.match(bcode,/S-Learner/)
  assert.match(bcode,/DR-Learner/)
  assert.match(bcode,/EconML/)
  assert.match(bcode,/EconML se entreno fuera de Pyodide/i)
  assert.match(bcode,/Benchmark V2 no verificado/)
})

test('browser lab requires successful execution of all blocks and loads Pyodide packages',()=>{
  const component=readFileSync('src/v2/PythonEvidenceLab.jsx','utf8')
  const worker=readFileSync('src/v2/pyodide.worker.js','utf8')
  for(const x of ['v2-python-all-steps','lab_complete','labPoints=20','Terminar laboratorio','stepErrors','Este bloque todavía no cuenta como completado'])assert.match(component,new RegExp(x))
  assert.match(worker,/scikit-learn/)
  assert.match(worker,/matplotlib/)
  assert.match(worker,/execution_error/)
})
