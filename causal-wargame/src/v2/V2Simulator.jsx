import React,{useMemo,useState}from'react'
import{ArrowLeft,ArrowRight,Check,Eye,GitBranch,GraduationCap,RefreshCw,Sparkles,Users}from'lucide-react'
import{V2_MISSION,V2_ROUNDS,V2_CHALLENGE_COUNT,RECOMMENDATIONS,POLICY_ACTIONS}from'./content'
import{enabledChallenges}from'./challenge-registry'
import{EvidenceLab,PolicyMeter,RevealVisuals}from'./VisualTools'
import{
  SIM_PLAYERS,SIM_ECONOMY,SIM_CUSTOMERS,SIM_SEGMENTS,SIM_ANALYSIS,SIM_PATHS,
  SIM_TEAM_DECISIONS,SIM_REVEALS,SIM_TEAM_POINTS
}from'./simulator-fixtures'

const pct=n=>`${Math.round(Number(n||0)*100)}%`
const cop=n=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(n||0))
const copShort=n=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',notation:'compact',maximumFractionDigits:1}).format(Number(n||0))
const profileOf=round=>Number(V2_ROUNDS[round]?.profileRound||Math.min(Number(round)||1,3))
const simPath=(studentId,round)=>SIM_PATHS[studentId]?.[round]||SIM_PATHS[studentId]?.[profileOf(round)]
const pointsOf=round=>V2_ROUNDS[round]?.points||{lab:20,check:30,revision:20,team:30}
const pathScore=(studentId,round,kind)=>{
  if(kind!=='check')return 0
  return Number(simPath(studentId,round)?.checkPoints||0)>0?Number(pointsOf(round).check||30):0
}
const teamScore=round=>{
  const profile=profileOf(round)
  const raw=Number(SIM_TEAM_POINTS[round]??SIM_TEAM_POINTS[profile]??0)
  return Math.round(raw/30*Number(pointsOf(round).team||30))
}
const maxScore=round=>Object.values(pointsOf(round)).reduce((a,b)=>a+Number(b||0),0)

function decisionText(round,payload={}){
  const profile=profileOf(round)
  if(profile===1)return (payload.selected||[]).join(', ')||'—'
  if(profile===2)return RECOMMENDATIONS.find(x=>x[0]===payload.recommendation)?.[1]||'—'
  const choices=payload.choices||{}
  if(Object.keys(choices).length)return Object.entries(choices).map(([k,v])=>`${k}: ${POLICY_ACTIONS.find(x=>x[0]===v)?.[1]||v}`).join(' · ')
  return 'Ofrecer: '+((payload.treat||[]).join(', ')||'ninguno')
}

