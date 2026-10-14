import test from'node:test'
import assert from'node:assert/strict'
import{V2_MISSION,V2_ROUNDS,V2_CHALLENGE_COUNT}from'../src/v2/content.js'
import{enabledChallenges,validateChallengeRegistry,CHALLENGE_TEMPLATE}from'../src/v2/challenge-registry.js'

test('V2 teaches a six-mission causal arc from one registry',()=>{
  assert.equal(V2_CHALLENGE_COUNT,6)
  assert.equal(Object.keys(V2_ROUNDS).length,6)
  assert.equal(enabledChallenges().length,6)
  assert.deepEqual(validateChallengeRegistry(),[])
  assert.match(V2_MISSION.title,/CAMPUS/)
  assert.match(V2_ROUNDS[1].plainConcept,/Predecir/)
  assert.match(V2_ROUNDS[2].concept,/ATE/)
  assert.match(V2_ROUNDS[3].concept,/DAG/)
  assert.match(V2_ROUNDS[4].concept,/DML/)
  assert.match(V2_ROUNDS[5].concept,/CATE/)
  assert.match(V2_ROUNDS[6].concept,/Causal Forest|EconML/)
})

test('participant flow supports every reusable interaction template',async()=>{
  const fs=await import('node:fs'),play=fs.readFileSync(new URL('../src/v2/V2Play.jsx',import.meta.url),'utf8')
  for(const x of ["template==='cohort-selection'","template==='single-choice'","template==='multi-select'","PolicyChoice","EvidenceLab","REVISA TU DECISIÓN","DECIDAN JUNTOS"])assert.match(play,new RegExp(x))
  assert.doesNotMatch(play,/mes gratis|renovaci[oó]n/i)
})

test('challenge template is declarative and requires human definitions',()=>{
  const candidate={...CHALLENGE_TEMPLATE,id:'demo',enabled:true}
  assert.deepEqual(validateChallengeRegistry([candidate]),[])
  assert.ok(candidate.journey.length>=8)
  assert.ok(candidate.glossary[0].definition)
})

test('learning points stay separate from academic impact',async()=>{
  const fs=await import('node:fs'),play=fs.readFileSync(new URL('../src/v2/V2Play.jsx',import.meta.url),'utf8')
  assert.match(play,/TU PUNTAJE/)
  assert.match(play,/round_points/)
  assert.match(play,/IMPACTO ACADÉMICO/)
  assert.doesNotMatch(play,/currency:'COP'/)
})
