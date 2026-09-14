import { CUSTOMERS, SEGMENTS, TEAM_NAMES, ANSWERS } from './scenario'

const KEY = 'dos-futuros-demo-state-v1'
const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dos-futuros-demo') : null

function defaultTeam(name, i) {
  return {
    id: `team-${i+1}`,
    name,
    score: { impact: 0, evidence: 0, design: 0, risk: 0, adaptation: 0 },
    decisions: {},
    checks: {},
    locked: {},
    membersOnline: 5
  }
}

export function initialState() {
  return {
    version: 1,
    mode: 'demo',
    game: {
      id: 'demo-game',
      code: 'FUTURO26',
      title: 'DOS FUTUROS · NEXO',
      phase: 'lobby',
      round: 1,
      reveal: false,
      teaching: false,
      microcheck: false,
      startedAt: null,
      closesAt: null,
      durationSeconds: 480,
      publicMessage: 'Esperando al facilitador',
      champion: null
    },
    teams: TEAM_NAMES.map(defaultTeam),
    audit: [{ at: Date.now(), type: 'reset', message: 'Partida demo creada' }]
  }
}

export function readState() {
  const raw = localStorage.getItem(KEY)
  if (!raw) {
    const state = initialState()
    localStorage.setItem(KEY, JSON.stringify(state))
    return state
  }
  try { return JSON.parse(raw) } catch { return initialState() }
}

export function writeState(state) {
  localStorage.setItem(KEY, JSON.stringify(state))
  bc?.postMessage({ type: 'state' })
  window.dispatchEvent(new CustomEvent('dos-futuros-state'))
  return state
}

export function mutateState(mutator) {
  const state = readState()
  const next = structuredClone(state)
  mutator(next)
  return writeState(next)
}

export function subscribe(callback) {
  const fn = () => callback(readState())
  window.addEventListener('storage', fn)
  window.addEventListener('dos-futuros-state', fn)
  bc?.addEventListener('message', fn)
  return () => {
    window.removeEventListener('storage', fn)
    window.removeEventListener('dos-futuros-state', fn)
    bc?.removeEventListener('message', fn)
  }
}

export function resetDemo() { return writeState(initialState()) }

export function transition(action) {
  return mutateState((s) => {
    const g = s.game
    const now = Date.now()
    const log = (message) => s.audit.push({ at: now, type: action, message })
    if (action === 'open') {
      g.phase = 'round'; g.reveal = false; g.teaching = false; g.microcheck = false
      g.startedAt = now; g.closesAt = now + g.durationSeconds * 1000
      g.publicMessage = `Ronda ${g.round} abierta`
      log(g.publicMessage)
    }
    if (action === 'close') {
      g.phase = 'closed'; g.closesAt = now; g.publicMessage = `Ronda ${g.round} cerrada`
      log(g.publicMessage)
    }
    if (action === 'reveal') {
      scoreRound(s, g.round)
      g.phase = 'reveal'; g.reveal = true; g.teaching = false; g.microcheck = false
      g.publicMessage = g.round === 1 ? 'VER EL OTRO FUTURO' : `Reveal ronda ${g.round}`
      log(g.publicMessage)
    }
    if (action === 'teach') {
      g.phase = 'teaching'; g.teaching = true; g.microcheck = false
      g.publicMessage = 'Concepto desbloqueado'
      log(g.publicMessage)
    }
    if (action === 'microcheck') {
      g.phase = 'microcheck'; g.microcheck = true
      g.publicMessage = 'Microcheck individual'
      log(g.publicMessage)
    }
    if (action === 'next') {
      if (g.round < 4) g.round += 1
      else {
        g.phase = 'finished'; g.champion = rankTeams(s)[0]?.id ?? null
        g.publicMessage = 'Partida finalizada'
        log('Partida finalizada')
        return
      }
      g.phase = 'briefing'; g.reveal = false; g.teaching = false; g.microcheck = false
      g.startedAt = null; g.closesAt = null
      g.publicMessage = `Preparando ronda ${g.round}`
      log(g.publicMessage)
    }
    if (action === 'pause') {
      g.phase = 'paused'; g.publicMessage = 'Partida pausada'
      log(g.publicMessage)
    }
  })
}

export function addTime(seconds) {
  return mutateState((s) => {
    s.game.closesAt = (s.game.closesAt || Date.now()) + seconds * 1000
    s.audit.push({ at: Date.now(), type: 'time', message: `+${seconds}s` })
  })
}

