import React,{useEffect,useMemo,useState} from 'react';
import './dean-science.css';
import {NOTE_MAX_LENGTH,RECOMMENDATIONS,SYNTHETIC_LABEL,TRAP_MODES,abEstimate,browserStorage,contrastPrediction,
 readTrapNotes,saveTrapRecommendation} from './dean-predictive-trap.js';

const MODE_TITLE={rector:'Tu simulación con el modelo del Rector (3 variables)',survey:'Tu simulación con el modelo ampliado (estudio y sueño congelados)'};
const signed=v=>(v>=0?'+':'')+v.toFixed(2);

// Paso «anota tu recomendación»: nota personal, no puntúa y no sale del navegador.
export function TrapRecommendation({mode,gameCode,result}){
 const storage=useMemo(browserStorage,[]);
 const [choice,setChoice]=useState(''),[note,setNote]=useState(''),[saved,setSaved]=useState(false);
 useEffect(()=>{
  const rec=readTrapNotes(storage,gameCode)[mode]?.recommendation;
  setChoice(rec?.choice||'');setNote(rec?.note||'');setSaved(Boolean(rec));
 },[storage,gameCode,mode,result]);
 if(!result)return null;
 function save(){setSaved(Boolean(saveTrapRecommendation(storage,gameCode,mode,{choice,note})))}
 return <div className="dean-trap-note" aria-label="Tu recomendación al Rector">
  <strong>📝 {mode==='rector'?'¿Qué le recomiendas al Rector con este modelo?':'¿Cambia tu recomendación con el modelo ampliado?'}</strong>
  <small>Efecto simulado: <b>{signed(result.ate_sim)} pts</b> (rango bootstrap {signed(result.p10)} a {signed(result.p90)}). {SYNTHETIC_LABEL}</small>
  <div className="dean-trap-options" role="group" aria-label="Recomendación sobre el presupuesto de bienestar">
   {RECOMMENDATIONS.map(r=><button type="button" key={r.id} aria-pressed={choice===r.id}
    onClick={()=>{setChoice(r.id);setSaved(false)}}><b>{r.label}</b><small>{r.hint}</small></button>)}
  </div>
  <label>Tu razón en una frase (opcional)
   <textarea rows={2} maxLength={NOTE_MAX_LENGTH} value={note} onChange={e=>{setNote(e.target.value);setSaved(false)}}
    placeholder="Ej.: B casi no pesa en el modelo, pero ¿quién eligió su B?"/>
  </label>
  <button type="button" className="dean-trap-save" disabled={!choice} onClick={save}>{saved?'✓ Guardada':'Guardar mi recomendación'}</button>
  <small role="status">{saved?'Guardada solo en este navegador. En el acto A/B la compararás con el experimento.':'Nota personal: no puntúa, no mide velocidad y no se envía al servidor.'}</small>
 </div>;
}

function ContrastRange({c,p}){
 const low=Math.min(c.ciLow,p.p10,c.predicted,c.observed)-1,high=Math.max(c.ciHigh,p.p90,c.predicted,c.observed)+1;
 const x=v=>16+(v-low)/Math.max(high-low,1e-6)*408;
 return <svg className="dean-trap-range" viewBox="0 0 440 92" role="img"
  aria-label={'Escala de puntos: IC95 del experimento de '+signed(c.ciLow)+' a '+signed(c.ciHigh)+', ATE observado '+signed(c.observed)+', simulación del Random Forest '+signed(c.predicted)+'.'}>
  <line x1="16" x2="424" y1="62" y2="62" stroke="#6f9aa8" strokeWidth="1.5"/>
  {low<0&&high>0&&<><line x1={x(0)} x2={x(0)} y1="14" y2="70" stroke="#d5e4f0" strokeDasharray="3 3" opacity=".7"/><text x={x(0)} y="84" textAnchor="middle" fontSize="11" fill="#d5e4f0">0</text></>}
  <rect x={x(c.ciLow)} y="40" width={Math.max(2,x(c.ciHigh)-x(c.ciLow))} height="20" rx="4" fill="#3f8d86" opacity=".55"/>
  <line x1={x(c.observed)} x2={x(c.observed)} y1="34" y2="66" stroke="#f6d281" strokeWidth="3"/>
  <line x1={x(p.p10)} x2={x(p.p90)} y1="22" y2="22" stroke="#ffb3a3" strokeWidth="3"/>
  <circle cx={x(c.predicted)} cy="22" r="6" fill="#ff8d7a" stroke="#fff" strokeWidth="1.5"/>
 </svg>;
}

