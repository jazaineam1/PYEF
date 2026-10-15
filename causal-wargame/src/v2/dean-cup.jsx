import React,{useEffect,useState} from 'react';
import{createRoot}from'react-dom/client';
import './dean-cup.css';
import './dean-cup-layout.css';
import DeanCausalAtlas from './DeanCausalAtlas.jsx';
import {useDeanLearning,DeanLearningQuest,DeanLearningInstructor,DeanLearningWall} from './DeanLearningArc.jsx';
const endpoint=(import.meta.env.VITE_FUNCTIONS_BASE_URL||'').replace(/\/$/,'')+'/v2-dean-cup';
const names=['Alpha','Beta','Gamma','Delta','Épsilon'];
const icons={over:'🧠',balanced:'🏃',risk:'🧩',pragmatic:'🏖️'};
const profiles={over:'Sobreexigido',balanced:'Equilibrado',risk:'En riesgo',pragmatic:'Pragmático'};
const limits={over:[[5,14,10],[1,5,3.5],[0,3,1]],balanced:[[2,9,6],[6,9,7.5],[1,6,3.5]],risk:[[2,9,5],[4,7.5,5.5],[0,4,1]],pragmatic:[[0,5,2],[6.5,10,8.5],[0,5,2.5]]};
const canonicalLimits={over:[[8,14,11.5],[2,5,3.5],[0,1.5,0.6]],balanced:[[4,8,6],[6.5,8.5,7.5],[1.5,3.5,2.5]],risk:[[2,5.5,3.5],[4.5,7,6],[1.5,4,2.5]],pragmatic:[[0.5,3.5,1.5],[7,9.5,8.5],[3.5,6,4.8]]};
const sourceSubjects=['Cálculo Multivariable','Física Mecánica y Ondas','Econometría Aplicada','Estructuras de Datos y Algoritmos','Estadística y Probabilidad','Bases de Datos Relacionales','Metodología de la Investigación','Fundamentos de Gestión y Finanzas','Innovación y Emprendimiento','Comunicación Oral y Escrita','Ética Profesional y Ciudadanía'];
const courses=['Introducción a la Estadística','Cálculo Diferencial','Historia Social','Álgebra Lineal','Química','Escritura Académica','Cálculo Multivariable','Física I','Métodos de Investigación','Economía','Programación','Probabilidad','Ética Profesional','Modelos de Datos','Proyecto Integrador'];
const code=new URLSearchParams(location.search).get('game')?.trim().toUpperCase()||'FUTUROS';
const storageKey='cw-dean-v2-'+code;
const hexToken=()=>{const b=new Uint8Array(32);crypto.getRandomValues(b);return Array.from(b,x=>x.toString(16).padStart(2,'0')).join('')};
async function call(action,payload={},student='',teacher=''){
 const h={'content-type':'application/json'};
 if(student)h['x-game-token']=student;
 if(teacher)h['x-facilitator-token']=teacher;
 if(!endpoint.startsWith('https://'))throw Error('Backend seguro no configurado');
 const r=await fetch(endpoint,{method:'POST',headers:h,body:JSON.stringify({action,...payload}),cache:'no-store'});
 if(['export','teacher_truth','ab_download','ab_truth'].includes(action)&&r.ok)return r.blob();
 const data=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(data.error||'Fallo de conexión');
 return data;
}
function useBoard(token='',enabled=true,gameCode=code){
 const [value,setValue]=useState(null),[error,setError]=useState('');
 useEffect(()=>{
  if(!enabled)return;
  let dead=false,t;
  async function poll(){try{const s=await call('state',{game_code:gameCode},token);if(!dead){setValue({...s,_receivedAt:Date.now()});setError('')}}catch(e){if(!dead)setError(e.message)}
  if(!dead)t=setTimeout(poll,2700+Math.random()*1300)}
  poll();return()=>{dead=true;clearTimeout(t)}
 },[token,enabled,gameCode]);
 return{value,error,setValue};
}
function Banner({kind,phase}){return <header className="dean-banner"><div><small>DOS FUTUROS · CAMPUS V2</small><h1>🏆 LA COPA DEL DECANO</h1></div><div className="dean-banner-meta"><span>{kind}</span><b>{phase||'PREPARACIÓN'}</b><small>5 SALAS · HASTA 30 PARTICIPANTES · 15 EXÁMENES</small></div></header>}
function Board({groups=[]}){
 const attendees=groups.reduce((n,g)=>n+Number(g.members||0),0)
 const ranked=groups.filter(g=>Number(g.members)>0).sort((a,b)=>Number(b.fair_score??-1)-Number(a.fair_score??-1)||Number(b.coverage_pct||0)-Number(a.coverage_pct||0)||a.room_no-b.room_no)
 const empty=groups.filter(g=>!Number(g.members)).sort((a,b)=>a.room_no-b.room_no)
 return <section className="dean-board"><h2>🏆 Clasificación en vivo</h2>
 <p>{attendees} inscritos de máximo 30. No hay asistencia mínima: cada sala avanza con quienes llegaron.</p>
 <p>Puntaje comparable: suma de notas / (15 × inscritos). Los exámenes pendientes cuentan provisionalmente como cero; la media de exámenes realizados se muestra aparte.</p>
 {ranked.length===0&&<p>Esperando al primer participante. Las salas vacías no compiten.</p>}
 {ranked.map((g,i)=>{const target=Number(g.target_exams??Number(g.members)*15),completed=Number(g.exams_completed||0),progress=target?Math.min(100,100*completed/target):0;return <article key={g.room_no}>
 <div className="dean-medal">{['🥇','🥈','🥉'][i]||'#'+(i+1)}</div>
 <div className="dean-board-main"><b>Grupo {g.room_no} · {names[g.room_no-1]}</b>
 <span>{g.members}/6 participantes · {completed}/{target} exámenes ({Math.round(progress)} %)</span>
 <div className="dean-meter"><i style={{width:progress+'%'}}/></div>
 <small>Media de notas rendidas: {g.average_score==null?'—':Number(g.average_score).toFixed(1)} / 50</small>
 </div><div className="dean-rating"><strong>{g.fair_score==null?'—':Number(g.fair_score).toFixed(1)}</strong>
 <small>{g.is_complete?'FINAL':'PROVISIONAL'}</small></div>
 </article>})}
 {empty.map(g=><article key={g.room_no} className="dean-team-empty"><div className="dean-medal">—</div>
 <div className="dean-board-main"><b>Grupo {g.room_no} · {names[g.room_no-1]}</b><span>0/6 inscritos · Sala disponible</span></div>
 <div className="dean-rating"><small>SIN PARTICIPANTES</small></div></article>)}
 </section>;
}

