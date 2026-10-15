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
function groupFixture(n){
 const distribution=Array.from({length:5},(_,i)=>Math.floor(n/5)+(i<n%5?1:0));
 return distribution.map((members,i)=>({
  room_no:i+1,members,target_exams:15*members,exams_completed:6*members,
  coverage_pct:members?40:0,fair_score:members?Number((38-i*2)*.4.toFixed(1)):null,
  average_score:members?38-i*2:null,is_complete:false
 }));
}
async function testView(role,width,height,attendees=18){
 const roomGroups=groupFixture(attendees);
 const sample={...fixture,game_code:code,groups:roomGroups};

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
 let lessonStep='challenge', lessonInitial=null, lessonRevision=null;
 const lessonState=()=>({
  available:true,phase:'exams',step:lessonStep,paused:false,
  mine:{initial:lessonInitial,revision:lessonRevision},
  counts:{initial:Number(Boolean(lessonInitial)),revision:Number(Boolean(lessonRevision))},
  correct:lessonStep==='debrief'?'b':null,registered:18,
  rooms:[1,2,3,4,5].map(i=>({room_no:i,participants:roomGroups[i-1].members,learning_points:0}))
 });
 await page.route('**/v2-dean-cup',async route=>{
  const req=route.request();let input={};
  try{input=req.postDataJSON()}catch{}
  let output=sample;
  if(input.action==='exam')output={score:43.2};
  if(input.action==='learning_state')output=lessonState();
  if(input.action==='learning_submit'){
   if(input.kind==='initial')lessonInitial=input.choice;
   else lessonRevision=input.choice;
   output={accepted:true,already_submitted:false,choice:input.choice};
  }
  if(input.action==='learning_teacher'){
   if(input.command==='evidence')lessonStep='evidence';
   else if(input.command==='debrief')lessonStep='debrief';
   output=lessonState();
  }
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
  const banner=await page.locator('.dean-wall .dean-banner').boundingBox();
  const meta=await page.locator('.dean-wall .dean-banner-meta').boundingBox();
  assert.ok(meta&&banner&&meta.y+meta.height<=banner.y+banner.height+2,'Wall header metadata overflows into title');
  const clipped=await page.locator('.dean-wall .dean-team-empty .dean-rating').evaluateAll(nodes=>nodes.map(el=>({client:el.clientWidth,scroll:el.scrollWidth})));
  assert.ok(clipped.every(x=>x.scroll<=x.client+3),'Empty-room labels are clipped');
  assert.equal(await page.locator('.dean-wall .dean-board>article').count(),5,'Wall needs exactly five rooms');
  assert.equal(await page.locator('.dean-wall .dean-quest-wall-rooms>div').count(),5,'Five learning teams in Wall');
  const last=await page.locator('.dean-wall .dean-board>article').last().boundingBox();
  assert.ok(last && last.y+last.height<=height+2,`Last room outside screen: ${JSON.stringify(last)}`);
 }
 if(role==='player'){
  await page.locator('.dean-quest').waitFor();
  assert.equal(await page.locator('.dean-quest-option').count(),3,'Exactly three contextual choices');
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
  const flash=page.locator('.dean-score-flash');
  await flash.waitFor({state:'attached',timeout:4000});
  assert.match(await flash.textContent(),/43\.2/,'Score source must match server');
  if(width<790){
   assert.equal(await flash.isVisible(),false,'Mobile toast must not cover the exam button');
   assert.match(await page.locator('.dean-hud-earned').innerText(),/43\.2/,'The mobile HUD should display the latest score');
   const frame=await page.locator('.dean-hud>summary').boundingBox();
   const award=await page.locator('.dean-hud-earned').boundingBox();
   assert.ok(frame&&award&&award.y+award.height<=frame.y+frame.height+1,'Mobile grade spills outside Halo HUD frame');
  }else{assert.ok(await flash.isVisible(),'Desktop arcade score toast visible')}
  const exam=await page.locator('.dean-exam').boundingBox();
  const grade=await page.locator('.dean-grade').boundingBox();
  assert.ok(exam&&grade&&grade.y+grade.height<=exam.y+exam.height+2,'Grade feedback overlaps exam container');
 }
 if(role==='teacher'){
  assert.ok(await page.locator('.dean-quest-control').isVisible(),'Teacher can teach and reveal evidence');
  const newCup=page.locator('.dean-new-cup-trigger');
  assert.ok(await newCup.isVisible(),'Teacher can always create a new tournament');
  const header=await page.locator('.dean-teacher-page .dean-banner').boundingBox();
  for(const action of [newCup,page.locator('.dean-reset-trigger')]){
   const a=await action.boundingBox();
   assert.ok(a&&header&&a.y>=header.y-1&&a.y+a.height<=header.y+header.height+1,
    'Tournament buttons must fit WITHIN the header, not overlap the bottom of the screen');
  }
  await newCup.click();
  const newDialog=page.getByRole('dialog',{name:/Comenzar una Copa nueva/});
  assert.ok(await newDialog.isVisible(),'New Copa explains that old data are retained');
  await newDialog.getByRole('button',{name:'Cancelar'}).click();
  assert.equal(await page.getByRole('dialog').count(),0,'Cancelling a new game does not create or reset anything');
  const reset=page.locator('.dean-reset-trigger');
  assert.ok(await reset.isVisible(),'Facilitator has a persistent reset control');
  await reset.click();
  const dialog=page.getByRole('dialog',{name:/Reiniciar esta Copa/});
  assert.ok(await dialog.isVisible(),'Reset requires a visible confirmation');
  const danger=dialog.locator('.dean-reset-danger');
  assert.ok(await danger.isDisabled(),'Reset disabled before acknowledgement');
  await dialog.locator('#dean-reset-code').fill(code);
  assert.ok(await danger.isDisabled(),'Exact game code alone is insufficient');
  await dialog.locator('.dean-reset-agreement input').check();
  assert.ok(await danger.isEnabled(),'Reset enabled only with exact code and consent');
  await dialog.getByRole('button',{name:/Cancelar/}).click();
  assert.equal(await page.getByRole('dialog').count(),0,'Cancel never resets');
  const control=page.locator('.dean-teacher-toolbar .dean-teacher-next');
  assert.ok(await control.isVisible(),'Primary teacher action visible');
  if(width>=790){const b=await control.boundingBox();assert.ok(b && b.y+b.height<=height+2,'Teacher control below viewport')}
  assert.equal(await page.locator('.dean-teacher-page .dean-board>article').count(),5);
 }
 assert.deepEqual(errors,[],`${role} errors: ${errors.join('; ')}`);
 await page.screenshot({path:`visual-qa/${role}-${attendees}-${width}x${height}.png`,fullPage:false});
 console.log('PASS',role,width+'x'+height,JSON.stringify(metrics));
 await page.close();
}
async function testNewCupFromHistoric(width,height){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let creations=0,resets=0;
 await page.addInitScript(({code})=>{
  sessionStorage.setItem('df_facilitator_game_code',code);
  sessionStorage.setItem('df_facilitator_token','b'.repeat(64));
 },{code});
 await page.route('**/v2-dean-cup',async route=>{
  const b=route.request().postDataJSON();
  let body={};
  if(b.action==='new_cup'){
   creations++;
   assert.equal(b.game_code,code,'Fork must be from current historical cup');
   body={created:true,game_code:'COPA-NEWTEST1234',
    facilitator_token:'c'.repeat(64),source_game_preserved:true};
  }else if(b.action==='reset_confirmed'){
   resets++;body={error:'No se debe reiniciar la Copa histórica'};
  }else if(b.action==='state'){
   body={...fixture,game_code:b.game_code,phase:b.game_code===code?'finished':'lobby',
    available:true,dgp_version:b.game_code===code?'legacy_v1':'zip_dgp_2026',mine:null};
  }else if(b.action==='quiz_state'){
   body={phase:'podium',question_no:8,leaderboard:[],participants:0,auto_mode:false,
    server_now:new Date().toISOString()};
  }else if(b.action==='learning_state'){
   body={available:false};
  }
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
 });
 await page.goto(base+'/dean-teacher.html?game='+code,{waitUntil:'networkidle',timeout:45000});
 const button=page.locator('.dean-new-cup-trigger');await button.waitFor({state:'visible',timeout:10000});
 assert.equal(await page.locator('.dean-reset-trigger').count(),0,'Historic finished FUTUROS has no destructive reset');
 let top=await button.boundingBox();
 const bar=await page.locator('.dean-banner').boundingBox();
 assert.ok(top&&bar&&top.y>=bar.y&&top.y+top.height<=bar.y+bar.height,'New Copa visible in historic finished header');
 await button.click();
 await page.getByRole('dialog',{name:/Comenzar una Copa nueva/}).getByRole('button',{name:/Sí, crear Copa nueva/}).click();
 await page.waitForURL('**/dean-teacher.html?game=COPA-NEWTEST1234',{timeout:6000});
 await page.locator('.dean-active-cup-code').filter({hasText:'COPA-NEWTEST1234'}).waitFor({timeout:10000});
 await page.locator('.dean-reset-trigger').waitFor({state:'visible',timeout:10000});
 assert.equal(creations,1,'One new tournament is created');
 assert.equal(resets,0,'No past session was deleted');
 assert.equal(await page.evaluate(()=>sessionStorage.getItem('df_facilitator_game_code')),'COPA-NEWTEST1234','New teacher session is active');
 const metrics=await page.evaluate(()=>({scrollHeight:document.documentElement.scrollHeight,
   scrollWidth:document.documentElement.scrollWidth,innerHeight,innerWidth}));
 assert.ok(metrics.scrollHeight<=height+3 && metrics.scrollWidth<=width+3,'Created game header overflows viewport');
 assert.deepEqual(errors,[],'No browser errors while creating new tournament: '+errors.join('; '));
 await page.screenshot({path:`visual-qa/new-cup-${width}x${height}.png`,fullPage:false});
 console.log('PASS_NEW_CUP_FROM_HISTORIC',width+'x'+height);
 await page.close();
}

// Quiz uses only fixtures; this validates the three-state UI and complete 1–30 ranking.
async function testFinal(role,width,height,attendees){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const roomGroups=groupFixture(attendees);
 const sample={...fixture,game_code:code,groups:roomGroups,phase:'final'};
 let quizPhase='open',picked=null;
 const roster=Array.from({length:attendees},(_,i)=>({
  alias:'Jugador '+String(i+1).padStart(2,'0'),room_no:i%5+1,
  points:Math.max(0,120-i*5),position:i+1
 }));
 await page.addInitScript(({role,code})=>{
  if(role==='player')localStorage.setItem('cw-dean-v2-'+code,'a'.repeat(64));
  if(role==='teacher'){
   sessionStorage.setItem('df_facilitator_game_code',code);
   sessionStorage.setItem('df_facilitator_token','b'.repeat(64));
  }
 },{role,code});
 await page.route('**/v2-dean-cup',async route=>{
  let input={};try{input=route.request().postDataJSON()}catch{}
  let output=sample;
  if(input.action==='learning_state')output={available:false};
  if(input.action==='quiz_submit'){picked=input.choice;output={accepted:true,choice:picked}}
  if(input.action==='quiz_state'){
   output={
    phase:quizPhase,auto_mode:true,question_no:quizPhase==='podium'?8:1,
    participants:attendees,received:quizPhase==='open'?Number(Boolean(picked)):attendees,
    deadline_at:quizPhase==='open'?new Date(Date.now()+30000).toISOString():null,
    reveal_until:quizPhase==='reveal'?new Date(Date.now()+9000).toISOString():null,
    server_now:new Date().toISOString(),my_points:15,my_position:Math.min(5,attendees),
    mine:role==='player'?picked:null,leaderboard:roster,
    question:{text:'Un R² de 0,95 demuestra que el bienestar causa mejores notas?',
     options:{a:'Sí, la predicción es precisa',b:'No, precisión no identifica causalidad',
      c:'Sí, siempre que la muestra sea grande',d:'No hay necesidad de comparar grupos'},
     ...(quizPhase==='reveal'?{correct:'b',explanation:'Predecir una nota no equivale a estimar un efecto al intervenir.'}:{})},
    counts:quizPhase==='reveal'?{a:4,b:Math.max(0,attendees-7),c:2,d:1}:null
   };
  }
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(output)});
 });
 const file=role==='player'?'dean-play':role==='wall'?'dean-wall':'dean-teacher';
 await page.goto(base+'/'+file+'.html?game='+code,{waitUntil:'networkidle',timeout:45000});
 await page.locator('.dean-quiz-arena').waitFor({timeout:15000});
 assert.equal(await page.locator('.dean-quiz-choice').count(),4,'All four answers are displayed');
 assert.match(await page.locator('.dean-quiz-clock').innerText(),/30 s|29 s/,'Global 30-second timer');
 assert.equal(await page.locator('.dean-quiz-choice.is-correct').count(),0,'Never reveal green while voting');
 if(role==='player'){
  await page.locator('.dean-quiz-choice').first().click();
  assert.equal(await page.locator('.dean-quiz-choice.is-selected').count(),1,'Yellow selection shown, not success green');
 }
 const widthMetrics=await page.evaluate(()=>({height:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth}));
 assert.ok(widthMetrics.height<=height+3&&widthMetrics.width<=width+3,'The quiz must never cause body scrolling');
 await page.screenshot({path:`visual-qa/final-open-${role}-${attendees}-${width}x${height}.png`,fullPage:false});
 quizPhase='reveal';
 await page.locator('.dean-quiz-results').waitFor({timeout:5000});
 assert.equal(await page.locator('.dean-vote-row').count(),4,'Four frequency bars');
 assert.equal(await page.locator('.dean-quiz-choice.is-correct').count(),1,'Correct choice turns green');
 if(role==='player')assert.equal(await page.locator('.dean-quiz-choice.is-incorrect').count(),1,'Wrong selected choice turns red');
 assert.ok(await page.locator('.dean-quiz-teaching').isVisible(),'Causal explanation is shown automatically');
 await page.screenshot({path:`visual-qa/final-reveal-${role}-${attendees}-${width}x${height}.png`,fullPage:false});
 quizPhase='podium';
 await page.locator('.dean-final-ceremony').waitFor({timeout:5000});
 // Capture only the COMPLETE celebration; never certify a podium mid-animation.
 await page.waitForTimeout(1250);
 assert.ok(await page.locator('.dean-final-medalist').count()>=1,'Winners get animated podium');
 if(role!=='player'){
  assert.equal(await page.locator('.dean-final-player').count(),attendees,'Facilitator and wall must show EVERY player');
  if(width>=1000){
   const last=await page.locator('.dean-final-player').last().boundingBox();
   assert.ok(last && last.y+last.height<=height+2,'Last ranked player is off screen');
   const rosterMetrics=await page.locator('.dean-final-roster').evaluate(e=>({scroll:e.scrollHeight,client:e.clientHeight}));
   assert.ok(rosterMetrics.scroll<=rosterMetrics.client+3,'Desktop full final roster requires scrolling');
  }
 }else{
  assert.match(await page.locator('.dean-my-place').innerText(),/Puesto #/,'Every participant sees their final position');
 }
 const podiumBounds=await page.locator('.dean-final-medalist').evaluateAll(items=>
    items.map(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right}}));
 const rosterLocator=page.locator('.dean-final-all');
 const rosterBounds=(await rosterLocator.count())?await rosterLocator.boundingBox():null;
 if(rosterBounds&&width>=1000){
  assert.ok(podiumBounds.every(r=>r.bottom<=rosterBounds.y+5),
   'Celebration podium overlaps full rankings after entrance animation: '+JSON.stringify({podiumBounds,rosterBounds}));
 }
 assert.ok(await page.locator('.dean-final-hero').isVisible(),'Celebration visible');
 assert.ok(await page.locator('.dean-confetti').count()===1,'Winner confetti present');
 const podiumMetrics=await page.evaluate(()=>({height:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth}));
 assert.ok(podiumMetrics.height<=height+3&&podiumMetrics.width<=width+3,'The podium must stay in the viewport');
 assert.deepEqual(errors,[],'No browser JS runtime errors');
 await page.screenshot({path:`visual-qa/final-podium-${role}-${attendees}-${width}x${height}.png`,fullPage:false});
 console.log('PASS_FINAL',role,attendees,width+'x'+height);
 await page.close();
}

try{
 for(const [w,h] of [[1366,768],[390,844]]){
  try{await testNewCupFromHistoric(w,h)}catch(e){failures++;console.error('FAIL_NEW_CUP',w+'x'+h,e.stack||e)}
 }
 for(const attendees of [14,18,30]){
  for(const [w,h] of [[1366,768],[1920,1080],[390,844]]){
   for(const role of ['player','wall','teacher']){
    try{await testView(role,w,h,attendees)}catch(e){failures++;console.error('FAIL',role,w+'x'+h,attendees,e.stack||e)}
    try{await testFinal(role,w,h,attendees)}catch(e){failures++;console.error('FAIL_FINAL',role,w+'x'+h,attendees,e.stack||e)}
   }
  }
 }
}finally{await browser.close()}
assert.equal(failures,0,`Visual viewport smoke failed for ${failures} cases`);
console.log('DEAN_VISUAL_QA_OK · 54 mission+quiz checks (plus reveal+podium) across attendee/role/viewport · no production mutation');
