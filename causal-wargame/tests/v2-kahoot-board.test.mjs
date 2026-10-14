import test from'node:test'
import assert from'node:assert/strict'
import{readFileSync}from'node:fs'
import{enabledChallenges}from'../src/v2/challenge-registry.js'
const read=p=>readFileSync(p,'utf8')

test('student evidence is one visible page with no tabs',()=>{
  const visual=read('src/v2/VisualTools.jsx'),lab=read('src/v2/PythonEvidenceLab.jsx')
  assert.doesNotMatch(visual,/EvidenceTabs/)
  assert.doesNotMatch(lab,/v2-python-step-tabs/)
  assert.match(lab,/v2-python-all-steps/)
  assert.match(lab,/TODO EN ESTA PÁGINA/)
})

test('player shows score, rank and a non-clickable phase line',()=>{
  const play=read('src/v2/V2Play.jsx')
  for(const x of ['function StudentProgress','TU PUNTAJE','POSICIÓN','PHASES','v2-single-step-page'])assert.match(play,new RegExp(x))
})

test('wall makes individual top 3 and checkpoint scoring primary',()=>{
  const wall=read('src/v2/V2Wall.jsx')
  for(const x of ['function TopThree','TOP 3','Puntaje individual acumulado','function CheckpointBoard','Experimento Python','Batalla contra el guardián','score.check','score.team'])assert.ok(wall.includes(x))
})

test('six missions keep a WOW, scored check and explicit definitions',()=>{
  const retos=enabledChallenges()
  assert.equal(retos.length,6)
  assert.ok(retos.every(r=>r.wow&&r.takeaway&&r.checkQuestion))
  assert.ok(retos.every(r=>r.checkOptions.length===3))
  assert.ok(retos.every(r=>r.glossary.every(g=>g.term&&g.full&&g.definition)))
  for(const r of retos){
    const defined=new Set(r.glossary.map(g=>g.term.toLowerCase()))
    for(const term of r.advancedTerms||[])assert.ok(defined.has(term.toLowerCase()),`${r.id}: falta definir ${term}`)
  }
})

test('learning score and academic impact are visibly separate',()=>{
  const wall=read('src/v2/V2Wall.jsx'),play=read('src/v2/V2Play.jsx')
  assert.match(wall,/IMPACTO ACADÉMICO ESTIMADO/)
  assert.match(play,/TU PUNTAJE/)
  assert.match(play,/IMPACTO ACADÉMICO/)
  assert.doesNotMatch(wall,/currency:'COP'/)
})