// Score bug: a compact, always-visible room score. The full board is an optional popover.
function MiniWall({groups=[],room,completed=0,lastAward=null}){
 const ranked=groups.filter(g=>Number(g.members)>0).sort((a,b)=>Number(b.fair_score??-1)-Number(a.fair_score??-1)||Number(b.coverage_pct||0)-Number(a.coverage_pct||0)||a.room_no-b.room_no);
 const mine=groups.find(g=>Number(g.room_no)===Number(room));
 const position=ranked.findIndex(g=>Number(g.room_no)===Number(room))+1;
 const score=mine?.fair_score==null?'—':Number(mine.fair_score).toFixed(1);
 const target=Number(mine?.target_exams??Number(mine?.members||0)*15);
 const done=Number(mine?.exams_completed||0);
 return <details className="dean-hud" aria-label="Marcador de salas en vivo">
  <summary><span className="dean-hud-label">● COPA EN VIVO</span><span className="dean-hud-row">
   <strong>{position?'#'+position:'—'} · {names[Number(room)-1]||'Sin sala'}</strong>
   <b>{score}<small> / 50</small></b>
  </span><span className="dean-hud-foot">{lastAward?<strong className="dean-hud-earned" role="status">✨ NOTA {Number.isFinite(lastAward.score)?lastAward.score.toFixed(1):'—'}/50</strong>:<>TU SALA · {done}/{target||0} EXÁMENES</>} <span>▾ VER RANKING</span></span></summary>
  <div className="dean-hud-popover"><b>🏆 Clasificación · cinco salas</b>
   {ranked.map((g,i)=><div key={g.room_no} className={Number(g.room_no)===Number(room)?'mine':''}><span>{i+1}. {names[g.room_no-1]}</span><strong>{g.fair_score==null?'—':Number(g.fair_score).toFixed(1)}</strong></div>)}
   {groups.filter(g=>!Number(g.members)).map(g=><div key={g.room_no} className="empty"><span>— {names[g.room_no-1]}</span><small>SIN PARTICIPANTES</small></div>)}
   <small>Promedio normalizado del equipo · tu progreso: {completed}/15</small>
  </div>
 </details>
}

function Slider({label,units,min,max,value,onChange}){return <label className="dean-slider"><span><b>{label}</b><strong>{Number(value).toFixed(1)} h</strong></span><input type="range" min={min} max={max} step=".5" value={value} onChange={e=>onChange(Number(e.target.value))}/><small>{min}–{max} h · {units}</small></label>}
function ExamCountdown({deadline,serverNow,receivedAt}){
 const [now,setNow]=useState(Date.now());
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),500);return()=>clearInterval(t)},[]);
 if(!deadline)return null;
 const secs=Math.max(0,Math.ceil((Date.parse(deadline)-Date.parse(serverNow||new Date(receivedAt||Date.now()).toISOString())-(now-(receivedAt||now)))/1000));
 const label=Math.floor(secs/60).toString().padStart(2,'0')+':'+(secs%60).toString().padStart(2,'0');
 return <div className={'dean-exam-clock '+(secs===0?'ended':'')} role="timer">
   <strong>⏱️ Tiempo de torneo: {label}</strong>
   <small>{secs===0?'El servidor completa automáticamente los exámenes pendientes al consultar el estado.':'El reloj se calcula a partir de la hora del servidor.'}</small>
 </div>;
}

