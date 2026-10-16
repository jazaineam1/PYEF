import test from 'node:test';
import assert from 'node:assert/strict';
import{spawnSync}from'node:child_process';
import{readFileSync}from'node:fs';
const file=p=>readFileSync(p,'utf8');
const python=file('src/v2/dean-correlation.jsx').match(/const PYTHON=String.raw`([\s\S]*?)`;/)?.[1];

function pyRun(entries,selectedVar='horas_estudio_jornada',selectedY='nota_final'){
 if(!python)throw Error('Embedded Python missing');
 const cols=['estudiante_id','sala','examen_nro','arquetipo','pga_previo','complejidad','horas_estudio_jornada','horas_sueno_jornada','horas_bienestar_jornada','nota_final','auto_simulado'];
 const csv=[cols.join(','),...entries.map(r=>[r.id,r.room||1,r.exam||1,r.profile,3.5,1.2,r.study,8,1,r.grade,r.auto||'false'].join(','))].join('\n');
 const setup=`csv_input=${JSON.stringify(csv)}\nselected_var=${JSON.stringify(selectedVar)}\nselected_y=${JSON.stringify(selectedY)}\nselected_archetype='todos'\nonly_manual=False\n`;
 const cmd=spawnSync('python3',['-c',setup+python+'\nprint(json.dumps(result))'],{encoding:'utf8',timeout:10000});
 assert.equal(cmd.status,0,cmd.stderr);
 return JSON.parse(cmd.stdout.trim().split('\n').at(-1));
}
test('The 6-exam onboarding teaches only three explicit and different conditions',()=>{
 const intro=file('src/v2/DeanThreeProfilesIntro.jsx');
 const player=file('src/v2/dean-cup.jsx');
 assert.match(intro,/No todos empezamos desde el mismo lugar/);
 assert.match(intro,/ENTENDÍ MI PERSONAJE/);
 assert.match(intro,/ESTE ERES TÚ/);
 assert.match(player,/showProfileIntro\?<DeanThreeProfilesIntro/);
 assert.match(player,/cw-dean-intro-v8/);
 assert.equal((intro.match(/id:'(over|balanced|risk)'/g)||[]).length,3);
 const join=file('supabase/migrations/202610160002_three_profiles_simpson.sql');
 assert.match(join,/values\('over',1\),\('balanced',2\),\('risk',3\)/);
 assert.match(join,/p_room not between 1 and 2/);
 assert.match(join,/cw_dean_join_v3/);
 assert.match(join,/p.id<>created/);
 assert.match(file('supabase/functions/v2-dean-cup/index.ts'),/cw_dean_join_three_profiles_v8/);
});
test('Simpson reversal is proven with three disjoint student groups and Python itself',t=>{
 if(spawnSync('python3',['--version']).status!==0){t.skip('Python not available');return}
 const entries=[];
 for(const [profile,baseX,baseY,room] of [['over',2,12,1],['balanced',3,26,1],['risk',4,43,2]]){
  for(let i=0;i<3;i++)entries.push({id:profile+i,room,profile,study:baseX+i*.5,grade:baseY-i});
 }
 const got=pyRun(entries);
 assert.equal(got.simpson.status,'detected');
 assert.ok(got.simpson.global_r>.15,'Aggregate association should be positive');
 for(const key of ['over','balanced','risk']){
  assert.equal(got.simpson.groups[key].n,3);
  assert.ok(got.simpson.groups[key].r<-.15,'Within archetype sign must reverse');
 }
});
test('Simpson is not invented from one repeatedly measured student',t=>{
 if(spawnSync('python3',['--version']).status!==0){t.skip('Python not available');return}
 const entries=Array.from({length:6},(_,i)=>({id:'One',room:1,profile:'balanced',exam:i+1,study:2+i*.5,grade:15+i*3}));
 const result=pyRun(entries);
 assert.equal(result.n,6);
 assert.equal(result.simpson.students,1);
 assert.equal(result.simpson.status,'insufficient');
});
test('A genuinely monotonic result is not mislabeled Simpson',t=>{
 if(spawnSync('python3',['--version']).status!==0){t.skip('Python not available');return}
 const entries=[];
 for(const [profile,base] of [['over',2],['balanced',3],['risk',4]]){
  for(let i=0;i<3;i++)entries.push({id:profile+i,profile,study:base+i*.5,grade:8+(base+i*.5)*5});
 }
 const res=pyRun(entries);
 assert.equal(res.simpson.status,'not_detected');
 assert.ok(res.simpson.global_r>.15);
});
test('An automatic decision does not count as an independent human for Simpson',t=>{
 if(spawnSync('python3',['--version']).status!==0){t.skip('Python not available');return}
 const entries=[];
 for(const profile of ['over','balanced','risk']){
  for(let i=0;i<3;i++)entries.push({id:profile+i,profile,study:2+i*.5,grade:15+i*3,auto:i===2?'true':'false'});
 }
 const res=pyRun(entries);
 assert.equal(res.simpson.status,'insufficient');
 assert.equal(res.simpson.auto_excluded,3);
});