function StudentCards({round,answer}){
  const profile=profileOf(round)
  if(profile===1){
    const selected=answer?.selected||[]
    return <div className="v2-grid customers compact">{SIM_CUSTOMERS.slice(0,8).map(c=><article className={'v2-customer '+(selected.includes(c.id)?'selected':'')} key={c.id}><div className="v2-card-top"><span>{c.id}</span>{selected.includes(c.id)&&<Check size={16}/>}</div><h3>{c.name}</h3><small>{c.segment}</small><div className="v2-score">{pct(c.score)}</div><small>probabilidad estimada de renovación</small></article>)}</div>
  }
  if(profile===2){
    return <div className="v2-choice-row">{RECOMMENDATIONS.map(([v,l])=><button type="button" className={answer?.recommendation===v?'selected':''} key={v}>{l}</button>)}</div>
  }
  const choices=answer?.choices||{}
  return <div className="v2-segments">{SIM_SEGMENTS.map(s=><article key={s.id}><div><h3>{s.name}</h3><small>{s.audience.toLocaleString()} clientes</small></div><div><b>{cop(s.value)}</b><small>valor renovación</small></div><select value={choices[s.id]||'observe'} readOnly disabled>{POLICY_ACTIONS.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></article>)}</div>
}

function TeamDecision({round}){
  const profile=profileOf(round)
  const payload=SIM_TEAM_DECISIONS[round]||SIM_TEAM_DECISIONS[profile]
  if(profile===1)return <div className="v2-grid customers compact">{SIM_CUSTOMERS.map(c=><article className={'v2-customer '+(payload.selected.includes(c.id)?'selected':'')} key={c.id}><div className="v2-card-top"><span>{c.id}</span>{payload.selected.includes(c.id)&&<Check size={15}/>}</div><h3>{c.name}</h3><div className="v2-score">{pct(c.score)}</div><small>probabilidad estimada</small></article>)}</div>
  if(profile===2)return <div className="v2-choice-row">{RECOMMENDATIONS.map(([v,l])=><button type="button" className={payload.recommendation===v?'selected':''} key={v}>{l}</button>)}</div>
  const choices=Object.fromEntries([
    ...(payload.treat||[]).map(x=>[x,'treat']),
    ...(payload.avoid||[]).map(x=>[x,'avoid']),
    ...(payload.observe||[]).map(x=>[x,'observe'])
  ])
  return <><PolicyMeter segments={SIM_SEGMENTS} choices={choices} capacity={SIM_ECONOMY.capacity}/><StudentCards round={round} answer={{choices}}/></>
}

function TeamComparison({round}){
  return <div className="v2-journey-compare">{SIM_PLAYERS.map(p=>{
    const path=simPath(p.id,round)
    const changed=JSON.stringify(path.initial)!==JSON.stringify(path.revision)
    return <article key={p.id}><div><strong>{p.name}</strong><span className={changed?'changed':'same'}>{changed?'cambió':'mantuvo'}</span></div><small>Antes</small><p>{decisionText(round,path.initial)}</p><small>Después</small><p>{decisionText(round,path.revision)}</p><em>{path.noteRevision}</em></article>
  })}</div>
}

function JourneyTimeline({journey,index,onSelect}){
  return <div className="v2-journey-timeline">{journey.map((p,i)=><button type="button" key={p.id} className={i<index?'done':i===index?'active':''} onClick={()=>onSelect(i)}><b>{i+1}</b><span>{p.label}</span></button>)}</div>
}

function RevealPanel({round,state}){
  const r=V2_ROUNDS[round],profile=profileOf(round),result=SIM_REVEALS[round]||SIM_REVEALS[profile]
  return <div className="v2-reveal compact">
    <div className="v2-kicker">REVEAL · AHORA SÍ APARECE LO OCULTO</div>
    {profile===1&&<div className="v2-result money"><b>Valor incremental de la decisión del equipo</b><strong>{cop(result.incremental_value_cop)}</strong><span>Mejor valor posible: {cop(result.best_possible_value_cop)} · brecha {cop(result.value_gap_cop)}</span></div>}
    {profile===2&&<div className="v2-metrics"><div><span>Efecto real del mundo simulado</span><strong>+{result.true_effect_pp} pp</strong></div><div><span>Valor potencial</span><strong>{cop(result.campaign_potential_value_cop)}</strong></div></div>}
    {profile===3&&<div className="v2-result money"><b>Valor incremental de la política</b><strong>{cop(result.incremental_value_cop)}</strong><span>{result.treated_audience.toLocaleString()} de {result.capacity.toLocaleString()} clientes de capacidad</span></div>}
    <section className="v2-wow"><div className="v2-wow-badge"><Sparkles size={16}/> GIRO</div><strong>{r.wow}</strong><p>{r.takeaway}</p></section>
    <RevealVisuals round={round} profileRound={profile} state={state} analysis={SIM_ANALYSIS[round]||SIM_ANALYSIS[profile]}/>
  </div>
}

function StudentStage({round,phase,student,state}){
  const r=V2_ROUNDS[round]
  const path=simPath(student.id,round)
  if(phase.id==='brief')return <section className="v2-journey-stage"><div className="v2-kicker">{r.kicker}</div><h1>{r.title}</h1><p className="v2-lead">{r.case}</p><div className="v2-question-card"><small>PREGUNTA DEL RETO</small><strong>{r.question}</strong></div><div className="v2-alert">Aquí todavía no aparece ningún término técnico. {student.name} sólo necesita entender la decisión.</div></section>

  if(phase.id==='initial')return <section className="v2-journey-stage"><div className="v2-step"><b>DECIDE CON LO QUE SABES</b><span>{r.individual}</span></div><StudentCards round={round} answer={path.initial}/><div className="v2-sim-decision-note"><b>{student.name} piensa:</b> “{path.noteInitial}”</div><button className="v2-primary wide">Enviar decisión inicial</button></section>

  if(phase.id==='wait_initial')return <section className="v2-journey-stage"><div className="v2-step"><b>ESPERA AL EQUIPO</b><span>El laboratorio se abre cuando todos han tomado una primera decisión.</span></div><div className="v2-team-roster">{SIM_PLAYERS.map(p=><div className="ready" key={p.id}><span>✓</span>{p.name}</div>)}</div><div className="v2-alert"><Users size={18}/><span>4/4 decisiones iniciales. Ahora se desbloquea la evidencia.</span></div></section>

  if(phase.id==='lab')return <section className="v2-journey-stage"><div className="v2-step"><b>PRUEBA TU IDEA CON DATOS</b><span>Todo el laboratorio está visible en una sola página.</span></div><EvidenceLab round={round} labKey={r.evidence} labPoints={pointsOf(round).lab} state={state} analysis={SIM_ANALYSIS[round]||SIM_ANALYSIS[profileOf(round)]} simulation/><div className="v2-alert"><span>Al terminar todos los bloques, {student.name} recibe <b>+{pointsOf(round).lab} puntos</b>.</span></div></section>

  if(phase.id==='check')return <section className="v2-journey-stage"><div className="v2-step"><b>PREGUNTA DE CIERRE · {pointsOf(round).check} PUNTOS</b><span>Una comprobación corta antes de revisar la decisión.</span></div><h2>{r.checkQuestion}</h2><div className="v2-check-options">{(r.checkOptions||[]).map(([v,label])=><button type="button" className={path.checkAnswer===v?'selected':''} key={v}><b>{v.toUpperCase()}</b><span>{label}</span></button>)}</div><div className={`v2-check-result ${path.checkPoints?'correct':'wrong'}`}><strong>{pathScore(student.id,round,'check')}/{pointsOf(round).check} puntos</strong><span>{path.checkPoints?'Respuesta correcta.':'No sumó puntos en esta pregunta.'}</span></div></section>

  if(phase.id==='revision')return <section className="v2-journey-stage"><div className="v2-step"><b>¿CAMBIAS TU DECISIÓN?</b><span>{r.revise}</span></div><StudentCards round={round} answer={path.revision}/><div className="v2-sim-decision-note changed"><b>{student.name} ahora piensa:</b> “{path.noteRevision}”</div><button className="v2-primary wide">Guardar decisión revisada · +{pointsOf(round).revision} puntos</button></section>

  if(phase.id==='wait_revision')return <section className="v2-journey-stage"><div className="v2-step"><b>ESPERA AL EQUIPO</b><span>Todos deben revisar antes de construir la decisión final.</span></div><div className="v2-team-roster">{SIM_PLAYERS.map(p=><div className="ready" key={p.id}><span>✓</span>{p.name}</div>)}</div><div className="v2-alert"><span>4/4 revisiones. Ya pueden decidir juntos.</span></div></section>

  if(phase.id==='compare')return <section className="v2-journey-stage"><div className="v2-step"><b>¿QUÉ CAMBIÓ EN EL EQUIPO?</b><span>El estudiante ve decisiones iniciales y revisadas, no sólo una respuesta final.</span></div><TeamComparison round={round}/></section>

  if(phase.id==='team')return <section className="v2-journey-stage"><div className="v2-step"><b>DECIDAN JUNTOS</b><span>{r.team}</span></div><TeamDecision round={round}/><button className="v2-primary wide">Bloquear decisión del equipo</button><div className="v2-alert"><span>El puntaje del equipo se mantiene oculto hasta el resultado.</span></div></section>

  if(phase.id==='reveal')return <section className="v2-journey-stage"><div className="v2-result"><b>Puntaje del equipo</b><strong>+{teamScore(round)} pts</strong><span>Todos los integrantes reciben el mismo puntaje de decisión final.</span></div><RevealPanel round={round} state={state}/></section>

  return <section className="v2-journey-stage"><div className="v2-kicker">LO QUE EL ESTUDIANTE DEBERÍA PODER DECIR</div><h2>{r.plainConcept}</h2><p className="v2-lead">{r.takeaway}</p><div className="v2-concept-ladder"><div><small>Primero, en palabras simples</small><strong>{r.plainConcept}</strong></div><ArrowRight size={22}/><div><small>Después se nombra</small><strong>{r.concept}</strong></div></div></section>
}

function TeacherMap({round,onStudent}){
  const r=V2_ROUNDS[round]
  return <section className="v2-panel"><div className="v2-kicker">MAPA DOCENTE · RETO {round}</div><h2>Qué recorrido hizo cada estudiante</h2><p>Esta vista hace visible el cambio de razonamiento individual. Selecciona un nombre para entrar a su recorrido completo.</p><div className="v2-path-table"><div className="head"><span>Estudiante</span><span>Inicial</span><span>Después de datos</span><span>Cambio</span><span>Idea que se lleva</span></div>{SIM_PLAYERS.map(p=>{const path=simPath(p.id,round);const changed=JSON.stringify(path.initial)!==JSON.stringify(path.revision);return <button type="button" className="row" key={p.id} onClick={()=>onStudent(p.id)}><strong>{p.name}</strong><span>{decisionText(round,path.initial)}</span><span>{decisionText(round,path.revision)}</span><b className={changed?'changed':'same'}>{changed?'Sí':'No'}</b><em>{path.noteRevision}</em></button>})}</div><div className="v2-alert hint"><GraduationCap size={18}/><span><b>Objetivo docente:</b> no medir sólo si acertaron; observar si la evidencia cambió el criterio con el que decidían.</span></div><div className="v2-concept-ladder"><div><small>Idea cotidiana</small><strong>{r.plainConcept}</strong></div><ArrowRight size={22}/><div><small>Nombre técnico posterior</small><strong>{r.concept}</strong></div></div></section>
}

function AdaptabilityPanel(){
  const challenges=enabledChallenges()
  return <section className="v2-panel v2-adapt-panel"><div className="v2-kicker">ARQUITECTURA ADAPTABLE</div><h2>Los retos ya no están definidos por una pantalla distinta.</h2><p>Todos usan el mismo recorrido estándar. Para agregar otro reto se describe su manifest: contexto, decisión inicial, laboratorio, revisión, decisión de equipo, reveal y concepto.</p><div className="v2-adapt-flow">{challenges.map(c=><article key={c.id}><b>{c.order}</b><div><strong>{c.title}</strong><span>{c.template} · perfil {c.profileRound} · lab: {c.labKey} · {c.timeMinutes} min</span></div></article>)}</div><div className="v2-alert"><GitBranch size={18}/><span>Agregar un reto existente del mismo tipo requiere principalmente configuración. Un tipo de decisión o análisis completamente nuevo requiere un adapter, pero no reescribir el simulador.</span></div></section>
}

export default function V2Simulator(){
  const challenges=enabledChallenges()
  const[view,setView]=useState('student')
  const[studentId,setStudentId]=useState('ana')
  const[round,setRound]=useState(1)
  const[phaseIndex,setPhaseIndex]=useState(0)
  const[teacherNotes,setTeacherNotes]=useState(true)

  const student=SIM_PLAYERS.find(p=>p.id===studentId)||SIM_PLAYERS[0]
  const challenge=challenges[round-1]
  const journey=challenge?.journey||[]
  const phase=journey[Math.min(phaseIndex,journey.length-1)]||journey[0]
  const profile=profileOf(round)
  const teamPool=profile===3?SIM_SEGMENTS:SIM_CUSTOMERS
  const state=useMemo(()=>({
    team_pool:teamPool,
    economy:SIM_ECONOMY,
    team_decision:{
      payload:SIM_TEAM_DECISIONS[round]||SIM_TEAM_DECISIONS[profile],
      result:SIM_REVEALS[round]||SIM_REVEALS[profile]
    }
  }),[round,profile])

  function setChallenge(n){setRound(n);setPhaseIndex(0)}
  function next(){
    if(phaseIndex<journey.length-1)setPhaseIndex(i=>i+1)
    else if(round<V2_CHALLENGE_COUNT){setRound(r=>r+1);setPhaseIndex(0)}
  }
  function prev(){
    if(phaseIndex>0)setPhaseIndex(i=>i-1)
    else if(round>1){const previous=challenges[round-2]?.journey||[];setRound(r=>r-1);setPhaseIndex(Math.max(0,previous.length-1))}
  }
  function reset(){setStudentId('ana');setRound(1);setPhaseIndex(0);setView('student')}

  return <main className="v2-shell"><div className="v2-fac v2-simulator-journey">
    <div className="v2-wall-top"><div><div className="v2-brand">DOS FUTUROS <span>SIMULADOR DOCENTE</span></div><div className="v2-kicker">RECORRIDO COMPLETO · SIN BACKEND</div></div><button className="v2-secondary" onClick={reset}><RefreshCw size={15}/> Reiniciar recorrido</button></div>

    <section className="v2-panel" style={{marginTop:18}}>
      <h2>{V2_MISSION.title}</h2><p>{V2_MISSION.subtitle}</p>
      <div className="v2-sim-toolbar">
        <div className="v2-sim-tabs"><button className={view==='student'?'active':''} onClick={()=>setView('student')}><Eye size={15}/> Experiencia de un estudiante</button><button className={view==='team'?'active':''} onClick={()=>setView('team')}><Users size={15}/> Camino de cada estudiante</button><button className={view==='adapt'?'active':''} onClick={()=>setView('adapt')}><GitBranch size={15}/> Cómo agregar retos</button></div>
        <label className="v2-sim-note-toggle"><input type="checkbox" checked={teacherNotes} onChange={e=>setTeacherNotes(e.target.checked)}/> guía docente</label>
      </div>
    </section>

    {view==='adapt'?<AdaptabilityPanel/>:<>
      <div className="v2-sim-tabs v2-student-tabs">{SIM_PLAYERS.map(p=><button key={p.id} className={studentId===p.id?'active':''} onClick={()=>{setStudentId(p.id);setView('student')}}>{p.name}</button>)}</div>
      <div className="v2-sim-tabs v2-challenge-tabs">{challenges.map((c,i)=><button key={c.id} className={round===i+1?'active':''} onClick={()=>setChallenge(i+1)}>Reto {i+1} · {c.title}</button>)}</div>

      {view==='team'?<TeacherMap round={round} onStudent={id=>{setStudentId(id);setView('student');setPhaseIndex(0)}}/>:
      <>
        <JourneyTimeline journey={journey} index={phaseIndex} onSelect={setPhaseIndex}/>
        <div className="v2-student-sim-frame">
          <header><div><span>Simulando a</span><strong>{student.name}</strong></div><div><span>Reto {round}/{V2_CHALLENGE_COUNT}</span><strong>{challenge.title}</strong></div><div><span>Puntaje visible</span><strong>{phase.id==='brief'||phase.id==='initial'||phase.id==='wait_initial'?0:phase.id==='lab'?pointsOf(round).lab:phase.id==='check'?Number(pointsOf(round).lab)+pathScore(studentId,round,'check'):phase.id==='revision'||phase.id==='wait_revision'||phase.id==='team'?Number(pointsOf(round).lab)+Number(pointsOf(round).revision)+pathScore(studentId,round,'check'):Number(pointsOf(round).lab)+Number(pointsOf(round).revision)+pathScore(studentId,round,'check')+teamScore(round)}/{maxScore(round)}</strong></div></header>
          <StudentStage round={round} phase={phase} student={student} state={state}/>
        </div>

        {teacherNotes&&<aside className="v2-teacher-note"><GraduationCap size={20}/><div><b>Qué está observando el docente aquí</b><p>{phase.student}</p><small>Fase técnica: <code>{phase.id}</code> · el mismo contrato de fase se reutiliza en todos los retos.</small></div></aside>}

        <div className="v2-sim-navigation"><button className="v2-secondary" disabled={round===1&&phaseIndex===0} onClick={prev}><ArrowLeft size={16}/> Anterior</button><span>{phaseIndex+1}/{journey.length} · recorrido de {student.name}</span><button className="v2-primary" disabled={round===V2_CHALLENGE_COUNT&&phaseIndex===journey.length-1} onClick={next}>{phaseIndex===journey.length-1&&round<V2_CHALLENGE_COUNT?'Siguiente reto':'Siguiente paso'} <ArrowRight size={16}/></button></div>
      </>}
    </>}
  </div></main>
}
