import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARCADE_PROTOCOL,ARCADE_CAP,ARCADE_EXAMS,ARCADE_RANGES,arcadeDefault,
 arcadeValid,arcadeCost,rebalanceArcade,arcadeTier,arcadeTitle,arcadeStreak} from '../src/v2/dean-arcade.js';
const read=p=>readFileSync(p,'utf8');
test('New Cup has ten exams and a real 14-hour limit',()=>{
 assert.equal(ARCADE_EXAMS,10);assert.equal(ARCADE_CAP,14);assert.equal(ARCADE_PROTOCOL,'real_hours_10_v1');
 assert.deepEqual(ARCADE_RANGES.sleep,[5.5,9,8]);
 assert.equal(arcadeCost(arcadeDefault()),14);
 assert.ok(arcadeValid(arcadeDefault()));
 assert.equal(arcadeValid({study:8,sleep:9,wellness:4}),false);
 assert.equal(arcadeValid({study:5,sleep:4,wellness:1}),false);
 assert.equal(arcadeValid({study:3.8,sleep:8,wellness:2}),false);
});
test('Increasing any slider forces a tradeoff and stays below 14 hours',()=>{
 for(const key of Object.keys(ARCADE_RANGES)){
  const before=arcadeDefault(),after=rebalanceArcade(before,key,ARCADE_RANGES[key][1]);
  assert.ok(arcadeValid(after.values));assert.ok(after.values[key]>before[key]);
  assert.ok(after.sacrificed.length>0);assert.ok(after.used<=14);
 }
});
test('Long alternating gameplay never overspends',()=>{
 let values=arcadeDefault();
 const keys=['study','sleep','wellness'];
 for(let i=0;i<90;i++){
  const k=keys[i%3];values=rebalanceArcade(values,k,ARCADE_RANGES[k][1]).values;
  assert.ok(arcadeValid(values),'Round '+i);
 }
});
test('Celebrations, titles and streaks use received grades only',()=>{
 assert.equal(arcadeTier(48).id,'legend');assert.equal(arcadeTier(43).id,'epic');
 assert.equal(arcadeTier(12).id,'retry');assert.equal(arcadeStreak([39,41,43,49]),3);
 assert.equal(arcadeTitle(46),'LEYENDA');
});
test('Server owns scoring, completion and per-room export',()=>{
 const sql=read('supabase/migrations/202610150017_dean_arcade_real_hours_10.sql');
 const edge=read('supabase/functions/v2-dean-cup/index.ts');
 const jsx=read('src/v2/dean-cup.jsx');
 assert.match(sql,/game_protocol='real_hours_10_v1'/);
 assert.match(sql,/14\.00001/);assert.match(sql,/max_exams.*10/);
 assert.match(sql,/cw_dean_game_export_v3/);
 assert.match(sql,/q\.room_no=p\.room_no/);
 assert.match(sql,/cw_dean_game_start_v3/);assert.match(sql,/cw_dean_game_finish_v3/);
 assert.match(edge,/game_export/);assert.match(edge,/game_finish/);
 assert.match(jsx,/DeanArcadeResult/);
 assert.match(jsx,/dean-arcade-finish/);
 assert.match(jsx,/ARCADE_EXAMS/);
});
