import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const view=readFileSync(new URL('../src/v2/dean-cup.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/v2/dean-cup-layout.css',import.meta.url),'utf8');
const section=(from,to)=>{
  const a=view.indexOf(from);
  const b=view.indexOf(to,a+from.length);
  assert.ok(a>=0&&b>a,`Missing section: ${from}`);
  return view.slice(a,b);
};

test('Single viewport layout is scoped exclusively to the Dean Cup V2 entry',()=>{
 assert.match(view,/import '\.\/dean-cup-layout\.css'/);
 assert.match(css,/\.dean-page\{[\s\S]*height:100dvh;min-height:0;overflow:hidden/);
 assert.match(css,/\.dean-player\{display:grid;grid-template-rows:70px minmax\(0,1fr\) 38px/);
 assert.match(css,/\.dean-teacher\{display:grid;grid-template-rows:52px minmax\(0,1fr\)/);
 assert.match(css,/\.dean-wall-main\{display:grid;grid-template-rows:40px minmax\(0,1fr\)/);
 assert.match(css,/repeat\(5,minmax\(0,1fr\)\)/);
 assert.doesNotMatch(css,/\b(?:html|body)\s*\{[^}]*overflow\s*:\s*hidden/);
});
test('Player room score bug replaces full leaderboard without duplicating it',()=>{
 const player=section('function Player(){','function Wall(){');
 const hud=section('function MiniWall({','function Slider({');
 assert.match(player,/<MiniWall groups=\{state\.groups\} room=\{me\.room\} completed=\{me\.completed\}/);
 assert.doesNotMatch(player,/<Board groups=\{state\.groups\}/);
 assert.match(player,/dean-player-topbar/);
 assert.match(player,/dean-player-stage/);
 assert.match(player,/dean-player-dock/);
 assert.match(hud,/<details className="dean-hud"/);
 assert.match(hud,/fair_score/);
 assert.match(hud,/\#'\+position/);
 assert.match(hud,/TU SALA/);
 assert.match(hud,/SIN PARTICIPANTES/);
});
test('Score feedback is sourced from the server response, never a local invented score',()=>{
 const player=section('function Player(){','function Wall(){');
 assert.match(player,/const r=await call\('exam',v,token\)/);
 assert.match(player,/setLastAward\(\{score:Number\(r\.score\)/);
 assert.match(player,/role="status"/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
test('Exam action and the compact instructor phase action remain available',()=>{
 const exam=section('function Exam({','function CupQuiz({');
 const teacher=section('function Teacher(){','const role=document.body.dataset.role');
 assert.match(exam,/dean-exam-brief/);
 assert.match(exam,/dean-exam-controls/);
 assert.match(exam,/dean-exam-action/);
 assert.match(exam,/onClick=\{submit\}/);
 assert.match(teacher,/dean-teacher-toolbar/);
 assert.match(teacher,/dean-teacher-grid/);
 assert.match(teacher,/dean-teacher-sidebar/);
 assert.match(teacher,/dean-teacher-next/);
 assert.match(teacher,/onClick=\{\(\)=>direct\('next'\)\}/);
});
test('Wall provides all five room rows with a separate bounded explainer',()=>{
 const wall=section('function Wall(){','function Teacher(){');
 assert.match(wall,/dean-wall-main/);
 assert.match(wall,/dean-wall-grid/);
 assert.match(wall,/<Board groups=\{value\.groups\}/);
 assert.match(wall,/className="dean-wall-story"/);
 assert.match(css,/\.dean-wall-story\{[^}]*overflow:auto/);
 assert.match(css,/@media\(max-height:760px\)/);
 assert.match(css,/@media\(max-width:790px\)/);
});
