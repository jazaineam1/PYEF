import React from 'react';
import{names}from'./constants.js';
import'./board.css';

export default function Board({groups=[]}){
 const attendees=groups.reduce((n,g)=>n+Number(g.members||0),0)
 const ranked=groups.filter(g=>Number(g.members)>0).sort((a,b)=>Number(b.fair_score??-1)-Number(a.fair_score??-1)||Number(b.coverage_pct||0)-Number(a.coverage_pct||0)||a.room_no-b.room_no)
 const empty=groups.filter(g=>!Number(g.members)).sort((a,b)=>a.room_no-b.room_no)
 return <section className="dean-board" data-testid="dean-board"><h2>🏆 Clasificación en vivo</h2>
 <p>{attendees} inscritos de máximo 30. No hay asistencia mínima: cada sala avanza con quienes llegaron.</p>
 <p>Puntaje comparable: suma de notas / (15 × inscritos). Los exámenes pendientes cuentan provisionalmente como cero; la media de exámenes realizados se muestra aparte.</p>
 {ranked.length===0&&<p>Esperando al primer participante. Las salas vacías no compiten.</p>}
 {ranked.map((g,i)=>{const target=Number(g.target_exams??Number(g.members)*15),completed=Number(g.exams_completed||0),progress=target?Math.min(100,100*completed/target):0;return <article key={g.room_no}>
 <div className="dean-medal">{['🥇','🥈','🥉'][i]||'#'+(i+1)}</div>
 <div className="dean-board-main"><b>Grupo {g.room_no} · {names[g.room_no-1]}</b>
 <span>{g.members}/6 participantes · {completed}/{target} exámenes ({Math.round(progress)} %)</span>
 <div className="dean-meter"><i style={{width:progress+'%'}}/></div>
 <small>Media de notas rendidas: {g.average_score==null?'—':Number(g.average_score).toFixed(1)} / 50</small>
 </div><div className="dean-rating"><strong>{g.fair_score==null?'—':Number(g.fair_score).toFixed(1)}</strong>
 <small>{g.is_complete?'FINAL':'PROVISIONAL'}</small></div>
 </article>})}
 {empty.map(g=><article key={g.room_no} className="dean-team-empty"><div className="dean-medal">—</div>
 <div className="dean-board-main"><b>Grupo {g.room_no} · {names[g.room_no-1]}</b><span>0/6 inscritos · Sala disponible</span></div>
 <div className="dean-rating"><small>SIN PARTICIPANTES</small></div></article>)}
 </section>;
}
