import React,{useEffect,useMemo,useRef,useState}from'react'
import{Check,LoaderCircle,Play,RotateCcw,Terminal}from'lucide-react'
import{invoke}from'../lib/api'
import{buildPythonLab}from'./python-lab'

const TIMEOUT_MS=20000

export function PythonEvidenceLab({round,state,analysis,labKey,labPoints=20,onComplete,simulation=false}){
  const lab=useMemo(()=>buildPythonLab(round,state,analysis,labKey),[round,state,analysis,labKey])
  const[codes,setCodes]=useState({})
  const[results,setResults]=useState({})
  const[status,setStatus]=useState('idle')
  const[error,setError]=useState('')
  const[closing,setClosing]=useState(false)
  const[localComplete,setLocalComplete]=useState(false)
  const workerRef=useRef(null)
  const timerRef=useRef(null)
  const pendingRef=useRef(null)

  useEffect(()=>{
    const initial={}
    for(const s of lab?.steps||[])initial[s.id]=s.guidedCode||s.code||''
    setCodes(initial)
    setResults({})
    setError('')
    setStatus('idle')
    setClosing(false)
    setLocalComplete(false)
    clearTimeout(timerRef.current)
    workerRef.current?.terminate()
    workerRef.current=null
  },[round,lab?.title])

  useEffect(()=>()=>{clearTimeout(timerRef.current);workerRef.current?.terminate()},[])

  function ensureWorker(){
    if(workerRef.current)return workerRef.current
    const worker=new Worker(new URL('./pyodide.worker.js',import.meta.url))
    worker.onmessage=e=>{
      const msg=e.data||{}
      if(msg.type==='ready'){setStatus('ready');setError('')}
      if(msg.type==='result'){
        clearTimeout(timerRef.current)
        const pending=pendingRef.current
        const stepId=pending?.stepId||msg.requestId
        setResults(v=>({...v,[stepId]:{output:msg.output||'',image:msg.image||null}}))
        setStatus('ready')
        setError('')
        if(pending&&!simulation){
          const duration=Math.round(performance.now()-pending.started)
          invoke('v2-submit',{
            action:'learning_event',round,event_type:'python_run',
            payload:{step_id:stepId,code_changed:pending.codeChanged,duration_ms:duration,mode:'guided'}
          }).catch(()=>{})
        }
        pendingRef.current=null
      }
      if(msg.type==='error'){
        clearTimeout(timerRef.current)
        setStatus('error')
        setError(msg.error||'Error ejecutando Python')
        pendingRef.current=null
      }
    }
    worker.onerror=e=>{
      clearTimeout(timerRef.current)
      setStatus('error')
      setError(e.message||'No fue posible iniciar Python en este navegador.')
      pendingRef.current=null
    }
    workerRef.current=worker
    return worker
  }

  function init(){
    setStatus('loading')
    setError('')
    ensureWorker().postMessage({type:'init'})
  }

  function run(step){
    const worker=ensureWorker()
    const baseCode=step.guidedCode||step.code||''
    const code=codes[step.id]??baseCode
    setStatus('running')
    setError('')
    pendingRef.current={stepId:step.id,started:performance.now(),codeChanged:code!==baseCode}
    worker.postMessage({type:'run',requestId:step.id,code,context:lab?.context||{}})
    clearTimeout(timerRef.current)
    timerRef.current=setTimeout(()=>{
      worker.terminate()
      workerRef.current=null
      pendingRef.current=null
      setStatus('error')
      setError('La ejecución superó 20 segundos y fue detenida. Restaura el ejemplo e inténtalo otra vez.')
    },TIMEOUT_MS)
  }

  async function completeLab(){
    if(!allDone||closing)return
    setClosing(true)
    setError('')
    try{
      if(simulation){
        setLocalComplete(true)
        await onComplete?.()
        return
      }
      await invoke('v2-submit',{action:'lab_complete',round})
      await onComplete?.()
    }catch(e){
      setError(e.message)
    }finally{
      setClosing(false)
    }
  }

  if(!lab)return null
  const steps=lab.steps||[]
  const ready=status==='ready'||status==='running'
  const busy=status==='loading'||status==='running'
  const allDone=steps.length>0&&steps.every(s=>results[s.id])

  return <section className="v2-python-lab single-page">
    <div className="v2-python-head">
      <div><div className="v2-kicker">LABORATORIO · TODO EN ESTA PÁGINA</div><h2>{lab.title}</h2></div>
      <div className={`v2-python-status ${status}`}><Terminal size={15}/><span>{status==='idle'?'Python apagado':status==='loading'?'Cargando Python':status==='running'?'Ejecutando':'Python listo'}</span></div>
    </div>

    <div className="v2-alert hint"><span>No necesitas memorizar código. Ejecuta cada bloque, mira el resultado y responde la pregunta que lo acompaña.</span></div>

    {!ready&&<button type="button" className="v2-primary wide" disabled={busy} onClick={init}>{busy?<LoaderCircle className="spin" size={17}/>:<Terminal size={17}/>} {busy?'Cargando…':'Iniciar Python'}</button>}

    <div className="v2-python-all-steps">
      {steps.map((step,i)=>{
        const base=step.guidedCode||step.code||''
        const result=results[step.id]
        return <article className={`v2-python-step-card ${result?'done':''}`} key={step.id}>
          <div className="v2-python-step-title"><b>{i+1}</b><div><strong>{step.question}</strong><span>{step.instruction}</span></div>{result&&<Check size={18}/>}</div>
          <div className="v2-python-editor">
            <div className="v2-python-editorbar"><span>{step.id}.py</span><button type="button" onClick={()=>setCodes(v=>({...v,[step.id]:base}))}><RotateCcw size={14}/> Restaurar</button></div>
            <textarea aria-label={`Código Python: ${step.question}`} value={codes[step.id]??base} onChange={e=>setCodes(v=>({...v,[step.id]:e.target.value}))} spellCheck="false"/>
          </div>
          <button type="button" className="v2-secondary" disabled={!ready||busy} onClick={()=>run(step)}>{busy&&pendingRef.current?.stepId===step.id?<LoaderCircle className="spin" size={16}/>:<Play size={16}/>} {result?'Ejecutar de nuevo':'Ejecutar'}</button>
          {result&&<div className="v2-python-result">
            <div className="v2-python-output"><div><Terminal size={14}/> resultado</div><pre>{result.output}</pre></div>
            {result.image&&<figure className="v2-python-figure"><img src={result.image} alt="Gráfica producida por el código Python"/><figcaption>Resultado gráfico.</figcaption></figure>}
          </div>}
        </article>
      })}
    </div>

    {error&&<div className="v2-alert error">{error}</div>}
    <button type="button" className="v2-primary wide" disabled={!allDone||closing||localComplete} onClick={completeLab}>{localComplete?`Laboratorio completado · +${labPoints} puntos`:closing?'Cerrando laboratorio…':allDone?`Terminar laboratorio · +${labPoints} puntos`:'Ejecuta todos los bloques para terminar'}</button>
    <small className="v2-python-footnote">Las técnicas avanzadas quedan fuera de la ruta principal. El objetivo aquí es entender la idea, no memorizar nombres.</small>
  </section>
}
