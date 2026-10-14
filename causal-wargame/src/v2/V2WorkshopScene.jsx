import React,{useEffect,useRef,useState} from 'react'
import {invoke} from '../lib/api'
import {WORKSHOP_120} from './workshop-script.js'
import {WORKSHOP_SCENES} from './workshop-scenes.js'
import {WORKSHOP_PYTHON} from './workshop-python.js'
import EconMLV2Panel from './EconMLV2Panel.jsx'
import {verifiedV2EconML} from './econml-v2-data.js'
import './workshop-flow.css'

const fmt=n=>Number(n||0).toLocaleString('es-CO')
const glyph=['🚀','🧠','⚡','🕸️','🏆']

export function WorkshopOptionalPython({phase}){
 const demo=WORKSHOP_PYTHON[phase]
 const workerRef=useRef(null),timeoutRef=useRef(null)
 const [status,setStatus]=useState('idle'),[result,setResult]=useState(''),[error,setError]=useState('')
 useEffect(()=>()=>{
   clearTimeout(timeoutRef.current)
   workerRef.current?.terminate()
   workerRef.current=null
 },[phase])
 if(!demo)return null
 function run(){
  clearTimeout(timeoutRef.current)
  workerRef.current?.terminate()
  setError('');setResult('');setStatus('loading')
  const worker=new Worker(new URL('./pyodide.worker.js',import.meta.url))
  workerRef.current=worker
  let started=false
  timeoutRef.current=setTimeout(()=>{
    worker.terminate();if(workerRef.current===worker)workerRef.current=null
    setStatus('error');setError('El cálculo excedió 80 segundos; úsalo proyectado desde el computador del capacitador.')
  },80000)
  worker.onmessage=e=>{
    const msg=e.data||{}
    if(msg.type==='ready'&&!started){
      started=true;setStatus('running')
      worker.postMessage({type:'run',requestId:'workshop-demo',context:{},code:demo.code})
    }else if(msg.type==='result'){
      clearTimeout(timeoutRef.current);setResult(msg.output||'Sin salida');setStatus('done')
    }else if(msg.type==='execution_error'||msg.type==='error'){
      clearTimeout(timeoutRef.current)
      setStatus('error');setError([msg.output,msg.error].filter(Boolean).join('\n'))
    }
  }
  worker.onerror=e=>{clearTimeout(timeoutRef.current);setStatus('error');setError(e.message||'No fue posible cargar Python')}
  worker.postMessage({type:'init'})
 }
 return <details className="v2-workshop-python">
   <summary>⚗️ Laboratorio Python real · opcional · sin puntos</summary>
   <h3>{demo.title}</h3><p>{demo.idea}</p>
   <p>Se ejecuta con Pyodide en tu dispositivo. La clase puede avanzar aunque tu teléfono no ejecute esta demostración.</p>
   <button className="v2-primary" type="button" disabled={status==='loading'||status==='running'} onClick={run}>
      {status==='loading'?'Cargando Python…':status==='running'?'Calculando…':status==='done'?'Repetir experimento':'Ejecutar experimento'}
   </button>
   {result&&<pre className="v2-workshop-python-output" role="status">{result}</pre>}
   {error&&<p className="v2-alert error" role="alert">{error}</p>}
   <p className="v2-workshop-python-label">Datos sintéticos generados por el código. EconML se entrenó separadamente en CPython.</p>
   {phase===4&&<details><summary>Comparar modelos EconML realmente entrenados</summary><EconMLV2Panel/></details>}
 </details>
}
function StoryCausalVisual({phase}){
 if(phase===0||phase===1)return <div className="v2-workshop-visual-cards">
  {[['ANA','92 %','37','38','+1'],['BRUNO','62 %','24','33','+9']].map(([who,prob,y0,y1,delta])=><article key={who}>
    <span>🎓 {who}</span><strong>{prob}</strong><small>Pronóstico de aprobar</small>
    <div className="v2-workshop-visual-futures"><span>Sin apoyo: {phase===0?'?':y0}</span><span>Con apoyo: {phase===0?'?':y1}</span></div>
    <b>{phase===0?'EFECTO DESCONOCIDO':delta+' PUNTOS · SOLO SINTÉTICO'}</b>
  </article>)}
 </div>
 if(phase===2)return <div className="v2-workshop-visual-comparison">
   <div><strong>🤖 PREDICE</strong><b>MAE ↓ · R² ↑</b><span>Qué nota esperamos con X</span></div>
   <strong aria-label="no implica">≠</strong>
   <div><strong>⚡ IDENTIFICA</strong><b>Y(1) − Y(0)</b><span>Qué cambia por la intervención</span></div>
 </div>
 if(phase===3)return <div className="v2-workshop-visual-dag" role="img" aria-label="DAG: PGA previo influye en la oferta y en la nota; la oferta influye en la nota">
    <div className="node confounder">PGA previo <small>confusor</small></div>
    <span className="arrow" aria-hidden="true">↘ <small>y ↙</small></span>
    <div className="node">Oferta de apoyo <small>Tratamiento T</small></div>
    <span className="arrow" aria-hidden="true">→</span>
    <div className="node outcome">Nota final <small>Resultado Y</small></div>
    <div className="v2-workshop-dag-foot">⚠️ Estudio posterior: posible mediador · Tutoría posterior: posible collider</div>
 </div>
 const data=verifiedV2EconML
 return <div className="v2-workshop-visual-cate">
   <div className="v2-kicker">CATE ESTIMADO · EVIDENCIA ECONML REAL · SINTÉTICA</div>
   {(data?.segments||[]).map(s=><div className="v2-workshop-cate-row" key={s.segment}>
    <b>{s.name}</b><div><i style={{width:Math.max(3,Math.min(100,Math.abs(s.causal_forest)/12*100))+'%'}}/></div><strong>{Number(s.causal_forest).toFixed(2)} pt</strong>
   </div>)}
   <small>Comparación visual de CausalForestDML en holdout académico (500 perfiles). Son estimaciones condicionadas, no efectos individuales observados.</small>
 </div>
}

