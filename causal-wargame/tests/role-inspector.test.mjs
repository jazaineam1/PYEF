import test from'node:test'
import assert from'node:assert/strict'
import{readFile}from'node:fs/promises'

const inspectorUrl=new URL('../src/components/RoleInspector.jsx',import.meta.url)
const roleLabUrl=new URL('../src/components/RoleLab.jsx',import.meta.url)
const facilitatorUrl=new URL('../src/pages/SecureFacilitatorLearning.jsx',import.meta.url)

test('facilitator inspector switches through four core roles and rounds without backend writes',async()=>{
  const source=await readFile(inspectorUrl,'utf8')
  assert.match(source,/CORE_ROLE_CODES/)
  assert.match(source,/\[1,2,3,4\]/)
  assert.match(source,/RoleLab key=.*preview/)
  assert.equal(source.includes("invoke("),false)
  assert.match(source,/cuatro especialidades núcleo/)
})

test('role lab preview hides side effects and fuses policy into Decision in R4',async()=>{
  const source=await readFile(roleLabUrl,'utf8')
  assert.match(source,/RoleLab\(\{state,preview=false\}\)/)
  assert.match(source,/!preview&&<><TeamContribution/)
  assert.match(source,/DecisionPolicyLab/)
  assert.match(source,/if\(role==='business'\)return round>=4\?DecisionPolicyLab:DecisionCanvas/)
})

test('facilitator console exposes five-team attendance planning and 4\/4 coverage',async()=>{
  const source=await readFile(facilitatorUrl,'utf8')
  assert.match(source,/RoleInspector/)
  assert.match(source,/Probar roles y herramientas/)
  assert.match(source,/Cobertura 0–4/)
  assert.match(source,/4–4–3–3–3/)
  assert.match(source,/Equipos listos<\/span><strong>\{state\.teams\.filter\(t=>t\.locked\)\.length\}\/5/)
})
