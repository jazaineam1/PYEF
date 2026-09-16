import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {MICROCHECKS,ROLES} from '../src/content.js'
import {IDENTIFICATION_COMPASS,LESSONS,ROBUSTNESS_CARDS} from '../src/learning.js'

test('the classroom architecture exposes exactly five core specialties',()=>{
  assert.equal(ROLES.length,5)
  assert.ok(ROLES.every(r=>r.core===true))
  assert.equal(ROLES.find(r=>r.code==='risk')?.label,'Política y Riesgo')
  assert.equal(ROLES.find(r=>r.code==='business')?.label,'Líder de Decisión')
})

test('harder microchecks preserve backend-compatible correct answer values',()=>{
  assert.ok(MICROCHECKS[1].options.includes('B'))
  assert.ok(MICROCHECKS[2].options.includes('Los grupos no son comparables desde antes'))
  assert.ok(MICROCHECKS[3].options.includes('6 puntos porcentuales'))
  assert.ok(MICROCHECKS[4].options.includes('Priorizar segmentos con efecto positivo y evitar el segmento negativo'))
})

test('advanced layer covers overlap, useful precision and refutation without a fifth round',()=>{
  assert.ok(LESSONS[2].methods.some(x=>/overlap|positividad/i.test(x)))
  assert.ok(LESSONS[3].methods.some(x=>/MDE|potencia/i.test(x)))
  assert.ok(LESSONS[4].methods.some(x=>/refut|stress/i.test(x)))
  assert.deepEqual(Object.keys(LESSONS).map(Number),[1,2,3,4])
})

test('robustness cards are deterministic and have one declared correct option',()=>{
  for(const round of [2,4]){
    const card=ROBUSTNESS_CARDS[round]
    assert.ok(card)
    assert.ok(card.options.some(([value])=>value===card.correct))
    assert.equal(card.options.filter(([value])=>value===card.correct).length,1)
  }
})

test('identification compass includes experimental, quasi-experimental and honest non-identification paths',()=>{
  const strategies=IDENTIFICATION_COMPASS.map(x=>x.strategy).join(' | ')
  assert.match(strategies,/RCT/)
  assert.match(strategies,/RDD/)
  assert.match(strategies,/DiD/)
  assert.match(strategies,/IV/)
  assert.match(strategies,/No prometer causalidad/)
})

test('active role lab renders overlap, stress testing and MDE controls',async()=>{
  const source=await readFile(new URL('../src/components/RoleLab.jsx',import.meta.url),'utf8')
  assert.match(source,/OVERLAP \/ POSITIVIDAD/)
  assert.match(source,/ROBUSTNESS_CARDS/)
  assert.match(source,/MDE aprox\./)
  assert.match(source,/Efecto mínimo útil/)
})
