#!/usr/bin/env node
const base=(process.env.CW_BASE_URL||'https://nedsrnqwvxtelddmtvtv.supabase.co/functions/v1').replace(/\/$/,'')
const game='FLOWTEST26'
const pin=[...game].reverse().join('')+'-NEXO'

async function call(path,body={},headers={}){
  const r=await fetch(`${base}/${path}`,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)})
  const data=await r.json().catch(()=>({}))
  return{ok:r.ok,status:r.status,data}
}
const assert=(c,m)=>{if(!c)throw new Error(m)}
const gt=(token,path,body={})=>call(path,body,{'x-game-token':token})

let login=await call('facilitator-login',{game_code:game,pin})
assert(login.ok,'V2 facilitator login')
let ft=login.data.token
let r=await call('v2-facilitator',{action:'reset'},{'x-facilitator-token':ft})
assert(r.ok,'V2 initial reset')

try{
  const joins=[]
  for(let i=1;i<=16;i++){
    const j=await call('join-game',{game_code:game,display_name:`V2 Human ${String(i).padStart(2,'0')}`,participant_key:`v2-smoke-${i}`})
    assert(j.ok,`V2 human ${i} joins`)
    joins.push(j.data.token)
  }

  r=await call('v2-facilitator',{action:'start'},{'x-facilitator-token':ft})
  assert(r.ok,'V2 round starts with one action')

  const states=[]
  for(const token of joins){const s=await gt(token,'v2-state');assert(s.ok,'V2 state');states.push({token,state:s.data})}
  const groups=new Map()
  for(const x of states){const k=x.state.player.team_id;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(x)}
  const team=[...groups.values()].find(xs=>xs.length===4)
  assert(team?.length===4,'V2 needs a four-person team in 16-player rehearsal')
  assert(team.every(x=>!('role_code' in x.state.player)),'V2 player state must hide roles')
  assert(team.every(x=>x.state.packet.length===6),'V2 four-person team gets 6 customers each')
  const ids=team.flatMap(x=>x.state.packet.map(c=>c.id))
  assert(new Set(ids).size===24,'V2 packets partition all 24 customers without duplicates')
  assert(team.every(x=>x.state.packet.every(c=>!('p0'in c)&&!('p1'in c))),'V2 hidden counterfactuals must not leak')
  let analysis=await gt(team[0].token,'v2-analysis')
  assert(analysis.ok&&analysis.data.team_tools===null,'V2 visual team tools stay locked before all individual proposals')
  assert(analysis.data.reveal_tools===null,'V2 visual reveal stays hidden during individual work')

  for(let i=0;i<3;i++){
    const selected=team[i].state.packet.slice(0,2).map(c=>c.id)
    const s=await gt(team[i].token,'v2-submit',{action:'individual',round:1,payload:{selected}})
    assert(s.ok,`V2 individual ${i+1}`)
  }
  const premature=await gt(team[1].token,'v2-submit',{action:'team',round:1,payload:{selected:['C01','C02','C03','C04','C05','C06','C07','C08','C09','C10']}})
  assert(!premature.ok&&/todos los integrantes|propuesta/i.test(String(premature.data?.error||'')),'V2 team decision must wait for all individual proposals')

  const lastSelected=team[3].state.packet.slice(0,2).map(c=>c.id)
  r=await gt(team[3].token,'v2-submit',{action:'individual',round:1,payload:{selected:lastSelected}})
  assert(r.ok,'V2 fourth individual')

  let ready=await gt(team[0].token,'v2-state')
  assert(ready.ok&&ready.data.team.all_submitted===true,'V2 team reaches 4/4')
  assert(ready.data.team_submissions.length===4,'V2 shows four proposals after 4/4')
  assert(ready.data.team_pool.length===24,'V2 unlocks full pool only after 4/4')
  analysis=await gt(team[0].token,'v2-analysis')
  assert(analysis.ok&&Array.isArray(analysis.data.team_tools?.feature_summary),'V2 visual evidence lab unlocks at 4/4')
  assert(analysis.data.reveal_tools===null,'V2 counterfactual chart stays hidden before reveal')

  const teamDecision=await gt(team[1].token,'v2-submit',{action:'team',round:1,payload:{selected:['C01','C02','C03','C04','C05','C06','C07','C08','C09','C10']}})
  assert(teamDecision.ok,'V2 any teammate can lock team decision')
  assert(!('result' in teamDecision.data),'V2 submit response must not leak score before reveal')

  ready=await gt(team[0].token,'v2-state')
  assert(ready.ok&&ready.data.team_decision&&ready.data.team_decision.result===null,'V2 state redacts score before reveal')
  assert(ready.data.reveal===null,'V2 reveal remains hidden during round')

  for(const other of groups.values()){
    if(other===team)continue
    for(const member of other){
      const selected=member.state.packet.slice(0,2).map(c=>c.id)
      const x=await gt(member.token,'v2-submit',{action:'individual',round:1,payload:{selected}})
      assert(x.ok,'V2 all teams can submit individual proposals')
    }
    const os=await gt(other[0].token,'v2-state')
    assert(os.ok&&os.data.team.all_submitted,'V2 other team reaches full participation')
    const x=await gt(other[0].token,'v2-submit',{action:'team',round:1,payload:{selected:['C01','C02','C03','C04','C05','C06','C07','C08','C09','C10']}})
    assert(x.ok,'V2 all teams can lock a team decision')
  }

  const wall=await call('v2-wall-state',{game_code:game})
  assert(wall.ok&&wall.data.humans===16,'V2 wall shows all joined humans')
  const wallTeam=wall.data.teams.find(t=>t.id===team[0].state.player.team_id)
  assert(wallTeam?.submitted===4&&wallTeam?.decision===true,'V2 wall shows team proposal/decision progress')
  assert(wall.data.teams.every(t=>t.humans===0||t.round_score===null),'V2 public wall hides current round scores while decisions are open')
  assert(Array.isArray(wall.data.decisions)&&wall.data.decisions.length===0,'V2 public wall hides team decisions until round close/reveal')

  r=await call('v2-facilitator',{action:'reveal'},{'x-facilitator-token':ft})
  assert(r.ok,'V2 reveal action')
  const after=await gt(team[2].token,'v2-state')
  assert(after.ok&&after.data.reveal?.concept?.includes('Predicción'),'V2 reveal teaches prediction vs causal effect')
  assert(Array.isArray(after.data.reveal?.customers)&&after.data.reveal.customers.length===24,'V2 reveal exposes counterfactual table')
  assert(after.data.team_decision?.result?.score!==undefined,'V2 score becomes visible only after reveal')
  analysis=await gt(team[2].token,'v2-analysis')
  assert(analysis.ok&&analysis.data.reveal_tools?.score_uplift?.length===24,'V2 score-vs-uplift and two-futures data unlock only at reveal')

  const wallAfter=await call('v2-wall-state',{game_code:game})
  assert(wallAfter.ok,'V2 wall refreshes after reveal')
  const activeTeams=wallAfter.data.teams.filter(t=>t.humans>0)
  assert(activeTeams.every(t=>Number.isInteger(t.round_score)),'V2 round score becomes visible only after reveal')
  assert(activeTeams.every(t=>t.total_score===t.round_score&&t.rounds_scored===1),'V2 cumulative scoreboard updates after the round')
  assert(wallAfter.data.decisions.length===activeTeams.length,'V2 projector shows every team decision after reveal')
  const playerBoard=await gt(team[0].token,'v2-state')
  assert(playerBoard.ok&&playerBoard.data.all_team_decisions.length===activeTeams.length,'V2 players can compare all team decisions after reveal')
  assert(playerBoard.data.scoreboard.some(t=>t.total_score>0),'V2 players receive the cumulative score board after reveal')

  console.log('DOS_FUTUROS_V2_OK · 16 humans · compact evidence · 4/4 gate · all-team decisions · score hidden until close · cumulative Kahoot board · reveal protected')
}finally{
  login=await call('facilitator-login',{game_code:game,pin})
  if(login.ok){ft=login.data.token;await call('v2-facilitator',{action:'reset'},{'x-facilitator-token':ft})}
}
