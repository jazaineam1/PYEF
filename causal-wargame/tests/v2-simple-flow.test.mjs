import test from'node:test'
import assert from'node:assert/strict'
import{V2_MISSION,V2_ROUNDS,V2_CHALLENGE_COUNT}from'../src/v2/content.js'
import{enabledChallenges,validateChallengeRegistry,CHALLENGE_TEMPLATE}from'../src/v2/challenge-registry.js'

test('V2 teaches a simple three-retos causal arc from one registry',()=>{
  assert.equal(V2_CHALLENGE_COUNT,3)
  assert.equal(Object.keys(V2_ROUNDS).length,3)
  assert.equal(enabledChallenges().length,3)
  assert.deepEqual(validateChallengeRegistry(),[])
  assert.match(V2_MISSION.rules.join(' · '),/Prueba tu idea con datos/)
  assert.match(V2_MISSION.rules.join(' · '),/Revisa tu decisión/)
  assert.match(V2_ROUNDS[1].plainConcept,/Predecir/)
  assert.match(V2_ROUNDS[2].plainConcept,/grupos/)
  assert.match(V2_ROUNDS[3].plainConcept,/promedio/)
})

test('V2 participant flow is driven by reusable challenge templates',async()=>{
  const fs=await import('node:fs')
  const play=fs.readFileSync(new URL('../src/v2/V2Play.jsx',import.meta.url),'utf8')
  assert.doesNotMatch(play,/Líder de Modelos|Analista Causal|Líder de Experimentos|mercado de apoyo/i)
  assert.match(play,/V2_CHALLENGE_COUNT/)
  assert.match(play,/template==='cohort-selection'/)
  assert.match(play,/template==='recommendation'/)
  assert.match(play,/template==='segment-policy'/)
  assert.match(play,/EvidenceLab/)
  assert.match(play,/PASO 3 · REVISA TU DECISIÓN/)
  assert.match(play,/PASO 4 · DECIDAN JUNTOS/)
})

test('challenge template makes a new reto declarative and validates required fields',()=>{
  const candidate={...CHALLENGE_TEMPLATE,id:'demo',enabled:true}
  assert.deepEqual(validateChallengeRegistry([candidate]),[])
  assert.equal(candidate.journey.length>=6,true)
  assert.ok(candidate.template)
  assert.ok(candidate.labKey)
})

test('V2 primary game result remains economic value, not points',async()=>{
  const fs=await import('node:fs')
  const play=fs.readFileSync(new URL('../src/v2/V2Play.jsx',import.meta.url),'utf8')
  assert.match(play,/VALOR/)
  assert.match(play,/incremental_value_cop/)
  assert.match(play,/currency:'COP'/)
  assert.doesNotMatch(play,/>SCORE</)
  assert.doesNotMatch(play,/ pts/)
})
