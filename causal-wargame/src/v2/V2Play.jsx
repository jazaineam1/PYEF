import React,{useEffect,useMemo,useState}from'react'
import{Check,ChevronRight,Lightbulb,LogOut,Trophy,Sparkles,RefreshCw}from'lucide-react'
import{invoke,savePlayerToken,savePlayerGameCode,getPlayerToken,clearPlayerSession}from'../lib/api'
import{V2_MISSION,V2_ROUNDS,V2_CHALLENGE_COUNT,RECOMMENDATIONS,POLICY_ACTIONS,statusCopy}from'./content'
import{EvidenceLab,PolicyMeter,RevealVisuals}from'./VisualTools'

const jitter=n=>Math.round(n*(.85+Math.random()*.3))
const pct=n=>`${Math.round(Number(n||0)*100)}%`
const cop=n=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(n||0))
const copShort=n=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',notation:'compact',maximumFractionDigits:1}).format(Number(n||0))

function Join({onJoined}){
  const params=new URLSearchParams(location.search)
  const[code,setCode]=useState((params.get('game')||'').toUpperCase())
  const[name,setName]=useState('')
  const[busy,setBusy]=useState(false),[err,setErr]=useState('')
  async function go(){setBusy(true);setErr('');try{const r=await invoke('join-game',{game_code:code.trim().toUpperCase(),display_name:name.trim()});savePlayerToken(r.token);savePlayerGameCode(code);onJoined()}catch(e){setErr(e.message)}finally{setBusy(false)}}
  return <main className="v2-shell v2-center"><section className="v2-join-card"><div className="v2-brand">DOS FUTUROS <span>V2</span></div><div className="v2-kicker">JUEGO DE DECISIONES CON DATOS</div><h1>Decide. Mira los datos. Vuelve a decidir.</h1><p className="v2-lead">En cada reto tomas una decisión sencilla, haces un laboratorio corto y ves si los datos cambian tu respuesta.</p><div className="v2-rule-row">{V2_MISSION.rules.map((x,i)=><div key={x}><b>{i+1}</b><span>{x}</span></div>)}</div><label>Código de sesión<input value={code} autoCapitalize="characters" onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="Ej. FUTUROS26"/></label><label>Tu nombre<input value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre visible"/></label>{err&&<div className="v2-alert error">{err}</div>}<button className="v2-primary" disabled={busy||code.trim().length<4||name.trim().length<2} onClick={go}>{busy?'Entrando…':'Entrar al equipo'} <ChevronRight size={18}/></button></section></main>
}

function useV2State(enabled){
  const[state,setState]=useState(null),[error,setError]=useState('')
  async function refresh(){try{const x=await invoke('v2-state');setState(x);setError('');return x}catch(e){setError(e.message);return null}}
  useEffect(()=>{if(!enabled)return;let stop=false,t;const loop=async()=>{await refresh();if(!stop)t=setTimeout(loop,jitter(2300))};loop();return()=>{stop=true;clearTimeout(t)}},[enabled])
  return{state,error,refresh}
}

function useV2Analysis(state){
  const[data,setData]=useState(null)
  const key=state?`${state.game.round}:${state.game.status}:${state.team.all_submitted}`:''
  useEffect(()=>{if(!state)return;let alive=true;invoke('v2-analysis').then(x=>{if(alive)setData(x)}).catch(()=>{if(alive)setData(null)});return()=>{alive=false}},[key])
  return data
}

function Header({state,onExit}){
  const r=V2_ROUNDS[state.game.round]
  const me=state.progress?.my
  return <header className="v2-header"><div><div className="v2-brand small">DOS FUTUROS <span>V2</span></div><strong>{state.player.name}</strong></div><div className="v2-header-center"><span>Reto {state.game.round}/{V2_CHALLENGE_COUNT}</span><b>{r?.title}</b></div><div className="v2-header-score"><b>{me?.points??0} pts</b><span>#{me?.rank??'—'}</span></div><button className="v2-icon" onClick={onExit} title="Salir"><LogOut size={18}/></button></header>
}

function MissionStrip({round}){
  const r=V2_ROUNDS[round]
  return <section className="v2-mission compact simple"><div><div className="v2-kicker">{r.kicker}</div><h1>{r.title}</h1></div><div><p>{r.case}</p><div className="v2-question-card"><small>LA PREGUNTA</small><strong>{r.question}</strong></div></div></section>
}

