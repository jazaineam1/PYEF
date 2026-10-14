import React,{useEffect,useState} from 'react'
import {invoke} from '../lib/api'
import {WORKSHOP_120,WORKSHOP_GUIDE,getWorkshopCue,instructorLedMinutes,participatoryMinutes} from './workshop-script.js'
const abc=['a','b','c','d']
const phaseName={idle:'Sin iniciar',question_preview:'Pregunta preparada',question_open:'Respuestas abiertas',question_locked:'Tiempo cerrado',results:'Resultados',explanation:'Explicación causal',leaderboard:'Ranking',final_podium:'Podio final',finished:'Batalla terminada',paused:'Pausa'}
const fmt=n=>Number(n||0).toLocaleString('es-CO')
const label=x=>phaseName[x]||x||'Sin iniciar'

export function useV2Quiz(gameCode,role='wall',active=true){
 const[state,setState]=useState(null),[error,setError]=useState('')
 useEffect(()=>{
  if(!active||!gameCode)return
  let cancelled=false,timer
  const poll=async()=>{
   try{
    const payload=role==='student'?{action:'student'}:{action:'wall',game_code:gameCode}
    const value=await invoke('v2-quiz',payload)
    if(!cancelled){setState({...value,received_at:Date.now()});setError('')}
   }catch(e){if(!cancelled)setError(e.message)}
   if(!cancelled)timer=setTimeout(poll,role==='teacher'?1800:1600)
  }
  poll();return()=>{cancelled=true;clearTimeout(timer)}
 },[gameCode,role,active])
 return {quiz:state,error,setQuiz:setState}
}

