import React,{useState} from 'react';
import DeanCausalAtlas from '../../DeanCausalAtlas.jsx';
import{call,code,hexToken,storageKey}from'../api.js';
import{icons,names,profiles}from'../constants.js';
import{useBoard}from'../useBoard.js';
import DeanShell from'../Shell.jsx';
import Board from'../Board.jsx';
import Exam from'../Exam.jsx';
import CupQuiz from'../CupQuiz.jsx';
import DeanCausalLab from'../CausalLab.jsx';
import DeanGuidance from'../Guidance.jsx';
import'./player.css';

export default function Player(){
 const [token,setToken]=useState(localStorage.getItem(storageKey)||'');
 const {value:state,error,setValue}=useBoard(token),[alias,setAlias]=useState(''),[room,setRoom]=useState(1),[busy,setBusy]=useState(false),[actionError,setActionError]=useState('');
 const me=state?.mine;
 async function join(){setBusy(true);setActionError('');const t=token||hexToken();localStorage.setItem(storageKey,t);
 try{const s=await call('join',{game_code:code,alias:alias.trim(),room},t);setToken(t);setValue(s)}catch(e){setActionError(e.message)}finally{setBusy(false)}}
 async function submit(v){const r=await call('exam',v,token);setValue(await call('state',{game_code:code},token));return r}
 async function quickComplete(){if(!window.confirm('¿Simular los exámenes restantes usando la estrategia predeterminada de tu arquetipo? Los registros quedarán marcados como simulados automáticamente.'))return;
 setBusy(true);setActionError('');try{await call('auto_finish',{},token);setValue(await call('state',{game_code:code},token))}
 catch(e){setActionError(e.message)}finally{setBusy(false)}}
 async function downloadAB(){setBusy(true);setActionError('');try{const blob=await call('ab_download',{},token),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='cohorte_ab_test_2026.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),7000)}catch(e){setActionError(e.message)}finally{setBusy(false)}}
 async function download(layer){setBusy(true);setActionError('');try{const blob=await call('export',{layer},token),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=layer==='rector'?'sistema_academico_rector.csv':'encuesta_estudiantes_juego.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),7000)}catch(e){setActionError(e.message)}finally{setBusy(false)}}
 const [drawer,setDrawer]=useState(false),[tab,setTab]=useState('lab'),[ctaEl,setCtaEl]=useState(null);
 useEffect(()=>{if(!drawer)return;const h=e=>{if(e.key==='Escape')setDrawer(false)};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[drawer]);
 const phase=state?.phase,zip=state?.dgp_version==='zip_dgp_2026',split=['rector','survey','causal'].includes(phase),inStage=['lobby','rector','survey','causal','finished'].includes(phase);
 useEffect(()=>{setTab(zip?'atlas':'lab')},[phase,zip]);
 const lastLayer=phase==='rector'?'rector':phase==='causal'&&zip?'ab':'survey';
 const primary=!me?null:phase==='exams'?<div className="dean-player-cta" ref={setCtaEl}/>:split?<button type="button" className="dean-big" data-dean-cta="primary" disabled={busy} onClick={()=>lastLayer==='ab'?downloadAB():download(lastLayer)}>{lastLayer==='rector'?'📥 Archivo del Rector · CSV':lastLayer==='ab'?'📥 Experimento A/B observado · CSV':'📥 Encuesta de Hábitos · CSV'}</button>:null;
 const joinCta=<button className="dean-big" type="button" data-dean-cta="primary" disabled={busy||alias.trim().length<2} onClick={join}>🚀 {busy?'Entrando…':'ENTRAR A LA COPA'}</button>;
 const actions=state?.available?<div className="dean-player-actions">{me?<>{primary}{phase==='exams'&&Number(me.completed)<15&&<button type="button" className="dean-secondary" disabled={busy} onClick={quickComplete}>⚡ Simular mis exámenes restantes · OPCIONAL</button>}<button type="button" className="dean-secondary dean-evidence-toggle" aria-expanded={drawer} aria-controls="dean-evidence" onClick={()=>setDrawer(o=>!o)}>📦 Evidencia</button></>:joinCta}</div>:null;
 const files=['rector','survey','causal','final','finished'].includes(phase)&&<div className="dean-download"><h2>📦 Evidencia del semestre</h2><p>Descarga los datos reales de tu partida sintética para el laboratorio causal. Nunca son datos personales reales.</p><button onClick={()=>download('rector')} disabled={busy}>📥 Archivo del Rector · CSV</button>{['survey','causal','final','finished'].includes(phase)&&<button onClick={()=>download('survey')} disabled={busy}>📥 Encuesta de Hábitos · CSV</button>}{zip&&['causal','final','finished'].includes(phase)&&<button onClick={downloadAB} disabled={busy}>📥 Experimento A/B observado · CSV</button>}</div>;
 const drawerPanel=me&&drawer?<div className="dean-player-drawer" id="dean-evidence" role="dialog" aria-label="Evidencia" data-dean-scroll="allowed"><button type="button" className="dean-drawer-close" onClick={()=>setDrawer(false)} aria-label="Cerrar evidencia">✕</button>
  <small className="dean-kicker">{zip?'DGP canónico del ZIP · fatiga latente 0–100':'Partida histórica: fórmula original preservada'}</small>
  <a className="dean-notebook-link" href="./notebooks/causalidad_copa_decano_scaffold.ipynb" download>📓 Descargar cuaderno Python · Rector, encuesta, Random Forest y A/B</a>
  {files}{!inStage&&<DeanGuidance phase={state.phase}/>}<Board groups={state.groups}/></div>:null;
 const guide=<DeanGuidance phase={state.phase}/>,lab=<DeanCausalLab phase={phase} token={token} version={state?.dgp_version}/>;
 return <DeanShell role="student" kind="PARTICIPANTE" phase={phase} groups={state?.groups} me={me} className="dean-player-shell" actions={actions} drawer={drawerPanel}>{!state?.available?<main className="dean-hero"><div className="dean-emoji">🎓</div><h2>Esperando al Decano</h2><p>El docente abrirá el torneo para quienes asistan (hasta 30). No necesitas instalar nada.</p></main>:!me?<main className="dean-join"><div><small className="dean-kicker">TEMPORADA 01 · HASTA 30 CUPOS</small><h2>🪪 Reclama tu carné y entra al torneo</h2><p>Elige una sala de Teams: hasta 6 plazas por equipo. No es necesario llenarlas. Recibirás un arquetipo académico ficticio.</p></div>
 <label className="dean-label">Tu alias<input value={alias} maxLength={30} onChange={e=>setAlias(e.target.value)} placeholder="Ej.: maria_ds"/></label>
 <div className="dean-rooms">{state.groups.map(g=><button key={g.room_no} type="button" disabled={g.members>=6} className={room===g.room_no?'active':''} aria-pressed={room===g.room_no} onClick={()=>setRoom(g.room_no)}><b>Grupo {g.room_no}</b><span>{names[g.room_no-1]}</span><small>{g.members}/6 plazas</small></button>)}</div></main>:
 <main className="dean-player" data-phase={phase}><div className="dean-carnet"><span aria-hidden="true">{icons[me.archetype]}</span><div className="dean-carnet-id"><small>ESTUDIANTE · SALA {me.room} {names[me.room-1]}</small><h2>{me.alias}</h2></div><p className="dean-chip">{profiles[me.archetype]} · PGA: <strong>{Number(me.pga).toFixed(1)}/5,0</strong></p></div>
 <div className="dean-scene" data-dean-scroll="allowed">
 {phase==='lobby'&&<>{guide}<div className="dean-hero"><h2>🛡️ Reúne a tu escuadrón</h2><p>El facilitador abrirá la temporada de exámenes.</p></div></>}
 {phase==='exams'&&<Exam person={me} version={state.dgp_version} deadline={state.exam_deadline_at} serverNow={state.server_now} receivedAt={state._receivedAt} onSubmit={submit} ctaTarget={ctaEl}/>}
 {split&&(zip?<><div className="dean-tabs" role="tablist"><button type="button" role="tab" aria-selected={tab==='atlas'} onClick={()=>setTab('atlas')}>🗺️ Atlas</button><button type="button" role="tab" aria-selected={tab==='lab'} onClick={()=>setTab('lab')}>🔬 Laboratorio</button></div>
  <div className="dean-split" data-tab={tab}><div className="dean-pane dean-pane-atlas" data-dean-scroll="allowed"><DeanCausalAtlas phase={phase}/></div><div className="dean-pane dean-pane-lab" data-dean-scroll="allowed">{lab}</div></div></>:guide)}
 {phase==='final'&&<CupQuiz role="student" token={token}/>}
 {phase==='finished'&&<div className="dean-split dean-split-end"><div className="dean-pane" data-dean-scroll="allowed">{guide}</div>{zip&&<div className="dean-pane" data-dean-scroll="allowed">{lab}</div>}</div>}
 </div></main>}
 {(error||actionError)&&<p className="dean-error" role="alert">{error||actionError}</p>}</DeanShell>;
}
