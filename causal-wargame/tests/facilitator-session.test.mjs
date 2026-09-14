import test from'node:test'
import assert from'node:assert/strict'
import{readFile}from'node:fs/promises'

const apiUrl=new URL('../src/lib/api.js',import.meta.url)

test('invalid facilitator leaderboard session clears stale auth and reloads',async()=>{
  const source=await readFile(apiUrl,'utf8')
  assert.match(source,/kind==='facilitator'&&name==='leaderboard'&&invalidSession/)
  assert.match(source,/clearFacilitatorSession\(\)/)
  assert.match(source,/window\.location\.reload\(\)/)
})
