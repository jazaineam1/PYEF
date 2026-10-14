import test from 'node:test'
import assert from 'node:assert/strict'
import benchmark from '../src/v2/econml-v2-verified.json' with {type:'json'}
import {econmlV2Ready,verifiedV2EconML} from '../src/v2/econml-v2-data.js'
import {readFileSync} from 'node:fs'
test('Real model benchmark is available, from academic V2 not banking V1',()=>{
  assert.equal(benchmark.status,'verified','Do not merge before real EconML run publishes output')
  assert.equal(econmlV2Ready,true)
  assert.equal(verifiedV2EconML.provenance.dataset,'campus-academic-experiment-v2')
  assert.equal(verifiedV2EconML.provenance.n,2000)
  assert.equal(verifiedV2EconML.provenance.holdout_rows,500)
  assert.equal(verifiedV2EconML.segments.length,5)
  for(const item of verifiedV2EconML.segments){
    for(const name of ['t_learner','dr_learner','causal_forest'])assert.ok(Number.isFinite(item[name]))
  }
})
test('V2 EconML Python step is not fictional and fails closed when missing provenance',()=>{
  const src=readFileSync('src/v2/python-lab.js','utf8')
  const report=readFileSync('src/v2/EconMLV2Panel.jsx','utf8')
  assert.match(src,/procedencia:verifiedV2EconML/)
  assert.match(src,/Benchmark V2 no verificado/)
  assert.match(report,/EconML no se está ejecutando en el navegador/)
  assert.doesNotMatch(report,/mes gratis|renovación|cliente bancario/i)
})
