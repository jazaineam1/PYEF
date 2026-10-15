import React,{useEffect,useRef} from 'react';
import {ARCADE_EXAMS,arcadeTier,arcadeTitle} from './dean-arcade.js';
import './dean-arcade.css';

// One celebratory result scene per saved exam. The grade comes from the server.
export default function DeanArcadeResult({award,onContinue}){
 const action=useRef(null);
 useEffect(()=>{action.current?.focus()},[award?.nonce]);
 if(!award)return null;
 const tier=arcadeTier(Number(award.score));
 return <div className={'dean-arcade-overlay tier-'+tier.id} role="presentation">
  <div className="dean-arcade-rays" aria-hidden="true"/>
  <div className="dean-arcade-confetti" aria-hidden="true">
   {Array.from({length:22},(_,i)=><span key={i} style={{'--i':i}}/>)}
  </div>
  <section className="dean-arcade-result" role="dialog" aria-modal="true" aria-labelledby="arcade-result-heading">
   <span className="dean-arcade-overline">EXAMEN {award.exam} / {ARCADE_EXAMS} · RESULTADO</span>
   <div className="dean-arcade-emblem" aria-hidden="true">{tier.emoji}</div>
   <h2 id="arcade-result-heading">{tier.label}</h2>
   <p className="dean-arcade-line">{tier.line}</p>
   <div className="dean-arcade-score"><strong>{Number(award.score).toFixed(1)}</strong><span>/ 50</span></div>
   <div className="dean-arcade-results-strip">
    <span>🏅 {arcadeTitle(Number(award.average)||0)}</span>
    <span>🔥 Racha x{award.streak||0}</span>
    <span>📈 Media {Number(award.average||0).toFixed(1)}</span>
   </div>
   <button ref={action} type="button" className="dean-arcade-next" onClick={onContinue}>
    {Number(award.exam)>=ARCADE_EXAMS?'🏆 VER MI TEMPORADA':'⚡ SIGUIENTE EXAMEN'} <span aria-hidden="true">→</span>
   </button>
  </section>
 </div>;
}
