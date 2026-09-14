import React from'react'
import{LockKeyhole,ShieldCheck,Sparkles,Zap}from'lucide-react'
import{ROLE_ARCHETYPES,powersForRole}from'../codex'

export function RoleReveal({state,role:roleProp,round:roundProp,phase:phaseProp='lesson'}){
  const role=state?.player?.role_code||roleProp
  const round=state?.game?.round||roundProp||1
  const phase=state?.game?.phase||phaseProp
  const meta=ROLE_ARCHETYPES[role]
  if(!meta)return null
  const powers=powersForRole(role,round,phase)
  return <div className="quest-reveal power-enter" style={{'--active-accent':meta.accent}}>
    <div className="power-burst" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div>
    <div className="role-focus-card">
      <div className="role-portrait" aria-hidden="true"><span>{meta.emoji}</span><i/></div>
      <div className="role-focus-copy"><div className="eyebrow">TU ROL EN EL EQUIPO</div><div className="type-badge"><Zap size={13}/>{meta.type}</div><h2 className="role-title-glow">{meta.label}</h2><p>{meta.tagline}</p><div className="role-mission"><b>Misión permanente</b><span>{meta.mission}</span></div></div>
    </div>
    <div className="power-grid-simple">{powers.map(p=><div key={p.name} className={`power-box ${p.unlocked?'unlocked':'locked'} ${p.unlocking?'unlocking':''}`}><div className="power-box-icon">{p.unlocked?<Sparkles/>:<LockKeyhole/>}</div><div><div className="eyebrow">{p.unlocked?'PODER DISPONIBLE':p.unlocking?'SE DESBLOQUEA DESPUÉS DE ESTA EXPLICACIÓN':`SE DESBLOQUEA EN RONDA ${p.unlockRound}`}</div><h3>{p.name}</h3><p>{p.why}</p></div></div>)}</div>
    {meta.marketAuthority&&<div className="market-authority"><ShieldCheck size={16}/><div><b>Responsabilidad exclusiva del rol:</b><span> tú confirmas la cesta del mercado, pero la decisión de qué comprar debe discutirse con todo el equipo.</span></div></div>}
    <div className="team-role-strip"><span>Los cuatro equipos tienen exactamente los mismos cinco roles:</span>{Object.values(ROLE_ARCHETYPES).map(m=><i key={m.label} title={m.label} style={{'--role-accent':m.accent}}>{m.emoji}</i>)}</div>
  </div>
}
