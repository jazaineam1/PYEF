import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {MICROCHECKS,ROLES} from '../src/content.js'

const learningSource=await readFile(new URL('../src/learning.js',import.meta.url),'utf8')
const roleLabSource=await readFile(new URL('../src/components/RoleLab.jsx',import.meta.url),'utf8')

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
  assert.match(learningSource,/Positividad \/ overlap/)
  assert.match(learningSource,/MDE \/ potencia/)
  assert.match(learningSource,/Refutación \/ stress test/)
  assert.doesNotMatch(learningSource,/\n5:\s*\{/)
})

test('robustness cards stay deterministic',()=>{
  assert.match(learningSource,/2:\{title:'Stress test · soporte'/)
  assert.match(learningSource,/correct:'restrict'/)
  assert.match(learningSource,/4:\{title:'Stress test · placebo'/)
  assert.match(learningSource,/correct:'review'/)
})

test('identification compass includes experimental, quasi-experimental and honest non-identification paths',()=>{
  assert.match(learningSource,/Experimento aleatorio \(RCT\)/)
  assert.match(learningSource,/Regresión discontinua \(RDD\)/)
  assert.match(learningSource,/Diferencias en diferencias \(DiD\)/)
  assert.match(learningSource,/Variable instrumental \(IV\)/)
  assert.match(learningSource,/No prometer causalidad/)
})

test('active role lab renders overlap, stress testing and MDE controls',()=>{
  assert.match(roleLabSource,/OVERLAP \/ POSITIVIDAD/)
  assert.match(roleLabSource,/ROBUSTNESS_CARDS/)
  assert.match(roleLabSource,/MDE aprox\./)
  assert.match(roleLabSource,/Efecto mínimo útil/)
})
