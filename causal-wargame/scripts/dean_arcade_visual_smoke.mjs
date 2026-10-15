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
 await sliders.nth(0).fill('8');
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
  await page.locator('.dean-arcade-next').click();
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

async function wallAndTeacher(){
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
   const state={available:true,game_code:code,game_mode:'real_hours_10_v1',
    dgp_version:'zip_dgp_2026',phase,groups,mine:null,agenda_enabled:true,
    exam_count:10,server_now:new Date().toISOString()};
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(state)});
  });
  await page.goto(base+'/dean-'+(role==='wall'?'wall':'teacher')+'.html?game='+code,
   {waitUntil:'networkidle',timeout:45000});
  if(role==='teacher'){
   const next=page.locator('.dean-teacher-next');
   await next.waitFor({state:'visible'});
   assert.match(await next.innerText(),/ABRIR LOS 10 EXÁMENES/);
   await next.click();assert.match(await next.innerText(),/CERRAR JUEGO/);
   await next.click();assert.equal(phase,'finished');
   assert.equal(await page.locator('.dean-quest-control').count(),0);
  }else{
   assert.equal(await page.locator('.dean-wall .dean-board>article').count(),5);
   assert.equal(await page.locator('.dean-quest-wall').count(),0);
  }
  assert.deepEqual(errors,[],role+' browser errors');
  await page.screenshot({path:'visual-qa/arcade-'+role+'.png',fullPage:false});
  console.log('ARCADE PASS',role);
  await page.close();
 }
}
try{
 await playerViewport(1366,768);
 await playerViewport(390,844);
 await wallAndTeacher();
}finally{await browser.close()}
