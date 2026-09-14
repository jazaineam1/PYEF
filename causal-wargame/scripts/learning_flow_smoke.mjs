#!/usr/bin/env node
const base=(process.env.CW_BASE_URL||'https://nedsrnqwvxtelddmtvtv.supabase.co/functions/v1').replace(/\/$/,'')
const game='FLOWTEST26';const pin=[...game].reverse().join('')+'-NEXO'
async function call(path,body={},headers={}){const r=await fetch(`${base}/${path}`,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});const data=await r.json().catch(()=>({}));return{ok:r.ok,status:r.status,data}}
const assert=(c,m)=>{if(!c)throw new Error(m)}
let login=await call('facilitator-login',{game_code:game,pin});assert(login.ok,'facilitator login');const ft=login.data.token
await call('facilitator-transition',{action:'reset'},{'x-facilitator-token':ft})
const joinA=await call('join-game',{game_code:game,display_name:'Market Buyer A'});assert(joinA.ok,'buyer A join');const ptA=joinA.data.token
const joinB=await call('join-game',{game_code:game,display_name:'Market Buyer B'});assert(joinB.ok,'buyer B join');const ptB=joinB.data.token
let r=await call('facilitator-transition',{action:'seed_bots'},{'x-facilitator-token':ft});assert(r.ok&&r.data.players===20,'seed to 20')
const payloads={1:{selected:['C01','C02','C03','C04','C05','C06','C07','C08','C09','C10']},2:{recommendation:'redesign',confounder:'mora_previa',reason_code:'baseline_difference'},3:{assignment:'random',outcome:'pago_30d',horizon:30},4:{treat:['digital','middle'],avoid:['arrears'],observe:['traditional','wealth']}}
const answers={1:'B',2:'Los grupos no son comparables desde antes',3:'6 puntos porcentuales',4:'Priorizar segmentos con efecto positivo y evitar el segmento negativo'}
for(let round=1;round<=4;round++){
  const premature=await call('facilitator-transition',{action:'open'},{'x-facilitator-token':ft});assert(!premature.ok,`round ${round}: open must fail before lesson`)
  r=await call('facilitator-transition',{action:'lesson'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: lesson`)
  const lessonState=await call('game-state',{}, {'x-game-token':ptA});assert(lessonState.ok&&lessonState.data.game.phase==='lesson',`round ${round}: participant lesson state`)
  r=await call('facilitator-transition',{action:'open'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: open lab`)
  const gs=await call('game-state',{}, {'x-game-token':ptA});assert(gs.ok&&gs.data.role_card,`round ${round}: role card exists`)
  if(round===1){
    const expertSet=await call('expert-market',{action:'set',help_id:'expert_causal',slots:1},{'x-facilitator-token':ft});assert(expertSet.ok&&expertSet.data.experts.some(x=>x.help_id==='expert_causal'&&Number(x.slots)===1),'causal expert slot enabled')
    const hs=await call('help-state',{}, {'x-game-token':ptA});assert(hs.ok&&hs.data.investment_balance===60,'wallet starts at 60');assert(!hs.data.catalog.some(x=>x.id==='expert_game'),'game master is not for sale')
    const junior=hs.data.catalog.find(x=>x.id==='junior_analyst');assert(junior&&junior.stock===3&&junior.next_cost===6,'junior market starts 3 units at 6')
    const a1=await call('buy-help',{help_id:'junior_analyst'},{'x-game-token':ptA});assert(a1.ok&&a1.data.cost===6&&a1.data.investment_balance===54,'first junior costs 6')
    const b1=await call('buy-help',{help_id:'junior_analyst'},{'x-game-token':ptB});assert(b1.ok&&b1.data.cost===9,'second global junior costs 9')
    const a2=await call('buy-help',{help_id:'junior_analyst'},{'x-game-token':ptA});assert(a2.ok&&a2.data.cost===13,'third global junior costs 13 and repeat purchase allowed')
    const sold=await call('buy-help',{help_id:'junior_analyst'},{'x-game-token':ptB});assert(!sold.ok,'fourth junior rejected: global stock exhausted')
    const expert=await call('buy-help',{help_id:'expert_causal'},{'x-game-token':ptA});assert(expert.ok&&expert.data.cost===22&&expert.data.result.master==='Causal Master','available causal expert can be reserved')
    const expertSold=await call('buy-help',{help_id:'expert_causal'},{'x-game-token':ptB});assert(!expertSold.ok,'expert cannot oversell one real slot')
    const after=await call('help-state',{}, {'x-game-token':ptA});assert(after.ok&&after.data.help_cost===41&&after.data.investment_balance===19,'team A investment accounting 6+13+22')
  }
  const submit=await call('submit-decision',{round,payload:payloads[round],idempotency_key:`learning-${round}-${Date.now()}`},{'x-game-token':ptA});assert(submit.ok,`round ${round}: human decision`)
  r=await call('facilitator-transition',{action:'close'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: close`)
  r=await call('facilitator-transition',{action:'reveal'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: reveal`)
  r=await call('facilitator-transition',{action:'teach'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: debrief`)
  r=await call('facilitator-transition',{action:'microcheck'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: microcheck phase`)
  const check=await call('submit-check',{round,answer:answers[round]},{'x-game-token':ptA});assert(check.ok&&check.data.correct===true,`round ${round}: correct microcheck`)
  r=await call('facilitator-transition',{action:'next'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: next`)
}
const final=await call('leaderboard',{game_code:game});assert(final.ok&&final.data.game.phase==='finished','finished phase');assert(final.data.teams.length===4,'4 teams');assert(final.data.teams.some(t=>Number(t.help_cost)===41),'market investment survives to final leaderboard');console.log('CAUSAL_QUEST_V4_OK · dynamic junior prices 6→9→13 · stock exhausted · expert slot enforced · 4 rounds complete')
login=await call('facilitator-login',{game_code:game,pin});if(login.ok){await call('facilitator-transition',{action:'reset'},{'x-facilitator-token':login.data.token});const clean=await call('leaderboard',{game_code:game});assert(clean.ok&&clean.data.teams.every(t=>Number(t.help_cost||0)===0),'reset clears investment costs')}