function useClock(){
 const[now,setNow]=useState(Date.now())
 useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),250);return()=>clearInterval(id)},[])
 return now
}
function Remaining({state}){
 const now=useClock()
 const q=state?.quiz
 const seconds=q?.deadline_at&&q?.phase==='question_open'
  ? Math.max(0,Math.ceil((Date.parse(q.deadline_at)-Date.parse(state.server_now)-(now-state.received_at))/1000))
  : null
 return <span role="timer" className={'v2-kahoot-timer '+(seconds!==null&&seconds<=5?'urgent':'')}>
  {seconds===null?(q?.phase==='paused'?'PAUSA':label(q?.phase)):seconds+' s'}
 </span>
}
function AgendaBar({agenda}){
 const stage=WORKSHOP_120[Number(agenda?.phase_index||0)]
 const cue=getWorkshopCue(agenda)
 return <div className="v2-agenda-bar"><strong>120 MIN · {stage.title}</strong><span>Minuto {cue?.start??stage.start}–{cue?.end??stage.end} · {cue?.title||stage.title}</span></div>
}
export function WorkshopBanner({state}){
 if(!state?.agenda?.active)return null
 return <AgendaBar agenda={state.agenda}/>
}
function Ranked({state}){
 const rows=state?.leaderboard||[]
 const teams=state?.team_leaderboard||[]
 return <div className="v2-kahoot-rankings">
  <section><h3>Podio individual · batalla /120</h3><div className="v2-kahoot-podium">{rows.slice(0,3).map((s,i)=><article key={s.player_id}><b>{i+1}º</b><strong>{s.name}</strong><span>{s.team}</span><b>{s.points} pts</b></article>)}</div></section>
  <section><h3>Equipos</h3>{teams.slice(0,6).map((t,i)=><div className="v2-kahoot-team-rank" key={t.team}><b>{i+1}º {t.team}</b><strong>{fmt(t.points)} pts</strong></div>)}</section>
 </div>
}
function Bars({q}){
 const sum=abc.reduce((n,k)=>n+Number(q?.tallies?.[k]||0),0)
 return <div className="v2-kahoot-bars">{abc.map(k=><div key={k} className={q?.question?.correct_choice===k?'correct':''}>
  <b>{k.toUpperCase()}</b><div className="v2-kahoot-bar"><i style={{width:(sum?100*Number(q?.tallies?.[k]||0)/sum:0)+'%'}}/></div><strong>{Number(q?.tallies?.[k]||0)}</strong>
 </div>)}</div>
}
function Answers({q,value,onSelect,disabled}){
 return <div className="v2-kahoot-answers">{abc.map(k=><button key={k} type="button"
 className={'v2-kahoot-choice '+(value===k?'selected':'')} disabled={disabled} onClick={()=>onSelect(k)}>
  <b>{k.toUpperCase()}</b><span>{q.question.options[k]}</span>
 </button>)}</div>
}
export function QuizPlayer({data}){
 const q=data?.quiz;const question=q?.question
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[confirmed,setConfirmed]=useState(null)
 const [selection,setSelection]=useState('')
 useEffect(()=>{setSelection('');setConfirmed(null);setError('')},[q?.current_question])
 if(!q||q.phase==='idle')return null
 const recorded=data?.mine?.answer?.choice||confirmed?.choice||''
 const open=q.phase==='question_open'
 async function answer(choice){
  if(busy||recorded||!open)return
  setSelection(choice);setBusy(true);setError('')
  try{
   const receipt=await invoke('v2-quiz',{action:'submit',question:q.current_question,choice})
   setConfirmed(receipt)
  }catch(e){setError(e.message);setSelection('')}
  finally{setBusy(false)}
 }
 return <main className="v2-kahoot-screen v2-kahoot-student">
  <div className="v2-kicker">GRAN FINAL · BATALLA CAUSAL · PUNTOS SEPARADOS</div>
  <WorkshopBanner state={data}/><div className="v2-kahoot-scoreline"><b>Pregunta {q.current_question||0}/8</b><b>Mis puntos en la batalla: {data.mine?.points||0}/120</b></div>
  <Remaining state={data}/>
  {(q.phase==='final_podium'||q.phase==='finished')?<><h1>¡Final de DOS FUTUROS!</h1><Ranked state={data}/></>:
   <>{question&&<><h1>{question.question}</h1>
    {open?<Answers q={q} value={recorded||selection} disabled={busy||Boolean(recorded)} onSelect={answer}/>:
     ['question_preview','paused'].includes(q.phase)?<p className="v2-kahoot-wait">Prepárate. El facilitador abrirá las respuestas.</p>:
     <p className="v2-kahoot-wait">Respuestas bloqueadas. Espera la revelación.</p>}
    {recorded&&<p className="v2-kahoot-receipt">✓ Respuesta {recorded.toUpperCase()} registrada por el servidor. No se puede editar.</p>}
    {error&&<p className="v2-alert error" role="alert">{error}</p>}
    {['results','explanation','leaderboard'].includes(q.phase)&&<div className="v2-kahoot-explain">
      <h2>Correcta: {question.correct_choice?.toUpperCase()} · {question.options?.[question.correct_choice]}</h2>
      <p>{question.explanation}</p>
      <small>{question.concept}</small><Bars q={q}/>
    </div>}
    {q.phase==='leaderboard'&&<Ranked state={data}/>}</>}
   </>}
 </main>
}
export function QuizWall({data}){
 const q=data?.quiz,question=q?.question
 if(!q||q.phase==='idle')return null
 return <section className="v2-kahoot-screen v2-kahoot-wall">
  <div className="v2-kicker">GRAN FINAL · DOS FUTUROS CAMPUS</div><WorkshopBanner state={data}/>
  {q.phase==='final_podium'||q.phase==='finished'?<><h1>🏆 PODIO FINAL</h1><Ranked state={data}/></>:
  <><div className="v2-kahoot-scoreline"><b>PREGUNTA {q.current_question}/8</b><strong>{fmt(q.answer_count)} / {fmt(data.participants)} respuestas</strong></div>
   <Remaining state={data}/><h1>{question?.question||'¡Prepárense!'}</h1>
   {q.phase==='question_open'&&<div className="v2-kahoot-live"><div><i style={{width:(100*Number(q.answer_count||0)/Math.max(1,data.participants))+'%'}}/></div><span>Respuestas recibidas, distribución oculta hasta el reveal</span></div>}
   {['results','explanation','leaderboard'].includes(q.phase)&&<><Answers q={q} disabled value={question?.correct_choice} onSelect={()=>{}}/><Bars q={q}/><div className="v2-kahoot-explain"><h2>{question?.concept}</h2><p>{question?.explanation}</p></div></>}
   {q.phase==='leaderboard'&&<Ranked state={data}/>}</>}
 </section>
}
export function WorkshopTeachingWall({data}){
 const cue=getWorkshopCue(data?.agenda)
 if(!data?.agenda?.active||data?.agenda?.paused||cue?.mode!=='teacher')return null
 const stage=WORKSHOP_120[Number(data.agenda.phase_index||0)]
 return <section className="v2-kahoot-screen v2-teacher-scene" aria-label="Explicación del capacitador">
  <div className="v2-kicker">EXPLICACIÓN EN VIVO · MIN {cue.start}–{cue.end} · {stage.title}</div>
  <h1>{cue.title}</h1>
  <div className="v2-teacher-scene-visual"><b>PROYECCIÓN DIDÁCTICA</b><p>{cue.visual}</p></div>
  <p className="v2-teacher-scene-lesson">{cue.teacher}</p>
  <p className="v2-teacher-scene-check"><b>Verifica antes de avanzar:</b> {cue.checkpoint}</p>
  <small>Explicación guiada por el capacitador, no un examen ni una nueva misión independiente.</small>
 </section>
}
export function WorkshopDirector({data,onAction,busy}){
 const agenda=data?.agenda||{},idx=Number(agenda.phase_index||0)
 const stage=WORKSHOP_120[idx],cues=WORKSHOP_GUIDE[stage.id]||[]
 const cueIndex=Math.min(cues.length-1,Math.max(0,Number(agenda.cue_index||0)))
 const cue=cues[cueIndex]
 return <section className="v2-panel v2-workshop-director">
  <div className="v2-kicker">GUION EXPLÍCITO DEL CAPACITADOR · 120 MIN · CINCO FASES + FINAL</div>
  <h2>{instructorLedMinutes} min guiados por capacitador + {participatoryMinutes} min de actividad y competencia</h2>
  <p>En cada fase la consola indica cuándo explicar, qué proyectar y cómo comprobar comprensión. No se obliga a completar los 17 bloques Python en las dos horas.</p>
  <div className="v2-workshop-steps">{WORKSHOP_120.map((s,i)=><div key={s.id} className={(i===idx?'active ':'')+(i<idx?'done':'')}><b>{s.start}–{s.end}´</b><span>{s.title}</span></div>)}</div>
  <AgendaBar agenda={agenda}/>
  <div className="v2-workshop-cues">{cues.map((s,i)=><div key={s.start} className={(i===cueIndex?'active ':'')+(s.mode==='teacher'?'instructor':'practice')}>
    <strong>{s.start}–{s.end} min</strong><span>{s.mode==='teacher'?'Explicación del capacitador':'Estudiantes en acción'}</span><b>{s.title}</b>
  </div>)}</div>
  <div className="v2-teaching-cue">
    <div className="v2-kicker">{cue.mode==='teacher'?'EL CAPACITADOR EXPLICA · PAUSAR LA ACTIVIDAD':'AHORA ACTÚAN LOS ESTUDIANTES'}</div>
    <h3>{cue.title} · {cue.minutes} min</h3>
    <p><b>Guion para explicar:</b> {cue.teacher}</p>
    <p><b>Qué proyectar:</b> {cue.visual}</p>
    <p><b>Evidencia de comprensión:</b> {cue.checkpoint}</p>
    <p><b>Revelación de esta fase:</b> {stage.wow}</p>
  </div>
  <div className="v2-fac-actions">
    {!agenda.active&&<button className="v2-primary" disabled={busy} onClick={()=>onAction('agenda_start')}>Iniciar taller</button>}
    {agenda.active&&!agenda.paused&&<button className="v2-secondary" disabled={busy||cueIndex===0} onClick={()=>onAction('agenda_cue_prev')}>Momento anterior</button>}
    {agenda.active&&!agenda.paused&&<button className="v2-primary" disabled={busy||cueIndex>=cues.length-1} onClick={()=>onAction('agenda_cue_next')}>Siguiente momento</button>}
    {agenda.active&&!agenda.paused&&<button className="v2-secondary" disabled={busy||idx===0} onClick={()=>onAction('agenda_prev')}>Fase anterior</button>}
    {agenda.active&&!agenda.paused&&<button className="v2-primary" disabled={busy||idx===5} onClick={()=>onAction('agenda_next')}>Siguiente fase</button>}
    {agenda.active&&!agenda.paused&&<button className="v2-secondary" disabled={busy} onClick={()=>onAction('agenda_pause')}>Pausar taller</button>}
    {agenda.paused&&<button className="v2-primary" disabled={busy} onClick={()=>onAction('agenda_resume')}>Reanudar taller</button>}
  </div>
  <p className="v2-workshop-caution">Los momentos y la proyección se sincronizan desde el servidor; los seis laboratorios completos siguen disponibles como profundización. La agenda abreviada no reemplaza automáticamente los checkpoints existentes de cada misión.</p>
 </section>
}

