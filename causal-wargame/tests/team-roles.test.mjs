import test from'node:test'
import assert from'node:assert/strict'
import{coreResponsibilityStatus,dataCoversExperiments,teamMode}from'../src/team-roles.js'

const roster=roles=>roles.map((role_code,i)=>({id:String(i+1),display_name:`P${i+1}`,role_code}))

test('equipo de tres activa doble sombrero Modelos + Experimentos',()=>{
  const r=roster(['business','data','context'])
  assert.equal(dataCoversExperiments(r),true)
  assert.equal(teamMode(r).kind,'three')
  assert.equal(teamMode(r).fallbackExperiment,true)
  assert.equal(teamMode(r).coreTarget,4)
  const status=coreResponsibilityStatus(r)
  const experiment=status.find(x=>x.code==='integrator')
  assert.equal(status.length,4)
  assert.equal(experiment.covered,true)
  assert.equal(experiment.coveredBy,'data')
  assert.equal(status.every(x=>x.covered),true)
})

test('equipo de cuatro tiene una persona por cada especialidad núcleo',()=>{
  const r=roster(['business','data','context','integrator'])
  const mode=teamMode(r)
  const status=coreResponsibilityStatus(r)
  assert.equal(mode.kind,'four')
  assert.equal(mode.coreTarget,4)
  assert.equal(mode.fallbackExperiment,false)
  assert.equal(status.length,4)
  assert.equal(status.every(x=>x.covered),true)
})

test('un quinto rol histórico no cambia el objetivo actual 4/4',()=>{
  const r=roster(['business','data','context','integrator','risk'])
  const mode=teamMode(r)
  const status=coreResponsibilityStatus(r)
  assert.equal(mode.kind,'legacy-extra')
  assert.equal(mode.coreTarget,4)
  assert.equal(status.length,4)
  assert.equal(status.every(x=>x.covered),true)
})
