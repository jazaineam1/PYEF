import test from 'node:test'
import assert from 'node:assert/strict'
import{readFileSync}from'node:fs'
import{enabledChallenges}from'../src/v2/challenge-registry.js'

const read=p=>readFileSync(p,'utf8')

test('student evidence is one visible page with no tabs',()=>{
  const visual=read('src/v2/VisualTools.jsx')
  const lab=read('src/v2/PythonEvidenceLab.jsx')
  assert.doesNotMatch(visual,/EvidenceTabs/)
  assert.doesNotMatch(visual,/role="tablist"/)
  assert.doesNotMatch(lab,/v2-python-step-tabs/)
  assert.match(lab,/v2-python-all-steps/)
  assert.match(lab,/TODO EN ESTA PÁGINA/)
})

test('player shows score, rank and a non-clickable phase line',()=>{
  const play=read('src/v2/V2Play.jsx')
  assert.match(play,/function StudentProgress/)
  assert.match(play,/TU PUNTAJE/)
  assert.match(play,/POSICIÓN/)
  assert.match(play,/PHASES/)
  assert.match(play,/v2-single-step-page/)
})

test('wall makes individual top 3 and checkpoint scoring primary',()=>{
  const wall=read('src/v2/V2Wall.jsx')
  assert.match(wall,/function TopThree/)
  assert.match(wall,/TOP 3/)
  assert.match(wall,/Puntaje individual acumulado/)
  assert.match(wall,/function CheckpointBoard/)
  assert.match(wall,/Laboratorio/)
  assert.match(wall,/Pregunta de cierre/)
  assert.match(wall,/hasta \+30 pts/)
})

test('current team economic value remains server-gated until close or reveal',()=>{
  const sql=read('supabase/migrations/202609180003_v2_causal_money_modeling.sql')
  assert.match(sql,/reveal_current:=g\.status in \('closed','reveal','teaching','microcheck','finished'\)/)
  assert.match(sql,/'round_value_cop',case when reveal_current/)
  assert.match(sql,/if reveal_current then[\s\S]*into decisions/)
})

test('enabled retos keep one simple WOW and one understanding check each',()=>{
  const retos=enabledChallenges()
  assert.equal(retos.length,3)
  assert.ok(retos.every(r=>r.wow&&r.takeaway&&r.checkQuestion))
  assert.ok(retos.every(r=>Array.isArray(r.checkOptions)&&r.checkOptions.length===3))
})

test('mobile CSS supports one-page phases and top-three wall',()=>{
  const css=read('src/v2/styles.css')
  assert.match(css,/V2\.3 · one-page student phases/)
  assert.match(css,/v2-student-progress/)
  assert.match(css,/v2-wall-top3/)
  assert.match(css,/v2-wall-checkpoint-grid/)
})