function Exam({person,onSubmit,version,deadline,serverNow,receivedAt}){
 const canonical=version==='zip_dgp_2026';
 const n=Number(person.completed||0)+1,range=(canonical?canonicalLimits:limits)[person.archetype];
 const [s,setS]=useState(range[0][2]),[z,setZ]=useState(range[1][2]),[w,setW]=useState(range[2][2]);
 const [busy,setBusy]=useState(false),[err,setErr]=useState(''),[flash,setFlash]=useState(null);
 useEffect(()=>{setS(range[0][2]);setZ(range[1][2]);setW(range[2][2]);setFlash(null)},[n,person.archetype,canonical]);
 if(n>15)return <section className="dean-finish"><div className="dean-emoji">🎓</div><h2>¡Semestre completo!</h2><p>Completaste tus 15 exámenes. Tu sala no necesita seis personas para avanzar.</p></section>;
 async function submit(){setBusy(true);setErr('');try{setFlash(await onSubmit({exam:n,study:s,sleep:z,wellness:w}))}catch(e){setErr(e.message)}finally{setBusy(false)}}
 return <section className="dean-exam"><div className="dean-exam-brief">
  <div className="dean-kicker">MISIÓN ACADÉMICA · EXAMEN {n} DE 15</div>
  <h2>🎓 {canonical?sourceSubjects[(n-1)%11]:courses[n-1]}</h2>
  {canonical&&<ExamCountdown deadline={deadline} serverNow={serverNow} receivedAt={receivedAt}/>}
  <div className="dean-meter"><i style={{width:(n-1)/15*100+'%'}}/></div>
  <div className={'dean-state '+(z<6||s>9?'alert':'')}>{z<6||s>9?'⚠️ Puede acumularse fatiga simulada. Dormir poco no es una estrategia saludable.':'🟢 Condiciones de recuperación favorables en este mundo sintético.'}</div>
  </div><div className="dean-exam-controls">
  <h3>⚡ Configura tu estrategia</h3>
  <Slider label="📚 Horas de estudio" units="para este parcial" min={range[0][0]} max={range[0][1]} value={s} onChange={setS}/>
  <Slider label="😴 Sueño" units="la noche anterior" min={range[1][0]} max={range[1][1]} value={z} onChange={setZ}/>
  <Slider label="🏃 Bienestar" units="horas semanales" min={range[2][0]} max={range[2][1]} value={w} onChange={setW}/>
  <button className="dean-big dean-exam-action" type="button" disabled={busy} onClick={submit}>{busy?'Evaluando…':'⚡ RENDIR EXAMEN'}</button>
  {flash&&<p className="dean-grade" role="status">Nota guardada: <b>{Number(flash.score).toFixed(1)} / 50</b></p>}{err&&<p role="alert" className="dean-error">{err}</p>}
  </div></section>;
}

