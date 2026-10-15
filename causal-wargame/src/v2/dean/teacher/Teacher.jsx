import React,{useEffect,useState} from 'react';
import DeanCausalAtlas from '../../DeanCausalAtlas.jsx';
import{call,code,endpoint}from'../api.js';
import{useBoard}from'../useBoard.js';
import DeanShell from'../Shell.jsx';
import Board from'../Board.jsx';
import CupQuiz from'../CupQuiz.jsx';
import DeanGuidance from'../Guidance.jsx';
import'./teacher.css';

export default function Teacher(){
 const requestedGame=(new URLSearchParams(location.search).get('game')||sessionStorage.getItem('df_facilitator_game_code')||code).trim().toUpperCase();
 const [abSummary,setAbSummary]=useState(null);
 const [teacher,setTeacher]=useState(()=>sessionStorage.getItem('df_facilitator_game_code')===requestedGame?(sessionStorage.getItem('df_facilitator_token')||''):''),[game,setGame]=useState(requestedGame),[pin,setPin]=useState(''),[state,setState]=useState(null),[err,setErr]=useState(''),[busy,setBusy]=useState(false);
 const {value:board}=useBoard('',!!teacher,game);
 useEffect(()=>{if(teacher)setState(board)},[teacher,board]);
 async function login(){setBusy(true);setErr('');try{const base=endpoint.replace(/\/v2-dean-cup$/,'');const r=await fetch(base+'/facilitator-login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({game_code:game.toUpperCase(),pin})}),o=await r.json();if(!r.ok)throw Error(o.error||'PIN inválido');sessionStorage.setItem('df_facilitator_token',o.token);sessionStorage.setItem('df_facilitator_game_code',game.toUpperCase());setTeacher(o.token)}catch(e){setErr(e.message)}finally{setBusy(false)}}
 async function direct(command){setBusy(true);setErr('');try{setState(await call('teacher',{command},'',teacher))}catch(e){setErr(e.message)}finally{setBusy(false)}}
 async function startAB(){setBusy(true);setErr('');try{const summary=await call('ab_generate',{},'',teacher);setAbSummary(summary)}catch(e){setErr(e.message)}finally{setBusy(false)}}
 async function downloadABTruth(){setBusy(true);setErr('');try{const blob=await call('ab_truth',{},'',teacher),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='cohorte_ab_doctor_strange.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),7000)}catch(e){setErr(e.message)}finally{setBusy(false)}}
 async function downloadTruth(){setBusy(true);setErr('');try{const blob=await call('teacher_truth',{},'',teacher),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='verdad_sintetica_docente.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),7000)}catch(e){setErr(e.message)}finally{setBusy(false)}}
 const actions={lobby:'Abrir los 15 exámenes',exams:'Terminar torneo · liberar Rector',rector:'Publicar encuesta',survey:'Revelar la trampa causal',causal:'Comenzar Kahoot',final:'Cerrar torneo al terminar Kahoot'};
 return <DeanShell role="teacher" kind="FACILITADOR" phase={state?.phase} groups={state?.groups}>{!teacher?<main className="dean-join"><h2>Consola de la Copa del Decano</h2><p>Usa el código y PIN docente de V2. El nuevo torneo admite hasta 30 jugadores, sin asistencia mínima ni afectar la versión anterior.</p><label className="dean-label">Código<input value={game} onChange={e=>setGame(e.target.value.toUpperCase())}/></label><label className="dean-label">PIN<input type="password" value={pin} onChange={e=>setPin(e.target.value)}/></label><button className="dean-big" data-dean-cta="primary" onClick={login} disabled={busy||!pin}>Entrar</button></main>:
 <main className="dean-teacher"><h2>🎛️ Control de sesión · 120 minutos</h2>{state?.available?<>{state.dgp_version==='zip_dgp_2026'&&['rector','survey','causal'].includes(state.phase)?<DeanCausalAtlas phase={state.phase}/>:<DeanGuidance phase={state.phase} role="teacher"/>}
 <a className="dean-notebook-link" href="./notebooks/causalidad_copa_decano_scaffold.ipynb" download>📓 Cuaderno Colab de la capacitación (datos de la Copa)</a><Board groups={state.groups}/>{state.phase==='final'&&<CupQuiz role="teacher" teacher={teacher} gameCode={game}/>}
 {state.dgp_version==='zip_dgp_2026'&&['causal','final','finished'].includes(state.phase)&&<div className="dean-lab">
   <h3>🧬 Experimento A/B de la especificación</h3>
   <p>30 estudiantes sintéticos × 15 exámenes; se sortea T una vez por estudiante y se comparan políticas B=0 vs. B=4 h. La estimación usa incertidumbre entre estudiantes.</p>
   <button type="button" disabled={busy} onClick={startAB}>🧪 Generar/revisar A/B reproducible</button>
   {abSummary&&<p role="status"><b>ATE observado: {abSummary.observed_ate} pt</b> · IC 95 % [{abSummary.ci95_low}, {abSummary.ci95_high}] · Verdad sintética docente: {abSummary.true_ate} pt.</p>}
   <button type="button" disabled={busy} onClick={downloadABTruth}>🔒 Exportar contrafactuales (solo docente)</button>
  </div>}
 {['causal','final','finished'].includes(state.phase)&&<button className="dean-big" disabled={busy} onClick={downloadTruth}>🔒 DESCARGAR FATIGA OCULTA · SOLO DOCENTE</button>} {actions[state.phase]&&<button className="dean-big" {...(state.phase!=='final'&&{'data-dean-cta':'primary'})} disabled={busy} onClick={()=>direct('next')}>{actions[state.phase]}</button>}<div className="dean-actions"><a href={'./dean-play.html?game='+game} target="_blank" rel="noreferrer">Estudiantes</a><a href={'./dean-wall.html?game='+game} target="_blank" rel="noreferrer">Wall</a></div></>:
 <div className="dean-hero"><h2>Crear Copa para cinco salas</h2><p>La creación es aditiva y no reinicia ninguna ronda de V1 ni de FUTUROS.</p><button className="dean-big" data-dean-cta="primary" disabled={busy} onClick={()=>direct('create')}>Crear torneo V2</button></div>}</main>}
 {err&&<p role="alert" className="dean-error">{err}</p>}</DeanShell>;
}
