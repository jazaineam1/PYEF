import test from'node:test'
import assert from'node:assert/strict'
import{readFile}from'node:fs/promises'

const revealUrl=new URL('../src/components/RoleReveal.jsx',import.meta.url)
const playUrl=new URL('../src/play.jsx',import.meta.url)

test('role reveal stays emoji-first and does not fetch raster role art',async()=>{
  const source=await readFile(revealUrl,'utf8')
  assert.equal(source.includes('role-art'),false)
  assert.equal(source.includes('<img'),false)
  assert.equal(source.includes('functionsBaseUrl'),false)
  assert.match(source,/role-avatar-emoji/)
  assert.match(source,/Cuatro responsabilidades núcleo/)
})

test('participant entrypoint loads canonical role visual stylesheet',async()=>{
  const source=await readFile(playUrl,'utf8')
  assert.match(source,/role-visual\.css/)
  assert.equal(source.includes('role-art.css'),false)
})
