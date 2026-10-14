import test from'node:test'
import assert from'node:assert/strict'
import{readFileSync}from'node:fs'
import{buildPythonLab}from'../src/v2/python-lab.js'
import{validateChallengeRegistry,CHALLENGE_TEMPLATE,enabledChallenges}from'../src/v2/challenge-registry.js'

const read=p=>readFileSync(p,'utf8')

test('a new mission can reuse a backend data profile with a different Python lab',()=>{
  const candidate={...CHALLENGE_TEMPLATE,id:'r7',order:7,enabled:true,profileRound:2,labKey:'dml',template:'single-choice',decisionOptions:[['a','A'],['b','B']]}
  assert.deepEqual(validateChallengeRegistry([candidate]),[])
  const lab=buildPythonLab(7,{},{team_tools:{observational_rows:[]}},'dml')
  assert.match(lab.title,/Double Machine Learning/)
  assert.equal(lab.steps.length,3)
})

test('embedded Python receives labKey instead of assuming a round number',()=>{
  const component=read('src/v2/PythonEvidenceLab.jsx')
  const visuals=read('src/v2/VisualTools.jsx')
  assert.match(component,/buildPythonLab\(round,state,analysis,labKey\)/)
  assert.match(visuals,/labKey=\{labKey\}/)
})

test('academic runtime separates reusable data profile, interaction template and lab key',()=>{
  const sql=read('supabase/migrations/202610140001_v2_academic_causal_curriculum.sql')
  assert.match(sql,/profile_round/)
  assert.match(sql,/template/)
  assert.match(sql,/lab_key/)
  assert.match(sql,/cfg\.template='single-choice'/)
  assert.match(sql,/cfg\.template='multi-select'/)
  assert.match(sql,/cfg\.profile_round=1/)
  assert.match(sql,/cfg\.profile_round=2/)
})

test('six enabled missions reuse only three data profiles',()=>{
  const missions=enabledChallenges()
  assert.equal(missions.length,6)
  assert.deepEqual([...new Set(missions.map(x=>x.profileRound))].sort(),[1,2,3])
  assert.equal(new Set(missions.map(x=>x.labKey)).size,6)
})

test('player, wall and facilitator prefer runtime max_round',()=>{
  const play=read('src/v2/V2Play.jsx'),wall=read('src/v2/V2Wall.jsx'),fac=read('src/v2/V2Facilitator.jsx')
  assert.match(play,/state\.game\.max_round\|\|V2_CHALLENGE_COUNT/)
  assert.match(wall,/g\.max_round\|\|V2_CHALLENGE_COUNT/)
  assert.match(fac,/g\.max_round\|\|V2_CHALLENGE_COUNT/)
})

test('challenge manifests declare 100 learning points and a glossary',()=>{
  for(const c of enabledChallenges()){
    assert.equal(Object.values(c.points).reduce((a,b)=>a+Number(b),0),100)
    assert.ok(c.glossary.length>0)
    assert.ok(c.glossary.every(x=>x.term&&x.full&&x.definition))
  }
})
