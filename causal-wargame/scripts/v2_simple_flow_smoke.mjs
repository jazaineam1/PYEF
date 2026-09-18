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
  assert(r.ok,'V2 mission starts')

  const states=[]
  for(const token of joins){
    const s=await gt(token,'v2-state')
    assert(s.ok,'V2 state')
    states.push({token,state:s.data})
  }

  const groups=new Map()
  for(const x of states){
    const k=x.state.player.team_id
    if(!groups.has(k))groups.set(k,[])
    groups.get(k).push(x)
  }
  const team=[...groups.values()].find(xs=>xs.length===4)
  assert(team?.length===4,'V2 needs a four-person team in 16-player rehearsal')
  assert(team.every(x=>!('role_code' in x.state.player)),'V2 player state must hide roles')
  assert(team.every(x=>x.state.game.max_round===3),'V2 exposes exactly three missions')
  assert(team.every(x=>x.state.packet.length===6),'V2 four-person team gets 6 cohorts each')
  assert(team.every(x=>x.state.economy?.renewal_value_cop>0),'V2 exposes explicit COP economics')

  const ids=team.flatMap(x=>x.state.packet.map(c=>c.id))
  assert(new Set(ids).size===24,'V2 packets partition all 24 cohorts without duplicates')
  assert(team.every(x=>x.state.packet.every(c=>!('p0'in c)&&!('p1'in c)&&!('effect'in c))),'V2 hidden counterfactuals must not leak')

  let analysis=await gt(team[0].token,'v2-analysis')
  assert(analysis.ok&&analysis.data.team_tools===null,'V2 modeling tools stay locked before all initial decisions')
  assert(analysis.data.reveal_tools===null,'V2 reveal stays hidden during initial work')

  for(let i=0;i<4;i++){
    const selected=team[i].state.packet.slice(0,2).map(c=>c.id)
    const s=await gt(team[i].token,'v2-submit',{action:'individual',round:1,payload:{selected}})
    assert(s.ok,`V2 initial decision ${i+1}`)
  }

  let ready=await gt(team[0].token,'v2-state')
  assert(ready.ok&&ready.data.team.all_submitted===true,'V2 reaches 4/4 initial decisions')
  assert(ready.data.team_submissions.length===4,'V2 exposes four initial decisions after 4/4')
  assert(ready.data.team_pool.length===24,'V2 unlocks full safe cohort pool after 4/4')
  assert(ready.data.team.all_revised===false,'V2 revision gate begins closed')

  analysis=await gt(team[0].token,'v2-analysis')
  assert(analysis.ok&&Array.isArray(analysis.data.team_tools?.feature_summary),'V2 visual evidence unlocks at 4/4')
  assert(Array.isArray(analysis.data.team_tools?.ml_training)&&analysis.data.team_tools.ml_training.length>=500,'V2 predictive modeling dataset unlocks')
  assert(analysis.data.reveal_tools===null,'V2 counterfactual truth remains hidden before reveal')
  assert(!JSON.stringify(analysis.data.team_tools).includes('"p0"')&&!JSON.stringify(analysis.data.team_tools).includes('"p1"'),'V2 Python payload does not leak counterfactuals')

  const prematureRevision=await gt(team[0].token,'v2-submit',{action:'revision',round:1,payload:{selected:team[0].state.packet.slice(-2).map(c=>c.id)}})
  assert(!prematureRevision.ok&&/laboratorio/i.test(String(prematureRevision.data?.error||'')),'V2 revision must wait for lab completion')

  const prematureLab=await gt(team[0].token,'v2-submit',{action:'lab_complete',round:1})
  assert(!prematureLab.ok&&/bloques/i.test(String(prematureLab.data?.error||'')),'V2 lab points require every guided block to run')

  for(let i=0;i<4;i++){
    for(const stepId of ['rank','visual']){
      const run=await gt(team[i].token,'v2-submit',{
        action:'learning_event',round:1,event_type:'python_run',
        payload:{step_id:stepId,code_changed:false,duration_ms:500,mode:'guided'}
      })
      assert(run.ok,`V2 records guided block ${stepId} for player ${i+1}`)
    }
    const lab=await gt(team[i].token,'v2-submit',{action:'lab_complete',round:1})
    assert(lab.ok&&lab.data.points===20&&lab.data.steps===2,`V2 lab closes for 20 points after 2/2 blocks ${i+1}`)
    const check=await gt(team[i].token,'v2-submit',{action:'check',round:1,answer:'b'})
    assert(check.ok&&check.data.points===30&&check.data.correct===true,`V2 checkpoint question scores 30 points ${i+1}`)
  }

  const retryCheck=await gt(team[0].token,'v2-submit',{action:'check',round:1,answer:'a'})
  assert(retryCheck.ok&&retryCheck.data.already_answered===true&&retryCheck.data.points===30&&retryCheck.data.correct===true,'V2 checkpoint is immutable after first answer')

  let scored=await gt(team[0].token,'v2-state')
  assert(scored.ok&&scored.data.progress?.my?.round_points===50,'V2 player sees 50/100 after lab + question')
  assert(scored.data.progress?.phase==='revision','V2 state advances to one revision page after scored check')
  assert(Array.isArray(scored.data.progress?.top3)&&scored.data.progress.top3.length===3,'V2 player receives individual top 3')

  const premature=await gt(team[1].token,'v2-submit',{action:'team',round:1,payload:{selected:['C01','C02','C03','C04','C05','C06','C07','C08','C09','C10']}})
  assert(!premature.ok&&/revis/i.test(String(premature.data?.error||'')),'V2 team lock must wait for post-evidence revisions')

  for(let i=0;i<4;i++){
    const selected=team[i].state.packet.slice(-2).map(c=>c.id)
    const s=await gt(team[i].token,'v2-submit',{action:'revision',round:1,payload:{selected}})
    assert(s.ok,`V2 revised decision ${i+1}`)
  }

  ready=await gt(team[0].token,'v2-state')
  assert(ready.ok&&ready.data.team.all_revised===true,'V2 reaches 4/4 revised decisions')
  assert(ready.data.team_revisions.length===4,'V2 exposes four revised decisions')
  assert(ready.data.team.roster.every(p=>p.submitted&&p.revised),'V2 roster distinguishes initial and revised participation')

  const event=await gt(team[0].token,'v2-submit',{action:'learning_event',round:1,event_type:'python_run',payload:{step_id:'predictive-fit',code_changed:false,duration_ms:1234,mode:'guided'}})
  assert(event.ok,'V2 records a Python learning event without sending code')

  const selected10=['C01','C02','C03','C05','C07','C09','C11','C17','C19','C23']
  const teamDecision=await gt(team[1].token,'v2-submit',{action:'team',round:1,payload:{selected:selected10}})
  assert(teamDecision.ok,'V2 any teammate can lock final team policy after revisions')
  assert(!('result' in teamDecision.data),'V2 submit response must not leak economic result before reveal')

  ready=await gt(team[0].token,'v2-state')
  assert(ready.ok&&ready.data.team_decision&&ready.data.team_decision.result===null,'V2 state redacts money before reveal')
  assert(ready.data.reveal===null,'V2 reveal remains hidden during mission')

  for(const other of groups.values()){
    if(other===team)continue
    for(const member of other){
      const initial=member.state.packet.slice(0,2).map(c=>c.id)
      let x=await gt(member.token,'v2-submit',{action:'individual',round:1,payload:{selected:initial}})
      assert(x.ok,'V2 all teams submit initial decisions')
    }
    let os=await gt(other[0].token,'v2-state')
    assert(os.ok&&os.data.team.all_submitted,'V2 other team reaches full initial participation')

    for(const member of other){
      for(const stepId of ['rank','visual']){
        let x=await gt(member.token,'v2-submit',{
          action:'learning_event',round:1,event_type:'python_run',
          payload:{step_id:stepId,code_changed:false,duration_ms:500,mode:'guided'}
        })
        assert(x.ok,'V2 all teams execute each guided lab block')
      }
      let x=await gt(member.token,'v2-submit',{action:'lab_complete',round:1})
      assert(x.ok&&x.data.points===20,'V2 all teams close lab')
      x=await gt(member.token,'v2-submit',{action:'check',round:1,answer:'b'})
      assert(x.ok&&x.data.points===30,'V2 all teams answer scored check')
      const revised=member.state.packet.slice(-2).map(c=>c.id)
      x=await gt(member.token,'v2-submit',{action:'revision',round:1,payload:{selected:revised}})
      assert(x.ok,'V2 all teams submit revised decisions')
    }
    os=await gt(other[0].token,'v2-state')
    assert(os.ok&&os.data.team.all_revised,'V2 other team reaches full revised participation')

    const x=await gt(other[0].token,'v2-submit',{action:'team',round:1,payload:{selected:selected10}})
    assert(x.ok,'V2 all teams can lock a final policy')
  }

  const wall=await call('v2-wall-state',{game_code:game})
  assert(wall.ok&&wall.data.humans===16,'V2 wall shows all joined humans')
  const wallTeam=wall.data.teams.find(t=>t.id===team[0].state.player.team_id)
  assert(wallTeam?.submitted===4&&wallTeam?.revised===4&&wallTeam?.decision===true,'V2 wall shows initial/revised/final progress')
  assert(wall.data.teams.every(t=>t.humans===0||t.round_value_cop===null),'V2 wall hides current mission COP while open')
  assert(Array.isArray(wall.data.decisions)&&wall.data.decisions.length===0,'V2 wall hides team policies until close/reveal')
  assert(wall.data.checkpoint?.lab===16&&wall.data.checkpoint?.check===16&&wall.data.checkpoint?.revision===16,'V2 wall tracks scored checkpoints for all 16 humans')
  assert(Array.isArray(wall.data.top3)&&wall.data.top3.length===3,'V2 wall exposes a principal individual top 3')
  assert(Array.isArray(wall.data.recent_scores)&&wall.data.recent_scores.length>0,'V2 wall exposes recent point events as activities close')
  assert(wall.data.scoring?.max===100,'V2 wall receives the server scoring contract')
  assert(wall.data.top3.every(x=>x.points===70),'V2 top 3 reflects lab + correct check + revision before reveal')

  r=await call('v2-facilitator',{action:'reveal'},{'x-facilitator-token':ft})
  assert(r.ok,'V2 reveal action')

  const after=await gt(team[2].token,'v2-state')
  assert(after.ok&&after.data.reveal?.concept?.includes('Predicción'),'V2 reveal teaches prediction vs causal effect')
  assert(Array.isArray(after.data.reveal?.customers)&&after.data.reveal.customers.length===24,'V2 reveal exposes counterfactual table')
  assert(Number.isFinite(Number(after.data.team_decision?.result?.incremental_value_cop)),'V2 COP value becomes visible only after reveal')
  assert(Number.isFinite(Number(after.data.team_decision?.result?.best_possible_value_cop)),'V2 reveal includes economic opportunity benchmark')

  analysis=await gt(team[2].token,'v2-analysis')
  assert(analysis.ok&&analysis.data.reveal_tools?.score_uplift?.length===24,'V2 two-futures data unlock only at reveal')
  assert(analysis.data.reveal_tools.score_uplift.every(x=>Number.isFinite(Number(x.incremental_value_cop))),'V2 reveal converts counterfactual effect to COP')

  const wallAfter=await call('v2-wall-state',{game_code:game})
  assert(wallAfter.ok,'V2 wall refreshes after reveal')
  const activeTeams=wallAfter.data.teams.filter(t=>t.humans>0)
  assert(activeTeams.every(t=>Number.isFinite(Number(t.round_value_cop))),'V2 mission value becomes visible after reveal')
  assert(activeTeams.every(t=>Number(t.total_value_cop)===Number(t.round_value_cop)&&t.rounds_scored===1),'V2 cumulative COP board updates after mission')
  assert(wallAfter.data.decisions.length===activeTeams.length,'V2 projector shows every team policy after reveal')

  const playerBoard=await gt(team[0].token,'v2-state')
  assert(playerBoard.ok&&playerBoard.data.all_team_decisions.length===activeTeams.length,'V2 players compare all team policies after reveal')
  assert(playerBoard.data.scoreboard.some(t=>Number(t.total_value_cop)!==0),'V2 players receive cumulative COP value board')
  assert(playerBoard.data.progress?.my?.round_points>70,'V2 reveal exposes team bonus after facilitator closes the reto')
  assert(wallAfter.data.top3.every(x=>x.points>70),'V2 wall top 3 updates with revealed team points')

  console.log('DOS_FUTUROS_V2_OK · 16 humans · one-page scored phases · lab 20 + check 30 + revision 20 + team bonus · top3 live · COP and counterfactuals protected')
}finally{
  login=await call('facilitator-login',{game_code:game,pin})
  if(login.ok){ft=login.data.token;await call('v2-facilitator',{action:'reset'},{'x-facilitator-token':ft})}
}
