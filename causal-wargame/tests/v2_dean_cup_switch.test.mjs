import test from 'node:test'
import assert from 'node:assert/strict'
import{readFileSync}from'node:fs'
const read=p=>readFileSync(p,'utf8')
test('V2 default entries switch to Dean Cup when an existing tournament is available',()=>{
 const gate=read('src/v2/DeanModeGate.jsx')
 assert.match(gate,/state\?\.available===true/)
 assert.match(gate,/dean-play\.html/)
 assert.match(gate,/dean-wall\.html/)
 assert.match(gate,/dean-teacher\.html/)
 assert.match(gate,/window\.location\.replace/)
 assert.match(gate,/getPlayerGameCode/)
 assert.match(gate,/getFacilitatorGameCode/)
})
test('Legacy fallback is explicit and V1 is unchanged',()=>{
 const gate=read('src/v2/DeanModeGate.jsx')
 assert.match(gate,/mode'\)==='legacy'/)
 assert.match(gate,/Keep the old V2 available/)
 assert.match(read('src/v2-play.jsx'),/role="student"/)
 assert.match(read('src/v2-wall.jsx'),/role="wall"/)
 assert.match(read('src/v2-facilitator.jsx'),/role="teacher"/)
 assert.match(read('src/v2-facilitator.jsx'),/Crear o gestionar Copa del Decano/)
})
