import React from 'react';
import{lobbyAvatar}from './DeanArcadeLobby.jsx';
import{lifeProfile,podiumEligible}from './dean-life.js';
import './dean-arcade.css';

const medals=['🥇','🥈','🥉'];
const fmt=n=>Number.isFinite(Number(n))?Number(n).toFixed(1):'—';

export default function DeanLifePodium({recap=null,showMy=false,large=false}){
 const top=podiumEligible(recap),complete=recap?.finished===true;
 const mine=recap?.my||null,profile=lifeProfile(mine);
 return <section className={'dean-life-board'+(large?' dean-life-board-large':'')} aria-label="Podio de mejores decisiones">
  <div className="dean-life-board-head">
   <span className="dean-kicker">🎮 SIMULADOR DE VIDA · GRAN FINAL</span>
   <h2>{complete?'🏆 CAMPEÓN DE LA COPA':'🏅 LÍDERES PROVISIONALES'}</h2>
   <p>🥇 TOP 3 · Las mejores decisiones del semestre: resultados reales del juego y una rutina que cuide tu tiempo.</p>
  </div>
  {top.length?<div className="dean-life-podium">
   {top.map((p,i)=><article key={p.place} className={'dean-life-medalist dean-life-rank-'+p.place}>
    <div className="dean-life-medal">{medals[i]}</div>
    <div className="dean-life-avatar" aria-hidden="true">{lobbyAvatar(p.avatar_no)}</div>
    <strong className="dean-life-name">{p.alias}</strong>
    <small>{top.every(x=>x.room_no===1)?'Competencia individual':'Sala '+p.room_no} · {complete&&i===0?'CAMPEÓN':'POSICIÓN #'+p.place}</small>
    <div className="dean-life-index">{fmt(p.decision_index)}<span>/50</span></div>
    <small>Nota media {fmt(p.avg_grade)}/50</small>
   </article>)}
  </div>:<p className="dean-life-waiting">🎮 Aún no hay seis exámenes completos con decisiones manuales. Nadie es campeón todavía.</p>}
  <div className="dean-life-rules">
   <strong>{Number(recap?.eligible_count||0)} participantes clasifican</strong>
   <span>Índice de juego: 80 % nota · 10 % sueño · 10 % bienestar. Solo seis exámenes manuales; sin respuestas automáticas. {complete?'Clasificación definitiva.':'Puede cambiar hasta que el docente cierre el torneo.'}</span>
  </div>
  {showMy&&mine&&<div className="dean-life-my">
   <span className="dean-life-my-emoji">{profile.emoji}</span>
   <div>
    <span className="dean-kicker">TU VIDA UNIVERSITARIA EN ESTA SIMULACIÓN</span>
    <h3>{profile.title}</h3>
    <p>{profile.text}</p>
    <div className="dean-life-personal-stats">
     <span>📚 Estudio <b>{fmt(mine.avg_study)} h</b></span>
     <span>😴 Sueño <b>{fmt(mine.avg_sleep)} h</b></span>
     <span>🏃 Bienestar <b>{fmt(mine.avg_wellness)} h</b></span>
     <span>📝 Nota <b>{fmt(mine.avg_grade)}/50</b></span>
    </div>
    <small>{mine.place?'Tu puesto entre decisiones manuales: #'+mine.place:
      Number(mine.simulated_exams)>0?'Participaste en modo simulado: sin puesto en el podio.':'Termina tus seis decisiones para competir.'}
     {' '}Este perfil pertenece al simulador y no predice tu desempeño académico real.</small>
   </div>
  </div>}
 </section>;
}
