import React from'react'
import{Crown,LockKeyhole,ShieldCheck,Star,Sparkles,Zap}from'lucide-react'
import{CAUSAL_CODEX,ROLE_ARCHETYPES,newestCapability,roleEvolution,unlockedCodex}from'../codex'

export function RoleReveal({state,role:roleProp,round:roundProp,phase:phaseProp='lesson'}){
  const role=state?.player?.role_code||roleProp
  const round=state?.game?.round||roundProp||1
  const phase=state?.game?.phase||phaseProp
  const meta=ROLE_ARCHETYPES[role]
  if(!meta)return null
  const unlocked=unlockedCodex(round,role,phase)
  const newest=newestCapability(round,role)
  const evo=roleEvolution(round,role,phase)
  return <div className="quest-reveal power-enter" style={{'--active-accent':meta.accent}}>
    <div className="power-burst" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div>
    <div className="quest-reveal-head"><div><div className="eyebrow">REVELACIÓN DE CAPACIDADES</div><div className="type-badge"><Zap size={13}/>{meta.type}</div><h2 className="role-title-glow">{meta.emoji} {meta.label}</h2><p>{meta.tagline}</p></div><div className="codex-meter"><span>CAUSAL CODEX</span><strong>{unlocked.length}/151</strong><div><i style={{width:`${Math.max(4,100*unlocked.length/151)}%`}}/></div></div></div>
    <div className="role-deck">{Object.entries(ROLE_ARCHETYPES).map(([code,m])=><div className={`role-card-mini ${code===role?'active power-card':''}`} style={{'--role-accent':m.accent}} key={code}><div className="role-type-mini">{m.type}</div><div className="role-avatar">{m.emoji}</div><b>{m.label}</b><small>{m.family}</small><span>{m.tool}</span></div>)}</div>
    <div className="ability-unlock power-unlock" style={{'--role-accent':meta.accent}}><Sparkles/><div><div className="eyebrow">PODER DESBLOQUEADO · {evo.stage}</div><h3>{newest?.name}</h3><p>Tu especialidad evoluciona con los temas de la partida. Usa este poder dentro de tu rol y comparte el hallazgo con el equipo.</p>{meta.marketAuthority&&<div className="market-authority"><ShieldCheck size={15}/><b>Habilidad exclusiva:</b> administras la bolsa de inversión y ejecutas las compras del equipo.</div>}</div><div className="ability-stars">{[1,2,3].map(x=><Star key={x} size={18} fill={x<=Math.min(3,newest?.tier||1)?'currentColor':'none'}/>)}</div></div>
    <div className={`mastery-card ${evo.maxed?'maxed':''}`}><div className="mastery-icon"><Crown/></div><div><div className="eyebrow">EVOLUCIÓN MÁXIMA DEL ROL</div><h3>{evo.maxRole}</h3><p>{evo.maxExplanation}</p><span>Poder máximo · <b>{evo.maxPower}</b></span></div></div>
    <div className="codex-strip">{CAUSAL_CODEX.filter(x=>x.role===role).slice(0,12).map(c=>{const on=unlocked.some(u=>u.id===c.id);return <div key={c.id} className={`codex-chip ${on?'on':'off'}`} title={c.name}>{on?<Star size={13}/>:<LockKeyhole size={13}/>}<span>#{String(c.id).padStart(3,'0')}</span></div>})}</div>
  </div>
}
