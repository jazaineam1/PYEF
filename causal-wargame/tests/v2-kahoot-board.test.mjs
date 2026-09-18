import test from 'node:test'
import assert from 'node:assert/strict'
import{readFileSync}from'node:fs'
import{enabledChallenges}from'../src/v2/challenge-registry.js'

const read=p=>readFileSync(p,'utf8')

test('player evidence remains a compact tabbed deck',()=>{
  const visual=read('src/v2/VisualTools.jsx')
  assert.match(visual,/function EvidenceTabs/)
  assert.match(visual,/v2-evidence-tabs/)
  assert.match(visual,/La evidencia visual orienta/)
})

test('player shows all-team decisions, cumulative COP value and WOW reveal',()=>{
  const play=read('src/v2/V2Play.jsx')
  assert.match(play,/function ValueBoard/)
  assert.match(play,/ASÍ DECIDIERON TODOS/)
  assert.match(play,/incremental acumulado/)
  assert.match(play,/function WowCard/)
  assert.match(play,/GIRO WOW/)
})

test('projector has compact monetary board and team decision board',()=>{
  const wall=read('src/v2/V2Wall.jsx')
  assert.match(wall,/function WallValue/)
  assert.match(wall,/VALOR INCREMENTAL/)
  assert.match(wall,/function WallDecisions/)
  assert.match(wall,/PROGRESO EN VIVO/)
  assert.match(wall,/CIERRE DE MISIÓN/)
})

test('current mission money and decisions remain server-gated until close or reveal',()=>{
  const sql=read('supabase/migrations/202609180003_v2_causal_money_modeling.sql')
  assert.match(sql,/reveal_current:=g\.status in \('closed','reveal','teaching','microcheck','finished'\)/)
  assert.match(sql,/'round_value_cop',case when reveal_current/)
  assert.match(sql,/if reveal_current then[\s\S]*into decisions/)
  assert.match(sql,/'total_value_cop'/)
  assert.match(sql,/'scoreboard',coalesce\(public_board->'teams'/)
})

test('enabled retos have causal WOWs tied to real reasoning errors',()=>{
  const retos=enabledChallenges()
  assert.equal(retos.length,3)
  assert.ok(retos.every(r=>r.wow&&r.takeaway))
  const content=retos.map(r=>r.wow+' '+r.takeaway).join(' ')
  assert.match(content,/alta probabilidad de renovar/)
  assert.match(content,/comparación cruda puede ser negativa/)
  assert.match(content,/destruir valor/)
})

test('compact CSS keeps mobile cards and supports wider COP values',()=>{
  const css=read('src/v2/styles.css')
  assert.match(css,/v2-player-compact/)
  assert.match(css,/v2-grid\.customers[^}]*grid-template-columns:repeat\(2/)
  assert.match(css,/v2-wall-main-grid/)
  assert.match(css,/V2\.1 · causal modeling/)
  assert.match(css,/v2-result\.money/)
})
