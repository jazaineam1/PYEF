import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(p,'utf8');
const ui=read('src/v2/dean-cup.jsx');
const css=read('src/v2/dean-cup-layout.css');
const edge=read('supabase/functions/v2-dean-cup/index.ts');
const sql=read('supabase/migrations/202610150009_dean_fresh_cup_legacy_limit_fix.sql');

test('The ended historical tournament offers New Copa without destructive reset',()=>{
 assert.ok(ui.includes('function DeanNewCupControl('));
 assert.ok(ui.includes('＋ Nueva Copa'));
 assert.ok(ui.includes('Sí, crear Copa nueva'));
 assert.ok(ui.includes('onCreate={createFreshCup}'));
 assert.ok(ui.includes("state?.available&&state.dgp_version==='zip_dgp_2026'"));
 assert.ok(ui.includes('La Copa <strong>{game}</strong> y todos sus resultados permanecerán intactos'));
 assert.ok(ui.includes('source_game_preserved')===false);
});
test('The facilitator header controls cannot hide below the viewport',()=>{
 assert.ok(ui.includes('controls={teacher&&<div className="dean-teacher-banner-actions">'));
 assert.ok(css.includes('.dean-teacher-page .dean-reset-wrapper{position:static'));
 assert.ok(css.includes('.dean-teacher-page .dean-banner{'));
 assert.ok(css.includes('.dean-new-cup-trigger'));
 assert.ok(!ui.includes('<Banner kind="FACILITADOR" phase={state?.phase}/>{teacher&&'));
});
test('One-click creation safely switches to a new authenticated URL and leaves old data untouched',()=>{
 assert.ok(ui.includes("call('new_cup',{game_code:game},'',teacher)"));
 assert.ok(ui.includes("sessionStorage.setItem('df_facilitator_token',created.facilitator_token)"));
 assert.ok(ui.includes("url.searchParams.set('game',next)"));
 assert.ok(ui.includes('setGame(next);setTeacher(created.facilitator_token)'));
 assert.ok(ui.includes('board?.game_code===game'));
 assert.ok(edge.includes("action==='new_cup'"));
 assert.ok(edge.includes('cw_dean_create_fresh_cup'));
 assert.ok(sql.includes('cw_validate_facilitator_token(p_facilitator_token)'));
 assert.ok(sql.includes('p_source_code'));
 assert.ok(sql.includes("values(new_gid,'zip_dgp_2026','lobby')"));
 assert.ok(sql.includes('cw_dean_cup_creation_audit'));
 assert.ok(!sql.includes('delete from public.cw_dean_tournaments'));
 assert.ok(!sql.includes('update public.cw_dean_tournaments'));
});
test('30 Dean participants are independent of old V1 metadata 28-person check',()=>{
 assert.ok(sql.includes("old_hash,5,28"));
 assert.ok(sql.includes('cw_dean_players'));
 assert.ok(sql.includes('without changing V1 schema'));
 assert.ok(sql.includes("'max_players',30"));
});
