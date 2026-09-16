#!/usr/bin/env node
const base=(process.env.CW_BASE_URL||'').replace(/\/$/,'')
if(!base)throw new Error('CW_BASE_URL is required for the live classroom smoke')
const game='FLOWTEST26'
const pin=[...game].reverse().join('')+'-NEXO'

async function call(path,body={},headers={}){
  const r=await fetch(`${base}/${path}`,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)})
  const data=await r.json().catch(()=>({}))
  return{ok:r.ok,status:r.status,data}
}
const assert=(c,m)=>{if(!c)throw new Error(m)}

let login=await call('facilitator-login',{game_code:game,pin})
assert(login.ok,'facilitator login')
let ft=login.data.token
let r=await call('facilitator-transition',{action:'reset'},{'x-facilitator-token':ft})
assert(r.ok,'initial reset')

const joins=[]
for(let i=1;i<=20;i++){
  const j=await call('join-game',{game_code:game,display_name:`Flow Human ${String(i).padStart(2,'0')}`,participant_key:`interdependent-flow-${i}`})
  assert(j.ok,`human ${i} join: ${JSON.stringify(j.data)}`)
  joins.push({token:j.data.token,name:`Flow Human ${String(i).padStart(2,'0')}`})
}

async function roster(){
  const seats=[]
  for(const j of joins){
    const s=await call('game-state',{}, {'x-game-token':j.token})
    assert(s.ok,`state for ${j.name}`)
    seats.push({token:j.token,team:s.data.player.team_id,role:s.data.player.role_code,player:s.data.player})
  }
  return seats
}
let seats=await roster()
const teamIds=[...new Set(seats.map(x=>x.team))]
assert(teamIds.length===5,'20 humans must form five teams')
const byTeam=new Map()
for(const team of teamIds){
  const row=Object.fromEntries(seats.filter(x=>x.team===team).map(x=>[x.role,x]))
  assert(['business','data','context','integrator'].every(role=>row[role]),`team ${team} must contain all four roles`)
  byTeam.set(team,row)
}
const businessSeats=teamIds.map(team=>byTeam.get(team).business)
const probeTeam=byTeam.get(teamIds[0])

const lobby=await call('leaderboard',{}, {'x-facilitator-token':ft})
assert(lobby.ok&&Number(lobby.data.game.team_target)===5,'facilitator sees five active teams')
assert(lobby.data.teams.every(t=>Number(t.humans)===4),'20 humans => 4-4-4-4-4')

const pre=await call('transfer-check',{stage:'pre',answers:{q1:'b',q2:'c',q3:'b',q4:'c'}},{'x-game-token':businessSeats[0].token})
assert(pre.ok&&pre.data.score===4,'pre transfer check')

const payloads={
  1:{selected:['C01','C02','C03','C04','C05','C06','C07','C08','C09','C10']},
  2:{recommendation:'redesign',confounder:'mora_previa',reason_code:'baseline_difference'},
  3:{assignment:'random',outcome:'pago_30d',horizon:30},
  4:{treat:['digital','middle'],avoid:['arrears'],observe:['traditional','wealth']}
}
const answers={
  1:'B',
  2:'Los grupos no son comparables desde antes',
  3:'6 puntos porcentuales',
  4:'Priorizar segmentos con efecto positivo y evitar el segmento negativo'
}

async function shareAllEvidence(round){
  for(const seat of seats){
    const evidence={summary:`R${round} · ${seat.role} aporta su pieza`,assumption:`Supuesto ${seat.role}`,decision:`Entrega ${seat.role}`,details:{smoke:true,round}}
    const c=await call('role-contribution',{action:'submit',round,finding_code:`smoke_${seat.role}`,evidence},{'x-game-token':seat.token})
    assert(c.ok,`R${round} contribution ${seat.role}: ${JSON.stringify(c.data)}`)
  }
}

