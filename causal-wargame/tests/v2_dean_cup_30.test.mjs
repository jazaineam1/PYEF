import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const r=p=>readFileSync(p,'utf8')
test('V2 Dean Cup builds as three static GitHub Pages entries',()=>{
 const config=r('vite.config.js')
 for(const name of ['dean-play.html','dean-teacher.html','dean-wall.html'])assert.ok(config.includes(name),name)
 for(const name of ['dean-play.html','dean-teacher.html','dean-wall.html'])assert.ok(r(name).includes('/src/v2/dean-cup.jsx'),name)
 assert.match(r('src/v2/dean-cup.jsx'),/30 PARTICIPANTES · 15 EXÁMENES/)
})
test('Five rooms exactly six each, each 15 subjects independent from legacy V1',()=>{
 const sql=r('supabase/migrations/202610140004_v2_deans_cup_30.sql')
 for(const token of ['p_room not between 1 and 5','if occupied>=6','p_exam not between 1 and 15','cw_dean_players','cw_dean_exam_records','for update','security invoker'])assert.ok(sql.includes(token),token)
 assert.match(sql,/primary key\(player_id,exam_no\)/)
 assert.doesNotMatch(sql,/alter table public\.cw_games/i)
})
test('Score and physiology are computed server-side with strict archetype slider bounds',()=>{
 const sql=r('supabase/migrations/202610140004_v2_deans_cup_30.sql')
 for(const x of ['hidden_fatigue','prev_fatigue','sqrt(p_wellness)','ln(1+p_study)','p_sleep-8','p_study<min_study','p_sleep>max_sleep','p_wellness>max_well'])assert.ok(sql.includes(x),x)
 assert.match(sql,/least\(50,greatest\(0,/)
 assert.match(sql,/least\(12,greatest\(0,/)
 const ui=r('src/v2/dean-cup.jsx')
 assert.match(ui,/LIMITS|const limits=/i)
 assert.match(ui,/RIND|RENDIR EXAMEN/i)
 assert.match(ui,/Dormir poco no es una estrategia saludable/i)
})
test('No student receives hidden fatigue via state or rector/survey exports',()=>{
 const sql=r('supabase/migrations/202610140004_v2_deans_cup_30.sql')
 const pub=sql.slice(sql.indexOf('create or replace function public.cw_dean_state'),sql.indexOf('create or replace function public.cw_dean_export'))
 const exp=sql.slice(sql.indexOf('create or replace function public.cw_dean_export'),sql.indexOf('-- The 30-player final'))
 assert.doesNotMatch(pub,/hidden_fatigue|latent_resilience/)
 assert.doesNotMatch(exp,/jsonb_build_array\([^)]*hidden_fatigue/)
 assert.match(exp,/stage not in \('rector','survey','causal','final','finished'\)/)
 assert.match(exp,/stage not in \('survey','causal','final','finished'\)/)
})
test('All Dean Cup tables isolated under RLS and no public grants',()=>{
 const sql=r('supabase/migrations/202610140004_v2_deans_cup_30.sql')
 assert.equal((sql.match(/enable row level security/g)||[]).length,5)
 assert.match(sql,/revoke all on public\.cw_dean_tournaments/)
 assert.match(sql,/grant execute on function public\.cw_dean_exam.*to service_role/)
 assert.doesNotMatch(sql,/grant execute on function public\.cw_dean_.*to anon/i)
})
test('Kahoot 30 separate sessions protects answers until server reveal',()=>{
 const sql=r('supabase/migrations/202610140004_v2_deans_cup_30.sql')
 for(const x of ['cw_dean_quiz_sessions','cw_dean_quiz_answers',"old.phase='preview'","s.deadline_at<=clock_timestamp()","effective in ('reveal','podium','finished')",'question_no=8','score','leaderboard'])assert.ok(sql.includes(x),x)
 const edge=r('supabase/functions/v2-dean-cup/index.ts')
 for(const x of ["action==='quiz_state'","action==='quiz_submit'","action==='quiz_teacher'",'x-facilitator-token','x-game-token'])assert.ok(edge.includes(x),x)
})
