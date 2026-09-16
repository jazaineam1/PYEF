import test from'node:test'
import assert from'node:assert/strict'
import{readFile}from'node:fs/promises'

const base=await readFile(new URL('../supabase/migrations/202609160002_four_roles_five_teams_rejoin.sql',import.meta.url),'utf8')
const adaptive=await readFile(new URL('../supabase/migrations/202609160005_adaptive_attendance_topology.sql',import.meta.url),'utf8')
const runtime=await readFile(new URL('../supabase/migrations/202609160007_adaptive_topology_runtime_fix.sql',import.meta.url),'utf8')
const api=await readFile(new URL('../src/lib/api.js',import.meta.url),'utf8')
const join=await readFile(new URL('../supabase/functions/join-game/index.ts',import.meta.url),'utf8')

test('SQL topology scales to seven teams but never adds a fifth new role',()=>{
  assert.match(adaptive,/team_target between 1 and 7/)
  assert.match(adaptive,/max_humans between 1 and 28/)
  assert.match(adaptive,/array\['Fisher','Neyman','Rubin','Pearl','Robins','Imbens','Rosenbaum'\]/)
  assert.match(adaptive,/\('business',1\),\('data',2\),\('context',3\),\('integrator',4\)/)
  assert.doesNotMatch(adaptive,/\('risk',5\)/)
})

test('lobby roster is rebalanced before the first lesson and then frozen',()=>{
  assert.match(adaptive,/cw_rebalance_lobby_roster/)
  assert.match(adaptive,/ceil\(coalesce\(p_humans,0\)\/4\.0\)/)
  assert.match(runtime,/g\.current_round=1 and not g\.roster_locked/)
  assert.match(runtime,/update public\.cw_games set roster_locked=true/)
  assert.match(runtime,/p_action='rebalance'/)
  assert.match(runtime,/p_action='prune_offline'/)
})

test('participant identity survives logout while session token is cleared',()=>{
  assert.match(api,/PARTICIPANT_KEY/)
  assert.match(api,/getParticipantKey/)
  assert.match(api,/name==='join-game'/)
  const clearBody=api.match(/export function clearPlayerSession\(\)\{([\s\S]*?)\n\}/)?.[1]||''
  assert.doesNotMatch(clearBody,/removeItem\(PARTICIPANT_KEY\)/)
})

test('join edge forwards stable participant key and backend protects duplicates/rejoin',()=>{
  assert.match(join,/p_client_key:b\.participant_key\|\|null/)
  assert.match(base,/cw_player_identities/)
  assert.match(adaptive,/player_rejoined/)
  assert.match(adaptive,/Ese nombre ya está registrado/)
  assert.match(adaptive,/La lista ya está cerrada/)
  assert.match(adaptive,/n_humans>=g\.max_humans/)
})
