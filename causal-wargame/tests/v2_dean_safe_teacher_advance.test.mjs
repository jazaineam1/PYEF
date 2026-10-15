import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(p,'utf8');

test('Teacher next uses authenticated stage router, not lobby-only start',()=>{
 const edge=read('supabase/functions/v2-dean-cup/index.ts');
 assert.match(edge,/cw_dean_arcade_advance_v5/);
 assert.doesNotMatch(edge,/if\(\['real_hours_10_v1','real_hours_6_v1'\]\.includes\(String\(requested\?\.protocol\|\|''\)\)\)\s*return json\(await rpc\('cw_dean_game_start_v3'/);
 assert.match(edge,/action==='game_finish'/);
});
test('Phase router supports start, finish and repeated closure using facilitator token',()=>{
 const sql=read('supabase/migrations/202610150020_dean_safe_teacher_advance.sql');
 assert.match(sql,/cw_validate_facilitator_token\(p_token\)/);
 assert.match(sql,/where t\.game_id=gid for update of t/);
 assert.match(sql,/if stage='lobby' then/);
 assert.match(sql,/cw_dean_game_start_v3\(p_token\)/);
 assert.match(sql,/elsif stage='exams' then/);
 assert.match(sql,/cw_dean_game_finish_v3\(p_token\)/);
 assert.match(sql,/elsif stage='finished' then/);
 assert.match(sql,/cw_dean_state_v3\(game_code,null\)/);
 assert.match(sql,/revoke all on function public\.cw_dean_arcade_advance_v5\(text\) from public,anon,authenticated/);
 assert.match(sql,/grant execute on function public\.cw_dean_arcade_advance_v5\(text\) to service_role/);
});
test('Teacher refreshes backend authoritative mode and phase after every action',()=>{
 const ui=read('src/v2/dean-cup.jsx');
 assert.match(ui,/async function direct\(command\)/);
 assert.match(ui,/setState\(await call\('state',\{game_code:game\},'',teacher\)\)/);
 assert.match(ui,/direct\(arcade&&state\.phase==='exams'\?'finish_game':'next'\)/);
});
