import React,{useEffect,useState} from 'react';
import{createRoot}from'react-dom/client';
import './dean-cup.css';
const endpoint=(import.meta.env.VITE_FUNCTIONS_BASE_URL||'').replace(/\/$/,'')+'/v2-dean-cup';
const names=['Alpha','Beta','Gamma','Delta','Épsilon'];
const icons={over:'🧠',balanced:'🏃',risk:'🧩',pragmatic:'🏖️'};
const profiles={over:'Sobreexigido',balanced:'Equilibrado',risk:'En riesgo',pragmatic:'Pragmático'};
const limits={over:[[5,14,10],[1,5,3.5],[0,3,1]],balanced:[[2,9,6],[6,9,7.5],[1,6,3.5]],risk:[[2,9,5],[4,7.5,5.5],[0,4,1]],pragmatic:[[0,5,2],[6.5,10,8.5],[0,5,2.5]]};
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
 if((action==='export'||action==='teacher_truth')&&r.ok)return r.blob();
 const data=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(data.error||'Fallo de conexión');
 return data;
}
function useBoard(token='',enabled=true,gameCode=code){
 const [value,setValue]=useState(null),[error,setError]=useState('');
 useEffect(()=>{
  if(!enabled)return;
  let dead=false,t;
  async function poll(){try{const s=await call('state',{game_code:gameCode},token);if(!dead){setValue(s);setError('')}}catch(e){if(!dead)setError(e.message)}
  if(!dead)t=setTimeout(poll,2700+Math.random()*1300)}
  poll();return()=>{dead=true;clearTimeout(t)}
 },[token,enabled,gameCode]);
 return{value,error,setValue};
}
function Banner({kind,phase}){return <header className="dean-banner"><div><small>DOS FUTUROS · CAMPUS V2</small><h1>🏆 LA COPA DEL DECANO</h1></div><div className="dean-banner-meta"><span>{kind}</span><b>{phase||'PREPARACIÓN'}</b><small>5 SALAS · 30 PARTICIPANTES · 15 EXÁMENES</small></div></header>}
function Board({groups=[]}){
 const rows=[...groups].sort((a,b)=>Number(b.average_score??-1)-Number(a.average_score??-1)||a.room_no-b.room_no);
 return <section className="dean-board"><h2>🏆 Clasificación en vivo</h2><p>Nota media /50 · Posiciones provisionales mientras falten exámenes</p>
 {rows.map((g,i)=><article key={g.room_no}><div className="dean-medal">{['🥇','🥈','🥉'][i]||'#'+(i+1)}</div><div className="dean-board-main"><b>Grupo {g.room_no} · {names[g.room_no-1]}</b><span>{g.members}/6 estudiantes · {g.exams_completed}/90 exámenes</span><div className="dean-meter"><i style={{width:Math.min(100,(g.exams_completed||0)*100/90)+'%'}}/></div></div><div className="dean-rating"><strong>{g.average_score==null?'—':Number(g.average_score).toFixed(1)}</strong><small>{g.is_complete?'FINAL':'PROVISIONAL'}</small></div></article>)}
 </section>;
}
function Slider({label,units,min,max,value,onChange}){return <label className="dean-slider"><span><b>{label}</b><strong>{Number(value).toFixed(1)} h</strong></span><input type="range" min={min} max={max} step=".5" value={value} onChange={e=>onChange(Number(e.target.value))}/><small>{min}–{max} h · {units}</small></label>}
function Exam({person,onSubmit}){
 const n=Number(person.completed||0)+1,range=limits[person.archetype];
 const [s,setS]=useState(range[0][2]),[z,setZ]=useState(range[1][2]),[w,setW]=useState(range[2][2]);
 const [busy,setBusy]=useState(false),[err,setErr]=useState(''),[flash,setFlash]=useState(null);
 useEffect(()=>{setS(range[0][2]);setZ(range[1][2]);setW(range[2][2]);setFlash(null)},[n,person.archetype]);
 if(n>15)return <section className="dean-finish"><div className="dean-emoji">🎓</div><h2>¡Semestre completo!</h2><p>Ya entregaste los 15 exámenes. Apoya a tu equipo hasta llegar a los 90 registros.</p></section>;
 async function submit(){setBusy(true);setErr('');try{setFlash(await onSubmit({exam:n,study:s,sleep:z,wellness:w}))}catch(e){setErr(e.message)}finally{setBusy(false)}}
 return <section className="dean-exam"><div className="dean-kicker">ASIGNATURA {n} / 15</div><h2>📅 {courses[n-1]}</h2><div className="dean-meter"><i style={{width:(n-1)/15*100+'%'}}/></div>
 <h3>Elige tu estrategia</h3>
 <Slider label="📚 Horas de estudio" units="para este parcial" min={range[0][0]} max={range[0][1]} value={s} onChange={setS}/>
 <Slider label="😴 Sueño" units="la noche anterior" min={range[1][0]} max={range[1][1]} value={z} onChange={setZ}/>
 <Slider label="🏃 Bienestar" units="horas semanales" min={range[2][0]} max={range[2][1]} value={w} onChange={setW}/>
 <div className={'dean-state '+(z<6||s>9?'alert':'')}>{z<6||s>9?'⚠️ Puede acumularse fatiga simulada. Dormir poco no es una estrategia saludable.':'🟢 Condiciones de recuperación favorables en este mundo sintético.'}</div>
 <button className="dean-big" type="button" disabled={busy} onClick={submit}>{busy?'Evaluando…':'📝 RENDIR EXAMEN'}</button>
 {flash&&<p className="dean-grade" role="status">Nota guardada: <b>{Number(flash.score).toFixed(1)} / 50</b></p>}{err&&<p role="alert" className="dean-error">{err}</p>}
 </section>;
}

