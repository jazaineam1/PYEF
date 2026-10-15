#!/usr/bin/env node
// Browser-only, isolated visual smoke. All Edge calls intercepted with fixture responses.
// No production games, people, PINs or tokens are ever accessed or changed.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';

const base=process.env.DEAN_QA_BASE_URL||'http://127.0.0.1:4173';
const code='QAVIEW';
const groups=[
 {room_no:1,members:1,target_exams:15,exams_completed:15,coverage_pct:100,fair_score:38.7,average_score:38.7,is_complete:true},
 {room_no:2,members:4,target_exams:60,exams_completed:37,coverage_pct:61.7,fair_score:24.2,average_score:39.2,is_complete:false},
 {room_no:3,members:6,target_exams:90,exams_completed:60,coverage_pct:66.7,fair_score:29.9,average_score:44.9,is_complete:false},
 {room_no:4,members:0,target_exams:0,exams_completed:0,coverage_pct:0,fair_score:null,average_score:null,is_complete:false},
 {room_no:5,members:0,target_exams:0,exams_completed:0,coverage_pct:0,fair_score:null,average_score:null,is_complete:false}
];
const fixture={
 available:true,dgp_version:'zip_dgp_2026',phase:'exams',groups,
 server_now:new Date().toISOString(),exam_deadline_at:new Date(Date.now()+18*60*1000).toISOString(),
 mine:{alias:'Prueba visual',room:1,archetype:'balanced',pga:3.6,completed:7}
};
await mkdir('visual-qa',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
let failures=0;
async function testView(role,width,height){
 const errors=[];
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({role,code})=>{
  if(role==='player')localStorage.setItem('cw-dean-v2-'+code,'a'.repeat(64));
  if(role==='teacher'){
   sessionStorage.setItem('df_facilitator_game_code',code);
   sessionStorage.setItem('df_facilitator_token','b'.repeat(64));
  }
 },{role,code});
 await page.route('**/v2-dean-cup',async route=>{
  const req=route.request();let input={};
  try{input=req.postDataJSON()}catch{}
  const output=input.action==='exam'?{score:43.2}:fixture;
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(output)});
 });
 const file=role==='player'?'dean-play':role==='wall'?'dean-wall':'dean-teacher';
 await page.goto(base+'/'+file+'.html?game='+code,{waitUntil:'networkidle',timeout:45000});
 const main=role==='player'?'.dean-player':role==='wall'?'.dean-wall-main':'.dean-teacher';
 await page.locator(main).waitFor({timeout:10000});
 const metrics=await page.evaluate(()=>{
  const viewport=window.innerHeight;
  const doc=document.documentElement;
  const regions=['.dean-page','.dean-banner','.dean-player-stage','.dean-wall-grid','.dean-teacher-grid'];
  const result={viewport,scrollHeight:doc.scrollHeight,scrollWidth:doc.scrollWidth,width:innerWidth};
  for(const name of regions){const e=document.querySelector(name);if(e){const b=e.getBoundingClientRect();result[name]={top:b.top,bottom:b.bottom,width:b.width,height:b.height}}}
  return result;
 });
 assert.ok(metrics.scrollHeight<=metrics.viewport+3,`${role} ${width}×${height}: document overflows vertically (${JSON.stringify(metrics)})`);
 assert.ok(metrics.scrollWidth<=width+3,`${role} ${width}×${height}: document overflows horizontally`);
 if(role==='wall'){
  assert.equal(await page.locator('.dean-wall .dean-board>article').count(),5,'Wall needs exactly five rooms');
  const last=await page.locator('.dean-wall .dean-board>article').last().boundingBox();
  assert.ok(last && last.y+last.height<=height+2,`Last room outside screen: ${JSON.stringify(last)}`);
 }
 if(role==='player'){
  const hud=page.locator('.dean-hud');
  assert.equal(await hud.count(),1,'One compact HUD');
  const box=await hud.boundingBox();
  assert.ok(box && box.x+box.width<=width+2,'HUD clipped right');
  const action=page.locator('.dean-exam-action');
  assert.ok(await action.isVisible(),'Exam action must not be hidden');
  if(width>=790){
   const b=await action.boundingBox();
   assert.ok(b && b.y+b.height<=height+2,`Exam action below viewport: ${JSON.stringify(b)}`);
  }
  await page.locator('.dean-hud>summary').click();
  assert.equal(await page.locator('.dean-hud-popover>div').count(),5,'HUD dropdown must show five rooms');
  await page.locator('.dean-hud>summary').click();
  await action.click();
  await page.locator('.dean-score-flash').waitFor({timeout:4000});
  assert.match(await page.locator('.dean-score-flash').innerText(),/43\.2/,'Flash must show actual mock server grade');
 }
 if(role==='teacher'){
  const control=page.locator('.dean-teacher-toolbar .dean-teacher-next');
  assert.ok(await control.isVisible(),'Primary teacher action visible');
  if(width>=790){const b=await control.boundingBox();assert.ok(b && b.y+b.height<=height+2,'Teacher control below viewport')}
  assert.equal(await page.locator('.dean-teacher-page .dean-board>article').count(),5);
 }
 assert.deepEqual(errors,[],`${role} errors: ${errors.join('; ')}`);
 await page.screenshot({path:`visual-qa/${role}-${width}x${height}.png`,fullPage:false});
 console.log('PASS',role,width+'x'+height,JSON.stringify(metrics));
 await page.close();
}
try{
 for(const [w,h] of [[1366,768],[1920,1080],[390,844]]){
  for(const role of ['player','wall','teacher']){
   try{await testView(role,w,h)}catch(e){failures++;console.error('FAIL',role,w+'x'+h,e.stack||e)}
  }
 }
}finally{await browser.close()}
assert.equal(failures,0,`Visual viewport smoke failed for ${failures} cases`);
console.log('DEAN_VISUAL_QA_OK · nine viewport/role checks · no production mutation');
