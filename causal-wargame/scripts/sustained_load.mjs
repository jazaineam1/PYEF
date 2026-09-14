#!/usr/bin/env node
// Sustained classroom load test. Manual/pre-event gate, not a per-commit smoke test.
// Defaults: 20 simulated participants for 120s. For the real pre-event gate use CW_DURATION_SECONDS=900.
const base=(process.env.CW_BASE_URL||'https://nedsrnqwvxtelddmtvtv.supabase.co/functions/v1').replace(/\/$/,'')
const game=process.env.CW_LOAD_GAME||'FLOWTEST26'
const pin=process.env.CW_LOAD_PIN||([...game].reverse().join('')+'-NEXO')
const users=Math.max(1,Math.min(20,Number(process.env.CW_USERS||20)))
const durationMs=Math.max(30000,Number(process.env.CW_DURATION_SECONDS||120)*1000)

const sleep=ms=>new Promise(r=>setTimeout(r,ms))
const jitter=(baseMs,spread=.25)=>Math.round(baseMs*(1-spread+Math.random()*spread*2))
async function call(path,body={},headers={}){
  const t=performance.now()
  try{
    const r=await fetch(`${base}/${path}`,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)})
    const data=await r.json().catch(()=>({}))
    return {ok:r.ok,status:r.status,data,ms:performance.now()-t,path}
  }catch(error){return {ok:false,status:0,data:{error:String(error)},ms:performance.now()-t,path}}
}
function pct(xs,p){if(!xs.length)return 0;const a=[...xs].sort((a,b)=>a-b);return a[Math.min(a.length-1,Math.floor((a.length-1)*p))]}
function assert(c,msg){if(!c)throw new Error(msg)}

console.log(`CAUSAL QUEST sustained load: ${users} users · ${(durationMs/1000).toFixed(0)}s`)
let login=await call('facilitator-login',{game_code:game,pin});assert(login.ok,`facilitator login failed ${login.status}`)
const ft=login.data.token
let r=await call('facilitator-transition',{action:'reset',seconds:900},{'x-facilitator-token':ft});assert(r.ok,'reset failed')
const joins=await Promise.all(Array.from({length:users},(_,i)=>call('join-game',{game_code:game,display_name:`Sustained ${String(i+1).padStart(2,'0')}`})))
assert(joins.every(x=>x.ok),`join failures: ${joins.filter(x=>!x.ok).length}`)
r=await call('facilitator-transition',{action:'lesson',seconds:900},{'x-facilitator-token':ft});
if(!r.ok){r=await call('facilitator-transition',{action:'teach',seconds:900},{'x-facilitator-token':ft})}
// The V2+ state machine requires lesson before open.
r=await call('facilitator-transition',{action:'open',seconds:900},{'x-facilitator-token':ft});assert(r.ok,`open failed: ${JSON.stringify(r.data)}`)

const tokens=joins.map(x=>x.data.token)
const observations=[]
let stop=false
const started=Date.now()
async function poller(token,index){
  const headers={'x-game-token':token}
  let nextGame=0,nextContribution=0,nextHelp=0
  while(!stop){
    const now=Date.now()-started
    const jobs=[]
    if(now>=nextGame){jobs.push(call('game-state',{},headers));nextGame=now+jitter(3500)}
    if(now>=nextContribution){jobs.push(call('role-contribution',{action:'state'},headers));nextContribution=now+jitter(5500)}
    if(now>=nextHelp){jobs.push(call('help-state',{},headers));nextHelp=now+jitter(8000)}
    if(jobs.length) observations.push(...await Promise.all(jobs))
    await sleep(jitter(250,.4))
  }
}
const tasks=tokens.map(poller)
await sleep(durationMs);stop=true;await Promise.all(tasks)

const ok=observations.filter(x=>x.ok),bad=observations.filter(x=>!x.ok)
const ms=ok.map(x=>x.ms)
const elapsed=(Date.now()-started)/1000
const byPath={}
for(const x of observations){const k=x.path;byPath[k]??={total:0,ok:0,times:[]};byPath[k].total++;if(x.ok){byPath[k].ok++;byPath[k].times.push(x.ms)}}
console.log(`requests=${observations.length} ok=${ok.length} fail=${bad.length} rps=${(observations.length/elapsed).toFixed(1)}`)
console.log(`overall p50=${pct(ms,.50).toFixed(0)}ms p95=${pct(ms,.95).toFixed(0)}ms p99=${pct(ms,.99).toFixed(0)}ms`)
for(const [path,s] of Object.entries(byPath))console.log(`${path}: ${s.ok}/${s.total} p95=${pct(s.times,.95).toFixed(0)}ms`)
if(bad.length)console.log('sample failures:',bad.slice(0,8).map(x=>`${x.path}:${x.status}:${x.data?.error||''}`).join(' | '))

// Classroom acceptance gate: no functional errors; p95 <= 1500ms for 20-user sustained load.
assert(bad.length===0,`${bad.length} sustained request failures`)
assert(pct(ms,.95)<=1500,`sustained p95 too high: ${pct(ms,.95).toFixed(0)}ms`)

login=await call('facilitator-login',{game_code:game,pin});
if(login.ok) await call('facilitator-transition',{action:'reset',seconds:60},{'x-facilitator-token':login.data.token})
console.log('SUSTAINED_LOAD_OK')
