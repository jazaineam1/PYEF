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

const rounds=[
  {initial:{selected:['C01','C02']},revision:{selected:['C03','C04']},team:null,steps:['fit','rank'],check:'b'},
  {initial:{choice:'prediction'},revision:{choice:'randomized'},team:{choice:'randomized'},steps:['ate','uncertainty','ci'],check:'a'},
  {initial:{selected:['pga_previo','horas_estudio_post']},revision:{selected:['pga_previo','complejidad']},team:{selected:['pga_previo','complejidad']},steps:['raw','confounder','bad-control'],check:'b'},
  {initial:{choice:'predict-y'},revision:{choice:'dml'},team:{choice:'dml'},steps:['nuisance','residuals','effect'],check:'b'},
  {initial:{choices:{digital:'treat',middle:'observe',traditional:'treat',wealth:'observe',arrears:'avoid'}},revision:{choices:{digital:'treat',middle:'treat',traditional:'observe',wealth:'avoid',arrears:'avoid'}},team:{treat:['digital','middle'],avoid:['wealth','arrears'],observe:['traditional']},steps:['ate','cate','tlearner'],check:'b'},
  {initial:{choice:'causal-forest'},revision:{choice:'depends'},team:{choice:'depends'},steps:['s-vs-t','dr','econml'],check:'c'}
]

let login=await call('facilitator-login',{game_code:game,pin})
assert(login.ok,'V2 facilitator login')
let ft=login.data.token
let r=await call('v2-facilitator',{action:'reset'},{'x-facilitator-token':ft})
assert(r.ok,'V2 reset')

try{
  const tokens=[]
  for(let i=1;i<=4;i++){
    const j=await call('join-game',{game_code:game,display_name:`Campus QA ${i}`,participant_key:`academic-v2-smoke-${i}`})
    assert(j.ok,`player ${i} joins`)
    tokens.push(j.data.token)
  }

  for(let round=1;round<=rounds.length;round++){
    const cfg=rounds[round-1]
    r=await call('v2-facilitator',{action:'start'},{'x-facilitator-token':ft})
    assert(r.ok,`mission ${round} starts`)

    const states=[]
    for(const token of tokens){
      const s=await gt(token,'v2-state')
      assert(s.ok&&s.data.game.round===round,`mission ${round} player state`)
      assert(s.data.game.max_round===6,'runtime exposes six missions')
      states.push(s.data)
    }

    for(let i=0;i<tokens.length;i++){
      const x=await gt(tokens[i],'v2-submit',{action:'individual',round,payload:cfg.initial})
      assert(x.ok,`mission ${round} initial ${i+1}`)
    }

    let ready=await gt(tokens[0],'v2-state')
    assert(ready.ok&&ready.data.team.all_submitted===true,`mission ${round} initial gate`)

    for(let i=0;i<tokens.length;i++){
      for(const stepId of cfg.steps){
        const x=await gt(tokens[i],'v2-submit',{
          action:'learning_event',round,event_type:'python_run',
          payload:{step_id:stepId,code_changed:false,duration_ms:500,mode:'guided'}
        })
        assert(x.ok,`mission ${round} Python step ${stepId}`)
      }
      let x=await gt(tokens[i],'v2-submit',{action:'lab_complete',round})
      assert(x.ok&&x.data.points===20,`mission ${round} lab points`)
      x=await gt(tokens[i],'v2-submit',{action:'check',round,answer:cfg.check})
      assert(x.ok&&x.data.correct===true&&x.data.points===30,`mission ${round} check`)
      x=await gt(tokens[i],'v2-submit',{action:'revision',round,payload:cfg.revision})
      assert(x.ok,`mission ${round} revision ${i+1}`)
    }

    ready=await gt(tokens[0],'v2-state')
    assert(ready.ok&&ready.data.team.all_revised===true,`mission ${round} revision gate`)

    let teamPayload=cfg.team
    if(round===1){
      const pool=ready.data.team_pool||[]
      assert(pool.length>=10,'mission 1 exposes at least ten academic profiles')
      teamPayload={selected:pool.slice(0,10).map(x=>x.id)}
    }
    const td=await gt(tokens[0],'v2-submit',{action:'team',round,payload:teamPayload})
    assert(td.ok,`mission ${round} team decision`)

    const wall=await call('v2-wall-state',{game_code:game})
    assert(wall.ok&&wall.data.humans===4,`mission ${round} wall`)
    assert(wall.data.checkpoint?.lab===4&&wall.data.checkpoint?.check===4&&wall.data.checkpoint?.revision===4,`mission ${round} checkpoints`)

    r=await call('v2-facilitator',{action:'reveal'},{'x-facilitator-token':ft})
    assert(r.ok,`mission ${round} reveal`)

    const after=await gt(tokens[0],'v2-state')
    assert(after.ok&&after.data.progress?.my?.round_points>70,`mission ${round} team points revealed`)

    if(round<rounds.length){
      r=await call('v2-facilitator',{action:'next'},{'x-facilitator-token':ft})
      assert(r.ok,`prepare mission ${round+1}`)
    }
  }

  r=await call('v2-facilitator',{action:'next'},{'x-facilitator-token':ft})
  assert(r.ok,'finish six-mission experience')
  const final=await gt(tokens[0],'v2-state')
  assert(final.ok&&final.data.game.status==='finished','V2 finishes after six missions')
  console.log('DOS_FUTUROS_CAMPUS_OK · 6 missions · A/B · DAG · DML · CATE · causal model battle · live wall')
}finally{
  login=await call('facilitator-login',{game_code:game,pin})
  if(login.ok)await call('v2-facilitator',{action:'reset'},{'x-facilitator-token':login.data.token})
}
