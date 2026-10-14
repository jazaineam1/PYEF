import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read=p=>readFileSync(p,'utf8')
test('Visual causal atlas is sourced to six-node DGP and limited to three teaching phases',()=>{
 const ui=read('src/v2/dean-cup.jsx')
 assert.equal((ui.match(/<DeanCausalAtlas phase=/g)||[]).length,3)
 assert.match(ui,/dgp_version==='zip_dgp_2026'/)
 assert.match(ui,/<DeanGuidance phase=\{state.phase\}\/?>/)
 const atlas=read('src/v2/DeanCausalAtlas.jsx')
 for(const phrase of ['H · PGA anterior','Z · Complejidad','B · Bienestar','X₁ · Estudio',
    'S · Sueño','U · Fatiga','Y · Nota','do(B = 4 h)','ATE =','CATE =']){
     assert.ok(atlas.includes(phrase),phrase)
 }
 assert.match(atlas,/phase==='survey'/)
 assert.match(atlas,/phase==='causal'/)
 assert.match(atlas,/no una causa primitiva|no una causa primitiva/i)
})
test('Projector stays legible in mobile and accessible without requiring clicks',()=>{
 const style=read('src/v2/dean-causal-atlas.css')
 assert.match(style,/@media\(max-width:760px\)/)
 assert.match(style,/overflow-x:auto/)
 const atlas=read('src/v2/DeanCausalAtlas.jsx')
 assert.match(atlas,/role="img"/)
 assert.match(atlas,/aria-pressed=\{lens===k\}/)
 assert.match(atlas,/if\(!meta\)return null/)
})