export function QuizTeacher({data,onAction,busy}){
 const q=data?.quiz||{phase:'idle',current_question:0}
 const command={idle:['start','Iniciar batalla'],question_preview:['open','Abrir respuestas'],
 question_open:['lock','Cerrar antes de tiempo'],question_locked:['reveal_explain','Revelar y explicar'],
 results:['explain','Mostrar explicación'],explanation:['next_fast',q.current_question===8?'Mostrar podio':'Siguiente pregunta'],
 leaderboard:['next_fast',q.current_question===8?'Mostrar podio':'Siguiente pregunta'],
 final_podium:['finish','Terminar batalla']}
 const [action,title]=command[q.phase]||[]
 const question=q.question
 return <section className="v2-panel v2-kahoot-teacher">
  <div className="v2-kicker">GRAN FINAL · KAHOOT REAL · 8 × 15 PUNTOS</div>
  <h2>Batalla causal · {label(q.phase)}</h2>
  <div className="v2-kahoot-scoreline"><b>{q.current_question||0}/8</b><b>{fmt(q.answer_count)} / {fmt(data?.participants)} respuestas</b></div>
  <Remaining state={data}/>
  <h3>{question?.question||'La batalla está preparada. Los aciertos suman a un marcador /120 independiente.'}</h3>
  {question?.question&&<div className="v2-kahoot-guide">{abc.map(k=><div key={k}><b>{k.toUpperCase()}</b> {question.options[k]}</div>)}</div>}
  {['results','explanation','leaderboard'].includes(q.phase)&&<p><b>Respuesta:</b> {question?.correct_choice?.toUpperCase()} · {question?.explanation}</p>}
  <div className="v2-fac-actions">
   {title&&<button className="v2-primary" disabled={busy} onClick={()=>onAction(action)}>{title}</button>}
   {q.phase==='explanation'&&<button className="v2-secondary" disabled={busy} onClick={()=>onAction('rank')}>Ver ranking de la pregunta</button>}
   {q.phase==='question_open'&&<button className="v2-secondary" disabled={busy} onClick={()=>onAction('pause')}>Pausar temporizador</button>}
   {q.phase==='paused'&&<button className="v2-primary" disabled={busy} onClick={()=>onAction('resume')}>Reanudar temporizador</button>}
   {q.phase==='finished'&&<button className="v2-secondary" disabled={busy} onClick={()=>{if(window.confirm('¿Borrar exclusivamente las respuestas del Kahoot y reiniciar la batalla?'))onAction('reset_quiz')}}>Reiniciar solo batalla</button>}
  </div>
  {['leaderboard','final_podium','finished'].includes(q.phase)&&<Ranked state={data}/>}
 </section>
}
