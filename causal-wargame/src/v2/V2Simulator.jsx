import React,{useMemo,useState}from'react'
import{ArrowLeft,ArrowRight,Check,Eye,GitBranch,GraduationCap,RefreshCw,Sparkles,Users}from'lucide-react'
import{V2_MISSION,V2_ROUNDS,V2_CHALLENGE_COUNT,POLICY_ACTIONS,optionsForRound}from'./content'
import{enabledChallenges}from'./challenge-registry'
import{EvidenceLab,PolicyMeter}from'./VisualTools'
import{SIM_PLAYERS,SIM_ECONOMY,SIM_CUSTOMERS,SIM_SEGMENTS,SIM_ANALYSIS,SIM_PATHS,SIM_TEAM_DECISIONS,SIM_REVEALS,SIM_TEAM_POINTS}from'./simulator-fixtures'

const pct=n=>`${Math.round(Number(n||0)*100)}%`
const profileOf=round=>Number(V2_ROUNDS[round]?.profileRound||1)
const simPath=(studentId,round)=>SIM_PATHS[studentId]?.[round]
const pointsOf=round=>V2_ROUNDS[round]?.points||{lab:20,check:30,revision:20,team:30}
const teamScore=round=>Number(SIM_TEAM_POINTS[round]||0)
const maxScore=round=>Object.values(pointsOf(round)).reduce((a,b)=>a+Number(b||0),0)
const pathScore=(studentId,round)=>Number(simPath(studentId,round)?.checkPoints||0)>0?Number(pointsOf(round).check||30):0

function decisionText(round,payload={}){
  const template=V2_ROUNDS[round]?.template
  if(template==='cohort-selection')return (payload.selected||[]).join(', ')||'—'
  if(template==='single-choice')return optionsForRound(round).find(x=>x[0]===payload.choice)?.[1]||'—'
  if(template==='multi-select')return (payload.selected||[]).map(v=>optionsForRound(round).find(x=>x[0]===v)?.[1]||v).join(' · ')||'—'
  const choices=payload.choices||{}
  if(Object.keys(choices).length)return Object.entries(choices).map(([k,v])=>`${k}: ${POLICY_ACTIONS.find(x=>x[0]===v)?.[1]||v}`).join(' · ')
  return 'Priorizar: '+((payload.treat||[]).join(', ')||'ninguno')
}

