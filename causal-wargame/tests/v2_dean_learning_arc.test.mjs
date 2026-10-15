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
 assert.ok(story.includes('Tu primera intuición nunca resta puntos'));
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
