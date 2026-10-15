import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {AGENDA_CAP,AGENDA_UNIT_RANGE,CANONICAL_RANGES,agendaCost,
 agendaDefault,agendaValid,rebalanceAgenda} from '../src/v2/dean-agenda.js';
const source=p=>readFileSync(p,'utf8');

test('Canonical default strategies for every archetype fit inside six chips',()=>{
 assert.equal(AGENDA_CAP,6);
 assert.equal(AGENDA_UNIT_RANGE,4);
 for(const key of Object.keys(CANONICAL_RANGES)){
  const v=agendaDefault(key);
  assert.ok(agendaValid(v,key),key+' defaults must not break automatic completion');
  assert.ok(agendaCost(v,key)<=6);
 }
});
test('Increasing study physically sacrifices other playable decisions',()=>{
 for(const key of Object.keys(CANONICAL_RANGES)){
  const original=agendaDefault(key);
  const goal=CANONICAL_RANGES[key][0][1];
  const {values,sacrificed,used}=rebalanceAgenda(original,key,'study',goal);
  assert.ok(agendaValid(values,key),key+' outcome must fit budget');
  assert.ok(used<=6+1e-5);
  assert.ok(values.sleep<original.sleep||values.wellness<original.wellness,
   key+' must lose rest or wellness when study is increased');
  assert.ok(sacrificed.length>0,key+' sacrifice must be visible');
  assert.ok(values.study>original.study,'Study must meaningfully change');
 }
});
test('Increasing sleep sacrifices study; increasing wellness sacrifices study or sleep',()=>{
 for(const key of Object.keys(CANONICAL_RANGES)){
  const start=agendaDefault(key),r=CANONICAL_RANGES[key];
  const rest=rebalanceAgenda(start,key,'sleep',r[1][1]);
  const wellness=rebalanceAgenda(start,key,'wellness',r[2][1]);
  assert.ok(agendaValid(rest.values,key));
  assert.ok(agendaValid(wellness.values,key));
  assert.ok(rest.values.study<start.study||rest.values.wellness<start.wellness);
  assert.ok(wellness.values.study<start.study||wellness.values.sleep<start.sleep);
 }
});
test('If no spare chips exist, rising any one slider cannot increase all three',()=>{
 for(const key of Object.keys(CANONICAL_RANGES)){
  let current=agendaDefault(key);
  for(let i=0;i<12;i++){
   const target=i%3===0?'study':i%3===1?'sleep':'wellness';
   current=rebalanceAgenda(current,key,target,CANONICAL_RANGES[key][{study:0,sleep:1,wellness:2}[target]][1]).values;
   assert.ok(agendaValid(current,key));
  }
 }
});
test('Server rejects overspending and opts only new canonical Cups in',()=>{
 const sql=source('supabase/migrations/202610150016_dean_six_token_schedule.sql');
 assert.match(sql,/AGENDA_EXCEDIDA/);
 assert.match(sql,/cw_dean_agenda_rules/);
 assert.match(sql,/cw_dean_agenda_new_game_trg/);
 assert.match(sql,/not exists\(select 1 from public\.cw_dean_exam_records/);
 assert.match(sql,/cw_dean_exam_v3/);
 assert.ok(!sql.includes('create or replace function public.cw_dean_score_v3'));
 assert.ok(!sql.includes('update public.cw_dean_exam_records'));
 const edge=source('supabase/functions/v2-dean-cup/index.ts');
 assert.match(edge,/agenda_enabled/);
});
test('Game stages science as interactive choice, not mandatory reading',()=>{
 const src=source('src/v2/dean-cup.jsx'),arc=source('src/v2/DeanLearningArc.jsx');
 assert.match(src,/DeanPracticeRoom/);
 assert.match(src,/dean-agenda-hud/);
 assert.match(src,/agendaEnabled=\{state\.agenda_enabled===true\}/);
 assert.match(arc,/dean-rector-boss/);
 assert.match(arc,/GAME_QUESTIONS\[phase\]/);
 assert.match(arc,/step==='debrief'/);
 assert.match(arc,/Ver explicación \(opcional\)/);
});
