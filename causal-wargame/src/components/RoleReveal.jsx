import React from'react'
import{LockKeyhole,ShieldCheck,Sparkles,Zap}from'lucide-react'
import{COMMON_POWER,CORE_ROLE_CODES,ROLE_ARCHETYPES,powersForRole}from'../codex'
import{ECONML_PROVENANCE}from'../causal-tools'

export function RoleReveal({state,role:roleProp,round:roundProp,phase:phaseProp='lesson'}){
  const role=state?.player?.role_code||roleProp
  const round=state?.game?.round||roundProp||1
  const phase=state?.game?.phase||phaseProp
  const meta=ROLE_ARCHETYPES[role]
  if(!meta)return null
  const powers=powersForRole(role,round,phase)
  const coreRoles=CORE_ROLE_CODES.map(code=>ROLE_ARCHETYPES[code]).filter(Boolean)
  return <div className="quest-reveal power-enter" style={{'--active-accent':meta.accent}}>
    <div className="power-burst" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div>
    <div className="role-focus-card">
      <div className="role-visual-column">
        <div className="role-avatar-stage" aria-hidden="true">
          <i className="role-orbit role-orbit-one"/><i className="role-orbit role-orbit-two"/>
          <span className="role-avatar-glow"/><span className="role-avatar-emoji">{meta.emoji}</span>
          <span className="role-spark role-spark-a">✦</span><span className="role-spark role-spark-b">✦</span><span className="role-spark role-spark-c">✦</span>
        </div>
        <span className="role-visual-caption core">ESPECIALIDAD NÚCLEO</span>
      </div>
      <div className="role-focus-copy">
        <div className="eyebrow">REVELACIÓN DE ROL</div><div className="type-badge"><Zap size={13}/>{meta.type}</div>
        <h2 className="role-title-glow"><span className="role-title-emoji" aria-hidden="true">{meta.emoji}</span>{meta.label}</h2>
        <p className="role-tagline">{meta.tagline}</p>
        <div className="role-meta-row"><span>{meta.family}</span><span>Herramienta · {meta.tool}</span></div>
        <div className="role-mission"><b>Misión permanente</b><span>{meta.mission}</span></div>
      </div>
    </div>
    <div className="common-power-card"><Sparkles/><div><div className="eyebrow">PODER BASE · IGUAL PARA TODOS LOS PARTICIPANTES</div><h3>{COMMON_POWER.name}</h3><p>{COMMON_POWER.why}</p></div></div>
    <div className="power-grid-simple">{powers.map(p=><div key={p.name} className={`power-box ${p.unlocked?'unlocked':'locked'} ${p.unlocking?'unlocking':''}`}><div className="power-box-icon">{p.unlocked?<Sparkles/>:<LockKeyhole/>}</div><div><div className="eyebrow">{p.unlocked?'HABILIDAD DISPONIBLE':p.unlocking?'SE ACTIVA DESPUÉS DE ESTA EXPLICACIÓN':`SE ACTIVA EN RONDA ${p.unlockRound}`}</div><h3>{p.name}</h3><p>{p.why}</p></div></div>)}</div>
    {role==='data'&&round>=4&&ECONML_PROVENANCE?.verified&&<div className="model-provenance-card"><span className="model-provenance-emoji" aria-hidden="true">🧪</span><div><b>Evidencia precomputada con EconML</b><span>{ECONML_PROVENANCE.econml_version?`EconML ${ECONML_PROVENANCE.econml_version} · `:''}T-Learner, DR-Learner y CausalForestDML.</span><small>Los modelos se ejecutaron fuera de la clase; el navegador sólo explora resultados estáticos. La concordancia entre estimadores no demuestra identificación causal.</small></div></div>}
    {meta.marketAuthority&&<div className="market-authority"><ShieldCheck size={16}/><div><b>Responsabilidad exclusiva del rol:</b><span> tú confirmas la cesta del mercado, pero la decisión de qué comprar se discute con todo el equipo.</span></div></div>}
    <div className="team-role-strip"><div className="team-role-strip-copy"><b>Arquitectura del equipo</b><span>Cinco especialistas, cinco instrumentos y una sola decisión. Cada pieza responde una pregunta distinta y necesita información de las demás.</span></div><div className="team-role-icons" aria-label="Cinco especialidades núcleo">{coreRoles.map(m=><i key={m.label} title={m.label} style={{'--role-accent':m.accent}}>{m.emoji}</i>)}</div></div>
  </div>
}
