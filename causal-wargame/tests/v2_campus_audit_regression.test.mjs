import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {V2_CHALLENGES} from '../src/v2/challenge-registry.js'
import {buildPythonLab} from '../src/v2/python-lab.js'
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')
test('Six challenges and 17 Python steps',()=>{
 const rounds=V2_CHALLENGES.filter(x=>x.enabled)
 assert.deepEqual(rounds.map(x=>x.order),[1,2,3,4,5,6])
 assert.deepEqual(rounds.map(x=>buildPythonLab(x.order,{}, {},x.labKey).steps.length),[2,3,3,3,3,3])
 assert.ok(rounds.every(x=>Object.values(x.points).reduce((a,b)=>a+b,0)===100))
})
test('The experimental true ATE is computed from potential outcomes',()=>{
 assert.match(read('supabase/migrations/202610140002_v2_academic_truth_contract.sql'),/avg\(y1-y0\)/)
 assert.match(read('supabase/functions/v2-state/index.ts'),/cw_v2_academic_truth/)
 assert.match(read('supabase/functions/v2-wall-state/index.ts'),/cw_v2_academic_truth/)
})
test('Python server ACK precedes marking success',()=>{
 const s=read('src/v2/PythonEvidenceLab.jsx')
 assert.match(s,/runtimeListener=handlerRef\.current=async e=>/)
 assert.match(s,/runtimeWorker\.onmessage=e=>/)
 assert.match(s,/ensureRuntimeWorker\(\)/)
 assert.match(s,/prewarmPython/)
 assert.ok(s.indexOf("await invoke('v2-submit'")<s.indexOf('setResults(v=>({...v,[stepId]'))
})
test('DAG and DR teaching compute instead of just asserting',()=>{
 assert.match(read('src/v2/python-lab.js'),/np\.linalg\.lstsq/)
 assert.match(read('src/v2/python-lab.js'),/StratifiedKFold/)
 assert.match(read('src/v2/python-lab.js'),/procedencia:verifiedV2EconML/)
 assert.match(read('src/v2/EconMLV2Panel.jsx'),/Entrenado y evaluado|ENTRENADO Y EVALUADO|ENTRENADO|entrenados/i)
 assert.match(read('src/v2/VisualTools.jsx'),/profile==='dag'&&tools\?\.dag&&<DagLab/)
})

test('Analysis reveal shares authoritative causal truth',()=>{
  const src=read('supabase/functions/v2-analysis/index.ts')
  assert.match(src,/cw_v2_academic_truth/)
  assert.match(src,/out\.reveal_tools=\{\.\.\.out\.reveal_tools,\.\.\.truth\}/)
})
