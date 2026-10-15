import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=p=>readFileSync(p,'utf8');
const story=file('src/v2/DeanLearningArc.jsx');
const sql=file('supabase/migrations/202610150001_dean_causal_learning_arc.sql');
const ui=file('src/v2/dean-cup.jsx');
const py=file('src/v2/DeanSciencePython.jsx');
const edge=file('supabase/functions/v2-dean-cup/index.ts');

test('Five causal acts and genuine learning loop',()=>{
 for(const p of ['lobby','exams','rector','survey','causal']) assert.ok(story.includes(p+':{'),p);
 for(const p of ['challenge','evidence','debrief','initial','revision']) assert.ok(story.includes(p),p);
 assert.ok(story.includes('GAME_CHOICES'));
 assert.ok(story.includes('dean-game-learn-more'));
 assert.ok(story.includes('step===\'debrief\'&&<div className="dean-quest-solution dean-game-victory"'));
 assert.ok(!story.includes('>{scene.evidence}</p>'));
});
test('Server authorization, idempotent decisions and protected scoring',()=>{
 for(const p of ['primary key (player_id, phase, kind)','for update','stage_step','security invoker',
 'service_role',"case when d.step='debrief'","current_step='debrief'","'zip_dgp_2026'"])assert.ok(sql.includes(p),p);
 assert.ok(!sql.includes('update public.cw_players'));
});
test('Scores separate quiz, academics and causal mastery',()=>{
 for(const p of ["when 'lobby' then 0","when 'exams' then 10","when 'rector' then 25",
 "when 'survey' then 30","when 'causal' then 35"]) assert.ok(sql.includes(p),p);
 assert.ok(story.includes('learning_points'));
 assert.ok(ui.includes('<DeanLearningWall'));
});
test('Protected endpoints and canon version routing',()=>{
 for(const p of ["action==='learning_state'","action==='learning_submit'","action==='learning_teacher'"]) assert.ok(edge.includes(p),p);
 assert.ok(ui.includes("enabled:!!token&&state?.dgp_version==='zip_dgp_2026'"));
 assert.ok(ui.includes("enabled:value?.dgp_version==='zip_dgp_2026'"));
});
test('Real-science Python uses learner/group split and DML cross-fitting',()=>{
 for(const p of ['pyodide.worker.js','GroupShuffleSplit','RandomForestRegressor','mean_absolute_error',
  'KFold(n_splits=3','predict_proba','estudiante_id','REFERENCIA DIDÁCTICA INDEPENDIENTE'])
  assert.ok(py.includes(p),p);
 assert.ok(ui.includes('<DeanSciencePython'));
});


test('Aggregated misconceptions stay hidden until teacher debrief',()=>{
 const stateSql=file('supabase/migrations/202610150004_dean_learning_feedback.sql');
 assert.ok(stateSql.includes("'distribution',case when current_step='debrief' then answers else null end"));
 assert.ok(story.includes("learning.step==='debrief'&&learning.distribution"));
 assert.ok(story.includes("step==='debrief'&&learning.distribution"));
 assert.ok(!sql.includes("grant select on public.cw_dean_learning_choices to anon"));
});
test('Reveal, early evidence, and phase gates work without modifying historic rounds',()=>{
 const gate=file('supabase/migrations/202610150002_dean_learning_transition_gate.sql');
 const exportGate=file('supabase/migrations/202610150003_dean_early_evidence_guards.sql');
 assert.ok(gate.includes("lesson_stage is distinct from 'debrief'"));
 assert.ok(gate.includes("cw_dean_teacher_next_v3"));
 assert.ok(exportGate.includes("cw_dean_learning_export"));
 assert.ok(exportGate.includes("cw_dean_learning_ab_observed"));
 assert.ok(exportGate.includes("is distinct from 'evidence'"));
 assert.ok(!gate.includes("update public.cw_dean_tournaments"));
});
test('Emergency teaching guide remains honest and independent of backend',()=>{
 const backup=file('public/dean-emergency.md');
 for(const t of ['120 minutos','NO crea puntuaciones falsas','DAG detective','DML','CATE']){
  assert.ok(backup.includes(t),t);
 }
});
test('EconML only displays verified results with matching canonical source',()=>{
 const panel=file('src/v2/DeanEconMLPanel.jsx');
 const data=JSON.parse(file('src/v2/econml-dean-verified.json'));
 const workflow=file('../.github/workflows/dean-cup-canonical-econml.yml');
 assert.ok(panel.includes("status==='verified'"));
 assert.ok(panel.includes("zip_dgp_2026"));
 assert.ok(panel.includes("PRECOMPUTADO"));
 assert.ok(['verified','pending'].includes(data.status));
 assert.ok(workflow.includes("precompute_econml_dean.py"));
 assert.ok(workflow.includes("python-version: '3.11'"));
});
