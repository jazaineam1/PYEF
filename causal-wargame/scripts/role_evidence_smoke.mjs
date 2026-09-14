#!/usr/bin/env node
const base=(process.env.CW_BASE_URL||'https://nedsrnqwvxtelddmtvtv.supabase.co/functions/v1').replace(/\/$/,'')
const game='FLOWTEST26';const pin=[...game].reverse().join('')+'-NEXO'
async function call(path,body={},headers={}){const r=await fetch(`${base}/${path}`,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});const data=await r.json().catch(()=>({}));return{ok:r.ok,status:r.status,data}}
const assert=(c,m)=>{if(!c)throw new Error(m)}

let login=await call('facilitator-login',{game_code:game,pin});assert(login.ok,'facilitator login');const ft=login.data.token
let r=await call('facilitator-transition',{action:'reset'},{'x-facilitator-token':ft});assert(r.ok,'reset')
const join=await call('join-game',{game_code:game,display_name:'Evidence Probe'});assert(join.ok,'join');const pt=join.data.token
r=await call('facilitator-transition',{action:'seed_bots'},{'x-facilitator-token':ft});assert(r.ok,'seed bots')
r=await call('facilitator-transition',{action:'lesson'},{'x-facilitator-token':ft});assert(r.ok,'lesson')
r=await call('facilitator-transition',{action:'open'},{'x-facilitator-token':ft});assert(r.ok,'open')
const packet={summary:'Score alto no implica efecto alto.',assumption:'Identificación antes del estimador.',decision:'Pedir evidencia incremental.',details:{tool:'Uplift/CATE Explorer',probe:true}}
r=await call('role-contribution',{action:'submit',round:1,finding_code:'smoke_evidence',evidence:packet},{'x-game-token':pt});assert(r.ok,`submit evidence: ${JSON.stringify(r.data)}`)
const state=await call('role-contribution',{action:'state'},{'x-game-token':pt});assert(state.ok,'state');const own=state.data.rows?.find(x=>x.player_id===join.data.player.id);assert(own?.evidence?.summary===packet.summary,'evidence packet did not round-trip');assert(own?.evidence?.details?.tool==='Uplift/CATE Explorer','evidence details missing')
login=await call('facilitator-login',{game_code:game,pin});assert(login.ok,'re-login');r=await call('facilitator-transition',{action:'reset'},{'x-facilitator-token':login.data.token});assert(r.ok,'cleanup reset')
console.log('ROLE_EVIDENCE_V7_OK')