function Lobby({state}){
  return <div className="v2-main"><section className="v2-big-wait"><div className="v2-pulse"/><div className="v2-kicker">YA ESTÁS DENTRO</div><h1>{state.player.name}</h1><p>Equipo <b>{state.player.team}</b> · asiento {state.player.seat}</p><h2>Espera a que el facilitador inicie.</h2><div className="v2-team-roster">{state.team.roster.map(p=><div key={p.id} className="ready"><span>✓</span>{p.name}</div>)}</div><div className="v2-alert">No hay roles. Todos deciden, investigan y argumentan con la misma autoridad.</div></section></div>
}

function CustomerCard({c,selected,onClick,mode='predictive'}){
  return <button type="button" className={`v2-customer ${selected?'selected':''}`} onClick={onClick}><div className="v2-card-top"><span>{c.id}</span>{selected&&<Check size={17}/>}</div><h3>{c.name}</h3><small>{c.segment}</small>{mode==='predictive'&&<><div className="v2-score">{pct(c.score)}</div><small>probabilidad estimada de renovar</small>{c.cohort_size&&<small>{Number(c.cohort_size).toLocaleString()} usuarios</small>}</>}{mode==='history'&&<div className="v2-history"><span>Riesgo previo <b>{c.risk}/4</b></span><span>{c.treated?'Recibió mes gratis':'No recibió'}</span><span>Renovó <b>{c.outcome?'Sí':'No'}</b></span></div>}</button>
}

