import React,{useEffect,useMemo,useState} from 'react';
import DeanCausalAtlas from '../../DeanCausalAtlas.jsx';
import{call,code,endpoint}from'../api.js';
import{useBoard}from'../useBoard.js';
import DeanShell from'../Shell.jsx';
import Board from'../Board.jsx';
import CupQuiz from'../CupQuiz.jsx';
import DeanGuidance from'../Guidance.jsx';
import'./teacher.css';

const TIMELINE=[
 {id:'lobby',label:'Bienvenida',minutes:'0–15'}, {id:'exams',label:'Exámenes',minutes:'15–30'},
 {id:'rector',label:'Rector',minutes:'30–55'}, {id:'survey',label:'Encuesta',minutes:'55–80'},
 {id:'causal',label:'Causalidad',minutes:'80–105'}, {id:'final',label:'Kahoot',minutes:'105–115'},
 {id:'finished',label:'Cierre',minutes:'115–120'}
];
const ACTIONS={lobby:'Abrir los 15 exámenes',exams:'Terminar torneo · liberar Rector',rector:'Publicar encuesta',survey:'Revelar la trampa causal',causal:'Comenzar Kahoot',final:'Cerrar torneo al terminar Kahoot'};
const NEXT_EXPLANATION={lobby:'Las salas podrán comenzar los 15 exámenes.',exams:'Se cerrará el examen y se habilitará la escena del Rector.',rector:'Se publicarán los datos de la encuesta para las salas.',survey:'Se revelará la escena causal y sus variables adicionales.',causal:'Se abrirá el Kahoot sincronizado para toda la clase.',final:'Se cerrará el torneo y quedará disponible el podio.'};

export function TeacherTimeline({phase='lobby',onAdvance,disabled=false}){
 const current=TIMELINE.findIndex(item=>item.id===phase);
 return <section className="teacher-timeline" data-testid="teacher-timeline" aria-label="Línea de tiempo docente">
  <div className="teacher-timeline-heading"><div><span className="teacher-eyebrow">RUTA DE LA CLASE</span><h3>120 minutos · siete fases</h3></div><span className="teacher-timeline-progress">{current<0?1:current+1} / {TIMELINE.length}</span></div>
  <ol>{TIMELINE.map((item,index)=><li key={item.id} className={index===current?'current':index<current?'done':''} aria-current={index===current?'step':undefined}><span className="teacher-timeline-dot"/><span><b>{item.label}</b><small>{item.minutes} min</small></span></li>)}</ol>
  <button type="button" className="teacher-advance" data-dean-cta="primary" onClick={onAdvance} disabled={disabled||phase==='finished'}>{phase==='finished'?'Sesión finalizada':ACTIONS[phase]||'Avanzar fase'} <span aria-hidden="true">→</span></button>
 </section>
}

