#!/usr/bin/env node
const base=(process.env.CW_BASE_URL||'https://nedsrnqwvxtelddmtvtv.supabase.co/functions/v1').replace(/\/$/,'')
const game='FLOWTEST26';const pin=[...game].reverse().join('')+'-NEXO'
async function call(path,body={},headers={}){const r=await fetch(`${base}/${path}`,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});const data=await r.json().catch(()=>({}));return{ok:r.ok,status:r.status,data}}
const assert=(c,m)=>{if(!c)throw new Error(m)}

let login=await call('facilitator-login',{game_code:game,pin});assert(login.ok,'facilitator login');const ft=login.data.token
let r=await call('facilitator-transition',{action:'reset'},{'x-facilitator-token':ft});assert(r.ok,'initial reset')

// Rehearsal protection: a bot-only roster is invalid because the learning flow requires a human.
const botOnly=await call('facilitator-transition',{action:'seed_bots'},{'x-facilitator-token':ft});assert(!botOnly.ok,'bot-only rehearsal must be rejected')
const botProbe=await call('join-game',{game_code:game,display_name:'Rehearsal Human',participant_key:'flow-rehearsal-human'});assert(botProbe.ok,'rehearsal human joins')
r=await call('facilitator-transition',{action:'seed_bots'},{'x-facilitator-token':ft});assert(r.ok&&r.data.players===20&&r.data.bots===19&&r.data.roster_locked===true,'one human + 19 bots rehearsal locks five-team matrix')
r=await call('facilitator-transition',{action:'reset'},{'x-facilitator-token':ft});assert(r.ok,'reset after bot rehearsal')

// Full human classroom. Seats are provisional while people arrive; after 20 joins the first five
// identities occupy Decision+Policy, one per team, regardless of their provisional join response.
const joins=[]
for(let i=1;i<=20;i++){
  const j=await call('join-game',{game_code:game,display_name:`Flow Human ${String(i).padStart(2,'0')}`,participant_key:`flow-human-${i}`})
  assert(j.ok,`human ${i} join`);joins.push(j)
}
const business=[]
for(let i=0;i<5;i++){
  const s=await call('game-state',{}, {'x-game-token':joins[i].data.token})
  assert(s.ok&&s.data.player.role_code==='business',`human ${i+1} final role is Decision+Policy`)
  business.push({token:joins[i].data.token,state:s.data})
}
assert(new Set(business.map(x=>x.state.player.team_id)).size===5,'five Decision+Policy players occupy five distinct teams')
let ptA=business[0].token,ptB=business[1].token,ptC=business[2].token,ptD=business[3].token,ptE=business[4].token

const rejoinA=await call('join-game',{game_code:game,display_name:'Flow Human 01',participant_key:'flow-human-1'});assert(rejoinA.ok&&rejoinA.data.resumed===true&&rejoinA.data.player.id===joins[0].data.player.id,'same identity resumes exact player');ptA=rejoinA.data.token
const duplicateA=await call('join-game',{game_code:game,display_name:'Flow Human 01',participant_key:'flow-human-1-other-device'});assert(!duplicateA.ok,'same visible person on another identity must not create duplicate')
const lobby=await call('leaderboard',{}, {'x-facilitator-token':ft});assert(lobby.ok&&Number(lobby.data.game.team_target)===5&&lobby.data.teams.length===5,'20 humans => five active teams');assert(lobby.data.teams.every(t=>Number(t.humans)===4),'20 humans => 4-4-4-4-4')

const pre=await call('transfer-check',{stage:'pre',answers:{q1:'b',q2:'c',q3:'b',q4:'c'}},{'x-game-token':ptA});assert(pre.ok&&pre.data.score===4,'pre transfer check')
const payloads={1:{selected:['C01','C02','C03','C04','C05','C06','C07','C08','C09','C10']},2:{recommendation:'redesign',confounder:'mora_previa',reason_code:'baseline_difference'},3:{assignment:'random',outcome:'pago_30d',horizon:30},4:{treat:['digital','middle'],avoid:['arrears'],observe:['traditional','wealth']}}
const answers={1:'B',2:'Los grupos no son comparables desde antes',3:'6 puntos porcentuales',4:'Priorizar segmentos con efecto positivo y evitar el segmento negativo'}
const buyers=[ptA,ptB,ptC,ptD,ptE]

