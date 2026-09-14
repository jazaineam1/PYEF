import test from'node:test'
import assert from'node:assert/strict'
import{coreResponsibilityStatus,dataCoversExperiments,teamMode}from'../src/team-roles.js'

const roster=roles=>roles.map((role_code,i)=>({id:String(i+1),display_name:`P${i+1}`,role_code}))

test('equipo de tres activa doble sombrero Modelos + Experimentos',()=>{
  const r=roster(['business','data','context'])
  assert.equal(dataCoversExperiments(r),true)
  assert.equal(teamMode(r).kind,'three')
  assert.equal(teamMode(r).fallbackExperiment,true)
  const experiment=coreResponsibilityStatus(r).find(x=>x.code==='integrator')
  assert.equal(experiment.covered,true)
  assert.equal(experiment.coveredBy,'data')
})

test('equipo de cuatro tiene un dueño por responsabilidad',()=>{
  const r=roster(['business','data','context','integrator'])
  assert.equal(teamMode(r).kind,'four')
  assert.equal(teamMode(r).fallbackExperiment,false)
  assert.equal(coreResponsibilityStatus(r).every(x=>x.covered),true)
})

test('quinta persona es copiloto opcional y no cambia el objetivo 4/4',()=>{
  const r=roster(['business','data','context','integrator','risk'])
  const mode=teamMode(r)
  assert.equal(mode.kind,'five')
  assert.equal(mode.coreTarget,4)
  assert.equal(coreResponsibilityStatus(r).length,4)
})
