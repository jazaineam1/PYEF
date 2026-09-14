const mode = import.meta.env.VITE_GAME_MODE || 'demo'
const base = (import.meta.env.VITE_FUNCTIONS_BASE_URL || '').replace(/\/$/, '')

export const runtimeMode = (!base || mode === 'demo') ? 'demo' : 'secure'
export const functionsBaseUrl = base

const PLAYER_TOKEN = 'df_game_token'
const FACILITATOR_TOKEN = 'df_facilitator_token'
const PLAYER_GAME_CODE = 'df_game_code'
const FACILITATOR_GAME_CODE = 'df_facilitator_game_code'
const RETRYABLE = new Set([408, 425, 429, 500, 502, 503, 504])

function sleep(ms){ return new Promise(resolve => setTimeout(resolve, ms)) }
function jitter(baseMs){ return Math.round(baseMs * (0.75 + Math.random() * 0.5)) }

function reconcilePlayerStorage(){
  const sessionToken = sessionStorage.getItem(PLAYER_TOKEN)
  const localToken = localStorage.getItem(PLAYER_TOKEN)
  if(sessionToken && !localToken) localStorage.setItem(PLAYER_TOKEN, sessionToken)
  if(localToken && !sessionToken) sessionStorage.setItem(PLAYER_TOKEN, localToken)
  const sessionCode = sessionStorage.getItem(PLAYER_GAME_CODE)
  const localCode = localStorage.getItem(PLAYER_GAME_CODE)
  if(sessionCode && !localCode) localStorage.setItem(PLAYER_GAME_CODE, sessionCode)
  if(localCode && !sessionCode) sessionStorage.setItem(PLAYER_GAME_CODE, localCode)
}
reconcilePlayerStorage()

export function getPlayerToken(){ return localStorage.getItem(PLAYER_TOKEN) || sessionStorage.getItem(PLAYER_TOKEN) || '' }
export function getFacilitatorToken(){ return sessionStorage.getItem(FACILITATOR_TOKEN) || '' }
export function getPlayerGameCode(){ return localStorage.getItem(PLAYER_GAME_CODE) || sessionStorage.getItem(PLAYER_GAME_CODE) || '' }
export function getFacilitatorGameCode(){ return sessionStorage.getItem(FACILITATOR_GAME_CODE) || '' }

function token(kind){ return kind === 'facilitator' ? getFacilitatorToken() : getPlayerToken() }

async function fetchJson(url, init = {}, { attempts = 3, timeoutMs = 9000 } = {}){
  let lastError
  for(let attempt = 0; attempt < attempts; attempt++){
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    try{
      const response = await fetch(url, { ...init, signal:controller.signal, cache:'no-store' })
      const data = await response.json().catch(() => ({}))
      if(response.ok) return data
      const error = new Error(data.error || `HTTP ${response.status}`)
      error.status = response.status
      if(!RETRYABLE.has(response.status) || attempt === attempts - 1) throw error
      lastError = error
    }catch(error){
      if(error?.name === 'AbortError') lastError = new Error('La conexión tardó demasiado; reintentando…')
      else lastError = error
      const status = error?.status
      const canRetry = !status || RETRYABLE.has(status)
      if(!canRetry || attempt === attempts - 1) throw lastError
    }finally{
      clearTimeout(timeout)
    }
    await sleep(jitter(300 * (2 ** attempt)))
  }
  throw lastError || new Error('No fue posible conectar con el servidor')
}

export async function invoke(name, body = {}, kind = 'player', options = {}) {
  if(!base) throw new Error('VITE_FUNCTIONS_BASE_URL no está configurada')
  const headers = { 'content-type':'application/json', ...(options.headers || {}) }
  const t = token(kind)
  if(t) headers[kind === 'facilitator' ? 'x-facilitator-token' : 'x-game-token'] = t
  return fetchJson(`${base}/${name}`, { method:'POST', headers, body:JSON.stringify(body) }, options)
}

export async function bootstrapGame({game_code, pin, bootstrap_secret}){
  if(!bootstrap_secret) throw new Error('Se requiere la clave de creación de partidas')
  return invoke('create-game', { game_code, pin }, 'facilitator', {
    headers:{ 'x-bootstrap-secret': bootstrap_secret }, attempts:2, timeoutMs:10000
  })
}

export async function health(){
  if(!base) return { ok:true, mode:'demo', latency_ms:0 }
  const t0 = performance.now()
  try{
    const data = await fetchJson(`${base}/health`, {}, { attempts:2, timeoutMs:5000 })
    return { ...data, ok:data.ok !== false, latency_ms:Math.round(performance.now() - t0) }
  }catch(error){
    return { ok:false, error:error.message, latency_ms:Math.round(performance.now() - t0) }
  }
}

export function savePlayerToken(v){ localStorage.setItem(PLAYER_TOKEN,v); sessionStorage.setItem(PLAYER_TOKEN,v) }
export function savePlayerGameCode(v){ const code=String(v||'').toUpperCase(); localStorage.setItem(PLAYER_GAME_CODE,code); sessionStorage.setItem(PLAYER_GAME_CODE,code) }
export function saveFacilitatorToken(v){ sessionStorage.setItem(FACILITATOR_TOKEN,v) }
export function saveFacilitatorGameCode(v){ sessionStorage.setItem(FACILITATOR_GAME_CODE,String(v||'').toUpperCase()) }
export function clearPlayerSession(){
  localStorage.removeItem(PLAYER_TOKEN); localStorage.removeItem(PLAYER_GAME_CODE)
  sessionStorage.removeItem(PLAYER_TOKEN); sessionStorage.removeItem(PLAYER_GAME_CODE)
}
export function clearFacilitatorSession(){ sessionStorage.removeItem(FACILITATOR_TOKEN); sessionStorage.removeItem(FACILITATOR_GAME_CODE) }
export function clearTokens(){ clearPlayerSession(); clearFacilitatorSession() }
