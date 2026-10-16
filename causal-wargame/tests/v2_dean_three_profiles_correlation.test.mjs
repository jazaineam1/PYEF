import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const file=p=>readFileSync(p,'utf8');
const python=file('src/v2/dean-correlation.jsx').match(/const PYTHON=String.raw`([\s\S]*?)`;/)?.[1];

function pyRun(entries,onlyManual=false){
 if(!python)throw Error('Embedded Python missing');
 const cols=['estudiante_id','sala','examen_nro','arquetipo','pga_previo','complejidad','horas_estudio_jornada','horas_sueno_jornada','horas_bienestar_jornada','nota_final','auto_simulado'];
 const csv=[cols.join(','),...entries.map(r=>[r.id,r.room||1,r.exam||1,r.profile,3.5,1.2,r.study,8,1,r.grade,r.auto||'false'].join(','))].join('\n');
 const setup=`csv_input=${JSON.stringify(csv)}\nselected_var='horas_estudio_jornada'\nselected_y='nota_final'\nselected_archetype='todos'\nonly_manual=${onlyManual?'True':'False'}\n`;
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
 assert.match(join,/p_room <> 1/);
 assert.match(join,/cw_dean_join_v3/);
 assert.match(join,/p.id<>created/);
 assert.match(file('supabase/functions/v2-dean-cup/index.ts'),/cw_dean_queue_register_v9/);
 assert.match(file('supabase/migrations/202610160003_two_rooms_after_lobby_v9.sql'),/new_room:=1;/);
});

test('By-archetype correlations remain available without labeling a paradox',t=>{
 if(spawnSync('python3',['--version']).status!==0){t.skip('Python unavailable');return}
 const rows=[];
 for(const [profile,baseX,baseY] of [['over',2,12],['balanced',3,26],['risk',4,43]]){
  for(let i=0;i<3;i++)rows.push({id:profile+i,profile,study:baseX+i*.5,grade:baseY-i});
 }
 const got=pyRun(rows);
 assert.equal(got.n,9);
 assert.equal(got.n_students,9);
 for(const name of ['over','balanced','risk']){
  assert.equal(got.profiles[name].n,3);
  assert.ok(got.profiles[name].r<-.9);
 }
 assert.equal(Object.hasOwn(got,'simpson'),false);
 assert.ok(got.factors.horas_estudio_jornada.r>0);
});

test('Six repeated exams remain one student, with a within-student coefficient',t=>{
 if(spawnSync('python3',['--version']).status!==0){t.skip('Python unavailable');return}
 const rows=Array.from({length:6},(_,i)=>({id:'one',profile:'balanced',exam:i+1,study:2+i*.5,grade:15+i*3}));
 const got=pyRun(rows);
 assert.equal(got.n,6);
 assert.equal(got.n_students,1);
 assert.equal(got.n_within,6);
 assert.ok(got.r_within>.9);
});

test('Manual-only filter excludes simulated exam records',t=>{
 if(spawnSync('python3',['--version']).status!==0){t.skip('Python unavailable');return}
 const rows=[
  {id:'one',profile:'over',study:2,grade:13},
  {id:'two',profile:'balanced',study:3,grade:20},
  {id:'three',profile:'risk',study:4,grade:36,auto:'true'}];
 const got=pyRun(rows,true);
 assert.equal(got.n,2);
 assert.equal(got.n_students,2);
 assert.equal(got.n_simulated,1);
});

test('Rector feedback is available for all three choices and only after persistence',()=>{
 const src=file('src/v2/DeanRectorFinal.jsx');
 for(const option of ["si","no","evidencia_insuficiente"])assert.match(src,new RegExp('^ '+option+':\\{','m'));
 assert.match(src,/RECTOR_FEEDBACK\[answer\]/);
 assert.match(src,/EL RECTOR RESPONDE/);
 assert.match(src,/aria-live="polite"/);
 assert.doesNotMatch(src,/La decisión se debatirá fuera del juego/);
 const lab=file('src/v2/dean-correlation.jsx');
 assert.doesNotMatch(lab,/simpson/i);
 assert.match(lab,/Comparación por arquetipo/);
 assert.match(lab,/Toma tu decisión y recibirás la respuesta del Rector/);
});
