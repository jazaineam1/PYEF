import React,{useEffect,useMemo,useState}from'react'
import{CheckCircle2,Send,Users}from'lucide-react'
import{invoke}from'../lib/api'
import{ROLE_FINDINGS,findingLabel}from'../role-findings'
import{ROLE_ARCHETYPES}from'../codex'

const jitter=base=>Math.round(base*(.82+Math.random()*.36))
const compactEvidence=e=>{if(!e||typeof e!=='object')return{};const out={};for(const k of['summary','assumption','decision','details'])if(e[k]!==undefined)out[k]=e[k];return out}
export function TeamContribution({state,evidence}){
  const role=state.player.role_code,round=state.game.round
  const options=ROLE_FINDINGS?.[round]?.[role]||[]
  const[selected,setSelected]=useState('');const[data,setData]=useState(null);const[busy,setBusy]=useState(false);const[err,setErr]=useState('')
  async function refresh(){try{setData(await invoke('role-contribution',{action:'state'}));setErr('')}catch(e){setErr(e.message)}}
  useEffect(()=>{let stop=false,t;const loop=async()=>{await refresh();if(!stop)t=setTimeout(loop,jitter(5500))};loop();return()=>{stop=true;clearTimeout(t)}},[round])
  const own=useMemo(()=>data?.rows?.find(x=>x.player_id===state.player.id),[data,state.player.id])
  useEffect(()=>{if(own?.finding_code)setSelected(own.finding_code)},[own?.finding_code])
  async function submit(){if(!selected)return;setBusy(true);try{await invoke('role-contribution',{action:'submit',round,finding_code:selected,evidence:compactEvidence(evidence)});await refresh()}catch(e){setErr(e.message)}finally{setBusy(false)}}
  const rows=Object.entries(ROLE_ARCHETYPES).map(([code,meta])=>{const hit=data?.rows?.find(x=>x.role_code===code);return{code,meta,hit}})
  return <div className="team-contribution"><div className="section-title" style={{marginTop:0}}><div><div className="eyebrow">MESA DE EVIDENCIA</div><h3>Cada especialista deja una pieza que los otros necesitan</h3></div><div className="contribution-count"><Users size={16}/><b>{data?.count||0}/5</b></div></div><p className="muted-copy">Elige la conclusión que mejor representa tu lectura. Al compartirla también se guarda el resumen producido por tu herramienta.</p>{evidence?.summary&&<div className="evidence-preview"><b>Tu evidencia actual</b><span>{evidence.summary}</span><small>{evidence.assumption}</small></div>}<div className="finding-options">{options.map(([code,label])=><label className={`finding-choice ${selected===code?'selected':''}`} key={code}><input type="radio" name={`finding-${role}-${round}`} checked={selected===code} onChange={()=>setSelected(code)}/><span>{label}</span></label>)}</div><button className="btn btn-primary" disabled={busy||!selected} onClick={submit}><Send size={15}/>{own?'Actualizar evidencia compartida':'Compartir con el equipo'}</button>{err&&<div className="notice notice-red">{err}</div>}<div className="team-findings-board">{rows.map(({code,meta,hit})=><div className={`team-finding-row ${hit?'done':''}`} key={code}><span className="role-dot" style={{'--role-accent':meta.accent}}>{meta.emoji}</span><div><b>{meta.label}</b><small>{hit?findingLabel(round,code,hit.finding_code):'Aún no ha compartido hallazgo'}</small>{hit?.evidence?.summary&&<p className="evidence-line">↳ {hit.evidence.summary}</p>}</div>{hit&&<CheckCircle2 size={18}/>}</div>)}</div><div className={`notice ${(data?.count||0)>=5?'notice-green':'notice-gold'}`}>{(data?.count||0)>=5?'5/5 especialidades dejaron evidencia. La decisión ya puede integrar las cinco perspectivas.':'No es obligatorio esperar 5/5 si alguien tiene un problema técnico, pero la meta pedagógica es que ninguna decisión dependa de un solo rol.'}</div></div>
}
