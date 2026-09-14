import React,{useEffect,useMemo,useState}from'react'
import{CheckCircle2,Send,Users}from'lucide-react'
import{invoke}from'../lib/api'
import{ROLE_FINDINGS,findingLabel}from'../role-findings'
import{ROLE_ARCHETYPES}from'../codex'

const jitter=base=>Math.round(base*(.82+Math.random()*.36))
export function TeamContribution({state}){
  const role=state.player.role_code,round=state.game.round
  const options=ROLE_FINDINGS?.[round]?.[role]||[]
  const[selected,setSelected]=useState('');const[data,setData]=useState(null);const[busy,setBusy]=useState(false);const[err,setErr]=useState('')
  async function refresh(){try{setData(await invoke('role-contribution',{action:'state'}));setErr('')}catch(e){setErr(e.message)}}
  useEffect(()=>{let stop=false,t;const loop=async()=>{await refresh();if(!stop)t=setTimeout(loop,jitter(5500))};loop();return()=>{stop=true;clearTimeout(t)}},[round])
  const own=useMemo(()=>data?.rows?.find(x=>x.player_id===state.player.id),[data,state.player.id])
  useEffect(()=>{if(own?.finding_code)setSelected(own.finding_code)},[own?.finding_code])
  async function submit(){if(!selected)return;setBusy(true);try{await invoke('role-contribution',{action:'submit',round,finding_code:selected});await refresh()}catch(e){setErr(e.message)}finally{setBusy(false)}}
  const rows=Object.entries(ROLE_ARCHETYPES).map(([code,meta])=>{const hit=data?.rows?.find(x=>x.role_code===code);return{code,meta,hit}})
  return <div className="team-contribution"><div className="section-title" style={{marginTop:0}}><div><div className="eyebrow">HALLAZGO DE TU ROL</div><h3>Comparte una conclusión antes de decidir</h3></div><div className="contribution-count"><Users size={16}/><b>{data?.count||0}/5</b></div></div><p className="muted-copy">No da puntos y no es texto libre. Sirve para que cada especialidad deje una pieza concreta en la mesa.</p><div className="finding-options">{options.map(([code,label])=><label className={`finding-choice ${selected===code?'selected':''}`} key={code}><input type="radio" name={`finding-${role}-${round}`} checked={selected===code} onChange={()=>setSelected(code)}/><span>{label}</span></label>)}</div><button className="btn btn-primary" disabled={busy||!selected} onClick={submit}><Send size={15}/>{own?'Actualizar mi hallazgo':'Compartir con el equipo'}</button>{err&&<div className="notice notice-red">{err}</div>}<div className="team-findings-board">{rows.map(({code,meta,hit})=><div className={`team-finding-row ${hit?'done':''}`} key={code}><span className="role-dot" style={{'--role-accent':meta.accent}}>{meta.emoji}</span><div><b>{meta.label}</b><small>{hit?findingLabel(round,code,hit.finding_code):'Aún no ha compartido hallazgo'}</small></div>{hit&&<CheckCircle2 size={18}/>}</div>)}</div><div className={`notice ${(data?.count||0)>=5?'notice-green':'notice-gold'}`}>{(data?.count||0)>=5?'5/5 perspectivas compartidas. Ya tienen una base común para bloquear la decisión.':'No es obligatorio esperar 5/5 si alguien tiene un problema técnico, pero la meta pedagógica es escuchar las cinco perspectivas.'}</div></div>
}
