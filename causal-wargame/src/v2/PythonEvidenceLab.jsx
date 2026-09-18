import React,{useEffect,useMemo,useRef,useState}from'react'
import{Play,RotateCcw,Terminal,LoaderCircle}from'lucide-react'
import{buildPythonLab}from'./python-lab'

const TIMEOUT_MS=10000

export function PythonEvidenceLab({round,state,analysis}){
  const lab=useMemo(()=>buildPythonLab(round,state,analysis),[round,state,analysis])
  const[code,setCode]=useState(lab?.code||'')
  const[status,setStatus]=useState('idle')
  const[output,setOutput]=useState('')
  const[error,setError]=useState('')
  const workerRef=useRef(null)
  const timerRef=useRef(null)

  useEffect(()=>{
    setCode(lab?.code||'')
    setOutput('')
    setError('')
    setStatus('idle')
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
        setOutput(msg.output||'')
        setStatus('ready')
        setError('')
      }
      if(msg.type==='error'){
        clearTimeout(timerRef.current)
        setStatus('error')
        setError(msg.error||'Error ejecutando Python')
      }
    }
    worker.onerror=e=>{
      clearTimeout(timerRef.current)
      setStatus('error')
      setError(e.message||'No fue posible iniciar Python en este navegador.')
    }
    workerRef.current=worker
    return worker
  }

  function init(){
    setStatus('loading')
    setError('')
    ensureWorker().postMessage({type:'init'})
  }

  function run(){
    const worker=ensureWorker()
    setStatus('running')
    setError('')
    setOutput('')
    worker.postMessage({type:'run',code,context:lab?.context||{}})
    clearTimeout(timerRef.current)
    timerRef.current=setTimeout(()=>{
      worker.terminate()
      workerRef.current=null
      setStatus('error')
      setError('La ejecución superó 10 segundos y fue detenida. Revisa el código e inténtalo de nuevo.')
    },TIMEOUT_MS)
  }

  if(!lab)return null
  const ready=status==='ready'||status==='running'
  const busy=status==='loading'||status==='running'

  return <section className="v2-python-lab">
    <div className="v2-python-head">
      <div><div className="v2-kicker">LABORATORIO PYTHON · EN TU NAVEGADOR</div><h2>{lab.title}</h2></div>
      <div className={`v2-python-status ${status}`}><Terminal size={15}/><span>{status==='idle'?'apagado':status==='loading'?'cargando Pyodide':status==='running'?'ejecutando':'Python listo'}</span></div>
    </div>
    <p className="v2-python-question">{lab.question}</p>
    <p className="v2-python-instruction">{lab.instruction}</p>

    <div className="v2-python-editor">
      <div className="v2-python-editorbar"><span>main.py</span><button type="button" onClick={()=>setCode(lab.code)}><RotateCcw size={14}/> Restaurar</button></div>
      <textarea aria-label="Código Python editable" value={code} onChange={e=>setCode(e.target.value)} spellCheck="false"/>
    </div>

    <div className="v2-python-actions">
      {!ready&&<button type="button" className="v2-primary" disabled={busy} onClick={init}>{busy?<LoaderCircle className="spin" size={17}/>:<Terminal size={17}/>} {busy?'Cargando motor…':'Iniciar Python'}</button>}
      {ready&&<button type="button" className="v2-primary" disabled={busy} onClick={run}>{busy?<LoaderCircle className="spin" size={17}/>:<Play size={17}/>} {busy?'Ejecutando…':'Ejecutar'}</button>}
      <small>Python corre localmente con WebAssembly. El laboratorio sólo recibe los datos ya desbloqueados para esta ronda.</small>
    </div>

    {error&&<div className="v2-alert error">{error}</div>}
    {output&&<div className="v2-python-output"><div><Terminal size={14}/> salida</div><pre>{output}</pre></div>}
  </section>
}
