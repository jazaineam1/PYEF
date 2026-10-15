import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const txt=path=>readFileSync(path,'utf8');

const rubric=txt('supabase/migrations/202610150013_dean_scientific_rubric_v2.sql');
const ab=txt('supabase/migrations/202610150014_dean_ab_per_cup_stratified.sql');
const atlas=txt('src/v2/DeanCausalAtlas.jsx');
const missions=txt('src/v2/DeanCausalMissions.jsx');
const learning=txt('src/v2/DeanLearningArc.jsx');
const python=txt('src/v2/DeanSciencePython.jsx');

test('Observed DAG is scientifically aligned with original ZIP basal archetype mechanism',()=>{
 assert.match(atlas,/A · Arquetipo/);
 assert.match(atlas,/origen común/i);
 assert.match(atlas,/arquetipo y PGA/i);
 assert.match(atlas,/solapamiento/i);
 assert.match(missions,/Arquetipo de origen/);
 assert.match(missions,/PGA solo no basta|ajustar solo PGA NO elimina/i);
 assert.match(missions,/positividad/i);
 assert.match(learning,/ARQUETIPO y PGA/);
});
test('New DAG score requires archetype, remains 20 points and preserves previous answers',()=>{
 assert.match(rubric,/20261015_v2/);
 assert.match(rubric,/'archetype'=any\(arr\)/);
 assert.match(rubric,/coalesce\(ans->>'rubric',''\)<>'20261015_v2'/);
 assert.match(rubric,/p_answer:=p_answer\|\|jsonb_build_object\('rubric','20261015_v2'\)/);
 assert.match(rubric,/array\['h','z','archetype','study','sleep','u'\]/);
 assert.match(rubric,/stage_step is distinct from 'evidence'/);
});
test('No equity reward is granted for allocating a negative CATE intervention to En riesgo',()=>{
 assert.match(rubric,/risk_n=0/);
 assert.match(rubric,/refer_to_alternative/);
 assert.match(missions,/CATE estimado de En riesgo = −1,49/);
 assert.match(missions,/NO se conoce|NO podemos asegurar/i);
 assert.match(missions,/refer_to_alternative/);
 assert.match(missions,/harm/);
 assert.match(missions,/El CATE negativo no implica/);
});
test('New AB is reproducible within a Copa, variable across Copas, stratified within archetypes',()=>{
 assert.match(ab,/gid::text\|\|':ab:arm:'\|\|i/);
 assert.match(ab,/generate_series\(1,30\)/);
 assert.match(ab,/\(c.student_index-1\)%4=\(i-1\)%4/);
 assert.match(ab,/\)<=4 then 1 else 0/);
 assert.match(ab,/\(gid,'stratified_four_treated_per_archetype'/);
 assert.match(ab,/if existing>0 then return public.cw_dean_ab_summary_v3\(gid\)/);
 assert.match(ab,/for i in 1\.\.30 loop/);
 assert.match(ab,/for j in 1\.\.15 loop/);
 assert.ok(!ab.includes('update public.cw_dean_ab_v3'));
});
test('Statements about RF and AB acknowledge low power, negative R² and uncertainty',()=>{
 assert.match(learning,/R² negativo/);
 assert.match(learning,/R² sea alto, bajo o negativo/);
 assert.match(learning,/Un A\/B pequeño ofrece una estimación imprecisa/);
 assert.match(learning,/30 alumnos aportan poca potencia/);
 assert.match(python,/if r2<0:/);
 assert.match(python,/AVISO: R² negativo/);
});
test('No scientific coefficient changes to scorer/fatigue are part of this patch',()=>{
 assert.ok(!rubric.includes('create or replace function public.cw_dean_score_v3'));
 assert.ok(!ab.includes('create or replace function public.cw_dean_score_v3'));
 assert.ok(!ab.includes('delete from public.cw_dean_ab_v3'));
 assert.match(rubric,/Old canonical attempts are not rewritten/);
});
