import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {V2_CHALLENGES} from '../src/v2/challenge-registry.js'
const file=x=>readFileSync(new URL('../src/v2/'+x,import.meta.url),'utf8')
const play=file('V2Play.jsx'),arcade=file('V2Arcade.jsx'),sim=file('V2Simulator.jsx'),practice=file('V2Practice.jsx'),wall=file('V2Wall.jsx'),css=file('arcade.css')

test('All six academic challenges remain enabled, intact and server scored',()=>{
 assert.deepEqual(V2_CHALLENGES.filter(x=>x.enabled).map(x=>x.order),[1,2,3,4,5,6])
 assert.match(play,/invoke\('v2-submit',\{action,round,payload\}\)/)
 assert.match(play,/invoke\('v2-submit',\{action:'check',round,answer\}\)/)
 assert.match(play,/team&&sel.length!==10/)
})
test('Six levels use real and distinct game mechanics rather than a quiz template',()=>{
 for(const name of ['CohortArena','StrategyArena','DagArena','ResourceArena','BossArena','TeamArena','RevealArena','ModelBattleResults']){
  assert.match(arcade,new RegExp('export function '+name+'\\('))
  assert.match(play,new RegExp('<'+name+'(?: |/|>)'))
 }
 assert.match(arcade,/pga_previo/)
 assert.match(arcade,/complejidad/)
 assert.match(arcade,/horas_estudio_post/)
 assert.match(arcade,/tutorias_post/)
 assert.match(arcade,/aria-pressed=/)
 assert.match(arcade,/position.*\d|left:n\.x/)
})
test('No pre-reveal EconML outcomes or invented scores',()=>{
 assert.match(arcade,/if\(!verifiedV2EconML\)/)
 assert.match(play,/state\.game\.round===6&&<ModelBattleResults/)
 assert.match(arcade,/no prueba identificación causal/)
 assert.match(arcade,/El servidor valida el resultado/)
})
test('Offline six-level practice is honest, local and independent of server',()=>{
 assert.match(practice,/V2_CHALLENGE_COUNT/)
 assert.match(practice,/localStorage\.setItem/)
 assert.match(practice,/No se envían evidencias ni se suman puntos/)
 assert.doesNotMatch(practice,/\binvoke\(/)
 assert.match(sim,/view==='practice'/)
 assert.match(sim,/get\('practice'\)==='1'/)
 assert.match(play,/v2-simulator\.html\?practice=1/)
})
test('Wall projects actual ranked humans as avatar characters',()=>{
 assert.match(wall,/agentFor\(x\.player_id\|\|x\.name\)/)
 assert.match(wall,/x\.points/)
})
test('Keyboard accessibility, mobile DAG and reduced motion remain supported',()=>{
 assert.match(css,/:focus-visible/)
 assert.match(css,/overflow-x:auto/)
 assert.match(css,/max-width:700px/)
 assert.match(css,/prefers-reduced-motion:reduce/)
 assert.match(arcade,/aria-label="Tablero DAG causal interactivo"/)
})