for(let round=1;round<=4;round++){
  const premature=await call('facilitator-transition',{action:'open'},{'x-facilitator-token':ft})
  assert(!premature.ok,`R${round}: laboratory cannot open before lesson`)
  r=await call('facilitator-transition',{action:'lesson'},{'x-facilitator-token':ft})
  assert(r.ok,`R${round}: lesson`)

  const roleCards=[]
  for(const seat of Object.values(probeTeam)){
    const s=await call('game-state',{}, {'x-game-token':seat.token})
    assert(s.ok&&s.data.game.phase==='lesson',`R${round}: lesson visible to ${seat.role}`)
    assert(String(s.data.role_card||'').startsWith('PRIVADO ·'),`R${round}: ${seat.role} receives private briefing`)
    roleCards.push(s.data.role_card)
  }
  assert(new Set(roleCards).size===4,`R${round}: four roles must receive four distinct private briefings`)

  if(round===1){
    const late=await call('join-game',{game_code:game,display_name:'Late Human',participant_key:'interdependent-late'})
    assert(!late.ok,'new identity rejected after roster freeze')
  }

  r=await call('facilitator-transition',{action:'open'},{'x-facilitator-token':ft})
  assert(r.ok,`R${round}: open laboratory`)

  if(round===1){
    const hs=await call('help-state',{}, {'x-game-token':businessSeats[0].token})
    assert(hs.ok&&hs.data.investment_balance===60,'market wallet starts at 60')
    const experts=(hs.data.catalog||[]).filter(x=>x.category==='expert'||x.id==='expert_trainer')
    assert(experts.length===0||experts.every(x=>x.available===false||x.active===false),'expert call must be unavailable')
    const junior=(hs.data.catalog||[]).find(x=>x.id==='junior_analyst')
    assert(junior?.next_cost===6,'non-human market remains available')
    const basket=await call('buy-help-batch',{items:[{help_id:'junior_analyst',qty:2}]},{'x-game-token':businessSeats[0].token})
    assert(basket.ok&&basket.data.total_cost===15,'junior market still works without expert mechanic')
  }

  const nonOwner=await call('submit-decision',{round,payload:payloads[round],idempotency_key:`non-owner-${round}-${Date.now()}`},{'x-game-token':probeTeam.data.token})
  assert(!nonOwner.ok&&/Sólo Líder de Decisión/i.test(String(nonOwner.data?.error||'')),`R${round}: non-owner must be rejected`)

  const tooEarly=await call('submit-decision',{round,payload:payloads[round],idempotency_key:`early-${round}-${Date.now()}`},{'x-game-token':probeTeam.business.token})
  assert(!tooEarly.ok&&/4\/4 evidencias/i.test(String(tooEarly.data?.error||'')),`R${round}: owner cannot lock before evidence`)

  await shareAllEvidence(round)

  if(round===4){
    const over=await call('submit-decision',{round,payload:{treat:['digital','middle','traditional'],avoid:['arrears'],observe:['wealth']},idempotency_key:`over-${Date.now()}`},{'x-game-token':businessSeats[1].token})
    assert(!over.ok,/capacidad/i.test(String(over.data?.error||''))?'':'R4: over-capacity policy must fail')
  }

  for(let i=0;i<businessSeats.length;i++){
    const submit=await call('submit-decision',{round,payload:payloads[round],idempotency_key:`team-${i}-round-${round}-${Date.now()}`},{'x-game-token':businessSeats[i].token})
    assert(submit.ok&&Number(submit.data.evidence_coverage)===4,`R${round}: team ${i+1} requires 4/4 evidence`)
  }

  r=await call('facilitator-transition',{action:'close'},{'x-facilitator-token':ft});assert(r.ok,`R${round}: close`)
  r=await call('facilitator-transition',{action:'reveal'},{'x-facilitator-token':ft});assert(r.ok,`R${round}: reveal`)
  r=await call('facilitator-transition',{action:'teach'},{'x-facilitator-token':ft});assert(r.ok,`R${round}: debrief`)
  r=await call('facilitator-transition',{action:'microcheck'},{'x-facilitator-token':ft});assert(r.ok,`R${round}: microcheck`)
  const check=await call('submit-check',{round,answer:answers[round]},{'x-game-token':businessSeats[0].token})
  assert(check.ok&&check.data.correct===true,`R${round}: microcheck answer`)
  r=await call('facilitator-transition',{action:'next'},{'x-facilitator-token':ft});assert(r.ok,`R${round}: next`)
}

const post=await call('transfer-check',{stage:'post',answers:{q1:'b',q2:'c',q3:'b',q4:'c'}},{'x-game-token':businessSeats[0].token})
assert(post.ok&&post.data.score===4,'post transfer check')
const final=await call('leaderboard',{}, {'x-facilitator-token':ft})
assert(final.ok&&final.data.game.phase==='finished','game reaches finished')
assert(final.data.teams.length===5&&final.data.teams.every(t=>t.locked),'all five teams locked final decision')
assert(final.data.teams.some(t=>Number(t.help_cost)===15),'non-expert market cost survives to leaderboard')

console.log('CAUSAL_QUEST_INTERDEPENDENT_OK · 4 distinct private briefings · non-owner blocked · owner requires 4/4 · expert paused · 4 rounds complete')

login=await call('facilitator-login',{game_code:game,pin})
if(login.ok){
  ft=login.data.token
  await call('facilitator-transition',{action:'reset'},{'x-facilitator-token':ft})
  const clean=await call('leaderboard',{}, {'x-facilitator-token':ft})
  assert(clean.ok&&clean.data.game.phase==='lobby','cleanup returns test game to lobby')
  assert(clean.data.teams.every(t=>Number(t.help_cost||0)===0),'cleanup resets market costs')
}