export function submitDecision(teamId, round, payload) {
  return mutateState((s) => {
    const t = s.teams.find(x => x.id === teamId)
    if (!t) return
    t.decisions[String(round)] = { ...payload, submittedAt: Date.now() }
    t.locked[String(round)] = true
    s.audit.push({ at: Date.now(), type: 'decision', message: `${t.name} bloqueó R${round}` })
  })
}

export function submitCheck(teamId, round, answer) {
  return mutateState((s) => {
    const t = s.teams.find(x => x.id === teamId)
    const correct = ANSWERS[round]
    if (!t || !correct) return
    t.checks[String(round)] = { answer, correct: answer === correct, at: Date.now() }
    if (answer === correct) t.score.evidence = Math.min(25, t.score.evidence + 3)
  })
}

function scoreRound(s, round) {
  for (const t of s.teams) {
    const d = t.decisions[String(round)]
    if (!d || t.decisions[String(round)]?.scored) continue

    if (round === 1) {
      const selected = CUSTOMERS.filter(c => d.selected?.includes(c.id))
      const impact = selected.reduce((acc, c) => acc + (c.p1 - c.p0), 0)
      const predictive = selected.reduce((acc, c) => acc + c.p1, 0) / Math.max(1, selected.length)
      const maxImpact = [...CUSTOMERS].sort((a,b)=>(b.p1-b.p0)-(a.p1-a.p0)).slice(0,10)
        .reduce((acc,c)=>acc+(c.p1-c.p0),0)
      const impactPts = Math.round(35 * Math.max(0, impact) / maxImpact)
      t.score.impact = Math.max(t.score.impact, impactPts)
      t.decisions['1'].result = { impact, predictive }
      t.score.adaptation += selected.some(c => c.score < .6 && (c.p1-c.p0) > .18) ? 2 : 0
    }

    if (round === 2) {
      let evidence = 0
      if (d.recommendation === 'redesign') evidence += 7
      if (d.confounder === 'mora_previa') evidence += 8
      if ((d.reason || '').toLowerCase().includes('compar')) evidence += 3
      t.score.evidence = Math.min(25, t.score.evidence + evidence)
      t.score.adaptation = Math.min(10, t.score.adaptation + (d.confounder === 'mora_previa' ? 2 : 0))
      t.decisions['2'].result = { naiveEffect: -15, causalEffect: 5 }
    }

    if (round === 3) {
      let design = 0
      if (d.assignment === 'random') design += 14
      if (d.outcome === 'pago_30d') design += 3
      if (Number(d.horizon) >= 30) design += 3
      t.score.design = Math.min(20, t.score.design + design)
      t.score.evidence = Math.min(25, t.score.evidence + (d.assignment === 'random' ? 2 : 0))
      t.decisions['3'].result = { treatment: 31, control: 25, ate: 6 }
    }

    if (round === 4) {
      const treat = new Set(d.treat || [])
      const avoid = new Set(d.avoid || [])
      let risk = 0
      if (avoid.has('arrears')) risk += 7
      if (!treat.has('arrears')) risk += 3
      t.score.risk = Math.min(10, risk)
      const positive = SEGMENTS.filter(x => x.effect > 5).map(x => x.id)
      const matched = positive.filter(id => treat.has(id)).length
      t.score.adaptation = Math.min(10, t.score.adaptation + matched * 2)
      t.score.impact = Math.min(35, t.score.impact + matched)
      t.decisions['4'].result = { matched, avoidedHarm: avoid.has('arrears') }
    }
    t.decisions[String(round)].scored = true
  }
}

export function totalScore(t) {
  return Object.values(t.score).reduce((a,b)=>a+b,0)
}

export function rankTeams(s) {
  return [...s.teams].sort((a,b) => totalScore(b)-totalScore(a))
}

export function publicLeaderboard(s) {
  return rankTeams(s).map((t, i) => ({
    rank: i+1,
    id: t.id,
    name: t.name,
    total: totalScore(t),
    score: t.score
  }))
}

export function round1ObservedLeaderboard(s) {
  return s.teams.map(t => {
    const selected = CUSTOMERS.filter(c => t.decisions?.['1']?.selected?.includes(c.id))
    const observed = selected.length ? 100 * selected.reduce((a,c)=>a+c.p1,0) / selected.length : NaN
    return { id:t.id, name:t.name, observed_conversion: observed }
  }).filter(x=>Number.isFinite(x.observed_conversion)).sort((a,b)=>b.observed_conversion-a.observed_conversion)
}
