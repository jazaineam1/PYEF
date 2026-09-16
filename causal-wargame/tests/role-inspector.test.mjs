import test from'node:test'
import assert from'node:assert/strict'
import{readFile}from'node:fs/promises'

const inspectorUrl=new URL('../src/components/RoleInspector.jsx',import.meta.url)
const simulatorUrl=new URL('../src/components/TeamSimulator.jsx',import.meta.url)
const roleLabUrl=new URL('../src/components/RoleLab.jsx',import.meta.url)
const facilitatorUrl=new URL('../src/pages/SecureFacilitatorLearning.jsx',import.meta.url)

test('facilitator inspector is now the full-team simulator',async()=>{
  const inspector=await readFile(inspectorUrl,'utf8')
  const simulator=await readFile(simulatorUrl,'utf8')
  assert.match(inspector,/TeamSimulator/)
  assert.match(simulator,/Misión/)
  assert.match(simulator,/Diagnóstico/)
  assert.match(simulator,/Ronda 1/)
  assert.match(simulator,/4 roles/)
  assert.match(simulator,/Herramientas/)
  assert.match(simulator,/Mesa/)
  assert.match(simulator,/Decisión/)
  assert.match(simulator,/Reveal \+ cierre/)
  assert.match(simulator,/RoleLab key=.*preview/)
  assert.equal(simulator.includes("invoke("),false)
})

test('role lab preview hides backend side effects while preserving real tools',async()=>{
  const source=await readFile(roleLabUrl,'utf8')
  assert.match(source,/RoleLab\(\{state,preview=false\}\)/)
  assert.match(source,/!preview&&<><TeamContribution/)
  assert.match(source,/DecisionPolicyLab/)
})

test('facilitator console embeds team simulator and removes expert-call administration',async()=>{
  const source=await readFile(facilitatorUrl,'utf8')
  assert.match(source,/Simulador docente de equipo completo/)
  assert.match(source,/Simular un equipo completo/)
  assert.doesNotMatch(source,/ExpertAvailabilityPanel/)
  assert.doesNotMatch(source,/ExpertQueue/)
  assert.doesNotMatch(source,/Llamada al Capítulo<\/h2>/)
  assert.match(source,/attendancePlan\(hc\)/)
  assert.match(source,/15 → 4 equipos: 4–4–4–3/)
  assert.match(source,/17 → 5 equipos: 4–4–3–3–3/)
  assert.match(source,/28 → 7 equipos completos: 4–4–4–4–4–4–4/)
  assert.match(source,/Sesión heredada detectada/)
})
