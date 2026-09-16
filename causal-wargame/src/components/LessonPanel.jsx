import React from 'react'
import {IDENTIFICATION_COMPASS,LESSONS,ROLE_TASKS} from '../learning'
import {ROLE_ARCHETYPES} from '../codex'
import {RoleReveal} from './RoleReveal'

function UnlockSummary({round}){
  const unlocks=Object.entries(ROLE_ARCHETYPES).filter(([,meta])=>meta.core).flatMap(([role,meta])=>meta.powers.filter(p=>p.unlockRound===Number(round)).map(p=>({role,label:meta.label,emoji:meta.emoji,accent:meta.accent,power:p.name})))
  if(!unlocks.length)return null
  return <div className="card unlock-summary"><div className="eyebrow">AL TERMINAR ESTA MINI-CLASE SE DESBLOQUEA</div><div className="unlock-summary-grid">{unlocks.map(x=><div className="unlock-summary-item" key={`${x.role}-${x.power}`} style={{'--role-accent':x.accent}}><span>{x.emoji}</span><div><b>{x.power}</b><small>{x.label}</small></div></div>)}</div><p className="muted-copy">Todos los equipos reciben los mismos poderes. Nadie puede usar una herramienta antes de que el concepto haya sido explicado.</p></div>
}

function IdentificationCompass({facilitator}){
  return <div className="card" style={{marginTop:14}}><div className="eyebrow">BRÚJULA DE IDENTIFICACIÓN · PARA LLEVAR AL TRABAJO</div><h3>El estimador viene después de decidir de dónde sale la comparación</h3><div className="policy-table-v7" style={{gridTemplateColumns:'1.2fr 1fr 2fr'}}><b>Situación</b><b>Estrategia a considerar</b><b>Pregunta que debes defender</b>{IDENTIFICATION_COMPASS.map(x=><React.Fragment key={x.strategy}><span>{x.signal}</span><span><b>{x.strategy}</b></span><span>{x.question}</span></React.Fragment>)}</div><div className="notice notice-gold" style={{marginTop:10}}>{facilitator?'Úsala como cierre, no como sexta mini-clase. El objetivo es que reconozcan qué pregunta hacer al volver a un proyecto real.':'No necesitas dominar hoy cada método. Sí debes saber que “ajustar un modelo” no es una estrategia universal de identificación.'}</div></div>
}

export function LessonPanel({round,role,facilitator=false}){
  const l=LESSONS[round]
  if(!l)return null
  return <>
    {!facilitator&&role&&<RoleReveal role={role} round={round} phase="lesson"/>}
    <div className="grid grid-2 lesson-grid">
      <div className="card card-accent">
        <div className="eyebrow">MINI-CLASE · {l.minutes} MIN</div>
        <h2>{l.title}</h2>
        <p style={{fontSize:18}}>{l.objective}</p>
        <div className="formula">{l.formula}</div>
        <div className="method-chips">{l.methods.map(m=><span key={m}>{m}</span>)}</div>
      </div>
      <div className="card">
        <div className="eyebrow">{facilitator?'GUION DEL CAPACITADOR':'CUANDO ENTRES A LA SALA'}</div>
        {facilitator?<ol className="teacher-script">{l.teacher.map(x=><li key={x}>{x}</li>)}</ol>:<>
          <h3>Haz esto en tu rol</h3>
          <div className="notice"><b>{ROLE_TASKS[round]?.[role]}</b></div>
          <p><b>Después:</b> cuéntale a tu equipo un hallazgo concreto de tu herramienta. No bloqueen la decisión hasta escuchar las otras evidencias.</p>
        </>}
      </div>
      {facilitator&&<><div className="card"><div className="eyebrow">DEMOSTRACIÓN</div><h3>Qué mostrar</h3><p>{l.demo}</p></div><div className="card"><div className="eyebrow">CHECK DE COMPRENSIÓN</div><h3>Pregunta al grupo</h3><p>{l.check}</p></div></>}
    </div>
    {facilitator&&<UnlockSummary round={round}/>} 
    {Number(round)===4&&<IdentificationCompass facilitator={facilitator}/>} 
  </>
}
