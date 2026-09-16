import test from'node:test'
import assert from'node:assert/strict'
import{coreResponsibilityStatus,dataCoversExperiments,teamMode}from'../src/team-roles.js'

const roster=roles=>roles.map((role_code,i)=>({id:String(i+1),display_name:`P${i+1}`,role_code}))

test('equipo de tres activa doble sombrero Modelos + Experimentos sin inventar las otras especialidades',()=>{
  const r=roster(['business','data','context'])
  assert.equal(dataCoversExperiments(r),true)
  assert.equal(teamMode(r).kind,'three')
  assert.equal(teamMode(r).fallbackExperiment,true)
  assert.equal(teamMode(r).coreTarget,5)
  const status=coreResponsibilityStatus(r)
  const experiment=status.find(x=>x.code==='integrator')
  const policy=status.find(x=>x.code==='risk')
  assert.equal(experiment.covered,true)
  assert.equal(experiment.coveredBy,'data')
  assert.equal(policy.covered,false)
})

test('equipo de cuatro conserva cinco responsabilidades y reconoce la especialidad ausente',()=>{
  const r=roster(['business','data','context','integrator'])
  const mode=teamMode(r)
  const status=coreResponsibilityStatus(r)
  assert.equal(mode.kind,'four')
  assert.equal(mode.coreTarget,5)
  assert.equal(mode.fallbackExperiment,false)
  assert.equal(status.length,5)
  assert.equal(status.find(x=>x.code==='risk').covered,false)
})

test('equipo de cinco tiene una persona por cada especialidad núcleo',()=>{
  const r=roster(['business','data','context','integrator','risk'])
  const mode=teamMode(r)
  const status=coreResponsibilityStatus(r)
  assert.equal(mode.kind,'five')
  assert.equal(mode.coreTarget,5)
  assert.equal(status.length,5)
  assert.equal(status.every(x=>x.covered),true)
})
