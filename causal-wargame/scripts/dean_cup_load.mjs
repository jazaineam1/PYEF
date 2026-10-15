#!/usr/bin/env node
// Arnés HTTP Dean QA. El límite recomendado para T0.3b es CW_USERS=1 o 5.
import { readFile, readdir } from 'node:fs/promises'
import { createHash, randomUUID } from 'node:crypto'
import { join, relative } from 'node:path'

const ENV_FILE = 'C:\\Users\\nib1l\\Documents\\diplocopia\\_secrets\\copa-v3.env'
const ROOT = new URL('..', import.meta.url).pathname.replace(/^\//, '').replaceAll('/', '\\')
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const jitter = (min, max) => min + Math.random() * (max - min)
const percentile = (xs, p) => { if (!xs.length) return 0; const a = [...xs].sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor((a.length - 1) * p))] }
const jsonSecretFree = value => JSON.stringify(value).replace(/(token|pin|secret|hash|authorization)[^,}]*/gi, '$1:[REDACTED]')

async function loadEnv() {
  let text
  try { text = await readFile(ENV_FILE, 'utf8') } catch (error) { throw new Error(`No se puede leer el archivo externo (${error.code || 'error'})`) }
  const values = {}
  for (const line of text.split(/\r?\n/)) { const m = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/); if (m) values[m[1]] = m[2].replace(/^['"]|['"]$/g, '') }
  if (!values.CW_BASE_URL) throw new Error('CW_BASE_URL es obligatorio en el archivo externo')
  if (!values.CW_DEAN_GAME || !values.CW_DEAN_PIN) throw new Error('Faltan CW_DEAN_GAME o CW_DEAN_PIN en el archivo externo')
  return values
}
async function allFiles(dir) { const out = []; for (const item of await readdir(dir, { withFileTypes: true })) { const p = join(dir, item.name); if (item.isDirectory()) out.push(...await allFiles(p)); else out.push(p) } return out }
async function assertAllowedGame(code, base) {
  if (!code.startsWith(base) || /^(FUTUROS|FLOWTEST26)$/i.test(code)) throw new Error('Partida fuera de la lista QA permitida')
  const paths = [...await allFiles(join(ROOT, 'scripts')), ...((await import('node:fs/promises')).access(join(ROOT, '.github')).then(async () => allFiles(join(ROOT, '.github', 'workflows'))).catch(() => []))]
  for (const file of paths) { const text = await readFile(file, 'utf8'); if (new RegExp(`\\b${code.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'i').test(text)) throw new Error(`Partida prohibida: el código aparece en ${relative(ROOT, file)}`) }
}
async function call(base, path, body = {}, headers = {}) {
  const started = performance.now(); let response, data, raw = ''
  try { response = await fetch(`${base.replace(/\/$/, '')}/${path}`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) }); raw = await response.text(); try { data = JSON.parse(raw) } catch { data = {} }; return { ok: response.ok, status: response.status, data, raw, ms: performance.now() - started, path } }
  catch (error) { return { ok: false, status: 0, data: { error: error.message }, ms: performance.now() - started, path } }
}
function assert(ok, message, evidence) { if (!ok) throw new Error(`${message}: ${jsonSecretFree(evidence)}`) }
function roomsFor(users, raw) { const rooms = (raw || '').split(',').filter(Boolean).map(Number); if (!rooms.length) return Array.from({ length: users }, (_, i) => 1 + (i % 5)); assert(rooms.length === 5 && rooms.every(x => Number.isInteger(x) && x >= 0 && x <= 6) && rooms.reduce((a, b) => a + b, 0) === users, 'CW_ROOMS debe tener cinco cupos cuya suma sea CW_USERS'); return rooms.flatMap((n, room) => Array.from({ length: n }, () => room + 1)) }
function valuesFor(aliasIndex, exam) { const type = aliasIndex % 4; return type === 0 ? { study: 11.5, sleep: 3.5, wellness: .6 } : type === 1 ? { study: 6, sleep: 7.5, wellness: 2.5 } : type === 2 ? { study: 3.5, sleep: 6, wellness: 2.5 } : { study: 1.5, sleep: 8.5, wellness: 4.8 } }
function record(map, x) { const a = map[x.path] ||= { total: 0, ok: 0, errors: 0, times: [], statuses: {} }; a.total++; a.ok += x.ok ? 1 : 0; a.errors += x.ok ? 0 : 1; a.times.push(x.ms); a.statuses[x.status] = (a.statuses[x.status] || 0) + 1 }

const env = await loadEnv(); const base = env.CW_BASE_URL; const game = String(env.CW_DEAN_RUN_GAME || env.CW_DEAN_GAME).trim().toUpperCase(); const users = Math.max(1, Math.min(30, Number(env.CW_USERS || 5))); const roomList = roomsFor(users, env.CW_ROOMS); await assertAllowedGame(game, env.CW_DEAN_GAME.toUpperCase())
const actions = []; const request = async (path, body, headers) => { const x = await call(base, path, body, headers); actions.push(x); return x }
let login = await request('facilitator-login', { game_code: game, pin: env.CW_DEAN_PIN }); assert(login.ok && login.data?.token, 'Inicio de sesión docente fallido', login)
const teacher = { 'x-facilitator-token': login.data.token }; let r = await request('v2-dean-cup', { action: 'teacher', command: 'create' }, teacher); assert(r.ok, 'Creación idempotente de Copa fallida', r)
const sessions = []; const scoresByRoom = {}
for (let i = 0; i < users; i++) { const token = `${randomUUID()}-${randomUUID()}`; const headers = { 'x-game-token': token }; r = await request('v2-dean-cup', { action: 'join', game_code: game, alias: `QA ${String(i + 1).padStart(2, '0')}`, room: roomList[i] }, headers); assert(r.ok, `Unión del usuario ${i + 1} fallida`, r); sessions.push({ token, headers, room: roomList[i], alias: `QA ${String(i + 1).padStart(2, '0')}` }) }
r = await request('v2-dean-cup', { action: 'join', game_code: game, alias: 'QA EXTRA', room: 1 }, { 'x-game-token': `${randomUUID()}-${randomUUID()}` }); assert(!r.ok, 'Se aceptó un séptimo asiento', r)
r = await request('v2-dean-cup', { action: 'teacher', command: 'next' }, teacher); assert(r.ok, 'Avance a exámenes fallido', r)
let polling = true; const pollers = sessions.map(async s => { while (polling) { await request('v2-dean-cup', { action: 'state', game_code: game }, s.headers); await sleep(jitter(2700, 4000)) } });
await Promise.all(sessions.map(async (s, i) => { scoresByRoom[s.room] ||= []; for (let exam = 1; exam <= 15; exam++) { const v = valuesFor(i, exam); r = await request('v2-dean-cup', { action: 'exam', exam, study: v.study, sleep: v.sleep, wellness: v.wellness }, s.headers); assert(r.ok, `Examen ${exam} de ${s.alias} fallido`, r); if (Number.isFinite(Number(r.data?.score))) scoresByRoom[s.room].push(Number(r.data.score)); if (exam < 15) await sleep(jitter(2000, 8000)) } })); polling = false; await Promise.all(pollers)
for (const phase of Array.from({ length: 4 }, () => 'next')) { r = await request('v2-dean-cup', { action: 'teacher', command: phase }, teacher); assert(r.ok, 'Avance docente fallido', r) }
for (const layer of ['rector', 'survey']) for (const s of sessions) { r = await request('v2-dean-cup', { action: 'export', layer }, s.headers); assert(r.ok, `Exportación ${layer} fallida`, r); const body = String(r.data || ''); assert(!/[\b,](U|Y0|Y1|efecto verdadero)[\b,]/i.test(body), `Fuga causal en exportación ${layer}`, { body: body.slice(0, 120) }) }
r = await request('v2-dean-cup', { action: 'teacher_truth' }, teacher); assert(r.ok, 'Exportación de verdad docente fallida', r)
r = await request('v2-dean-cup', { action: 'ab_generate' }, teacher); assert(r.ok, 'Generación A/B fallida', r)
for (const s of sessions) { r = await request('v2-dean-cup', { action: 'export', layer: 'survey' }, s.headers); assert(r.ok, 'Relectura de exportación observada fallida', r) }
r = await request('v2-dean-cup', { action: 'ab_truth' }, teacher); assert(r.ok, 'Exportación A/B docente fallida', r)
polling = true; const finalPollers = sessions.map(async s => { while (polling) { await request('v2-dean-cup', { action: 'state', game_code: game }, s.headers); await request('v2-dean-cup', { action: 'quiz_state', game_code: game }, s.headers); await sleep(jitter(1450, 2050)) } })
for (let q = 1; q <= 8; q++) { for (const command of q === 1 ? ['start', 'open'] : ['next', 'open']) { r = await request('v2-dean-cup', { action: 'quiz_teacher', command }, teacher); assert(r.ok, `Kahoot ${command} fallido`, r) }; await Promise.all(sessions.map(s => request('v2-dean-cup', { action: 'quiz_submit', question: q, choice: 'a' }, s.headers))); r = await request('v2-dean-cup', { action: 'quiz_teacher', command: 'lock' }, teacher); assert(r.ok, 'Cierre de pregunta fallido', r); r = await request('v2-dean-cup', { action: 'quiz_teacher', command: 'reveal' }, teacher); assert(r.ok, 'Revelación Kahoot fallida', r) }
r = await request('v2-dean-cup', { action: 'quiz_teacher', command: 'next' }, teacher); assert(r.ok, 'Podio Kahoot fallido', r); r = await request('v2-dean-cup', { action: 'quiz_teacher', command: 'finish' }, teacher); assert(r.ok, 'Cierre Kahoot fallido', r); polling = false; await Promise.all(finalPollers)
const finalState = await request('v2-dean-cup', { action: 'state', game_code: game }); assert(finalState.ok, 'Estado final fallido', finalState); const groups = finalState.data?.groups || []; for (const g of groups) { const enrolled = Number(g.members || 0); if (!enrolled) assert(Number(g.exams_completed || 0) === 0 && Number(g.pending_exams || 0) === 0, 'Hay filas para ausentes', g); else { const expected = (scoresByRoom[g.room_no] || []).reduce((a, b) => a + b, 0) / (15 * enrolled); assert(Math.abs(Number(g.fair_score) - expected) < .11, 'fair_score no coincide con suma/(15*inscritos)', { room: g.room_no, expected, actual: g.fair_score }) } }
const byPath = Object.fromEntries(Object.entries(actions.reduce((m, x) => (record(m, x), m), {})).map(([path, s]) => [path, { total: s.total, ok: s.ok, errors: s.errors, error_rate: s.errors / s.total, five_xx: Object.entries(s.statuses).filter(([k]) => Number(k) >= 500).reduce((a, [, n]) => a + n, 0), p50_ms: percentile(s.times, .5), p95_ms: percentile(s.times, .95), p99_ms: percentile(s.times, .99) }]))
const report = { generated_at: new Date().toISOString(), game_prefix: env.CW_DEAN_GAME.toUpperCase(), users, rooms: roomList.reduce((m, x) => (m[x] = (m[x] || 0) + 1, m), {}), by_action: byPath, errors: actions.filter(x => !x.ok).slice(0, 20).map(x => ({ path: x.path, status: x.status, error: x.data?.error || 'unknown' })) }
const { mkdir, writeFile } = await import('node:fs/promises'); await mkdir(join(ROOT, 'artifacts', 'load'), { recursive: true }); const stamp = new Date().toISOString().replace(/[:.]/g, '-'); await writeFile(join(ROOT, 'artifacts', 'load', `${stamp}.json`), JSON.stringify(report, null, 2)); await writeFile(join(ROOT, 'artifacts', 'load', `${stamp}.md`), `# Dean QA load\n\n- Usuarios: ${users}\n- Distribución: ${JSON.stringify(report.rooms)}\n- Errores: ${actions.filter(x => !x.ok).length}\n\n| Acción | p50 ms | p95 ms | p99 ms | tasa errores | 5xx |\n|---|---:|---:|---:|---:|---:|\n${Object.entries(byPath).map(([p, s]) => `| ${p} | ${s.p50_ms.toFixed(1)} | ${s.p95_ms.toFixed(1)} | ${s.p99_ms.toFixed(1)} | ${(s.error_rate * 100).toFixed(2)}% | ${s.five_xx} |`).join('\n')}\n`)
console.log(JSON.stringify({ ok: true, users, total_requests: actions.length, errors: actions.filter(x => !x.ok).length }))
