import {readDeanSources,readDeanStyles} from './helpers/dean-sources.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read=p=>readFileSync(p,'utf8')
const canonical=read('supabase/migrations/202610140006_dean_zip_canonical_dgp.sql')
const ab=read('supabase/migrations/202610140007_dean_ab_potential_outcomes.sql')
const edge=read('supabase/functions/v2-dean-cup/index.ts')
const jsx=readDeanSources()
test('ZIP scorer and fatigue are versioned; historical FUTUROS never regraded',()=>{
 assert.match(canonical,/dgp_version text not null default 'legacy_v1'/)
 assert.match(canonical,/zip_dgp_2026/)
 assert.match(canonical,/return public\.cw_dean_exam\(p_token_hash,p_exam,p_study,p_sleep,p_wellness,p_auto\)/)
 for(const term of ['30.0+10.0*','-1.8*','+2.6*','+0.8*','+0.5*','fatigue_penalty','0.15*','0.12*','1.25','60.0/','15.0','4.5*','2.0*','least(100.0','least(50.0'])assert.ok(canonical.includes(term),term)
 assert.match(canonical,/p_seed\|\|':shared_noise'/)
})
test('Fifteen exams recycle the same eleven subject definitions as the source',()=>{
 const subs=['Cálculo Multivariable','Física Mecánica y Ondas','Econometría Aplicada','Estructuras de Datos y Algoritmos','Estadística y Probabilidad','Bases de Datos Relacionales','Metodología de la Investigación','Fundamentos de Gestión y Finanzas','Innovación y Emprendimiento','Comunicación Oral y Escrita','Ética Profesional y Ciudadanía']
 for(const s of subs)assert.ok(canonical.includes("'"+s+"'"),s)
 assert.match(canonical,/1\+\(\(p_exam-1\)%11\)/)
 assert.match(canonical,/p_exam between 1 and 15/)
})
test('Archetype bounds and canonical sliders are identical in SQL and React',()=>{
 for(const s of ["when 'over' then lo_h:=8;hi_h:=14;lo_s:=2;hi_s:=5;lo_b:=0;hi_b:=1.5",
 "when 'balanced' then lo_h:=4;hi_h:=8;lo_s:=6.5;hi_s:=8.5;lo_b:=1.5;hi_b:=3.5",
 "when 'risk' then lo_h:=2;hi_h:=5.5;lo_s:=4.5;hi_s:=7;lo_b:=1.5;hi_b:=4",
 'else lo_h:=0.5;hi_h:=3.5;lo_s:=7;hi_s:=9.5;lo_b:=3.5;hi_b:=6'])assert.ok(canonical.includes(s),s)
 for(const s of ['over:[[8,14,11.5]','balanced:[[4,8,6]','risk:[[2,5.5,3.5]','pragmatic:[[0.5,3.5,1.5]'])assert.ok(jsx.includes(s),s)
 assert.match(jsx,/sourceSubjects\[\(n-1\)%11\]/)
})
test('AB assigns treatment per student and uses same noise in both potential outcomes',()=>{
 for(const s of ["for i in 1..30 loop","for j in 1..15 loop",":T')<0.5","pga_prior","treatment","y0_score","y1_score","u0_fatigue","u1_fatigue","h0:=","h1:=","s0:=","s1:="])assert.ok(ab.includes(s),s)
 assert.equal((ab.match(/seed\|\|':outcome'/g)||[]).length,2)
 assert.match(ab,/se_student_cluster/)
 assert.match(ab,/student_no.*exam_no/)
})
test('AB teacher truth never leaks via public observed CSV and only service role can execute',()=>{
 const observed=ab.slice(ab.indexOf('create or replace function public.cw_dean_ab_observed_v3'),ab.indexOf('create or replace function public.cw_dean_ab_teacher_v3'))
 assert.doesNotMatch(observed,/y0_score|y1_score|u0_fatigue|u1_fatigue|true_ate/)
 assert.match(ab,/enable row level security/)
 assert.match(ab,/revoke all on function public\.cw_dean_ab_teacher_v3/)
 assert.doesNotMatch(ab,/grant execute on function public\.cw_dean_ab_.* to anon/)
 for(const s of ["action==='ab_generate'","action==='ab_download'","action==='ab_truth'","cw_dean_score_v3","cw_dean_exam_v3","cw_dean_join_v3","cw_dean_create_v3"])assert.ok((edge+canonical).includes(s),s)
})
test('Live game keeps all five phases plus final and notebook is bundled in Pages',()=>{
 for(const s of ['DeanCausalLab','ABFromObserved','Rector','cohorte_ab_test_2026.csv','sourceSubjects','dgp_version','DGP canónico'])assert.ok(jsx.includes(s)||readDeanStyles().includes(s),s)
 const notebook=JSON.parse(read('public/notebooks/causalidad_copa_decano_scaffold.ipynb'))
 assert.equal(notebook.nbformat,4)
 assert.ok(notebook.cells.length>=10)
 const code=notebook.cells.filter(x=>x.cell_type==='code').map(x=>x.source.join('')).join('\n')
 for(const s of ['GroupShuffleSplit','RandomForestRegressor','pga_previo','tratamiento','ddof=1'])assert.ok(code.includes(s),s)
})

test('15-minute exam deadline is server-governed and auto-completes absentees only on canonical V2',()=>{
 const sql=read('supabase/migrations/202610140008_dean_timer_auto_finish.sql')
 for(const part of ["interval '15 minutes'",'exam_deadline_at','exam_auto_filled_at','cw_dean_tick_v3',
 'cw_dean_teacher_next_v3',"dgp_version<>'zip_dgp_2026'",
 'cw_dean_auto_finish_v3','clock_timestamp()<t.exam_deadline_at'])assert.ok(sql.includes(part),part)
 const api=read('supabase/functions/v2-dean-cup/index.ts')
 assert.match(api,/cw_dean_tick_v3/)
 assert.match(api,/cw_dean_teacher_next_v3/)
 const ui=readDeanSources()
 assert.match(ui,/function ExamCountdown/)
 assert.match(ui,/ExamCountdown deadline=/)
})

test('Incomplete rooms do not invent missing participants to reach fixed 90 exams',()=>{
 const migration=read('supabase/migrations/202610140008_dean_timer_auto_finish.sql')
 for(const part of ['target_exams','count(distinct p.id)*15','count(distinct p.id)>0','groups_current'])assert.ok(migration.includes(part),part)
})
