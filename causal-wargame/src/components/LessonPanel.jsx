import React from 'react'
import {LESSONS,ROLE_TASKS,ROLE_TOOLS} from '../learning'

export function LessonPanel({round,role,facilitator=false}){
  const l=LESSONS[round]; const tool=role?ROLE_TOOLS[role]:null
  if(!l)return null
  return <div className="grid grid-2 lesson-grid">
    <div className="card card-accent">
      <div className="eyebrow">MINI-CLASE · {l.minutes} MIN</div>
      <h2>{l.title}</h2>
      <p style={{fontSize:18}}>{l.objective}</p>
      <div className="formula">{l.formula}</div>
      <div className="method-chips">{l.methods.map(m=><span key={m}>{m}</span>)}</div>
    </div>
    <div className="card">
      <div className="eyebrow">{facilitator?'GUION DEL CAPACITADOR':'ANTES DE ENTRAR A LA SALA'}</div>
      {facilitator?<ol className="teacher-script">{l.teacher.map(x=><li key={x}>{x}</li>)}</ol>:<>
        <h3>{tool?.tool}</h3><p>{tool?.purpose}</p>
        <div className="notice">Tu misión en esta ronda: <b>{ROLE_TASKS[round]?.[role]}</b></div>
        <p><b>Regla:</b> usa tu herramienta y comparte el hallazgo con los otros cuatro roles. Nadie tiene toda la evidencia.</p>
      </>}
    </div>
    {facilitator&&<><div className="card"><div className="eyebrow">DEMOSTRACIÓN</div><h3>Qué mostrar</h3><p>{l.demo}</p></div><div className="card"><div className="eyebrow">CHECK DE COMPRENSIÓN</div><h3>Pregunta al grupo</h3><p>{l.check}</p></div></>}
  </div>
}
