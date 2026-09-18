import test from 'node:test'
import assert from 'node:assert/strict'
import{readFileSync}from'node:fs'

const read=p=>readFileSync(p,'utf8')

test('player evidence is presented as a compact tabbed deck',()=>{
  const visual=read('src/v2/VisualTools.jsx')
  assert.match(visual,/function EvidenceTabs/)
  assert.match(visual,/v2-evidence-tabs/)
  assert.match(visual,/Una herramienta a la vez/)
})

test('player shows all-team decisions, cumulative score and WOW reveal',()=>{
  const play=read('src/v2/V2Play.jsx')
  assert.match(play,/function ScoreMini/)
  assert.match(play,/ASÍ DECIDIERON TODOS/)
  assert.match(play,/function WowCard/)
  assert.match(play,/GIRO WOW/)
})

test('projector has Kahoot-like scoreboard and team decision board',()=>{
  const wall=read('src/v2/V2Wall.jsx')
  assert.match(wall,/function WallScore/)
  assert.match(wall,/acumulado por equipo/)
  assert.match(wall,/function WallDecisions/)
  assert.match(wall,/PROGRESO EN VIVO/)
  assert.match(wall,/CIERRE DE RONDA/)
})

test('current round score and decisions are server-gated until close or reveal',()=>{
  const sql=read('supabase/migrations/202609180002_v2_kahoot_round_board.sql')
  assert.match(sql,/reveal_current:=g\.status in \('closed','reveal','teaching','microcheck','finished'\)/)
  assert.match(sql,/'round_score',case when reveal_current/)
  assert.match(sql,/if reveal_current then[\s\S]*into decisions/)
  assert.match(sql,/'scoreboard',coalesce\(public_board->'teams'/)
})

test('each round has a plausible counterintuitive WOW explanation',()=>{
  const content=read('src/v2/content.js')
  const wow=(content.match(/wow:'/g)||[]).length
  const reality=(content.match(/reality:'/g)||[]).length
  assert.equal(wow,4)
  assert.equal(reality,4)
  assert.match(content,/score más alto no tiene por qué/)
  assert.match(content,/cambia de signo/)
  assert.match(content,/regla menos “inteligente”/)
  assert.match(content,/ATE positivo/)
})

test('compact CSS keeps mobile customer cards in two columns and wall in a dense grid',()=>{
  const css=read('src/v2/styles.css')
  assert.match(css,/v2-player-compact/)
  assert.match(css,/v2-grid\.customers[^}]*grid-template-columns:repeat\(2/)
  assert.match(css,/v2-wall-main-grid/)
  assert.match(css,/v2-scoreboard-mini/)
})