function SegmentCard({s,value,onChange,showSelect=true}){
  return <article><div><h3>{s.name}</h3><small>{Number(s.audience).toLocaleString()} usuarios · riesgo {s.risk}</small></div><div><b>{cop(s.value||0)}</b><small>valor si renueva · costo incentivo {cop(s.cost||0)}</small></div>{showSelect&&<select value={value||'observe'} onChange={e=>onChange?.(e.target.value)}>{POLICY_ACTIONS.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select>}</article>
}

function Hint({text,round}){
  const key=`v2-hint-${round}`,initial=localStorage.getItem(key)==='1'
  const[open,setOpen]=useState(initial)
  function show(){setOpen(true);localStorage.setItem(key,'1')}
  return open?<div className="v2-alert hint"><Lightbulb size={18}/><span>{text}</span></div>:<button className="v2-secondary" onClick={show}><Lightbulb size={16}/> Necesito una pista</button>
}

function IndividualCohorts({state,onSend,busy,revision=false,round}){
  const[sel,setSel]=useState([])
  const rows=revision?(state.team_pool||[]):state.packet
  const toggle=id=>setSel(v=>v.includes(id)?v.filter(x=>x!==id):v.length<3?[...v,id]:v)
  return <><div className="v2-step"><b>{revision?'REVISA TU DECISIÓN':'DECIDE TÚ'}</b><span>{revision?V2_ROUNDS[round].revise:V2_ROUNDS[round].individual}</span></div><div className="v2-grid customers">{rows.map(c=><CustomerCard key={c.id} c={c} selected={sel.includes(c.id)} onClick={()=>toggle(c.id)}/>)}</div><div className="v2-sticky"><span>{sel.length}/3 cohortes</span><button className="v2-primary" disabled={busy||sel.length<1} onClick={()=>onSend({selected:sel})}>{revision?'Guardar decisión revisada':'Enviar decisión inicial'}</button></div></>
}

function Recommendation({onSend,busy,revision=false,round}){
  const[rec,setRec]=useState('')
  return <><div className="v2-step"><b>{revision?'REVISA TU DECISIÓN':'DECIDE TÚ'}</b><span>{revision?V2_ROUNDS[round].revise:V2_ROUNDS[round].individual}</span></div><div className="v2-choice-row">{RECOMMENDATIONS.map(([v,l])=><button className={rec===v?'selected':''} key={v} onClick={()=>setRec(v)}>{l}</button>)}</div><button className="v2-primary wide" disabled={busy||!rec} onClick={()=>onSend({recommendation:rec})}>{revision?'Guardar recomendación revisada':'Enviar recomendación inicial'}</button></>
}

function PolicyChoice({state,onSend,busy,revision=false,team=false,round}){
  const segs=revision||team?(state.team_pool||[]):state.packet
  const[choices,setChoices]=useState(Object.fromEntries(segs.map(s=>[s.id,'observe'])))
  const used=segs.filter(s=>choices[s.id]==='treat').reduce((a,s)=>a+Number(s.audience),0)
  const capacity=Number(state.economy?.capacity||15000)
  function payload(){
    if(team)return{
      treat:segs.filter(s=>choices[s.id]==='treat').map(s=>s.id),
      avoid:segs.filter(s=>choices[s.id]==='avoid').map(s=>s.id),
      observe:segs.filter(s=>choices[s.id]==='observe').map(s=>s.id)
    }
    return{choices}
  }
  return <><div className="v2-step"><b>{team?'DECIDAN JUNTOS':revision?'REVISA TU DECISIÓN':'DECIDE TÚ'}</b><span>{team?V2_ROUNDS[round].team:revision?V2_ROUNDS[round].revise:V2_ROUNDS[round].individual}</span></div>{(revision||team)&&<PolicyMeter segments={segs} choices={choices} capacity={capacity}/>}<div className="v2-segments">{segs.map(s=><SegmentCard key={s.id} s={s} value={choices[s.id]} onChange={v=>setChoices({...choices,[s.id]:v})}/>)}</div><button className="v2-primary wide" disabled={busy||(team&&used>capacity)} onClick={()=>onSend(payload())}>{team?(used>capacity?'Superan capacidad':'Bloquear política del equipo'):revision?'Guardar política revisada':'Enviar propuesta inicial'}</button></>
}

function TeamProgress({state,phase='initial'}){
  const p=state.progress?.team||{}
  const revision=phase==='revision'
  const value=revision?(p.revision??state.team.revised):(p.initial??state.team.submitted)
  return <section className="v2-team-progress"><div className="v2-step"><b>{revision?'ESPERANDO REVISIONES':'ESPERANDO AL EQUIPO'}</b><span>{revision?'Cuando todos revisen, se abre la decisión final del equipo.':'Cuando todos respondan, se abre el laboratorio.'}</span></div><div className="v2-team-roster">{state.team.roster.map(x=>{const done=revision?x.revised:x.submitted;return <div key={x.id} className={done?'ready':'waiting'}><span>{done?'✓':'…'}</span>{x.name}</div>})}</div><h2>{value}/{p.humans??state.team.size}</h2></section>
}

const PHASES=[
  ['initial','Decide'],['lab','Laboratorio'],['check','Pregunta'],['revision','Revisa'],['team','Equipo'],['reveal','Resultado']
]

function StudentProgress({state}){
  const progress=state.progress||{}
  const phase=progress.phase||'initial'
  const normalize=x=>x==='wait_initial'?'initial':x==='wait_revision'?'revision':x==='wait_reveal'?'team':x
  const current=normalize(phase)
  const idx=Math.max(0,PHASES.findIndex(x=>x[0]===current))
  const me=progress.my||{}
  return <section className="v2-student-progress"><div className="v2-student-score"><div><small>TU PUNTAJE</small><strong>{me.points??0}</strong><span>puntos</span></div><div><small>ESTE RETO</small><strong>{me.round_points??0}<em>/100</em></strong></div><div><small>POSICIÓN</small><strong>#{me.rank??'—'}</strong></div></div><div className="v2-phase-line">{PHASES.map((x,i)=><div key={x[0]} className={i<idx?'done':i===idx?'active':''}><b>{i<idx?'✓':i+1}</b><span>{x[1]}</span></div>)}</div></section>
}

function CheckpointQuestion({round,onDone}){
  const r=V2_ROUNDS[round]
  const[answer,setAnswer]=useState('')
  const[result,setResult]=useState(null)
  const[busy,setBusy]=useState(false)
  const[err,setErr]=useState('')
  async function submit(){
    setBusy(true);setErr('')
    try{setResult(await invoke('v2-submit',{action:'check',round,answer}))}
    catch(e){setErr(e.message)}
    finally{setBusy(false)}
  }
  return <section className="v2-check-page"><div className="v2-step"><b>PREGUNTA DE CIERRE · 30 PUNTOS</b><span>Una sola pregunta para comprobar que entendiste la idea del laboratorio.</span></div><h2>{r.checkQuestion}</h2><div className="v2-check-options">{(r.checkOptions||[]).map(([v,label])=><button type="button" key={v} className={answer===v?'selected':''} disabled={Boolean(result)} onClick={()=>setAnswer(v)}><b>{v.toUpperCase()}</b><span>{label}</span></button>)}</div>{err&&<div className="v2-alert error">{err}</div>}{!result?<button className="v2-primary wide" disabled={!answer||busy} onClick={submit}>{busy?'Enviando…':'Cerrar pregunta'}</button>:<><div className={`v2-check-result ${result.correct?'correct':'wrong'}`}><strong>{result.points}/{result.max_points} puntos</strong><span>{result.correct?'Correcto. La idea quedó clara.':'No suma puntos esta vez. El siguiente paso te permite revisar tu decisión.'}</span></div><button className="v2-primary wide" onClick={onDone}>Continuar</button></>}</section>
}

function proposalText(round,payload={}){
  const template=V2_ROUNDS[round]?.template
  if(template==='cohort-selection')return (payload.selected||[]).join(', ')||'—'
  if(template==='recommendation')return RECOMMENDATIONS.find(x=>x[0]===payload.recommendation)?.[1]||'—'
  const entries=Object.entries(payload.choices||{})
  if(entries.length)return entries.map(([k,v])=>`${k}: ${POLICY_ACTIONS.find(x=>x[0]===v)?.[1]||v}`).join(' · ')
  const treat=(payload.treat||[]).join(', ')||'ninguno'
  return 'Ofrecer bono: '+treat
}

function DecisionSummary({state,revised=false}){
  const rows=revised?state.team_revisions:state.team_submissions
  if(!rows?.length)return null
  return <section className="v2-proposals"><div className="v2-step compact"><b>{revised?'ASÍ CAMBIÓ EL EQUIPO':'DECISIONES INICIALES'}</b><span>{revised?'Comparen qué cambió después del análisis.':'Estas decisiones se tomaron antes de abrir el laboratorio.'}</span></div><div className="v2-proposal-grid">{rows.map(s=><article key={s.player_id}><b>{s.name}</b><p>{proposalText(state.game.round,s.payload)}</p></article>)}</div></section>
}

function ValueBoard({teams=[],currentTeamId}){
  const rows=[...teams].filter(t=>Number(t.humans||0)>0||Number(t.rounds_scored||0)>0).sort((a,b)=>Number(b.total_value_cop||0)-Number(a.total_value_cop||0)||Number(a.position||0)-Number(b.position||0))
  if(!rows.some(t=>Number(t.rounds_scored||0)>0))return null
  const max=Math.max(1,...rows.map(t=>Math.abs(Number(t.total_value_cop||0))))
  return <section className="v2-scoreboard-mini"><div className="v2-scoreboard-title"><Trophy size={18}/><b>VALOR</b><span>incremental acumulado</span></div><div className="v2-scoreboard-rows">{rows.map((t,i)=><div className={t.id===currentTeamId?'mine':''} key={t.id}><span className="rank">{i+1}</span><strong>{t.name}</strong><div className="v2-scorebar"><i style={{width:(Math.abs(Number(t.total_value_cop||0))/max*100)+'%'}}/></div><b>{copShort(t.total_value_cop)}</b>{t.round_value_cop!==null&&t.round_value_cop!==undefined&&<em>{Number(t.round_value_cop)>=0?'+':''}{copShort(t.round_value_cop)}</em>}</div>)}</div></section>
}

function AllTeamDecisions({state}){
  const decisions=state.all_team_decisions||[]
  if(!decisions.length)return null
  return <section className="v2-all-decisions"><div className="v2-step compact"><b>ASÍ DECIDIERON TODOS</b><span>El tablero ordena valor económico, no respuestas “correctas”.</span></div><div className="v2-all-decision-grid">{decisions.map(d=><article key={d.team_id}><div><strong>{d.team}</strong><span>{copShort(d.value_cop)}</span></div><p>{proposalText(state.game.round,d.payload)}</p></article>)}</div></section>
}

function WowCard({round}){
  const r=V2_ROUNDS[round]
  return <section className="v2-wow"><div className="v2-wow-badge"><Sparkles size={16}/> GIRO WOW</div><strong>{r.wow}</strong><p>{r.reality}</p></section>
}

function TeamCohorts({state,onSend,busy,round}){
  const initial=useMemo(()=>[...new Set((state.team_revisions||[]).flatMap(s=>s.payload.selected||[]))].slice(0,10),[state.game.round,state.team_revisions?.length])
  const[sel,setSel]=useState(initial)
  const toggle=id=>setSel(v=>v.includes(id)?v.filter(x=>x!==id):v.length<10?[...v,id]:v)
  return <><div className="v2-step"><b>DECIDAN JUNTOS</b><span>{V2_ROUNDS[round].team}</span></div><div className="v2-grid customers compact">{state.team_pool.map(c=><CustomerCard key={c.id} c={c} selected={sel.includes(c.id)} onClick={()=>toggle(c.id)}/>)}</div><div className="v2-sticky"><span>{sel.length}/10 cohortes</span><button className="v2-primary" disabled={busy||sel.length!==10} onClick={()=>onSend({selected:sel})}>Bloquear política del equipo</button></div></>
}

function TeamRecommendation({onSend,busy,round}){
  const[rec,setRec]=useState('')
  return <><div className="v2-step"><b>DECIDAN JUNTOS</b><span>{V2_ROUNDS[round].team}</span></div><div className="v2-choice-row">{RECOMMENDATIONS.map(([v,l])=><button className={rec===v?'selected':''} key={v} onClick={()=>setRec(v)}>{l}</button>)}</div><button className="v2-primary wide" disabled={busy||!rec} onClick={()=>onSend({recommendation:rec})}>Bloquear recomendación del equipo</button></>
}

function Reveal({state,analysis}){
  const r=V2_ROUNDS[state.game.round],template=r?.template,x=state.reveal||{},result=state.team_decision?.result||{}
  return <div className="v2-main v2-player-compact"><MissionStrip round={state.game.round}/><StudentProgress state={state}/><ValueBoard teams={state.scoreboard||[]} currentTeamId={state.player.team_id}/><AllTeamDecisions state={state}/><section className="v2-reveal compact"><div className="v2-kicker">REVEAL · LO QUE ESTABA OCULTO</div><h1>{x.title||r.takeaway}</h1><div className="v2-concept">{x.concept||r.concept}</div>
    {template==='cohort-selection'&&<><div className="v2-result money"><b>Valor incremental del equipo</b><strong>{cop(result.incremental_value_cop)}</strong><span>Mejor valor posible con 10 cohortes: {cop(result.best_possible_value_cop)} · brecha {cop(result.value_gap_cop)}</span></div><div className="v2-reveal-table">{(x.customers||[]).filter(c=>state.team_decision?.payload?.selected?.includes(c.id)).map(c=><div key={c.id}><b>{c.id}</b><span>predicción {pct(c.score)}</span><span>sin intervención {pct(c.p0)}</span><span>con intervención {pct(c.p1)}</span><strong>{cop(c.incremental_value_cop)}</strong></div>)}</div></>}
    {template==='recommendation'&&<div className="v2-metrics"><div><span>Cambio real del mundo simulado</span><strong>+{x.true_effect_pp} pp</strong></div><div><span>Valor potencial de la campaña</span><strong>{cop(x.campaign_potential_value_cop)}</strong></div><p><b>DAG:</b> {x.dag}</p><p>{x.lesson}</p><div className="v2-alert">Esta misión no suma dinero al ranking: identificar causalidad no se convierte honestamente en COP hasta definir una política.</div></div>}
    {template==='segment-policy'&&<><div className="v2-result money"><b>Valor incremental de la política</b><strong>{cop(result.incremental_value_cop)}</strong><span>{Number(result.treated_audience||0).toLocaleString()} clientes tratados de {Number(result.capacity||state.economy?.capacity||0).toLocaleString()} de capacidad</span></div><div className="v2-metrics"><div><span>Con bono</span><strong>{x.treatment_rate}%</strong></div><div><span>Sin bono</span><strong>{x.control_rate}%</strong></div><div><span>Cambio promedio observado</span><strong>+{x.ate_pp} pp</strong></div></div><div className="v2-segments reveal">{(x.segments||[]).map(s=><article key={s.id}><b>{s.name}</b><span>{Number(s.effect_pp)>0?'+':''}{s.effect_pp} pp</span><small>{cop(s.incremental_value_cop)} · IC [{s.ci_low}, {s.ci_high}]</small></article>)}</div></>}
    <WowCard round={state.game.round}/><RevealVisuals round={state.game.round} state={state} analysis={analysis}/><div className="v2-teach"><div className="v2-kicker">CONCEPTO FORMAL</div><h2>{r.concept}</h2><p>{r.takeaway}</p></div>{state.game.status==='finished'?<div className="v2-finished">Fin. La pregunta dejó de ser “¿qué predice el modelo?” y pasó a ser “¿qué cambia si intervengo y cuánto valor genera?”.</div>:<p className="v2-wait-note">Espera al facilitador para continuar.</p>}</section></div>
}

function RoundPlay({state,refresh,analysis}){
  const[busy,setBusy]=useState(false),[err,setErr]=useState('')
  const round=state.game.round
  const template=V2_ROUNDS[round]?.template
  const phase=state.progress?.phase||(!state.my_submission?'initial':!state.team.all_submitted?'wait_initial':!state.my_revision?'lab':!state.team.all_revised?'wait_revision':!state.team_decision?'team':'wait_reveal')

  async function send(action,payload){
    setBusy(true);setErr('')
    try{await invoke('v2-submit',{action,round,payload});await refresh()}
    catch(e){setErr(e.message)}
    finally{setBusy(false)}
  }

  let page=null
  if(phase==='initial')page=<>
    {template==='cohort-selection'&&<IndividualCohorts state={state} round={round} onSend={p=>send('individual',p)} busy={busy}/>}
    {template==='recommendation'&&<Recommendation round={round} onSend={p=>send('individual',p)} busy={busy}/>}
    {template==='segment-policy'&&<PolicyChoice state={state} round={round} onSend={p=>send('individual',p)} busy={busy}/>}
  </>
  else if(phase==='wait_initial')page=<TeamProgress state={state}/>
  else if(phase==='lab')page=<EvidenceLab round={round} state={state} analysis={analysis} onComplete={refresh}/>
  else if(phase==='check')page=<CheckpointQuestion round={round} onDone={refresh}/>
  else if(phase==='revision')page=<>
    {template==='cohort-selection'&&<IndividualCohorts state={state} round={round} revision onSend={p=>send('revision',p)} busy={busy}/>}
    {template==='recommendation'&&<Recommendation round={round} revision onSend={p=>send('revision',p)} busy={busy}/>}
    {template==='segment-policy'&&<PolicyChoice state={state} round={round} revision onSend={p=>send('revision',p)} busy={busy}/>}
  </>
  else if(phase==='wait_revision')page=<TeamProgress state={state} phase="revision"/>
  else if(phase==='team')page=<>
    <DecisionSummary state={state} revised/>
    {template==='cohort-selection'&&<TeamCohorts state={state} round={round} onSend={p=>send('team',p)} busy={busy}/>}
    {template==='recommendation'&&<TeamRecommendation round={round} onSend={p=>send('team',p)} busy={busy}/>}
    {template==='segment-policy'&&<PolicyChoice state={state} round={round} team onSend={p=>send('team',p)} busy={busy}/>}
  </>
  else page=<section className="v2-big-wait small"><Check size={44}/><h2>Decisión final registrada</h2><p>Tu puntaje final del reto aparece cuando el facilitador muestre el resultado.</p></section>

  return <div className="v2-main v2-player-compact"><MissionStrip round={round}/><StudentProgress state={state}/>{err&&<div className="v2-alert error">{err}</div>}<section className="v2-single-step-page">{page}</section></div>
}

export default function V2Play(){
  const[joined,setJoined]=useState(Boolean(getPlayerToken()))
  const{state,error,refresh}=useV2State(joined)
  const analysis=useV2Analysis(state)
  function exit(){clearPlayerSession();setJoined(false);location.reload()}
  if(!joined)return <Join onJoined={()=>setJoined(true)}/>
  if(error&&!state)return <main className="v2-shell v2-center"><div className="v2-alert error">{error}</div><button className="v2-secondary" onClick={exit}>Volver a entrar</button></main>
  if(!state)return <main className="v2-shell v2-center"><div className="v2-loader">Conectando…</div></main>
  const waiting=['lobby','briefing','lesson'].includes(state.game.status)
  const reveal=['reveal','teaching','microcheck','finished'].includes(state.game.status)
  return <div className="v2-shell"><Header state={state} onExit={exit}/>{waiting&&<Lobby state={state}/>} {state.game.status==='round'&&<RoundPlay state={state} refresh={refresh} analysis={analysis}/>} {state.game.status==='paused'&&<div className="v2-main"><MissionStrip round={state.game.round}/><section className="v2-big-wait"><h2>Reto pausado</h2><p>Conserven su discusión; el facilitador la reanudará.</p></section></div>} {state.game.status==='closed'&&<div className="v2-main v2-player-compact"><MissionStrip round={state.game.round} state={state}/><ValueBoard teams={state.scoreboard||[]} currentTeamId={state.player.team_id}/><AllTeamDecisions state={state}/><section className="v2-big-wait small"><h2>Decisiones cerradas</h2><p>El resultado y el puntaje final del reto se mostrarán al cerrar.</p></section></div>} {reveal&&<Reveal state={state} analysis={analysis}/>}<footer className="v2-footer"><span>{statusCopy(state.game.status)}</span><span>{state.player.team} · {state.player.name}</span></footer></div>
}
