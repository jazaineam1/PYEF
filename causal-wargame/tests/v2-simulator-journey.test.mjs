import test from'node:test'
import assert from'node:assert/strict'
import{readFileSync}from'node:fs'
import{SIM_PLAYERS,SIM_PATHS}from'../src/v2/simulator-fixtures.js'
import{enabledChallenges}from'../src/v2/challenge-registry.js'

test('teacher simulator contains a deterministic beginning-to-end path for every student and reto',()=>{
  const challenges=enabledChallenges()
  assert.equal(SIM_PLAYERS.length,4)
  for(const p of SIM_PLAYERS){
    for(const c of challenges){
      const path=SIM_PATHS[p.id][c.order]
      assert.ok(path?.initial,p.name+' reto '+c.order+' initial')
      assert.ok(path?.revision,p.name+' reto '+c.order+' revision')
      assert.ok(path?.noteInitial)
      assert.ok(path?.noteRevision)
    }
  }
})

test('simulator exposes individual journey, team map and adaptive authoring views',()=>{
  const src=readFileSync('src/v2/V2Simulator.jsx','utf8')
  for(const label of ['Experiencia de un estudiante','Camino de cada estudiante','Cómo agregar retos','JourneyTimeline','TeacherMap','AdaptabilityPanel']){
    assert.match(src,new RegExp(label))
  }
  assert.match(src,/StudentStage/)
  assert.match(src,/SIM_PATHS/)
  assert.match(src,/phase\.id==='lab'/)
  assert.match(src,/phase\.id==='reveal'/)
})

test('simulated student sees scored check and simple concept before the technical name',()=>{
  const src=readFileSync('src/v2/V2Simulator.jsx','utf8')
  assert.match(src,/phase\.id==='check'/)
  assert.match(src,/30 PUNTOS/)
  assert.match(src,/phase\.id==='wait_revision'/)
  assert.match(src,/Puntaje visible/)
  assert.match(src,/Primero, en palabras simples/)
  assert.match(src,/Después se nombra/)
  assert.doesNotMatch(src,/Vocabulario para profundizar, no obligatorio/)
})


test('teacher simulator completes the Python lab locally without touching live player API',()=>{
  const sim=readFileSync('src/v2/V2Simulator.jsx','utf8')
  const lab=readFileSync('src/v2/PythonEvidenceLab.jsx','utf8')
  assert.match(sim,/EvidenceLab[^>]*simulation/)
  assert.match(lab,/if\(simulation\)/)
  assert.match(lab,/setLocalComplete\(true\)/)
  assert.match(lab,/pending&&!simulation/)
})
