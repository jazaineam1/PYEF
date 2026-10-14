
import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
test('Dean facilitator never uses a stored token for a different URL game',()=>{const s=readFileSync('src/v2/dean-cup.jsx','utf8');assert.match(s,/sessionStorage\.getItem\('df_facilitator_game_code'\)===requestedGame/);assert.match(s,/new URLSearchParams\(location\.search\)\.get\('game'\)/)})
