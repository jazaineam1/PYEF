import React,{useEffect,useRef,useState} from 'react';
import './dean-science.css';
import {PYTHON_PROGRAMS,SCIENCE_STEPS} from './dean-science-programs.js';
import {browserStorage,extractTrapResult,saveTrapPrediction} from './dean-predictive-trap.js';
import {TrapRecommendation} from './DeanPredictiveTrap.jsx';

// Los programas Python viven en dean-science-programs.js (se prueban en Node con scikit-learn real).
// pyodide.worker.js ejecuta cada programa en el dispositivo del participante.
export {SCIENCE_STEPS};

export default function DeanSciencePython({mode='rector',rows=[],gameCode=''}) {
 const [status,setStatus]=useState('idle'),[output,setOutput]=useState(''),[error,setError]=useState(''),[trap,setTrap]=useState(null);
 const worker=useRef(null),timer=useRef(null),active=useRef(0);
 useEffect(()=>{setStatus('idle');setOutput('');setError('');setTrap(null);active.current++;
  clearTimeout(timer.current);worker.current?.terminate();worker.current=null;
  return()=>{active.current++;clearTimeout(timer.current);worker.current?.terminate();worker.current=null}
 },[mode,rows]);
 const cfg=SCIENCE_STEPS[mode];
 if(!cfg||!rows.length)return null;
 function execute(){
  setError('');setOutput('');setTrap(null);setStatus('loading');
  clearTimeout(timer.current);worker.current?.terminate();
  const id=++active.current;
  const w=new Worker(new URL('./pyodide.worker.js',import.meta.url));
  worker.current=w;
  // Dos relojes: la descarga de Pyodide y el cálculo del bosque pueden tardar distinto en cada equipo.
  const arm=ms=>{clearTimeout(timer.current);timer.current=setTimeout(()=>{if(id===active.current){w.terminate();worker.current=null;
   setStatus('failed');setError('Python tardó demasiado. Puedes continuar con la explicación del docente sin puntos falsos.')}
  },ms)};
  arm(90000);
  w.onmessage=e=>{if(id!==active.current)return;const m=e.data||{};
   if(m.type==='ready'){
    arm(120000);
    setStatus('running');w.postMessage({type:'run',requestId:'dean-science-'+id,context:{rows},code:PYTHON_PROGRAMS[mode]});
   }else if(m.type==='result'||m.type==='error'||m.type==='execution_error'){
    clearTimeout(timer.current);
    if(m.type==='result'){
     const {text,result}=extractTrapResult(m.output||'');
     setStatus('done');setOutput(text||'Ejecución sin salida');
     if(result){saveTrapPrediction(browserStorage(),gameCode,result);setTrap(result)}
    }else{setStatus('failed');setError(m.error||'Error en la ejecución Python.');}
    w.terminate();worker.current=null;
   }
  };
  w.onerror=e=>{if(id===active.current){clearTimeout(timer.current);setStatus('failed');setError(e.message||'Error del motor Python');w.terminate();worker.current=null}};
  w.postMessage({type:'init'});
 }
 return <details className="dean-science" aria-label="Laboratorio científico real de la Copa">
  <summary>🐍 {cfg.title} <span>{status==='done'?'✓ EJECUTADO':'ABRIR LABORATORIO'}</span></summary>
  <div className="dean-science-body"><p>{cfg.origin}</p>
   {mode==='ab'&&<div className="dean-science-dml" aria-label="Cómo funciona DML">
    <div><b>① X → T</b><small>Modelo auxiliar del tratamiento</small></div>
    <div><b>② X → Y</b><small>Modelo auxiliar del resultado</small></div>
    <div><b>③ Residuos</b><small>T−T esperado · Y−Y esperado</small></div>
    <div><b>④ Efecto</b><small>Relacionar residuos fuera de muestra</small></div>
   </div>}
   {mode!=='ab'&&<div className="dean-science-dml" aria-label="Cómo se simula do(B) con un modelo predictivo">
    <div><b>① Entrenar</b><small>Random Forest con split por estudiante</small></div>
    <div><b>② Importancia</b><small>Permutación: ¿qué columna ayuda a predecir?</small></div>
    <div><b>③ Simular</b><small>Mismas filas con B=0 h y B=4 h</small></div>
    <div><b>④ Anotar</b><small>Tu recomendación; el A/B la pondrá a prueba</small></div>
   </div>}
   <button type="button" onClick={execute} disabled={status==='loading'||status==='running'}>
    {status==='loading'?'Preparando Pyodide…':status==='running'?'Ejecutando cálculos…':status==='done'?'↻ Repetir Python real':'▶ Ejecutar Python real'}
   </button>
   {output&&<pre role="status" className="dean-science-output">{output}</pre>}
   {error&&<p role="alert" className="dean-science-error">{error}</p>}
   {mode!=='ab'&&<TrapRecommendation mode={mode} gameCode={gameCode} result={trap}/>}
   <small>Python 3 en Pyodide, scikit-learn y pandas ejecutados en tu dispositivo. El código no entrena EconML; ninguna salida se presenta como un efecto individual observado. Datos y referencias SINTÉTICOS.</small>
  </div>
 </details>;
}