export function WorkshopSceneReveal({phase}){
 const story=WORKSHOP_SCENES[phase]
 if(!story)return null
 return <section className="v2-workshop-wow" aria-live="polite">
  <div className="v2-kicker">⚡ EFECTO WOW · SOLO TRAS PROYECCIÓN DOCENTE</div>
  <h2>La evidencia cambió nuestra decisión</h2><StoryCausalVisual phase={phase}/>
  <p>{story.reveal}</p>
  <small>{story.detail}</small>
 </section>
}
export function WorkshopScenePlayer({data}){
 const idx=Number(data?.agenda?.phase_index||0)
 const stage=WORKSHOP_120[idx],scene=WORKSHOP_SCENES[idx]
 const [selected,setSelected]=useState(''),[local,setLocal]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('')
 useEffect(()=>{setSelected('');setLocal(null);setError('')},[idx])
 if(!stage)return null
 if(idx===5)return <section className="v2-workshop-scene v2-workshop-final-wait"><span className="v2-workshop-avatar">🏆</span><h1>¡Llegó la gran batalla causal!</h1><p>Ocho preguntas. El facilitador abrirá el Kahoot sincronizado cuando todos estén listos.</p><div className="v2-workshop-progress">GRAN FINAL · 105–120 MIN</div></section>
 const mine=data?.workshop||{},recorded=(mine.phase_index===idx?mine.my_choice:'')|| (local?.phase_index===idx?local.choice:'')
 const teaching=Number(data?.agenda?.cue_index||0)===1
 const paused=data?.agenda?.paused
 async function send(){
  if(!selected||recorded||busy||paused||teaching)return
  setBusy(true);setError('')
  try{
   const receipt=await invoke('v2-quiz',{action:'workshop_vote',phase_index:idx,choice:selected})
   setLocal(receipt)
  }catch(e){setError(e.message)}
  finally{setBusy(false)}
 }
 return <section className="v2-workshop-scene">
  <header className="v2-workshop-scene-header">
    <div><div className="v2-kicker">{scene.badge} · FASE {idx===0?'PRÓLOGO':idx+' / 4'}</div><h1>{scene.title}</h1><p>{stage.activity}</p></div>
    <div className="v2-workshop-avatar" aria-hidden="true">{glyph[idx]}</div>
  </header>
  <div className="v2-workshop-progress" aria-label="Progreso del taller">{WORKSHOP_120.map((s,i)=><span key={s.id} className={i===idx?'active':i<idx?'done':''} title={s.title}>{i===idx?'▶':i<idx?'✓':i+1}</span>)}</div>
  <div className="v2-workshop-decision">
    <div className="v2-kicker">🎮 JUGADA DE TU INVESTIGACIÓN</div>
    <h2>{scene.ask}</h2>
    <div className="v2-workshop-choices">{scene.options.map(([id,title,description])=>
      <button type="button" key={id} disabled={Boolean(recorded)||busy||paused||teaching}
      onClick={()=>setSelected(id)} aria-pressed={(recorded||selected)===id}
      className={(recorded||selected)===id?'selected':''}>
        <strong>{title}</strong><span>{description}</span>
      </button>
    )}</div>
    {recorded?<div className="v2-workshop-receipt" role="status">✓ Estrategia registrada por el servidor. Tu escuadrón puede seguir discutiendo; el capacitador marcará el avance.</div>:
    <button type="button" className="v2-primary v2-workshop-launch" disabled={!selected||busy||paused||teaching} onClick={send}>
      {busy?'Guardando…':paused?'Taller pausado':teaching?'Escucha la revelación':'🚀 Lanzar estrategia'}
    </button>}
    {error&&<p role="alert" className="v2-alert error">{error}</p>}
  </div>
  {teaching?<WorkshopSceneReveal phase={idx}/>:<div className="v2-workshop-suspense">🔒 La explicación causal llegará después de la decisión. No hay examen sorpresa.</div>}
  <WorkshopOptionalPython key={idx} phase={idx}/>
  <p className="v2-workshop-footnote">Una decisión por fase · Sin 17 laboratorios obligatorios · Resultado sintético claramente identificado</p>
 </section>
}
export function WorkshopSceneWall({data}){
 const idx=Number(data?.agenda?.phase_index||0),stage=WORKSHOP_120[idx],scene=WORKSHOP_SCENES[idx]
 if(!stage)return null
 if(idx===5)return <section className="v2-workshop-stage-wall"><h1>🏆 GRAN FINAL</h1><p>Prepara los móviles. El facilitador abrirá las ocho preguntas sincronizadas.</p></section>
 const received=Number(data?.workshop?.received||0)
 const audience=Number(data?.workshop?.participants||data?.participants||0)
 const percent=Math.min(100,Math.round(100*received/Math.max(1,audience)))
 return <section className="v2-workshop-stage-wall">
  <div className="v2-kicker">🎮 MODO CLASE · {stage.title.toUpperCase()}</div>
  <div className="v2-workshop-wall-avatar" aria-hidden="true">{glyph[idx]}</div>
  <h1>{scene.title}</h1>
  <h2>{scene.ask}</h2>
  <div className="v2-workshop-wall-choices">{scene.options.map(([,title])=><span key={title}>{title}</span>)}</div>
  <div className="v2-workshop-wall-participation"><strong>{fmt(received)} de {fmt(audience)} decisiones recibidas</strong><div><i style={{width:percent+'%'}}/></div></div>
  <p>Los votos individuales son privados hasta que el capacitador active la revelación.</p>
  <div className="v2-workshop-wall-teams">{(data?.workshop?.by_team||[]).map(t=><div key={t.team}><b>🛡️ {t.team}</b><strong>{t.submitted} respuestas</strong></div>)}</div>
 </section>
}