function ChoicePreview({round,answer={}}){
  const template=V2_ROUNDS[round]?.template
  if(template==='cohort-selection'){
    const selected=answer.selected||[]
    return <div className="v2-grid customers compact">{SIM_CUSTOMERS.slice(0,12).map(c=><article className={'v2-customer '+(selected.includes(c.id)?'selected':'')} key={c.id}><div className="v2-card-top"><span>{c.id}</span>{selected.includes(c.id)&&<Check size={16}/>}</div><h3>{c.name}</h3><small>{c.segment}</small><div className="v2-score">{pct(c.score)}</div><small>probabilidad estimada de aprobar</small></article>)}</div>
  }
  if(template==='single-choice')return <div className="v2-check-options">{optionsForRound(round).map(([v,l])=><button type="button" className={answer.choice===v?'selected':''} key={v}><span>{l}</span></button>)}</div>
  if(template==='multi-select')return <div className="v2-check-options">{optionsForRound(round).map(([v,l])=><button type="button" className={(answer.selected||[]).includes(v)?'selected':''} key={v}><b>{(answer.selected||[]).includes(v)?'✓':'+'}</b><span>{l}</span></button>)}</div>
  const choices=answer.choices||Object.fromEntries([...(answer.treat||[]).map(x=>[x,'treat']),...(answer.avoid||[]).map(x=>[x,'avoid']),...(answer.observe||[]).map(x=>[x,'observe'])])
  return <><PolicyMeter segments={SIM_SEGMENTS} choices={choices} capacity={SIM_ECONOMY.capacity}/><div className="v2-segments">{SIM_SEGMENTS.map(s=><article key={s.id}><div><h3>{s.name}</h3><small>{s.audience.toLocaleString()} estudiantes</small></div><div><b>{s.effect_pp>0?'+':''}{s.effect_pp} pp</b><small>efecto sintético oculto durante el juego real</small></div><select value={choices[s.id]||'observe'} readOnly disabled>{POLICY_ACTIONS.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></article>)}</div></>
}

function Glossary({round}){
  const rows=V2_ROUNDS[round]?.glossary||[]
  return <div className="v2-glossary-grid">{rows.map(x=><article key={x.term}><strong>{x.term}</strong><b>{x.full}</b><p>{x.definition}</p></article>)}</div>
}

function TeamComparison({round}){
  return <div className="v2-journey-compare">{SIM_PLAYERS.map(p=>{const path=simPath(p.id,round),changed=JSON.stringify(path.initial)!==JSON.stringify(path.revision);return <article key={p.id}><div><strong>{p.name}</strong><span className={changed?'changed':'same'}>{changed?'cambió':'mantuvo'}</span></div><small>Antes</small><p>{decisionText(round,path.initial)}</p><small>Después</small><p>{decisionText(round,path.revision)}</p><em>{path.noteRevision}</em></article>})}</div>
}

function JourneyTimeline({journey,index,onSelect}){
  return <div className="v2-journey-timeline">{journey.map((p,i)=><button type="button" key={p.id} className={i<index?'done':i===index?'active':''} onClick={()=>onSelect(i)}><b>{i+1}</b><span>{p.label}</span></button>)}</div>
}

function RevealPanel({round}){
  const r=V2_ROUNDS[round],result=SIM_REVEALS[round]||{}
  return <div className="v2-reveal compact"><div className="v2-kicker">REVEAL · AHORA SÍ NOMBRAMOS LO APRENDIDO</div>{result.impact_students!==undefined&&<div className="v2-result money"><b>Impacto académico esperado</b><strong>{result.impact_students} estudiantes</strong><span>Mundo sintético para comparar decisiones.</span></div>}{result.true_effect_points!==undefined&&<div className="v2-result"><b>Efecto verdadero del simulador</b><strong>+{result.true_effect_points} puntos</strong></div>}<section className="v2-wow"><div className="v2-wow-badge"><Sparkles size={16}/> WOW</div><strong>{r.wow}</strong><p>{r.takeaway}</p></section><div className="v2-kicker">NOMBRE TÉCNICO</div><h2>{r.concept}</h2><Glossary round={round}/></div>
}

function StudentStage({round,phase,student,state}){
  const r=V2_ROUNDS[round],path=simPath(student.id,round)
  if(phase.id==='brief')return <section className="v2-journey-stage"><div className="v2-kicker">{r.kicker}</div><h1>{r.title}</h1><p className="v2-lead">{r.case}</p><div className="v2-question-card"><small>PREGUNTA DE LA MISIÓN</small><strong>{r.question}</strong></div><div className="v2-alert">Todavía no se presenta la jerga técnica: primero aparece el problema que debe resolver.</div></section>
  if(phase.id==='initial')return <section className="v2-journey-stage"><div className="v2-step"><b>DECIDE CON LO QUE SABES</b><span>{r.individual}</span></div><ChoicePreview round={round} answer={path.initial}/><div className="v2-sim-decision-note"><b>{student.name} piensa:</b> “{path.noteInitial}”</div></section>
  if(phase.id==='wait_initial')return <section className="v2-journey-stage"><div className="v2-step"><b>ESPERA AL EQUIPO</b><span>El laboratorio se abre al completar las decisiones iniciales.</span></div><div className="v2-team-roster">{SIM_PLAYERS.map(p=><div className="ready" key={p.id}><span>✓</span>{p.name}</div>)}</div></section>
  if(phase.id==='lab')return <section className="v2-journey-stage"><div className="v2-step"><b>PRUEBA TU IDEA CON PYTHON</b><span>{r.takeaway}</span></div><EvidenceLab round={round} labKey={r.evidence} labPoints={pointsOf(round).lab} state={state} analysis={SIM_ANALYSIS[profileOf(round)]} simulation/></section>
  if(phase.id==='check')return <section className="v2-journey-stage"><div className="v2-step"><b>PREGUNTA DE CIERRE · {pointsOf(round).check} PUNTOS</b><span>Comprueba la idea, no memoria de siglas.</span></div><h2>{r.checkQuestion}</h2><div className="v2-check-options">{r.checkOptions.map(([v,label])=><button type="button" className={path.checkAnswer===v?'selected':''} key={v}><b>{v.toUpperCase()}</b><span>{label}</span></button>)}</div><div className="v2-check-result correct"><strong>{pathScore(student.id,round)}/{pointsOf(round).check} puntos</strong></div></section>
  if(phase.id==='revision')return <section className="v2-journey-stage"><div className="v2-step"><b>¿CAMBIAS TU DECISIÓN?</b><span>{r.revise}</span></div><ChoicePreview round={round} answer={path.revision}/><div className="v2-sim-decision-note changed"><b>{student.name} ahora piensa:</b> “{path.noteRevision}”</div></section>
  if(phase.id==='wait_revision')return <section className="v2-journey-stage"><div className="v2-step"><b>ESPERA AL EQUIPO</b><span>4/4 revisiones. Ya pueden decidir juntos.</span></div></section>
  if(phase.id==='compare')return <section className="v2-journey-stage"><div className="v2-step"><b>¿QUÉ CAMBIÓ?</b><span>La evidencia de aprendizaje es el cambio de criterio.</span></div><TeamComparison round={round}/></section>
  if(phase.id==='team')return <section className="v2-journey-stage"><div className="v2-step"><b>DECIDAN JUNTOS</b><span>{r.team}</span></div><ChoicePreview round={round} answer={SIM_TEAM_DECISIONS[round]}/></section>
  if(phase.id==='reveal')return <section className="v2-journey-stage"><div className="v2-result"><b>Puntaje de equipo</b><strong>+{teamScore(round)} pts</strong></div><RevealPanel round={round}/></section>
  return <section className="v2-journey-stage"><div className="v2-kicker">LO QUE EL ESTUDIANTE DEBERÍA PODER DECIR</div><h2>{r.plainConcept}</h2><div className="v2-concept-ladder"><div><small>Primero, en palabras simples</small><strong>{r.plainConcept}</strong></div><ArrowRight size={22}/><div><small>Después se nombra</small><strong>{r.concept}</strong></div></div><Glossary round={round}/></section>
}

function TeacherMap({round,onStudent}){
  const r=V2_ROUNDS[round]
  return <section className="v2-panel"><div className="v2-kicker">MAPA DOCENTE · MISIÓN {round}</div><h2>Qué cambió en el razonamiento</h2><div className="v2-path-table"><div className="head"><span>Estudiante</span><span>Inicial</span><span>Después</span><span>Cambio</span><span>Idea</span></div>{SIM_PLAYERS.map(p=>{const path=simPath(p.id,round),changed=JSON.stringify(path.initial)!==JSON.stringify(path.revision);return <button type="button" className="row" key={p.id} onClick={()=>onStudent(p.id)}><strong>{p.name}</strong><span>{decisionText(round,path.initial)}</span><span>{decisionText(round,path.revision)}</span><b className={changed?'changed':'same'}>{changed?'Sí':'No'}</b><em>{path.noteRevision}</em></button>})}</div><div className="v2-alert hint"><GraduationCap size={18}/><span><b>Objetivo:</b> observar si los datos cambiaron el criterio, no sólo si memorizaron el término.</span></div><div className="v2-concept-ladder"><div><small>Idea cotidiana</small><strong>{r.plainConcept}</strong></div><ArrowRight size={22}/><div><small>Nombre técnico</small><strong>{r.concept}</strong></div></div></section>
}

function AdaptabilityPanel(){
  const challenges=enabledChallenges()
  return <section className="v2-panel v2-adapt-panel"><div className="v2-kicker">ARQUITECTURA ADAPTABLE</div><h2>6 misiones, 3 perfiles de datos reutilizables.</h2><p>El perfil define los datos. El template define la interacción. El labKey define el análisis Python.</p><div className="v2-adapt-flow">{challenges.map(c=><article key={c.id}><b>{c.order}</b><div><strong>{c.title}</strong><span>{c.template} · datos {c.profileRound} · lab {c.labKey} · {c.timeMinutes} min</span></div></article>)}</div><div className="v2-alert"><GitBranch size={18}/><span>Agregar otra misión del mismo tipo es principalmente configuración; no requiere crear otra aplicación.</span></div></section>
}

export default function V2Simulator(){
  const challenges=enabledChallenges()
  const[view,setView]=useState('student'),[studentId,setStudentId]=useState('ana'),[round,setRound]=useState(1),[phaseIndex,setPhaseIndex]=useState(0),[teacherNotes,setTeacherNotes]=useState(true)
  const student=SIM_PLAYERS.find(p=>p.id===studentId)||SIM_PLAYERS[0],challenge=challenges[round-1],journey=challenge?.journey||[],phase=journey[Math.min(phaseIndex,journey.length-1)]||journey[0]
  const template=V2_ROUNDS[round]?.template
  const teamPool=template==='segment-policy'?SIM_SEGMENTS:template==='cohort-selection'?SIM_CUSTOMERS:[]
  const state=useMemo(()=>({team_pool:teamPool,economy:SIM_ECONOMY,team_decision:{payload:SIM_TEAM_DECISIONS[round],result:SIM_REVEALS[round]}}),[round,template])
  const next=()=>phaseIndex<journey.length-1?setPhaseIndex(i=>i+1):round<V2_CHALLENGE_COUNT&&(setRound(r=>r+1),setPhaseIndex(0))
  const prev=()=>phaseIndex>0?setPhaseIndex(i=>i-1):round>1&&(setRound(r=>r-1),setPhaseIndex((challenges[round-2]?.journey||[]).length-1))
  const reset=()=>{setStudentId('ana');setRound(1);setPhaseIndex(0);setView('student')}

  return <main className="v2-shell"><div className="v2-fac v2-simulator-journey"><div className="v2-wall-top"><div><div className="v2-brand">DOS FUTUROS <span>CAMPUS · SIMULADOR DOCENTE</span></div><div className="v2-kicker">RECORRIDO COMPLETO · SIN BACKEND</div></div><button className="v2-secondary" onClick={reset}><RefreshCw size={15}/> Reiniciar recorrido</button></div><section className="v2-panel" style={{marginTop:18}}><h2>{V2_MISSION.title}</h2><p>{V2_MISSION.subtitle}</p><div className="v2-sim-toolbar"><div className="v2-sim-tabs"><button className={view==='student'?'active':''} onClick={()=>setView('student')}><Eye size={15}/> Experiencia de un estudiante</button><button className={view==='team'?'active':''} onClick={()=>setView('team')}><Users size={15}/> Camino de cada estudiante</button><button className={view==='adapt'?'active':''} onClick={()=>setView('adapt')}><GitBranch size={15}/> Cómo agregar retos</button></div><label className="v2-sim-note-toggle"><input type="checkbox" checked={teacherNotes} onChange={e=>setTeacherNotes(e.target.checked)}/> guía docente</label></div></section>
  {view==='adapt'?<AdaptabilityPanel/>:<><div className="v2-sim-tabs v2-student-tabs">{SIM_PLAYERS.map(p=><button key={p.id} className={studentId===p.id?'active':''} onClick={()=>{setStudentId(p.id);setView('student')}}>{p.name}</button>)}</div><div className="v2-sim-tabs v2-challenge-tabs">{challenges.map((c,i)=><button key={c.id} className={round===i+1?'active':''} onClick={()=>{setRound(i+1);setPhaseIndex(0)}}>Misión {i+1} · {c.title}</button>)}</div>{view==='team'?<TeacherMap round={round} onStudent={id=>{setStudentId(id);setView('student');setPhaseIndex(0)}}/:<><JourneyTimeline journey={journey} index={phaseIndex} onSelect={setPhaseIndex}/><div className="v2-student-sim-frame"><header><div><span>Simulando a</span><strong>{student.name}</strong></div><div><span>Misión {round}/{V2_CHALLENGE_COUNT}</span><strong>{challenge.title}</strong></div><div><span>Puntaje visible</span><strong>{phase.id==='brief'||phase.id==='initial'||phase.id==='wait_initial'?0:phase.id==='lab'?pointsOf(round).lab:phase.id==='check'?Number(pointsOf(round).lab)+pathScore(studentId,round):phase.id==='revision'||phase.id==='wait_revision'||phase.id==='team'?Number(pointsOf(round).lab)+Number(pointsOf(round).revision)+pathScore(studentId,round):Number(pointsOf(round).lab)+Number(pointsOf(round).revision)+pathScore(studentId,round)+teamScore(round)}/{maxScore(round)}</strong></div></header><StudentStage round={round} phase={phase} student={student} state={state}/></div>{teacherNotes&&<aside className="v2-teacher-note"><GraduationCap size={20}/><div><b>Qué observa el docente</b><p>{phase.student}</p><small>Fase técnica: <code>{phase.id}</code>.</small></div></aside>}<div className="v2-sim-navigation"><button className="v2-secondary" disabled={round===1&&phaseIndex===0} onClick={prev}><ArrowLeft size={16}/> Anterior</button><span>{phaseIndex+1}/{journey.length} · recorrido de {student.name}</span><button className="v2-primary" disabled={round===V2_CHALLENGE_COUNT&&phaseIndex===journey.length-1} onClick={next}>{phaseIndex===journey.length-1&&round<V2_CHALLENGE_COUNT?'Siguiente misión':'Siguiente paso'} <ArrowRight size={16}/></button></div></>}</>}</>}</div></main>
}
