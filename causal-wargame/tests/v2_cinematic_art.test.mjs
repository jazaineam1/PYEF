import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync,statSync} from 'node:fs'
const source=name=>readFileSync(new URL('../src/v2/'+name,import.meta.url),'utf8')
const art=source('V2Art.js')
const arcade=source('V2Arcade.jsx')
const play=source('V2Play.jsx')
const css=source('arcade.css')
const slugs=['hero','mission-1','mission-2','mission-3','mission-4','mission-5','mission-6','victory']

test('Eight game illustrations are local WEBP with no expiring CDN dependencies',()=>{
  for(const slug of slugs){
    const path=new URL('../src/v2/art/'+slug+'.webp',import.meta.url)
    const header=readFileSync(path).subarray(0,12)
    assert.equal(header.toString('ascii',0,4),'RIFF',slug)
    assert.equal(header.toString('ascii',8,12),'WEBP',slug)
    assert.ok(statSync(path).size<80000,'Unexpectedly large art asset '+slug)
    assert.match(art,new RegExp(slug.replace('-','-')+'\\.webp'))
  }
  assert.doesNotMatch(art,/media\.canva\.com|exp=|osig=/)
})
test('Lobby, mission and reveal art are part of real V2 UI, not a static moodboard',()=>{
  assert.match(play,/className="v2-join-illustration"/)
  assert.match(play,/className="v2-lobby-art"/)
  assert.match(play,/className="v2-character v2-character-illustrated"/)
  assert.match(arcade,/className="v2-arcade-scene-art"/)
  assert.match(arcade,/V2_GAME_ART\.victory/)
})
test('Mission image is small enough for the gameplay and submit dock stays visible',()=>{
  assert.match(css,/v2-player-compact \.v2-character\.v2-character-illustrated[\s\S]*?width:132px/)
  assert.match(css,/@media\(max-width:480px\)/)
  assert.match(css,/v2-arcade-intro>\.v2-arcade-scene-art[\s\S]*?position:absolute/)
  assert.match(css,/v2-shell\.v2-active-game>\.v2-footer\{display:none\}/)
  assert.match(css,/position:fixed;bottom:max\(12px,env\(safe-area-inset-bottom,0px\)\)/)
})
test('Visual art never changes classroom scoring or model evidence',()=>{
  assert.match(play,/invoke\('v2-submit',\{action,round,payload\}\)/)
  assert.match(arcade,/if\(!verifiedV2EconML\)/)
})

test('Playable practice enters game stage directly, without teacher dashboard wrapper',()=>{
 const simulator=source('V2Simulator.jsx')
 const practice=source('V2Practice.jsx')
 assert.match(simulator,/if\(view==='practice'\)return <main className="v2-shell v2-immersive-practice">/)
 assert.match(practice,/className="v2-arcade-mission-stage"/)
 assert.match(practice,/className="v2-arcade-mission-stage-art"/)
 assert.doesNotMatch(practice,/className="v2-alert hint"/)
 assert.match(css,/v2-arcade-mission-stage:after/)
 assert.match(css,/v2-immersive-canvas \.v2-arcade-avatar/)
})
