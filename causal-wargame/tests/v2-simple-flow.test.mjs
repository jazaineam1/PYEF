import test from'node:test'
import assert from'node:assert/strict'
import{V2_MISSION,V2_ROUNDS}from'../src/v2/content.js'

test('V2 teaches one causal idea per round with one repeated interaction loop',()=>{
  assert.equal(Object.keys(V2_ROUNDS).length,4)
  assert.deepEqual(V2_MISSION.rules,['Mira sólo tu parte del caso','Envía tu propuesta individual','Habla con tu equipo','Tomen una única decisión','Descubran qué estaba oculto'])
  assert.match(V2_ROUNDS[1].concept,/Predicción/)
  assert.match(V2_ROUNDS[2].concept,/Confusión/)
  assert.match(V2_ROUNDS[3].concept,/Randomización/)
  assert.match(V2_ROUNDS[4].concept,/CATE/)
})

test('V2 participant copy does not require role vocabulary or market rules',async()=>{
  const fs=await import('node:fs')
  const play=fs.readFileSync(new URL('../src/v2/V2Play.jsx',import.meta.url),'utf8')
  assert.doesNotMatch(play,/Líder de Modelos|Analista Causal|Líder de Experimentos|mercado de apoyo/i)
  assert.match(play,/No hay roles/)
  assert.match(play,/PASO 1 · DECIDE TÚ|PASO 1 · DISEÑA TÚ|PASO 1 · PROPÓN TÚ/)
  assert.match(play,/PASO 2 · HABLEN/)
  assert.match(play,/PASO 3 · DECIDAN JUNTOS/)
})
