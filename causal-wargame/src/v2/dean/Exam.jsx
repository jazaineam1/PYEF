import React,{useEffect,useState} from 'react';
import{createPortal}from'react-dom';
import{canonicalLimits,courses,limits,sourceSubjects}from'./constants.js';
import'./exam.css';

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

// ctaTarget: undefined = botón en línea; null = esperando destino; elemento = botón en ese contenedor (barra de acciones).
export default function Exam({person,onSubmit,version,deadline,serverNow,receivedAt,ctaTarget}){
 const canonical=version==='zip_dgp_2026';
 const n=Number(person.completed||0)+1,range=(canonical?canonicalLimits:limits)[person.archetype];
 const [s,setS]=useState(range[0][2]),[z,setZ]=useState(range[1][2]),[w,setW]=useState(range[2][2]);
 const [busy,setBusy]=useState(false),[err,setErr]=useState(''),[flash,setFlash]=useState(null);
 useEffect(()=>{setS(range[0][2]);setZ(range[1][2]);setW(range[2][2]);setFlash(null)},[n,person.archetype,canonical]);
 if(n>15)return <section className="dean-finish" data-testid="dean-exam"><div className="dean-emoji">🎓</div><h2>¡Semestre completo!</h2><p>Completaste tus 15 exámenes. Tu sala no necesita seis personas para avanzar.</p></section>;
 async function submit(){setBusy(true);setErr('');try{setFlash(await onSubmit({exam:n,study:s,sleep:z,wellness:w}))}catch(e){setErr(e.message)}finally{setBusy(false)}}
 const cta=<button className="dean-big" type="button" data-dean-cta="primary" disabled={busy} onClick={submit}>{busy?'Evaluando…':'📝 RENDIR EXAMEN'}</button>;
 return <section className="dean-exam" data-testid="dean-exam"><div className="dean-kicker">ASIGNATURA {n} / 15</div><h2>📅 {canonical?sourceSubjects[(n-1)%11]:courses[n-1]}</h2>{canonical&&<ExamCountdown deadline={deadline} serverNow={serverNow} receivedAt={receivedAt}/>}<div className="dean-meter"><i style={{width:(n-1)/15*100+'%'}}/></div>
 <h3>Elige tu estrategia</h3>
 <Slider label="📚 Horas de estudio" units="para este parcial" min={range[0][0]} max={range[0][1]} value={s} onChange={setS}/>
 <Slider label="😴 Sueño" units="la noche anterior" min={range[1][0]} max={range[1][1]} value={z} onChange={setZ}/>
 <Slider label="🏃 Bienestar" units="horas semanales" min={range[2][0]} max={range[2][1]} value={w} onChange={setW}/>
 <div className={'dean-state '+(z<6||s>9?'alert':'')}>{z<6||s>9?'⚠️ Puede acumularse fatiga simulada. Dormir poco no es una estrategia saludable.':'🟢 Condiciones de recuperación favorables en este mundo sintético.'}</div>
 {ctaTarget===undefined?cta:ctaTarget&&createPortal(cta,ctaTarget)}
 {flash&&<p className="dean-grade" role="status">Nota guardada: <b>{Number(flash.score).toFixed(1)} / 50</b></p>}{err&&<p role="alert" className="dean-error">{err}</p>}
 </section>;
}