export default function Teacher(){
 const requestedGame=(new URLSearchParams(location.search).get('game')||sessionStorage.getItem('df_facilitator_game_code')||code).trim().toUpperCase();
 const [abSummary,setAbSummary]=useState(null),[tab,setTab]=useState('script');
 const [teacher,setTeacher]=useState(()=>sessionStorage.getItem('df_facilitator_game_code')===requestedGame?(sessionStorage.getItem('df_facilitator_token')||''):''),[game,setGame]=useState(requestedGame),[pin,setPin]=useState(''),[state,setState]=useState(null),[err,setErr]=useState(''),[busy,setBusy]=useState(false);
 const {value:board}=useBoard('',!!teacher,game);
 useEffect(()=>{if(teacher)setState(board)},[teacher,board]);
 async function login(){setBusy(true);setErr('');try{const base=endpoint.replace(/\/v2-dean-cup$/,'');const r=await fetch(base+'/facilitator-login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({game_code:game.toUpperCase(),pin})}),o=await r.json();if(!r.ok)throw Error(o.error||'PIN inválido');sessionStorage.setItem('df_facilitator_token',o.token);sessionStorage.setItem('df_facilitator_game_code',game.toUpperCase());setTeacher(o.token)}catch(e){setErr(e.message)}finally{setBusy(false)}}
 async function direct(command){if(!window.confirm(`Antes de avanzar: ${NEXT_EXPLANATION[state?.phase]||'Cambiará la fase activa.'}\n\n¿Continuar?`))return;setBusy(true);setErr('');try{setState(await call('teacher',{command},'',teacher))}catch(e){setErr(e.message)}finally{setBusy(false)}}
 async function startAB(){setBusy(true);setErr('');try{const summary=await call('ab_generate',{},'',teacher);setAbSummary(summary)}catch(e){setErr(e.message)}finally{setBusy(false)}}
 async function downloadABTruth(){if(!window.confirm('Los contrafactuales muestran información reservada para la discusión docente. ¿Exportarlos?'))return;setBusy(true);setErr('');try{const blob=await call('ab_truth',{},'',teacher),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='cohorte_ab_doctor_strange.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),7000)}catch(e){setErr(e.message)}finally{setBusy(false)}}
 async function downloadTruth(){if(!window.confirm('La fatiga oculta es material reservado para el docente y no se entrega al estudiante. ¿Exportarla?'))return;setBusy(true);setErr('');try{const blob=await call('teacher_truth',{},'',teacher),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='verdad_sintetica_docente.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),7000)}catch(e){setErr(e.message)}finally{setBusy(false)}}
 const phase=state?.phase||'lobby';
 const attendance=state?.registered_players??state?.groups?.reduce((sum,g)=>sum+(Number(g.members)||0),0)??0;
 const tabs=useMemo(()=>({script:'Guion',dag:'DAG','data':'Datos y A/B',kahoot:'Kahoot',exports:'Exportaciones docentes'}),[]);
 const advance=<TeacherTimeline phase={phase} onAdvance={()=>direct('next')} disabled={busy}/>;
 return <DeanShell role="teacher" kind="FACILITADOR" phase={state?.phase} groups={state?.groups} actions={teacher&&state?.available?advance:null}>{!teacher?<main className="dean-join"><h2>Consola de la Copa del Decano</h2><p>Usa el código y PIN docente de V2. El nuevo torneo admite hasta 30 jugadores, sin asistencia mínima ni afectar la versión anterior.</p><label className="dean-label">Código<input value={game} onChange={e=>setGame(e.target.value.toUpperCase())}/></label><label className="dean-label">PIN<input type="password" value={pin} onChange={e=>setPin(e.target.value)}/></label><button className="dean-big" data-dean-cta="primary" onClick={login} disabled={busy||!pin}>Entrar</button></main>:
 <main className="dean-teacher"><div className="teacher-console-head"><div><span className="teacher-eyebrow">FACILITADOR · COPA DEL DECANO</span><h2>🎛️ Control de sesión · 120 minutos</h2></div><div className="teacher-attendance" aria-label="Resumen de asistencia"><b>{attendance} / {state?.max_players||30}</b><span>asistentes registrados</span><small>{state?.groups?.filter(g=>g.members>0).length||0} salas activas · sin mínimo</small></div></div>
   {state?.available&&<><div className="teacher-tabs" role="tablist" aria-label="Herramientas docentes">{Object.entries(tabs).map(([id,label])=><button key={id} type="button" role="tab" aria-selected={tab===id} className={tab===id?'selected':''} onClick={()=>setTab(id)}>{label}</button>)}</div>
   <section className="teacher-panel" role="tabpanel">
    {tab==='script'&&<><DeanGuidance phase={phase} role="teacher"/>{state.dgp_version==='zip_dgp_2026'&&['rector','survey','causal'].includes(phase)&&<DeanCausalAtlas phase={phase}/>}</>}
    {tab==='dag'&&<DeanCausalAtlas phase={['rector','survey','causal'].includes(phase)?phase:'causal'}/>}
    {tab==='data'&&<><h3>Datos y A/B</h3><p>Compara la observación del torneo con un experimento sintético independiente. La estimación usa incertidumbre entre estudiantes.</p>{state.dgp_version==='zip_dgp_2026'&&['causal','final','finished'].includes(phase)&&<><button type="button" disabled={busy} onClick={startAB}>🧪 Generar/revisar A/B reproducible</button>{abSummary&&<p role="status"><b>ATE observado: {abSummary.observed_ate} pt</b> · IC 95 % [{abSummary.ci95_low}, {abSummary.ci95_high}] · Verdad sintética docente: {abSummary.true_ate} pt.</p>}</>}</>}
    {tab==='kahoot'&&<>{phase==='final'?<CupQuiz role="teacher" teacher={teacher} gameCode={game}/>:<><h3>Kahoot</h3><p>El Kahoot se habilitará al cerrar la escena causal. Prepara una explicación breve después de cada respuesta.</p></>}</>}
    {tab==='exports'&&<><h3>Exportaciones docentes</h3><p>Estos archivos contienen información reservada para la facilitación y no se muestran a estudiantes.</p>{state.dgp_version==='zip_dgp_2026'&&['causal','final','finished'].includes(phase)&&<button type="button" disabled={busy} onClick={downloadABTruth}>🔒 Exportar contrafactuales (solo docente)</button>}{['causal','final','finished'].includes(phase)&&<button className="teacher-export-danger" disabled={busy} onClick={downloadTruth}>🔒 Exportar fatiga oculta (solo docente)</button>}</>}
   </section><a className="dean-notebook-link" href="./notebooks/causalidad_copa_decano_scaffold.ipynb" download>📓 Cuaderno Colab de la capacitación (datos de la Copa)</a><Board groups={state.groups}/><div className="dean-actions"><a href={'./dean-play.html?game='+game} target="_blank" rel="noreferrer">Estudiantes</a><a href={'./dean-wall.html?game='+game} target="_blank" rel="noreferrer">Wall</a></div></>:
   <div className="dean-hero"><h2>Crear Copa para cinco salas</h2><p>La creación es aditiva y no reinicia ninguna ronda de V1 ni de FUTUROS.</p><button className="dean-big" data-dean-cta="primary" disabled={busy} onClick={()=>direct('create')}>Crear torneo V2</button></div>}</main>}
 {err&&<p role="alert" className="dean-error">{err}</p>}</DeanShell>;
}
