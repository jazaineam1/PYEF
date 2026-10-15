#!/usr/bin/env node
// Preparación idempotente de una partida Dean QA. No imprime secretos.
import { readFile } from 'node:fs/promises'
import { randomInt } from 'node:crypto'

const ENV_FILE = 'C:\\Users\\nib1l\\Documents\\diplocopia\\_secrets\\copa-v3.env'
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

async function loadEnv() {
  let text
  try { text = await readFile(ENV_FILE, 'utf8') } catch (error) {
    throw new Error(`No se puede leer el archivo externo de credenciales: ${error.code || 'error de lectura'}`)
  }
  const values = {}
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (match && !match[1].startsWith('#')) values[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  }
  for (const key of ['CW_BASE_URL', 'CW_DEAN_GAME', 'CW_DEAN_PIN']) {
    if (!values[key]) throw new Error(`Falta ${key} en el archivo externo de credenciales`)
  }
  return values
}

function assertGameCode(code, base) {
  if (!code.startsWith(base)) throw new Error('La partida no cumple el prefijo CW_DEAN_GAME')
  if (/^(FUTUROS|FLOWTEST26)$/i.test(code)) throw new Error('Partida prohibida para QA')
}

async function call(base, path, body, headers = {}) {
  const response = await fetch(`${base.replace(/\/$/, '')}/${path}`, {
    method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body)
  })
  const data = await response.json().catch(() => ({}))
  return { ok: response.ok, status: response.status, data }
}

const env = await loadEnv()
let game = String(env.CW_DEAN_RUN_GAME || env.CW_DEAN_GAME).trim().toUpperCase()
assertGameCode(game, env.CW_DEAN_GAME.toUpperCase())
let login = await call(env.CW_BASE_URL, 'facilitator-login', { game_code: game, pin: env.CW_DEAN_PIN })

if (!login.ok && env.CW_BOOTSTRAP_SECRET) {
  // cw_games tiene code único y cw_dean_tournaments tiene game_id como PK.
  // Por eso una corrida nueva necesita otra partida, nunca un borrado destructivo.
  const suffix = `${Date.now().toString(36).toUpperCase()}${randomInt(10, 99)}`
  const candidate = `${env.CW_DEAN_GAME.toUpperCase()}-${suffix}`.slice(0, 20)
  assertGameCode(candidate, env.CW_DEAN_GAME.toUpperCase())
  const created = await call(env.CW_BASE_URL, 'create-game', { game_code: candidate, pin: env.CW_DEAN_PIN }, { 'x-bootstrap-secret': env.CW_BOOTSTRAP_SECRET })
  if (!created.ok) throw new Error(`No se pudo crear la partida QA (${created.status})`)
  game = candidate
  await sleep(150)
  login = await call(env.CW_BASE_URL, 'facilitator-login', { game_code: game, pin: env.CW_DEAN_PIN })
}
if (!login.ok || !login.data?.token) throw new Error(`No se pudo iniciar sesión como facilitador (${login.status})`)

const token = login.data.token
const createdCup = await call(env.CW_BASE_URL, 'v2-dean-cup', { action: 'teacher', command: 'create' }, { 'x-facilitator-token': token })
if (!createdCup.ok) throw new Error(`No se pudo crear la Copa (${createdCup.status})`)
console.log(JSON.stringify({ ok: true, game_code: game, dgp_version: createdCup.data?.dgp_version || 'unknown' }))
