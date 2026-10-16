import React,{useState} from 'react';
import DeanArcadeMascot from './DeanArcadeMascot.jsx';
import DeanLifePodium from './DeanLifePodium.jsx';
import {CopaCorrelation} from './dean-correlation.jsx';
import './dean-arcade.css';

export const RECTOR_CHOICES=[
 {id:'si',icon:'✂️',label:'SÍ, QUITARLOS'},
 {id:'no',icon:'🛡️',label:'NO, MANTENERLOS'},
 {id:'evidencia_insuficiente',icon:'🔍',label:'NO SE PUEDE CONCLUIR'}
];
// The rector responds only after the vote has been persisted by Supabase.
export const RECTOR_FEEDBACK={
 si:{
  title:'⛔ No puedo justificar retirar el auxilio con estos datos',
  explanation:'Aunque el juego muestre una correlación negativa, no sabemos qué nota habría obtenido el mismo estudiante si le hubiéramos quitado el auxilio. El perfil, el descanso, el tiempo disponible y la dificultad de los parciales pueden influir. Quitar el beneficio ahora sería atribuir causalidad sin haberla identificado.',
  next:'Antes de recortar, compararíamos alternativas mediante un experimento ético o un estudio causal bien diseñado. Las correlaciones por sí solas no bastan.'
 },
 no:{
  title:'🛡️ Mantenerlo puede ser prudente, pero no demuestra su efecto',
  explanation:'Decidir no quitar el auxilio evita un recorte basado solo en asociaciones. Sin embargo, estos datos tampoco prueban que mantenerlo aumente las notas: una decisión prudente de política no equivale a demostrar un efecto causal.',
  next:'Podemos mantenerlo mientras reunimos evidencia adicional y evaluamos su impacto con grupos comparables, resultados y costos.'
 },
 evidencia_insuficiente:{
  title:'🔍 Correcto: todavía no sabemos si quitarlo mejoraría las notas',
  explanation:'Esta es la conclusión metodológica que sí permiten los datos. Vemos asociaciones entre bienestar y rendimiento, pero los participantes no parten de las mismas condiciones y no observamos el resultado alternativo de cada persona. Una correlación no identifica el efecto de eliminar el auxilio.',
  next:'Para responder la pregunta causal necesitamos un diseño creíble: por ejemplo, una prueba A/B ética, o ajuste de confusores con supuestos explícitos y análisis de sensibilidad.'
 }
};
const returnLink=import.meta.env.VITE_DEAN_MAIN_ROOM_URL||'';

export default function DeanRectorFinal({player,recap=null,phase='exams',busy=false,onDownload,onGetCsv,onSubmit,error=''}) {
 const [selected,setSelected]=useState(null);
 const [scene,setScene]=useState(player?.policy_choice?'decision':'correlation');
 const answer=player?.policy_choice||null;
 const complete=Number(player?.completed||0)>=6;
 if(scene==='correlation')return <CopaCorrelation embedded loadCsv={onGetCsv} onContinue={()=>setScene('decision')}/>;
 return <section className="dean-arcade-finish dean-rector-final" aria-labelledby="arcade-rector-heading">
  <div className="dean-rector-header">
   <span className="dean-kicker">🏁 SEIS EXÁMENES COMPLETADOS</span>
   <h2 id="arcade-rector-heading">🏛️ LA ÚLTIMA JUGADA DEL RECTOR</h2>
   <p>¡Gran temporada, {player?.alias}! Ahora decide qué harías con los beneficios de bienestar.</p>
  </div>
  <div className="dean-rector-content">
   <div className="dean-rector-mascot"><DeanArcadeMascot mood="epic"/><span>¿QUÉ DECIDES?</span></div>
   <div className="dean-rector-vote">
    <span className="dean-rector-chapter">⚡ DECISIÓN FINAL · NO SUMA NI RESTA PUNTOS</span>
    <h3>Según los datos del juego, ¿el Rector debería quitar los beneficios de bienestar para aumentar la nota final de los parciales?</h3>
    <button type="button" className="dean-arcade-download" disabled={!complete||busy} onClick={onDownload}>
     📥 DESCARGAR TODOS LOS DATOS DE LA COPA
    </button>
    <small className="dean-rector-help">Descarga el CSV de toda la Copa. Incluye los registros disponibles hasta este momento; vuelve a descargarlo cuando tus compañeros terminen.</small>
    <button type="button" className="dean-rector-analysis-link" onClick={()=>setScene('correlation')}>📉 REVISAR CORRELACIONES REALES DE LA COPA</button>
    {answer?<div className={'dean-rector-answer dean-rector-answer-'+answer} role="status" aria-live="polite" aria-atomic="true">
      <strong>🏛️ EL RECTOR RESPONDE</strong>
      <span className="dean-rector-saved">✅ Decisión registrada: {RECTOR_CHOICES.find(c=>c.id===answer)?.label||'Registrada'}</span>
      <h4>{RECTOR_FEEDBACK[answer]?.title||'Decisión recibida'}</h4>
      <p>{RECTOR_FEEDBACK[answer]?.explanation||'Tu voto ha quedado registrado.'}</p>
      <p className="dean-rector-next"><b>¿Qué haríamos después?</b> {RECTOR_FEEDBACK[answer]?.next||'Revisar la evidencia.'}</p>
    </div>:<>
     <div className="dean-rector-choices" role="group" aria-label="Elige una decisión final">
      {RECTOR_CHOICES.map(c=><button type="button" key={c.id}
       className={'dean-rector-choice '+(selected===c.id?'is-selected':'')}
       disabled={busy} onClick={()=>setSelected(c.id)} aria-pressed={selected===c.id}>
        <span aria-hidden="true">{c.icon}</span><b>{c.label}</b>
       </button>)}
     </div>
     <button type="button" className="dean-arcade-next dean-rector-submit"
      disabled={!selected||busy} onClick={()=>onSubmit(selected)}>
      {busy?'⏳ GUARDANDO…':'⚡ CONFIRMAR DECISIÓN'}
     </button>
    </>}
    {error&&<p className="dean-error" role="alert">{error}</p>}
   </div>
  </div>
  {(Boolean(answer)||phase==='finished')&&<DeanLifePodium recap={recap} showMy/>}
  <div className="dean-rector-return">
   {returnLink?<a className="dean-arcade-return" href={returnLink} target="_blank" rel="noreferrer">↗ REGRESAR A LA REUNIÓN PRINCIPAL</a>
    :<span className="dean-arcade-return">🎧 Teams: elige «Regresar» a la sala principal</span>}
  </div>
 </section>;
}
