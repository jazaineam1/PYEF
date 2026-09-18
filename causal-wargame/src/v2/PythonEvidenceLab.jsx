import React,{useEffect,useMemo,useRef,useState}from'react'
import{Play,RotateCcw,Terminal,LoaderCircle,Code2,Route}from'lucide-react'
import{invoke}from'../lib/api'
import{buildPythonLab}from'./python-lab'

const TIMEOUT_MS=20000

export function PythonEvidenceLab({round,state,analysis}){
  const lab=useMemo(()=>buildPythonLab(round,state,analysis),[round,state,analysis])
  const[stepIndex,setStepIndex]=useState(0)
  const[codes,setCodes]=useState({})
  const[results,setResults]=useState({})
  const[status,setStatus]=useState('idle')
  const[error,setError]=useState('')
  const[mode,setMode]=useState('guided')
  const workerRef=useRef(null)
  const timerRef=useRef(null)
  const pendingRef=useRef(null)

  useEffect(()=>{
    const initial={}
    for(const s of lab?.steps||[]){initial[`guided:${s.id}`]=s.guidedCode||s.code||'';initial[`advanced:${s.id}`]=s.advancedCode||s.guidedCode||s.code||''}
    setCodes(initial)
    setResults({})
    setStepIndex(0)
    setError('')
    setStatus('idle')
    setMode('guided')
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
        if(pending){
          const duration=Math.round(performance.now()-pending.started)
          invoke('v2-submit',{
            action:'learning_event',round,event_type:'python_run',
            payload:{step_id:stepId,code_changed:pending.codeChanged,duration_ms:duration,mode}
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
    const codeKey=`${mode}:${step.id}`
    const baseCode=mode==='advanced'?(step.advancedCode||step.guidedCode||step.code):(step.guidedCode||step.code)
    const code=codes[codeKey]??baseCode
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
      setError('La ejecución superó 20 segundos y fue detenida. Simplifica el código o restaura el paso guiado.')
    },TIMEOUT_MS)
  }

  if(!lab)return null
  const steps=lab.steps||[]
  const step=steps[Math.min(stepIndex,steps.length-1)]
  if(!step)return null
  const ready=status==='ready'||status==='running'
  const busy=status==='loading'||status==='running'
  const result=results[step.id]

  return <section className="v2-python-lab">
    <div className="v2-python-head">
      <div><div className="v2-kicker">LABORATORIO PYTHON · MODELAMIENTO REAL</div><h2>{lab.title}</h2></div>
      <div className={`v2-python-status ${status}`}><Terminal size={15}/><span>{status==='idle'?'apagado':status==='loading'?'cargando stack científico':status==='running'?'ejecutando':'Python listo'}</span></div>
    </div>

    <div className="v2-python-modes">
      <button type="button" className={mode==='guided'?'active':''} onClick={()=>setMode('guided')}><Route size={14}/> Guiado</button>
      <button type="button" className={mode==='advanced'?'active':''} onClick={()=>setMode('advanced')}><Code2 size={14}/> Profundizar</button>
      <span>{mode==='guided'?'Código corto para entender la idea.':'Opcional: aquí aparecen técnicas y términos más avanzados.'}</span>
    </div>

    <div className="v2-python-step-tabs">
      {steps.map((s,i)=><button type="button" key={s.id} className={i===stepIndex?'active':''} onClick={()=>setStepIndex(i)}>{s.label}{results[s.id]?' ✓':''}</button>)}
    </div>

    <div className="v2-python-prompt">
      <strong>{step.question}</strong>
      <span>{step.instruction}</span>
    </div>

    <div className="v2-python-editor">
      <div className="v2-python-editorbar"><span>{mode==='guided'?'guiado':'avanzado'} · {step.id}.py</span><button type="button" onClick={()=>{const key=`${mode}:${step.id}`;const base=mode==='advanced'?(step.advancedCode||step.guidedCode||step.code):(step.guidedCode||step.code);setCodes(v=>({...v,[key]:base}))}}><RotateCcw size={14}/> Restaurar</button></div>
      <textarea aria-label="Código Python editable" value={codes[`${mode}:${step.id}`]??(mode==='advanced'?(step.advancedCode||step.guidedCode||step.code):(step.guidedCode||step.code))} onChange={e=>{const key=`${mode}:${step.id}`;setCodes(v=>({...v,[key]:e.target.value}))}} spellCheck="false"/>
    </div>

    <div className="v2-python-actions">
      {!ready&&<button type="button" className="v2-primary" disabled={busy} onClick={init}>{busy?<LoaderCircle className="spin" size={17}/>:<Terminal size={17}/>} {busy?'Cargando motor…':'Iniciar Python'}</button>}
      {ready&&<button type="button" className="v2-primary" disabled={busy} onClick={()=>run(step)}>{busy?<LoaderCircle className="spin" size={17}/>:<Play size={17}/>} {busy?'Ejecutando…':'Ejecutar este paso'}</button>}
      <small>Python corre dentro del navegador. El modo guiado usa sólo lo necesario; “Profundizar” muestra técnicas opcionales. La respuesta oculta del reto no llega antes del reveal.</small>
    </div>

    {error&&<div className="v2-alert error">{error}</div>}
    {result&&<div className="v2-python-result">
      <div className="v2-python-output"><div><Terminal size={14}/> salida Python</div><pre>{result.output}</pre></div>
      {result.image&&<figure className="v2-python-figure"><img src={result.image} alt="Gráfica producida por el código Python"/><figcaption>Salida gráfica generada en el navegador.</figcaption></figure>}
    </div>}
  </section>
}
