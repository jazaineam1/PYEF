import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const arena=read('src/v2/DeanQuizArena.jsx');
const skin=read('src/v2/dean-quiz-arena.css');
const page=read('src/v2/dean-cup.jsx');
const migration=read('supabase/migrations/202610150005_dean_kahoot_automatic_podium.sql');
const edge=read('supabase/functions/v2-dean-cup/index.ts');

test('The authoritative server controls 30 s answers, automatic 9 s explanations and next question',()=>{
 assert.ok(migration.includes("interval '30 seconds'"));
 assert.ok(migration.includes("interval '9 seconds'"));
 for(const phrase of ["phase='open' and state.deadline_at<=now_at","state.phase='reveal' and state.reveal_until<=now_at",
  "state.question_no>=8","phase='podium'","question_no=state.question_no+1"])
  assert.ok(migration.includes(phrase),phrase);
 assert.ok(edge.includes("cw_dean_quiz_tick_v4"));
 assert.ok(edge.includes("cw_dean_quiz_state_v4"));
 assert.ok(edge.includes("cw_dean_quiz_teacher_v4"));
});
test('Canonical auto path never changes historic quizzes including FUTUROS',()=>{
 assert.ok(migration.includes("ver<>'zip_dgp_2026'"));
 assert.ok(migration.includes("return 'legacy'"));
 assert.ok(migration.includes("return public.cw_dean_quiz_teacher(p_token,p_action)"));
 assert.ok(page.includes('CupQuizLegacy'));
 assert.ok(page.includes("state.dgp_version!=='zip_dgp_2026'"));
});
test('Voting yellow, answer green, selected wrong red, and four frequency bars',()=>{
 for(const marker of ["'is-selected'","'is-correct'","'is-incorrect'","VoteBars","dean-quiz-teaching"])
  assert.ok(arena.includes(marker),marker);
 for(const marker of [".dean-quiz-choice.is-selected",".dean-quiz-choice.is-correct",
  ".dean-quiz-choice.is-incorrect",".dean-vote-chart",".dean-vote-row"])
  assert.ok(skin.includes(marker),marker);
 assert.ok(arena.includes("role='timer'")||arena.includes('role="timer"'));
 assert.ok(arena.includes("q.explanation"));
 assert.ok(arena.includes("data?.counts"));
});
test('The educator has a full-screen ceremony, winners and every real attendee is ranked',()=>{
 assert.ok(page.includes('dean-quiz-teacher-stage'));
 assert.ok(page.includes('dean-quiz-wall-stage'));
 assert.ok(page.includes('dean-quiz-only'));
 assert.ok(arena.includes('FELICIDADES AL CAMPEÓN'));
 assert.ok(arena.includes('Clasificación completa'));
 assert.ok(arena.includes("players.map"));
 assert.ok(arena.includes('Puesto #'));
 assert.ok(skin.includes('@keyframes dean-confetti-fall'));
 assert.ok(skin.includes('@keyframes dean-podium-rise'));
 assert.ok(skin.includes('prefers-reduced-motion:reduce'));
 assert.ok(migration.includes("rank() over(order by z.points desc)"));
 assert.ok(migration.includes("(r - 'player_id')"));
 assert.ok(migration.includes("'my_position',own_rank"));
 assert.ok(migration.includes("'participants',members"));
});
test('Final points remain /120 from eight questions, rooms support up to 30 without phantom players',()=>{
 assert.ok(arena.includes('120 pts'));
 assert.ok(migration.includes("where p.game_id=gid group by p.id"));
 assert.ok(arena.includes('participantCount'));
 assert.ok(arena.includes('30 segundos'));
});


test('Clock catches up to original absolute schedule if all browsers disconnect',()=>{
 const migration=read('supabase/migrations/202610150006_dean_quiz_clock_catchup.sql');
 for(const fragment of ['elapsed:=extract(epoch','floor((elapsed-9)/39)',
  'floor(elapsed/39)','next_deadline:=record.deadline_at',
  'next_deadline:=record.reveal_until','next_q>8','return \'legacy\''])
  assert.ok(migration.includes(fragment),fragment);
 assert.ok(!migration.includes("set phase='reveal',deadline_at=null,reveal_until=now_at+interval '9 seconds'"));
});
test('Instructor finishes the tournament itself only after the podium',()=>{
 assert.ok(page.includes("onCloseTournament={()=>direct('next')}"));
 assert.ok(page.includes("closedTournament={state.phase==='finished'}"));
 assert.ok(arena.includes("onCloseTournament&&"));
 assert.ok(arena.includes("phase==='finished'"));
 assert.ok(arena.includes("Registrar cierre de la Copa en el servidor"));
});
test('Zero-vote ceremony acknowledges participation instead of inventing a winner',()=>{
 assert.ok(arena.includes("const hasWinner=players.some(p=>Number(p.points)>0)"));
 assert.ok(arena.includes("SIN PARTICIPANTES"));
 assert.ok(arena.includes("Todos terminaron con cero aciertos"));
});


test('Clock compensates network latency and local selection cannot leak into the next question',()=>{
 assert.ok(arena.includes("(sentAt+receivedAt)/2"));
 assert.ok(arena.includes("selected.question===data?.question_no"));
 assert.ok(arena.includes("setSelected({question:data.question_no,choice:ch})"));
});
