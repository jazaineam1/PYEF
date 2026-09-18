import test from'node:test'
import assert from'node:assert/strict'
import{readFileSync}from'node:fs'
import{buildPythonLab}from'../src/v2/python-lab.js'
import{validateChallengeRegistry,CHALLENGE_TEMPLATE}from'../src/v2/challenge-registry.js'

const read=p=>readFileSync(p,'utf8')

test('a fourth reto can reuse an existing backend and Python profile',()=>{
  const candidate={...CHALLENGE_TEMPLATE,id:'r4',order:4,enabled:true,profileRound:2,labKey:'comparison'}
  assert.deepEqual(validateChallengeRegistry([candidate]),[])
  const lab=buildPythonLab(4,{team_pool:[]},{team_tools:{observational_rows:[]}},'comparison')
  assert.equal(lab.title,'¿La comparación es justa?')
  assert.equal(lab.steps.length,3)
})

test('embedded Python receives labKey instead of assuming round 1/2/3',()=>{
  const component=read('src/v2/PythonEvidenceLab.jsx')
  const visuals=read('src/v2/VisualTools.jsx')
  assert.match(component,/\{round,state,analysis,labKey,labPoints=20,onComplete/)
  assert.match(component,/buildPythonLab\(round,state,analysis,labKey\)/)
  assert.match(visuals,/labKey=\{labKey\}/)
  assert.match(visuals,/labPoints=\{labPoints\}/)
})

test('live backend uses configured profile and dynamic enabled challenge count',()=>{
  const sql=read('supabase/migrations/202609180006_v2_reusable_challenge_profiles.sql')
  assert.match(sql,/profile_round int/)
  assert.match(sql,/select count\(\*\) into max_round from public\.cw_v2_challenge_runtime where enabled/)
  assert.match(sql,/g\.current_round>=max_round/)
  assert.match(sql,/if profile_round=1 then/)
  assert.match(sql,/elsif profile_round=2 then/)
  assert.match(sql,/'max_round',max_round/)
})

test('player, wall and facilitator prefer runtime max_round',()=>{
  const play=read('src/v2/V2Play.jsx')
  const wall=read('src/v2/V2Wall.jsx')
  const fac=read('src/v2/V2Facilitator.jsx')
  assert.match(play,/state\.game\.max_round\|\|V2_CHALLENGE_COUNT/)
  assert.match(wall,/g\.max_round\|\|V2_CHALLENGE_COUNT/)
  assert.match(fac,/g\.max_round\|\|V2_CHALLENGE_COUNT/)
})

test('simulator can fall back to the reusable profile for a newly added reto',()=>{
  const sim=read('src/v2/V2Simulator.jsx')
  assert.match(sim,/const profileOf=/)
  assert.match(sim,/const simPath=/)
  assert.match(sim,/SIM_PATHS\[studentId\]\?\.\[profileOf\(round\)\]/)
})


test('challenge manifests declare non-secret point weights',()=>{
  const candidate={...CHALLENGE_TEMPLATE,id:'score-demo'}
  assert.deepEqual(validateChallengeRegistry([candidate]),[])
  assert.equal(Object.values(candidate.points).reduce((a,b)=>a+Number(b),0),100)
})
