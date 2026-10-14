import test from'node:test'
import assert from'node:assert/strict'
import{readFileSync}from'node:fs'
import{SIM_PLAYERS,SIM_PATHS}from'../src/v2/simulator-fixtures.js'
import{enabledChallenges}from'../src/v2/challenge-registry.js'

test('teacher simulator contains a deterministic path for every student and all six missions',()=>{
  const challenges=enabledChallenges()
  assert.equal(SIM_PLAYERS.length,4)
  assert.equal(challenges.length,6)
  for(const p of SIM_PLAYERS)for(const c of challenges){
    const path=SIM_PATHS[p.id][c.order]
    assert.ok(path?.initial,`${p.name} mission ${c.order} initial`)
    assert.ok(path?.revision,`${p.name} mission ${c.order} revision`)
    assert.ok(path?.noteInitial)
    assert.ok(path?.noteRevision)
  }
})

test('simulator exposes individual journey, team map and adaptive authoring views',()=>{
  const src=readFileSync('src/v2/V2Simulator.jsx','utf8')
  for(const label of ['Experiencia de un estudiante','Camino de cada estudiante','Cómo agregar retos','JourneyTimeline','TeacherMap','AdaptabilityPanel','StudentStage'])assert.match(src,new RegExp(label))
  assert.match(src,/phase\.id==='lab'/)
  assert.match(src,/phase\.id==='reveal'/)
})

test('simulated learner sees simple idea before technical name and glossary',()=>{
  const src=readFileSync('src/v2/V2Simulator.jsx','utf8')
  assert.match(src,/Primero, en palabras simples/)
  assert.match(src,/Después se nombra/)
  assert.match(src,/function Glossary/)
  assert.match(src,/Puntaje visible/)
})

test('teacher simulator completes Python locally without live player API',()=>{
  const sim=readFileSync('src/v2/V2Simulator.jsx','utf8'),lab=readFileSync('src/v2/PythonEvidenceLab.jsx','utf8')
  assert.match(sim,/EvidenceLab[^>]*simulation/)
  assert.match(lab,/if\(simulation\)/)
  assert.match(lab,/setLocalComplete\(true\)/)
  assert.match(lab,/pending&&!simulation/)
})
