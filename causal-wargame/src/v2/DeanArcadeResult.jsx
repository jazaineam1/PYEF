import React,{useEffect,useRef} from 'react';
import {ARCADE_EXAMS,arcadeCheer,arcadeTitle} from './dean-arcade.js';
import DeanArcadeMascot from './DeanArcadeMascot.jsx';
import {decisionConsequence} from './dean-life.js';
import './dean-arcade.css';

// Full-screen mobile-game reveal. All grades and streaks come from verified exam records.
export default function DeanArcadeResult({award,onContinue,examCount=ARCADE_EXAMS}){
 const action=useRef(null);
 useEffect(()=>{action.current?.focus()},[award?.nonce]);
 if(!award)return null;
 const score=Number(award.score);
 const result=arcadeCheer(score,Number(award.exam));
 const isFinal=Number(award.exam)>=examCount;
 const [hue1,hue2]=result.id==='legend'?['#ffbb46','#ffed9f']:result.id==='epic'?['#df8dff','#8b6dff']:result.id==='solid'?['#58e7e0','#76caff']:['#68d0ff','#b0ecff'];
 return <div className={'dean-arcade-overlay tier-'+result.id} role="presentation"
  style={{'--arcade-hue1':hue1,'--arcade-hue2':hue2}}>
  <div className="dean-arcade-rays" aria-hidden="true"/>
  <div className="dean-arcade-confetti" aria-hidden="true">
   {Array.from({length:32},(_,i)=><span key={i} style={{'--i':i}}/>)}
  </div>
  <section className="dean-arcade-result" role="dialog" aria-modal="true" aria-labelledby="arcade-result-heading">
   <div className="arcade-clear-head">
    <div className="arcade-clear-label">✦ ¡ROUND COMPLETADO! ✦</div>
    <div className="arcade-exam-pills" aria-label={'Examen '+award.exam+' de '+examCount}>
     {Array.from({length:examCount},(_,i)=><i key={i} className={i<Number(award.exam)?'cleared':''}/>)}
    </div>
   </div>
   <div className="arcade-character-scene">
    <div className="arcade-impact-ring" aria-hidden="true"/>
    <span className="arcade-spark spark-one" aria-hidden="true">✦</span>
    <span className="arcade-spark spark-two" aria-hidden="true">✧</span>
    <span className="arcade-spark spark-three" aria-hidden="true">✦</span>
    <DeanArcadeMascot mood={result.id}/>
    <div className="arcade-character-ribbon">{result.emoji} {result.tag}</div>
   </div>
   <div className="arcade-celebration-copy">
    <h2 id="arcade-result-heading">{result.label}</h2>
    <p className="dean-arcade-line">{result.line}</p>
   </div>
   <div className="arcade-big-grade" aria-label={'Nota del examen '+score.toFixed(1)+' de 50'}>
    <span className="arcade-grade-caption">TU NOTA</span>
    <span className="dean-arcade-score"><strong>{score.toFixed(1)}</strong><small>/ 50</small></span>
    <span className="arcade-grade-stars" aria-label={result.stars+' estrellas'}>
     {Array.from({length:3},(_,i)=><span key={i} className={i<result.stars?'earned':''}>★</span>)}
    </span>
   </div>
   {award.decisions&&<div className="dean-life-consequence" aria-label="Consecuencia de tus decisiones">
    <strong>🎭 ASÍ TE FUE CON ESTA DECISIÓN</strong>
    <p>{decisionConsequence(award.decisions,score,award.previousGrade)}</p>
   </div>}
   <div className="dean-arcade-results-strip">
    <span>🏅 <strong>{arcadeTitle(Number(award.average)||0)}</strong></span>
    <span>🔥 Racha <strong>x{award.streak||0}</strong></span>
    <span>📈 Media <strong>{Number(award.average||0).toFixed(1)}</strong></span>
   </div>
   <button ref={action} type="button" className="dean-arcade-next" onClick={onContinue}>
    {isFinal?'🏁 VER CÓMO SERÍA MI VIDA':'🎭 SEGUIR MI HISTORIA'} <span aria-hidden="true">➜</span>
   </button>
   <small className="arcade-result-footer">EXAMEN {award.exam} / {examCount} · ¡QUÉ JUGADA!</small>
  </section>
 </div>;
}
