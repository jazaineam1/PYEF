import React,{useEffect,useMemo,useState} from 'react'
import './dean-causal-v4.css'

const scenarios={
 rector:{
  tag:'30–55 MIN · LA TRAMPA DEL RECTOR',
  title:'🕵️ El presupuesto bajo sospecha',
  verdict:'«El bienestar no mejora las notas. ¿Recortamos el programa?»',
  question:'¿Qué información NO contiene el archivo del Rector?',
  options:['El historial previo (PGA)','Las horas de estudio y de sueño','La nota final'],
  correct:1,
  why:'Un modelo puede asociar bienestar y notas sin medir los hábitos que condicionan ambas variables. Esa ceguera puede inducir sesgo por variables omitidas.',
  caution:'El signo del coeficiente estimado depende de las decisiones que tomó el grupo; un coeficiente negativo NO está garantizado en toda muestra.'
 },
 survey:{
  tag:'55–80 MIN · ENCUENTRA LO QUE FALTABA',
  title:'🧩 Abre la encuesta, destapa el mecanismo',
  verdict:'«¡La predicción mejoró! ¿Ahora ya conocemos la causa?»',
  question:'¿SHAP o un R² alto demuestran que aumentar bienestar causará mejores notas?',
  options:['Sí, porque explican el modelo','No, explican asociaciones o predicciones','Sí, siempre que haya 450 registros'],
  correct:1,
  why:'Las horas de estudio y sueño pueden ser consecuencias del bienestar. Ajustarlas indiscriminadamente bloquearía parte del efecto total; SHAP no identifica intervenciones.',
  caution:'Usa la encuesta para comprender el sesgo, no para interpretar importancia predictiva como efecto causal.'
 },
 causal:{
  tag:'80–105 MIN · EXPERIMENTO DEL DOCTOR STRANGE',
  title:'⚡ Dos universos, un mismo estudiante sintético',
  verdict:'«¿Qué hubiera pasado bajo do(B = 0) y do(B = 4)?»',
  question:'¿Por qué el A/B usa los mismos shocks en ambos futuros sintéticos?',
  options:['Para eliminar artificialmente toda heterogeneidad','Para aislar el efecto de cambiar bienestar','Para mejorar el R² del predictor'],
  correct:1,
  why:'Comparten los choques exógenos: el tratamiento aleatorizado cambia B y, a través del mecanismo, X₁, S, U e Y. Así podemos calcular Y(1)−Y(0) en el mundo sintético.',
  caution:'Un ensayo A/B estima efectos medios con incertidumbre; en estudiantes reales nunca vemos ambos resultados de la misma persona.'
 }
}
const ar=(v,d=1)=>v==null?'—':Number(v).toFixed(d).replace('.',',')
const csvDownload=(blob,file)=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=file;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)}
function CausalDag(){
 return <section className="dean-causal-dag" aria-label="Grafo causal del motor DGP v4">
  <h3>Mapa causal del semestre · DAG v4</h3>
  <svg viewBox="0 0 840 420" role="img" aria-label="PGA afecta bienestar y nota; complejidad afecta estudio y nota; bienestar afecta estudio, sueño, fatiga y nota; estudio afecta sueño, fatiga y nota; sueño afecta fatiga y nota; fatiga afecta nota">
   <defs><marker id="dean-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3.5" orient="auto"><polygon points="0 0,7 3.5,0 7" fill="#8adbd6"/></marker></defs>
   {[
    [150,82,390,92],[150,83,694,300],[150,90,393,214],[150,210,390,214],
    [155,210,695,310],[445,95,445,208],[453,95,695,308],[455,214,690,308],
    [442,222,440,315],[452,315,690,319],[444,93,444,307],
    [145,80,690,305]
   ].map(([x1,y1,x2,y2],i)=><line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#6ec5c5" strokeWidth={i%4===0?2:1.4} opacity=".72" markerEnd="url(#dean-arrow)"/>)}
   {[
    [30,30,'H: PGA previo','Confusor'],
    [28,166,'Z: Dificultad','Pretratamiento'],
    [335,30,'B: Bienestar','Tratamiento'],
    [332,166,'X₁: Estudio','Mediador'],
    [332,280,'S: Sueño','Mediador'],
    [678,280,'Y: Nota','Resultado'],
    [678,40,'U: Fatiga','Latente']
   ].map(([x,y,title,detail],i)=><g key={i} transform={'translate('+x+','+y+')'}>
    <rect x="0" y="0" width={i===5||i===6?140:160} height="56" rx="12" fill={i===6?'#513448':i===5?'#175548':'#213d58'} stroke={i===6?'#f2c1cd':'#b0e6dd'} strokeWidth="1.6"/>
    <text x="12" y="23" fontSize="17" fill="#fff" fontWeight="700">{title}</text>
    <text x="12" y="43" fontSize="12" fill="#cee7ee">{detail}</text>
   </g>)}
  </svg>
  <p>El arquetipo es una <b>persona de juego</b>, no un nodo causal primitivo. El historial académico H y los hábitos reales generan diferencias previas.</p>
  <small>Diagrama didáctico simplificado. Las flechas codifican supuestos del DGP, no pruebas obtenidas de correlaciones.</small>
 </section>
}
export function DeanCausalConcept({phase,version}){
 const spec=scenarios[phase], [picked,setPicked]=useState(null)
 useEffect(()=>setPicked(null),[phase])
 if(!spec)return null
 return <section className="dean-causal-board">
  <div className="dean-causal-eyebrow">{spec.tag}</div>
  <h2>{spec.title}</h2><p className="dean-causal-verdict">{spec.verdict}</p>
  <div className="dean-causal-concepts"><div>
    <h3>El desafío</h3>
    <p>{spec.question}</p>
    <div className="dean-causal-choices">{spec.options.map((o,i)=><button key={o} type="button" aria-pressed={picked===i} className={picked===i?'active':''} onClick={()=>setPicked(i)}>{['A','B','C'][i]} · {o}</button>)}</div>
    {picked!==null&&<div role="status" className="dean-causal-feedback">
      <strong>{picked===spec.correct?'✓ Buen razonamiento':'Revisa la inferencia'}</strong>
      <p>{spec.why}</p>
    </div>}
  </div><div><h3>Qué debe explicar el capacitador</h3>
    <p>{spec.why}</p>
    <p><b>Supuesto o advertencia:</b> {spec.caution}</p>
    {phase==='causal'&&<p><b>Regla:</b> ATE = E[Y(1)−Y(0)]. CATE = E[Y(1)−Y(0) | H]. DML no corrige un confusor que no observamos.</p>}
  </div></div>
  {(phase==='survey'||phase==='causal')&&<CausalDag/>}
  <p className="dean-causal-provenance">Motor {version==='source_v4'?'DGP v4 · ecuaciones del capítulo adjunto':'legado'} · Datos sintéticos del juego · Bienestar como tratamiento B · Notas en 0–50.</p>
  <a className="dean-causal-notebook" href="./notebooks/Copa_Decano_DGP_v4_30.ipynb" download>📘 Descargar laboratorio Python de las tres capas y A/B</a>
 </section>
}
export function DeanCausalAB({role='student',token='',teacher='',api,enabled=false}){
 const [state,setState]=useState(null),[truth,setTruth]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 useEffect(()=>{
  if(!enabled||role==='teacher')return
  let stop=false,t;
  async function poll(){try{const next=await api('ab_state',{},token);if(!stop){setState(next);setError('')}}catch(e){if(!stop)setError(e.message)}
    if(!stop)t=setTimeout(poll,6000)}
  poll();return()=>{stop=true;clearTimeout(t)}
 },[enabled,token,role,api])
 if(!enabled)return null
 async function run(){setBusy(true);setError('');try{const x=await api('ab_run',{},'',teacher);setTruth(x)}catch(e){setError(e.message)}finally{setBusy(false)}}
 async function download(){setBusy(true);setError('');try{csvDownload(await api('ab_export',{},token),'cohorte_ab_observada.csv')}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <section className="dean-causal-ab">
 <div className="dean-causal-eyebrow">⚡ EXPERIMENTO ALEATORIZADO · DOCTOR STRANGE</div>
 <h2>Comparar do(B=0) con do(B=4)</h2>
 <p>El tratamiento se sortea por estudiante; ambos mundos sintéticos comparten los shocks. Se muestra únicamente la nota del brazo asignado en el archivo de alumnos.</p>
 {role==='teacher'?<><button className="dean-big" onClick={run} disabled={busy}>🔬 {busy?'Calculando…':'Generar y revelar A/B de esta cohorte'}</button>
  {truth&&<div className="dean-causal-kpis"><div><span>Efecto verdadero sintético</span><strong>{ar(truth.true_ate,2)} pt</strong></div><div><span>Diferencia observada</span><strong>{ar(truth.observed_diff,2)} pt</strong></div><div><span>Exámenes observados</span><strong>{truth.observations}</strong></div></div>}
  {truth&&<div className="dean-causal-cates">{truth.cate_by_archetype?.map(x=><div key={x.archetype}><b>{x.archetype}</b><span>{ar(x.true_cate,2)} puntos · {x.exams} exámenes</span></div>)}</div>}
  <small>Solo docente: los efectos Y(1)−Y(0) individuales permanecen privados. Los 30 estudiantes observan una sola rama de cada mundo.</small>
 </>:<><div className="dean-causal-kpis"><div><span>Diferencia tratada/control observada</span><strong>{ar(state?.observed_difference,2)} pt</strong></div><div><span>Exámenes del A/B</span><strong>{state?.observations??0}</strong></div></div>
 <button className="dean-big" disabled={busy||!state?.observations} onClick={download}>📥 Descargar cohorte A/B observada (CSV)</button>
 <small>La diferencia de medias tiene error de muestreo. Los resultados potenciales contrafactuales no se entregan a alumnos.</small></>}
 {error&&<p role="alert" className="dean-error">{error}</p>}
 </section>
}