function CupQuiz({role='student',token='',teacher=''}) {
 const [data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[seconds,setSeconds]=useState(0),[receipt,setReceipt]=useState('');
 useEffect(()=>{let cancel=false,t;
 async function fetchState(){try{const value=await call('quiz_state',{game_code:code},token);if(!cancel){setData(value);setError('')}}catch(e){if(!cancel)setError(e.message)}
 if(!cancel)t=setTimeout(fetchState,1450+Math.random()*600)}
 fetchState();return()=>{cancel=true;clearTimeout(t)}},[role,token]);
 useEffect(()=>{const id=setInterval(()=>setSeconds(data?.deadline_at?Math.max(0,Math.ceil((Date.parse(data.deadline_at)-Date.now())/1000)):0),250);return()=>clearInterval(id)},[data?.deadline_at]);
 const commands={idle:['start','Iniciar batalla'],preview:['open','Abrir respuestas'],open:['lock','Cerrar respuestas'],locked:['reveal','Revelar y explicar'],reveal:['next',data?.question_no===8?'Mostrar podio':'Siguiente pregunta'],podium:['finish','Terminar batalla']};
 const action=async(command)=>{setBusy(true);setError('');try{setData(await call('quiz_teacher',{command,game_code:code},'',teacher))}catch(e){setError(e.message)}finally{setBusy(false)}};
 const answer=async(choice)=>{if(data?.mine||busy)return;setBusy(true);setError('');try{const r=await call('quiz_submit',{question:data.question_no,choice},token);setReceipt(r.choice);setData(await call('quiz_state',{game_code:code},token))}catch(e){setError(e.message)}finally{setBusy(false)}};
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
  <div className="dean-quiz-toolbar"><strong>{data?.received||0} / 30 respuestas</strong>{role==='student'&&<strong>{data?.my_points||0} / 120 puntos</strong>}
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
    "visual": "Cinco salas, seis personas por sala; la primera pregunta es si una nota alta equivale a una intervención exitosa."
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
    "student": "Descarga 90 exámenes de tu sala. Intenta anticipar notas y decide qué variables faltan.",
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

function Player(){
 const [token,setToken]=useState(localStorage.getItem(storageKey)||'');
 const {value:state,error,setValue}=useBoard(token),[alias,setAlias]=useState(''),[room,setRoom]=useState(1),[busy,setBusy]=useState(false),[actionError,setActionError]=useState('');
 const me=state?.mine;
 async function join(){setBusy(true);setActionError('');const t=token||hexToken();localStorage.setItem(storageKey,t);
 try{const s=await call('join',{game_code:code,alias:alias.trim(),room},t);setToken(t);setValue(s)}catch(e){setActionError(e.message)}finally{setBusy(false)}}
 async function submit(v){const r=await call('exam',v,token);setValue(await call('state',{game_code:code},token));return r}
 async function quickComplete(){if(!window.confirm('¿Simular los exámenes restantes usando la estrategia predeterminada de tu arquetipo? Los registros quedarán marcados como simulados automáticamente.'))return;
 setBusy(true);setActionError('');try{await call('auto_finish',{},token);setValue(await call('state',{game_code:code},token))}
 catch(e){setActionError(e.message)}finally{setBusy(false)}}
 async function download(layer){setBusy(true);setActionError('');try{const blob=await call('export',{layer},token),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=layer==='rector'?'sistema_academico_rector.csv':'encuesta_estudiantes_juego.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),7000)}catch(e){setActionError(e.message)}finally{setBusy(false)}}
 return <div className="dean-page"><Banner kind="PARTICIPANTE" phase={state?.phase}/>{!state?.available?<main className="dean-hero"><div className="dean-emoji">🎓</div><h2>Esperando al Decano</h2><p>El docente abrirá el torneo de 30 participantes. No necesitas instalar nada.</p></main>:!me?<main className="dean-join"><div><small className="dean-kicker">TEMPORADA 01 · 30 CUPOS</small><h2>🪪 Reclama tu carné y entra al torneo</h2><p>Elige una sala de Teams: 6 plazas por equipo. Recibirás un arquetipo académico ficticio.</p></div>
 <label className="dean-label">Tu alias<input value={alias} maxLength={30} onChange={e=>setAlias(e.target.value)} placeholder="Ej.: maria_ds"/></label>
 <div className="dean-rooms">{state.groups.map(g=><button key={g.room_no} type="button" disabled={g.members>=6} className={room===g.room_no?'active':''} aria-pressed={room===g.room_no} onClick={()=>setRoom(g.room_no)}><b>Grupo {g.room_no}</b><span>{names[g.room_no-1]}</span><small>{g.members}/6 plazas</small></button>)}</div><button className="dean-big" type="button" disabled={busy||alias.trim().length<2} onClick={join}>🚀 {busy?'Entrando…':'ENTRAR A LA COPA'}</button></main>:
 <main className="dean-player"><div className="dean-carnet"><span>{icons[me.archetype]}</span><div><small>ESTUDIANTE · SALA {me.room} {names[me.room-1]}</small><h2>{me.alias}</h2><p>{profiles[me.archetype]} · PGA: <strong>{Number(me.pga).toFixed(1)}/5,0</strong></p></div></div>
 <DeanGuidance phase={state.phase}/>
 {state.phase==='lobby'&&<div className="dean-hero"><h2>🛡️ Reúne a tu escuadrón</h2><p>El facilitador abrirá la temporada de exámenes.</p></div>}
 {state.phase==='exams'&&<><Exam person={me} onSubmit={submit}/>{Number(me.completed)<15&&<button type="button" className="dean-big" disabled={busy} onClick={quickComplete}>⚡ Simular mis exámenes restantes · OPCIONAL</button>}</>}
 {state.phase==='final'&&<CupQuiz role="student" token={token}/>} 
 {['rector','survey','causal','final','finished'].includes(state.phase)&&<div className="dean-download"><h2>📦 Evidencia del semestre</h2><p>Descarga los datos reales de tu partida sintética para el laboratorio causal. Nunca son datos personales reales.</p><button onClick={()=>download('rector')} disabled={busy}>📥 Archivo del Rector · CSV</button>{['survey','causal','final','finished'].includes(state.phase)&&<button onClick={()=>download('survey')} disabled={busy}>📥 Encuesta de Hábitos · CSV</button>}</div>}
 <Board groups={state.groups}/></main>}
 {(error||actionError)&&<p className="dean-error" role="alert">{error||actionError}</p>}</div>;
}
function Wall(){const {value,error}=useBoard();return <div className="dean-page dean-wall"><Banner kind="WALL · PROYECCIÓN" phase={value?.phase}/>{value?.available?<main><h2>¿Qué sala dominará el semestre?</h2><Board groups={value.groups}/><DeanGuidance phase={value.phase} role="wall"/>{value.phase==='final'&&<CupQuiz role="wall"/>}</main>:<main className="dean-hero"><h2>🎓 Esperando la Copa del Decano</h2></main>}{error&&<p className="dean-error">{error}</p>}</div>}
function Teacher(){
 const requestedGame=(new URLSearchParams(location.search).get('game')||sessionStorage.getItem('df_facilitator_game_code')||code).trim().toUpperCase();
 const [teacher,setTeacher]=useState(()=>sessionStorage.getItem('df_facilitator_game_code')===requestedGame?(sessionStorage.getItem('df_facilitator_token')||''):''),[game,setGame]=useState(requestedGame),[pin,setPin]=useState(''),[state,setState]=useState(null),[err,setErr]=useState(''),[busy,setBusy]=useState(false);
 const {value:board}=useBoard('',!!teacher,game);
 useEffect(()=>{if(teacher)setState(board)},[teacher,board]);
 async function login(){setBusy(true);setErr('');try{const base=endpoint.replace(/\/v2-dean-cup$/,'');const r=await fetch(base+'/facilitator-login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({game_code:game.toUpperCase(),pin})}),o=await r.json();if(!r.ok)throw Error(o.error||'PIN inválido');sessionStorage.setItem('df_facilitator_token',o.token);sessionStorage.setItem('df_facilitator_game_code',game.toUpperCase());setTeacher(o.token)}catch(e){setErr(e.message)}finally{setBusy(false)}}
 async function direct(command){setBusy(true);setErr('');try{setState(await call('teacher',{command},'',teacher))}catch(e){setErr(e.message)}finally{setBusy(false)}}
 async function downloadTruth(){setBusy(true);setErr('');try{const blob=await call('teacher_truth',{},'',teacher),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='verdad_sintetica_docente.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),7000)}catch(e){setErr(e.message)}finally{setBusy(false)}}
 const actions={lobby:'Abrir los 15 exámenes',exams:'Terminar torneo · liberar Rector',rector:'Publicar encuesta',survey:'Revelar la trampa causal',causal:'Comenzar Kahoot',final:'Cerrar torneo al terminar Kahoot'};
 return <div className="dean-page"><Banner kind="FACILITADOR" phase={state?.phase}/>{!teacher?<main className="dean-join"><h2>Consola de la Copa del Decano</h2><p>Usa el código y PIN docente de V2. El nuevo torneo admite 30 jugadores sin consumir cupos del modo anterior.</p><label className="dean-label">Código<input value={game} onChange={e=>setGame(e.target.value.toUpperCase())}/></label><label className="dean-label">PIN<input type="password" value={pin} onChange={e=>setPin(e.target.value)}/></label><button className="dean-big" onClick={login} disabled={busy||!pin}>Entrar</button></main>:
 <main className="dean-teacher"><h2>🎛️ Control de sesión · 120 minutos</h2>{state?.available?<><DeanGuidance phase={state.phase} role="teacher"/><Board groups={state.groups}/>{state.phase==='final'&&<CupQuiz role="teacher" teacher={teacher}/>} {['causal','final','finished'].includes(state.phase)&&<button className="dean-big" disabled={busy} onClick={downloadTruth}>🔒 DESCARGAR FATIGA OCULTA · SOLO DOCENTE</button>} {actions[state.phase]&&<button className="dean-big" disabled={busy} onClick={()=>direct('next')}>{actions[state.phase]}</button>}<div className="dean-actions"><a href={'./dean-play.html?game='+game} target="_blank" rel="noreferrer">Estudiantes</a><a href={'./dean-wall.html?game='+game} target="_blank" rel="noreferrer">Wall</a></div></>:
 <div className="dean-hero"><h2>Crear Copa para cinco salas</h2><p>La creación es aditiva y no reinicia ninguna ronda de V1 ni de FUTUROS.</p><button className="dean-big" disabled={busy} onClick={()=>direct('create')}>Crear torneo V2</button></div>}</main>}
 {err&&<p role="alert" className="dean-error">{err}</p>}</div>;
}
const role=document.body.dataset.role||'student';
createRoot(document.getElementById('root')).render(role==='teacher'?<Teacher/>:role==='wall'?<Wall/>:<Player/>);
