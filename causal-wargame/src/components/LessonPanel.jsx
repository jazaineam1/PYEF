import React from 'react'
import {LESSONS,ROLE_TASKS,ROLE_TOOLS} from '../learning'
import {ROLE_ARCHETYPES} from '../codex'
import {RoleReveal} from './RoleReveal'

function UnlockSummary({round}){
  const unlocks=Object.entries(ROLE_ARCHETYPES).flatMap(([role,meta])=>meta.powers.filter(p=>p.unlockRound===Number(round)).map(p=>({role,label:meta.label,emoji:meta.emoji,accent:meta.accent,power:p.name})))
  if(!unlocks.length)return null
  return <div className="card unlock-summary"><div className="eyebrow">AL TERMINAR ESTA MINI-CLASE SE DESBLOQUEA</div><div className="unlock-summary-grid">{unlocks.map(x=><div className="unlock-summary-item" key={`${x.role}-${x.power}`} style={{'--role-accent':x.accent}}><span>{x.emoji}</span><div><b>{x.power}</b><small>{x.label}</small></div></div>)}</div><p className="muted-copy">Los cuatro equipos reciben los mismos poderes. Nadie puede usar una herramienta antes de que el concepto haya sido explicado.</p></div>
}

export function LessonPanel({round,role,facilitator=false}){
  const l=LESSONS[round]; const tool=role?ROLE_TOOLS[role]:null
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
        <div className="eyebrow">{facilitator?'GUION DEL CAPACITADOR':'ANTES DE ENTRAR A LA SALA'}</div>
        {facilitator?<ol className="teacher-script">{l.teacher.map(x=><li key={x}>{x}</li>)}</ol>:<>
          <h3>{tool?.tool}</h3><p>{tool?.purpose}</p>
          <div className="notice">Tu misión en esta ronda: <b>{ROLE_TASKS[round]?.[role]}</b></div>
          <p><b>Regla:</b> comparte al menos un hallazgo con los otros cuatro roles. Si un poder tiene candado, todavía no se usa.</p>
        </>}
      </div>
      {facilitator&&<><div className="card"><div className="eyebrow">DEMOSTRACIÓN</div><h3>Qué mostrar</h3><p>{l.demo}</p></div><div className="card"><div className="eyebrow">CHECK DE COMPRENSIÓN</div><h3>Pregunta al grupo</h3><p>{l.check}</p></div></>}
    </div>
    {facilitator&&<UnlockSummary round={round}/>} 
  </>
}
