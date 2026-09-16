import test from'node:test'
import assert from'node:assert/strict'
import{readFile}from'node:fs/promises'

const play=await readFile(new URL('../src/pages/SecurePlayV6.jsx',import.meta.url),'utf8')
const wall=await readFile(new URL('../src/pages/SecureWallLearning.jsx',import.meta.url),'utf8')

test('participant sees simulation mission before the pre diagnostic',()=>{
  assert.match(play,/function MissionBriefing/)
  assert.match(play,/ANTES DE MEDIR NADA · ESTA ES LA SIMULACIÓN/)
  assert.match(play,/No son una ronda, no son el juego y no dan puntos/)
  assert.match(play,/if\(stage==='pre'&&!started\)return <MissionBriefing/)
})

test('team collaboration is explicit during play',()=>{
  assert.match(play,/Hablen primero/)
  assert.match(play,/cada integrante debe compartir al menos un hallazgo/i)
  assert.match(play,/Bloquear decisión del equipo/)
})

test('wall no longer advertises the obsolete five-role classroom topology',()=>{
  assert.doesNotMatch(wall,/4 salas × 5 especialistas/)
  assert.doesNotMatch(wall,/CINCO MIRADAS/)
  assert.match(wall,/CUATRO EVIDENCIAS, UNA DECISIÓN/)
  assert.match(wall,/CORE_ROLE_CODES/)
})
