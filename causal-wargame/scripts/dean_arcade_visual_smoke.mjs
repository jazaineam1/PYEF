#!/usr/bin/env node
// Browser exercise of arcade path only. Edge is fully mocked; never contacts live Supabase.
// Keep old visual smoke unchanged, since historical Cups use their original flow.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';

const base=process.env.DEAN_QA_BASE_URL||'http://127.0.0.1:4173';
const code='QAARCADE';
await mkdir('visual-qa',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const groups=Array.from({length:5},(_,i)=>({room_no:i+1,members:6,target_exams:60,exams_completed:0,
 coverage_pct:0,fair_score:0,average_score:null,is_complete:false}));
const csv=['estudiante_id,sala,examen_nro,horas_estudio_jornada,horas_sueno_jornada,horas_bienestar_jornada,nota_final',
 'QA Player,1,1,4,8,2,48'].join('\r\n');
const bodyOf=r=>{try{return r.postDataJSON()}catch{return {}}};

async function playerViewport(width,height){
 const page=await browser.newPage({viewport:{width,height},acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const scores=[];
 await page.addInitScript(code=>localStorage.setItem('cw-dean-v2-'+code,'a'.repeat(64)),code);
 await page.route('**/v2-dean-cup',async route=>{
  const b=bodyOf(route.request());
  if(b.action==='game_export'){
   return route.fulfill({status:200,contentType:'text/csv',body:csv});
  }
  if(b.action==='exam'){
   assert.ok(scores.length<10,'Backend must never accept exam 11');
   assert.equal(b.exam,scores.length+1);
   assert.ok(Number(b.study)+Number(b.sleep)+Number(b.wellness)<=14.00001);
   assert.ok(Number(b.sleep)>=5.5);
   const score=scores.length===0?48:42;
   scores.push(score);
   return route.fulfill({status:200,contentType:'application/json',
    body:JSON.stringify({score,exam_no:b.exam,completed:scores.length})});
  }
  const mine={alias:'QA Player',room:1,archetype:'balanced',pga:3.6,completed:scores.length,
   scores:[...scores],average_score:scores.length?scores.reduce((a,v)=>a+v,0)/scores.length:null};
  const state={available:true,game_code:code,game_mode:'real_hours_10_v1',dgp_version:'zip_dgp_2026',
   phase:'exams',groups,mine,exam_count:10,agenda_enabled:true,
   server_now:new Date().toISOString(),exam_deadline_at:new Date(Date.now()+20*60*1000).toISOString()};
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(state)});
 });
 await page.goto(base+'/dean-play.html?game='+code,{waitUntil:'networkidle',timeout:45000});
 await page.locator('.dean-arcade-exam').waitFor({timeout:10000});
 assert.equal(await page.locator('.dean-game-science-tools').count(),0,'No lesson or scientific challenge in arcade');
 assert.equal(await page.locator('.dean-exam-controls .dean-slider').count(),3,'Three sliders');
 const sliders=page.locator('.dean-exam-controls input[type=range]');
 assert.equal(await sliders.nth(1).getAttribute('min'),'5.5','No 2-hour sleep');
 assert.match(await page.locator('.dean-arcade-hours').innerText(),/14/);
 await sliders.nth(0).focus();await sliders.nth(0).press('End');
 assert.match(await page.locator('.dean-arcade-trade').innerText(),/−/);
 assert.equal(await sliders.nth(0).inputValue(),'8');
 const total=await sliders.evaluateAll(items=>items.reduce((t,e)=>t+Number(e.value),0));
 assert.ok(total<=14.00001,'Auto sacrifice must stay in budget');
 await page.screenshot({path:'visual-qa/arcade-exam-'+width+'x'+height+'.png',fullPage:false});
 for(let i=1;i<=10;i++){
  const submit=page.locator('.dean-exam-action');
  await submit.waitFor({state:'visible',timeout:10000});
  if(width>=790){
   const bounds=await submit.boundingBox();
   assert.ok(bounds&&bounds.y+bounds.height<=height+3,'Exam button must not clip below desktop viewport');
  }
  await submit.click();
  await page.locator('.dean-arcade-result').waitFor({state:'visible',timeout:15000});
  assert.match(await page.locator('.dean-arcade-score').innerText(),i===1?/48/:/42/);
  if(i===1){
   assert.match(await page.locator('.dean-arcade-result h2').innerText(),/MÁQUINA/);
   await page.screenshot({path:'visual-qa/arcade-result-'+width+'x'+height+'.png',fullPage:false});
  }
  await page.locator('.dean-arcade-result .dean-arcade-next').click();
 }
 await page.locator('.dean-arcade-finish').waitFor({state:'visible',timeout:10000});
 assert.equal(await page.locator('.dean-exam-action').count(),0,'No exam 11');
 const [download]=await Promise.all([
  page.waitForEvent('download',{timeout:10000}),
  page.locator('.dean-arcade-download').click()
 ]);
 assert.match(download.suggestedFilename(),/sala_1_10_examenes/);
 assert.ok(await page.locator('.dean-arcade-return').isVisible(),'Return to Teams button');
 await page.screenshot({path:'visual-qa/arcade-finish-'+width+'x'+height+'.png',fullPage:false});
 assert.deepEqual(errors,[],'Browser has no runtime errors');
 console.log('ARCADE PASS player',width,height,'10 exams, download and visual flow');
 await page.close();
}

async function wallAndTeacher(mode='real_hours_10_v1'){
 for(const role of ['wall','teacher']){
  const page=await browser.newPage({viewport:{width:1366,height:768}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(({role,code})=>{
   if(role==='teacher'){
    sessionStorage.setItem('df_facilitator_game_code',code);
    sessionStorage.setItem('df_facilitator_token','b'.repeat(64));
   }
  },{role,code});
  let phase='lobby';
  await page.route('**/v2-dean-cup',async route=>{
   const b=bodyOf(route.request());
   if(b.action==='teacher')assert.equal(b.game_code,code,'Teacher sends Cup code to backend');
   if(b.action==='teacher'){assert.equal(b.command,'next');phase='exams'}
   if(b.action==='game_finish')phase='finished';
   const isSix=mode==='real_hours_6_v1';
   const people=Array.from({length:30},(_,i)=>({alias:'Jugador '+(i+1),room_no:1+Math.floor(i/6),avatar_no:i%12,ready:i%2===0}));
   const state={available:true,game_code:code,game_mode:mode,
    dgp_version:'zip_dgp_2026',phase,groups:groups.map(g=>({...g,target_exams:isSix?36:60})),mine:null,
    lobby_players:people,agenda_enabled:true,
    exam_count:isSix?6:10,server_now:new Date().toISOString()};
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(state)});
  });
  await page.goto(base+'/dean-'+(role==='wall'?'wall':'teacher')+'.html?game='+code,
   {waitUntil:'networkidle',timeout:45000});
  if(role==='teacher'){
   const next=page.locator('.dean-teacher-next');
   await next.waitFor({state:'visible'});
   assert.match(await next.innerText(),mode==='real_hours_6_v1'?/ABRIR LOS 6 EXÁMENES/:/ABRIR LOS 10 EXÁMENES/);
   await next.click();
   await page.waitForFunction(()=>document.querySelector('.dean-teacher-next')?.textContent?.includes('CERRAR JUEGO'),{timeout:10000});
   await next.click();
   await next.waitFor({state:'detached',timeout:10000});
   assert.equal(phase,'finished');
   assert.equal(await page.locator('.dean-quest-control').count(),0);
  }else{
   assert.equal(await page.locator('.dean-wall .dean-board>article').count(),5);
   assert.equal(await page.locator('.dean-quest-wall').count(),0);
  }
  assert.equal(await page.locator('.dean-lobby-member').count(),30,'All 30 named animal players shown on '+role);
  assert.equal(await page.locator('.dean-lobby-member').count(),30);
  assert.deepEqual(errors,[],role+' browser errors');
  await page.screenshot({path:'visual-qa/arcade-'+role+'.png',fullPage:false});
  console.log('ARCADE PASS',role);
  await page.close();
 }
}
async function staleSessionRecovers(){
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const stale='a'.repeat(64);
 await page.addInitScript(({code,stale})=>localStorage.setItem('cw-dean-v2-'+code,stale),{code,stale});
 let joined=false;
 await page.route('**/v2-dean-cup',async route=>{
  const input=bodyOf(route.request());
  const session=route.request().headers()['x-game-token']||'';
  if(input.action==='state'&&session===stale){
   return route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({error:'Sesión inválida'})});
  }
  if(input.action==='join')joined=true;
  const mine=joined?{alias:'Recuperado',room:1,archetype:'balanced',pga:3.6,completed:0,average_score:null,scores:[]}:null;
  const value={available:true,game_code:code,game_mode:'real_hours_10_v1',dgp_version:'zip_dgp_2026',
   phase:'lobby',groups,mine,exam_count:10,agenda_enabled:true,server_now:new Date().toISOString()};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(value)});
 });
 await page.goto(base+'/dean-play.html?game='+code,{waitUntil:'networkidle',timeout:45000});
 await page.locator('.dean-join').waitFor({timeout:10000});
 assert.equal(await page.evaluate(code=>localStorage.getItem('cw-dean-v2-'+code),code),null,
  'Stale player credential should be discarded automatically');
 await page.locator('.dean-label input').fill('Recuperado');
 await page.getByRole('button',{name:/ENTRAR A LA COPA/}).click();
 await page.locator('.dean-arcade-player').waitFor({timeout:10000});
 const stored=await page.evaluate(code=>localStorage.getItem('cw-dean-v2-'+code),code);
 assert.ok(stored&&stored!==stale,'Rejoined player gets a new token');
 console.log('ARCADE PASS expired local token repaired without cache clearing or teacher clicks');
 await page.close();
}

