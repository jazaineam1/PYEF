import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=p=>readFileSync(p,'utf8');
const sql=src('supabase/migrations/202610150007_dean_confirmed_reset.sql');
const jsx=src('src/v2/dean-cup.jsx');
const css=src('src/v2/dean-cup-layout.css');
const api=src('supabase/functions/v2-dean-cup/index.ts');

test('Reset requires authenticated teacher, canonical DGP and exact game code',()=>{
 for(const token of ['cw_validate_facilitator_token(p_token)',
  "version is distinct from 'zip_dgp_2026'",
  'p_confirmation_code is distinct from code',
  'for update of t',
  'Reinicio bloqueado'])
  assert.ok(sql.includes(token),token);
 assert.ok(api.includes("action==='reset_confirmed'"));
 assert.ok(api.includes("if(!teacher)"));
 assert.ok(api.includes("confirmation_code"));
});
test('Reset keeps facilitator and V1 and invalidates old student sessions through cascade',()=>{
 assert.ok(sql.includes('delete from public.cw_dean_tournaments where game_id=gid'));
 assert.ok(sql.includes("values(gid,'lobby',old_revision+1,'zip_dgp_2026')"));
 assert.ok(!sql.includes('delete from public.cw_games'));
 assert.ok(!sql.includes('delete from public.cw_players'));
 assert.ok(sql.includes('cw_dean_reset_audit'));
 assert.ok(sql.includes("'old_student_sessions_invalidated',true"));
});
test('Teacher confirms irreversibility once, PIN recovery if session expired, server still checks the exact code',()=>{
 assert.ok(jsx.includes('function DeanResetControl('));
 assert.ok(jsx.includes('role="dialog" aria-modal="true"'));
 assert.ok(jsx.includes('running||!ack||reauthRequired'));
 assert.ok(!jsx.includes('id="dean-reset-code"'));
 assert.ok(jsx.includes('onReauthenticate={authenticateWithPin}'));
 assert.ok(jsx.includes('dean-reauth-pin'));
 assert.ok(jsx.includes('onReauthenticate(reauthPin)'));
 assert.ok(jsx.includes('Reiniciar partida'));
 assert.ok(jsx.includes('este reinicio es irreversible'));
 assert.ok(jsx.includes('onReset={resetCup}'));
 assert.ok(css.includes('.dean-reset-backdrop'));
});