// Tarjeta del acto A/B: predicción «do(B)» del participante frente al ATE del experimento.
export function DeanPredictiveContrast({rows=[],gameCode,step='evidence'}){
 const ab=useMemo(()=>abEstimate(rows),[rows]);
 const notes=useMemo(()=>readTrapNotes(browserStorage(),gameCode),[gameCode,rows]);
 const entries=TRAP_MODES.filter(mode=>notes[mode].prediction);
 return <section className="dean-causal-mission dean-trap-contrast" aria-label="Contraste entre tu simulación predictiva y el experimento">
  <div className="dean-mission-story"><strong>🔮 TU PREDICCIÓN FRENTE AL EXPERIMENTO</strong>
   <span>¿Lo que el Random Forest «simuló» como do(B) se parece a lo que midió el A/B aleatorizado?</span></div>
  {!ab&&<p>Todavía no hay suficientes estudiantes por brazo para calcular el ATE y su intervalo.</p>}
  {ab&&!entries.length&&<p>Aún no guardaste una simulación. Pulsa <b>1 · Analizar Rector</b> o <b>2 · Cruzar encuesta</b>, ejecuta el Python real y vuelve aquí: el contraste aparecerá automáticamente.</p>}
  {ab&&entries.map(mode=>{
   const p=notes[mode].prediction,c=contrastPrediction(p,ab),rec=notes[mode].recommendation;
   if(!c)return null;
   const chosen=RECOMMENDATIONS.find(r=>r.id===rec?.choice);
   return <article key={mode} className="dean-trap-card">
    <h3>{MODE_TITLE[mode]}</h3>
    <div className="dean-ab-numbers">
     <div><small>Simulación RF · B=4 − B=0</small><strong>{signed(c.predicted)}</strong><span>Rango bootstrap [{signed(p.p10)}, {signed(p.p90)}] · {p.origen==='sala'?'datos de tu sala':'referencia didáctica'}</span></div>
     <div><small>ATE del experimento A/B</small><strong>{signed(c.observed)}</strong><span>IC95 entre estudiantes [{signed(c.ciLow)}, {signed(c.ciHigh)}]</span></div>
     <div><small>Diferencia (simulación − A/B)</small><strong>{signed(c.gap)}</strong><span>{c.sameSign?'Mismo signo':'Signos distintos'} · {c.inside?'dentro del IC95':'fuera del IC95'}</span></div>
    </div>
    <ContrastRange c={c} p={p}/>
    <small className="dean-trap-legend">🔴 simulación del bosque (línea: rango bootstrap) · 🟨 ATE observado en el A/B · 🟩 banda: IC95 del A/B</small>
    <p><b>{c.verdict}</b></p>
    {c.frozenNote&&<p>{c.frozenNote}</p>}
    {c.referenceNote&&<p className="dean-mission-source">{c.referenceNote}</p>}
    {chosen?<p>📝 Tu recomendación anotada: <b>{chosen.label}</b>{rec.note?<> — «{rec.note}»</>:null}. ¿Qué parte de esa decisión dependía de un efecto que solo el experimento puede identificar?</p>
     :<p className="dean-mission-source">No anotaste recomendación en este paso; puedes volver a ejecutar el laboratorio y guardarla.</p>}
   </article>;
  })}
  <small className="dean-mission-source">{SYNTHETIC_LABEL} El A/B usa 30 estudiantes sintéticos con asignación aleatoria por estudiante; la simulación es una predicción observacional. {step==='debrief'?'Con el cierre docente puedes comparar además con el ATE sintético de la cohorte de referencia del ZIP (otra cohorte).':'La verdad sintética se revela solo tras el cierre docente.'}</small>
 </section>;
}