function CupQuiz({role='student',token='',teacher='',gameCode=code}) {
 const [data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[seconds,setSeconds]=useState(0),[receipt,setReceipt]=useState('');
 useEffect(()=>{let cancel=false,t;
 async function fetchState(){try{const value=await call('quiz_state',{game_code:gameCode},token);if(!cancel){setData(value);setError('')}}catch(e){if(!cancel)setError(e.message)}
 if(!cancel)t=setTimeout(fetchState,1450+Math.random()*600)}
 fetchState();return()=>{cancel=true;clearTimeout(t)}},[role,token,gameCode]);
 useEffect(()=>{const id=setInterval(()=>setSeconds(data?.deadline_at?Math.max(0,Math.ceil((Date.parse(data.deadline_at)-Date.now())/1000)):0),250);return()=>clearInterval(id)},[data?.deadline_at]);
 const commands={idle:['start','Iniciar batalla'],preview:['open','Abrir respuestas'],open:['lock','Cerrar respuestas'],locked:['reveal','Revelar y explicar'],reveal:['next',data?.question_no===8?'Mostrar podio':'Siguiente pregunta'],podium:['finish','Terminar batalla']};
 const action=async(command)=>{setBusy(true);setError('');try{setData(await call('quiz_teacher',{command,game_code:gameCode},'',teacher))}catch(e){setError(e.message)}finally{setBusy(false)}};
 const answer=async(choice)=>{if(data?.mine||busy)return;setBusy(true);setError('');try{const r=await call('quiz_submit',{question:data.question_no,choice},token);setReceipt(r.choice);setData(await call('quiz_state',{game_code:gameCode},token))}catch(e){setError(e.message)}finally{setBusy(false)}};
 useEffect(()=>setReceipt(''),[data?.question_no]);
 const q=data?.question,phase=data?.phase||'idle',revealed=['reveal','podium','finished'].includes(phase);
 return <section className="dean-quiz" aria-label="Gran final Kahoot">
  <div className="dean-kicker">🏆 GRAN FINAL · BATALLA CAUSAL · 8 PREGUNTAS · 120 PUNTOS</div>
  <h2>{phase==='idle'?'La batalla está preparada':phase==='podium'||phase==='finished'?'🏆 Podio final':'Pregunta '+data.question_no+' / 8'}</h2>
  {q&&phase!=='podium'&&phase!=='finished'&&<><p className="dean-quiz-question">{q.text}</p><p className="dean-quiz-timer" role="timer">{phase==='open'?seconds+' s':phase==='preview'?'PREPARA TU RESPUESTA':phase==='reveal'?'RESULTADOS':'TIEMPO CERRADO'}</p>
    <div className="dean-quiz-options">{['a','b','c','d'].map(ch=><button key={ch} type="button" className={(data?.mine||receipt)===ch?'chosen':''} disabled={role!=='student'||phase!=='open'||Boolean(data?.mine)||busy} onClick={()=>answer(ch)}><b>{ch.toUpperCase()}</b> {q.options[ch]}</button>)}</div>
    {role==='student'&&(data?.mine||receipt)&&<p className="dean-quiz-receipt">✓ Respuesta bloqueada: {(data.mine||receipt).toUpperCase()}</p>}
    {revealed&&<div className="dean-quiz-explanation"><h3>Correcta: {q.correct?.toUpperCase()} · {q.options[q.correct]}</h3><p>{q.explanation}</p><div className="dean-quiz-bars">{['a','b','c','d'].map(ch=><span key={ch}>{ch.toUpperCase()}: {data.counts?.[ch]||0} votos</span>)}</div></div>}
  </>}
  <div className="dean-quiz-toolbar"><strong>{data?.received||0} / {data?.participants||0} respuestas</strong>{role==='student'&&<strong>{data?.my_points||0} / 120 puntos</strong>}
  {role==='teacher'&&commands[phase]&&<button className="dean-big" disabled={busy} onClick={()=>action(commands[phase][0])}>{commands[phase][1]}</button>}</div>
  {['podium','finished'].includes(phase)&&<div className="dean-quiz-podium">{(data?.leaderboard||[]).slice(0,3).map((p,i)=><article key={i}><b>{['🥇','🥈','🥉'][i]}</b><strong>{p.alias}</strong><span>Sala {p.room_no}</span><strong>{p.points} / 120</strong></article>)}</div>}
  {error&&<p role="alert" className="dean-error">{error}</p>}
 </section>
}


const deanGuides={
  "lobby": {
    "time": "00–10",
    "teacher": "Presenta la misión. Cada sala de Teams tendrá seis carnés; no expliques fórmulas antes de que decidan.",
    "student": "Conoce tu arquetipo y forma tu equipo. Recuerda que los resultados son sintéticos.",
    "visual": "Hasta cinco salas y máximo seis personas por sala; si faltan participantes, la Copa continúa."
  },
  "exams": {
    "time": "10–30",
    "teacher": "Dales una ronda continua de juego. Mira el ranking sin interrumpir cada examen. Si alguien se retrasa, permite la simulación opcional y etiquetada.",
    "student": "Elige horas de estudio, sueño y bienestar en 15 exámenes; descubre que hay factores que no observas.",
    "visual": "Notas individuales, arquetipos ficticios, ruido y fatiga latente. Son registros observacionales de un generador artificial."
  },
  "rector": {
    "time": "30–55",
    "teacher": "Libera el archivo del Rector. Explica MAE y R² mediante sus notas; pide hallar asociaciones, pero no atribuir causalidad.",
    "student": "Descarga los exámenes disponibles de tu sala, aunque hayan asistido pocos estudiantes. Intenta anticipar notas y decide qué variables faltan.",
    "visual": "El CSV del Rector omite deliberadamente horas de estudio, sueño, arquetipo y fatiga."
  },
  "survey": {
    "time": "55–80",
    "teacher": "Revela la encuesta y únela por estudiante_id y examen_nro. Proyecta un DAG: confusores previos, mediadores posteriores y posibles colliders.",
    "student": "Cruza encuesta y Rector; identifica qué hábitos se relacionan con el resultado y cuáles son previos.",
    "visual": "Aparecen estudio, sueño y arquetipo; todavía faltan resiliencia y fatiga. Una correlación no prueba una flecha causal."
  },
  "causal": {
    "time": "80–105",
    "teacher": "Revela la fatiga oculta solo al docente. Explica que este torneo NO fue un ensayo aleatorizado; contrasta un A/B sintético independiente con estimadores DML y CATE.",
    "student": "Reconoce el factor oculto. Decide qué evidencia adicional sería necesaria para recomendar intervenciones.",
    "visual": "La verdad del generador puede auditarse, pero no prueba causalidad en datos académicos reales. DML y EconML necesitan supuestos."
  },
  "final": {
    "time": "105–120",
    "teacher": "Conduce ocho preguntas sincronizadas y explica brevemente los errores conceptuales después de cada revelación. Cierra con un podio.",
    "student": "Responde ocho preguntas A/B/C/D, participa en la revelación y observa el podio.",
    "visual": "Temporizador en servidor, respuestas bloqueadas y marcador separado /120."
  },
  "finished": {
    "time": "120",
    "teacher": "Conserva los datos y el podio sin reiniciar la partida hasta que decidas archivarla.",
    "student": "Repasa lo aprendido en esta simulación sintética.",
    "visual": "Una buena predicción o un algoritmo complejo no sustituyen un buen diseño causal."
  }
}
function DeanGuidance({phase,role='student'}){
 const x=deanGuides[phase]
 if(!x)return null
 return <section className="dean-guidance" aria-label="Guía causal integrada">
  <div className="dean-kicker">CAPACITACIÓN · MIN {x.time} · UNA SOLA ESCENA CONTINUA</div>
  <h2>{role==='teacher'?'Explicación del capacitador':'Descubre el siguiente problema causal'}</h2>
  <p>{role==='teacher'?x.teacher:x.student}</p>
  {role==='teacher'&&<p className="dean-guidance-project"><b>Qué proyectar:</b> {x.visual}</p>}
  <small>Las decisiones ocurren dentro del juego; no hay micro-pasos obligatorios.</small>
 </section>
}


const csvRows=text=>{
 const lines=String(text||'').replace(/^\uFEFF/,'').trim().split(/\r?\n/).filter(Boolean);
 const records=lines.map(line=>line.replace(/^"|"$/g,'').split('","').map(value=>value.replace(/""/g,'"')));
 const header=records.shift()||[];
 return records.map(values=>Object.fromEntries(header.map((h,i)=>[h,values[i]])));
};
const mean=xs=>xs.reduce((a,b)=>a+b,0)/Math.max(1,xs.length);
const variance=xs=>xs.length>1?xs.reduce((a,b)=>a+(b-mean(xs))**2,0)/(xs.length-1):NaN;
const slope=(rows,x,y)=>{
 const valid=rows.map(r=>[Number(r[x]),Number(r[y])]).filter(pair=>pair.every(Number.isFinite));
 if(valid.length<3)return null;
 const mx=mean(valid.map(v=>v[0])),my=mean(valid.map(v=>v[1]));
 const den=valid.reduce((n,v)=>n+(v[0]-mx)**2,0);
 return den>1e-6?valid.reduce((n,v)=>n+(v[0]-mx)*(v[1]-my),0)/den:null
};
function ABFromObserved({rows}){
 const groups=new Map();
 for(const row of rows){
  const id=row.estudiante_id,treated=Number(row.tratamiento);
  if(!groups.has(id))groups.set(id,{treated,points:[]});
  groups.get(id).points.push(Number(row.nota_final));
 }
 const entries=[...groups.values()].map(g=>({...g,score:mean(g.points)}));
 const t=entries.filter(x=>x.treated===1).map(x=>x.score),c=entries.filter(x=>x.treated===0).map(x=>x.score);
 if(t.length<2||c.length<2)return <p>No hay suficientes estudiantes por brazo para calcular el intervalo.</p>;
 const diff=mean(t)-mean(c),se=Math.sqrt(variance(t)/t.length+variance(c)/c.length);
 return <div className="dean-lab-stats"><strong>Diferencia observada: {diff.toFixed(2)} puntos</strong>
  <p>IC 95 % aproximado: [{(diff-1.96*se).toFixed(2)}, {(diff+1.96*se).toFixed(2)}]. Unidad de aleatorización: estudiante, no examen.</p>
  <small>{t.length} estudiantes tratados (4 h) y {c.length} controles (0 h), 15 exámenes por estudiante. Esta diferencia es una estimación; no equivale al efecto individual observado.</small>
 </div>
}
function DeanCausalLab({phase,token,version}){
 const [rows,setRows]=useState(null),[layer,setLayer]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 if(version!=='zip_dgp_2026'||!['rector','survey','causal','final','finished'].includes(phase))return null;
 async function calculate(type){
  setLoading(true);setError('');try{
   let records;
   if(type==='ab'){
     const blob=await call('ab_download',{},token);
     records=csvRows(await blob.text());
   }else if(type==='survey'){
     const [rector,survey]=await Promise.all([call('export',{layer:'rector'},token),call('export',{layer:'survey'},token)]);
     const h=csvRows(await rector.text()),sur=csvRows(await survey.text());
     const m=new Map(sur.map(x=>[x.estudiante_id+'|'+x.examen_nro,x]));
     records=h.map(x=>({...x,...m.get(x.estudiante_id+'|'+x.examen_nro)}));
   }else{
     const blob=await call('export',{layer:'rector'},token);
     records=csvRows(await blob.text());
   }
   setRows(records);setLayer(type);
  }catch(e){setError(e.message)}finally{setLoading(false)}
 }
 return <section className="dean-lab" aria-label="Laboratorio causal con datos de la Copa">
  <div className="dean-kicker">🔬 DEL TORNEO A LA EVIDENCIA · ZIP CANÓNICO</div>
  <h2>{phase==='rector'?'La trampa del Rector':phase==='survey'?'La trampa del modelo multivariable':'De correlación a experimento A/B'}</h2>
  <p>{phase==='rector'?'El archivo administrativo solo ve historial, dificultad, bienestar y nota. ¿Podemos recomendar quitar bienestar viendo una pendiente?':phase==='survey'?'Ahora aparecen horas de estudio y sueño: pueden mediar el efecto del bienestar. Ajustar por todo indiscriminadamente no es una solución causal.':'Se intervienen 0 frente a 4 horas de bienestar, con asignación aleatoria por estudiante y resultados potenciales sintéticos.'}</p>
  <div className="dean-lab-controls">
   <button type="button" disabled={loading} onClick={()=>calculate('rector')}>1 · Analizar Rector</button>
   {phase!=='rector'&&<button type="button" disabled={loading} onClick={()=>calculate('survey')}>2 · Cruzar encuesta</button>}
   {['causal','final','finished'].includes(phase)&&<button type="button" disabled={loading} onClick={()=>calculate('ab')}>3 · Analizar A/B</button>}
  </div>
  {rows&&<div className="dean-lab-stats">
    <b>{rows.length} registros reales del simulador ({layer==='ab'?'experimento A/B':'sala actual'})</b>
    {layer==='ab'?<ABFromObserved rows={rows}/>:<>
      <p>Pendiente simple bienestar → nota: <strong>{slope(rows,'horas_bienestar_sem','nota_final')==null?'No estimable con la variación disponible':slope(rows,'horas_bienestar_sem','nota_final').toFixed(2)+' puntos por hora'}</strong></p>
      {layer==='survey'&&<p>Pendiente simple estudio → nota: <strong>{slope(rows,'horas_estudio','nota_final')==null?'No estimable':slope(rows,'horas_estudio','nota_final').toFixed(2)+' puntos por hora'}</strong></p>}
      <p>¡Ojo! Una pendiente de asociación no identifica por sí sola el efecto de una intervención. El historial y los mediadores importan.</p>
    </>}
  </div>}
  {phase!=='rector'&&<div className="dean-lab-dag" role="img" aria-label="DAG: historial previo influye en bienestar y nota; bienestar afecta estudio, sueño, fatiga y nota">
   <span>H · PGA previo</span><b>→</b><span>B · Bienestar</span><b>→</b><span>X₁ · Estudio</span><b>→</b><span>S · Sueño</span><b>→</b><span>U · Fatiga oculta</span><b>→</b><span>Y · Nota final</span>
   <small>Rutas adicionales: H→Y, Z→X₁, Z→Y, B→S, B→U y B→Y. X₁/S/U son descendientes mediadores; el DAG contiene más flechas que este esquema lineal.</small>
  </div>}
  {error&&<p className="dean-error" role="alert">{error}</p>}
 </section>
}

function Player(){
 const [token,setToken]=useState(localStorage.getItem(storageKey)||'');
 const [lastAward,setLastAward]=useState(null);
 useEffect(()=>{if(!lastAward)return;const t=setTimeout(()=>setLastAward(null),4200);return()=>clearTimeout(t)},[lastAward]);
 const {value:state,error,setValue}=useBoard(token),[alias,setAlias]=useState(''),[room,setRoom]=useState(1),[busy,setBusy]=useState(false),[actionError,setActionError]=useState('');
 const me=state?.mine;
 const learning=useDeanLearning({token,gameCode:code,enabled:!!token});
 async function join(){setBusy(true);setActionError('');const t=token||hexToken();localStorage.setItem(storageKey,t);
 try{const s=await call('join',{game_code:code,alias:alias.trim(),room},t);setToken(t);setValue(s)}catch(e){setActionError(e.message)}finally{setBusy(false)}}
 async function submit(v){const r=await call('exam',v,token);setLastAward({score:Number(r.score),nonce:Date.now()});setValue(await call('state',{game_code:code},token));return r}
 async function quickComplete(){if(!window.confirm('¿Simular los exámenes restantes usando la estrategia predeterminada de tu arquetipo? Los registros quedarán marcados como simulados automáticamente.'))return;
 setBusy(true);setActionError('');try{await call('auto_finish',{},token);setValue(await call('state',{game_code:code},token))}
 catch(e){setActionError(e.message)}finally{setBusy(false)}}
 async function downloadAB(){setBusy(true);setActionError('');try{const blob=await call('ab_download',{},token),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='cohorte_ab_test_2026.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),7000)}catch(e){setActionError(e.message)}finally{setBusy(false)}}
 async function download(layer){setBusy(true);setActionError('');try{const blob=await call('export',{layer},token),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=layer==='rector'?'sistema_academico_rector.csv':'encuesta_estudiantes_juego.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),7000)}catch(e){setActionError(e.message)}finally{setBusy(false)}}
 return <div className="dean-page"><Banner kind="PARTICIPANTE" phase={state?.phase}/>{!state?.available?<main className="dean-hero"><div className="dean-emoji">🎓</div><h2>Esperando al Decano</h2><p>El docente abrirá el torneo para quienes asistan (hasta 30). No necesitas instalar nada.</p></main>:!me?<main className="dean-join"><div><small className="dean-kicker">TEMPORADA 01 · HASTA 30 CUPOS</small><h2>🪪 Reclama tu carné y entra al torneo</h2><p>Elige una sala de Teams: hasta 6 plazas por equipo. No es necesario llenarlas. Recibirás un arquetipo académico ficticio.</p></div>
 <label className="dean-label">Tu alias<input value={alias} maxLength={30} onChange={e=>setAlias(e.target.value)} placeholder="Ej.: maria_ds"/></label>
 <div className="dean-rooms">{state.groups.map(g=><button key={g.room_no} type="button" disabled={g.members>=6} className={room===g.room_no?'active':''} aria-pressed={room===g.room_no} onClick={()=>setRoom(g.room_no)}><b>Grupo {g.room_no}</b><span>{names[g.room_no-1]}</span><small>{g.members}/6 plazas</small></button>)}</div><button className="dean-big" type="button" disabled={busy||alias.trim().length<2} onClick={join}>🚀 {busy?'Entrando…':'ENTRAR A LA COPA'}</button></main>:
 <main className="dean-player">
   <div className="dean-player-topbar">
    <div className="dean-carnet"><span aria-hidden="true">{icons[me.archetype]}</span><div><small>SALA {me.room} · {names[me.room-1]} · {profiles[me.archetype]}</small><h2>{me.alias} <span className="dean-carnet-pga">PGA {Number(me.pga).toFixed(1)}/5</span></h2></div></div>
    <MiniWall groups={state.groups} room={me.room} completed={me.completed} lastAward={lastAward}/>
   </div>
   <div className={'dean-player-stage '+(state.phase==='exams'?'dean-is-exam':'')} tabIndex={0} aria-label="Escena principal de la Copa">
    {state.dgp_version==='zip_dgp_2026'&&state.phase!=='exams'&&<DeanLearningQuest learning={learning.data} phase={state.phase} onSubmit={learning.act} busy={learning.busy} error={learning.error}/>}

    {state.dgp_version==='zip_dgp_2026'&&['rector','survey','causal'].includes(state.phase)?<DeanCausalAtlas phase={state.phase}/>:state.phase!=='exams'?<DeanGuidance phase={state.phase}/>:<details className="dean-player-hint"><summary>💡 ¿Qué estoy descubriendo?</summary><DeanGuidance phase={state.phase}/></details>}
    {state.phase==='lobby'&&<div className="dean-hero"><h2>🛡️ Reúne a tu escuadrón</h2><p>El facilitador abrirá la temporada de exámenes.</p></div>}
    {state.phase==='exams'&&<><Exam person={me} version={state.dgp_version} deadline={state.exam_deadline_at} serverNow={state.server_now} receivedAt={state._receivedAt} onSubmit={submit}/>{Number(me.completed)<15&&<button type="button" className="dean-quick-complete" disabled={busy} onClick={quickComplete}>⚡ Simular mis exámenes restantes · OPCIONAL</button>}</>}
    {state.dgp_version==='zip_dgp_2026'&&state.phase==='exams'&&<DeanLearningQuest learning={learning.data} phase={state.phase} onSubmit={learning.act} busy={learning.busy} error={learning.error}/>}
    <DeanCausalLab phase={state.phase} token={token} version={state.dgp_version}/>
    {state.phase==='final'&&<CupQuiz role="student" token={token}/>}
    {['rector','survey','causal','final','finished'].includes(state.phase)&&<div className="dean-download"><h2>📦 Evidencia del semestre</h2><p>Datos sintéticos de tu partida; nunca datos de personas reales.</p><button onClick={()=>download('rector')} disabled={busy}>📥 Archivo del Rector · CSV</button>{['survey','causal','final','finished'].includes(state.phase)&&<button onClick={()=>download('survey')} disabled={busy}>📥 Encuesta de Hábitos · CSV</button>}{state.dgp_version==='zip_dgp_2026'&&['causal','final','finished'].includes(state.phase)&&<button onClick={downloadAB} disabled={busy}>📥 Experimento A/B observado · CSV</button>}</div>}
    {lastAward&&<div key={lastAward.nonce} className="dean-score-flash" role="status">✨ EXAMEN COMPLETADO <strong>+{Number.isFinite(lastAward.score)?lastAward.score.toFixed(1):'—'} / 50</strong></div>}
   </div>
   <div className="dean-player-dock"><span>🏆 {state.dgp_version==='zip_dgp_2026'?'DGP canónico · 2026':'COPA HISTÓRICA · FÓRMULA ORIGINAL'}</span><a className="dean-notebook-link" href="./notebooks/causalidad_copa_decano_scaffold.ipynb" download>📓 Cuaderno Python / Colab <span aria-hidden="true">↗</span></a></div>
  </main>}
 {(error||actionError)&&<p className="dean-error" role="alert">{error||actionError}</p>}</div>;
}
function Wall(){const {value,error}=useBoard();const learning=useDeanLearning({gameCode:code});return <div className="dean-page dean-wall"><Banner kind="WALL · PROYECCIÓN" phase={value?.phase}/>{value?.available?<main className="dean-wall-main">
 <div className="dean-wall-head"><h2>¿Qué sala dominará el semestre?</h2><span>🏆 5 SALAS · MARCADOR EN VIVO</span></div>
 <div className="dean-wall-grid"><Board groups={value.groups}/><aside className="dean-wall-story"><DeanLearningWall learning={learning.data} phase={value.phase}/>
 {value.phase==='final'&&<CupQuiz role="wall"/>}
 {value.dgp_version==='zip_dgp_2026'&&['rector','survey','causal'].includes(value.phase)?<DeanCausalAtlas phase={value.phase}/>:<DeanGuidance phase={value.phase} role="wall"/>}
 </aside></div>
 </main>:<main className="dean-hero"><h2>🎓 Esperando la Copa del Decano</h2></main>}{error&&<p className="dean-error" role="alert">{error}</p>}</div>}
function Teacher(){
 const requestedGame=(new URLSearchParams(location.search).get('game')||sessionStorage.getItem('df_facilitator_game_code')||code).trim().toUpperCase();
 const [abSummary,setAbSummary]=useState(null);
 const [teacher,setTeacher]=useState(()=>sessionStorage.getItem('df_facilitator_game_code')===requestedGame?(sessionStorage.getItem('df_facilitator_token')||''):''),[game,setGame]=useState(requestedGame),[pin,setPin]=useState(''),[state,setState]=useState(null),[err,setErr]=useState(''),[busy,setBusy]=useState(false);
 const {value:board}=useBoard('',!!teacher,game);
 const learning=useDeanLearning({gameCode:game,enabled:!!teacher,teacherToken:teacher});
 useEffect(()=>{if(teacher)setState(board)},[teacher,board]);
 async function login(){setBusy(true);setErr('');try{const base=endpoint.replace(/\/v2-dean-cup$/,'');const r=await fetch(base+'/facilitator-login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({game_code:game.toUpperCase(),pin})}),o=await r.json();if(!r.ok)throw Error(o.error||'PIN inválido');sessionStorage.setItem('df_facilitator_token',o.token);sessionStorage.setItem('df_facilitator_game_code',game.toUpperCase());setTeacher(o.token)}catch(e){setErr(e.message)}finally{setBusy(false)}}
 async function direct(command){setBusy(true);setErr('');try{setState(await call('teacher',{command},'',teacher))}catch(e){setErr(e.message)}finally{setBusy(false)}}
 async function startAB(){setBusy(true);setErr('');try{const summary=await call('ab_generate',{},'',teacher);setAbSummary(summary)}catch(e){setErr(e.message)}finally{setBusy(false)}}
 async function downloadABTruth(){setBusy(true);setErr('');try{const blob=await call('ab_truth',{},'',teacher),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='cohorte_ab_doctor_strange.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),7000)}catch(e){setErr(e.message)}finally{setBusy(false)}}
 async function downloadTruth(){setBusy(true);setErr('');try{const blob=await call('teacher_truth',{},'',teacher),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='verdad_sintetica_docente.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),7000)}catch(e){setErr(e.message)}finally{setBusy(false)}}
 const actions={lobby:'Abrir los 15 exámenes',exams:'Terminar torneo · liberar Rector',rector:'Publicar encuesta',survey:'Revelar la trampa causal',causal:'Comenzar Kahoot',final:'Cerrar torneo al terminar Kahoot'};
 return <div className="dean-page dean-teacher-page"><Banner kind="FACILITADOR" phase={state?.phase}/>{!teacher?<main className="dean-join"><h2>Consola de la Copa del Decano</h2><p>Usa el código y PIN docente de V2. El nuevo torneo admite hasta 30 jugadores, sin asistencia mínima ni afectar la versión anterior.</p><label className="dean-label">Código<input value={game} onChange={e=>setGame(e.target.value.toUpperCase())}/></label><label className="dean-label">PIN<input type="password" value={pin} onChange={e=>setPin(e.target.value)}/></label><button className="dean-big" onClick={login} disabled={busy||!pin}>Entrar</button></main>:
 <main className="dean-teacher">
 <div className="dean-teacher-toolbar"><div><small>🎛️ PANEL DEL CAPACITADOR · 120 MINUTOS</small><h2>Control de sesión</h2></div>
 {state?.available&&actions[state.phase]&&<button className="dean-big dean-teacher-next"
 disabled={busy||(state.dgp_version==='zip_dgp_2026'&&['lobby','exams','rector','survey','causal'].includes(state.phase)&&learning.data?.step!=='debrief')}
 title={learning.data?.step!=='debrief'?'Antes de avanzar, proyecta evidencia y revela la conclusión del acto.':''}
 onClick={()=>direct('next')}>{busy?'Actualizando…':actions[state.phase]} →</button>}</div>
 {state?.available?<div className="dean-teacher-grid">
 <Board groups={state.groups}/>
 <aside className="dean-teacher-sidebar">
  {state.dgp_version==='zip_dgp_2026'&&<DeanLearningInstructor learning={learning.data} phase={state.phase}
    busy={learning.busy} error={learning.error} onAction={command=>learning.act({action:'learning_teacher',command})}/>}
  <DeanLearningWall learning={learning.data} phase={state.phase}/>
  {state.phase==='final'&&<CupQuiz role="teacher" teacher={teacher} gameCode={game}/>}
  {state.dgp_version==='zip_dgp_2026'&&['rector','survey','causal'].includes(state.phase)?<DeanCausalAtlas phase={state.phase}/>:<DeanGuidance phase={state.phase} role="teacher"/>}
  <a className="dean-notebook-link" href="./notebooks/causalidad_copa_decano_scaffold.ipynb" download>📓 Cuaderno Colab · Copa ↗</a>
  {state.dgp_version==='zip_dgp_2026'&&['causal','final','finished'].includes(state.phase)&&<div className="dean-lab">
    <h3>🧬 Experimento A/B · 30 × 15</h3>
    <p>Asignación por estudiante; políticas B=0 y B=4 h. IC calculado entre estudiantes.</p>
    <button type="button" disabled={busy} onClick={startAB}>🧪 Generar/revisar A/B</button>
    {abSummary&&<p role="status"><b>ATE observado: {abSummary.observed_ate} pt</b> · IC 95 % [{abSummary.ci95_low}, {abSummary.ci95_high}] · Verdad sintética docente: {abSummary.true_ate} pt.</p>}
    <button type="button" disabled={busy} onClick={downloadABTruth}>🔒 Exportar contrafactuales · docente</button>
   </div>}
  {['causal','final','finished'].includes(state.phase)&&<button className="dean-big dean-teacher-truth" disabled={busy} onClick={downloadTruth}>🔒 Descargar fatiga oculta</button>}
  <div className="dean-actions"><a href={'./dean-play.html?game='+game} target="_blank" rel="noreferrer">↗ Estudiantes</a><a href={'./dean-wall.html?game='+game} target="_blank" rel="noreferrer">↗ Wall / proyección</a></div>
 </aside></div>:
 <div className="dean-hero"><h2>Crear Copa para cinco salas</h2><p>La creación es aditiva y no reinicia ninguna ronda de V1 ni de FUTUROS.</p><button className="dean-big" disabled={busy} onClick={()=>direct('create')}>Crear torneo V2</button></div>}</main>}
 {err&&<p role="alert" className="dean-error">{err}</p>}</div>;
}
const role=document.body.dataset.role||'student';
createRoot(document.getElementById('root')).render(role==='teacher'?<Teacher/>:role==='wall'?<Wall/>:<Player/>);
