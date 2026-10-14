import{prewarmPython}from'./PythonEvidenceLab'
import React,{useEffect,useMemo,useState}from'react'
import {useV2Quiz,QuizPlayer,WorkshopBanner} from './V2Quiz.jsx'
import {CausalExplainer} from './CausalExplainer.jsx'
import{Check,ChevronRight,LogOut,Sparkles,Trophy}from'lucide-react'
import{invoke,savePlayerToken,savePlayerGameCode,getPlayerToken,clearPlayerSession}from'../lib/api'
import{V2_MISSION,V2_ROUNDS,V2_CHALLENGE_COUNT,POLICY_ACTIONS,optionsForRound,statusCopy}from'./content'
import{EvidenceLab,PolicyMeter}from'./VisualTools'

const jitter=n=>Math.round(n*(.85+Math.random()*.3))
const pct=n=>`${Math.round(Number(n||0)*100)}%`
const num=n=>new Intl.NumberFormat('es-CO',{maximumFractionDigits:1}).format(Number(n||0))

function Join({onJoined}){
  const params=new URLSearchParams(location.search)
  const[code,setCode]=useState((params.get('game')||'').toUpperCase())
  const[name,setName]=useState('')
  const[busy,setBusy]=useState(false),[err,setErr]=useState('')
  async function go(){setBusy(true);setErr('');try{const r=await invoke('join-game',{game_code:code.trim().toUpperCase(),display_name:name.trim()});savePlayerToken(r.token);savePlayerGameCode(code);onJoined()}catch(e){setErr(e.message)}finally{setBusy(false)}}
  return <main className="v2-shell v2-center"><section className="v2-join-card"><div className="v2-brand">DOS FUTUROS <span>CAMPUS</span></div><div className="v2-kicker">LABORATORIO DE INFERENCIA CAUSAL</div><h1>Decide. Ejecuta. Sorpréndete. Vuelve a decidir.</h1><p className="v2-lead">Vas a investigar qué acciones realmente cambian el desempeño académico, no sólo qué variables lo predicen.</p><div className="v2-rule-row">{V2_MISSION.rules.map((x,i)=><div key={x}><b>{i+1}</b><span>{x}</span></div>)}</div><label>Código de sesión<input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="FUTUROS"/></label><label>Tu nombre<input value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre visible"/></label>{err&&<div className="v2-alert error">{err}</div>}<button className="v2-primary" disabled={busy||code.trim().length<4||name.trim().length<2} onClick={go}>{busy?'Entrando…':'Entrar al equipo'} <ChevronRight size={18}/></button></section></main>
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
  const r=V2_ROUNDS[state.game.round],me=state.progress?.my
  return <header className="v2-header"><div><div className="v2-brand small">DOS FUTUROS <span>CAMPUS</span></div><strong>{state.player.name}</strong></div><div className="v2-header-center"><span>Misión {state.game.round}/{state.game.max_round||V2_CHALLENGE_COUNT}</span><b>{r?.title}</b></div><div className="v2-header-score"><b>{me?.points??0} pts</b><span>#{me?.rank??'—'}</span></div><button className="v2-icon" onClick={onExit} title="Salir"><LogOut size={18}/></button></header>
}

const MISSION_ICONS=['🔍','⚗️','🕸️','🧠','🎯','🏆']
function CampaignMap({round}){
  return <nav className="v2-campaign-map" aria-label="Progreso de las seis misiones">
    {MISSION_ICONS.map((icon,i)=><div key={i} className={i+1<round?'cleared':i+1===round?'current':'locked'} aria-current={i+1===round?'step':undefined} title={`Misión ${i+1}`}>
      <span aria-hidden="true">{icon}</span><small>{i+1}</small>
    </div>)}
  </nav>
}
function MissionStrip({round}){
  const r=V2_ROUNDS[round]
  return <section className="v2-mission compact simple v2-campaign-scene">
    <div className="v2-campaign-head"><div><div className="v2-kicker">OPERACIÓN {String(round).padStart(2,'0')} / 06 · {r.kicker}</div><h1>{r.title}</h1></div><div className="v2-character" aria-label="Personaje investigador del equipo"><span aria-hidden="true">🧑‍🚀</span><small>AGENTE</small></div></div>
    <div><p>{r.case}</p><div className="v2-question-card"><small>🎮 TU MISIÓN</small><strong>{r.question}</strong></div><CampaignMap round={round}/></div>
  </section>
}

