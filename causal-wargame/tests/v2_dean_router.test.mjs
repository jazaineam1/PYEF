import {readDeanSources} from './helpers/dean-sources.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read=p=>readFileSync(p,'utf8')
test('Copa routing is conditional on a real server-active tournament',()=>{
 const src=read('src/v2/dean-route.js')
 assert.match(src,/legacyOverride/)
 assert.match(src,/legacy=1/)
 assert.match(src,/state\?\.available===true/)
 assert.match(src,/AbortController/)
 assert.match(src,/return false/)
 assert.match(src,/location\.replace/)
 for(const [path,role] of [['src/v2-play.jsx','student'],['src/v2-facilitator.jsx','teacher'],['src/v2-wall.jsx','wall']]){
  assert.match(read(path),new RegExp("mountV2\\('"+role+"'\\)"))
 }
})
test('Classic V2 remains an explicit fallback and a way to create Dean Cup',()=>{
 const gate=read('src/v2/dean-route.js')
 for(const component of ['V2Play.jsx','V2Wall.jsx','V2Facilitator.jsx'])assert.ok(gate.includes(component))
 assert.match(read('src/v2/V2Facilitator.jsx'),/Administrar nueva Copa/)
 assert.match(read('src/v2/V2Facilitator.jsx'),/Abrir Copa del Decano/)
})
test('Teacher board uses authenticated selected game, not fixed FUTUROS code',()=>{
 const ui=readDeanSources()
 assert.match(ui,/function useBoard\(token='',enabled=true,gameCode=code\)/)
 assert.match(ui,/game_code:gameCode/)
 assert.match(ui,/useBoard\('',!!teacher,game\)/)
 assert.match(ui,/\[token,enabled,gameCode\]/)
})
test('Course has one clear instructor explanation per phase',()=>{
 const ui=readDeanSources()
 for(const phase of ['lobby','exams','rector','survey','causal','final','finished'])assert.ok(ui.includes('"'+phase+'": {'),phase)
 assert.match(ui,/function DeanGuidance/)
 assert.match(ui,/role="teacher"/)
 assert.match(ui,/role="wall"/)
 assert.match(ui,/No hay micro-pasos obligatorios|no hay micro-pasos obligatorios/i)
})
