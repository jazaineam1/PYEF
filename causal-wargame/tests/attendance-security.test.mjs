import test from'node:test'
import assert from'node:assert/strict'
import{readFile}from'node:fs/promises'

const migration=await readFile(new URL('../supabase/migrations/202609160002_four_roles_five_teams_rejoin.sql',import.meta.url),'utf8')
const bots=await readFile(new URL('../supabase/migrations/202609160003_four_role_rehearsal_bots.sql',import.meta.url),'utf8')
const api=await readFile(new URL('../src/lib/api.js',import.meta.url),'utf8')
const join=await readFile(new URL('../supabase/functions/join-game/index.ts',import.meta.url),'utf8')

function plan(n){return Array.from({length:5},(_,i)=>Math.floor(n/5)+(i<n%5?1:0))}

test('five-team attendance plans stay balanced',()=>{
  assert.deepEqual(plan(20),[4,4,4,4,4])
  assert.deepEqual(plan(19),[4,4,4,4,3])
  assert.deepEqual(plan(18),[4,4,4,3,3])
  assert.deepEqual(plan(17),[4,4,3,3,3])
  assert.deepEqual(plan(16),[4,3,3,3,3])
  assert.deepEqual(plan(15),[3,3,3,3,3])
})

test('SQL assignment is five teams by four role waves',()=>{
  assert.match(migration,/position between 1 and 5/)
  assert.match(migration,/array\['Fisher','Neyman','Rubin','Pearl','Robins'\]/)
  assert.match(migration,/\('business',1\),\('data',2\),\('context',3\),\('integrator',4\)/)
  assert.doesNotMatch(bots,/\('risk',5\)/)
})

test('participant identity survives logout while session token is cleared',()=>{
  assert.match(api,/PARTICIPANT_KEY/)
  assert.match(api,/getParticipantKey/)
  assert.match(api,/name==='join-game'/)
  const clearBody=api.match(/export function clearPlayerSession\(\)\{([\s\S]*?)\n\}/)?.[1]||''
  assert.doesNotMatch(clearBody,/removeItem\(PARTICIPANT_KEY\)/)
})

test('join edge forwards stable participant key to database',()=>{
  assert.match(join,/p_client_key:b\.participant_key\|\|null/)
  assert.match(migration,/player_rejoined/)
  assert.match(migration,/Ese nombre ya está registrado/)
  assert.match(migration,/La composición de equipos ya está cerrada/)
  assert.match(migration,/n_humans>=20/)
})
