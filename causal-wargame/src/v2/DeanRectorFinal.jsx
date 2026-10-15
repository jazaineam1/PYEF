import React,{useState} from 'react';
import DeanArcadeMascot from './DeanArcadeMascot.jsx';
import './dean-arcade.css';

export const RECTOR_CHOICES=[
 {id:'si',icon:'✂️',label:'SÍ, QUITARLOS'},
 {id:'no',icon:'🛡️',label:'NO, MANTENERLOS'},
 {id:'evidencia_insuficiente',icon:'🔍',label:'NO SE PUEDE CONCLUIR'}
];
const returnLink=import.meta.env.VITE_DEAN_MAIN_ROOM_URL||'';

export default function DeanRectorFinal({player,busy=false,onDownload,onSubmit,error=''}) {
 const [selected,setSelected]=useState(null);
 const answer=player?.policy_choice||null;
 const complete=Number(player?.completed||0)>=6;
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
     📥 DESCARGAR TODOS LOS DATOS DE LAS 5 SALAS
    </button>
    <small className="dean-rector-help">Descarga el CSV de toda la Copa. Incluye los registros disponibles hasta este momento; vuelve a descargarlo cuando tus compañeros terminen.</small>
    {answer?<div className="dean-rector-answer" role="status">
      <strong>✅ DECISIÓN GUARDADA</strong>
      <span>{RECTOR_CHOICES.find(c=>c.id===answer)?.label||'Registrada'}</span>
      <small>Tu voto quedó registrado. La decisión se debatirá fuera del juego.</small>
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
  <div className="dean-rector-return">
   {returnLink?<a className="dean-arcade-return" href={returnLink} target="_blank" rel="noreferrer">↗ REGRESAR A LA REUNIÓN PRINCIPAL</a>
    :<span className="dean-arcade-return">🎧 Teams: elige «Regresar» a la sala principal</span>}
  </div>
 </section>;
}
