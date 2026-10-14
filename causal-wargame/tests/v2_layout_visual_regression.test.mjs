import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync}from'node:fs'
const css=readFileSync(new URL('../src/v2/arcade.css',import.meta.url),'utf8')
const play=readFileSync(new URL('../src/v2/V2Play.jsx',import.meta.url),'utf8')
const styles=readFileSync(new URL('../src/v2/styles.css',import.meta.url),'utf8')

test('Four header children occupy four grid tracks, no wrapped logout row',()=>{
 assert.match(play,/<header className="v2-header v2-header-compact">/)
 assert.match(css,/grid-template-columns:minmax\(150px,1fr\) minmax\(0,1\.4fr\) auto 42px/)
 assert.match(css,/grid-template-columns:minmax\(0,1fr\) auto 38px/)
 assert.match(play,/aria-label="Salir de la partida"/)
})
test('Mission briefing is compact and fully readable with optional context',()=>{
 assert.match(play,/className="v2-campaign-brief"/)
 assert.match(play,/<details className="v2-campaign-context">/)
 assert.match(play,/<p>\{r\.case\}<\/p>/)
 assert.match(css,/v2-player-compact \.v2-mission\.compact h1/)
 assert.match(css,/\.v2-campaign-map\{[\s\S]*grid-column:1\/-1/)
})
test('Action button stays visible above screen bottom, even with tall cards',()=>{
 assert.match(styles,/\.v2-footer\{position:fixed/)
 assert.match(play,/v2-active-game/)
 assert.match(css,/\.v2-shell\.v2-active-game>\.v2-footer\{display:none\}/)
 assert.match(css,/v2-player-compact \.v2-sticky[\s\S]*position:fixed/)
 assert.match(css,/bottom:max\(12px,env\(safe-area-inset-bottom,0px\)\)/)
 assert.match(css,/v2-player-compact \.v2-single-step-page\{[\s\S]*animation:none;transform:none/)
 assert.match(css,/padding-bottom:calc\(134px \+ env\(safe-area-inset-bottom,0px\)\)/)
})
test('Mobile compact layout respects action bar and mission title',()=>{
 assert.match(css,/@media\(max-width:790px\)/)
 assert.match(css,/@media\(max-width:480px\)/)
 assert.match(css,/v2-header-compact \.v2-header-center\{display:none\}/)
 assert.match(css,/v2-mission\.compact\.v2-campaign-scene\{[\s\S]*grid-template-columns:1fr/)
})
