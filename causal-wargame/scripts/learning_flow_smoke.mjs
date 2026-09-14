#!/usr/bin/env node
const base=(process.env.CW_BASE_URL||'https://nedsrnqwvxtelddmtvtv.supabase.co/functions/v1').replace(/\/$/,'')
const game='FLOWTEST26';const pin=[...game].reverse().join('')+'-NEXO'
async function call(path,body={},headers={}){const r=await fetch(`${base}/${path}`,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});const data=await r.json().catch(()=>({}));return{ok:r.ok,status:r.status,data}}
const assert=(c,m)=>{if(!c)throw new Error(m)}
let login=await call('facilitator-login',{game_code:game,pin});assert(login.ok,'facilitator login');const ft=login.data.token
let r=await call('facilitator-transition',{action:'reset'},{'x-facilitator-token':ft});assert(r.ok,'initial reset')
// The first four joins are the four teams' Decision Leads, so A/B can legitimately operate the shared market.
const joinA=await call('join-game',{game_code:game,display_name:'Market Buyer A'});assert(joinA.ok&&joinA.data.player.role_code==='business','buyer A join as Decision Lead');const ptA=joinA.data.token
const joinB=await call('join-game',{game_code:game,display_name:'Market Buyer B'});assert(joinB.ok&&joinB.data.player.role_code==='business','buyer B join as Decision Lead');const ptB=joinB.data.token
r=await call('facilitator-transition',{action:'seed_bots'},{'x-facilitator-token':ft});assert(r.ok&&r.data.players===20,'seed to 20')
const payloads={1:{selected:['C01','C02','C03','C04','C05','C06','C07','C08','C09','C10']},2:{recommendation:'redesign',confounder:'mora_previa',reason_code:'baseline_difference'},3:{assignment:'random',outcome:'pago_30d',horizon:30},4:{treat:['digital','middle'],avoid:['arrears'],observe:['traditional','wealth']}}
const answers={1:'B',2:'Los grupos no son comparables desde antes',3:'6 puntos porcentuales',4:'Priorizar segmentos con efecto positivo y evitar el segmento negativo'}
for(let round=1;round<=4;round++){
  const premature=await call('facilitator-transition',{action:'open'},{'x-facilitator-token':ft});assert(!premature.ok,`round ${round}: open must fail before lesson`)
  r=await call('facilitator-transition',{action:'lesson'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: lesson`)
  const lessonState=await call('game-state',{}, {'x-game-token':ptA});assert(lessonState.ok&&lessonState.data.game.phase==='lesson',`round ${round}: participant lesson state`)
  r=await call('facilitator-transition',{action:'open'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: open lab`)
  const gs=await call('game-state',{}, {'x-game-token':ptA});assert(gs.ok&&gs.data.role_card,`round ${round}: role card exists`)
  if(round===1){
    const expertSet=await call('expert-market',{action:'set',help_id:'expert_trainer',slots:1},{'x-facilitator-token':ft});assert(expertSet.ok&&expertSet.data.experts.some(x=>x.help_id==='expert_trainer'&&Number(x.slots)===1),'chapter expert slot enabled')
    const hs=await call('help-state',{}, {'x-game-token':ptA});assert(hs.ok&&hs.data.investment_balance===60,'wallet starts at 60')
    const ids=new Set(hs.data.catalog.map(x=>x.id));
    assert(hs.data.catalog.length===5,'V5 market exposes exactly five resources')
    assert(['basic_hint','round_tool','junior_analyst','senior_specialist','expert_trainer'].every(id=>ids.has(id)),'V5 market resource set mismatch')
    assert(!['expert_game','expert_causal','expert_ml','expert_policy'].some(id=>ids.has(id)),'old specialists/Game Master must not be for sale')
    const junior=hs.data.catalog.find(x=>x.id==='junior_analyst');assert(junior&&junior.stock===3&&junior.next_cost===6,'junior market starts 3 units at 6')
    const expert=hs.data.catalog.find(x=>x.id==='expert_trainer');assert(expert&&expert.stock===1&&expert.next_cost===22,'Llamada al Capítulo starts at one enabled slot and 22 credits')
    const basket=await call('buy-help-batch',{items:[{help_id:'junior_analyst',qty:2},{help_id:'expert_trainer',qty:1}]},{'x-game-token':ptA});assert(basket.ok&&basket.data.units===3&&basket.data.total_cost===37,'atomic basket costs junior 6+9 plus chapter call 22')
    assert(basket.data.state.investment_balance===23&&basket.data.state.help_cost===37,'basket wallet accounting')
    const b1=await call('buy-help',{help_id:'junior_analyst'},{'x-game-token':ptB});assert(b1.ok&&b1.data.cost===13,'third global junior costs 13')
    const sold=await call('buy-help',{help_id:'junior_analyst'},{'x-game-token':ptB});assert(!sold.ok,'fourth junior rejected: global stock exhausted')
    const expertSold=await call('buy-help',{help_id:'expert_trainer'},{'x-game-token':ptB});assert(!expertSold.ok,'chapter call cannot oversell one real slot')
  }
  const submit=await call('submit-decision',{round,payload:payloads[round],idempotency_key:`learning-${round}-${Date.now()}`},{'x-game-token':ptA});assert(submit.ok,`round ${round}: human decision`)
  r=await call('facilitator-transition',{action:'close'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: close`)
  r=await call('facilitator-transition',{action:'reveal'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: reveal`)
  r=await call('facilitator-transition',{action:'teach'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: debrief`)
  r=await call('facilitator-transition',{action:'microcheck'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: microcheck phase`)
  const check=await call('submit-check',{round,answer:answers[round]},{'x-game-token':ptA});assert(check.ok&&check.data.correct===true,`round ${round}: correct microcheck`)
  r=await call('facilitator-transition',{action:'next'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: next`)
}
const final=await call('leaderboard',{game_code:game});assert(final.ok&&final.data.game.phase==='finished','finished phase');assert(final.data.teams.length===4,'4 teams');assert(final.data.teams.some(t=>Number(t.help_cost)===37),'basket investment survives to final leaderboard');console.log('CAUSAL_QUEST_V5_OK · five-resource market · atomic basket 6+9+22=37 · junior 3rd=13 · chapter availability enforced · 4 rounds complete')
login=await call('facilitator-login',{game_code:game,pin});if(login.ok){await call('facilitator-transition',{action:'reset'},{'x-facilitator-token':login.data.token});const clean=await call('leaderboard',{game_code:game});assert(clean.ok&&clean.data.teams.every(t=>Number(t.help_cost||0)===0),'reset clears investment costs')}
