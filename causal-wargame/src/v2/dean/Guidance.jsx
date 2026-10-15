import React from 'react';
import{deanGuides}from'./content.js';
import'./guidance.css';

export default function DeanGuidance({phase,role='student'}){
 const x=deanGuides[phase]
 if(!x)return null
 return <section className="dean-guidance" data-testid="dean-guidance" aria-label="Guía causal integrada">
  <div className="dean-kicker">CAPACITACIÓN · MIN {x.time} · UNA SOLA ESCENA CONTINUA</div>
  <h2>{role==='teacher'?'Explicación del capacitador':'Descubre el siguiente problema causal'}</h2>
  <p>{role==='teacher'?x.teacher:x.student}</p>
  {role==='teacher'&&<p className="dean-guidance-project"><b>Qué proyectar:</b> {x.visual}</p>}
  <small>Las decisiones ocurren dentro del juego; no hay micro-pasos obligatorios.</small>
 </section>
}
