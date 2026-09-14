import React from'react'
import{LockKeyhole,ShieldCheck,Sparkles,Zap}from'lucide-react'
import{COMMON_POWER,ROLE_ARCHETYPES,powersForRole}from'../codex'
import{functionsBaseUrl}from'../lib/api'

const ROLE_ART={
  business:functionsBaseUrl?`${functionsBaseUrl}/role-art?role=business`:''
}

export function RoleReveal({state,role:roleProp,round:roundProp,phase:phaseProp='lesson'}){
  const role=state?.player?.role_code||roleProp
  const round=state?.game?.round||roundProp||1
  const phase=state?.game?.phase||phaseProp
  const meta=ROLE_ARCHETYPES[role]
  if(!meta)return null
  const powers=powersForRole(role,round,phase)
  const art=ROLE_ART[role]||''
  function fallbackArt(e){
    e.currentTarget.hidden=true
    const fallback=e.currentTarget.nextElementSibling
    if(fallback)fallback.hidden=false
  }
  return <div className="quest-reveal power-enter" style={{'--active-accent':meta.accent}}>
    <div className="power-burst" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div>
    <div className="role-focus-card">
      <div className={`role-portrait ${art?'has-art':'role-portrait-placeholder'}`} aria-label={`Identidad visual del rol ${meta.label}`}>
        {art&&<img className="role-card-art" src={art} alt={`Tarjeta visual: ${meta.label}`} width="180" height="240" loading="lazy" decoding="async" fetchPriority="low" onError={fallbackArt}/>} 
        <span className="role-art-fallback" hidden={Boolean(art)}>{meta.emoji}</span>
        {!art&&<div className="role-art-type">{meta.type}</div>}
        {!art&&<i/>}
      </div>
      <div className="role-focus-copy"><div className="eyebrow">REVELACIÓN DE ROL</div><div className="type-badge"><Zap size={13}/>{meta.type}</div><h2 className="role-title-glow">{meta.label}</h2><p>{meta.tagline}</p><div className="role-mission"><b>Misión permanente</b><span>{meta.mission}</span></div></div>
    </div>
    <div className="common-power-card"><Sparkles/><div><div className="eyebrow">PODER BASE · IGUAL PARA LOS 20 PARTICIPANTES</div><h3>{COMMON_POWER.name}</h3><p>{COMMON_POWER.why}</p></div></div>
    <div className="power-grid-simple">{powers.map(p=><div key={p.name} className={`power-box ${p.unlocked?'unlocked':'locked'} ${p.unlocking?'unlocking':''}`}><div className="power-box-icon">{p.unlocked?<Sparkles/>:<LockKeyhole/>}</div><div><div className="eyebrow">{p.unlocked?'HABILIDAD DISPONIBLE':p.unlocking?'SE ACTIVA DESPUÉS DE ESTA EXPLICACIÓN':`SE ACTIVA EN RONDA ${p.unlockRound}`}</div><h3>{p.name}</h3><p>{p.why}</p></div></div>)}</div>
    {meta.marketAuthority&&<div className="market-authority"><ShieldCheck size={16}/><div><b>Responsabilidad exclusiva del rol:</b><span> tú confirmas la cesta del mercado, pero la decisión de qué comprar se discute con todo el equipo.</span></div></div>}
    <div className="team-role-strip"><span>Los cuatro equipos comienzan con exactamente los mismos cinco roles y el mismo poder base:</span>{Object.values(ROLE_ARCHETYPES).map(m=><i key={m.label} title={m.label} style={{'--role-accent':m.accent}}>{m.emoji}</i>)}</div>
  </div>
}
