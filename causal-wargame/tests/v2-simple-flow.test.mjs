import test from'node:test'
import assert from'node:assert/strict'
import{V2_MISSION,V2_ROUNDS}from'../src/v2/content.js'

test('V2 teaches the causal arc in exactly three missions',()=>{
  assert.equal(Object.keys(V2_ROUNDS).length,3)
  assert.match(V2_MISSION.rules.join(' · '),/Python/)
  assert.match(V2_MISSION.rules.join(' · '),/Revisa tu decisión/)
  assert.match(V2_ROUNDS[1].concept,/Predicción/)
  assert.match(V2_ROUNDS[2].concept,/Confusión/)
  assert.match(V2_ROUNDS[3].concept,/ATE/)
  assert.match(V2_ROUNDS[3].concept,/CATE/)
})

test('V2 participant flow is decide, model, revise, deliberate and reveal without roles',async()=>{
  const fs=await import('node:fs')
  const play=fs.readFileSync(new URL('../src/v2/V2Play.jsx',import.meta.url),'utf8')
  assert.doesNotMatch(play,/Líder de Modelos|Analista Causal|Líder de Experimentos|mercado de apoyo/i)
  assert.match(play,/No hay roles/)
  assert.match(play,/PASO 1 · DECIDE TÚ|PASO 1 · PROPÓN TÚ/)
  assert.match(play,/PASO 3 · REVISA TU DECISIÓN/)
  assert.match(play,/PASO 4 · DECIDAN JUNTOS/)
  assert.match(play,/EvidenceLab/)
  assert.match(play,/ValueBoard/)
})

test('V2 primary game result is economic value, not a points leaderboard',async()=>{
  const fs=await import('node:fs')
  const play=fs.readFileSync(new URL('../src/v2/V2Play.jsx',import.meta.url),'utf8')
  assert.match(play,/VALOR/)
  assert.match(play,/incremental_value_cop/)
  assert.match(play,/currency:'COP'/)
  assert.doesNotMatch(play,/>SCORE</)
  assert.doesNotMatch(play,/ pts/)
})
