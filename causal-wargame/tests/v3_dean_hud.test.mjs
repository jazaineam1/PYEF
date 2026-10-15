import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const jsx = readFileSync('src/v2/dean/hud/DeanHud.jsx', 'utf8')
const css = readFileSync('src/v2/dean/hud/dean-hud.css', 'utf8')
test('mini-wall preserves Board ordering and removes empty rooms from rows', () => {
  assert.match(jsx, /filter\(\(group\) => Number\(group\.members\) > 0\)/)
  assert.match(jsx, /fair_score \?\? -1\)[\s\S]*coverage_pct/)
  assert.match(jsx, /coverage_pct[\s\S]*room_no/)
  assert.match(jsx, /ranked\.slice\(0, 5\)/)
  assert.match(jsx, /emptyCount.*salas vacías/)
})
test('own team has a non-color highlight and leader marker', () => {
  assert.match(jsx, /is-own/)
  assert.match(jsx, /isOwn && <em>TÚ<\/em>/)
  assert.match(jsx, /index === 0 \? '♛'/)
  assert.match(css, /\.dean-hud-row\.is-own\{[^}]*border-color:var\(--dean-focus\)/)
})
test('position movement is transient and polite announcements are throttled', () => {
  assert.match(jsx, /Date\.now\(\) \+ 4000/)
  assert.match(jsx, />= 15000/)
  assert.match(jsx, /aria-live="polite"/)
  assert.match(jsx, /is-moving/)
  assert.match(css, /prefers-reduced-motion:reduce/)
})