async function sixRoundViewport(width,height,skip=false){
 const page=await browser.newPage({viewport:{width,height},acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const scores=[];let phase='lobby',ready=false,policy=null;
 const sixCode='QA6ARCADE';
 await page.addInitScript(c=>localStorage.setItem('cw-dean-v2-'+c,'a'.repeat(64)),sixCode);
 const roster=[
  {alias:'QA Player',room_no:1,avatar_no:3,ready:false},
  {alias:'Companera',room_no:1,avatar_no:8,ready:true},
  {alias:'Sala Delta',room_no:4,avatar_no:6,ready:true}
 ];
 const buildState=()=>({available:true,game_code:sixCode,game_mode:'real_hours_6_v1',
  phase,dgp_version:'zip_dgp_2026',exam_count:6,agenda_enabled:true,
  groups:groups.map(g=>({...g,target_exams:36})),lobby_players:roster.map((p,i)=>i===0?{...p,ready}:p),
  my_avatar_no:3,my_lobby_ready:ready,
  mine:{alias:'QA Player',room:1,archetype:'balanced',pga:3.6,completed:scores.length,
   scores:[...scores],policy_choice:policy,average_score:scores.length?scores.reduce((a,n)=>a+n,0)/scores.length:null},
  server_now:new Date().toISOString(),
  exam_deadline_at:new Date(Date.now()+20*60*1000).toISOString()});
 await page.route('**/v2-dean-cup',async route=>{
  const b=bodyOf(route.request());
  const reply=o=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(o)});
  if(b.action==='lobby_ready'){ready=b.ready===true;return reply(buildState())}
  if(b.action==='exam'){
   assert.ok(scores.length<6);assert.equal(b.exam,scores.length+1);
   assert.ok(b.study>=1&&b.study<=6);assert.ok(b.sleep>=7&&b.sleep<=9);
   assert.ok(b.wellness>=0&&b.wellness<=4);
   assert.ok(Number(b.study)+Number(b.sleep)+Number(b.wellness)<=14.00001);
   scores.push(scores.length===0?48:42);
   return reply({score:scores[scores.length-1],exam_no:b.exam,completed:scores.length});
  }
  if(b.action==='auto_finish'){while(scores.length<6)scores.push(42);return reply({completed:6})}
  if(b.action==='policy_submit'){policy=b.choice;return reply({saved:true,choice:policy})}
  if(b.action==='game_export'){
   const columns=['estudiante_id','sala','examen_nro','arquetipo','pga_previo','complejidad','horas_estudio_jornada','horas_sueno_jornada','horas_bienestar_jornada','nota_final','auto_simulado'];
   const rows=Array.from({length:30},(_,i)=>{
    const sala=Math.floor(i/6)+1,well=(i%6)/2;
    return ['Alumno '+(i+1),sala,i%6+1,'balanced',3.5,1.2,4,8,well,49-well*8,false];
   });
   return route.fulfill({status:200,contentType:'text/csv',
     body:[columns,...rows].map(row=>row.join(',')).join('\\r\\n')+'\\r\\n'});
  }
  return reply(buildState());
 });
 await page.goto(base+'/dean-play.html?game='+sixCode,{waitUntil:'networkidle',timeout:45000});
 await page.locator('.dean-arcade-lobby').waitFor({timeout:12000});
 assert.equal(await page.locator('.dean-lobby-member').count(),2);
 await page.locator('.dean-lobby-ready-button').click();
 await page.getByText(/¡ESTOY LISTO!/).first().waitFor({timeout:10000});
 await page.screenshot({path:'visual-qa/six-lobby-'+width+'.png',fullPage:false});
 phase='exams';
 await page.reload({waitUntil:'networkidle'});
 await page.locator('.dean-arcade-exam').waitFor({timeout:12000});
 const sliders=page.locator('.dean-exam-controls input[type=range]');
 assert.equal(await sliders.count(),3);
 assert.equal(await sliders.nth(0).getAttribute('max'),'6');
 assert.equal(await sliders.nth(1).getAttribute('min'),'7');
 await sliders.nth(0).focus();await sliders.nth(0).press('End');
 assert.equal(await sliders.nth(0).inputValue(),'6');
 assert.match(await page.locator('.dean-arcade-trade').innerText(),/−/);
 const visible=page.locator('.dean-exam-action, .dean-exam-controls .dean-slider input, .dean-arcade-skip');
 for(const control of await visible.all()){
  const bounds=await control.boundingBox();
  assert.ok(bounds,'Every main control must be laid out');
  if(width>=790)assert.ok(bounds.y+bounds.height<=height+2,'Controls need 100% zoom, not 75%');
 }
 await page.screenshot({path:'visual-qa/six-exam-'+width+'.png',fullPage:false});
 if(skip){
  await page.locator('.dean-arcade-skip').click();
 }else{
  for(let n=1;n<=6;n++){
   await page.locator('.dean-exam-action').click();
   await page.locator('.dean-arcade-result').waitFor({timeout:10000});
   await page.locator('.dean-arcade-result .dean-arcade-next').click();
  }
 }
 await page.locator('.corr-embedded').waitFor({timeout:12000});
 assert.equal(scores.length,6,'exactly six exams');
 assert.equal(await page.locator('.corr-embedded input[type=file]').count(),0,
  'Data must come from the server automatically; never ask players to upload CSV');
 assert.match(await page.locator('.corr-embedded').innerText(),/5 SALAS|cinco salas|cinco/i);
 await page.screenshot({path:'visual-qa/six-in-game-python-'+width+'.png',fullPage:false});
 // The user may always continue even if CDN Pyodide is unavailable. Scientific
 // Python correlation is independently checked against known data in node tests.
 await page.getByRole('button',{name:/Ir a decisión/}).click();
 await page.locator('.dean-rector-final').waitFor({timeout:12000});
 assert.equal(await page.locator('.dean-exam-action').count(),0,'no seventh exam');
 assert.match(await page.locator('.dean-rector-final h3').innerText(),/quitar los beneficios de bienestar/);
 const [dl]=await Promise.all([page.waitForEvent('download',{timeout:10000}),
  page.locator('.dean-arcade-download').click()]);
 assert.match(dl.suggestedFilename(),/TODAS_LAS_SALAS_6_examenes/);
 await page.locator('.dean-rector-choice').last().click();
 await page.locator('.dean-rector-submit').click();
 await page.getByText(/DECISIÓN GUARDADA/).waitFor({timeout:10000});
 assert.equal(policy,'evidencia_insuficiente');
 await page.screenshot({path:'visual-qa/six-rector-'+width+'.png',fullPage:false});
 assert.deepEqual(errors,[]);
 console.log('SIX ARCADE PASS '+width+'x'+height+' skip='+skip+' lobby, six exams, 100% layout, full CSV, Rector');
 await page.close();
}

try{
 await playerViewport(1366,768);
 await playerViewport(390,844);
 await wallAndTeacher();
 await wallAndTeacher('real_hours_6_v1');
 await staleSessionRecovers();
 await sixRoundViewport(1366,768,false);
 await sixRoundViewport(1280,720,false);
 await sixRoundViewport(390,844,true);

}finally{await browser.close()}
