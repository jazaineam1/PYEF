import test from 'node:test';
import assert from 'node:assert/strict';
import{readFileSync}from'node:fs';
import{lifeScene,LIFE_SCENES,decisionConsequence,lifeProfile,podiumEligible}from'../src/v2/dean-life.js';
const read=p=>readFileSync(p,'utf8');
test('Exactly six distinct fictional life dilemmas, not school quizzes',()=>{
 assert.equal(LIFE_SCENES.length,6);
 assert.equal(new Set(LIFE_SCENES.map(s=>s.title)).size,6);
 for(let n=1;n<=6;n++)assert.match(lifeScene(n).story,/horas|decisiones|semestre|rutina|nota|sueño|descanso/);
});
test('Each award explains observed hour tradeoffs and recorded grade change, never invents causes',()=>{
 const a=decisionConsequence({study:6,sleep:6.5,wellness:1.5},42,35);
 assert.match(a,/Dormiste menos de 7 h/);
 assert.match(a,/subió 7.0/);
 assert.match(a,/no una prueba de causa y efecto/);
 const b=decisionConsequence({study:4,sleep:8,wellness:2},38,41);
 assert.match(b,/Reservaste al menos 8 h/);
 assert.match(b,/bajó 3.0/);
 assert.equal(decisionConsequence(null,40),null);
});
test('Life profile depends on verified actual averages, autopilot never crowned',()=>{
 assert.match(lifeProfile({exams:6,simulated_exams:0,avg_grade:44,avg_sleep:8,avg_wellness:2}).title,/brillante/);
 assert.match(lifeProfile({exams:6,simulated_exams:0,avg_grade:44,avg_sleep:6.5,avg_wellness:.5}).title,/velocidad/);
 assert.match(lifeProfile({exams:6,simulated_exams:4,avg_grade:50,avg_sleep:9,avg_wellness:2}).title,/automática/);
 assert.equal(podiumEligible({top3:[]}).length,0);
});
test('Only six MANUAL rounds qualify and ranking uses real score plus sustainability',()=>{
 const sql=read('supabase/migrations/202610150021_dean_life_simulator_podium.sql');
 const edge=read('supabase/functions/v2-dean-cup/index.ts');
 assert.match(sql,/when n=6 and auto_n=0 then/);
 assert.match(sql,/grade\*\.8/);
 assert.match(sql,/sleep\/8/);
 assert.match(sql,/wellness\/2/);
 assert.match(sql,/order by rating desc,grade desc,alias,id/);
 assert.match(sql,/where w.position<=3/);
 assert.match(sql,/p_hash is not null and m.token_hash=p_hash/);
 assert.match(sql,/revoke all on function public\.cw_dean_arcade_recap_v6/);
 assert.match(edge,/cw_dean_arcade_recap_v6/);
 assert.match(edge,/p_hash:hash/);
});
test('Podium appears in same three views and never invents runners-up',()=>{
 const main=read('src/v2/dean-cup.jsx');
 const finale=read('src/v2/DeanRectorFinal.jsx');
 const podium=read('src/v2/DeanLifePodium.jsx');
 const reward=read('src/v2/DeanArcadeResult.jsx');
 assert.match(main,/lifeScene\(n\)\.story/);
 assert.match(main,/life_recap/);
 assert.match(main,/DeanLifePodium recap=\{value\.life_recap\}/);
 assert.match(main,/DeanLifePodium recap=\{state\.life_recap\}/);
 assert.match(finale,/DeanLifePodium recap=\{recap\} showMy/);
 assert.match(podium,/top\.map\(/);
 assert.match(podium,/Aún no hay seis exámenes/);
 assert.match(podium,/Campeón|CAMPEÓN/);
 assert.match(podium,/decisiones automáticas|respuestas automáticas/);
 assert.match(reward,/decisionConsequence\(award\.decisions,score,award\.previousGrade\)/);
});
