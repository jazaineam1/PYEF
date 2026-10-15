import React from 'react';
import DeanCausalAtlas from '../../DeanCausalAtlas.jsx';
import{useBoard}from'../useBoard.js';
import DeanShell from'../Shell.jsx';
import Board from'../Board.jsx';
import CupQuiz from'../CupQuiz.jsx';
import DeanGuidance from'../Guidance.jsx';
import'./wall.css';

export default function Wall(){
 const {value,error}=useBoard();
 const isFinal=value?.phase==='final';
 const panel=value?.dgp_version==='zip_dgp_2026'&&['rector','survey','causal'].includes(value.phase)
  ?<DeanCausalAtlas phase={value.phase}/>:<DeanGuidance phase={value?.phase} role="wall"/>;
 return <DeanShell role="wall" kind="WALL · PROYECCIÓN" phase={value?.phase} groups={value?.groups} className={'dean-wall '+(isFinal?'dean-wall-final':'')}>
  {value?.available?<main>
   {!isFinal&&<h2 className="dean-wall-title">¿Qué sala dominará el semestre?</h2>}
   {isFinal
    ?<><section className="dean-wall-quiz" aria-label="Quiz de la gran final"><CupQuiz role="wall"/></section><section className="dean-wall-ranking dean-wall-ranking-strip"><Board groups={value.groups}/></section></>
    :<div className="dean-wall-layout"><section className="dean-wall-ranking"><Board groups={value.groups}/></section><section className="dean-wall-panel" aria-label="Panel de la fase">{panel}</section></div>}
  </main>:<main className="dean-hero"><h2>🎓 Esperando la Copa del Decano</h2></main>}
  {error&&<p className="dean-error">{error}</p>}
 </DeanShell>
}
