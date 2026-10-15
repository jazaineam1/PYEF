const QUESTIONS = { text: '¿Qué evidencia permite sostener una afirmación causal?', options: { a: 'Una pendiente', b: 'Un diseño identificador', c: 'Un ranking', d: 'Una predicción' }, concept: 'identificación', correct: 'b', explanation: 'La asociación descriptiva no basta sin supuestos de identificación.' }

const emptyGroup = (room) => ({ room_no: room, members: 0, target_exams: 0, exams_completed: 0, pending_exams: 0, coverage_pct: 0, fair_score: null, average_score: null, is_complete: false })
function stateFor(page) {
  const url = new URL(page.url())
  const phase = url.searchParams.get('phase') || 'lobby'
  const variant = url.searchParams.get('variant') || 'legacy_v1'
  const attendance = Number(url.searchParams.get('attendance') || (phase === 'lobby' ? 0 : 17))
  const groups = Array.from({ length: 5 }, (_, i) => emptyGroup(i + 1))
  if (attendance) {
    const members = Math.min(6, attendance)
    groups[0] = { ...groups[0], members, target_exams: members * 15, exams_completed: phase === 'exams' ? members * 8 : ['rector', 'survey', 'causal', 'final', 'finished'].includes(phase) ? members * 15 : 0, pending_exams: phase === 'exams' ? members * 7 : 0, coverage_pct: phase === 'exams' ? 53.3 : ['rector', 'survey', 'causal', 'final', 'finished'].includes(phase) ? 100 : 0, fair_score: phase === 'lobby' ? null : 39.4, average_score: phase === 'lobby' ? null : 39.4, is_complete: ['final', 'finished'].includes(phase) }
  }
  const completed = phase === 'exams' ? 8 : phase === 'lobby' ? 0 : 15
  return { available: true, game_code: 'VISUALQA', phase, max_players: 30, registered_players: attendance, group_size: 6, exam_count: 15, groups, mine: { id: 'player-1', room: 1, alias: 'Ana Visual', archetype: 'balanced', pga: 4.1, completed }, dgp_version: variant, canonical_source: 'chapter-causalidad-master/config/simulation_parameters.toml', dgp_updated_on: '2026-10-14', exam_deadline_at: phase === 'exams' ? new Date(Date.now() + 600000).toISOString() : null, server_now: new Date().toISOString() }
}

function quizFor(page) {
  const phase = new URL(page.url()).searchParams.get('quiz') || 'idle'
  const revealed = ['reveal', 'podium', 'finished'].includes(phase)
  return { phase, question_no: phase === 'idle' ? 0 : 1, question: phase === 'idle' ? null : QUESTIONS, deadline_at: phase === 'open' ? new Date(Date.now() + 60000).toISOString() : null, server_now: new Date().toISOString(), received: phase === 'idle' ? 0 : 12, counts: revealed ? { a: 2, b: 8, c: 1, d: 1 } : null, leaderboard: [{ alias: 'Ana Visual', room_no: 1, points: 105 }, { alias: 'Luis Datos', room_no: 2, points: 90 }], mine: null, my_points: 0, participants: 17 }
}

export async function installDeanMocks(page) {
  await page.route('**/facilitator-login', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: 'f'.repeat(64), game_code: 'VISUALQA' }) }))
  await page.route('**/v2-dean-cup', async (route) => {
    const request = route.request()
    const payload = request.postDataJSON() || {}
    const action = payload.action
    if (action === 'state' || action === 'join' || action === 'teacher' || action === 'auto_finish') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(stateFor(page)) })
    if (action === 'quiz_state' || action === 'quiz_teacher') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(quizFor(page)) })
    if (action === 'quiz_submit') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ accepted: true, choice: payload.choice || 'b' }) })
    if (['export', 'ab_download', 'ab_truth', 'teacher_truth'].includes(action)) return route.fulfill({ status: 200, contentType: 'text/csv', body: 'estudiante_id,examen_nro,nota_final\nAna Visual,1,42\n' })
    if (action === 'ab_generate') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ observed_ate: 4.2, ci95_low: 1.2, ci95_high: 7.2, true_ate: 4.0 }) })
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(stateFor(page)) })
  })
}

export const PHASES = ['lobby', 'exams', 'rector', 'survey', 'causal', 'final', 'finished']
export const VARIANTS = ['legacy_v1', 'zip_dgp_2026']
export const VIEWPORTS = { desktop1280: { width: 1280, height: 720 }, desktop1366: { width: 1366, height: 768 }, desktop1920: { width: 1920, height: 1080 }, tablet: { width: 768, height: 1024 }, mobile390: { width: 390, height: 844 }, mobile360: { width: 360, height: 740 } }
export const ROLE_VIEWPORTS = { player: Object.keys(VIEWPORTS), teacher: ['desktop1280', 'desktop1366', 'desktop1920', 'tablet'], wall: ['desktop1280', 'desktop1366', 'desktop1920'] }

export async function prepareRole(page, role, phase, variant) {
  await page.addInitScript(({ role }) => {
    localStorage.setItem('cw-dean-v2-VISUALQA', 'a'.repeat(64))
    if (role === 'teacher') { sessionStorage.setItem('df_facilitator_token', 'f'.repeat(64)); sessionStorage.setItem('df_facilitator_game_code', 'VISUALQA') }
  }, { role })
  await page.goto(`/dean-${role === 'player' ? 'play' : role === 'teacher' ? 'teacher' : 'wall'}.html?game=VISUALQA&phase=${phase}&variant=${variant}&attendance=${phase === 'lobby' ? 0 : 17}&quiz=${phase === 'final' ? 'open' : 'idle'}`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(150)
}