for(let round=1;round<=4;round++){
  const premature=await call('facilitator-transition',{action:'open'},{'x-facilitator-token':ft});assert(!premature.ok,`round ${round}: open must fail before lesson`)
  r=await call('facilitator-transition',{action:'lesson'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: lesson`)
  const lessonState=await call('game-state',{}, {'x-game-token':ptA});assert(lessonState.ok&&lessonState.data.game.phase==='lesson',`round ${round}: participant lesson state`)
  if(round===1){
    assert(lessonState.data.game.roster_locked===true,'first lesson freezes roster')
    const late=await call('join-game',{game_code:game,display_name:'Late Human',participant_key:'flow-late-human'});assert(!late.ok,'unseen participant rejected after roster freeze')
    const known=await call('join-game',{game_code:game,display_name:'Flow Human 02',participant_key:'flow-human-2'});assert(known.ok&&known.data.resumed===true,'known participant can rejoin after freeze');ptB=known.data.token;buyers[1]=ptB
  }
  r=await call('facilitator-transition',{action:'open'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: open lab`)
  const gs=await call('game-state',{}, {'x-game-token':ptA});assert(gs.ok&&gs.data.role_card,`round ${round}: role card exists`)

  if(round===1){
    const expertSet=await call('expert-market',{action:'set',help_id:'expert_trainer',slots:3},{'x-facilitator-token':ft});assert(expertSet.ok&&expertSet.data.experts.some(x=>x.help_id==='expert_trainer'&&Number(x.slots)===3),'three chapter expert slots enabled')
    const hsA=await call('help-state',{}, {'x-game-token':ptA});const hsB=await call('help-state',{}, {'x-game-token':ptB});assert(hsA.ok&&hsB.ok&&hsA.data.investment_balance===60&&hsB.data.investment_balance===60,'wallet starts at 60 per team')
    const ids=new Set(hsA.data.catalog.map(x=>x.id));assert(hsA.data.catalog.length===5,'market exposes exactly five resources');assert(['basic_hint','round_tool','junior_analyst','senior_specialist','expert_trainer'].every(id=>ids.has(id)),'market resource set mismatch')
    const ja=hsA.data.catalog.find(x=>x.id==='junior_analyst'),jb=hsB.data.catalog.find(x=>x.id==='junior_analyst'),expert0=hsA.data.catalog.find(x=>x.id==='expert_trainer');assert(ja?.next_cost===6&&jb?.next_cost===6,'each team starts Junior at 6');assert(expert0?.next_cost===20,'first human expert call costs 20')
    const basket=await call('buy-help-batch',{items:[{help_id:'junior_analyst',qty:2},{help_id:'expert_trainer',qty:1}]},{'x-game-token':ptA});assert(basket.ok&&basket.data.units===3&&basket.data.total_cost===35,'team A basket costs junior 6+9 plus first chapter call 20');assert(basket.data.state.investment_balance===25&&basket.data.state.help_cost===35,'team A wallet accounting')
    const afterA=await call('help-state',{}, {'x-game-token':ptB});assert(afterA.ok&&afterA.data.catalog.find(x=>x.id==='expert_trainer')?.next_cost===26,'second human expert call rises to 26')
    const b1=await call('buy-help',{help_id:'junior_analyst'},{'x-game-token':ptB});assert(b1.ok&&b1.data.cost===6,'team B first junior stays 6: no cross-team speed penalty')
    const b2=await call('buy-help',{help_id:'junior_analyst'},{'x-game-token':ptB});assert(b2.ok&&b2.data.cost===9,'team B second junior costs 9')
    const b3=await call('buy-help',{help_id:'junior_analyst'},{'x-game-token':ptB});assert(b3.ok&&b3.data.cost===13,'team B third junior costs 13')
    const b4=await call('buy-help',{help_id:'junior_analyst'},{'x-game-token':ptB});assert(!b4.ok,'team B fourth junior rejected: its own stock exhausted')
    const expertB=await call('buy-help',{help_id:'expert_trainer'},{'x-game-token':ptB});assert(expertB.ok&&expertB.data.cost===26,'second chapter call costs 26')
    const afterB=await call('help-state',{}, {'x-game-token':ptC});assert(afterB.ok&&afterB.data.catalog.find(x=>x.id==='expert_trainer')?.next_cost===34,'third human expert call rises to 34')
    const expertC=await call('buy-help',{help_id:'expert_trainer'},{'x-game-token':ptC});assert(expertC.ok&&expertC.data.cost===34,'third chapter call costs 34')
    const expertSold=await call('buy-help',{help_id:'expert_trainer'},{'x-game-token':ptD});assert(!expertSold.ok,'fourth chapter call rejected: three human slots exhausted')
  }

  if(round===4){
    assert(Number(gs.data.policy?.capacity)===15000,'round 4 exposes capacity');assert(gs.data.segments?.some(s=>Number(s.ci_low)<0&&Number(s.ci_high)>0),'round 4 exposes uncertainty')
    const over=await call('submit-decision',{round,payload:{treat:['digital','middle','traditional'],avoid:['arrears'],observe:['wealth']},idempotency_key:`over-${Date.now()}`},{'x-game-token':ptB});assert(!over.ok,'round 4 over-capacity policy rejected')
  }

  for(let t=0;t<buyers.length;t++){
    const submit=await call('submit-decision',{round,payload:payloads[round],idempotency_key:`learning-${round}-${t}-${Date.now()}`},{'x-game-token':buyers[t]});assert(submit.ok,`round ${round}: team ${t+1} decision`)
  }
  r=await call('facilitator-transition',{action:'close'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: close`)
  r=await call('facilitator-transition',{action:'reveal'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: reveal`)
  r=await call('facilitator-transition',{action:'teach'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: debrief`)
  r=await call('facilitator-transition',{action:'microcheck'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: microcheck phase`)
  const check=await call('submit-check',{round,answer:answers[round]},{'x-game-token':ptA});assert(check.ok&&check.data.correct===true,`round ${round}: correct microcheck`)
  r=await call('facilitator-transition',{action:'next'},{'x-facilitator-token':ft});assert(r.ok,`round ${round}: next`)
}

const post=await call('transfer-check',{stage:'post',answers:{q1:'b',q2:'c',q3:'b',q4:'c'}},{'x-game-token':ptA});assert(post.ok&&post.data.score===4,'post transfer check')
const final=await call('leaderboard',{game_code:game});assert(final.ok&&final.data.game.phase==='finished','finished phase');assert(final.data.teams.length===5,'five active teams');assert(final.data.teams.every(t=>t.locked),'all five teams submitted final decision');assert(final.data.teams.some(t=>Number(t.help_cost)===35),'team A investment survives to final leaderboard');assert(final.data.transfer?.pre_completed>=1&&final.data.transfer?.post_completed>=1,'wall exposes transfer metrics')
console.log('CAUSAL_QUEST_ADAPTIVE_OK · bot gate · 20 humans => 5×4 · stable rejoin/freeze · fair market · R4 capacity · transfer pre/post · 4 rounds complete')
login=await call('facilitator-login',{game_code:game,pin});if(login.ok){await call('facilitator-transition',{action:'reset'},{'x-facilitator-token':login.data.token});const clean=await call('leaderboard',{game_code:game});assert(clean.ok&&clean.data.teams.every(t=>Number(t.help_cost||0)===0),'reset clears investment costs')}
