import React from'react'
import{LockKeyhole,ShieldCheck,Sparkles,Zap}from'lucide-react'
import{COMMON_POWER,CORE_ROLE_CODES,ROLE_ARCHETYPES,powersForRole}from'../codex'
import{ROLE_ACTIONS}from'../onboarding'
import{ECONML_PROVENANCE}from'../causal-tools'

export function RoleReveal({state,role:roleProp,round:roundProp,phase:phaseProp='lesson'}){
  const role=state?.player?.role_code||roleProp
  const round=state?.game?.round||roundProp||1
  const phase=state?.game?.phase||phaseProp
  const meta=ROLE_ARCHETYPES[role]
  const action=ROLE_ACTIONS[role]
  if(!meta)return null
  const powers=powersForRole(role,round,phase)
  const coreRoles=CORE_ROLE_CODES.map(code=>ROLE_ARCHETYPES[code]).filter(Boolean)

  if(phase==='round')return <div className="card" style={{borderColor:meta.accent,marginBottom:14}}>
    <div className="eyebrow">TU ROL EN ESTA RONDA</div>
    <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}><span style={{fontSize:34}}>{meta.emoji}</span><div><h3 style={{margin:'0 0 4px'}}>{meta.label}</h3><span><b>Puedes:</b> {action?.can}</span></div></div>
    <div className="notice" style={{marginTop:10}}><b>Entrega al equipo:</b> {action?.deliver}</div>
  </div>

  return <div className="quest-reveal power-enter" style={{'--active-accent':meta.accent}}>
    <div className="power-burst" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div>
    <div className="role-focus-card">
      <div className="role-visual-column">
        <div className="role-avatar-stage" aria-hidden="true"><i className="role-orbit role-orbit-one"/><i className="role-orbit role-orbit-two"/><span className="role-avatar-glow"/><span className="role-avatar-emoji">{meta.emoji}</span></div>
        <span className="role-visual-caption core">TU ESPECIALIDAD</span>
      </div>
      <div className="role-focus-copy">
        <div className="eyebrow">QUÉ HACES EN EL EQUIPO</div><div className="type-badge"><Zap size={13}/>{meta.type}</div>
        <h2 className="role-title-glow"><span className="role-title-emoji" aria-hidden="true">{meta.emoji}</span>{meta.label}</h2>
        <div className="role-meta-row"><span>Herramienta · {meta.tool}</span></div>
        <div className="grid grid-3" style={{marginTop:12}}>
          <div className="card"><div className="eyebrow">PUEDES</div><p>{action?.can}</p></div>
          <div className="card"><div className="eyebrow">NO PUEDES CONCLUIR SOLO</div><p>{action?.cannot}</p></div>
          <div className="card card-accent"><div className="eyebrow">ENTREGAS AL EQUIPO</div><p><b>{action?.deliver}</b></p></div>
        </div>
      </div>
    </div>
    <div className="common-power-card"><Sparkles/><div><div className="eyebrow">PREGUNTA QUE TODOS PUEDEN HACER</div><h3>{COMMON_POWER.name}</h3><p>{COMMON_POWER.why}</p></div></div>
    <div className="power-grid-simple">{powers.map(p=><div key={p.name} className={`power-box ${p.unlocked?'unlocked':'locked'} ${p.unlocking?'unlocking':''}`}><div className="power-box-icon">{p.unlocked?<Sparkles/>:<LockKeyhole/>}</div><div><div className="eyebrow">{p.unlocked?'YA PUEDES USARLO':p.unlocking?'SE ACTIVA AL TERMINAR ESTA EXPLICACIÓN':`SE ACTIVA EN RONDA ${p.unlockRound}`}</div><h3>{p.name}</h3></div></div>)}</div>
    {role==='data'&&round>=4&&ECONML_PROVENANCE?.verified&&<div className="model-provenance-card"><span className="model-provenance-emoji" aria-hidden="true">🧪</span><div><b>Resultados precomputados con EconML</b><small>T-Learner, DR-Learner y CausalForestDML. Coincidir no demuestra causalidad.</small></div></div>}
    {meta.marketAuthority&&<div className="market-authority"><ShieldCheck size={16}/><div><b>Mercado:</b><span> tú confirmas la compra; el equipo decide qué ayuda vale la pena.</span></div></div>}
    <div className="team-role-strip"><div className="team-role-strip-copy"><b>No juegas solo</b><span>Habla con las otras especialidades. Cada una produce una evidencia distinta y el equipo bloquea una sola decisión.</span></div><div className="team-role-icons" aria-label="Cuatro especialidades núcleo">{coreRoles.map(m=><i key={m.label} title={m.label} style={{'--role-accent':m.accent}}>{m.emoji}</i>)}</div></div>
  </div>
}
