import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read=p=>readFileSync(p,'utf8')
const dgp=read('supabase/migrations/202610140006_v2_deans_source_dgp_v4.sql')
const ab=read('supabase/migrations/202610140007_v2_deans_doctor_strange_ab.sql')
test('new DGP is opt-in for NEW V2 tournaments; active FU­TUROS retains legacy behavior',()=>{
 assert.match(dgp,/add column if not exists dgp_version text not null default 'legacy_v1'/)
 assert.match(dgp,/alter column dgp_version set default 'source_v4'/)
 assert.match(dgp,/if g\.dgp_version<>'source_v4' then\s+return public\.cw_dean_exam/)
 assert.match(dgp,/public\.cw_dean_auto_finish/)
 assert.doesNotMatch(dgp,/drop table|truncate table|delete from public\.cw_games/i)
})
test('fatigue numerical constants match uploaded source TOML and Python',()=>{
 for(const x of ['10.0+60.0/(1+exp((p_sleep-4.0)*1.2))',
 '2.0*greatest(0.0,p_study-3.0)','p_sleep<4.0 and p_study>8.0 then 15.0',
 '1.5*greatest(0.0,p_complexity-5.0)','-4.5*least(p_wellness,6.0)',
 'least(100.0,greatest(0.0'])assert.ok(dgp.includes(x),x)
 for(const x of ['30.0+10.0*(p_pga-3.5)','-1.8*(p_complexity-5.5)',
 '+2.6*(p_study-4.0)','+0.8*(p_sleep-7.5)',
 '+0.5*least(p_wellness,6.0)','-0.15*greatest(0.0,p_fatigue-20.0)',
 '-0.12*power(greatest(0.0,p_fatigue-60.0),1.25)'])assert.ok(dgp.includes(x),x)
})
test('11-course catalog and canonical hidden outcomes',()=>{
 assert.equal((dgp.match(/when \d+ then jsonb_build_object\('name'/g)||[]).length,10)
 assert.match(dgp,/cw_dean_source_catalog\(p_exam\)/)
 assert.match(dgp,/cw_dean_source_noise\(p\.game_id,p\.id,p_exam,g\.dgp_seed,'exam'\)/)
 assert.match(dgp,/round\(fatigue::numeric,2\)/)
 assert.match(dgp,/grant execute on function public\.cw_dean_source_score|cw_dean_source_grade/)
})
test('paired A/B freezes exogenous study, sleep, fatigue and outcome disturbances',()=>{
 for(const term of ["'study'","'sleep'","'ab'","'treatment'",'p_wellness-bw',
 'study_0','study_1','sleep_0','sleep_1','fatigue_0','fatigue_1','y0','y1',
 'tau','on conflict(player_id,exam_no) do nothing'])assert.ok(ab.includes(term),term)
 assert.match(ab,/coalesce\(jsonb_agg\(jsonb_build_array\(participant\.alias,e\.exam_no/)
 assert.match(ab,/p_phase not in|phase not in \('causal','final','finished'\)/)
 assert.match(ab,/enable row level security/)
})
test('student and teacher access to synthetic truth stay separate',()=>{
 const student=ab.slice(ab.indexOf('create or replace function public.cw_dean_source_ab_student('),ab.indexOf('create or replace function public.cw_dean_source_ab_student_export('))
 const teacher=ab.slice(ab.indexOf('create or replace function public.cw_dean_source_ab_truth('),ab.indexOf('create or replace function public.cw_dean_source_ab_student('))
 assert.doesNotMatch(student,/true_ate|cate_by_archetype/)
 assert.match(teacher,/true_ate/)
 assert.match(ab,/revoke all on public\.cw_dean_source_ab_records/)
 assert.doesNotMatch(ab,/grant execute on function public\.cw_dean_source_ab_.* to anon/i)
})
test('Supabase Edge always routes old sessions to their original engine',()=>{
 const fn=read('supabase/functions/v2-dean-cup/index.ts')
 for(const term of ['cw_dean_source_state','cw_dean_source_join','cw_dean_source_exam',
 'cw_dean_source_auto_finish','cw_dean_source_ab_generate','cw_dean_source_ab_student_export',
 'cw_dean_source_ab_truth'])assert.match(fn,new RegExp(term))
})
test('Rector, survey, instructor DAG, A/B, and scaffolded notebook are included',()=>{
 const ui=read('src/v2/dean-cup.jsx')
 assert.match(ui,/DeanCausalConcept/)
 assert.match(ui,/DeanCausalAB/)
 assert.match(ui,/sourceCourses/)
 assert.match(ui,/sourceLimits/)
 const slides=read('src/v2/DeanCausalInvestigation.jsx')
 assert.match(slides,/La trampa del Rector|presupuesto bajo sospecha/i)
 assert.match(slides,/DAG v4/)
 assert.match(slides,/do\(B=0\)/)
 assert.match(slides,/ab_export/)
 const notebook=JSON.parse(read('public/notebooks/Copa_Decano_DGP_v4_30.ipynb'))
 assert.equal(notebook.nbformat,4)
 assert.ok(notebook.cells.length>=12)
 assert.match(JSON.stringify(notebook),/GroupShuffleSplit/)
 assert.match(JSON.stringify(notebook),/GroupKFold/)
 assert.match(JSON.stringify(notebook),/Welch/)
})
