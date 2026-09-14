import React from 'react'
import { Brand } from '../components/Brand'
import { Leaderboard } from '../components/Leaderboard'
import { ObservedLeaderboard } from '../components/ObservedLeaderboard'
import { Timer } from '../components/Timer'
import { useDemoState } from '../lib/useDemoState'
import { ROUND_COPY } from '../demo/scenario'
import { round1ObservedLeaderboard } from '../demo/store'

export default function DemoWall(){
  const state=useDemoState(); const g=state.game; const copy=ROUND_COPY[g.round]
  const observed = g.round===1 && g.phase==='closed' ? round1ObservedLeaderboard(state) : []
  const causalMode = g.round===1 && ['reveal','teaching','microcheck'].includes(g.phase)
  return <div className="wall">
    <div className="topbar"><Brand subtitle="Pantalla compartida"/><div style={{display:'flex',gap:8,alignItems:'center'}}><span className="pill">Ronda <strong>{g.round}/4</strong></span><Timer closesAt={g.closesAt}/></div></div>
    <div className="wall-kicker">{copy.kicker}</div>
    <div className="wall-title">{g.phase==='reveal'&&g.round===1?'VER EL OTRO FUTURO':g.phase==='finished'?'USTEDES DESCUBRIERON A QUIÉN PODÍAN CAMBIAR.':copy.title}</div>
    <div className="wall-message">{g.phase==='round'?copy.mission:g.phase==='closed'&&g.round===1?'Primer resultado: ranking por conversión esperada. Todavía NO hemos preguntado qué causó la intervención.':g.phase==='closed'?'Decisiones cerradas. Preparando revelación…':g.phase==='teaching'?copy.teaching.body:g.phase==='microcheck'?'Microcheck individual en cada equipo.':g.phase==='finished'?'ORÁCULO predijo quién lo haría. Ustedes aprendieron a preguntar quién cambia por la intervención.':g.publicMessage}</div>
    <div className="wall-board"><div className="card">
      {observed.length?<><div className="eyebrow">RANKING 1 · CONVERSIÓN OBSERVADA</div><ObservedLeaderboard teams={observed}/></>:<><div className="eyebrow">{causalMode?'RANKING 2 · IMPACTO CAUSAL':'LEADERBOARD'}</div><Leaderboard state={state} compact/></>}
    </div></div>
    {causalMode&&<div className="notice notice-gold" style={{maxWidth:900,margin:'16px auto 0'}}>El ranking cambió porque ahora puntuamos <b>lo que la intervención cambió</b>, no simplemente quién convirtió.</div>}
    <div className="footer">La pantalla compartida nunca muestra cartas privadas ni la verdad causal antes del reveal.</div>
  </div>
}
