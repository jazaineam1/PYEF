import test from'node:test'
import assert from'node:assert/strict'
import{readFile}from'node:fs/promises'
import{CORE_ROLE_CODES}from'../src/codex.js'
import{ROLE_ROUND_BRIEFS,DECISION_RULE}from'../src/role-interdependence.js'

const play=await readFile(new URL('../src/pages/SecurePlayV6.jsx',import.meta.url),'utf8')
const market=await readFile(new URL('../src/components/QuestMarket.jsx',import.meta.url),'utf8')
const simulator=await readFile(new URL('../src/components/TeamSimulator.jsx',import.meta.url),'utf8')
const migration=await readFile(new URL('../supabase/migrations/202609160009_role_interdependence_gate.sql',import.meta.url),'utf8')

test('every round gives every core role private information, dependency question and deliverable',()=>{
  for(const round of [1,2,3,4]){
    for(const role of CORE_ROLE_CODES){
      const b=ROLE_ROUND_BRIEFS[round]?.[role]
      assert.ok(b,`missing R${round} ${role}`)
      assert.ok(b.private.length>30,`private info too weak R${round} ${role}`)
      assert.ok(Array.isArray(b.needs)&&b.needs.length>=1,`dependencies missing R${round} ${role}`)
      assert.ok(b.ask.length>20,`team question missing R${round} ${role}`)
      assert.ok(b.deliver.length>20,`deliverable missing R${round} ${role}`)
    }
  }
})

test('decision ownership is explicit and participant UI does not give final controls to every role',()=>{
  assert.equal(DECISION_RULE.owner,'business')
  assert.match(play,/isDecisionOwner=state\.player\.role_code==='business'/)
  assert.match(play,/FinalDecisionOwnerNotice/)
  assert.match(play,/4 evidencias → 1 decisión/)
})

test('server migration enforces business-only lock and effective 4\/4 evidence',()=>{
  assert.match(migration,/p\.role_code<>'business'/)
  assert.match(migration,/evidence_coverage<4/)
  assert.match(migration,/role_code in \('business','data','context','integrator'\)/)
  assert.match(migration,/details,coverage,integrator/)
  assert.match(migration,/legacy_topology/)
})

test('expert call is paused in backend and invisible in participant market',()=>{
  assert.match(migration,/set active=false/)
  assert.match(migration,/category='expert'/)
  assert.doesNotMatch(market,/Llamada al Capítulo/)
  assert.doesNotMatch(market,/GraduationCap/)
  assert.match(market,/category!='expert'/)
})

test('full-team simulator exposes all phases and reuses actual role tools',()=>{
  for(const label of ['Misión','Diagnóstico','4 roles','Herramientas','Mesa','Decisión','Reveal + cierre'])assert.ok(simulator.includes(label),label)
  assert.match(simulator,/RoleReveal state=\{state\}/)
  assert.match(simulator,/RoleLab key=.*preview/)
  assert.match(simulator,/Información privada:/)
  assert.match(simulator,/Simular: compartir evidencia/)
  assert.match(simulator,/Esperando 4\/4 evidencias/)
})
