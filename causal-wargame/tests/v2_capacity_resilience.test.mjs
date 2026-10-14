import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')
const migration=read('supabase/migrations/202610140003_v2_30_capacity_staged.sql')

test('V1 capacity defaults remain unchanged',()=>{
  assert.match(read('src/attendance.js'),/MAX_HUMANS=28/)
  assert.match(migration,/DEFAULT max_humans=28 for V1/)
  assert.match(migration,/cw_v2_facilitator_action/)
})
test('V2 supports eight teams without exceeding four seats',()=>{
  assert.match(migration,/max_humans BETWEEN 1 AND 30/)
  assert.match(migration,/team_target BETWEEN 1 AND 8/)
  assert.match(migration,/position BETWEEN 1 AND 8/)
  assert.match(migration,/capacity_30/)
  assert.match(migration,/t\.position between 1 and \(case when g\.max_humans>28 then 8 else 7 end\)/)
  const sizes=Array.from({length:8},(_,i)=>Math.floor(30/8)+(i<30%8?1:0))
  assert.deepEqual(sizes,[4,4,4,4,4,4,3,3])
})
test('Only V2 facilitator can request larger classroom',()=>{
  const ui=read('src/v2/V2Facilitator.jsx')
  assert.match(ui,/action:'capacity_30'/)
  assert.match(ui,/Preparar hasta 30 participantes/)
})
test('Pyodide is prepared once and Matplotlib loads only on demand',()=>{
  const worker=read('src/v2/pyodide.worker.js')
  assert.match(worker,/let initPromise=null/)
  assert.match(worker,/if\(initPromise\)return initPromise/)
  assert.match(worker,/await runtime\.loadPackage\(\['numpy','pandas','scikit-learn'\]\)/)
  assert.match(worker,/await pyodide\.loadPackage\('matplotlib'\)/)
  assert.doesNotMatch(worker,/loadPackage\(\['numpy','pandas','scipy','scikit-learn','matplotlib'\]\)/)
})
test('Student fallback is explicit about not saving competitive points',()=>{
  const ui=read('src/v2/V2Play.jsx')
  assert.match(ui,/MODO CONTINGENCIA/)
  assert.match(ui,/no registra puntos/)
  assert.match(ui,/v2-simulator\.html/)
})
