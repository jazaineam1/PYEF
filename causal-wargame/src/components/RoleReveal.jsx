import React from'react'
import{LockKeyhole,ShieldCheck,Sparkles,Zap}from'lucide-react'
import{COMMON_POWER,ROLE_ARCHETYPES,powersForRole}from'../codex'
import{ROLE_SPRITE,ROLE_SPRITE_INDEX}from'../roleArt'

function artStyle(role){const i=ROLE_SPRITE_INDEX[role]??0;return{backgroundImage:`url(${ROLE_SPRITE})`,backgroundSize:'500% 100%',backgroundPosition:`${i*25}% 50%`}}

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
      <div className="role-portrait role-portrait-art" style={artStyle(role)} aria-label={`Ilustración del rol ${meta.label}`}><div className="role-art-shine"/><div className="role-art-type">{meta.type}</div></div>
      <div className="role-focus-copy"><div className="eyebrow">REVELACIÓN DE ROL</div><div className="type-badge"><Zap size={13}/>{meta.type}</div><h2 className="role-title-glow">{meta.label}</h2><p>{meta.tagline}</p><div className="role-mission"><b>Misión permanente</b><span>{meta.mission}</span></div></div>
    </div>
    <div className="common-power-card"><Sparkles/><div><div className="eyebrow">PODER BASE · IGUAL PARA LOS 20 PARTICIPANTES</div><h3>{COMMON_POWER.name}</h3><p>{COMMON_POWER.why}</p></div></div>
    <div className="power-grid-simple">{powers.map(p=><div key={p.name} className={`power-box ${p.unlocked?'unlocked':'locked'} ${p.unlocking?'unlocking':''}`}><div className="power-box-icon">{p.unlocked?<Sparkles/>:<LockKeyhole/>}</div><div><div className="eyebrow">{p.unlocked?'HABILIDAD DISPONIBLE':p.unlocking?'SE ACTIVA DESPUÉS DE ESTA EXPLICACIÓN':`SE ACTIVA EN RONDA ${p.unlockRound}`}</div><h3>{p.name}</h3><p>{p.why}</p></div></div>)}</div>
    {meta.marketAuthority&&<div className="market-authority"><ShieldCheck size={16}/><div><b>Responsabilidad exclusiva del rol:</b><span> tú confirmas la cesta del mercado, pero la decisión de qué comprar se discute con todo el equipo.</span></div></div>}
    <div className="team-role-strip"><span>Los cuatro equipos comienzan con exactamente los mismos cinco roles y el mismo poder base:</span>{Object.entries(ROLE_ARCHETYPES).map(([code,m])=><i key={m.label} title={m.label} style={{'--role-accent':m.accent,...artStyle(code)}} className="role-mini-art"/>)}</div>
  </div>
}