function Glossary({round}){
  const rows=V2_ROUNDS[round]?.glossary||[]
  if(!rows.length)return null
  return <section className="v2-panel v2-glossary"><div className="v2-kicker">DICCIONARIO DEL RETO · NINGUNA SIGLA SIN DEFINICIÓN</div><div className="v2-glossary-grid">{rows.map(x=><article key={x.term}><strong>{x.term}</strong><b>{x.full}</b><p>{x.definition}</p></article>)}</div></section>
}

function Lobby({state}){
  return <div className="v2-main"><section className="v2-big-wait"><div className="v2-pulse"/><div className="v2-kicker">YA ESTÁS DENTRO</div><h1>{state.player.name}</h1><p>Equipo <b>{state.player.team}</b> · asiento {state.player.seat}</p><h2>Espera a que el facilitador inicie.</h2><div className="v2-team-roster">{state.team.roster.map(p=><div key={p.id} className="ready"><span>✓</span>{p.name}</div>)}</div><div className="v2-alert">Todos toman decisiones y ejecutan los mismos laboratorios; no hay roles técnicos ocultos.</div></section></div>
}

function AcademicCard({c,selected,onClick}){
  const pga=Number(c.tenure||0)>10?Number(c.tenure||0)/100:Number(c.tenure||0)
  return <button type="button" className={`v2-customer ${selected?'selected':''}`} onClick={onClick}><div className="v2-card-top"><span>{c.id}</span>{selected&&<Check size={17}/>}</div><h3>{c.name}</h3><small>{c.segment}</small><div className="v2-score">{pct(c.score)}</div><small>probabilidad estimada de aprobar</small><div className="v2-history"><span>PGA previo <b>{pga.toFixed(2)}</b></span><span>Estudio <b>{Number(c.usage||0)} h</b></span><span>Fatiga <b>{Number(c.bugs||0)}/10</b></span></div></button>
}

