// Temporary end-to-end QA against an isolated synthetic Cup. No real student records.
// Enabled only in the qa/dean-20-concurrent-20261016 PR workflow.
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {performance} from 'node:perf_hooks';

const base=process.env.CW_BASE_URL||'https://nedsrnqwvxtelddmtvtv.supabase.co/functions/v1';
const code=process.env.QA_GAME_CODE;
const teacher=process.env.QA_FAC_TOKEN;
assert.ok(code?.startsWith('QA20L-')&&teacher?.startsWith('qa20fac-'),'QA-only credentials required');
const N=20,metrics=[],errors=[];

const pctl=(a,p)=>a.length?a.slice().sort((x,y)=>x-y)[Math.min(a.length-1,Math.ceil((p/100)*a.length)-1)]:null;
const avg=a=>a.reduce((a,b)=>a+b,0)/a.length;
async function call(action,fields={},student='',teacherToken=''){
 const headers={'content-type':'application/json'};
 if(student)headers['x-game-token']=student;
 if(teacherToken)headers['x-facilitator-token']=teacherToken;
 const t=performance.now();
 let response;
 try{
  response=await fetch(base+'/v2-dean-cup',{
   method:'POST',headers,body:JSON.stringify({action,game_code:code,...fields}),
   signal:AbortSignal.timeout(30000)
  });
  const elapsed=performance.now()-t;
  metrics.push({action,ms:Math.round(elapsed),status:response.status});
  const text=await response.text(),json=JSON.parse(text);
  if(!response.ok||json?.error)throw Error(action+' HTTP '+response.status+' '+(json?.error||text).slice(0,200));
  return json;
 }catch(e){errors.push({action,message:String(e).slice(0,230)});throw e}
}
const users=Array.from({length:N},(_,i)=>({name:'QA User '+String(i+1).padStart(2,'0'),
 token:randomBytes(32).toString('hex')}));
const choices={
 over:[[6,6.5,1.5],[5.5,7,1.5],[6,6,2],[4.5,7.5,2]],
 balanced:[[4,8,2],[5,7,2],[3,8,3],[4.5,7.5,2]],
 risk:[[3,8,2],[4,8,2],[5,7,2],[4,7.5,2.5]]
};
const tStart=performance.now();
try{
 const joined=await Promise.all(users.map(p=>call('join',{alias:p.name,room:1},p.token)));
 assert.equal(joined.filter(x=>x.queued===true).length,20,'20 queued');
 const before=await call('state');
 assert.equal(before.waiting_count,20,'20 in waiting lobby');
 assert.ok(!before.lobby_players?.length,'no premature teams');
 await call('teacher',{command:'next'},'',teacher);
 const status=await Promise.all(users.map(p=>call('state',{},p.token)));
 const distribution={};
 for(let i=0;i<N;i++){
  const m=status[i].mine;
  assert.ok(m&&m.room===1,'one room only, user '+i+' room '+m?.room);
  assert.ok(choices[m.archetype],'unexpected archetype '+m.archetype);
  users[i].archetype=m.archetype;
  distribution[m.archetype]=(distribution[m.archetype]||0)+1;
 }
 assert.deepEqual(Object.values(distribution).sort((a,b)=>a-b),[6,7,7]);
 for(let j=1;j<=6;j++){
  const results=await Promise.all(users.map((p,i)=>{
   const [study,sleep,wellness]=choices[p.archetype][(i+j*2)%4];
   return call('exam',{exam:j,study,sleep,wellness},p.token);
  }));
  assert.equal(results.filter(x=>x.submitted===true).length,20,'Round '+j+' submitted');
  console.log('ROUND_QA '+j+'/6 completed by 20 independent concurrent HTTP requests');
 }
 const finals=await Promise.all(users.map(p=>call('state',{},p.token)));
 assert.equal(finals.filter(x=>x.mine?.completed===6).length,20,'120 exams not fully registered');
 const closure=await call('game_finish',{},'',teacher);
 const ranking=await call('state');
 assert.equal(ranking.phase,'finished');
 assert.equal(ranking.life_recap?.eligible_count,20);
 assert.equal(ranking.life_recap?.top3?.length,3);
 const latencies=metrics.map(m=>m.ms),actions={};
 for(const record of metrics)actions[record.action]=(actions[record.action]||0)+1;
 const output={
  status:'PASS',real_http_requests:metrics.length,participants:N,exams:120,completed:20,
  archetypes:distribution,top3:ranking.life_recap.top3,
  duration_ms:Math.round(performance.now()-tStart),
  latency_ms:{p50:pctl(latencies,50),p95:pctl(latencies,95),max:Math.max(...latencies)},
  failure_count:errors.length,http_error_count:metrics.filter(m=>m.status>=400).length,
  actions,phase:ranking.phase,finished_instructor:true
 };
 console.log('QA20_REAL_CONCURRENT_RESULT='+JSON.stringify(output));
}catch(e){
 console.error('QA20_REAL_CONCURRENT_FAILED='+JSON.stringify({error:String(e),errors,events:metrics.length}));
 process.exitCode=1;
}