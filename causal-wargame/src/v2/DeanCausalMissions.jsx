import React,{useEffect,useState} from 'react';
import {summaries,ZIP_REFERENCE} from './dean-causal-math.js';
import './dean-causal-missions.css';

const PROFILE=[
 {id:'over',label:'Sobreexigido',estimate:11.775,capacity:8,icon:'🧠'},
 {id:'balanced',label:'Equilibrado',estimate:-2.431,capacity:8,icon:'🏃'},
 {id:'risk',label:'En riesgo',estimate:-1.491,capacity:7,icon:'🧩'},
 {id:'pragmatic',label:'Pragmático',estimate:-0.051,capacity:7,icon:'🏖️'},
];
const DML_CARDS=[
 {id:'folds',title:'Separar en folds',detail:'El dato que predigo no se usa para entrenar su modelo auxiliar'},
 {id:'models',title:'Entrenar modelos T(X) e Y(X)',detail:'Solo características previas a la intervención'},
 {id:'residuals',title:'Construir residuos',detail:'T−e(X), Y−m(X), con predicción fuera de muestra'},
 {id:'effect',title:'Relacionar residuos',detail:'Estimar bajo supuestos de identificación válidos'},
];
const label=n=>n===null||n===undefined||!Number.isFinite(n)?'No estimable':Number(n).toFixed(3);

export function useDeanMissions({gameCode,token='',enabled=false,call}){
 const [state,setState]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{
  if(!enabled||!gameCode){setState(null);return;}
  let alive=true;
  async function load(){try{
   const r=await call('mission_state',{game_code:gameCode},token);
   if(alive){setState(r);setError('')}
  }catch(e){if(alive)setError(e.message)}}
  load();const timer=setInterval(load,3600);
  return()=>{alive=false;clearInterval(timer)};
 },[gameCode,token,enabled,call]);
 async function submit(mission,answer){
  setBusy(true);setError('');
  try{
   const result=await call('mission_submit',{game_code:gameCode,mission,answer},token);
   setState(await call('mission_state',{game_code:gameCode},token));
   return result;
  }catch(e){setError(e.message);throw e}finally{setBusy(false)}
 }
 return {state,busy,error,submit};
}

