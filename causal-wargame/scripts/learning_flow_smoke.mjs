#!/usr/bin/env node
const base=(process.env.CW_BASE_URL||'https://nedsrnqwvxtelddmtvtv.supabase.co/functions/v1').replace(/\/$/,'')
const game='FLOWTEST26';const pin=[...game].reverse().join('')+'-NEXO'
async function call(path,body={},headers={}){const r=await fetch(`${base}/${path}`,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});const data=await r.json().catch(()=>({}));return{ok:r.ok,status:r.status,data}}
const assert=(c,m)=>{if(!c)throw new Error(m)}
let login=await call('facilitator-login',{game_code:game,pin});assert(login.ok,'facilitator login');const ft=login.data.token
await call('facilitator-transition',{action:'reset'},{'x-facilitator-token':ft})
const join=await call('join-game',{game_code:game,display_name:'Learning QA Human'});assert(join.ok,'human join');const pt=join.data.token
let r=await call('facilitator-transition',{action:'seed_bots'},{'x-facilitator-token':ft});assert(r.ok&&r.data.players===20,'seed 19 bots')
const payloads={1:{selected:['C01','C02','C03','C04','C05','C06','C07','C08','C09','C10']},2:{recommendation:'redesign',confounder:'mora_previa',reason_code:'baseline_difference'},3:{assignment:'random',outcome:'pago_30d',horizon:30},4:{treat:['digital','middle'],avoid:['arrears'],observe:['traditional','wealth']}}
const answers={1:'B',2:'Los grupos no son comparables desde antes',3:'6 puntos porcentuales',4:'Priorizar segmentos con efecto positivo y evitar el segmento negativo'}
for(let round=1;round<=4;round++){
  const premature=await call('facilitator-transition',{action:'open'},{'x-facilitator-token':ft});assert(!premature.ok,`round ${round}: open must fail before lesson`)
  r=await call('facilitator-transition',{action:'lesson'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: lesson`)
  const lessonState=await call('game-state',{}, {'x-game-token':pt});assert(lessonState.ok&&lessonState.data.game.phase==='lesson',`round ${round}: participant lesson state`)
  r=await call('facilitator-transition',{action:'open'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: open lab`)
  const gs=await call('game-state',{}, {'x-game-token':pt});assert(gs.ok&&gs.data.role_card,`round ${round}: role card exists`)
  if(round===1){
    const hs=await call('help-state',{}, {'x-game-token':pt});assert(hs.ok&&hs.data.catalog.some(x=>x.id==='junior_analyst'),'market catalog')
    const a=await call('buy-help',{help_id:'junior_analyst'},{'x-game-token':pt});assert(a.ok&&a.data.team_help_cost===6,'junior costs 6')
    const b=await call('buy-help',{help_id:'basic_hint'},{'x-game-token':pt});assert(b.ok&&b.data.team_help_cost===10,'hint cumulative cost 10')
    const c=await call('buy-help',{help_id:'expert_game'},{'x-game-token':pt});assert(c.ok&&c.data.team_help_cost===22&&c.data.result.master==='Game Master','expert request costs 12')
    const dup=await call('buy-help',{help_id:'junior_analyst'},{'x-game-token':pt});assert(!dup.ok,'duplicate help rejected')
    const fourth=await call('buy-help',{help_id:'benchmark'},{'x-game-token':pt});assert(!fourth.ok,'fourth help rejected')
    const after=await call('help-state',{}, {'x-game-token':pt});assert(after.ok&&after.data.help_cost===22&&after.data.round_purchase_count===3,'market penalty state')
  }
  const submit=await call('submit-decision',{round,payload:payloads[round],idempotency_key:`learning-${round}-${Date.now()}`},{'x-game-token':pt});assert(submit.ok,`round ${round}: human decision`)
  r=await call('facilitator-transition',{action:'close'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: close`)
  r=await call('facilitator-transition',{action:'reveal'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: reveal`)
  r=await call('facilitator-transition',{action:'teach'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: debrief`)
  r=await call('facilitator-transition',{action:'microcheck'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: microcheck phase`)
  const check=await call('submit-check',{round,answer:answers[round]},{'x-game-token':pt});assert(check.ok&&check.data.correct===true,`round ${round}: correct microcheck`)
  r=await call('facilitator-transition',{action:'next'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: next`)
}
const final=await call('leaderboard',{game_code:game});assert(final.ok&&final.data.game.phase==='finished','finished phase');assert(final.data.teams.length===4,'4 teams');assert(final.data.teams.some(t=>Number(t.help_cost)===22),'help penalty survives to final leaderboard');console.log('CAUSAL_QUEST_OK · 4 lessons · 4 labs · 4 reveals · market cost 22 · duplicate/4th blocked · 4 microchecks')
login=await call('facilitator-login',{game_code:game,pin});if(login.ok){await call('facilitator-transition',{action:'reset'},{'x-facilitator-token':login.data.token});const clean=await call('leaderboard',{game_code:game});assert(clean.ok&&clean.data.teams.every(t=>Number(t.help_cost||0)===0),'reset clears help costs')}
