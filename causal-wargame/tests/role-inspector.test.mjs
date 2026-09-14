import test from'node:test'
import assert from'node:assert/strict'
import{readFile}from'node:fs/promises'

const inspectorUrl=new URL('../src/components/RoleInspector.jsx',import.meta.url)
const roleLabUrl=new URL('../src/components/RoleLab.jsx',import.meta.url)
const facilitatorUrl=new URL('../src/pages/SecureFacilitatorLearning.jsx',import.meta.url)

test('facilitator inspector can switch through all roles and rounds without backend writes',async()=>{
  const source=await readFile(inspectorUrl,'utf8')
  assert.match(source,/\['business','data','context','integrator','risk'\]/)
  assert.match(source,/\[1,2,3,4\]/)
  assert.match(source,/RoleLab key=.*preview/)
  assert.equal(source.includes("invoke("),false)
})

test('role lab preview hides contribution and market side effects',async()=>{
  const source=await readFile(roleLabUrl,'utf8')
  assert.match(source,/RoleLab\(\{state,preview=false\}\)/)
  assert.match(source,/!preview&&<><TeamContribution/)
  assert.match(source,/StrategyPolicyLab/)
  assert.match(source,/round>=4\?StrategyPolicyLab:DecisionCanvas/)
})

test('facilitator console exposes the role inspector after login',async()=>{
  const source=await readFile(facilitatorUrl,'utf8')
  assert.match(source,/RoleInspector/)
  assert.match(source,/Probar roles y herramientas/)
})