function SegmentCard({s,value,onChange,showSelect=true}){
  return <article><div><h3>{s.name}</h3><small>{Number(s.audience||0).toLocaleString()} estudiantes · riesgo {s.risk}</small></div><div><b>Perfil académico</b><small>prioriza según efecto, incertidumbre y cupos</small></div>{showSelect&&<select value={value||'observe'} onChange={e=>onChange?.(e.target.value)}>{POLICY_ACTIONS.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select>}</article>
}

function CohortDecision({state,onSend,busy,revision=false,round,team=false}){
  const rows=revision||team?(state.team_pool||[]):state.packet
  const max=team?10:3
  const[sel,setSel]=useState([])
  const toggle=id=>setSel(v=>v.includes(id)?v.filter(x=>x!==id):v.length<max?[...v,id]:v)
  return <><div className="v2-step"><b>{team?'DECIDAN JUNTOS':revision?'REVISA TU DECISIÓN':'DECIDE TÚ'}</b><span>{team?V2_ROUNDS[round].team:revision?V2_ROUNDS[round].revise:V2_ROUNDS[round].individual}</span></div><div className="v2-grid customers">{rows.map(c=><AcademicCard key={c.id} c={c} selected={sel.includes(c.id)} onClick={()=>toggle(c.id)}/>)}</div><div className="v2-sticky"><span>{sel.length}/{max} perfiles</span><button className="v2-primary" disabled={busy||sel.length<1||(team&&sel.length!==10)} onClick={()=>onSend({selected:sel})}>{team?'Bloquear decisión del equipo':revision?'Guardar decisión revisada':'Enviar decisión inicial'}</button></div></>
}

function SingleChoice({round,onSend,busy,revision=false,team=false}){
  const opts=optionsForRound(round),[choice,setChoice]=useState('')
  return <><div className="v2-step"><b>{team?'DECIDAN JUNTOS':revision?'REVISA TU DECISIÓN':'DECIDE TÚ'}</b><span>{team?V2_ROUNDS[round].team:revision?V2_ROUNDS[round].revise:V2_ROUNDS[round].individual}</span></div><div className="v2-check-options">{opts.map(([v,l])=><button type="button" key={v} className={choice===v?'selected':''} onClick={()=>setChoice(v)}><span>{l}</span></button>)}</div><button className="v2-primary wide" disabled={busy||!choice} onClick={()=>onSend({choice})}>{team?'Confirmar decisión del equipo':revision?'Guardar decisión revisada':'Enviar decisión inicial'}</button></>
}

function MultiSelect({round,onSend,busy,revision=false,team=false}){
  const opts=optionsForRound(round),[sel,setSel]=useState([])
  const toggle=v=>setSel(xs=>xs.includes(v)?xs.filter(x=>x!==v):[...xs,v])
  return <><div className="v2-step"><b>{team?'DECIDAN JUNTOS':revision?'REVISA TU DECISIÓN':'DECIDE TÚ'}</b><span>{team?V2_ROUNDS[round].team:revision?V2_ROUNDS[round].revise:V2_ROUNDS[round].individual}</span></div><div className="v2-check-options">{opts.map(([v,l])=><button type="button" key={v} className={sel.includes(v)?'selected':''} onClick={()=>toggle(v)}><b>{sel.includes(v)?'✓':'+'}</b><span>{l}</span></button>)}</div><button className="v2-primary wide" disabled={busy||sel.length<1} onClick={()=>onSend({selected:sel})}>{team?'Bloquear conjunto de ajuste':revision?'Guardar selección revisada':'Enviar selección inicial'}</button></>
}

function PolicyChoice({state,onSend,busy,revision=false,team=false,round}){
  const segs=revision||team?(state.team_pool||[]):state.packet
  const[choices,setChoices]=useState(Object.fromEntries(segs.map(s=>[s.id,'observe'])))
  const used=segs.filter(s=>choices[s.id]==='treat').reduce((a,s)=>a+Number(s.audience||0),0)
  const capacity=Number(state.economy?.capacity||15000)
  const payload=()=>team?{
    treat:segs.filter(s=>choices[s.id]==='treat').map(s=>s.id),
    avoid:segs.filter(s=>choices[s.id]==='avoid').map(s=>s.id),
    observe:segs.filter(s=>choices[s.id]==='observe').map(s=>s.id)
  }:{choices}
  return <><div className="v2-step"><b>{team?'DECIDAN JUNTOS':revision?'REVISA TU DECISIÓN':'DECIDE TÚ'}</b><span>{team?V2_ROUNDS[round].team:revision?V2_ROUNDS[round].revise:V2_ROUNDS[round].individual}</span></div>{(revision||team)&&<PolicyMeter segments={segs} choices={choices} capacity={capacity}/>}<div className="v2-segments">{segs.map(s=><SegmentCard key={s.id} s={s} value={choices[s.id]} onChange={v=>setChoices({...choices,[s.id]:v})}/>)}</div><button className="v2-primary wide" disabled={busy||(team&&used>capacity)} onClick={()=>onSend(payload())}>{team?(used>capacity?'Superan los cupos':'Confirmar política del equipo'):revision?'Guardar política revisada':'Enviar propuesta inicial'}</button></>
}

function TeamProgress({state,phase='initial'}){
  const p=state.progress?.team||{},revision=phase==='revision'
  const value=revision?(p.revision??state.team.revised):(p.initial??state.team.submitted)
  return <section className="v2-team-progress"><div className="v2-step"><b>{revision?'ESPERANDO REVISIONES':'ESPERANDO AL EQUIPO'}</b><span>{revision?'Cuando todos revisen, se abre la decisión final.':'Cuando todos respondan, se abre el laboratorio.'}</span></div><div className="v2-team-roster">{state.team.roster.map(x=>{const done=revision?x.revised:x.submitted;return <div key={x.id} className={done?'ready':'waiting'}><span>{done?'✓':'…'}</span>{x.name}</div>})}</div><h2>{value}/{p.humans??state.team.size}</h2></section>
}

const PHASES=[['initial','Decide'],['lab','Laboratorio'],['check','Pregunta'],['revision','Revisa'],['team','Equipo'],['reveal','Resultado']]

function StudentProgress({state}){
  const progress=state.progress||{},phase=progress.phase||'initial'
  const normalize=x=>x==='wait_initial'?'initial':x==='wait_revision'?'revision':x==='wait_reveal'?'team':x
  const idx=Math.max(0,PHASES.findIndex(x=>x[0]===normalize(phase))),me=progress.my||{}
  return <section className="v2-student-progress"><div className="v2-student-score"><div><small>TU PUNTAJE</small><strong>{me.points??0}</strong><span>puntos</span></div><div><small>ESTA MISIÓN</small><strong>{me.round_points??0}<em>/{me.round_max??100}</em></strong></div><div><small>POSICIÓN</small><strong>#{me.rank??'—'}</strong><span>ranking en vivo</span></div></div><div className="v2-phase-line">{PHASES.map((x,i)=><div key={x[0]} className={i<idx?'done':i===idx?'active':''}><b>{i<idx?'✓':i+1}</b><span>{x[1]}</span></div>)}</div></section>
}

function PhasePoints({phase,state,round}){
  const cfg=state.progress?.challenge||{},defaults=V2_ROUNDS[round]?.points||{}
  const values={initial:0,wait_initial:0,lab:Number(cfg.lab_points??defaults.lab??20),check:Number(cfg.check_points??defaults.check??30),revision:Number(cfg.revision_points??defaults.revision??20),wait_revision:0,team:Number(cfg.team_points??defaults.team??30),wait_reveal:0}
  const points=values[phase]??0
  const copy=phase==='initial'?'La primera respuesta es diagnóstica: no suma ni resta puntos.':phase==='check'?`Esta pregunta puede sumar hasta ${points} puntos.`:phase==='team'?`La decisión final puede sumar hasta ${points} puntos al revelar.`:points>0?`Completar esta fase suma ${points} puntos.`:'Esta fase no cambia tu puntaje.'
  return <div className="v2-phase-points"><b>{points>0?`+${points}`:'0'} pts</b><span>{copy}</span></div>
}

function CheckpointQuestion({round,state,onDone}){
  const r=V2_ROUNDS[round],maxPoints=Number(state?.progress?.challenge?.check_points??r?.points?.check??30)
  const[answer,setAnswer]=useState(''),[result,setResult]=useState(null),[busy,setBusy]=useState(false),[err,setErr]=useState('')
  async function submit(){setBusy(true);setErr('');try{setResult(await invoke('v2-submit',{action:'check',round,answer}))}catch(e){setErr(e.message)}finally{setBusy(false)}}
  return <section className="v2-check-page"><div className="v2-step"><b>PREGUNTA DE CIERRE · {maxPoints} PUNTOS</b><span>Comprueba que entendiste la idea antes de revisar tu decisión.</span></div><h2>{r.checkQuestion}</h2><div className="v2-check-options">{(r.checkOptions||[]).map(([v,label])=><button type="button" key={v} className={answer===v?'selected':''} disabled={Boolean(result)} onClick={()=>setAnswer(v)}><b>{v.toUpperCase()}</b><span>{label}</span></button>)}</div>{err&&<div className="v2-alert error">{err}</div>}{!result?<button className="v2-primary wide" disabled={!answer||busy} onClick={submit}>{busy?'Enviando…':'Cerrar pregunta'}</button>:<><div className={`v2-check-result ${result.correct?'correct':'wrong'}`}><strong>{result.points}/{result.max_points} puntos</strong><span>{result.correct?'Correcto.':'No suma puntos esta vez; usa la revisión para corregir el razonamiento.'}</span></div><button className="v2-primary wide" onClick={onDone}>Continuar</button></>}</section>
}

function decisionText(round,payload={}){
  const template=V2_ROUNDS[round]?.template
  if(template==='cohort-selection')return (payload.selected||[]).join(', ')||'—'
  if(template==='single-choice')return optionsForRound(round).find(x=>x[0]===payload.choice)?.[1]||'—'
  if(template==='multi-select')return (payload.selected||[]).map(v=>optionsForRound(round).find(x=>x[0]===v)?.[1]||v).join(' · ')||'—'
  const choices=payload.choices||{}
  if(Object.keys(choices).length)return Object.entries(choices).map(([k,v])=>`${k}: ${POLICY_ACTIONS.find(x=>x[0]===v)?.[1]||v}`).join(' · ')
  return 'Priorizar: '+((payload.treat||[]).join(', ')||'ninguno')
}

function DecisionSummary({state}){
  const rows=state.team_revisions||[]
  if(!rows.length)return null
  return <section className="v2-proposals"><div className="v2-step compact"><b>ASÍ CAMBIÓ EL EQUIPO</b><span>Comparen qué cambió después de ejecutar el análisis.</span></div><div className="v2-proposal-grid">{rows.map(s=><article key={s.player_id}><b>{s.name}</b><p>{decisionText(state.game.round,s.payload)}</p></article>)}</div></section>
}

function ImpactBoard({teams=[],currentTeamId}){
  const rows=[...teams].filter(t=>Number(t.rounds_scored||0)>0).sort((a,b)=>Number(b.total_value_cop||0)-Number(a.total_value_cop||0))
  if(!rows.length)return null
  return <section className="v2-scoreboard-mini"><div className="v2-scoreboard-title"><Trophy size={18}/><b>IMPACTO ACADÉMICO</b><span>estudiantes adicionales con resultado favorable · estimación sintética</span></div><div className="v2-scoreboard-rows">{rows.map((t,i)=><div className={t.id===currentTeamId?'mine':''} key={t.id}><span className="rank">{i+1}</span><strong>{t.name}</strong><div/><b>{num(t.total_value_cop)}</b>{t.round_value_cop!==null&&t.round_value_cop!==undefined&&<em>+{num(t.round_value_cop)}</em>}</div>)}</div></section>
}

function Reveal({state}){
  const r=V2_ROUNDS[state.game.round],x=state.reveal||{}
  return <div className="v2-main v2-player-compact"><MissionStrip round={state.game.round}/><StudentProgress state={state}/><section className="v2-reveal compact"><div className="v2-kicker">REVEAL · LO QUE AHORA PUEDES NOMBRAR</div><h1>{r.takeaway}</h1><div className="v2-concept plain">{r.plainConcept}</div>{x.true_effect_points!=null&&<div className="v2-metrics academic-truth"><div><span>Efecto verdadero del simulador</span><strong>{num(x.true_effect_points)} puntos</strong></div>{x.estimated_effect_points!=null&&<div><span>Diferencia A/B observada</span><strong>{num(x.estimated_effect_points)} puntos</strong></div>}{x.ci95_low!=null&&x.ci95_high!=null&&<div><span>IC 95 %</span><strong>[{num(x.ci95_low)}, {num(x.ci95_high)}]</strong></div>}<p>Estos resultados pertenecen al simulador sintético, no a estudiantes reales.</p></div>}<section className="v2-wow"><div className="v2-wow-badge"><Sparkles size={16}/> WOW</div><strong>{r.wow}</strong><p>{r.reality}</p></section><div className="v2-teach"><div className="v2-kicker">NOMBRE TÉCNICO</div><h2>{r.concept}</h2><p>{r.takeaway}</p></div><Glossary round={state.game.round}/>{state.game.status==='finished'?<div className="v2-finished">Fin. Ahora debes poder separar predicción, identificación, estimación, heterogeneidad y decisión causal.</div>:<p className="v2-wait-note">Espera al facilitador para continuar.</p>}</section></div>
}

function RoundPlay({state,refresh,analysis}){
  const[busy,setBusy]=useState(false),[err,setErr]=useState('')
  const round=state.game.round,template=V2_ROUNDS[round]?.template
  const phase=state.progress?.phase||'initial'
  async function send(action,payload){setBusy(true);setErr('');try{await invoke('v2-submit',{action,round,payload});await refresh()}catch(e){setErr(e.message)}finally{setBusy(false)}}

  const chooser=(revision=false,team=false)=>{
    const props={round,state,busy,revision,team,onSend:p=>send(team?'team':revision?'revision':'individual',p)}
    if(template==='cohort-selection')return <CohortDecision {...props}/>
    if(template==='single-choice')return <SingleChoice {...props}/>
    if(template==='multi-select')return <MultiSelect {...props}/>
    return <PolicyChoice {...props}/>
  }

  let page=null
  if(phase==='initial')page=chooser(false,false)
  else if(phase==='wait_initial')page=<TeamProgress state={state}/>
  else if(phase==='lab')page=<><CausalExplainer round={round}/><EvidenceLab round={round} labKey={V2_ROUNDS[round]?.evidence} labPoints={state.progress?.challenge?.lab_points??V2_ROUNDS[round]?.points?.lab} state={state} analysis={analysis} onComplete={refresh}/><Glossary round={round}/></>
  else if(phase==='check')page=<CheckpointQuestion round={round} state={state} onDone={refresh}/>
  else if(phase==='revision')page=chooser(true,false)
  else if(phase==='wait_revision')page=<TeamProgress state={state} phase="revision"/>
  else if(phase==='team')page=<><DecisionSummary state={state}/>{chooser(false,true)}</>
  else page=<section className="v2-big-wait small"><Check size={44}/><h2>Decisión final registrada</h2><p>El puntaje final aparece cuando el facilitador muestre el resultado.</p></section>

  return <div className="v2-main v2-player-compact"><MissionStrip round={round}/><StudentProgress state={state}/><PhasePoints phase={phase} state={state} round={round}/>{err&&<div className="v2-alert error">{err}</div>}<section className="v2-single-step-page">{page}</section></div>
}

export default function V2Play(){
  const[joined,setJoined]=useState(Boolean(getPlayerToken()))
  const{state,error,refresh}=useV2State(joined)
  const analysis=useV2Analysis(state)
  const {quiz:finalQuiz}=useV2Quiz(state?.game?.code,'student',joined&&Boolean(state))
  useEffect(()=>{if(joined&&state&&['lobby','briefing','lesson'].includes(state.game?.status))prewarmPython()},[joined,state?.game?.status])
  function exit(){clearPlayerSession();setJoined(false);location.reload()}
  if(!joined)return <Join onJoined={()=>setJoined(true)}/>
  if(error&&!state)return <main className="v2-shell v2-center"><section className="v2-join-card"><div className="v2-kicker">MODO CONTINGENCIA</div><h1>La partida no responde</h1><p>Tu progreso no se ha reiniciado. Puedes reintentar sin salir. Si el servidor continúa sin responder, usa el simulador de práctica: funciona sin Supabase, pero no registra puntos ni reemplaza la partida competitiva.</p><div className="v2-alert error">{error}</div><button className="v2-primary wide" onClick={refresh}>Reintentar conexión</button><a className="v2-secondary wide" href="./v2-simulator.html">Abrir simulador de práctica</a><button className="v2-secondary wide" onClick={exit}>Cerrar sesión en este dispositivo</button></section></main>
  if(!state)return <main className="v2-shell v2-center"><div className="v2-loader">Conectando…</div></main>
  const inFinalBattle=finalQuiz?.quiz?.phase&&finalQuiz.quiz.phase!=='idle'
  const waiting=['lobby','briefing','lesson'].includes(state.game.status)
  const reveal=['reveal','teaching','microcheck','finished'].includes(state.game.status)
  return <div className="v2-shell"><Header state={state} onExit={exit}/><WorkshopBanner state={finalQuiz}/>{inFinalBattle?<QuizPlayer data={finalQuiz}/>:<>{waiting&&<Lobby state={state}/>} {state.game.status==='round'&&<RoundPlay state={state} refresh={refresh} analysis={analysis}/>} {state.game.status==='paused'&&<div className="v2-main"><MissionStrip round={state.game.round}/><section className="v2-big-wait"><h2>Misión pausada</h2><p>Conserven su discusión; el facilitador la reanudará.</p></section></div>} {state.game.status==='closed'&&<div className="v2-main v2-player-compact"><MissionStrip round={state.game.round}/><section className="v2-big-wait small"><h2>Decisiones cerradas</h2><p>El resultado y el puntaje final se mostrarán al revelar.</p></section></div>} {reveal&&<Reveal state={state}/>}</>}<footer className="v2-footer"><span>{statusCopy(state.game.status)}</span><span>{state.player.team} · {state.player.name}</span></footer></div>
}
