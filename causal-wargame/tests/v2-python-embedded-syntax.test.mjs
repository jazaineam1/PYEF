import test from'node:test'
import assert from'node:assert/strict'
import{spawnSync}from'node:child_process'
import{buildPythonLab}from'../src/v2/python-lab.js'

const obs=[
  {pga_prev:3.1,study_hours:8,sleep_hours:6,fatigue:6,complexity:8,treated:true,grade:34,passed:1,segment:'Alta fatiga'},
  {pga_prev:3.7,study_hours:10,sleep_hours:7,fatigue:3,complexity:6,treated:false,grade:39,passed:1,segment:'Equilibrado'},
  {pga_prev:3.5,study_hours:9,sleep_hours:5,fatigue:5,complexity:7,treated:false,grade:31,passed:1,segment:'Sueño insuficiente'},
  {pga_prev:3.2,study_hours:11,sleep_hours:7,fatigue:4,complexity:5,treated:true,grade:42,passed:1,segment:'Equilibrado'}
]

const fixtures=[
  [1,'prediction',{team_pool:[{id:'E01',name:'Estudiante 01',segment:'Equilibrado',score:.8,usage:8,bugs:3,discount:7,tenure:360}]},{team_tools:{ml_training:obs}}],
  [2,'ab-test',{}, {team_tools:{experiment_rows:obs}}],
  [3,'dag',{}, {team_tools:{observational_rows:obs}}],
  [4,'dml',{}, {team_tools:{observational_rows:obs}}],
  [5,'heterogeneity',{}, {team_tools:{experiment_rows:obs,segments:[]}}],
  [6,'model-battle',{}, {team_tools:{experiment_rows:obs,econml:[]}}]
]

function compilePython(code,label){
  const out=spawnSync('python3',['-c','import sys; compile(sys.stdin.read(), "<embedded-lab>", "exec")'],{input:code,encoding:'utf8'})
  assert.equal(out.status,0,`${label} has invalid Python syntax:\n${out.stderr}\n--- code ---\n${code}`)
}

for(const [round,labKey,state,analysis] of fixtures){
  test(`${labKey} embedded Python is syntactically valid in every step`,()=>{
    const lab=buildPythonLab(round,state,analysis,labKey)
    assert.ok(lab?.steps?.length>0)
    for(const step of lab.steps){
      compilePython(step.guidedCode,`${labKey}/${step.id}`)
      assert.equal(step.guidedCode.includes('print("\n'),false,'raw newline leaked inside a Python string literal')
    }
  })
}
