import React from 'react';
import{ARCADE_ARCHETYPES}from './dean-arcade.js';
import './dean-arcade.css';

// A one-click, 10-second playable introduction, not a prologue or a quiz.
// Existing historic students with a fourth profile keep their saved identity.
export const THREE_ARCHETYPES=[
 {id:'over',emoji:'⚡',name:'Sobreexigido',detail:'Puedes preparar más horas, pero tienes menos margen para dormir y vivir.'},
 {id:'balanced',emoji:'🌿',name:'Equilibrado',detail:'Partes con una agenda más estable y una distribución relativamente flexible.'},
 {id:'risk',emoji:'🎒',name:'Con obstáculos',detail:'Tu tiempo de preparación es más limitado y tendrás que elegir qué priorizar.'}
];
export default function DeanThreeProfilesIntro({archetype,onContinue}){
 const mine=THREE_ARCHETYPES.find(x=>x.id===archetype);
 const legacy=mine?null:{id:archetype,emoji:'🏖️',name:'Perfil histórico',detail:'Tu personaje pertenece a una partida anterior y conserva las condiciones originales.'};
 const active=mine||legacy;
 const limits=ARCADE_ARCHETYPES[archetype]||ARCADE_ARCHETYPES.balanced;
 return <section className="dean-profile-intro" aria-label="Tus condiciones iniciales">
  <header><span className="dean-kicker">🎮 TU VIDA UNIVERSITARIA · 10 SEGUNDOS</span>
   <h2>No todos empezamos desde el mismo lugar</h2>
   <p>El juego te asignó un personaje con límites distintos. Tendrás seis decisiones para repartir estudio, sueño y bienestar: cada hora cuenta.</p>
  </header>
  <div className="dean-profile-choices">
   {THREE_ARCHETYPES.map(x=><article key={x.id} className={'dean-profile-card'+(x.id===archetype?' is-you':'')}>
     <span className="dean-profile-avatar" aria-hidden="true">{x.emoji}</span>
     <strong>{x.name}</strong>
     <p>{x.detail}</p>
     {x.id===archetype&&<span className="dean-profile-mark">✓ ESTE ERES TÚ</span>}
   </article>)}
   {legacy&&<article className="dean-profile-card is-you"><span className="dean-profile-avatar">{legacy.emoji}</span><strong>{legacy.name}</strong><p>{legacy.detail}</p><span className="dean-profile-mark">✓ PERFIL DE LA COPA ANTERIOR</span></article>}
  </div>
  <div className="dean-profile-assignment">
   <strong>{active.emoji} Tus condiciones: {active.name}</strong>
   <span>📚 Estudio {limits.study[0]}–{limits.study[1]} h · 😴 Sueño {limits.sleep[0]}–{limits.sleep[1]} h · 🌿 Bienestar {limits.wellness[0]}–{limits.wellness[1]} h</span>
  </div>
  <p className="dean-profile-causal"><b>El reto:</b> ¿quién sacará mejores notas? ¿Lo explican sus decisiones o también sus condiciones iniciales? Lo investigaremos al terminar.</p>
  <button className="dean-profile-continue" type="button" onClick={onContinue}>🎮 ENTENDÍ MI PERSONAJE · ¡A JUGAR!</button>
 </section>
}
