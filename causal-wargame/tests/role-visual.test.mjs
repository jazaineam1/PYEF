import test from'node:test'
import assert from'node:assert/strict'
import{readFile}from'node:fs/promises'

const revealUrl=new URL('../src/components/RoleReveal.jsx',import.meta.url)
const playUrl=new URL('../src/play.jsx',import.meta.url)
const onboardingUrl=new URL('../src/onboarding.js',import.meta.url)

test('role reveal is action-first and keeps only four core specialties',async()=>{
  const source=await readFile(revealUrl,'utf8')
  assert.equal(source.includes('role-art'),false)
  assert.equal(source.includes('<img'),false)
  assert.equal(source.includes('functionsBaseUrl'),false)
  assert.match(source,/role-avatar-emoji/)
  assert.match(source,/PUEDES/)
  assert.match(source,/NO PUEDES CONCLUIR SOLO/)
  assert.match(source,/ENTREGAS AL EQUIPO/)
  assert.match(source,/No juegas solo/)
  assert.match(source,/CORE_ROLE_CODES/)
})

test('simulation mission explains two futures and collaboration before diagnostics',async()=>{
  const source=await readFile(onboardingUrl,'utf8')
  assert.match(source,/Futuro 1 · Intervenimos/)
  assert.match(source,/Futuro 2 · No intervenimos/)
  assert.match(source,/debes hablar con tus compañeros/i)
  assert.match(source,/Comparte un hallazgo/)
  for(const role of ['business','data','context','integrator']){
    assert.match(source,new RegExp(`${role}:\\{can:`))
  }
})

test('participant entrypoint loads canonical role visual stylesheet',async()=>{
  const source=await readFile(playUrl,'utf8')
  assert.match(source,/role-visual\.css/)
  assert.equal(source.includes('role-art.css'),false)
})
