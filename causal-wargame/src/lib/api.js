const mode = import.meta.env.VITE_GAME_MODE || 'demo'
const base = (import.meta.env.VITE_FUNCTIONS_BASE_URL || '').replace(/\/$/, '')

export const runtimeMode = (!base || mode === 'demo') ? 'demo' : 'secure'

function token(name) { return sessionStorage.getItem(name) || '' }

export async function invoke(name, body = {}, kind = 'player') {
  if (!base) throw new Error('VITE_FUNCTIONS_BASE_URL no está configurada')
  const headers = { 'content-type': 'application/json' }
  const t = token(kind === 'facilitator' ? 'df_facilitator_token' : 'df_game_token')
  if (t) headers[kind === 'facilitator' ? 'x-facilitator-token' : 'x-game-token'] = t
  const r = await fetch(`${base}/${name}`, { method: 'POST', headers, body: JSON.stringify(body) })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`)
  return data
}

export async function health() {
  if (!base) return { ok: true, mode: 'demo', latency_ms: 0 }
  const t0 = performance.now()
  const r = await fetch(`${base}/health`)
  const data = await r.json().catch(()=>({}))
  return { ...data, ok: r.ok && data.ok !== false, latency_ms: Math.round(performance.now() - t0) }
}

export function savePlayerToken(v){ sessionStorage.setItem('df_game_token', v) }
export function saveFacilitatorToken(v){ sessionStorage.setItem('df_facilitator_token', v) }
export function clearTokens(){ sessionStorage.removeItem('df_game_token'); sessionStorage.removeItem('df_facilitator_token') }