function MissionReceipt({saved,step,received}){
 return saved?<div className="dean-mission-receipt" role="status">
  ✓ Decisión científica guardada en Supabase. {step==='debrief'?'El docente ha revelado el cierre; consulta la interpretación.':'Se calificará solo al cerrar la evidencia.'}
 </div>:<small>{received?'Completa la decisión de tu misión.':'La evidencia aparece cuando el docente la libera.'}</small>;
}
function Submit({mission,answer,done,locked,busy,onSubmit}){
 return <button type="button" className="dean-mission-submit" disabled={done||locked||busy}
  onClick={()=>onSubmit(mission,answer)}>{done?'✓ MISIÓN REGISTRADA':busy?'Validando…':'⚡ CONFIRMAR DECISIÓN'}</button>;
}
function Story({title,subtitle,children}){
 return <div className="dean-mission-story">
  <strong>🎬 {title}</strong><span>{subtitle}</span>{children}
 </div>;
}
function SimpleScatter({rows,stats}){
 const dots=(stats?.points||[]).slice(0,450);
 if(!dots.length||stats.r===null)return <div className="dean-mission-placeholder">Los datos disponibles no tienen variación suficiente para dibujar una correlación. No se inventan puntos.</div>;
 const xmax=Math.max(6,...dots.map(x=>x.b)),xmin=Math.min(0,...dots.map(x=>x.b));
 const x=b=>36+((b-xmin)/Math.max(1,xmax-xmin))*382;
 const y=v=>204-Math.min(50,Math.max(0,v))/50*178;
 const line=stats.raw===null?null:{x1:x(xmin),y1:y(stats.meanY+stats.raw*(xmin-stats.meanB)),
   x2:x(xmax),y2:y(stats.meanY+stats.raw*(xmax-stats.meanB))};
 return <svg className="dean-association-scatter" viewBox="0 0 445 235"
  role="img" aria-label={'Gráfico de datos observados bienestar frente a nota, correlación '+label(stats.r)+'. La recta no representa causalidad.'}>
  <line x1="36" y1="204" x2="426" y2="204" stroke="#aac9dd" strokeWidth="2"/>
  <line x1="36" y1="22" x2="36" y2="204" stroke="#aac9dd" strokeWidth="2"/>
  {[0,25,50].map(v=><g key={v}><line x1="31" x2="426" y1={y(v)} y2={y(v)} stroke="#8dacbe" opacity=".25"/>
    <text x="4" y={y(v)+4} fontSize="12" fill="#d5e4f0">{v}</text></g>)}
  {dots.map((p,i)=><circle key={i} cx={x(p.b)} cy={y(p.y)} r="3"
     fill="#95dfdd" opacity=".47"/>)}
  {line&&<line {...line} stroke="#f6d281" strokeWidth="3" strokeDasharray="8 4"/>}
  <text x="223" y="228" textAnchor="middle" fontSize="12" fill="#fff">Bienestar observado (horas/semana)</text>
  <text transform="translate(13 130) rotate(-90)" textAnchor="middle" fontSize="10" fill="#fff">Nota / 50</text>
 </svg>;
}
export function DeanCorrelationLab({rows=[],phase='rector',step='challenge',missions,onSubmit,busy=false}){
 const [mode,setMode]=useState('raw'),[answer,setAnswer]=useState(''),[source,setSource]=useState('live');
 const stats=summaries(rows),ref=ZIP_REFERENCE;
 const data=source==='zip'?ref:stats,known=source==='zip'||data.n>=3&&data.raw!==null;
 const slopes=[{id:'raw',label:'Sin ajustar',key:'raw',description:'Asociación cruda: pendiente simple Y~B'},
  {id:'pre',label:'Antecedentes',key:'pre',description:'Coeficiente observacional Y~B+PGA+complejidad'},
  {id:'post',label:'Añadir mediadores',key:'post',description:'Coeficiente observacional al incluir estudio y sueño posteriores'}];
 const saved=missions?.state?.mine?.association;
 const canSubmit=phase==='rector'&&step==='evidence'&&!saved;
 return <section className="dean-causal-mission dean-association" aria-label="Experimento de correlación frente a causalidad">
  <Story title="LA PARADOJA DEL RECTOR" subtitle="Una asociación negativa no prueba que quitar bienestar mejore la nota."/>
  <div className="dean-source-select">
   <button aria-pressed={source==='live'} type="button" onClick={()=>setSource('live')}>📈 Mi sala · DATOS LIVE</button>
   <button aria-pressed={source==='zip'} type="button" onClick={()=>setSource('zip')}>📚 Referencia ZIP · 25 alumnos</button>
  </div>
  <small className="dean-mission-source">{source==='zip'?'FUENTE EXTERNA: ZIP original · 25 estudiantes y 375 exámenes. NO es la Copa actual.':
   'FUENTE ACTUAL: observaciones reales del simulador en esta sala, NO participantes reales. '+(data.students||0)+' alumnos ficticios, '+data.n+' exámenes.'}</small>
  {source==='live'&&<SimpleScatter rows={rows} stats={stats}/>}
  {source==='zip'&&<div className="dean-reference-values">
   <span>r de Pearson <b>−0,468</b></span>
   <span>Pendiente descriptiva <b>−3,258 puntos/h</b></span>
   <small>No se representan puntos individuales del ZIP en este gráfico: esta vista muestra cifras de referencia auditadas.</small>
  </div>}
  <div className="dean-association-modes" role="group" aria-label="Comparar modelos observacionales">
   {slopes.map(p=><button type="button" key={p.id} aria-pressed={mode===p.id}
    onClick={()=>setMode(p.id)}>{p.label}</button>)}
  </div>
  <div className="dean-association-readout">
   <small>{slopes.find(p=>p.id===mode)?.description}</small>
   <strong>{known?label(data[mode])+' puntos/h':'No estimable'}</strong>
   <span>r simple: {known?label(data.r):'No estimable'} · coeficiente de regresión ≠ do(B)</span>
   {mode==='post'&&<p>⚠️ Estudio y sueño ocurren después de B y pueden mediar su efecto. Ajustarlos cambia la pregunta; no recupera necesariamente el efecto TOTAL.</p>}
   {mode==='pre'&&<p>🧭 PGA es antecedente relacionado con la selección. Complejidad puede ser pronóstica, pero no es automáticamente confusora de B→Y.</p>}
  </div>
  {phase==='rector'&&<div className="dean-mission-choice">
   <strong>🎯 El Rector pregunta: «¿Este gráfico demuestra que deberíamos quitar bienestar?»</strong>
   {[
    ['negative_effect','Sí; el signo negativo demuestra que la intervención perjudica.'],
    ['observational_only','No; son asociaciones. Falta identificar la comparación causal.'],
    ['predictive_proof','Sí; si el predictor tiene R² alto, la intervención está probada.']
   ].map(([id,name])=><button key={id} type="button" aria-pressed={answer===id}
     disabled={!canSubmit} onClick={()=>setAnswer(id)}>{name}</button>)}
   <Submit mission="association" answer={{interpretation:answer}} busy={busy}
    done={!!saved} locked={!canSubmit||!answer} onSubmit={onSubmit}/>
   <MissionReceipt saved={saved} step={step} received={canSubmit}/>
   {step==='debrief'&&<p className="dean-mission-reveal">🧠 Una correlación y sus pendientes describen datos observados. Para recomendar una política necesitamos tratamiento, comparación, supuestos y un diseño.</p>}
  </div>}
 </section>;
}
export function DeanDAGChallenge({missions,step,onSubmit,busy=false}){
 const [nodes,setNodes]=useState([]),[collider,setCollider]=useState('');
 const saved=missions?.state?.mine?.dag,active=step==='evidence'&&!saved;
 const picks=[['h','PGA previo','Antecedente relevante de selección y rendimiento'],
  ['z','Complejidad','Variable pronóstica; no siempre abre un backdoor B←Z→Y'],
  ['study','Estudio','Posterior a bienestar; potencial mediador'],
  ['sleep','Sueño','Posterior a bienestar; potencial mediador'],
  ['u','Fatiga U','Mecanismo no observado; no puede ajustarse en el CSV del alumno']];
 return <section className="dean-causal-mission" aria-label="Misión interactiva DAG evaluada">
  <Story title="DETECTIVE DE CAMINOS CAUSALES" subtitle="Quieres el efecto TOTAL de B=4 h frente B=0 h sobre la nota Y."/>
  <div className="dean-dag-pick-grid">{picks.map(([id,name,desc])=>
   <button type="button" key={id} disabled={!active} aria-pressed={nodes.includes(id)}
    onClick={()=>setNodes(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id])}>
    <strong>{nodes.includes(id)?'✓ ':''}{name}</strong><small>{desc}</small>
   </button>)}</div>
  <div className="dean-dag-paths">
   <b>Rutas de la hipótesis causal</b>
   <span>B ← PGA → Y {nodes.includes('h')?'· Ruta de confusión tratada':'· Ruta potencialmente abierta'}</span>
   <span>B → estudio/sueño → Y {(nodes.includes('study')||nodes.includes('sleep'))?'· MEDIACIÓN BLOQUEADA POR AJUSTE':'· Mecanismo preservado'}</span>
   <span>B → fatiga U → Y {nodes.includes('u')?'· NO observada: selección inválida':'· Mediador latente no ajustado'}</span>
   <small>Las flechas son SUPUESTOS del DGP, no efectos descubiertos por correlación. Z puede ayudar a precisión sin necesariamente confundir B→Y.</small>
  </div>
  <div className="dean-collider-vignette">
   <strong>🧩 ESCENA APARTE · NO ES EL DAG DEL GENERADOR</strong>
   <p>Bienestar → tutorías ← dificultad. Si filtras a quienes recibieron tutorías, ¿puedes crear una asociación artificial?</p>
   <div>{[['avoid','Sí: evita condicionar el collider'],['condition','No: condicionar cualquier variable siempre ayuda']].map(([k,l])=>
    <button key={k} disabled={!active} aria-pressed={collider===k} onClick={()=>setCollider(k)}>{l}</button>)}</div>
  </div>
  <Submit mission="dag" done={!!saved} locked={!active||!collider} busy={busy}
    answer={{nodes,collider}} onSubmit={onSubmit}/>
  <MissionReceipt saved={saved} step={step} received={active}/>
  {step==='debrief'&&<p className="dean-mission-reveal">🧠 Para el efecto total, revisa confusores PREVIOS, no controles posteriores indiscriminados. El collider es una práctica separada de la estructura del ZIP.</p>}
 </section>;
}
export function DeanDMLChallenge({missions,step,onSubmit,busy=false}){
 const [order,setOrder]=useState([]),[limit,setLimit]=useState('');
 const saved=missions?.state?.mine?.dml,active=step==='evidence'&&!saved;
 return <section className="dean-causal-mission" aria-label="Microjuego de Double Machine Learning">
  <Story title="DML · DESACTIVA EL RUIDO" subtitle="Ordena las cuatro operaciones. En un A/B el sorteo aporta la identificación; DML no hace magia con U oculta."/>
  <div className="dean-dml-sequence">{order.map((id,i)=><div key={id}><b>{i+1}</b> {DML_CARDS.find(c=>c.id===id)?.title}</div>)}</div>
  <div className="dean-dml-cards">{DML_CARDS.filter(c=>!order.includes(c.id)).map(c=>
   <button type="button" key={c.id} disabled={!active} onClick={()=>setOrder(v=>[...v,c.id])}>
    <strong>＋ {c.title}</strong><small>{c.detail}</small>
   </button>)}</div>
  <button type="button" className="dean-mission-clear" disabled={!active||!order.length} onClick={()=>setOrder([])}>↻ Reordenar tarjetas</button>
  <p><b>¿DML elimina automáticamente la confusión no medida?</b></p>
  <div className="dean-dml-limit">{[['not_unmeasured','No: requiere un diseño e hipótesis válidos.'],
     ['always_eliminates','Sí: usar modelos flexibles siempre elimina U.']].map(([k,l])=>
   <button type="button" key={k} disabled={!active} aria-pressed={limit===k} onClick={()=>setLimit(k)}>{l}</button>)}</div>
  <Submit mission="dml" answer={{order,limit}} done={!!saved}
   locked={!active||order.length!==4||!limit} onSubmit={onSubmit} busy={busy}/>
  <MissionReceipt saved={saved} step={step} received={active}/>
  {step==='debrief'&&<p className="dean-mission-reveal">🧠 Primero divide en folds; entrena e(X), m(X) fuera de muestra; construye residuos; estima su relación. No confundas DML con asignación aleatoria ni con corrección mágica de U.</p>}
 </section>;
}
export function DeanPolicyMission({missions,step,onSubmit,busy=false}){
 const [counts,setCounts]=useState({over:0,balanced:0,risk:0,pragmatic:0});
 const [objective,setObjective]=useState('efficiency'),[uncertainty,setUncertainty]=useState('');
 const saved=missions?.state?.mine?.policy,active=step==='evidence'&&!saved;
 const selected=Object.values(counts).reduce((a,b)=>a+b,0);
 const estimated=PROFILE.reduce((a,p)=>a+counts[p.id]*p.estimate,0);
 const benchmarkEfficient=6*PROFILE[0].estimate;
 const benchmarkEquity=5*PROFILE[0].estimate+PROFILE[2].estimate;
 return <section className="dean-causal-mission" aria-label="Política de seis cupos de bienestar">
  <Story title="EL PRESUPUESTO DEL DECANO" subtitle="30 alumnos SINTÉTICOS DE REFERENCIA; seis cupos de B=4 h (20 %). NO son los jugadores conectados."/>
  <div className="dean-policy-stats">
   <strong>🎟️ {selected} / 6 cupos</strong><span>Beneficio TOTAL estimado: <b>{estimated.toFixed(2)} pts</b></span>
   <small>Predicciones CATE del benchmark DR-Learner · 900 entrenamiento / 300 holdout · NO son resultados de tu Copa actual. Magnitudes, no garantías.</small>
  </div>
  <div className="dean-policy-profiles">{PROFILE.map(p=><div key={p.id}>
   <span>{p.icon} <b>{p.label}</b><small> CATE estimado {p.estimate>0?'+':''}{p.estimate.toFixed(2)} pts</small></span>
   <div><button type="button" disabled={!active||counts[p.id]===0} aria-label={'Quitar cupo '+p.label}
    onClick={()=>setCounts(c=>({...c,[p.id]:c[p.id]-1}))}>−</button>
    <b>{counts[p.id]}</b>
    <button type="button" disabled={!active||selected>=6||counts[p.id]>=p.capacity} aria-label={'Añadir cupo '+p.label}
    onClick={()=>setCounts(c=>({...c,[p.id]:c[p.id]+1}))}>＋</button></div>
  </div>)}</div>
  <div className="dean-policy-comparison"><strong>Compara políticas del mismo benchmark</strong>
   <span>Maximizar beneficio estimado: {benchmarkEfficient.toFixed(1)} puntos (seis Sobreexigidos)</span>
   <span>Reservar un cupo por equidad: {benchmarkEquity.toFixed(1)} puntos (cinco Sobreexigidos y uno En riesgo)</span>
   <small>La comparación es un escenario pedagógico por CATE promedio, no una selección clínica ni la verdad individual. Puede haber políticas justificables distintas.</small>
  </div>
  <div className="dean-policy-objective"><strong>¿Cuál es tu objetivo institucional?</strong>
   {[['efficiency','Maximizar beneficio estimado'],['equity','Reservar al menos un cupo a En riesgo']].map(([k,l])=>
    <button type="button" disabled={!active} key={k} aria-pressed={objective===k} onClick={()=>setObjective(k)}>{l}</button>)}
  </div>
  <div className="dean-policy-objective"><strong>¿Un CATE predicho garantiza el beneficio individual?</strong>
   {[['estimate_not_guarantee','No. Es un promedio por perfil con incertidumbre.'],['certain','Sí. Cada alumno ganará exactamente su CATE.']].map(([k,l])=>
    <button type="button" disabled={!active} key={k} aria-pressed={uncertainty===k} onClick={()=>setUncertainty(k)}>{l}</button>)}
  </div>
  <Submit mission="policy" answer={{counts,objective,uncertainty}} busy={busy}
   done={!!saved} locked={!active||selected!==6||!uncertainty} onSubmit={onSubmit}/>
  <MissionReceipt saved={saved} step={step} received={active}/>
  {step==='debrief'&&<p className="dean-mission-reveal">🧠 Una decisión con presupuesto y criterios explícitos es diferente de seleccionar por nota prevista. La política debe balancear beneficio incremental estimado, incertidumbre y equidad.</p>}
 </section>;
}
export function DeanMissionTeacher({missions,phase}){
 if(!missions?.state?.available||!['rector','survey','causal'].includes(phase))return null;
 const s=missions.state,labels={association:'Asociación',dag:'DAG',dml:'DML',policy:'Política de cupos'};
 return <section className="dean-causal-mission dean-teacher-mission">
  <strong>🎯 EVIDENCIA DE APRENDIZAJE VERIFICABLE</strong>
  <p>Las decisiones científicas se registran una vez por jugador y se califican en el servidor cuando revelas la solución.</p>
  <div className="dean-teacher-mission-grid">{Object.entries(labels).map(([id,label])=>
   <div key={id}><b>{label}</b><span>{s.completed?.[id]||0}/{s.registered||0}</span></div>)}</div>
  <small>La práctica es una evidencia adicional, separada de 0–100 (ABC), 0–50 (notas) y 0–120 (Kahoot).</small>
 </section>;
}
export function DeanMissionWall({missions}){
 if(!missions?.state?.available)return null;
 const s=missions.state;
 return <section className="dean-causal-mission dean-wall-mission">
  <strong>🔬 PRÁCTICA CAUSAL · HASTA 43 PUNTOS</strong>
  <div className="dean-wall-mission-rooms">{(s.rooms||[]).map(r=>
   <span key={r.room_no}>Sala {r.room_no}: {r.verified_people||0}/{r.participants||0} con evidencia · {r.participants?Math.round(r.skill_points/r.participants):'—'} / 43 pts</span>)}</div>
  <small>La puntuación de práctica solo se conoce tras el cierre docente de cada acto. Salas vacías no compiten.</small>
 </section>;
}
