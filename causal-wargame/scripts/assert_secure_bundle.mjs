import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = 'dist'
const marker = 'DEMO_GROUND_TRUTH_DO_NOT_SHIP_7XQ9'
let found = false
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.(js|html|css|json)$/.test(name) && readFileSync(p, 'utf8').includes(marker)) {
      console.error(`SECURITY FAIL: demo ground truth marker found in secure bundle: ${p}`)
      found = true
    }
  }
}
walk(root)
if (found) process.exit(1)
console.log('secure bundle check: OK (demo ground truth absent)')
