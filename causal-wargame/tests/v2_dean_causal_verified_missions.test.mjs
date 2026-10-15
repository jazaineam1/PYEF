import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {summaries,ZIP_REFERENCE} from '../src/v2/dean-causal-math.js';
const read=p=>readFileSync(p,'utf8');
const sql=read('supabase/migrations/202610150010_dean_verified_missions.sql');
const stage=read('supabase/migrations/202610150011_dean_teacher_evidence_guard.sql');
const edge=read('supabase/functions/v2-dean-cup/index.ts');
const ui=read('src/v2/dean-cup.jsx');
const missions=read('src/v2/DeanCausalMissions.jsx');

test('Observed association uses Pearson r and OLS in their own units, never labels it do(B)',()=>{
 const sample=[];
 for(let b=0;b<6;b++)for(let h=0;h<4;h++)for(const z of [2,5]){
  const study=2+b*.1+h*.3, sleep=6+h*.2-z*.1;
  sample.push({estudiante_id:'person'+h,horas_bienestar_sem:b,pga_previo:h+2,
   complejidad:z,horas_estudio:study,horas_sueno:sleep,
   nota_final:10+2*b+3*h-1.5*z});
 }
 const result=summaries(sample);
 assert.equal(result.n,48);
 assert.ok(result.r>0.4);
 assert.ok(Math.abs(result.raw-2)<1e-8);
 assert.ok(Math.abs(result.pre-2)<1e-8);
 assert.equal(summaries([]).r,null);
 assert.equal(summaries([{nota_final:7,horas_bienestar_sem:3}]).raw,null);
 assert.equal(ZIP_REFERENCE.students,25);
 assert.equal(ZIP_REFERENCE.ab.treated,14);
 assert.equal(ZIP_REFERENCE.ab.control,11);
 assert.equal(ZIP_REFERENCE.ab.trueATE,1.799);
});
test('Scientific game integrates real data and labels reference ZIP truth correctly',()=>{
 for(const k of ['DeanCorrelationLab','DeanDAGChallenge','DeanDMLChallenge','DeanPolicyMission',
  'DeanMissionTeacher','DeanMissionWall','DeanABDiscovery'])assert.ok(ui.includes(k),k);
 for(const label of ['ASOCIACIÓN','do(B)','FUENTE EXTERNA','CATE estimado',
  'NO son los jugadores conectados','SIN PUNTOS'])
  assert.ok((missions+'\n'+ui+'\n'+stage).toUpperCase().includes(label.toUpperCase()),label);
 assert.ok(missions.includes("step==='debrief'?"));
 assert.ok(ui.includes("phase==='survey'"));
});
test('Server grades private structured missions, no guessing by UI and no duplicate awards',()=>{
 assert.ok(sql.includes('primary key(player_id,mission_id)'));
 assert.ok(sql.includes('cw_dean_mission_score'));
 assert.ok(sql.includes('cw_dean_mission_submit'));
 assert.ok(sql.includes("stage_step is distinct from 'evidence'"));
 assert.ok(sql.includes("ver is distinct from 'zip_dgp_2026'"));
 assert.ok(sql.includes("if d.step='debrief'")||sql.includes("when d.step='debrief'"));
 assert.ok(sql.includes('mission_id in (\'association\',\'dag\',\'dml\',\'policy\')'));
 assert.ok(sql.includes('skill_max\',43'));
 assert.ok(!sql.includes('update public.cw_dean_quiz_answers'));
 for(const action of ['mission_submit','mission_state'])assert.ok(edge.includes("action==='"+action+"'"));
});
test('30-player attendance independent of separate reference and historical campaign',()=>{
 for(const label of ['30 alumnos SINTÉTICOS','seis cupos','NO es la Copa actual',
  '30 alumnos','benchmark DR-Learner'])assert.ok(missions.includes(label),label);
 assert.ok(!sql.includes("delete from public.cw_games"));
 assert.ok(!sql.includes("update public.cw_dean_exam_records"));
});
test('No teacher may pretend 0 learning votes have a scored debrief',()=>{
 assert.ok(stage.includes('initial_n=0'));
 assert.ok(stage.includes('revision_n=0'));
 assert.ok(stage.includes("p_action='demo'"));
 assert.ok(stage.includes('Demostración docente sin evidencias verificadas'));
 assert.ok(edge.includes("'demo'"));
});
test('Final canonical quiz uses wellness and an explicitly separate transfer case',()=>{
 assert.ok(edge.includes('programa de bienestar B=4 h frente a B=0 h'));
 assert.ok(edge.includes('MISIÓN DE TRANSFERENCIA'));
 assert.ok(edge.includes("if(Number(snapshot.question_no)===8)"));
 assert.ok(edge.includes('snapshot.auto_mode===true'));
 assert.ok(edge.includes('La motivación previa'));
});
